import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import babel from "@rolldown/plugin-babel";
import { compression } from "vite-plugin-compression2";

// Drops console.log/info/debug/trace statements in production builds while
// keeping console.error/warn — the Vite 8 equivalent of the old Next.js
// `compiler.removeConsole: { exclude: ["error", "warn"] }` setting.
// (Vite 8's oxc-based pipeline no longer supports `esbuild.drop`.)
function stripConsolePlugin(): Plugin {
  return {
    name: "strip-console",
    transform(code, id) {
      if (!/\.[jt]sx?$/.test(id) || id.includes("node_modules")) return null;
      if (!/^\s*console\.(log|info|debug|trace)\s*\(/m.test(code)) return null;
      const output = code
        .split("\n")
        .filter(
          (line) => !/^\s*console\.(log|info|debug|trace)\s*\(/.test(line),
        )
        .join("\n");
      return output === code ? null : { code: output, map: null };
    },
  };
}

// Vite replacement for next.config.ts.
// - `@/` alias mirrors the old tsconfig paths.
// - `/api` proxy mirrors the old nginx single-origin setup for local dev
//   (frontend :3000 -> backend :8000), so relative `/api/v1/...` calls work.
// - React Compiler via @rolldown/plugin-babel (mirrors the project template).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "");
  const apiTarget = env.VITE_DEV_API_PROXY_TARGET || "http://localhost:8000";
  const isProd = mode === "production";

  return {
    plugins: [
      react(),
      tailwindcss(),
      babel({
        exclude: [/node_modules/],
        presets: [
          ["@babel/preset-typescript", { isTSX: true, allExtensions: true }],
        ],
        plugins: [["babel-plugin-react-compiler", {}]],
      }),
      ...(isProd ? [stripConsolePlugin()] : []),
      // Pre-compress every emitted asset so nginx can serve .br / .gz
      // directly (see nginx.conf: brotli_static / gzip_static).
      // Brotli-11 is primary (smallest); gzip-9 stays as fallback.
      ...(isProd
        ? [
            compression({
              algorithms: ["brotliCompress", "gzip"],
              exclude: [/\.(br|gz)$/, /\.(png|jpe?g|webp|avif|gif|ico|woff2?)$/],
              threshold: 1024,
              deleteOriginalAssets: false,
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 3000,
      host: "0.0.0.0",
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      // Minify everything: oxc for JS, Lightning CSS for stylesheets.
      minify: "oxc",
      cssMinify: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1200,
      // Inline only tiny assets; everything else stays hashed + cached.
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          // Long-lived vendor chunks — app code changes don't bust these.
          // (Function form: Vite 8 / rolldown types no longer accept the
          // object form of manualChunks.)
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (
              id.includes("node_modules/react-router-dom") ||
              id.includes("node_modules/react-dom") ||
              id.includes("node_modules/react/") ||
              id.includes("node_modules/scheduler")
            )
              return "vendor-react";
            if (
              id.includes("node_modules/@tanstack/react-query") ||
              id.includes("node_modules/axios") ||
              id.includes("node_modules/zustand")
            )
              return "vendor-query";
            if (
              id.includes("node_modules/@base-ui") ||
              id.includes("node_modules/@radix-ui")
            )
              return "vendor-ui";
            if (id.includes("node_modules/recharts")) return "vendor-charts";
            if (
              id.includes("node_modules/react-hook-form") ||
              id.includes("node_modules/@hookform") ||
              id.includes("node_modules/zod") ||
              id.includes("node_modules/date-fns") ||
              id.includes("node_modules/react-day-picker")
            )
              return "vendor-forms";
            return undefined;
          },
        },
      },
    },
  };
});
