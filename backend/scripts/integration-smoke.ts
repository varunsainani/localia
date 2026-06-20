// Focused in-process integration test for the post-build integration fixes.
// Boots the Express app on an ephemeral port and exercises: admin categories list,
// flat category CRUD, suspend round-trip (+ public-search exclusion), unaccented search.
// Run: npx tsx scripts/integration-smoke.ts   (needs Neon reachable; disable sandbox)
import { createApp } from "../src/app";
import "dotenv/config";

const app = createApp();
const PORT = 4055;
const base = `http://localhost:${PORT}`;

let pass = 0;
const fails: string[] = [];
function ok(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ok  ${label}`); }
  else { fails.push(label); console.log(`FAIL  ${label}`); }
}

async function req(method: string, path: string, token?: string, body?: unknown) {
  const headers: Record<string, string> = { "Content-Type": "application/json", "X-Locale": "es" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json: any = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json };
}

async function main() {
  const server = app.listen(PORT);
  await new Promise((r) => setTimeout(r, 400));

  let suspendedId: string | null = null;
  let createdCatId: string | null = null;
  try {
    // login admin
    const login = await req("POST", "/api/auth/login", undefined, { email: "admin@localia.app", password: "demo1234" });
    ok(login.status === 200 && !!login.json?.accessToken, "admin login");
    const adminTok = login.json.accessToken;

    // GET /api/admin/categories -> raw i18n names
    const cats = await req("GET", "/api/admin/categories", adminTok);
    const c0 = cats.json?.categories?.[0];
    ok(cats.status === 200 && Array.isArray(cats.json?.categories), "admin categories list");
    ok(!!c0 && "nameEn" in c0 && "nameEs" in c0 && "namePt" in c0 && "providerCount" in c0, "admin category has nameEn/Es/Pt + count");

    // create (flat fields) -> update -> delete
    const slug = "smoke-test-cat";
    const create = await req("POST", "/api/admin/categories", adminTok, { slug, icon: "wrench", nameEn: "Smoke EN", nameEs: "Humo ES", namePt: "Fumaca PT" });
    ok(create.status === 201 && !!create.json?.category?.id, "create category (flat)");
    createdCatId = create.json?.category?.id ?? null;
    if (createdCatId) {
      const upd = await req("PUT", `/api/admin/categories/${createdCatId}`, adminTok, { slug, icon: "hammer", nameEn: "Smoke EN2", nameEs: "Humo ES2", namePt: "Fumaca PT2" });
      ok(upd.status === 200 && upd.json?.category?.name === "Humo ES2", "update category returns localized name (es)");
      const del = await req("DELETE", `/api/admin/categories/${createdCatId}`, adminTok);
      ok(del.status === 200 && del.json?.ok === true, "delete category");
      createdCatId = null;
    }

    // suspend round-trip + public exclusion
    const approved = await req("GET", "/api/admin/providers?status=APPROVED&pageSize=1", adminTok);
    const prov = approved.json?.items?.[0];
    ok(!!prov?.id && !!prov?.slug, "got an approved provider");
    if (prov) {
      const before = await req("GET", `/api/providers?pageSize=100`);
      const presentBefore = (before.json?.items ?? []).some((p: any) => p.slug === prov.slug);
      ok(presentBefore, "provider visible in public search before suspend");

      const susp = await req("PATCH", `/api/admin/providers/${prov.id}`, adminTok, { status: "SUSPENDED" });
      ok(susp.status === 200 && susp.json?.provider?.status === "SUSPENDED", "PATCH status=SUSPENDED accepted");
      suspendedId = prov.id;

      const during = await req("GET", `/api/providers?pageSize=100`);
      const presentDuring = (during.json?.items ?? []).some((p: any) => p.slug === prov.slug);
      ok(!presentDuring, "suspended provider excluded from public search");

      const reinstate = await req("PATCH", `/api/admin/providers/${prov.id}`, adminTok, { status: "APPROVED" });
      ok(reinstate.status === 200 && reinstate.json?.provider?.status === "APPROVED", "reinstate to APPROVED");
      suspendedId = null;

      const after = await req("GET", `/api/providers?pageSize=100`);
      const presentAfter = (after.json?.items ?? []).some((p: any) => p.slug === prov.slug);
      ok(presentAfter, "provider visible again after reinstate");
    }

    // unaccented full-text search
    const search = await req("GET", "/api/providers?q=psicologia&pageSize=20");
    ok(search.status === 200 && (search.json?.total ?? 0) >= 1, "unaccented FTS 'psicologia' returns results");
  } finally {
    // best-effort cleanup so demo state is preserved
    if (suspendedId || createdCatId) {
      const login = await req("POST", "/api/auth/login", undefined, { email: "admin@localia.app", password: "demo1234" });
      const tok = login.json?.accessToken;
      if (tok && suspendedId) await req("PATCH", `/api/admin/providers/${suspendedId}`, tok, { status: "APPROVED" });
      if (tok && createdCatId) await req("DELETE", `/api/admin/categories/${createdCatId}`, tok);
    }
    server.close();
  }

  console.log(`\n${pass} passed, ${fails.length} failed`);
  if (fails.length) { console.log("FAILURES:", fails.join("; ")); process.exit(1); }
  console.log("INTEGRATION SMOKE: ALL GREEN");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
