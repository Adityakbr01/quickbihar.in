#!/usr/bin/env node
/**
 * sync-dev-ip.mjs — keep dev API URLs pointed at this machine's current LAN IP.
 *
 * Problem: DHCP changes the PC's LAN IP every Wi-Fi hop, and every frontend
 * hardcodes the old IP in its .env (user-web VITE_API_ORIGIN, dash-web
 * VITE_API_URL / VITE_SOCKET_URL, mobile EXPO_PUBLIC_API_ORIGIN). Dev then
 * silently breaks until someone re-checks `ipconfig` and edits three files.
 *
 * This script detects the current LAN IPv4 (skipping WSL/Hyper-V/VirtualBox
 * virtual adapters) and rewrites only the ACTIVE (uncommented) lines — every
 * other line in each .env is preserved byte-for-byte.
 *
 * Run it standalone (`node scripts/sync-dev-ip.mjs`) or via `npm/bun run dev`
 * in user-web / dash-web, where it's chained before `vite`. Vite also watches
 * .env files, so a standalone run restarts any already-running dev server.
 *
 * Flags:
 *   --ip=1.2.3.4    force a specific IP instead of auto-detecting
 *   --port=9000     force the API port (default: PORT from server/.env, else 8000)
 *
 * Exit codes: 0 = synced (or already up to date), 1 = no usable LAN IP found.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ── CLI flags ────────────────────────────────────────────────────────────────
const args = new Map(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const i = a.indexOf("=");
      return i === -1 ? [a.slice(2), "true"] : [a.slice(2, i), a.slice(i + 1)];
    }),
);

// ── API port: server/.env PORT → --port flag → 8000 ──────────────────────────
function detectPort() {
  if (args.has("port")) return args.get("port");
  try {
    const m = readFileSync(path.join(ROOT, "server/.env"), "utf8").match(
      /^PORT=(\d+)\s*$/m,
    );
    if (m) return m[1];
  } catch {
    /* server/.env missing — fall through to default */
  }
  return "8000";
}

// ── LAN IP detection ─────────────────────────────────────────────────────────
// Virtual adapters (WSL vEthernet, Hyper-V, Docker, VMware, VirtualBox) get
// skipped by name so we never sync 172.21.112.1 (WSL) instead of the real
// Wi-Fi IP. Preference order: 10.x → 192.168.x → 172.16–31.x.
const VIRTUAL_ADAPTER_RE =
  /(vethernet|wsl|hyper-v|docker|vmware|virtualbox|loopback|bluetooth|vpn|tailscale|zerotier)/i;

function detectLanIp() {
  const candidates = [];
  for (const [name, addrs] of Object.entries(networkInterfaces())) {
    if (VIRTUAL_ADAPTER_RE.test(name)) continue;
    for (const addr of addrs ?? []) {
      if (addr.internal || addr.family !== "IPv4") continue;
      const ip = addr.address;
      if (/^10\./.test(ip)) candidates.push({ ip, rank: 0, name });
      else if (/^192\.168\./.test(ip)) candidates.push({ ip, rank: 1, name });
      else if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip))
        candidates.push({ ip, rank: 2, name });
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.rank - b.rank);
  return candidates[0];
}

const forcedIp = args.get("ip");
const detected = forcedIp ? { ip: forcedIp, name: "forced via --ip" } : detectLanIp();

if (!detected) {
  console.error(
    "sync-dev-ip: no LAN IPv4 found (skipping virtual adapters). " +
      "Connect to Wi-Fi/Ethernet or force one with --ip=<address>.",
  );
  process.exit(1);
}

const PORT = detectPort();
const ORIGIN = `http://${detected.ip}:${PORT}`;

// ── .env rewriting ───────────────────────────────────────────────────────────
// Replaces the first ACTIVE `KEY=...` line (commented `# KEY=...` lines are
// left untouched) or appends the key when no active line exists.
function setEnvValue(content, key, value) {
  const re = new RegExp(`^(\\s*)${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, `${key}=${value}`);
  const prefix = content.endsWith("\n") || content === "" ? "" : "\n";
  return `${content}${prefix}${key}=${value}\n`;
}

const TARGETS = [
  {
    file: "user-web/.env",
    vars: { VITE_API_ORIGIN: ORIGIN },
    hint: "axios (axiosInstance.ts) + socket.io base origin",
  },
  {
    file: "dash-web/.env",
    vars: {
      VITE_API_URL: `${ORIGIN}/api/v1`,
      VITE_SOCKET_URL: ORIGIN,
    },
    hint: "axios (lib/axios.ts) + socket.io (lib/socket.ts)",
  },
  {
    file: "mobile/.env",
    vars: { EXPO_PUBLIC_API_ORIGIN: ORIGIN },
    hint: "Expo Go / dev-client API origin",
  },
];

let changedFiles = 0;
for (const { file, vars } of TARGETS) {
  const full = path.join(ROOT, file);
  if (!existsSync(full)) {
    console.log(`  skip  ${file} (not found)`);
    continue;
  }
  const before = readFileSync(full, "utf8");
  let after = before;
  for (const [key, value] of Object.entries(vars)) {
    after = setEnvValue(after, key, value);
  }
  if (after === before) {
    console.log(`  ok    ${file} already → ${ORIGIN}`);
    continue;
  }
  writeFileSync(full, after);
  changedFiles += 1;
  for (const [key, value] of Object.entries(vars)) {
    console.log(`  fix   ${file}: ${key}=${value}`);
  }
}

console.log(
  `\nsync-dev-ip: LAN IP ${detected.ip} (${detected.name}) → API at ${ORIGIN}` +
    (changedFiles ? "" : " — everything already up to date"),
);
