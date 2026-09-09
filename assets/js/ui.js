/* Shared UI kit: i18n helpers, generated SVG imagery, header/footer, chips, lightbox, misc utils. */
(function () {
  const S = window.SPUS_STORE;
  const UI = {};

  /* ---------- language & text ---------- */
  UI.lang = () => S.lang();
  UI.t = k => (window.SPUS_I18N[S.lang()] && window.SPUS_I18N[S.lang()][k]) || (window.SPUS_I18N.en && window.SPUS_I18N.en[k]) || k;
  UI.L = (rec, field) => { const l = S.lang(); return rec[field + "_" + l] || rec[field + "_bn"] || rec[field + "_en"] || ""; };
  UI.pick = (bn, en) => { const l = S.lang(); return (l === "en" ? en : bn) || bn || en; };
  const BN_D = "০১২৩৪৫৬৭৮৯";
  UI.num = n => S.lang() === "bn" ? String(n).replace(/\d/g, d => BN_D[d]) : String(n);
  UI.money = n => "৳" + UI.num(n);
  const BN_M = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  const EN_M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  UI.fmtDate = iso => {
    if (!iso) return "";
    const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
    if (isNaN(d)) return iso;
    return S.lang() === "bn" ? UI.num(d.getDate()) + " " + BN_M[d.getMonth()] + " " + UI.num(d.getFullYear())
      : d.getDate() + " " + EN_M[d.getMonth()] + " " + d.getFullYear();
  };
  UI.fmtStamp = ts => { const d = new Date(ts); const p = n => String(n).padStart(2, "0"); return UI.fmtDate(d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate())) + " " + p(d.getHours()) + ":" + p(d.getMinutes()); };
  UI.esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  UI.nl2br = s => UI.esc(s).replace(/\n/g, "<br>");

  /* ---------- URL params ---------- */
  UI.qs = name => new URLSearchParams(location.search).get(name);
  UI.setParams = obj => { const p = new URLSearchParams(location.search); Object.keys(obj).forEach(k => { if (obj[k] == null || obj[k] === "") p.delete(k); else p.set(k, obj[k]); }); history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p.toString() : "")); };

  /* ---------- generated imagery (SVG data URIs, no external files) ---------- */
  const PALETTES = [["#1E7A46", "#0E4D2C"], ["#2C8C5B", "#123A2A"], ["#B98A2F", "#7A5A1B"], ["#2563EB", "#14306B"], ["#0E7490", "#0B3E4D"], ["#7C3AED", "#3B1E75"]];
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; } return h; }
  UI.img = function (seed, w, h, label) {
    seed = String(seed || "x"); w = w || 800; h = h || 500;
    const [c1, c2] = PALETTES[hash(seed) % PALETTES.length];
    const r1 = 60 + (hash(seed + "a") % 140), r2 = 40 + (hash(seed + "b") % 120);
    const x1 = (hash(seed + "c") % (w - 200)) + 60, y1 = (hash(seed + "d") % (h - 200)) + 60;
    const x2 = (hash(seed + "e") % (w - 160)) + 40, y2 = (hash(seed + "f") % (h - 160)) + 40;
    const lab = label || "";
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' +
      '<rect width="' + w + '" height="' + h + '" fill="url(#g)"/>' +
      '<circle cx="' + x1 + '" cy="' + y1 + '" r="' + r1 + '" fill="#ffffff" opacity="0.10"/>' +
      '<circle cx="' + x2 + '" cy="' + y2 + '" r="' + r2 + '" fill="#ffffff" opacity="0.08"/>' +
      '<circle cx="' + w * 0.78 + '" cy="' + h * 0.24 + '" r="' + Math.min(w, h) * 0.09 + '" fill="#ffffff" opacity="0.14"/>' +
      '<rect x="0" y="' + (h - h * 0.22) + '" width="' + w + '" height="' + h * 0.22 + '" fill="#000000" opacity="0.18"/>' +
      (lab ? '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Hind Siliguri, sans-serif" font-size="' + Math.max(14, Math.min(30, w / 24)) + '" fill="#ffffff" opacity="0.92">' + UI.esc(lab) + '</text>' : '') +
      '</svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  };
  UI.avatar = function (name, seed) {
    name = name || "?"; seed = String(seed || name);
    const [c1, c2] = PALETTES[hash(seed) % PALETTES.length];
    const ch = Array.from(name.trim())[0] || "?";
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' +
      '<rect width="240" height="240" rx="120" fill="url(#g)"/>' +
      '<circle cx="120" cy="88" r="34" fill="#ffffff" opacity="0.22"/><circle cx="120" cy="188" r="64" fill="#ffffff" opacity="0.16"/>' +
      '<text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="Hind Siliguri, sans-serif" font-size="86" fill="#ffffff">' + UI.esc(ch) + '</text></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  };
  UI.recordImage = function (rec, w, h, label) {
    const src = rec && (rec.image || rec.src || rec.photo || rec.cover);
    if (src) return src;
    return UI.img((rec && rec.id) || label || "seed", w, h, label);
  };
  UI.isPlaceholder = v => /\[(ADD|BIKASH|NAGAD|ROCKET|ঠিকানা|ফোন|ইমেইল|ADD )/.test(String(v || ""));

  /* ---------- chips & badges ---------- */
  UI.statusChip = function (st) { const key = String(st || "").replace(/\s+/g, "_"); return '<span class="chip chip--' + UI.esc(key) + '">' + UI.esc(UI.t("st_" + key)) + "</span>"; };
  UI.catChip = function (cat) { return '<span class="chip chip--cat">' + UI.esc(UI.t("cat_" + cat) || cat) + "</span>"; };
  UI.demoChip = '<span class="chip chip--demo">' + UI.esc(UI.t("demo_chip")) + "</span>";
  UI.phChip = '<span class="chip chip--ph">' + UI.esc(UI.t("ph_chip")) + "</span>";

  /* ---------- header / footer ---------- */
  const NAV = [["index.html", "nav_home"], ["about.html", "nav_about"], ["news.html", "nav_news"], ["events.html", "nav_events"], ["sports.html", "nav_sports"], ["players.html", "nav_players"], ["committee.html", "nav_committee"], ["archive.html", "nav_archive"], ["gallery.html", "nav_gallery"], ["contact.html", "nav_contact"]];
  UI.renderHeader = function () {
    const site = S.site(); const lang = S.lang();
    const page = document.body.dataset.page || "";
    const here = location.pathname.split("/").pop() || "index.html";
    const links = NAV.map(([href, key]) => {
      const active = here === href || (page === "article" && href === "news.html") || (page === "tournament" && href === "sports.html") || (page === "player" && href === "players.html") || (page === "search" && false);
      return '<li><a class="nav-link' + (active ? " is-active" : "") + '" href="' + href + '">' + UI.esc(UI.t(key)) + "</a></li>";
    }).join("");
    const name = lang === "en" ? site.name_en : site.name_bn;
    document.getElementById("site-header").innerHTML =
      '<div class="header-inner container">' +
      '<a class="brand" href="index.html" aria-label="' + UI.esc(name) + '">' +
      '<img src="assets/img/logo.svg" alt="" width="44" height="44" class="brand-logo">' +
      '<span class="brand-text"><strong>' + UI.esc(name) + "</strong><small>" + UI.esc(lang === "en" ? site.tagline_en : site.tagline_bn) + "</small></span></a>" +
      '<nav class="main-nav" aria-label="Main"><ul>' + links + "</ul></nav>" +
      '<div class="header-actions">' +
      '<form class="header-search" action="search.html" role="search"><input type="search" name="q" placeholder="' + UI.esc(UI.t("search_ph")) + '" aria-label="' + UI.esc(UI.t("search_btn")) + '"><button type="submit" aria-label="' + UI.esc(UI.t("search_btn")) + '">🔍</button></form>' +
      '<div class="lang-switch" role="group" aria-label="Language"><button type="button" data-lang="bn"' + (lang === "bn" ? ' aria-pressed="true"' : "") + '>বাংলা</button><span aria-hidden="true">|</span><button type="button" data-lang="en"' + (lang === "en" ? ' aria-pressed="true"' : "") + '>English</button></div>' +
      '<a class="btn btn--primary btn--sm header-donate" href="donate.html">' + UI.esc(UI.t("nav_donate")) + "</a>" +
      '<button class="nav-burger" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Menu"><span></span><span></span><span></span></button>' +
      "</div></div>" +
      '<nav id="mobile-nav" class="mobile-nav" aria-label="Mobile"><ul>' + links + '<li><a class="nav-link" href="donate.html">' + UI.esc(UI.t("nav_donate")) + "</a></li></ul></nav>";
    document.querySelectorAll(".lang-switch button").forEach(b => b.addEventListener("click", () => { S.setLang(b.dataset.lang); location.reload(); }));
    const burger = document.querySelector(".nav-burger");
    if (burger) burger.addEventListener("click", () => { const nav = document.getElementById("mobile-nav"); const open = nav.classList.toggle("is-open"); burger.setAttribute("aria-expanded", open ? "true" : "false"); burger.classList.toggle("is-open", open); });
  };

  UI.renderFooter = function () {
    const site = S.site(); const lang = S.lang(); const c = site.contact;
    const addr = lang === "en" ? c.address_en : c.address_bn;
    const social = [];
    if (c.facebook) social.push('<a href="' + UI.esc(c.facebook) + '" rel="noopener">Facebook</a>');
    if (c.instagram) social.push('<a href="' + UI.esc(c.instagram) + '" rel="noopener">Instagram</a>');
    if (c.youtube) social.push('<a href="' + UI.esc(c.youtube) + '" rel="noopener">YouTube</a>');
    if (c.threads) social.push('<a href="' + UI.esc(c.threads) + '" rel="noopener">Threads</a>');
    const quick = [["index.html", "nav_home"], ["about.html", "nav_about"], ["news.html", "nav_news"], ["events.html", "nav_events"], ["sports.html", "nav_sports"], ["players.html", "nav_players"], ["committee.html", "nav_committee"], ["archive.html", "nav_archive"], ["gallery.html", "nav_gallery"], ["donate.html", "nav_donate"], ["contact.html", "nav_contact"]];
    document.getElementById("site-footer").innerHTML =
      '<div class="container footer-grid">' +
      '<div class="footer-brand"><img src="assets/img/logo.svg" alt="" width="52" height="52"><p><strong>' + UI.esc(lang === "en" ? site.name_en : site.name_bn) + "</strong></p><p class='muted'>" + UI.esc(UI.t("footer_about")) + "</p></div>" +
      '<div><h3>' + UI.esc(UI.t("quick_links")) + '</h3><ul class="footer-links">' + quick.map(([h, k]) => '<li><a href="' + h + '">' + UI.esc(UI.t(k)) + "</a></li>").join("") + "</ul></div>" +
      '<div><h3>' + UI.esc(UI.t("contact_info")) + '</h3><ul class="footer-contact">' +
      "<li>📍 " + UI.esc(addr) + " " + (UI.isPlaceholder(addr) ? UI.phChip : "") + "</li>" +
      "<li>📞 " + UI.esc(c.phone) + " " + (UI.isPlaceholder(c.phone) ? UI.phChip : "") + "</li>" +
      "<li>✉️ " + UI.esc(c.email) + " " + (UI.isPlaceholder(c.email) ? UI.phChip : "") + "</li></ul>" +
      "<h3>" + UI.esc(UI.t("follow_us")) + '</h3><p class="footer-social">' + (social.length ? social.join(" · ") : '<span class="muted">[Facebook · Instagram · YouTube]</span> ' + UI.phChip) + "</p></div></div>" +
      '<div class="footer-bottom"><div class="container footer-bottom-inner"><p>© ' + UI.num(new Date().getFullYear()) + " " + UI.esc(UI.t("rights")) + '</p><p><a href="privacy.html">' + UI.esc(UI.t("privacy")) + '</a> · <a href="terms.html">' + UI.esc(UI.t("terms")) + '</a> · <a href="admin.html" rel="nofollow">' + UI.esc(UI.t("nav_admin")) + "</a></p></div>" +
      '<div class="container footer-demo muted">' + UI.esc(UI.t("demo_note")) + "</div></div>";
  };

  /* ---------- lightbox ---------- */
  UI.lightbox = function (items, startIdx) {
    let idx = startIdx || 0;
    let box = document.getElementById("lightbox");
    if (!box) { box = document.createElement("div"); box.id = "lightbox"; box.className = "lightbox"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); document.body.appendChild(box); }
    function draw() {
      const it = items[idx];
      const src = it.src || UI.img(it.id || idx, 1200, 800, it.caption_bn || it.caption_en || "");
      const cap = S.lang() === "en" ? (it.caption_en || it.caption_bn || "") : (it.caption_bn || it.caption_en || "");
      box.innerHTML = '<button class="lb-close" aria-label="Close">✕</button><button class="lb-prev" aria-label="Previous">‹</button><figure><img src="' + UI.esc(src) + '" alt="' + UI.esc(cap) + '">' + (cap ? "<figcaption>" + UI.esc(cap) + " — " + UI.num(idx + 1) + "/" + UI.num(items.length) + "</figcaption>" : "") + '</figure><button class="lb-next" aria-label="Next">›</button>';
      box.classList.add("is-open");
      box.querySelector(".lb-close").onclick = close;
      box.querySelector(".lb-prev").onclick = () => { idx = (idx - 1 + items.length) % items.length; draw(); };
      box.querySelector(".lb-next").onclick = () => { idx = (idx + 1) % items.length; draw(); };
      document.querySelectorAll(".lightbox.is-open").forEach(() => { });
      box.onkeydown = null;
    }
    function close() { box.classList.remove("is-open"); document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); if (e.key === "ArrowLeft") box.querySelector(".lb-prev") && box.querySelector(".lb-prev").click(); if (e.key === "ArrowRight") box.querySelector(".lb-next") && box.querySelector(".lb-next").click(); }
    document.addEventListener("keydown", onKey);
    box.addEventListener("click", e => { if (e.target === box) close(); });
    draw();
  };

  /* ---------- toast ---------- */
  UI.toast = function (msg, kind) {
    let t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.className = "toast is-visible" + (kind ? " toast--" + kind : "");
    t.textContent = msg;
    setTimeout(() => t.classList.remove("is-visible"), 4200);
  };

  /* ---------- counters ---------- */
  UI.initCounters = function (root) {
    const els = (root || document).querySelectorAll("[data-count]");
    if (!("IntersectionObserver" in window)) { els.forEach(el => { el.textContent = UI.num(el.dataset.count); }); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target; io.unobserve(el);
        const target = parseInt(el.dataset.count, 10) || 0; const t0 = performance.now(); const dur = 1100;
        (function step(now) {
          const k = Math.min(1, (now - t0) / dur);
          el.textContent = UI.num(Math.round(target * (0.2 + 0.8 * k) * (k === 1 ? 1 : k)) || Math.round(target * k));
          if (k < 1) requestAnimationFrame(step); else el.textContent = UI.num(target);
        })(t0);
      });
    }, { threshold: 0.4 });
    els.forEach(el => io.observe(el));
  };

  /* ---------- csv / download ---------- */
  UI.download = function (filename, content, mime) {
    const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  };
  UI.csv = function (rows) {
    return rows.map(r => r.map(v => { v = String(v == null ? "" : v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(",")).join("\r\n");
  };
  UI.bom = "\uFEFF";

  /* ---------- shared component cards ---------- */
  UI.newsCard = function (n) {
    return '<article class="card news-card"><a class="card-media" href="article.html?item=' + encodeURIComponent(n.slug || n.id) + '" tabindex="-1" aria-hidden="true"><img loading="lazy" src="' + UI.recordImage(n, 640, 400) + '" alt=""></a>' +
      '<div class="card-body"><div class="card-meta">' + UI.catChip(n.category) + '<time datetime="' + UI.esc(n.date) + '">' + UI.fmtDate(n.date) + "</time></div>" +
      '<h3 class="card-title"><a href="article.html?item=' + encodeURIComponent(n.slug || n.id) + '">' + UI.esc(UI.L(n, "title")) + "</a></h3>" +
      '<p class="muted">' + UI.esc(UI.L(n, "excerpt")) + "</p>" +
      '<a class="text-link" href="article.html?item=' + encodeURIComponent(n.slug || n.id) + '">' + UI.esc(UI.t("read_more")) + " →</a></div></article>";
  };
  UI.eventCard = function (ev) {
    return '<article class="card event-card"><div class="event-date"><strong>' + UI.num(new Date(ev.date + "T00:00:00").getDate()) + "</strong><span>" + UI.fmtDate(ev.date).split(" ")[1] + "</span></div>" +
      '<div class="card-body"><div class="card-meta">' + UI.statusChip(ev.status) + "</div>" +
      '<h3 class="card-title"><a href="events.html?item=' + encodeURIComponent(ev.id) + '">' + UI.esc(UI.L(ev, "title")) + "</a></h3>" +
      '<p class="muted">🕘 ' + UI.fmtDate(ev.date) + (ev.time_start ? " · " + UI.num(ev.time_start) : "") + "</p>" +
      '<p class="muted">📍 ' + UI.esc(UI.L(ev, "location")) + "</p>" +
      '<a class="text-link" href="events.html?item=' + encodeURIComponent(ev.id) + '">' + UI.esc(UI.t("view_details")) + " →</a></div></article>";
  };
  UI.fixtureCard = function (f, teams) {
    const a = teams.find(t => t.id === f.team_a_id) || { name_bn: "?", name_en: "?", short: "?" };
    const b = teams.find(t => t.id === f.team_b_id) || { name_bn: "?", name_en: "?", short: "?" };
    const T = UI.t;
    return '<article class="card fixture-card"><div class="fixture-teams">' +
      '<div class="fixture-team"><span class="team-badge" style="--c:' + UI.esc(a.color) + '">' + UI.esc(a.short) + "</span><strong>" + UI.esc(UI.L(a, "name")) + "</strong></div>" +
      '<div class="fixture-vs">' + UI.esc(T("vs")) + "</div>" +
      '<div class="fixture-team"><span class="team-badge" style="--c:' + UI.esc(b.color) + '">' + UI.esc(b.short) + "</span><strong>" + UI.esc(UI.L(b, "name")) + "</strong></div></div>" +
      '<div class="fixture-meta">' + UI.statusChip(f.status) + " · " + UI.esc(UI.L(f, "round")) + " · " + UI.fmtDate(f.date) + " · " + UI.num(f.time) + "</div>" +
      '<div class="fixture-meta muted">📍 ' + UI.esc(UI.L(f, "venue")) + "</div></article>";
  };
  UI.resultCard = function (r, teams) {
    const a = teams.find(t => t.id === r.team_a_id) || { name_bn: "?", name_en: "?", short: "?" };
    const b = teams.find(t => t.id === r.team_b_id) || { name_bn: "?", name_en: "?", short: "?" };
    const winA = r.winner_team_id === a.id, winB = r.winner_team_id === b.id;
    return '<article class="card result-card"><div class="result-scoreline">' +
      '<div class="result-team' + (winA ? " is-winner" : "") + '"><span class="team-badge" style="--c:' + UI.esc(a.color) + '">' + UI.esc(a.short) + "</span><strong>" + UI.esc(UI.L(a, "name")) + "</strong></div>" +
      '<div class="result-score">' + UI.num(r.score_a) + " — " + UI.num(r.score_b) + "</div>" +
      '<div class="result-team' + (winB ? " is-winner" : "") + '"><strong>' + UI.esc(UI.L(b, "name")) + "</strong><span class=\"team-badge\" style=\"--c:" + UI.esc(b.color) + '">' + UI.esc(b.short) + "</span></div></div>" +
      '<div class="fixture-meta">' + UI.fmtDate(r.date) + " · " + UI.esc(UI.L(r, "venue")) + (r.potm_bn ? " · " + UI.esc(UI.t("potm")) + ": " + UI.esc(UI.pick(r.potm_bn, r.potm_en)) : "") + "</div></article>";
  };
  UI.playerCard = function (p) {
    return '<article class="card player-card"><a class="card-media avatar-media" href="player.html?p=' + encodeURIComponent(p.slug || p.id) + '" tabindex="-1" aria-hidden="true"><img loading="lazy" src="' + (p.image || UI.avatar(UI.L(p, "name"), p.id)) + '" alt=""></a>' +
      '<div class="card-body player-body"><span class="jersey">' + UI.num(p.jersey) + "</span>" +
      '<h3 class="card-title"><a href="player.html?p=' + encodeURIComponent(p.slug || p.id) + '">' + UI.esc(UI.L(p, "name")) + "</a></h3>" +
      '<p class="muted">' + UI.esc(UI.L(p, "position")) + "</p></div></article>";
  };
  UI.memberCard = function (m) {
    return '<article class="card member-card"><img class="member-photo" loading="lazy" src="' + (m.photo || UI.avatar(UI.L(m, "name"), m.id)) + '" alt="' + UI.esc(UI.L(m, "name")) + '">' +
      '<h3 class="card-title">' + UI.esc(UI.L(m, "name")) + "</h3>" +
      '<p class="member-pos">' + UI.esc(UI.L(m, "position")) + "</p></article>";
  };

  /* ---------- page boot ---------- */
  UI.boot = function (renderFn) {
    document.documentElement.lang = S.lang();
    UI.renderHeader(); UI.renderFooter();
    const main = document.getElementById("main");
    try { renderFn(main); } catch (e) { console.error(e); main.innerHTML = '<div class="empty-state">' + UI.esc(UI.t("err404_title")) + "</div>"; }
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = UI.t(el.dataset.i18n); });
    UI.initCounters(main);
  };
  window.SPUS_UI = UI;
})();
