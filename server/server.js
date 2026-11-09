/* Optional production backend for Shantinagar Polli Unnayan Somiti.
   The static preview cannot run a server; this Node app (no dependencies)
   adds real server-side storage for contact + donation submissions when
   you host the site yourself (any Node host / VPS).

   Start:   node server/server.js      (from the project root)
   Env:     PORT=3000 ADMIN_PASSWORD=change-me  (see server/.env.example)
   Storage: server/data/db.json (auto-created)
   API:
     GET  /api/ping                 → {ok:true}
     POST /api/contact              → save contact message
     POST /api/donation             → save donation info (status: pending)
     GET  /api/contact | /api/donation          (admin, Basic auth)
     PATCH /api/contact/:id | /api/donation/:id (admin)
     DELETE /api/contact/:id | /api/donation/:id (admin)
     GET  /api/export/donations.csv | /api/export/contact.csv (admin)
   Static files are served from the project root; unknown paths fall back
   to index.html for client-side routing.
*/
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const PORT = parseInt(process.env.PORT || "3000", 10);
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "spus2026";
const MAX_BODY = 300 * 1024;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ contact: [], donation: [], playerReg: [] }, null, 2));

function db() { try { const d = JSON.parse(fs.readFileSync(DB_FILE, "utf8")); if (!d.playerReg) d.playerReg = []; return d; } catch (e) { return { contact: [], donation: [], playerReg: [] }; } }
function saveDb(d) { fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2)); }
function regToPlayerShape(r) {
  return {
    id: r.id, name_bn: r.name_bn || "", name_en: r.name_en || "", nickname: r.nickname || "",
    slug: String(r.name_en || r.name_bn || "player").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || r.id,
    jersey: parseInt(r.jersey, 10) || 0,
    position_code: r.position_code || "", position_bn: r.position_bn || "", position_en: r.position_en || "",
    dob: r.dob || "", height_cm: r.height_cm || "", weight_kg: r.weight_kg || "",
    foot: r.foot || "", birthplace: r.birthplace || "", image: r.photo || null,
    active: true, demo: false, bio_bn: r.bio_bn || "", stats: {},
    achievements_bn: String(r.achievements_bn || "").split("|").filter(Boolean)
  };
}

function send(res, code, body, headers) {
  res.writeHead(code, Object.assign({ "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" }, headers || {}));
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}
function isAuth(req) {
  const h = req.headers.authorization || "";
  const m = /^Basic (.+)$/.exec(h);
  if (!m) return false;
  const [u, p] = Buffer.from(m[1], "base64").toString("utf8").split(":");
  const ua = Buffer.from(u), pa = Buffer.from(p), ub = Buffer.from(ADMIN_USER), pb = Buffer.from(ADMIN_PASSWORD);
  if (ua.length !== ub.length || pa.length !== pb.length) return false;
  return crypto.timingSafeEqual(ua, ub) && crypto.timingSafeEqual(pa, pb);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const parts = [];
    req.on("data", c => { size += c.length; if (size > MAX_BODY) { reject(new Error("body too large")); req.destroy(); } else parts.push(c); });
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(parts).toString("utf8") || "{}")); } catch (e) { resolve({}); } });
    req.on("error", reject);
  });
}
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max || 300);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s-]{6,15}$/;

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".woff2": "font/woff2" };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://" + req.headers.host);
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch (e) { return send(res, 400, { ok: false, error: "bad request" }); }

  try {
    /* ---------- API ---------- */
    if (pathname === "/api/ping" && req.method === "GET") return send(res, 200, { ok: true });

    if (pathname === "/api/contact" && req.method === "POST") {
      const b = await readBody(req);
      const rec = {
        id: "s_" + crypto.randomBytes(6).toString("hex"), ts: Date.now(),
        name: clean(b.name, 80), phone: clean(b.phone, 20), email: clean(b.email, 120),
        subject: clean(b.subject, 150), message: clean(b.message, 3000), status: "new", lang: clean(b.lang, 5)
      };
      if (!rec.name || !PHONE_RE.test(rec.phone) || !EMAIL_RE.test(rec.email) || !rec.subject || !rec.message) return send(res, 400, { ok: false, error: "validation" });
      const d = db(); d.contact.push(rec); saveDb(d);
      return send(res, 200, { ok: true, id: rec.id });
    }
    if (pathname === "/api/donation" && req.method === "POST") {
      const b = await readBody(req);
      const rec = {
        id: "s_" + crypto.randomBytes(6).toString("hex"), ts: Date.now(),
        name: clean(b.name, 80), phone: clean(b.phone, 20), email: clean(b.email, 120),
        amount: parseFloat(b.amount) || 0, method: clean(b.method, 20), txn: clean(b.txn, 60),
        message: clean(b.message, 500), anonymous: !!b.anonymous, status: "pending", lang: clean(b.lang, 5)
      };
      if (!rec.name || !PHONE_RE.test(rec.phone) || rec.amount <= 0 || !rec.txn || (rec.email && !EMAIL_RE.test(rec.email))) return send(res, 400, { ok: false, error: "validation" });
      const d = db(); d.donation.push(rec); saveDb(d);
      return send(res, 200, { ok: true, id: rec.id });
    }

    const apiList = /^\/api\/(contact|donation)$/.exec(pathname);
    if (apiList && req.method === "GET") {
      const key = url.searchParams.get("key") || "";
      const a = Buffer.from(key), b = Buffer.from(ADMIN_PASSWORD);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return send(res, 401, { ok: false, error: "key required (?key=ADMIN_PASSWORD)" });
      return send(res, 200, { ok: true, items: db()[apiList[1]] });
    }
    const apiItem = /^\/api\/(contact|donation)\/([a-z0-9_]+)$/.exec(pathname);
    if (apiItem && (req.method === "PATCH" || req.method === "DELETE")) {
      const key = url.searchParams.get("key") || "";
      const a = Buffer.from(key), b = Buffer.from(ADMIN_PASSWORD);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return send(res, 401, { ok: false, error: "key required" });
      const d = db(); const list = d[apiItem[1]];
      const idx = list.findIndex(x => x.id === apiItem[2]);
      if (idx === -1) return send(res, 404, { ok: false, error: "not found" });
      if (req.method === "DELETE") list.splice(idx, 1);
      else {
        const b = await readBody(req);
        list[idx] = Object.assign(list[idx], { status: clean(b.status, 20) || list[idx].status });
      }
      saveDb(d);
      return send(res, 200, { ok: true });
    }
    if (pathname.startsWith("/api/export/") && req.method === "GET") {
      if (!isAuth(req)) return send(res, 401, { ok: false, error: "auth" });
      const kindRaw = pathname.split("/").pop().replace(".csv", "");
      const kind = kindRaw === "donations" ? "donation" : kindRaw;
      const items = db()[kind];
      if (!items) return send(res, 404, { ok: false, error: "unknown export" });
      const cols = kind === "donation" ? ["ts", "name", "phone", "email", "amount", "method", "txn", "anonymous", "status"] : ["ts", "name", "phone", "email", "subject", "message", "status"];
      const esc2 = v => { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      const csv = [cols.join(",")].concat(items.map(it => cols.map(c => esc2(it[c])).join(","))).join("\r\n");
      return send(res, 200, "\uFEFF" + csv, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=" + kind + ".csv" });
    }

    if (pathname === "/api/player-register" && req.method === "POST") {
      const b = await readBody(req);
      if (b.website) return send(res, 200, { ok: true, id: "spam" }); // honeypot
      const rec = {
        id: "reg_" + crypto.randomBytes(6).toString("hex"), ts: Date.now(),
        name_bn: clean(b.name_bn, 80), name_en: clean(b.name_en, 80),
        nickname: clean(b.nickname, 40), jersey: parseInt(b.jersey, 10) || "",
        sport: clean(b.sport, 24), position_code: clean(b.position_code, 10),
        position_bn: clean(b.position_bn, 40), position_en: clean(b.position_en, 40),
        dob: clean(b.dob, 10), height_cm: b.height_cm === "" || b.height_cm == null ? "" : parseFloat(b.height_cm) || "",
        weight_kg: b.weight_kg === "" || b.weight_kg == null ? "" : parseFloat(b.weight_kg) || "",
        foot: clean(b.foot, 8), birthplace: clean(b.birthplace, 80),
        phone: clean(b.phone, 20), bio_bn: clean(b.bio_bn, 900), bio_en: clean(b.bio_en, 900),
        achievements_bn: clean(b.achievements_bn, 500),
        photo: typeof b.photo === "string" && b.photo.startsWith("data:image") && b.photo.length < 220000 ? b.photo : "",
        password: String(b.password || "").slice(0, 64),
        status: "pending", lang: clean(b.lang, 5)
      };
      if ((!rec.name_bn && !rec.name_en) || !rec.sport) return send(res, 400, { ok: false, error: "validation" });
      const d = db(); d.playerReg.push(rec); saveDb(d);
      return send(res, 200, { ok: true, id: rec.id });
    }
    if (pathname === "/api/player-register" && req.method === "GET") {
      const key = url.searchParams.get("key") || "";
      const a = Buffer.from(key), b = Buffer.from(ADMIN_PASSWORD);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return send(res, 401, { ok: false, error: "key required (?key=***)" });
      return send(res, 200, { ok: true, items: db().playerReg });
    }
    const apiRegItem = /^\/api\/player-register\/([a-z0-9_]+)$/.exec(pathname);
    if (apiRegItem && (req.method === "PATCH" || req.method === "DELETE")) {
      const key = url.searchParams.get("key") || "";
      const a = Buffer.from(key), b = Buffer.from(ADMIN_PASSWORD);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return send(res, 401, { ok: false, error: "key required" });
      const d = db(); const list = d.playerReg;
      const idx = list.findIndex(x => x.id === apiRegItem[1]);
      if (idx === -1) return send(res, 404, { ok: false, error: "not found" });
      if (req.method === "DELETE") list.splice(idx, 1);
      else {
        const pb = await readBody(req);
        const allowed = ["status", "name_bn", "name_en", "nickname", "jersey", "sport", "position_code", "position_bn", "position_en", "dob", "height_cm", "weight_kg", "foot", "birthplace", "phone", "bio_bn", "bio_en", "achievements_bn", "photo"];
        allowed.forEach(k => { if (pb[k] !== undefined) list[idx][k] = typeof pb[k] === "string" ? clean(pb[k], 900) : pb[k]; });
        if (typeof pb.photo === "string" && pb.photo.startsWith("data:image") && pb.photo.length < 220000) list[idx].photo = pb.photo;
      }
      saveDb(d);
      return send(res, 200, { ok: true });
    }

    if (pathname === "/api/players-approved" && req.method === "GET") {
      const key = url.searchParams.get("key") || "";
      const a = Buffer.from(key), b = Buffer.from(ADMIN_PASSWORD);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return send(res, 401, { ok: false, error: "key" });
      const d = db();
      return send(res, 200, { ok: true, items: (d.playerReg || []).filter(x => x.status === "approved").map(regToPlayerShape) });
    }
    if (pathname === "/api/player-login" && req.method === "POST") {
      const b = await readBody(req);
      const sha = String(b.password || "");
      const rec = (db().playerReg || []).find(x => x.status === "approved" && x.phone === clean(b.phone, 20) && x.password === sha);
      if (!rec) return send(res, 401, { ok: false, error: "login" });
      const safe = Object.assign({}, rec); delete safe.password;
      return send(res, 200, { ok: true, player: safe });
    }
    if (pathname === "/api/player-to-site" && req.method === "POST") {
      const b = await readBody(req);
      const key = clean(b.key, 80);
      const a = Buffer.from(key), bb = Buffer.from(ADMIN_PASSWORD);
      if (a.length !== bb.length || !crypto.timingSafeEqual(a, bb)) return send(res, 401, { ok: false, error: "key" });
      const p = b.player || {};
      if (!p.name_en && !p.name_bn) return send(res, 400, { ok: false, error: "validation" });
      const dataPath = path.join(ROOT, "assets", "js", "data.js");
      let src = fs.readFileSync(dataPath, "utf8");
      const slug = String(p.slug || ("approved-" + Date.now().toString(36)));
      const id = "np" + Date.now().toString(36);
      const q = v => String(v == null ? "" : v).replace(/\\/g, "\\").replace(/"/g, '\"').replace(/[\r\n]+/g, " ");
      const jnum = v => (v === "" || v == null) ? '""' : JSON.stringify(v);
      const block = '    { id: "' + id + '", slug: "' + q(slug) + '", name_bn: "' + q(p.name_bn) + '", name_en: "' + q(p.name_en) + '", jersey: ' + (parseInt(p.jersey, 10) || 0) + ', position_bn: "' + q(p.position_bn) + '", position_en: "' + q(p.position_en) + '", position_code: "' + q(p.position_code) + '", team_id: null, sport_id: null, tournament_id: null, dob: "' + q(p.dob) + '", height_cm: ' + jnum(p.height_cm) + ', weight_kg: ' + jnum(p.weight_kg) + ', foot: "' + q(p.foot) + '", birthplace: "' + q(p.birthplace) + '", active: true, image: null, demo: false,\n      bio_bn: "' + q(p.bio_bn) + '", bio_en: "", stats: {}, achievements_bn: [], achievements_en: [] },\n';
      if (src.includes('slug: "' + q(slug) + '"')) return send(res, 200, { ok: true, duplicate: true });
      const fi = src.indexOf("  fixtures: [");
      if (fi === -1) return send(res, 500, { ok: false, error: "data.js marker missing" });
      const before = src.slice(0, fi);
      const li = before.lastIndexOf("],");
      if (li === -1) return send(res, 500, { ok: false, error: "players close missing" });
      const head = before.slice(0, li);
      const needComma = /}\s*$/.test(head);
      src = head + (needComma ? "," : "") + "\n" + block + before.slice(li) + src.slice(fi);
      fs.writeFileSync(dataPath, src, "utf8");
      return send(res, 200, { ok: true, id });
    }

    /* ---------- static files ---------- */
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { ok: false, error: "method" });
    let rel = pathname === "/" ? "/index.html" : pathname;
    rel = rel.split("?")[0].replace(/\\/g, "/");
    let file = path.normalize(path.join(ROOT, rel));
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 403, { ok: false, error: "forbidden" });
    const segs = rel.split("/").filter(Boolean);
    if (segs.some(sg => sg.startsWith(".")) || (segs[0] === "server" && segs[1] === "data")) return send(res, 404, { ok: false, error: "not found" });
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(ROOT, "index.html"); // client-side fallback
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600" });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  } catch (err) {
    send(res, 500, { ok: false, error: "server" });
  }
});

server.listen(PORT, () => console.log("SPUS server running on http://localhost:" + PORT + "  (admin: " + ADMIN_USER + ")"));
