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
const MAX_BODY = 20 * 1024;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ contact: [], donation: [] }, null, 2));

function db() { try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); } catch (e) { return { contact: [], donation: [] }; } }
function saveDb(d) { fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2)); }

function send(res, code, body, headers) {
  res.writeHead(code, Object.assign({ "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" }, headers || {}));
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}
function isAuth(req) {
  const h = req.headers.authorization || "";
  const m = /^Basic (.+)$/.exec(h);
  if (!m) return false;
  const [u, p] = Buffer.from(m[1], "base64").toString("utf8").split(":");
  const a = crypto.timingSafeEqual(Buffer.from(u), Buffer.from(ADMIN_USER));
  const b = crypto.timingSafeEqual(Buffer.from(p), Buffer.from(ADMIN_PASSWORD));
  return a && b;
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
  const pathname = decodeURIComponent(url.pathname);

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
      if (!rec.name || !PHONE_RE.test(rec.phone) || rec.amount <= 0 || !rec.txn) return send(res, 400, { ok: false, error: "validation" });
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
      const kind = pathname.split("/").pop().replace(".csv", "");
      const items = db()[kind] || [];
      const cols = kind === "donation" ? ["ts", "name", "phone", "email", "amount", "method", "txn", "anonymous", "status"] : ["ts", "name", "phone", "email", "subject", "message", "status"];
      const esc2 = v => { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      const csv = [cols.join(",")].concat(items.map(it => cols.map(c => esc2(it[c])).join(","))).join("\r\n");
      return send(res, 200, "\uFEFF" + csv, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=" + kind + ".csv" });
    }

    /* ---------- static files ---------- */
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { ok: false, error: "method" });
    let rel = pathname === "/" ? "/index.html" : pathname;
    rel = rel.split("?")[0].replace(/\\/g, "/");
    let file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT)) return send(res, 403, { ok: false, error: "forbidden" });
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(ROOT, "index.html"); // client-side fallback
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600" });
    fs.createReadStream(file).pipe(res);
  } catch (err) {
    send(res, 500, { ok: false, error: "server" });
  }
});

server.listen(PORT, () => console.log("SPUS server running on http://localhost:" + PORT + "  (admin: " + ADMIN_USER + ")"));
