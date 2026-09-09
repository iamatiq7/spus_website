/* Admin dashboard — login, role-gated sidebar, CRUD over the store, submissions & verification. */
(function () {
  const S = window.SPUS_STORE, U = window.SPUS_UI;
  const T = k => U.t(k), E = U.esc;
  const root = () => document.getElementById("admin-root");
  let currentSection = "dashboard";

  const LBL = {
    title_bn: "শিরোনাম (বাংলা)", title_en: "Title (English)", slug: "SLUG (URL)", date: "তারিখ", end_date: "শেষ তারিখ",
    year: "বছর", category: "ক্যাটাগরি", author_bn: "লেখক (বাংলা)", author_en: "Author (English)",
    excerpt_bn: "সারসংক্ষেপ (বাংলা)", excerpt_en: "Excerpt (English)", body_bn: "মূল লেখা (বাংলা)", body_en: "Body (English)",
    image: "ছবি", featured: "প্রধান সংবাদ", status: "অবস্থা", time_start: "শুরুর সময়", time_end: "শেষ সময়",
    location_bn: "স্থান (বাংলা)", location_en: "Location (English)", organizer_bn: "আয়োজক (বাংলা)", organizer_en: "Organizer (English)",
    desc_bn: "বিবরণ (বাংলা)", desc_en: "Description (English)", priority: "প্রায়োরিটি", start: "শুরু", published: "প্রকাশিত",
    name_bn: "নাম (বাংলা)", name_en: "Name (English)", icon: "আইকন", score_format: "স্কোর ফরম্যাট",
    sport_id: "খেলা", venue_bn: "ভেন্যু (বাংলা)", venue_en: "Venue (English)", teams_count: "দল সংখ্যা",
    champion_team_id: "চ্যাম্পিয়ন দল", runnerup_team_id: "রানার-আপ দল", stat_columns: "স্ট্যাট কলাম", season: "সিজন",
    short: "সংক্ষেপ (৩ অক্ষর)", color: "রং", sports: "খেলা IDs (কমা দিয়ে)",
    jersey: "জার্সি নম্বর", position_bn: "পজিশন (বাংলা)", position_en: "Position (English)", team_id: "দল",
    tournament_id: "টুর্নামেন্ট", active: "সক্রিয়", bio_bn: "পরিচিতি (বাংলা)", bio_en: "Bio (English)",
    achievements_bn: "অর্জন (প্রতি লাইনে একটি)", achievements_en: "Achievements (one per line)",
    round_bn: "রাউন্ড (বাংলা)", round_en: "Round (English)", time: "সময়", team_a_id: "দল ক", team_b_id: "দল খ",
    score_a: "স্কোর ক", score_b: "স্কোর খ", winner_team_id: "বিজয়ী দল", potm_bn: "ম্যাচ সেরা (বাংলা)", potm_en: "POTM (English)",
    report_bn: "ম্যাচ রিপোর্ট (বাংলা)", report_en: "Report (English)", fixture_id: "ফিক্সচার (ঐচ্ছিক)",
    label_bn: "শিরোনাম (বাংলা)", label_en: "Label (English)", photo: "ছবি", joined: "যোগদান (বছর)",
    event_id: "ইভেন্ট", cover: "কভার ছবি", photos: "ছবিসমূহ", members: "সদস্যরা", caption_bn: "ক্যাপশন (বাংলা)", caption_en: "Caption (English)",
    number: "নম্বর", type_bn: "অ্যাকাউন্টের ধরন (বাংলা)", type_en: "Account type (English)",
    instructions_bn: "নির্দেশনা (বাংলা)", instructions_en: "Instructions (English)",
    bank_name: "ব্যাংকের নাম", branch: "শাখা", account_name: "হিসাবের নাম", account_number: "হিসাব নম্বর", routing: "রাউটিং", swift: "SWIFT",
    note_bn: "নোট (বাংলা)", note_en: "Note (English)", title: "শিরোনাম", file: "ফাইল URL"
  };
  const lbl = k => LBL[k] || k;

  /* ---------------- login ---------------- */
  function showLogin() {
    root().innerHTML = '<div class="login-wrap"><div class="login-card">' +
      '<div class="brand-line"><img src="assets/img/logo.svg" alt=""><div><strong>' + E(S.site().name_bn) + "</strong><div class='muted small'>" + E(T("a_login_title")) + "</div></div></div>" +
      '<form id="login-form" class="admin-form"><div class="fld"><label for="u">' + E(T("a_username")) + '</label><input id="u" autocomplete="username" required></div>' +
      '<div class="fld"><label for="p">' + E(T("a_password")) + '</label><input id="p" type="password" autocomplete="current-password" required></div>' +
      '<button class="btn btn--primary" type="submit">' + E(T("a_login_btn")) + "</button>" +
      '<p class="form-status" id="login-status"></p></form>' +
      '<p class="login-note">🔐 ' + E(T("a_demo_note")) + "</p></div></div>";
    document.getElementById("login-form").addEventListener("submit", async e => {
      e.preventDefault();
      const ok = await S.login(document.getElementById("u").value.trim(), document.getElementById("p").value);
      if (ok) render(); else document.getElementById("login-status").textContent = T("a_login_err");
    });
  }

  /* ---------------- shell ---------------- */
  const SECTIONS = [
    ["dashboard", "a_dashboard", "📊"], ["news", "a_news", "📰"], ["events", "a_events", "📅"], ["notices", "a_notices", "📣"],
    ["years", "a_years", "🗓️"], ["sports", "a_sports", "🏆"], ["tournaments", "a_tournaments", "🥇"], ["teams", "a_teams", "🎽"],
    ["players", "a_players", "🏃"], ["fixtures", "a_fixtures", "🗓"], ["results", "a_results", "⚽"], ["standings", "a_standings", "📈"],
    ["committee", "a_committee", "🧑‍💼"], ["gallery", "a_gallery", "🖼️"], ["donations", "a_donations", "💰"],
    ["submissions", "a_submissions", "✉️"], ["settings", "a_settings", "⚙️"]
  ];
  function render() {
    const cur = S.current();
    if (!cur) { showLogin(); return; }
    const items = SECTIONS.filter(([k]) => S.can(k));
    if (!items.some(([k]) => k === currentSection)) currentSection = items[0][0];
    root().innerHTML = '<div class="admin-shell">' +
      '<aside class="admin-side"><div class="side-brand"><img src="assets/img/logo.svg" alt=""><strong>' + E(S.site().name_bn) + "<span class='muted small' style='color:#8FA79A'> " + E(T("a_role") + ": " + T("a_role_" + cur.role)) + "</span></strong></div>" +
      "<nav>" + items.map(([k, kk, ic]) => '<button type="button" data-sec="' + k + '"' + (k === currentSection ? ' class="is-active"' : "") + ">" + ic + " " + E(T(kk)) + "</button>").join("") + "</nav></aside>" +
      '<div class="admin-main"><div class="admin-topbar"><h1 id="sec-title"></h1><div class="actions">' +
      '<span class="mode-badge' + (S.serverMode ? " server" : "") + '">' + E(S.serverMode ? T("a_server_mode") : T("a_local_mode")) + "</span>" +
      '<a class="btn btn--ghost btn--sm" href="index.html">🌐 ' + E(T("nav_home")) + '</a>' +
      '<button class="btn btn--outline btn--sm" id="logout">' + E(T("a_logout")) + "</button></div></div>" +
      '<div id="sec-body"></div></div></div>';
    root().querySelectorAll("[data-sec]").forEach(b => b.addEventListener("click", () => { currentSection = b.dataset.sec; render(); }));
    document.getElementById("logout").addEventListener("click", () => { S.logout(); render(); });
    const fn = SECTIONS_MAP[currentSection] || dashSection;
    document.getElementById("sec-title").textContent = T("a_" + (SECTIONS.find(s => s[0] === currentSection) || ["", "dashboard"])[1]);
    fn(document.getElementById("sec-body"));
  }

  /* ---------------- generic CRUD ---------------- */
  function relOpts(entity, labelKey) { return S.list(entity).map(r => ({ v: r.id, l: U.L(r, labelKey || "name") })); }
  function fieldHtml(f, val) {
    const v = val == null ? "" : val;
    if (f.t === "textarea") return '<div class="fld"><label>' + E(lbl(f.k)) + '</label><textarea data-k="' + f.k + '"' + (f.big ? ' class="tall"' : "") + ">" + E(v) + "</textarea></div>";
    if (f.t === "check") return '<div class="fld"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-k="' + f.k + '"' + (v ? " checked" : "") + "> " + E(lbl(f.k)) + "</label></div>";
    if (f.t === "select") return '<div class="fld"><label>' + E(lbl(f.k)) + '</label><select data-k="' + f.k + '">' +
      '<option value="">—</option>' + f.opts.map(o => '<option value="' + E(o.v) + '"' + (String(o.v) === String(v) ? " selected" : "") + ">" + E(o.l) + "</option>").join("") + "</select></div>";
    if (f.t === "image") return '<div class="fld"><label>' + E(lbl(f.k)) + '</label><div class="img-field"><img data-preview="' + f.k + '" src="' + E(v || U.img(f.k, 84, 60, "")) + '" alt="">' +
      '<input type="file" accept="image/*" data-img="' + f.k + '">' +
      '<input type="url" placeholder="https://…" data-k="' + f.k + '" value="' + E(v && String(v).startsWith("http") ? v : "") + '"></div></div>';
    const type = { text: "text", number: "number", date: "date", time: "time", color: "color", url: "url" }[f.t] || "text";
    return '<div class="fld"><label>' + E(lbl(f.k)) + '</label><input type="' + type + '" data-k="' + f.k + '" value="' + E(v) + '"' + (f.t === "color" ? ' style="height:42px"' : "") + "></div>";
  }
  function collectForm(wrap, schema) {
    const rec = {};
    wrap.querySelectorAll("[data-k]").forEach(el => {
      const k = el.dataset.k;
      if (el.type === "checkbox") rec[k] = el.checked;
      else if (el.type === "number") rec[k] = el.value === "" ? "" : parseFloat(el.value);
      else rec[k] = el.value.trim();
    });
    wrap.querySelectorAll("[data-img]").forEach(inp => { if (inp.dataset.stored) rec[inp.dataset.img] = inp.dataset.stored; });
    (schema.arrays || []).forEach(k => { rec[k] = String(rec[k] || "").split("\n").map(s => s.trim()).filter(Boolean); });
    return rec;
  }
  function crudSection(key, schema) {
    return function (body) {
      body.innerHTML = '<div class="panel"><div class="panel-head"><h2>' + E(T("a_" + key)) + '</h2><button class="btn btn--primary btn--sm" id="add-btn">＋ ' + E(T("a_add_new")) + '</button></div><div class="tbl-wrap"><table class="admin-table"><thead><tr>' +
        schema.list.map(k => "<th>" + E(lbl(k)) + "</th>").join("") + "<th></th></tr></thead><tbody id='rows'></tbody></table></div></div>" +
        '<div class="panel form-panel" id="form-panel" hidden></div>' +
        (S.serverMode ? "" : '<p class="muted small">💾 ' + E(T("a_local_note")) + "</p>");
      const rows = body.querySelector("#rows");
      function fmt(k, r) {
        let v = r[k];
        if (k.endsWith("_id")) { const ent = { sport_id: "sports", team_id: "teams", tournament_id: "tournaments", event_id: "events", winner_team_id: "teams", champion_team_id: "teams", runnerup_team_id: "teams" }[k]; if (ent) { const rec2 = S.get(ent, v); if (rec2) v = U.L(rec2, "name"); } }
        if (k === "status" || (k === "published" && typeof v === "boolean")) return v ? '<span class="badge ok">' + E(T("st_published")) + "</span>" : '<span class="badge">' + E(T("st_draft")) + "</span>";
        if (Array.isArray(v)) v = v.join(", ");
        if (typeof v === "boolean") return v ? "✓" : "—";
        v = String(v == null ? "" : v);
        if (/^data:image/.test(v)) return '<img class="thumb" src="' + v + '" alt="">';
        if (/^https?:/.test(v)) return '<a href="' + E(v) + '" target="_blank" rel="noopener">🔗</a>';
        return E(v.length > 60 ? v.slice(0, 60) + "…" : v);
      }
      function drawList() {
        const items = S.list(key).sort((a, b) => String(b.date || b.year || "").localeCompare(String(a.date || a.year || "")));
        rows.innerHTML = items.map(r => "<tr>" + schema.list.map(k => "<td>" + fmt(k, r) + "</td>").join("") +
          '<td><div class="row-actions"><button class="icon-btn" data-edit="' + r.id + '">✏️ ' + E(T("a_edit")) + '</button><button class="icon-btn danger" data-del="' + r.id + '">🗑</button></div></td></tr>').join("") ||
          '<tr><td colspan="' + (schema.list.length + 1) + '"><div class="empty-state">' + E(T("a_add_new")) + " ↓</div></td></tr>";
        rows.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => openForm(S.get(key, b.dataset.edit))));
        rows.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => { if (confirm(T("a_confirm_delete"))) { S.del(key, b.dataset.del); drawList(); U.toast("🗑 " + T("a_saved")); } }));
      }
      function openForm(rec) {
        const panel = body.querySelector("#form-panel");
        panel.hidden = false;
        panel.innerHTML = '<div class="panel-head"><h2>' + (rec ? "✏️ " + T("a_edit") : "＋ " + T("a_add_new")) + '</h2><button class="icon-btn" id="close-form">✕</button></div>' +
          '<form class="admin-form"><div class="form-row">' +
          schema.fields.map(f => '<div class="' + (f.full ? "full" : "") + '">' + fieldHtml(f, rec ? rec[f.k] : "") + "</div>").join("") +
          '</div><div class="form-foot"><button class="btn btn--primary" type="submit">' + E(T("a_save")) + '</button><button class="btn btn--outline" type="button" id="cancel-form">' + E(T("a_cancel")) + "</button></div></form>";
        panel.querySelectorAll("[data-img]").forEach(inp => inp.addEventListener("change", () => {
          const file = inp.files[0]; if (!file) return;
          resizeImage(file, 1200).then(dataUrl => { inp.dataset.stored = dataUrl; const pv = panel.querySelector('[data-preview="' + inp.dataset.img + '"]'); if (pv) pv.src = dataUrl; });
        }));
        panel.querySelector("#close-form").addEventListener("click", () => { panel.hidden = true; });
        panel.querySelector("#cancel-form").addEventListener("click", () => { panel.hidden = true; });
        panel.querySelector("form").addEventListener("submit", e => {
          e.preventDefault();
          const data = collectForm(panel, schema);
          if (rec) { S.put(key, rec.id, data); } else { S.add(key, data); }
          U.toast("✓ " + T("a_saved")); panel.hidden = true; drawList();
        });
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      body.querySelector("#add-btn").addEventListener("click", () => openForm(null));
      drawList();
    };
  }

  const CATS = ["community", "sports", "events", "development", "announcement", "general"];
  const SECTIONS_MAP = {
    dashboard: dashSection,
    news: crudSection("news", {
      list: ["date", "title_bn", "category", "status", "featured", "image"],
      arrays: ["achievements_none"],
      fields: [
        { k: "title_bn" }, { k: "title_en" }, { k: "slug", hint: 1 }, { k: "date", t: "date" }, { k: "year", t: "number" },
        { k: "category", t: "select", opts: CATS.map(c => ({ v: c, l: T("cat_" + c) })) },
        { k: "status", t: "select", opts: [{ v: "published", l: T("st_published") }, { v: "draft", l: T("st_draft") }] },
        { k: "featured", t: "check" }, { k: "author_bn" }, { k: "author_en" },
        { k: "excerpt_bn", t: "textarea", full: 1 }, { k: "excerpt_en", t: "textarea", full: 1 },
        { k: "body_bn", t: "textarea", big: 1, full: 1 }, { k: "body_en", t: "textarea", big: 1, full: 1 },
        { k: "image", t: "image", full: 1 }
      ]
    }),
    events: crudSection("events", {
      list: ["date", "title_bn", "status", "location_bn"],
      fields: [
        { k: "title_bn" }, { k: "title_en" }, { k: "slug" }, { k: "date", t: "date" }, { k: "end_date", t: "date" },
        { k: "time_start", t: "time" }, { k: "time_end", t: "time" }, { k: "year", t: "number" },
        { k: "status", t: "select", opts: ["upcoming", "ongoing", "completed", "cancelled"].map(s => ({ v: s, l: T("st_" + s) })) },
        { k: "location_bn" }, { k: "location_en" }, { k: "organizer_bn" }, { k: "organizer_en" },
        { k: "desc_bn", t: "textarea", full: 1 }, { k: "desc_en", t: "textarea", full: 1 }, { k: "image", t: "image", full: 1 }
      ]
    }),
    notices: crudSection("notices", {
      list: ["title_bn", "priority", "start", "end", "published"],
      fields: [
        { k: "title_bn" }, { k: "title_en" }, { k: "priority", t: "select", opts: [{ v: "high", l: T("notice_high") }, { v: "normal", l: T("notices_title") }] },
        { k: "start", t: "date" }, { k: "end", t: "date" }, { k: "published", t: "check" },
        { k: "body_bn", t: "textarea", full: 1 }, { k: "body_en", t: "textarea", full: 1 }
      ]
    }),
    sports: crudSection("sports", {
      list: ["icon", "name_bn", "score_format"],
      fields: [{ k: "name_bn" }, { k: "name_en" }, { k: "icon" }, { k: "score_format", t: "select", opts: ["football", "cricket", "sets", "points"].map(v => ({ v, l: v })) }]
    }),
    tournaments: crudSection("tournaments", {
      list: ["year", "name_bn", "sport_id", "status", "champion_team_id"],
      fields: [
        { k: "name_bn" }, { k: "name_en" }, { k: "slug" }, { k: "year", t: "number" },
        { k: "sport_id", t: "select", opts: relOpts("sports") },
        { k: "status", t: "select", opts: ["upcoming", "registration_open", "ongoing", "completed", "cancelled"].map(s => ({ v: s, l: T("st_" + s) })) },
        { k: "start_date", t: "date" }, { k: "end_date", t: "date" }, { k: "venue_bn" }, { k: "venue_en" },
        { k: "organizer_bn" }, { k: "organizer_en" }, { k: "teams_count", t: "number" },
        { k: "stat_columns", t: "select", opts: [{ v: "football", l: "football" }, { v: "cricket", l: "cricket" }] },
        { k: "champion_team_id", t: "select", opts: relOpts("teams") }, { k: "runnerup_team_id", t: "select", opts: relOpts("teams") },
        { k: "desc_bn", t: "textarea", full: 1 }, { k: "desc_en", t: "textarea", full: 1 }, { k: "image", t: "image", full: 1 }
      ]
    }),
    teams: crudSection("teams", {
      list: ["short", "name_bn", "color"],
      fields: [{ k: "name_bn" }, { k: "name_en" }, { k: "short" }, { k: "color", t: "color" }, { k: "sports" }]
    }),
    players: crudSection("players", {
      list: ["name_bn", "jersey", "team_id", "sport_id", "active"],
      fields: [
        { k: "name_bn" }, { k: "name_en" }, { k: "slug" }, { k: "jersey", t: "number" },
        { k: "position_bn" }, { k: "position_en" }, { k: "team_id", t: "select", opts: relOpts("teams") },
        { k: "sport_id", t: "select", opts: relOpts("sports") }, { k: "tournament_id", t: "select", opts: relOpts("tournaments") },
        { k: "active", t: "check" }, { k: "image", t: "image" },
        { k: "bio_bn", t: "textarea", full: 1 }, { k: "bio_en", t: "textarea", full: 1 },
        { k: "matches", t: "number" }, { k: "goals", t: "number" }, { k: "assists", t: "number" }, { k: "yellow", t: "number" }, { k: "red", t: "number" },
        { k: "runs", t: "number" }, { k: "wickets", t: "number" }, { k: "average", t: "number" }, { k: "sr", t: "number" },
        { k: "achievements_bn", t: "textarea", full: 1 }, { k: "achievements_en", t: "textarea", full: 1 }
      ],
      arrays: ["achievements_bn", "achievements_en"]
    }),
    fixtures: crudSection("fixtures", {
      list: ["date", "time", "round_bn", "team_a_id", "team_b_id", "status"],
      fields: [
        { k: "tournament_id", t: "select", opts: relOpts("tournaments") }, { k: "sport_id", t: "select", opts: relOpts("sports") },
        { k: "round_bn" }, { k: "round_en" }, { k: "date", t: "date" }, { k: "time", t: "time" },
        { k: "venue_bn" }, { k: "venue_en" }, { k: "team_a_id", t: "select", opts: relOpts("teams") },
        { k: "team_b_id", t: "select", opts: relOpts("teams") },
        { k: "status", t: "select", opts: ["scheduled", "live", "completed", "postponed", "cancelled"].map(s => ({ v: s, l: T("st_" + s) })) }
      ]
    }),
    results: crudSection("results", {
      list: ["date", "team_a_id", "score_a", "score_b", "team_b_id", "winner_team_id"],
      fields: [
        { k: "tournament_id", t: "select", opts: relOpts("tournaments") }, { k: "sport_id", t: "select", opts: relOpts("sports") },
        { k: "fixture_id", t: "select", opts: relOpts("fixtures", "round") }, { k: "date", t: "date" }, { k: "year", t: "number" },
        { k: "venue_bn" }, { k: "venue_en" }, { k: "team_a_id", t: "select", opts: relOpts("teams") }, { k: "team_b_id", t: "select", opts: relOpts("teams") },
        { k: "score_a" }, { k: "score_b" }, { k: "winner_team_id", t: "select", opts: relOpts("teams") },
        { k: "potm_bn" }, { k: "potm_en" }, { k: "report_bn", t: "textarea", full: 1 }, { k: "report_en", t: "textarea", full: 1 }
      ]
    }),
    gallery: gallerySection,
    committee: committeeSection,
    standings: standingsSection,
    years: yearsSection,
    donations: donationsSection,
    submissions: submissionsSection,
    settings: settingsSection
  };

  /* ---------------- players stat mapping ---------------- */
  const _playerAdd = S.add.bind(S), _playerPut = S.put.bind(S);
  // wrap to shape flat stat inputs into stats object
  S.add = function (entity, rec) { if (entity === "players") rec = shapePlayer(rec); return _playerAdd(entity, rec); };
  S.put = function (entity, id, patch) { if (entity === "players") patch = shapePlayer(patch); return _playerPut(entity, id, patch); };
  function shapePlayer(rec) {
    const st = {};
    ["matches", "goals", "assists", "yellow", "red", "runs", "wickets", "average", "sr"].forEach(k => { if (rec[k] !== "" && rec[k] != null) st[k] = parseFloat(rec[k]); delete rec[k]; });
    if (Object.keys(st).length) rec.stats = Object.assign({}, rec.stats || {}, st);
    return rec;
  }

  /* ---------------- standings ---------------- */
  function standingsSection(body) {
    const tours = S.list("tournaments");
    body.innerHTML = '<div class="panel"><h2>' + E(T("a_standings")) + '</h2><p class="muted small">' + E(T("a_standings_note")) + "</p>" +
      '<div class="fld"><label>' + E(T("a_select_tournament")) + '</label><select id="st-tour"><option value="">—</option>' +
      tours.map(t => '<option value="' + t.id + '"' + (t.id === U.qs("t") ? " selected" : "") + ">" + E(U.L(t, "name")) + "</option>").join("") + "</select></div>" +
      '<div id="st-editor"></div></div>';
    const sel = body.querySelector("#st-tour");
    sel.addEventListener("change", draw);
    function draw() {
      const tid = sel.value; const ed = body.querySelector("#st-editor");
      if (!tid) { ed.innerHTML = ""; return; }
      const teams = relOpts("teams");
      let rec = S.list("standings").find(s => s.tournament_id === tid);
      const rows = rec ? rec.rows.map(r => Object.assign({}, r)) : [{ team_id: "", played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }];
      function renderRows() {
        ed.innerHTML = '<div class="edit-rows">' + rows.map((r, i) =>
          '<div class="edit-row" style="grid-template-columns:2fr repeat(8,1fr) auto">' +
          '<select data-i="' + i + '" data-f="team_id"><option value="">—</option>' + teams.map(o => '<option value="' + o.v + '"' + (o.v === r.team_id ? " selected" : "") + ">" + E(o.l) + "</option>").join("") + "</select>" +
          ["played", "won", "draw", "lost", "gf", "ga", "gd", "points"].map(f => '<input type="number" data-i="' + i + '" data-f="' + f + '" value="' + (r[f] || 0) + '">').join("") +
          '<button type="button" class="icon-btn danger rm" data-rm="' + i + '">🗑</button></div>').join("") + "</div>" +
          '<div style="display:flex;gap:10px;margin-top:12px"><button type="button" class="btn btn--outline btn--sm" id="add-row">＋ ' + E(T("a_add_new")) + '</button><button type="button" class="btn btn--primary btn--sm" id="save-st">' + E(T("a_save")) + "</button></div>";
        ed.querySelectorAll("[data-i]").forEach(el => el.addEventListener("input", () => {
          const i = +el.dataset.i, f = el.dataset.f;
          rows[i][f] = f === "team_id" ? el.value : (parseFloat(el.value) || 0);
        }));
        ed.querySelectorAll("[data-rm]").forEach(b => b.addEventListener("click", () => { rows.splice(+b.dataset.rm, 1); renderRows(); }));
        ed.querySelector("#add-row").addEventListener("click", () => { rows.push({ team_id: "", played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }); renderRows(); });
        ed.querySelector("#save-st").addEventListener("click", () => {
          const clean = rows.filter(r => r.team_id);
          if (rec) S.put("standings", rec.id, { rows: clean });
          else rec = S.add("standings", { tournament_id: tid, note_bn: "", note_en: "", rows: clean });
          U.toast("✓ " + T("a_saved"));
        });
      }
      renderRows();
    }
    draw();
  }

  /* ---------------- committee ---------------- */
  function committeeSection(body) {
    const comms = S.list("committee").slice().sort((a, b) => b.year - a.year);
    body.innerHTML = '<div class="panel"><div class="panel-head"><h2>' + E(T("a_committee")) + '</h2><button class="btn btn--primary btn--sm" id="add-comm">＋ ' + E(T("a_add_new")) + '</button></div>' +
      '<div class="tbl-wrap"><table class="admin-table"><thead><tr><th>' + E(T("year")) + '</th><th>' + E(lbl("label_bn")) + '</th><th>' + E(T("members")) + '</th><th></th></tr></thead><tbody>' +
      comms.map(c => "<tr><td>" + U.num(c.year) + "</td><td>" + E(U.L(c, "label")) + "</td><td>" + U.num(c.members.length) + '</td><td><div class="row-actions"><button class="icon-btn" data-edit="' + c.id + '">✏️ ' + E(T("a_edit")) + '</button><button class="icon-btn danger" data-del="' + c.id + '">🗑</button></div></td></tr>').join("") +
      "</tbody></table></div></div><div class='panel form-panel' id='cform' hidden></div>";
    const form = body.querySelector("#cform");
    function openForm(rec) {
      form.hidden = false;
      const members = rec ? rec.members.map(m => Object.assign({}, m)) : [{ id: "m" + Date.now(), name_bn: "", name_en: "", position_key: "member", position_bn: "", position_en: "", photo: null, bio_bn: "", bio_en: "", joined: new Date().getFullYear(), active: true }];
      const keys = ["president", "vp", "gs", "joint_gs", "treasurer", "sports_sec", "org_sec", "member"];
      function drawRows() {
        form.innerHTML = '<div class="panel-head"><h2>' + (rec ? "✏️" : "＋") + " " + E(T("a_committee")) + ' (' + U.num(rec ? rec.year : "") + ')</h2><button class="icon-btn" id="cc">✕</button></div>' +
          '<form class="admin-form"><div class="form-row"><div class="fld"><label>' + E(T("year")) + '</label><input id="c-year" type="number" value="' + (rec ? rec.year : new Date().getFullYear()) + '"></div>' +
          '<div class="fld"><label>' + E(lbl("label_bn")) + '</label><input id="c-label-bn" value="' + E(rec ? rec.label_bn || "" : "") + '"></div>' +
          '<div class="fld full"><label>' + E(lbl("label_en")) + '</label><input id="c-label-en" value="' + E(rec ? rec.label_en || "" : "") + '"></div></div>' +
          '<h3>' + E(T("members")) + '</h3><div class="edit-rows" id="m-rows">' +
          members.map((m, i) => memberRow(m, i)).join("") + "</div>" +
          '<div style="display:flex;gap:10px;margin:12px 0"><button type="button" class="btn btn--outline btn--sm" id="add-m">＋ ' + E(T("a_add_new")) + '</button><button class="btn btn--primary" type="submit">' + E(T("a_save")) + "</button></div></form>";
        form.querySelector("#cc").addEventListener("click", () => { form.hidden = true; });
        form.querySelectorAll("[data-mi]").forEach(el => el.addEventListener("input", () => {
          const i = +el.dataset.mi, f = el.dataset.mf;
          if (f === "active") members[i][f] = el.checked;
          else if (f === "joined") members[i][f] = parseInt(el.value, 10) || 0;
          else members[i][f] = el.value;
        }));
        form.querySelectorAll("[data-mimg]").forEach(inp => inp.addEventListener("change", () => {
          const file = inp.files[0]; if (!file) return;
          resizeImage(file, 600).then(d => { members[+inp.dataset.mimg].photo = d; inp.closest(".edit-row").querySelector("img").src = d; });
        }));
        form.querySelectorAll("[data-rmm]").forEach(b => b.addEventListener("click", () => { members.splice(+b.dataset.rmm, 1); drawRows(); }));
        form.querySelector("#add-m").addEventListener("click", () => { members.push({ id: "m" + Date.now() + Math.random().toString(36).slice(2, 5), name_bn: "", name_en: "", position_key: "member", position_bn: "", position_en: "", photo: null, bio_bn: "", bio_en: "", joined: new Date().getFullYear(), active: true }); drawRows(); });
        form.querySelector("form").addEventListener("submit", e => {
          e.preventDefault();
          const data = { year: parseInt(form.querySelector("#c-year").value, 10) || new Date().getFullYear(), label_bn: form.querySelector("#c-label-bn").value.trim(), label_en: form.querySelector("#c-label-en").value.trim(), members: members };
          if (rec) S.put("committee", rec.id, data); else S.add("committee", data);
          U.toast("✓ " + T("a_saved")); form.hidden = true; render();
        });
      }
      function memberRow(m, i) {
        return '<div class="edit-row" style="grid-template-columns:70px 1.2fr 1.2fr 1fr 1fr 90px 70px auto">' +
          '<img src="' + E(m.photo || U.avatar(m.name_bn || "?", m.id)) + '" alt="" style="width:52px;height:52px;border-radius:50%">' +
          '<input data-mi="' + i + '" data-mf="name_bn" placeholder="' + E(lbl("name_bn")) + '" value="' + E(m.name_bn || "") + '">' +
          '<input data-mi="' + i + '" data-mf="name_en" placeholder="' + E(lbl("name_en")) + '" value="' + E(m.name_en || "") + '">' +
          '<input data-mi="' + i + '" data-mf="position_bn" placeholder="' + E(lbl("position_bn")) + '" value="' + E(m.position_bn || "") + '">' +
          '<input data-mi="' + i + '" data-mf="position_en" placeholder="' + E(lbl("position_en")) + '" value="' + E(m.position_en || "") + '">' +
          '<select data-mi="' + i + '" data-mf="position_key">' + keys.map(k => '<option value="' + k + '"' + (k === m.position_key ? " selected" : "") + ">" + k + "</option>").join("") + "</select>" +
          '<input data-mi="' + i + '" data-mf="joined" type="number" value="' + (m.joined || "") + '">' +
          '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-mi="' + i + '" data-mf="active"' + (m.active ? " checked" : "") + '> ✓</label>' +
          '<input type="file" accept="image/*" data-mimg="' + i + '" style="max-width:150px">' +
          '<button type="button" class="icon-btn danger" data-rmm="' + i + '">🗑</button></div>';
      }
      drawRows();
    }
    body.querySelector("#add-comm").addEventListener("click", () => openForm(null));
    body.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => openForm(S.get("committee", b.dataset.edit))));
    body.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => { if (confirm(T("a_confirm_delete"))) { S.del("committee", b.dataset.del); render(); } }));
  }

  /* ---------------- gallery ---------------- */
  function gallerySection(body) {
    const albums = S.list("gallery");
    body.innerHTML = '<div class="panel"><div class="panel-head"><h2>' + E(T("a_gallery")) + '</h2><button class="btn btn--primary btn--sm" id="add-alb">＋ ' + E(T("a_add_new")) + '</button></div>' +
      '<div class="tbl-wrap"><table class="admin-table"><thead><tr><th>' + E(T("date")) + '</th><th>' + E(lbl("title_bn")) + '</th><th>' + E(T("year")) + '</th><th>' + E(T("photos")) + '</th><th></th></tr></thead><tbody>' +
      albums.map(g => "<tr><td>" + U.fmtDate(g.date) + "</td><td>" + E(U.L(g, "title")) + "</td><td>" + U.num(g.year) + "</td><td>" + U.num(g.photos.length) + '</td><td><div class="row-actions"><button class="icon-btn" data-edit="' + g.id + '">✏️ ' + E(T("a_edit")) + '</button><button class="icon-btn danger" data-del="' + g.id + '">🗑</button></div></td></tr>').join("") +
      "</tbody></table></div></div><div class='panel form-panel' id='gform' hidden></div>";
    const form = body.querySelector("#gform");
    function openForm(rec) {
      form.hidden = false;
      const photos = rec ? rec.photos.map(p => Object.assign({}, p)) : [];
      function drawRows() {
        form.innerHTML = '<div class="panel-head"><h2>' + (rec ? "✏️" : "＋") + " " + E(T("albums")) + '</h2><button class="icon-btn" id="gc">✕</button></div>' +
          '<form class="admin-form"><div class="form-row">' +
          '<div class="fld"><label>' + E(lbl("title_bn")) + '</label><input id="g-title-bn" value="' + E(rec ? rec.title_bn || "" : "") + '"></div>' +
          '<div class="fld"><label>' + E(lbl("title_en")) + '</label><input id="g-title-en" value="' + E(rec ? rec.title_en || "" : "") + '"></div>' +
          '<div class="fld"><label>' + E(T("date")) + '</label><input id="g-date" type="date" value="' + E(rec ? rec.date : "") + '"></div>' +
          '<div class="fld"><label>' + E(T("year")) + '</label><input id="g-year" type="number" value="' + (rec ? rec.year : new Date().getFullYear()) + '"></div>' +
          '<div class="fld"><label>' + E(lbl("event_id")) + '</label><select id="g-event"><option value="">—</option>' + relOpts("events").map(o => '<option value="' + o.v + '"' + (rec && rec.event_id === o.v ? " selected" : "") + ">" + E(o.l) + "</option>").join("") + "</select></div>" +
          '<div class="fld"><label>' + E(lbl("tournament_id")) + '</label><select id="g-tour"><option value="">—</option>' + relOpts("tournaments").map(o => '<option value="' + o.v + '"' + (rec && rec.tournament_id === o.v ? " selected" : "") + ">" + E(o.l) + "</option>").join("") + "</select></div></div>" +
          '<h3>' + E(T("photos")) + '</h3><div class="edit-rows" id="p-rows">' +
          photos.map((p, i) => '<div class="edit-row" style="grid-template-columns:70px 1fr 1fr auto"><img src="' + E(p.src || U.img(p.id || i, 70, 52, "")) + '" alt="" style="width:66px;height:50px;border-radius:8px;object-fit:cover">' +
            '<input data-pi="' + i + '" data-pf="caption_bn" placeholder="' + E(lbl("caption_bn")) + '" value="' + E(p.caption_bn || "") + '">' +
            '<input data-pi="' + i + '" data-pf="caption_en" placeholder="' + E(lbl("caption_en")) + '" value="' + E(p.caption_en || "") + '">' +
            '<input type="file" accept="image/*" data-pimg="' + i + '" style="max-width:150px"><button type="button" class="icon-btn danger" data-rmp="' + i + '">🗑</button></div>').join("") + "</div>" +
          '<div style="display:flex;gap:10px;margin:12px 0"><button type="button" class="btn btn--outline btn--sm" id="add-p">＋ ' + E(T("a_upload")) + '</button><button class="btn btn--primary" type="submit">' + E(T("a_save")) + "</button></div></form>";
        form.querySelector("#gc").addEventListener("click", () => { form.hidden = true; });
        form.querySelectorAll("[data-pi]").forEach(el => el.addEventListener("input", () => { photos[+el.dataset.pi][el.dataset.pf] = el.value; }));
        form.querySelectorAll("[data-pimg]").forEach(inp => inp.addEventListener("change", () => {
          const file = inp.files[0]; if (!file) return;
          resizeImage(file, 1400).then(d => { photos[+inp.dataset.pimg].src = d; inp.closest(".edit-row").querySelector("img").src = d; });
        }));
        form.querySelectorAll("[data-rmp]").forEach(b => b.addEventListener("click", () => { photos.splice(+b.dataset.rmp, 1); drawRows(); }));
        form.querySelector("#add-p").addEventListener("click", () => { photos.push({ id: "ph" + Date.now() + Math.random().toString(36).slice(2, 5), src: null, caption_bn: "", caption_en: "" }); drawRows(); });
        form.querySelector("form").addEventListener("submit", e => {
          e.preventDefault();
          const data = {
            title_bn: form.querySelector("#g-title-bn").value.trim(), title_en: form.querySelector("#g-title-en").value.trim(),
            date: form.querySelector("#g-date").value, year: parseInt(form.querySelector("#g-year").value, 10) || new Date().getFullYear(),
            event_id: form.querySelector("#g-event").value || null, tournament_id: form.querySelector("#g-tour").value || null,
            cover: null, photos: photos
          };
          if (rec) S.put("gallery", rec.id, data); else S.add("gallery", data);
          U.toast("✓ " + T("a_saved")); form.hidden = true; render();
        });
      }
      drawRows();
    }
    body.querySelector("#add-alb").addEventListener("click", () => openForm(null));
    body.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => openForm(S.get("gallery", b.dataset.edit))));
    body.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => { if (confirm(T("a_confirm_delete"))) { S.del("gallery", b.dataset.del); render(); } }));
  }

  /* ---------------- years ---------------- */
  function yearsSection(body) {
    function draw() {
      const years = S.years();
      body.innerHTML = '<div class="panel"><h2>' + E(T("a_years")) + '</h2><p class="muted small">' + E(T("archive_sub")) + "</p>" +
        '<div class="chip-input"><input id="new-year" type="number" placeholder="' + E(T("a_year_add")) + '"><button class="btn btn--primary btn--sm" id="add-year">＋</button></div>' +
        '<div class="year-tabs">' + years.map(y => '<span class="year-tab is-active">' + U.num(y) + ' <button class="icon-btn danger" data-rm="' + y + '" style="margin-inline-start:6px">✕</button></span>').join("") + "</div></div>";
      body.querySelector("#add-year").addEventListener("click", () => {
        const v = parseInt(body.querySelector("#new-year").value, 10);
        if (!v) return;
        const set = Array.from(new Set([...years, v])).sort((a, b) => b - a);
        S.saveSettings({ years: set }); draw(); U.toast("✓ " + T("a_saved"));
      });
      body.querySelectorAll("[data-rm]").forEach(b => b.addEventListener("click", () => {
        const set = years.filter(y => y !== +b.dataset.rm);
        S.saveSettings({ years: set }); draw();
      }));
    }
    draw();
  }

  /* ---------------- donations ---------------- */
  async function donationsSection(body) {
    const subs = await S.fetchSubs("donation");
    const methods = S.donation().methods;
    const total = subs.filter(s => s.status === "verified").reduce((a, s) => a + (parseFloat(s.amount) || 0), 0);
    body.innerHTML = '<div class="stat-cards">' +
      '<div class="stat-card"><div class="n">' + U.money(total) + '</div><div class="l">' + E(T("a_verified")) + '</div></div>' +
      '<div class="stat-card"><div class="n">' + U.num(subs.filter(s => s.status !== "verified").length) + '</div><div class="l">' + E(T("a_pending_donations")) + '</div></div>' +
      '<div class="stat-card"><div class="n">' + U.num(subs.length) + '</div><div class="l">' + E(T("a_donations_title")) + '</div></div></div>' +
      '<div class="panel"><div class="panel-head"><h2>' + E(T("a_donations_title")) + '</h2><button class="btn btn--outline btn--sm" id="csv-don">⬇ ' + E(T("a_export_csv")) + '</button></div>' +
      '<div class="tbl-wrap"><table class="admin-table"><thead><tr><th>' + E(T("a_timestamp")) + '</th><th>' + E(T("a_donor")) + '</th><th>' + E(T("a_amount")) + '</th><th>' + E(T("a_method")) + '</th><th>' + E(T("a_txn")) + '</th><th>' + E(T("status")) + '</th><th></th></tr></thead><tbody>' +
      (subs.length ? subs.map(s => "<tr><td>" + U.fmtStamp(s.ts) + "</td><td>" + E(s.name) + (s.anonymous ? ' <span class="badge">' + E(T("a_anon")) + "</span>" : "") + "<br><span class='muted small'>" + E(s.phone || "") + (s.email ? " · " + E(s.email) : "") + "</span></td><td><strong>" + U.money(s.amount) + "</strong></td><td>" + E(s.method) + "</td><td>" + E(s.txn) + "</td><td>" +
        (s.status === "verified" ? '<span class="badge ok">' + E(T("a_verified")) + '</span>' : '<span class="badge wait">' + E(T("a_pending")) + '</span>') + "</td><td><div class='row-actions'>" +
        (s.status !== "verified" ? '<button class="icon-btn" data-verify="' + s.id + '">✓ ' + E(T("a_verify")) + "</button>" : "") +
        '<button class="icon-btn danger" data-del="' + s.id + '">🗑</button></div></td></tr>').join("") : '<tr><td colspan="7"><div class="empty-state">' + E(T("a_donations_title")) + " — " + E(T("donate_form_title")) + "</div></td></tr>") +
      "</tbody></table></div></div>" +
      '<div class="panel"><h2>' + E(T("a_method_settings")) + '</h2><form class="admin-form" id="methods-form">' +
      methods.map((m, i) => {
        if (m.id === "bank") {
          return '<h3 style="margin-top:14px">🏦 ' + E(m.name_bn) + '</h3><div class="form-row">' +
            ["bank_name", "branch", "account_name", "account_number", "routing", "swift"].map(f => '<div class="fld"><label>' + E(lbl(f)) + '</label><input data-mi="' + i + '" data-mf="' + f + '" value="' + E(m[f] || "") + '"></div>').join("") + "</div>";
        }
        return '<h3 style="margin-top:14px">' + E(m.name_bn) + '</h3><div class="form-row">' +
          '<div class="fld"><label>' + E(T("number")) + '</label><input data-mi="' + i + '" data-mf="number" value="' + E(m.number || "") + '"></div>' +
          '<div class="fld"><label>' + E(lbl("type_bn")) + '</label><input data-mi="' + i + '" data-mf="type_bn" value="' + E(m.type_bn || "") + '"></div>' +
          '<div class="fld full"><label>' + E(lbl("instructions_bn")) + '</label><textarea data-mi="' + i + '" data-mf="instructions_bn">' + E(m.instructions_bn || "") + "</textarea></div></div>";
      }).join("") +
      '<button class="btn btn--primary" type="submit">' + E(T("a_save")) + "</button></form></div>";
    body.querySelectorAll("[data-verify]").forEach(b => b.addEventListener("click", () => { S.putSub("donation", b.dataset.verify, { status: "verified" }); U.toast("✓ " + T("a_verified")); donationsSection(body); }));
    body.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => { if (confirm(T("a_confirm_delete"))) { S.delSub("donation", b.dataset.del); donationsSection(body); } }));
    body.querySelector("#csv-don").addEventListener("click", () => {
      const rows = [["timestamp", "name", "phone", "email", "amount", "method", "txn_id", "anonymous", "status"]];
      subs.forEach(s => rows.push([new Date(s.ts).toISOString(), s.name, s.phone, s.email || "", s.amount, s.method, s.txn, s.anonymous ? "yes" : "no", s.status]));
      U.download("donations-" + new Date().toISOString().slice(0, 10) + ".csv", U.bom + U.csv(rows), "text/csv;charset=utf-8");
    });
    body.querySelector("#methods-form").addEventListener("submit", e => {
      e.preventDefault();
      const next = S.donation().methods.map(m => Object.assign({}, m));
      body.querySelectorAll("[data-mi]").forEach(el => { const i = +el.dataset.mi, f = el.dataset.mf; next[i][f] = el.value; });
      S.saveSettings({ donation: Object.assign({}, S.donation(), { methods: next }) });
      U.toast("✓ " + T("a_saved"));
    });
  }
  function exportDonationsCSV() {
    const rows = [["timestamp", "name", "phone", "email", "amount", "method", "txn_id", "anonymous", "status"]];
    S.subs("donation").forEach(s => rows.push([new Date(s.ts).toISOString(), s.name, s.phone, s.email || "", s.amount, s.method, s.txn, s.anonymous ? "yes" : "no", s.status]));
    U.download("donations-" + new Date().toISOString().slice(0, 10) + ".csv", U.bom + U.csv(rows), "text/csv;charset=utf-8");
  }

  /* ---------------- contact submissions ---------------- */
  async function submissionsSection(body) {
    const subs = await S.fetchSubs("contact");
    body.innerHTML = '<div class="panel"><div class="panel-head"><h2>' + E(T("a_submissions_title")) + ' <span class="count-pill">' + U.num(subs.length) + '</span></h2><button class="btn btn--outline btn--sm" id="csv-con">⬇ ' + E(T("a_export_csv")) + '</button></div>' +
      '<div class="tbl-wrap"><table class="admin-table"><thead><tr><th>' + E(T("a_timestamp")) + '</th><th>' + E(T("a_sender")) + '</th><th>' + E(T("a_subject_col")) + '</th><th>' + E(T("a_message_col")) + '</th><th></th></tr></thead><tbody>' +
      (subs.length ? subs.map(s => "<tr><td>" + U.fmtStamp(s.ts) + "</td><td><strong>" + E(s.name) + "</strong><br><span class='muted small'>" + E(s.phone) + " · " + E(s.email) + "</span></td><td>" + E(s.subject) + "</td><td style='max-width:340px'>" + E(s.message.length > 140 ? s.message.slice(0, 140) + "…" : s.message) + "</td><td><div class='row-actions'><button class='icon-btn danger' data-del='" + s.id + "'>🗑</button></div></td></tr>").join("") : '<tr><td colspan="5"><div class="empty-state">' + E(T("a_submissions_title")) + "</div></td></tr>") +
      "</tbody></table></div></div>";
    body.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => { if (confirm(T("a_confirm_delete"))) { S.delSub("contact", b.dataset.del); submissionsSection(body); } }));
    body.querySelector("#csv-con").addEventListener("click", () => {
      const rows = [["timestamp", "name", "phone", "email", "subject", "message"]];
      subs.forEach(s => rows.push([new Date(s.ts).toISOString(), s.name, s.phone, s.email, s.subject, s.message]));
      U.download("contact-submissions-" + new Date().toISOString().slice(0, 10) + ".csv", U.bom + U.csv(rows), "text/csv;charset=utf-8");
    });
  }

  /* ---------------- settings ---------------- */
  function settingsSection(body) {
    const site = S.site(), stats = S.stats(), st = S.settings();
    body.innerHTML = '<div class="panel form-panel"><h2>' + E(T("a_site_settings")) + '</h2><form class="admin-form" id="site-form"><div class="form-row">' +
      '<div class="fld"><label>' + E(lbl("name_bn")) + '</label><input id="s-name-bn" value="' + E(site.name_bn) + '"></div>' +
      '<div class="fld"><label>' + E(lbl("name_en")) + '</label><input id="s-name-en" value="' + E(site.name_en) + '"></div>' +
      '<div class="fld"><label>' + E(T("address")) + ' (বাংলা)</label><input id="s-addr-bn" value="' + E(site.contact.address_bn) + '"></div>' +
      '<div class="fld"><label>' + E(T("address")) + ' (English)</label><input id="s-addr-en" value="' + E(site.contact.address_en) + '"></div>' +
      '<div class="fld"><label>' + E(T("phone_label")) + '</label><input id="s-phone" value="' + E(site.contact.phone) + '"></div>' +
      '<div class="fld"><label>' + E(T("email_label")) + '</label><input id="s-email" value="' + E(site.contact.email) + '"></div>' +
      ["facebook", "instagram", "youtube", "threads"].map(k => '<div class="fld"><label>' + k + '</label><input id="s-' + k + '" value="' + E(site.contact[k] || "") + '"></div>').join("") +
      "</div><button class='btn btn--primary' type='submit'>" + E(T("a_save")) + "</button></form></div>" +
      '<div class="panel form-panel"><h2>' + E(T("a_stats_settings")) + '</h2><form class="admin-form" id="stats-form"><div class="form-row">' +
      [["events", "a_upcoming_events"], ["tournaments", "a_tournaments"], ["players", "a_total_players"], ["committee", "a_committee_members"], ["years", "a_years"]].map(([k, kk]) =>
        '<div class="fld"><label>' + E(T(kk)) + '</label><input type="number" id="st-' + k + '" value="' + (stats[k] || 0) + '"></div>').join("") +
      '</div><button class="btn btn--primary" type="submit">' + E(T("a_save")) + "</button></form></div>" +
      '<div class="panel form-panel"><h2>' + E(T("a_password_change")) + '</h2><form class="admin-form" id="pw-form"><div class="fld"><label>' + E(T("a_new_password")) + '</label><input id="np" type="password" minlength="6" required></div><button class="btn btn--primary" type="submit">' + E(T("a_save")) + "</button></form></div>" +
      '<div class="panel"><h2>💾 ' + E(T("a_export_json")) + " / " + E(T("a_import_json")) + '</h2>' +
      '<p class="muted small">' + E(T("a_local_note")) + '</p>' +
      '<div class="fld" style="max-width:420px"><label>সার্ভার API কী / Server API key (ADMIN_PASSWORD)</label><div style="display:flex;gap:8px"><input id="api-key" value="' + E(localStorage.getItem("spus_api_key") || "") + '"><button class="btn btn--outline btn--sm" type="button" id="save-key">' + E(T("a_save")) + '</button></div><p class="muted small">সার্ভার মোডে জমা পড়তে ও যাচাই/ডিলিট করতে এই কী লাগবে। / Required to read & verify server-mode submissions.</p></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn--outline btn--sm" id="exp">⬇ ' + E(T("a_export_json")) + '</button>' +
      '<label class="btn btn--ghost btn--sm">⬆ ' + E(T("a_import_json")) + '<input type="file" id="imp" accept=".json" hidden></label>' +
      '<button class="btn btn--outline btn--sm" id="reset">♻ ' + E(T("a_reset_demo")) + "</button></div></div>";
    body.querySelector("#site-form").addEventListener("submit", e => {
      e.preventDefault();
      const g = id => body.querySelector(id).value.trim();
      S.saveSettings({ site: { name_bn: g("#s-name-bn"), name_en: g("#s-name-en"), contact: { address_bn: g("#s-addr-bn"), address_en: g("#s-addr-en"), phone: g("#s-phone"), email: g("#s-email"), facebook: g("#s-facebook"), instagram: g("#s-instagram"), youtube: g("#s-youtube"), threads: g("#s-threads") } } });
      U.toast("✓ " + T("a_saved"));
    });
    body.querySelector("#stats-form").addEventListener("submit", e => {
      e.preventDefault();
      const patch = {};
      ["events", "tournaments", "players", "committee", "years"].forEach(k => { patch[k] = parseInt(body.querySelector("#st-" + k).value, 10) || 0; });
      S.saveSettings({ stats: patch });
      U.toast("✓ " + T("a_saved"));
    });
    body.querySelector("#pw-form").addEventListener("submit", async e => {
      e.preventDefault();
      await S.changePassword(body.querySelector("#np").value);
      body.querySelector("#np").value = "";
      U.toast("✓ " + T("a_password_change") + " — " + T("a_saved"));
    });
    body.querySelector("#save-key").addEventListener("click", () => {
      localStorage.setItem("spus_api_key", body.querySelector("#api-key").value.trim());
      U.toast("✓ " + T("a_saved"));
    });
    body.querySelector("#exp").addEventListener("click", () => {
      U.download("spus-data-backup-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(S.exportAll(), null, 2), "application/json");
    });
    body.querySelector("#imp").addEventListener("change", e => {
      const f = e.target.files[0]; if (!f) return;
      const fr = new FileReader();
      fr.onload = () => { try { S.importAll(JSON.parse(fr.result)); U.toast("✓ " + T("a_import_ok")); render(); } catch (err) { U.toast(T("a_import_err"), "error"); } };
      fr.readAsText(f);
    });
    body.querySelector("#reset").addEventListener("click", () => {
      if (confirm(T("a_reset_confirm"))) { S.resetDemo(); U.toast("♻ " + T("a_saved")); render(); }
    });
  }

  /* ---------------- dashboard ---------------- */
  async function dashSection(body) {
    const news = S.list("news"), events = S.list("events"), tours = S.list("tournaments"), players = S.list("players");
    const comms = S.list("committee");
    const subs = await S.fetchSubs("contact"), dons = await S.fetchSubs("donation");
    const memberCount = comms.reduce((a, c) => a + c.members.length, 0);
    const verified = dons.filter(d => d.status === "verified").reduce((a, d) => a + (parseFloat(d.amount) || 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = events.filter(e => e.date >= today && e.status !== "cancelled").length;
    const activeTours = tours.filter(t => t.status === "ongoing" || t.status === "registration_open").length;
    body.innerHTML = '<div class="stat-cards">' +
      [["a_total_news", U.num(news.length)], ["a_upcoming_events", U.num(upcoming)], ["a_active_tournaments", U.num(activeTours)], ["a_total_players", U.num(players.length)], ["a_committee_members", U.num(memberCount)], ["a_total_donations", U.money(verified)], ["a_contact_messages", U.num(subs.length)], ["a_pending_donations", U.num(dons.filter(d => d.status !== "verified").length)]]
        .map(([k, v]) => '<div class="stat-card"><div class="n">' + v + '</div><div class="l">' + E(T(k)) + "</div></div>").join("") + "</div>" +
      '<div class="panel"><h2>' + E(T("a_latest_submissions")) + ' — ' + E(T("a_submissions")) + '</h2><div class="tbl-wrap"><table class="admin-table"><tbody>' +
      (subs.slice(0, 5).map(s => "<tr><td>" + U.fmtStamp(s.ts) + "</td><td><strong>" + E(s.name) + "</strong></td><td>" + E(s.subject) + "</td></tr>").join("") || '<tr><td class="muted">—</td></tr>') +
      "</tbody></table></div></div>" +
      '<div class="panel"><h2>' + E(T("a_latest_submissions")) + ' — ' + E(T("a_donations")) + '</h2><div class="tbl-wrap"><table class="admin-table"><tbody>' +
      (dons.slice(0, 5).map(d => "<tr><td>" + U.fmtStamp(d.ts) + "</td><td><strong>" + E(d.name) + "</strong></td><td>" + U.money(d.amount) + " · " + E(d.method) + "</td><td>" + (d.status === "verified" ? '<span class="badge ok">' + E(T("a_verified")) + '</span>' : '<span class="badge wait">' + E(T("a_pending")) + "</span>") + "</td></tr>").join("") || '<tr><td class="muted">—</td></tr>') +
      "</tbody></table></div></div>";
  }

  /* ---------------- image resize ---------------- */
  function resizeImage(file, max) {
    return new Promise(resolve => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.82));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  document.addEventListener("DOMContentLoaded", render);
})();
