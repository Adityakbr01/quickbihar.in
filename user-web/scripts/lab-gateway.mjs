/**
 * Lab-only audit gateway for QuickBihar user-web.
 *
 * Reproduces production's same-origin topology on localhost so Lighthouse
 * measures prod-like conditions:
 *   - Serves dist/ statically (SPA fallback: <route>/index.html, else /index.html).
 *   - Reverse-proxies /api/* and /socket.io/* (incl. websocket upgrade) to the
 *     LAN API, so the page makes ZERO cross-origin / http:// requests.
 *
 * Why not `vite preview` + proxy? Vite 8 serves its SPA fallback BEFORE
 * plugin middlewares run (verified: a logging middleware only ever sees
 * /index.html) and its `preview.proxy` option is silently inert in this
 * setup — /api still returned index.html. This gateway has no such ordering
 * problem. Production is untouched (this file is never imported by the app).
 *
 * Usage:
 *   node scripts/lab-gateway.mjs --port=4176 --api=http://10.55.38.27:8000
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createProxyMiddleware } from "http-proxy-middleware";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(=(.*))?$/);
    return m ? [m[1], m[3] ?? "true"] : [a, "true"];
  }),
);

const PORT = Number(args.port ?? 4176);
const API = args.api ?? "http://10.55.38.27:8000";
const DIST = path.resolve(process.cwd(), "dist");

const MIME = {
  ".html": "text/html;charset=utf-8",
  ".js": "text/javascript;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain;charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const rel = clean.replace(/^\/+/, "");
  const direct = path.join(DIST, rel);
  try {
    if (rel && fs.statSync(direct).isFile()) return direct;
  } catch {}
  // Prerendered route dir → its index.html, else SPA shell.
  const nested = path.join(DIST, rel, "index.html");
  try {
    if (rel && fs.statSync(nested).isFile()) return nested;
  } catch {}
  return path.join(DIST, "index.html");
}

const apiProxy = createProxyMiddleware({ target: API, changeOrigin: true, logLevel: "warn" });
const wsProxy = createProxyMiddleware({ target: API, changeOrigin: true, ws: true, logLevel: "warn" });

const server = http.createServer((req, res) => {
  const url = req.url || "/";
  if (url.startsWith("/api/") || url === "/api") {
    apiProxy(req, res, () => {
      res.writeHead(502, { "content-type": "text/plain" });
      res.end("lab gateway: api proxy miss");
    });
    return;
  }
  if (url.startsWith("/socket.io")) {
    wsProxy(req, res, () => {
      res.writeHead(502, { "content-type": "text/plain" });
      res.end("lab gateway: socket proxy miss");
    });
    return;
  }
  const file = resolveFile(url);
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
});

server.on("upgrade", (req, socket, head) => {
  wsProxy.upgrade(req, socket, head);
});

server.listen(PORT, () => {
  console.log(`[lab-gateway] dist=${DIST} api=${API} → http://localhost:${PORT}/clothing/home`);
});
