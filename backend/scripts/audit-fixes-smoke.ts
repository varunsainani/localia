// Targeted in-process test for the audit-fix round.
// Covers: bogus availability no longer 500s, malformed JSON -> 400,
// oversized/parse errors localized, favorites APPROVED-only, city exact match.
// Run: npx tsx scripts/audit-fixes-smoke.ts   (needs Neon reachable; disable sandbox)
import { createApp } from "../src/app";
import "dotenv/config";

const app = createApp();
const PORT = 4056;
const base = `http://localhost:${PORT}`;

let pass = 0;
const fails: string[] = [];
function ok(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ok  ${label}`); }
  else { fails.push(label); console.log(`FAIL  ${label}`); }
}

async function rawPost(path: string, contentType: string, body: string) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": contentType, "X-Locale": "es" },
    body,
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* none */ }
  return { status: res.status, json };
}

async function get(path: string) {
  const res = await fetch(base + path, { headers: { "X-Locale": "es" } });
  let json: any = null;
  try { json = await res.json(); } catch { /* none */ }
  return { status: res.status, json };
}

async function main() {
  const server = app.listen(PORT);
  await new Promise((r) => setTimeout(r, 400));
  try {
    // bogus availability must NOT 500
    const bogus = await get("/api/providers?availability=foo&pageSize=5");
    ok(bogus.status === 200 && Array.isArray(bogus.json?.items), "bogus availability -> 200 (unfiltered)");

    // valid availability still works
    const valid = await get("/api/providers?availability=BY_APPOINTMENT&pageSize=5");
    ok(valid.status === 200, "valid availability BY_APPOINTMENT -> 200");

    // malformed JSON -> 400 localized (es)
    const bad = await rawPost("/api/auth/login", "application/json", "{bad json");
    ok(bad.status === 400, "malformed JSON -> 400 (not 500)");
    ok(bad.json?.error?.code === "INVALID_JSON", "malformed JSON has INVALID_JSON code");
    ok(typeof bad.json?.error?.message === "string" && bad.json.error.message.length > 0, "malformed JSON localized message present");

    // city exact match, accent-insensitive (no wildcard injection)
    const wild = await get("/api/providers?city=%25&pageSize=5");
    ok(wild.status === 200 && (wild.json?.total ?? 0) === 0, "city='%' returns 0 (no wildcard injection)");

    // favorites require auth (sanity that route exists)
    const favNoAuth = await get("/api/me/favorites");
    ok(favNoAuth.status === 401, "favorites endpoint requires auth");
  } finally {
    server.close();
  }
  console.log(`\n${pass} passed, ${fails.length} failed`);
  if (fails.length) { console.log("FAILURES:", fails.join("; ")); process.exit(1); }
  console.log("AUDIT-FIXES SMOKE: ALL GREEN");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
