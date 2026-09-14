// ponytail: one runnable check for safeFetchJson retries. Spins a local
// server that 502s twice then succeeds — proves a transient mid-build
// blip no longer fails the Docker build. Run: bun scripts/check-fetch-retry.ts
/// <reference types="node" />
declare const Bun: any; // bun-only check script, never bundled
import { safeFetchJson } from "../src/lib/fetchUtils";

let fail = 0;
const t = (ok: boolean, name: string) => {
  console.log(ok ? "PASS" : "FAIL", "-", name);
  if (!ok) fail++;
};

let hits = 0;
const server = Bun.serve({
  port: 0,
  fetch() {
    hits++;
    if (hits <= 2) return new Response("bad gateway", { status: 502 });
    return Response.json({ ok: true });
  },
});
const base = `http://127.0.0.1:${server.port}`;

const recovered = await safeFetchJson<any>(`${base}/flaky`, { retries: 3 });
t(recovered?.ok === true && hits === 3, `recovers after 2x502 (attempts: ${hits})`);

hits = 0;
const dead = await safeFetchJson<any>(`${base}/flaky`, { retries: 0 });
t(dead === null, "no-retry default still returns null on first failure");

const alwaysFail = await safeFetchJson<any>(`http://127.0.0.1:1/closed`, { retries: 2, timeoutMs: 500 });
t(alwaysFail === null, "gives up after retries exhausted");

server.stop();
process.exit(fail ? 1 : 0);
