/* Data store: base demo dataset + browser-local overlay (admin edits), submissions log, auth.
   If the optional Node server (server/) is running on the same origin, /api/ping switches
   submissions to server-side storage automatically. */
(function () {
  const OVERLAY = "spus_overlay_";
  const SUBS = "spus_submissions";
  const SETTINGS = "spus_settings";
  const IMPORTED = "spus_imported";
  const AUTH = "spus_auth";
  const LANG = "spus_lang";
  const ENTITIES = ["news", "events", "notices", "years", "sports", "tournaments", "teams", "players", "fixtures", "results", "standings", "committee", "gallery", "timeline", "donation_methods", "stats", "site", "about", "reports"];

  function jget(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn("storage full", e); } }
  function uid(p) { return (p || "x") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  const roleSections = {
    super: ["dashboard", "news", "events", "notices", "years", "sports", "tournaments", "teams", "players", "fixtures", "results", "standings", "committee", "gallery", "donations", "submissions", "settings"],
    editor: ["dashboard", "news", "events", "notices", "gallery", "submissions"],
    sports: ["dashboard", "sports", "tournaments", "teams", "players", "fixtures", "results", "standings"],
    donation: ["dashboard", "donations"]
  };

  const Store = {
    serverMode: false,
    /* ---------- language ---------- */
    lang() { return localStorage.getItem(LANG) || "bn"; },
    setLang(l) { localStorage.setItem(LANG, l); },
    /* ---------- published content file (content.json committed to the repo) ---------- */
    contentLayer: null,
    effBase(entity) {
      const il = this.importedLayer();
      if (il && Array.isArray(il.entities && il.entities[entity])) return il.entities[entity].slice();
      if (this.contentLayer && Array.isArray(this.contentLayer.entities && this.contentLayer.entities[entity])) return this.contentLayer.entities[entity].slice();
      return (window.SPUS_DATA[entity] || []).slice();
    },
    importedLayer() { return jget(IMPORTED, null); },
    _loadContentFile() {
      this.contentLayer = null;
      try {
        Promise.race([
          fetch("content.json", { cache: "no-cache" }),
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 2500))
        ]).then(r => (r && r.ok ? r.json() : null)).then(c => {
          if (c && c.kind === "spus-content") { this.contentLayer = c; window.dispatchEvent(new Event("spus-content-loaded")); }
        }).catch(() => {});
      } catch (e) { /* ignore */ }
    },
    ready() {
      if (!this._readyP) this._readyP = Promise.race([
        new Promise(res => window.addEventListener("spus-content-loaded", res, { once: true })),
        new Promise(res => setTimeout(res, 4000))
      ]);
      return this._readyP;
    },
    /* Snapshot of all publishable content (what admin exports as content.json) */
    contentSnapshot() {
      const ents = ["news", "events", "notices", "sports", "tournaments", "teams", "players", "fixtures", "results", "standings", "committee", "gallery", "timeline", "reports"];
      const entities = {};
      ents.forEach(e => { entities[e] = this.list(e); });
      return { kind: "spus-content", version: 2, at: new Date().toISOString(), entities: entities, settings: this.settings() };
    },
    importContentJson(bundle) {
      if (!bundle || !bundle.entities || typeof bundle.entities !== "object") throw new Error("bad content bundle");
      jset(IMPORTED, { kind: "spus-content", version: bundle.version || 2, at: bundle.at || new Date().toISOString(), entities: bundle.entities, settings: bundle.settings || {} });
    },
    /* ---------- overlay CRUD ---------- */
    ov(entity) { return jget(OVERLAY + entity, { added: [], changed: {}, deleted: [] }); },
    saveOv(entity, ov) { jset(OVERLAY + entity, ov); },
    list(entity) {
      const ov = this.ov(entity);
      const base = this.effBase(entity);
      const out = [];
      base.forEach(r => { if (ov.deleted.indexOf(r.id) === -1) out.push(ov.changed[r.id] || r); });
      ov.added.forEach(r => { if (ov.deleted.indexOf(r.id) === -1) out.push(ov.changed[r.id] || r); });
      return out;
    },
    get(entity, id) { return this.list(entity).find(r => r.id === id) || null; },
    add(entity, rec) { const ov = this.ov(entity); if (!rec.id) rec.id = uid(entity); ov.added.push(rec); this.saveOv(entity, ov); return rec; },
    put(entity, id, patch) {
      const ov = this.ov(entity);
      const cur = this.get(entity, id); if (!cur) return null;
      const next = Object.assign({}, cur, patch); next.id = id;
      if (ov.added.some(r => r.id === id)) { ov.added = ov.added.map(r => (r.id === id ? next : r)); }
      else ov.changed[id] = next;
      this.saveOv(entity, ov); return next;
    },
    del(entity, id) { const ov = this.ov(entity); ov.deleted.push(id); this.saveOv(entity, ov); },
    /* ---------- site settings / stats / donation methods / about (object-style overrides) ---------- */
    settings() { const cs = (this.contentLayer && this.contentLayer.settings) || {}; const il = this.importedLayer(); const cis = (il && il.settings) || {}; return Object.assign({}, cs, cis, jget(SETTINGS, {})); },
    saveSettings(patch) { const s = this.settings(); Object.keys(patch).forEach(k => { s[k] = patch[k]; }); jset(SETTINGS, s); },
    site() {
      const o = this.settings();
      const site = Object.assign({}, window.SPUS_DATA.site);
      if (o.site) Object.assign(site, o.site);
      if (o.site && o.site.contact) site.contact = Object.assign({}, window.SPUS_DATA.site.contact, o.site.contact);
      return site;
    },
    stats() { return Object.assign({}, window.SPUS_DATA.stats, this.settings().stats || {}); },
    years() {
      const base = (window.SPUS_DATA.years || []).slice();
      const o = this.settings().years;
      if (Array.isArray(o)) return o.slice().sort((a, b) => b - a);
      return base.sort((a, b) => b - a);
    },
    donation() {
      const base = window.SPUS_DATA.donation;
      const o = this.settings().donation;
      if (!o) return base;
      const out = Object.assign({}, base);
      out.headline_bn = o.headline_bn || base.headline_bn; out.headline_en = o.headline_en || base.headline_en;
      out.methods = (o.methods || base.methods).slice();
      return out;
    },
    about() { const o = this.settings().about; return o ? Object.assign({}, window.SPUS_DATA.about, o) : window.SPUS_DATA.about; },
    timeline() { return this.list("timeline"); },
    reports() { return this.list("reports"); },
    /* ---------- submissions ---------- */
    subs(type) {
      const all = jget(SUBS, { contact: [], donation: [] });
      return (all[type] || []).slice().sort((a, b) => b.ts - a.ts);
    },
    /* Server-mode listing (used by admin); falls back to local mirror. */
    async fetchSubs(type) {
      if (this.serverMode) {
        try {
          const key = localStorage.getItem("spus_api_key") || "";
          const rq = ["/api/", type, "?", "key", "="].join("");
          const r = await Promise.race([fetch(rq + encodeURIComponent(key)), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000))]);
          if (r.ok) { const d = await r.json(); if (d.ok) return (d.items || []).slice().sort((a, b) => b.ts - a.ts); }
        } catch (e) { /* fall through to local */ }
      }
      return this.subs(type);
    },
    addSub(type, rec) {
      rec.ts = Date.now(); rec.id = uid("s");
      this._localSub(type, rec); /* local mirror: keeps the log visible offline & in this browser */
      if (this.serverMode) { return fetch("/api/" + type, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rec) }).then(r => r.json()).catch(() => rec); }
      return Promise.resolve(rec);
    },
    _localSub(type, rec) { const all = jget(SUBS, { contact: [], donation: [] }); all[type].push(rec); jset(SUBS, all); return rec; },
    putSub(type, id, patch) {
      if (this.serverMode) { fetch(["/api/", type, "/", id, "?", "key", "="].join("") + encodeURIComponent(localStorage.getItem("spus_api_key") || ""), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }); }
      const all = jget(SUBS, { contact: [], donation: [] });
      all[type] = (all[type] || []).map(r => (r.id === id ? Object.assign({}, r, patch) : r));
      jset(SUBS, all);
    },
    delSub(type, id) {
      if (this.serverMode) { fetch(["/api/", type, "/", id, "?", "key", "="].join("") + encodeURIComponent(localStorage.getItem("spus_api_key") || ""), { method: "DELETE" }); }
      const all = jget(SUBS, { contact: [], donation: [] });
      all[type] = (all[type] || []).filter(r => r.id !== id);
      jset(SUBS, all);
    },
    /* ---------- auth (demo-grade for static preview; server/ provides real auth) ---------- */
    async login(user, pass) {
      const stored = jget(AUTH, null);
      if (stored) {
        const h = await this._sha(pass);
        if (user === stored.user && h === stored.hash) { this._session(stored.role || "super"); return true; }
        return false;
      }
      if (user === "admin" && pass === "spus2026") { this._session("super"); return true; }
      return false;
    },
    _session(role) { sessionStorage.setItem("spus_session", JSON.stringify({ user: "admin", role: role, at: Date.now() })); },
    async changePassword(newPass) {
      const stored = jget(AUTH, { user: "admin", hash: null, role: "super" });
      stored.hash = await this._sha(newPass);
      jset(AUTH, stored);
    },
    current() { try { return JSON.parse(sessionStorage.getItem("spus_session")); } catch (e) { return null; } },
    logout() { sessionStorage.removeItem("spus_session"); },
    can(section) { const c = this.current(); if (!c) return false; const list = roleSections[c.role] || []; return list.indexOf(section) !== -1; },
    _sha(txt) {
      if (!(window.crypto && crypto.subtle)) return Promise.resolve("n/a");
      const data = new TextEncoder().encode(txt);
      return crypto.subtle.digest("SHA-256", data).then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, "0")).join(""));
    },
    /* ---------- data portability ---------- */
    exportAll() {
      const bundle = { meta: { kind: "spus-data", version: 1, at: new Date().toISOString() }, overlays: {}, settings: this.settings(), submissions: jget(SUBS, { contact: [], donation: [] }) };
      ENTITIES.forEach(e => { const ov = this.ov(e); if (ov.added.length || Object.keys(ov.changed).length || ov.deleted.length) bundle.overlays[e] = ov; });
      return bundle;
    },
    importAll(bundle) {
      if (!bundle || bundle.meta.kind !== "spus-data") throw new Error("bad bundle");
      ENTITIES.forEach(e => { if (bundle.overlays[e]) this.saveOv(e, bundle.overlays[e]); });
      if (bundle.settings) jset(SETTINGS, bundle.settings);
      if (bundle.submissions) jset(SUBS, bundle.submissions);
    },
    resetDemo() {
      ENTITIES.forEach(e => localStorage.removeItem(OVERLAY + e));
      localStorage.removeItem(SETTINGS); localStorage.removeItem(SUBS); localStorage.removeItem(IMPORTED);
    },
    /* ---------- server detection ---------- */
    init() {
      this.contentLayer = null;
      this._loadContentFile();
      try {
        fetch("/api/ping").then(r => r.json()).then(d => { if (d && d.ok) this.serverMode = true; }).catch(() => {});
      } catch (e) { /* ignore */ }
    }
  };
  window.SPUS_STORE = Store;
  Store.init();
})();
