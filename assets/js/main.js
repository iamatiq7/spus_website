/* Public site renderers — one function per page (body[data-page]). */
(function () {
  const S = window.SPUS_STORE, U = window.SPUS_UI;
  const T = k => U.t(k), E = U.esc, H = s => U.nl2br(s);
  const PAGES = {};

  /* ================= helpers ================= */
  function sel(id, opts, val, allLabel) {
    return '<select id="' + id + '" aria-label="' + E(allLabel || T("all")) + '"><option value="">' + E(allLabel || T("all")) + "</option>" +
      opts.map(o => '<option value="' + E(o.v) + '"' + (o.v === val ? " selected" : "") + ">" + E(o.l) + "</option>").join("") + "</select>";
  }
  function sectionHead(title, link, linkKey) {
    return '<div class="section-head"><h2>' + E(title) + "</h2>" + (link ? '<a class="btn btn--ghost btn--sm" href="' + link + '">' + E(T(linkKey || "view_all")) + " →</a>" : "") + "</div>";
  }
  function empty(key) { return '<div class="empty-state">' + E(T(key)) + "</div>"; }
  function byDateDesc(a, b, f) { f = f || "date"; return (b[f] || "").localeCompare(a[f] || ""); }
  function teamById(list, id) { return list.find(t => t.id === id) || { name_bn: "?", name_en: "?", short: "?", color: "#999" }; }
  function publishedNews() { return S.list("news").filter(n => (n.status || "published") === "published"); }
  function upcomingEvents() {
    return S.list("events").filter(e => e.status === "upcoming" || e.status === "ongoing").sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }
  function currentTournament() { return S.list("tournaments").find(t => t.status === "ongoing") || S.list("tournaments").filter(t => t.status !== "completed").sort(byDateDesc)[0]; }
  function shareLinks(url, title) {
    const enc = encodeURIComponent(url), encT = encodeURIComponent(title);
    return '<div class="share-row"><span>' + E(T("follow_us")) + ":</span>" +
      '<a target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + enc + '">Facebook</a>' +
      '<a target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?url=' + enc + "&text=" + encT + '">X</a>' +
      '<a target="_blank" rel="noopener" href="https://wa.me/?text=' + encT + "%20" + enc + '">WhatsApp</a>' +
      '<button type="button" id="copy-link">🔗 ' + E(S.lang() === "bn" ? "লিংক কপি" : "Copy link") + "</button></div>";
  }

  /* ================= HOME ================= */
  PAGES.home = function (main) {
    const site = S.site(), stats = S.stats(), lang = S.lang();
    const now = new Date().toISOString().slice(0, 10);
    const notices = S.list("notices").filter(n => n.published && (!n.end || n.end >= now) && (!n.start || n.start <= now));
    const news = publishedNews().sort(byDateDesc).slice(0, 3);
    const events = upcomingEvents().slice(0, 3);
    const tour = currentTournament();
    const teams = S.list("teams"), players = S.list("players");
    const fixtures = S.list("fixtures").filter(f => tour && f.tournament_id === tour.id && f.status === "scheduled").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 2);
    const results = S.list("results").sort(byDateDesc).slice(0, 2);
    const featured = players.slice(0, 4);
    const committee = S.list("committee").sort((a, b) => b.year - a.year)[0];
    const cMembers = committee ? committee.members.filter(m => ["president", "gs", "treasurer", "sports_sec"].includes(m.position_key)).slice(0, 4) : [];
    const gallery = S.list("gallery").sort(byDateDesc)[0];
    const photos = gallery ? gallery.photos.slice(0, 8).map(p => Object.assign({ album: gallery.id }, p)) : [];

    let html = "";
    /* notices */
    if (notices.length) {
      html += '<div class="notice-bar" role="region" aria-label="' + E(T("notices_title")) + '"><div class="container notice-inner"><span class="notice-label">' + E(T("notices_title")) + ':</span><div class="notice-scroll">' +
        notices.map(n => '<span class="notice-item' + (n.priority === "high" ? " is-high" : "") + '">' + (n.priority === "high" ? '<b class="chip chip--high">' + E(T("notice_high")) + "</b>" : "") + E(U.L(n, "title")) + "</span>").join("") +
        '</div></div></div>';
    }
    /* hero */
    html += '<section class="hero"><div class="container hero-inner">' +
      '<p class="hero-kicker">' + E(lang === "en" ? site.name_en : site.name_bn) + "</p>" +
      '<h1>' + E(T("hero_title")) + "</h1>" +
      '<p class="hero-sub">' + E(T("hero_sub")) + "</p>" +
      '<div class="hero-actions"><a class="btn btn--outline" href="about.html">' + E(T("hero_btn_about")) + '</a><a class="btn btn--primary" href="donate.html">' + E(T("hero_btn_donate")) + "</a></div>" +
      "</div></section>";

    /* news */
    html += '<section class="section">' + sectionHead(T("sec_news"), "news.html", "view_all_news") +
      '<div class="grid grid--3">' + (news.length ? news.map(U.newsCard).join("") : empty("empty_news")) + "</div></section>";

    /* events */
    html += '<section class="section section--tint">' + sectionHead(T("sec_events"), "events.html") +
      '<div class="grid grid--3">' + (events.length ? events.map(U.eventCard).join("") : empty("empty_events")) + "</div></section>";

    /* tournament */
    if (tour) {
      const sport = S.list("sports").find(s => s.id === tour.sport_id) || {};
      const st = S.list("standings").find(s => s.tournament_id === tour.id);
      const champ = tour.champion_team_id ? teamById(teams, tour.champion_team_id) : null;
      const runner = tour.runnerup_team_id ? teamById(teams, tour.runnerup_team_id) : null;
      html += '<section class="section">' + sectionHead(T("sec_tournament"), "tournament.html?t=" + encodeURIComponent(tour.slug), "view_tournament") +
        '<div class="card tournament-card">' +
        '<div class="tournament-card-media"><img loading="lazy" src="' + U.recordImage(tour, 560, 420) + '" alt=""></div>' +
        '<div class="tournament-card-body"><div class="card-meta">' + U.statusChip(tour.status) + " <span class='chip chip--cat'>" + E(sport.icon + " " + U.L(sport, "name")) + "</span></div>" +
        "<h3>" + E(U.L(tour, "name")) + "</h3>" +
        '<ul class="fact-list">' +
        "<li><span>" + E(T("year")) + "</span><strong>" + U.num(tour.year) + "</strong></li>" +
        "<li><span>" + E(T("teams_count")) + "</span><strong>" + U.num(tour.teams_count) + "</strong></li>" +
        "<li><span>" + E(T("venue")) + "</span><strong>" + E(U.L(tour, "venue")) + "</strong></li>" +
        (champ ? "<li><span>" + E(T("champion")) + "</span><strong>" + E(U.L(champ, "name")) + "</strong></li>" : "") +
        (runner ? "<li><span>" + E(T("runner_up")) + "</span><strong>" + E(U.L(runner, "name")) + "</strong></li>" : "") +
        (st ? "<li><span>" + E(T("tab_standings")) + "</span><strong>" + (st.rows[0] ? E(U.L(teamById(teams, st.rows[0].team_id), "name")) + " · " + U.num(st.rows[0].points) + " " + E(T("points")) : "—") + "</strong></li>" : "") +
        "</ul>" +
        '<p class="muted">' + E(U.L(tour, "desc")) + " " + U.demoChip + "</p>" +
        '<div class="fixture-list">' + (fixtures.length ? fixtures.map(f => U.fixtureCard(f, teams)).join("") : "") + (results.length ? results.map(r => U.resultCard(r, teams)).join("") : "") + "</div>" +
        '<a class="btn btn--outline" href="tournament.html?t=' + encodeURIComponent(tour.slug) + '">' + E(T("view_tournament")) + " →</a>" +
        "</div></div></section>";
    }

    /* players */
    html += '<section class="section section--tint">' + sectionHead(T("sec_players"), "players.html") +
      '<div class="grid grid--4">' + (featured.length ? featured.map(U.playerCard).join("") : empty("empty_players")) + "</div></section>";

    /* committee */
    if (cMembers.length) {
      html += '<section class="section">' + sectionHead(T("sec_committee"), "committee.html", "view_full_committee") +
        '<div class="grid grid--4">' + cMembers.map(U.memberCard).join("") + "</div></section>";
    }

    /* stats */
    html += '<section class="section stats-band"><div class="container"><h2>' + E(T("stats_title")) + '</h2><div class="grid grid--5 stats-grid">' +
      [["stats_events", stats.events], ["stats_tournaments", stats.tournaments], ["stats_players", stats.players], ["stats_committee", stats.committee], ["stats_years", stats.years]]
        .map(([k, v]) => '<div class="stat"><span class="stat-num" data-count="' + v + '">' + U.num(v) + "</span><span class='stat-label'>" + E(T(k)) + "</span></div>").join("") +
      "</div></div></section>";

    /* donation cta */
    html += '<section class="section donate-cta"><div class="container donate-cta-inner"><div><h2>' + E(T("donate_cta_title")) + "</h2><p>" + E(T("donate_cta_sub")) + '</p><ul class="check-list">' +
      ["dh1", "dh2", "dh3", "dh4", "dh5", "dh6"].map(k => "<li>" + E(T(k)) + "</li>").join("") +
      '</ul></div><a class="btn btn--primary btn--lg" href="donate.html">' + E(T("donate_cta_btn")) + " →</a></div></section>";

    /* gallery */
    html += '<section class="section">' + sectionHead(T("sec_gallery"), "gallery.html", "view_all_photos") +
      (photos.length ? '<div class="gallery-grid">' + photos.map((p, i) => '<button class="gallery-item" data-lb="' + gallery.id + '" data-idx="' + i + '"><img loading="lazy" src="' + (p.src || U.img(p.id, 400, 300, "")) + '" alt="' + E(U.L(p, "caption")) + '"></button>').join("") + "</div>" : empty("empty_gallery")) +
      "</section>";
    main.innerHTML = html;
    main.querySelectorAll("[data-lb]").forEach(btn => btn.addEventListener("click", () => {
      const alb = S.list("gallery").find(g => g.id === btn.dataset.lb);
      U.lightbox(alb.photos.map(p => Object.assign({ album: alb.id }, p)), parseInt(btn.dataset.idx, 10));
    }));
  };

  /* ================= ABOUT ================= */
  PAGES.about = function (main) {
    const ab = S.about(), lang = S.lang();
    const tl = S.timeline().slice().sort((a, b) => a.year - b.year);
    main.innerHTML = '<section class="page-hero"><div class="container"><p class="kicker">' + E(T("about_kicker")) + "</p><h1>" + E(T("about_title")) + "</h1></div></section>" +
      '<section class="section"><div class="container about-grid">' +
      '<div class="card pad"><h2>' + E(T("mission")) + "</h2><p>" + H(U.pick(ab.mission_bn, ab.mission_en)) + "</p></div>" +
      '<div class="card pad"><h2>' + E(T("vision")) + "</h2><p>" + H(U.pick(ab.vision_bn, ab.vision_en)) + "</p></div>" +
      '<div class="card pad"><h2>' + E(T("objectives")) + "</h2><p>" + H(U.pick(ab.objectives_bn, ab.objectives_en)) + "</p></div>" +
      "</div></section>" +
      '<section class="section section--tint"><div class="container"><h2>' + E(T("act_community")) + "</h2><p>" + E(U.pick(ab.act_community_bn, ab.act_community_en)) + "</p>" +
      "<h2>" + E(T("act_sports")) + "</h2><p>" + E(U.pick(ab.act_sports_bn, ab.act_sports_en)) + "</p>" +
      "<h2>" + E(T("act_welfare")) + "</h2><p>" + E(U.pick(ab.act_welfare_bn, ab.act_welfare_en)) + "</p>" +
      '<p class="muted">ℹ️ ' + E(U.pick(ab.note_bn, ab.note_en)) + "</p></div></section>" +
      '<section class="section"><div class="container"><h2>' + E(T("timeline")) + '</h2><ol class="timeline">' +
      (tl.length ? tl.map(t => '<li><div class="tl-year">' + U.num(t.year) + '</div><div class="tl-body"><h3>' + E(U.L(t, "title")) + "</h3><p>" + E(U.L(t, "desc")) + "</p></div></li>").join("") : empty("empty_notices")) +
      "</ol></div></section>";
  };

  /* ================= NEWS ================= */
  PAGES.news = function (main) {
    let list = publishedNews();
    const q = U.qs("q") || "", cat = U.qs("cat") || "", yr = U.qs("year") || "", pg = parseInt(U.qs("p") || "1", 10);
    if (q) { const k = q.toLowerCase(); list = list.filter(n => (U.L(n, "title") + " " + U.L(n, "excerpt") + " " + U.L(n, "body")).toLowerCase().includes(k)); }
    if (cat) list = list.filter(n => n.category === cat);
    if (yr) list = list.filter(n => String(n.year) === yr);
    list.sort(byDateDesc);
    const cats = ["community", "sports", "events", "development", "announcement", "general"];
    const years = S.years();
    const featured = !q && !cat && !yr ? list[0] : null;
    const rest = featured ? list.slice(1) : list;
    const per = 6, pages = Math.max(1, Math.ceil(rest.length / per)), cur = Math.min(pg, pages), slice = rest.slice((cur - 1) * per, cur * per);
    main.innerHTML = '<section class="page-hero"><div class="container"><h1>' + E(T("news_title")) + "</h1></div></section>" +
      '<section class="section"><div class="container">' +
      '<div class="filter-bar"><form class="filter-search" id="nf"><input type="search" name="q" value="' + E(q) + '" placeholder="' + E(T("news_search_ph")) + '"><button class="btn btn--sm btn--outline" type="submit">' + E(T("search_btn")) + "</button></form>" +
      sel("f-cat", cats.map(c => ({ v: c, l: T("cat_" + c) })), cat, T("all_categories")) +
      sel("f-year", years.map(y => ({ v: y, l: U.num(y) })), yr, T("all_years")) + "</div>" +
      (featured ? '<article class="card featured-news"><a class="card-media" href="article.html?item=' + E(featured.slug || featured.id) + '" tabindex="-1" aria-hidden="true"><img loading="lazy" src="' + U.recordImage(featured, 900, 480) + '" alt=""></a><div class="card-body"><div class="card-meta">' + U.catChip(featured.category) + '<time datetime="' + E(featured.date) + '">' + U.fmtDate(featured.date) + '</time><span class="chip chip--high">' + E(T("featured")) + "</span></div><h2><a href=\"article.html?item=" + E(featured.slug || featured.id) + '">' + E(U.L(featured, "title")) + '</a></h2><p class="muted">' + E(U.L(featured, "excerpt")) + '</p><a class="text-link" href="article.html?item=' + E(featured.slug || featured.id) + '">' + E(T("read_more")) + " →</a></div></article>" : "") +
      '<div class="grid grid--3">' + (slice.length ? slice.map(U.newsCard).join("") : empty("empty_news")) + "</div>" +
      (pages > 1 ? '<nav class="pager" aria-label="Pagination">' + Array.from({ length: pages }, (_, i) => {
        const p2 = i + 1; const sp = new URLSearchParams(location.search); sp.set("p", p2);
        return '<a class="' + (p2 === cur ? "is-current" : "") + '" href="news.html?' + sp.toString() + '">' + U.num(p2) + "</a>";
      }).join("") + "</nav>" : "") +
      "</div></section>";
    bindFilters(["f-cat", "f-year"], ["cat", "year"], "news.html");
    document.getElementById("nf").addEventListener("submit", e => { e.preventDefault(); location.href = "news.html?q=" + encodeURIComponent(e.target.q.value); });
  };

  /* ================= ARTICLE ================= */
  PAGES.article = function (main) {
    const idOrSlug = U.qs("item") || "";
    const n = publishedNews().find(x => x.slug === idOrSlug || x.id === idOrSlug);
    if (!n) { main.innerHTML = notFound(); return; }
    const related = publishedNews().filter(x => x.id !== n.id && x.category === n.category).slice(0, 3);
    const url = location.href;
    main.innerHTML = '<article class="article container">' +
      '<a class="text-link" href="news.html">← ' + E(T("back_news")) + "</a>" +
      '<div class="card-meta" style="margin:1rem 0">' + U.catChip(n.category) + '<time datetime="' + E(n.date) + '">' + U.fmtDate(n.date) + "</time> · " + E(T("author")) + ": " + E(U.L(n, "author")) + "</div>" +
      "<h1>" + E(U.L(n, "title")) + "</h1>" +
      '<img class="article-cover" loading="lazy" src="' + U.recordImage(n, 1100, 560) + '" alt="' + E(U.L(n, "title")) + '">' +
      '<p class="article-lede">' + E(U.L(n, "excerpt")) + "</p>" +
      '<div class="article-body">' + H(U.L(n, "body")) + "</div>" +
      shareLinks(url, U.L(n, "title")) + "</article>" +
      (related.length ? '<section class="section"><div class="container">' + sectionHead(T("article_related"), null) + '<div class="grid grid--3">' + related.map(U.newsCard).join("") + "</div></div></section>" : "");
    document.getElementById("copy-link").addEventListener("click", () => { navigator.clipboard.writeText(url).then(() => U.toast("✓ " + T("copied"))); });
  };

  /* ================= EVENTS ================= */
  PAGES.events = function (main) {
    let list = S.list("events");
    const yr = U.qs("year") || "", st = U.qs("status") || "", item = U.qs("item") || "";
    if (item) {
      const ev = list.find(e => e.id === item || e.slug === item);
      if (!ev) { main.innerHTML = notFound(); return; }
      main.innerHTML = '<article class="article container"><a class="text-link" href="events.html">← ' + E(T("events_title")) + "</a>" +
        '<div class="card-meta" style="margin:1rem 0">' + U.statusChip(ev.status) + "</div><h1>" + E(U.L(ev, "title")) + "</h1>" +
        '<img class="article-cover" loading="lazy" src="' + U.recordImage(ev, 1100, 560) + '" alt="">' +
        '<ul class="fact-list fact-list--row">' +
        "<li><span>📅 " + E(T("date")) + "</span><strong>" + U.fmtDate(ev.date) + (ev.end_date && ev.end_date !== ev.date ? " – " + U.fmtDate(ev.end_date) : "") + "</strong></li>" +
        "<li><span>🕘 " + E(T("time")) + "</span><strong>" + U.num(ev.time_start || "—") + (ev.time_end ? " – " + U.num(ev.time_end) : "") + "</strong></li>" +
        "<li><span>📍 " + E(T("event_location")) + "</span><strong>" + E(U.L(ev, "location")) + "</strong></li>" +
        "<li><span>🧑‍🤝‍🧑 " + E(T("organizer")) + "</span><strong>" + E(U.L(ev, "organizer")) + "</strong></li></ul>" +
        '<div class="article-body"><p>' + H(U.L(ev, "desc")) + "</p></div></article>";
      return;
    }
    if (yr) list = list.filter(e => String(e.year) === yr);
    if (st) list = list.filter(e => e.status === st);
    list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const years = S.years(), statuses = ["upcoming", "ongoing", "completed", "cancelled"];
    main.innerHTML = '<section class="page-hero"><div class="container"><h1>' + E(T("events_title")) + "</h1></div></section>" +
      '<section class="section"><div class="container">' +
      '<div class="filter-bar">' + sel("f-year", years.map(y => ({ v: y, l: U.num(y) })), yr, T("all_years")) +
      sel("f-status", statuses.map(s => ({ v: s, l: T("st_" + s) })), st, T("all_statuses")) + "</div>" +
      '<div class="grid grid--3">' + (list.length ? list.map(U.eventCard).join("") : empty("empty_events")) + "</div></div></section>";
    bindFilters(["f-year", "f-status"], ["year", "status"], "events.html");
  };

  /* ================= ARCHIVE ================= */
  PAGES.archive = function (main) {
    const years = S.years();
    let y = U.qs("y") || String(years[0] || "");
    const tabs = [["news", "tab_news"], ["events", "tab_events"], ["tournaments", "tab_tournaments"], ["fixtures", "tab_fixtures"], ["results", "tab_results"], ["players", "tab_players"], ["committee", "tab_committee"], ["gallery", "tab_gallery"], ["reports", "tab_reports"]];
    const aNews = publishedNews().filter(n => String(n.year) === y).sort(byDateDesc).slice(0, 5);
    const aEvents = S.list("events").filter(e => String(e.year) === y).sort(byDateDesc).slice(0, 5);
    const aTours = S.list("tournaments").filter(t => String(t.year) === y);
    const aFix = S.list("fixtures").filter(f => (f.date || "").slice(0, 4) === y).sort(byDateDesc).slice(0, 5);
    const aRes = S.list("results").filter(r => String(r.year) === y).sort(byDateDesc).slice(0, 5);
    const tourIds = aTours.map(t => t.id);
    const aPlayers = S.list("players").filter(p => tourIds.includes(p.tournament_id)).slice(0, 8);
    const aComm = S.list("committee").filter(c => String(c.year) === y);
    const aGal = S.list("gallery").filter(g => String(g.year) === y);
    const aRep = S.reports().filter(r => String(r.year) === y);
    const teams = S.list("teams");
    function mini(title, key, inner, href, emptyKey, count) {
      return '<div class="card pad archive-block"><div class="section-head"><h2>' + E(title) + ' <span class="count-pill">' + U.num(count) + '</span></h2>' + (href && count ? '<a class="text-link" href="' + href + '">' + E(T("view_all")) + " →</a>" : "") + '</div>' + (count ? inner : empty(emptyKey)) + "</div>";
    }
    main.innerHTML = '<section class="page-hero"><div class="container"><h1>' + E(T("archive_title")) + '</h1><p class="muted">' + E(T("archive_sub")) + '</p></div></section>' +
      '<section class="section"><div class="container">' +
      '<div class="year-tabs" role="tablist">' + years.map(yy => '<a class="year-tab' + (String(yy) === y ? " is-active" : "") + '" href="archive.html?y=' + yy + '">' + U.num(yy) + "</a>").join("") + "</div>" +
      '<div class="archive-grid">' +
      mini(T("tab_news"), "news", '<div class="stack">' + aNews.map(n => '<a class="row-link" href="article.html?item=' + E(n.slug || n.id) + '">' + E(U.L(n, "title")) + '<time>' + U.fmtDate(n.date) + "</time></a>").join("") + "</div>", "news.html?year=" + y, "empty_news", aNews.length) +
      mini(T("tab_events"), "events", '<div class="stack">' + aEvents.map(e => '<a class="row-link" href="events.html?item=' + e.id + '">' + E(U.L(e, "title")) + "<time>" + U.fmtDate(e.date) + "</time></a>").join("") + "</div>", "events.html?year=" + y, "empty_events", aEvents.length) +
      mini(T("tab_tournaments"), "tournaments", '<div class="stack">' + aTours.map(t => '<a class="row-link" href="tournament.html?t=' + E(t.slug) + '">' + E(U.L(t, "name")) + U.statusChip(t.status) + "</a>").join("") + "</div>", "sports.html", "empty_tournaments", aTours.length) +
      mini(T("tab_fixtures"), "fixtures", '<div class="stack">' + aFix.map(f => fixtureRow(f, teams)).join("") + "</div>", "fixtures.html?year=" + y, "empty_fixtures", aFix.length) +
      mini(T("tab_results"), "results", '<div class="stack">' + aRes.map(r => resultRow(r, teams)).join("") + "</div>", "results.html?year=" + y, "empty_results", aRes.length) +
      mini(T("tab_players"), "players", '<div class="grid grid--4">' + aPlayers.map(U.playerCard).join("") + "</div>", "players.html", "empty_players", aPlayers.length) +
      mini(T("tab_committee"), "committee", '<div class="grid grid--4">' + (aComm[0] ? aComm[0].members.map(U.memberCard).join("") : "") + "</div>", "committee.html?year=" + y, "empty_committee", aComm.length) +
      mini(T("tab_gallery"), "gallery", '<div class="grid grid--4">' + aGal.map(g => '<a class="card album-card" href="gallery.html?album=' + g.id + '"><img loading="lazy" src="' + (g.cover || (g.photos[0] && g.photos[0].src) || U.img(g.cover_seed || g.id, 400, 280)) + '" alt=""><div class="card-body"><h3>' + E(U.L(g, "title")) + "</h3><p class='muted'>" + U.num(g.photos.length) + " " + E(T("photos")) + "</p></div></a>").join("") + "</div>", "gallery.html?year=" + y, "empty_gallery", aGal.length) +
      mini(T("tab_reports"), "reports", '<div class="stack">' + aRep.map(r => '<div class="row-link is-static">📄 ' + E(U.L(r, "title")) + U.demoChip + "</div>").join("") + "</div>", null, "empty_results", aRep.length) +
      "</div></div></section>";
  };
  function fixtureRow(f, teams) {
    const a = teamById(teams, f.team_a_id), b = teamById(teams, f.team_b_id);
    return '<div class="row-link is-static">' + E(U.L(a, "name")) + " <b>" + E(T("vs")) + "</b> " + E(U.L(b, "name")) + " <time>" + U.fmtDate(f.date) + " · " + U.statusChip(f.status) + "</time></div>";
  }
  function resultRow(r, teams) {
    const a = teamById(teams, r.team_a_id), b = teamById(teams, r.team_b_id);
    return '<div class="row-link is-static">' + E(U.L(a, "name")) + " <b>" + U.num(r.score_a) + " — " + U.num(r.score_b) + "</b> " + E(U.L(b, "name")) + " <time>" + U.fmtDate(r.date) + "</time></div>";
  }

  /* ================= SPORTS ================= */
  PAGES.sports = function (main) {
    const teams = S.list("teams"), sports = S.list("sports");
    const tours = S.list("tournaments").sort((a, b) => (b.year + b.start_date).localeCompare(a.year + a.start_date));
    const current = tours.filter(t => t.status === "ongoing" || t.status === "upcoming" || t.status === "registration_open");
    const past = tours.filter(t => t.status === "completed" || t.status === "cancelled");
    function tourCard(t) {
      const sp = sports.find(s => s.id === t.sport_id) || {};
      const champ = t.champion_team_id ? U.L(teamById(teams, t.champion_team_id), "name") : null;
      return '<a class="card tournament-mini" href="tournament.html?t=' + E(t.slug) + '">' +
        '<img loading="lazy" src="' + U.recordImage(t, 480, 300) + '" alt="">' +
        '<div class="card-body"><div class="card-meta">' + U.statusChip(t.status) + " <span class='chip chip--cat'>" + E(sp.icon + " " + U.L(sp, "name")) + "</span></div>" +
        "<h3>" + E(U.L(t, "name")) + "</h3>" +
        '<p class="muted">' + U.num(t.year) + " · " + U.num(t.teams_count) + " " + E(T("teams")) + (champ ? " · 🏆 " + E(champ) : "") + "</p></div></a>";
    }
    main.innerHTML = '<section class="page-hero"><div class="container"><h1>' + E(T("sports_title")) + '</h1><p class="muted">' + E(T("sports_sub")) + '</p></div></section>' +
      '<section class="section"><div class="container">' +
      '<div class="sport-chips">' + sports.map(s => '<a class="chip chip--sport" href="fixtures.html?sport=' + s.id + '">' + s.icon + " " + E(U.L(s, "name")) + "</a>").join("") + "</div>" +
      sectionHead(T("current_tournaments"), null) + '<div class="grid grid--2">' + (current.length ? current.map(tourCard).join("") : empty("empty_tournaments")) + "</div>" +
      sectionHead(T("past_tournaments"), null) + '<div class="grid grid--2">' + (past.length ? past.map(tourCard).join("") : empty("empty_tournaments")) + "</div>" +
      "</div></section>";
  };

  /* ================= TOURNAMENT DETAIL ================= */
  PAGES.tournament = function (main) {
    const tours = S.list("tournaments");
    const t = tours.find(x => x.slug === U.qs("t") || x.id === U.qs("t"));
    if (!t) { main.innerHTML = notFound(); return; }
    const teams = S.list("teams"), players = S.list("players"), sports = S.list("sports");
    const sp = sports.find(s => s.id === t.sport_id) || {};
    const tFix = S.list("fixtures").filter(f => f.tournament_id === t.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const tRes = S.list("results").filter(r => r.tournament_id === t.id).sort(byDateDesc);
    const st = S.list("standings").find(s => s.tournament_id === t.id);
    const tPlayers = players.filter(p => p.tournament_id === t.id);
    const albums = S.list("gallery").filter(g => g.tournament_id === t.id);
    const champ = t.champion_team_id ? teamById(teams, t.champion_team_id) : null;
    const runner = t.runnerup_team_id ? teamById(teams, t.runnerup_team_id) : null;
    const tab = U.qs("tab") || "overview";
    const teamMap = {}; teams.forEach(tm => teamMap[tm.id] = tm);
    let body = "";
    if (tab === "overview") {
      body = '<div class="card pad"><ul class="fact-list fact-list--row">' +
        "<li><span>" + E(T("sport")) + "</span><strong>" + E(sp.icon + " " + U.L(sp, "name")) + "</strong></li>" +
        "<li><span>" + E(T("year")) + "</span><strong>" + U.num(t.year) + "</strong></li>" +
        "<li><span>" + E(T("venue")) + "</span><strong>" + E(U.L(t, "venue")) + "</strong></li>" +
        "<li><span>" + E(T("organizer")) + "</span><strong>" + E(U.L(t, "organizer")) + "</strong></li>" +
        "<li><span>" + E(T("teams_count")) + "</span><strong>" + U.num(t.teams_count) + "</strong></li>" +
        (champ ? "<li><span>🏆 " + E(T("champion")) + "</span><strong>" + E(U.L(champ, "name")) + "</strong></li>" : "") +
        (runner ? "<li><span>" + E(T("runner_up")) + "</span><strong>" + E(U.L(runner, "name")) + "</strong></li>" : "") +
        "</ul><p>" + E(U.L(t, "desc")) + "</p>" +
        '<div class="team-chips">' + teams.filter(x => x.sports && x.sports.includes(t.sport_id)).map(x => '<span class="team-badge" style="--c:' + E(x.color) + '">' + E(x.short) + "</span> " + E(U.L(x, "name"))).join(" · ") + "</div></div>";
    } else if (tab === "fixtures") {
      body = tFix.length ? '<div class="grid grid--2">' + tFix.map(f => U.fixtureCard(f, teams)).join("") + "</div>" : empty("empty_fixtures");
    } else if (tab === "results") {
      body = tRes.length ? '<div class="stack">' + tRes.map(r => U.resultCard(r, teams)).join("") + "</div>" : empty("empty_results");
    } else if (tab === "standings") {
      body = st ? standingsTable(st, teamMap, t) : empty("empty_results");
    } else if (tab === "players") {
      body = tPlayers.length ? '<div class="grid grid--4">' + tPlayers.map(U.playerCard).join("") + "</div>" : empty("empty_players");
    } else if (tab === "stats") {
      if (t.stat_columns === "cricket") {
        const top = tPlayers.slice().sort((a, b) => (b.stats.runs || 0) - (a.stats.runs || 0)).slice(0, 5);
        body = '<div class="card pad"><h3>' + E(T("st_runs")) + '</h3><ol class="rank-list">' + top.map(p => "<li><strong>" + E(U.L(p, "name")) + "</strong> <span class='muted'>" + E(U.L(teamMap[p.team_id] || {}, "name")) + " · " + U.num(p.stats.runs) + " " + E(T("st_runs")) + "</span></li>").join("") + "</ol></div>";
      } else {
        const top = tPlayers.slice().sort((a, b) => (b.stats.goals || 0) - (a.stats.goals || 0)).slice(0, 5);
        body = '<div class="card pad"><h3>' + E(T("st_goals")) + '</h3><ol class="rank-list">' + top.map(p => "<li><strong>" + E(U.L(p, "name")) + "</strong> <span class='muted'>" + E(U.L(teamMap[p.team_id] || {}, "name")) + " · " + U.num(p.stats.goals) + " " + E(T("st_goals")) + "</span></li>").join("") + "</ol></div>";
      }
    } else if (tab === "gallery") {
      body = albums.length ? '<div class="grid grid--3">' + albums.map(g => '<a class="card album-card" href="gallery.html?album=' + g.id + '"><img loading="lazy" src="' + (g.cover || (g.photos[0] && g.photos[0].src) || U.img(g.id, 400, 280)) + '" alt=""><div class="card-body"><h3>' + E(U.L(g, "title")) + "</h3><p class='muted'>" + U.num(g.photos.length) + " " + E(T("photos")) + "</p></div></a>").join("") + "</div>" : empty("empty_gallery");
    }
    const tabs = [["overview", "tab_overview"], ["fixtures", "tab_fixtures2"], ["results", "tab_results"], ["standings", "tab_standings"], ["players", "tab_players"], ["stats", "tab_stats2"], ["gallery", "tab_gallery"]];
    main.innerHTML = '<section class="page-hero"><div class="container"><div class="card-meta">' + U.statusChip(t.status) + " <span class='chip chip--cat'>" + E(sp.icon + " " + U.L(sp, "name")) + "</span></div><h1>" + E(U.L(t, "name")) + '</h1><p class="muted">' + U.fmtDate(t.start_date) + " – " + U.fmtDate(t.end_date) + " · " + E(U.L(t, "venue")) + "</p></div></section>" +
      '<section class="section"><div class="container">' +
      '<div class="tabs" role="tablist">' + tabs.map(([k, kk]) => '<a class="tab' + (tab === k ? " is-active" : "") + '" href="tournament.html?t=' + E(t.slug) + "&tab=" + k + '">' + E(T(kk)) + "</a>").join("") + "</div>" +
      body + "</div></section>";
  };
  function standingsTable(st, teamMap, t) {
    const cricket = t.stat_columns === "cricket";
    const rows = st.rows.slice().sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga));
    return '<div class="card pad standings-wrap"><div class="card-meta">' + E(U.pick(st.note_bn, st.note_en) || "") + " " + U.demoChip + "</div>" +
      (cricket
        ? '<table class="table"><thead><tr><th>#</th><th>' + E(T("team")) + "</th><th>" + E(T("played")) + "</th><th>" + E(T("won")) + "</th><th>" + E(T("lost")) + "</th><th>" + E(T("points")) + "</th></tr></thead><tbody>" +
          rows.map((r, i) => "<tr" + (i === 0 ? " class='is-top'" : "") + "><td>" + U.num(i + 1) + "</td><td data-label='" + E(T("team")) + "'>" + E(U.L(teamMap[r.team_id] || {}, "name")) + "</td><td data-label='" + E(T("played")) + "'>" + U.num(r.played) + "</td><td data-label='" + E(T("won")) + "'>" + U.num(r.won) + "</td><td data-label='" + E(T("lost")) + "'>" + U.num(r.lost) + "</td><td data-label='" + E(T("points")) + "'><strong>" + U.num(r.points) + "</strong></td></tr>").join("") + "</tbody></table>"
        : '<table class="table"><thead><tr><th>#</th><th>' + E(T("team")) + "</th><th>" + E(T("played")) + "</th><th>" + E(T("won")) + "</th><th>" + E(T("draw")) + "</th><th>" + E(T("lost")) + "</th><th>" + E(T("gf")) + "</th><th>" + E(T("ga")) + "</th><th>" + E(T("gd")) + "</th><th>" + E(T("points")) + "</th></tr></thead><tbody>" +
          rows.map((r, i) => "<tr" + (i < 2 ? " class='is-top'" : "") + "><td>" + U.num(i + 1) + "</td><td data-label='" + E(T("team")) + "'>" + E(U.L(teamMap[r.team_id] || {}, "name")) + "</td>" +
            [r.played, r.won, r.draw, r.lost, r.gf, r.ga, r.gd, r.points].map((v, j) => "<td data-label='" + E([T("played"), T("won"), T("draw"), T("lost"), T("gf"), T("ga"), T("gd"), T("points")][j]) + "'>" + (j === 7 ? "<strong>" : "") + U.num(v) + (j === 7 ? "</strong>" : "") + "</td>").join("") + "</tr>").join("") + "</tbody></table>") +
      "</div>";
  }

  /* ================= FIXTURES ================= */
  PAGES.fixtures = function (main) {
    const teams = S.list("teams"), tours = S.list("tournaments"), sports = S.list("sports"), years = S.years();
    const yr = U.qs("year") || "", tr = U.qs("t") || "", sp = U.qs("sport") || "", tm = U.qs("team") || "", stt = U.qs("status") || "", v = U.qs("v") || "card";
    let list = S.list("fixtures");
    if (yr) list = list.filter(f => (f.date || "").slice(0, 4) === yr);
    if (tr) list = list.filter(f => f.tournament_id === tr);
    if (sp) list = list.filter(f => f.sport_id === sp);
    if (tm) list = list.filter(f => f.team_a_id === tm || f.team_b_id === tm);
    if (stt) list = list.filter(f => f.status === stt);
    list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const statuses = ["scheduled", "live", "completed", "postponed", "cancelled"];
    main.innerHTML = '<section class="page-hero"><div class="container"><h1>' + E(T("fixtures_title")) + "</h1></div></section>" +
      '<section class="section"><div class="container">' +
      '<div class="filter-bar">' + sel("f-year", years.map(y => ({ v: y, l: U.num(y) })), yr, T("all_years")) +
      sel("f-tour", tours.map(t => ({ v: t.id, l: U.L(t, "name") })), tr, T("all")) +
      sel("f-sport", sports.map(s => ({ v: s.id, l: U.L(s, "name") })), sp, T("all_sports")) +
      sel("f-team", teams.map(t => ({ v: t.id, l: U.L(t, "name") })), tm, T("all_teams")) +
      sel("f-status", statuses.map(s => ({ v: s, l: T("st_" + s) })), stt, T("all_statuses")) +
      '<div class="view-toggle"><a class="chip' + (v === "card" ? " is-active" : "") + '" href="fixtures.html?' + keep(["v", "card"]) + '">▦ ' + E(T("view_card")) + '</a><a class="chip' + (v === "list" ? " is-active" : "") + '" href="fixtures.html?' + keep(["v", "list"]) + '">☰ ' + E(T("view_list")) + "</a></div></div>" +
      (list.length ? (v === "list" ? '<div class="stack">' + list.map(f => fixtureRow(f, teams)).join("") + "</div>" : '<div class="grid grid--2">' + list.map(f => U.fixtureCard(f, teams)).join("") + "</div>") : empty("empty_fixtures")) +
      "</div></section>";
    bindFilters(["f-year", "f-tour", "f-sport", "f-team", "f-status"], ["year", "t", "sport", "team", "status"], "fixtures.html");
    function keep(kv) { const p = new URLSearchParams(location.search); p.set(kv[0], kv[1]); return p.toString(); }
  };

  /* ================= RESULTS ================= */
  PAGES.results = function (main) {
    const teams = S.list("teams"), tours = S.list("tournaments"), sports = S.list("sports"), years = S.years();
    const yr = U.qs("year") || "", tr = U.qs("t") || "", sp = U.qs("sport") || "";
    let list = S.list("results");
    if (yr) list = list.filter(r => String(r.year) === yr);
    if (tr) list = list.filter(r => r.tournament_id === tr);
    if (sp) list = list.filter(r => r.sport_id === sp);
    list.sort(byDateDesc);
    main.innerHTML = '<section class="page-hero"><div class="container"><h1>' + E(T("results_title")) + "</h1></div></section>" +
      '<section class="section"><div class="container">' +
      '<div class="filter-bar">' + sel("f-year", years.map(y => ({ v: y, l: U.num(y) })), yr, T("all_years")) +
      sel("f-tour", tours.map(t => ({ v: t.id, l: U.L(t, "name") })), tr, T("all")) +
      sel("f-sport", sports.map(s => ({ v: s.id, l: U.L(s, "name") })), sp, T("all_sports")) + "</div>" +
      '<div class="stack">' + (list.length ? list.map(r => resultDetail(r, teams)).join("") : empty("empty_results")) + "</div></div></section>";
    bindFilters(["f-year", "f-tour", "f-sport"], ["year", "t", "sport"], "results.html");
    function resultDetail(r, teams) {
      const a = teamById(teams, r.team_a_id), b = teamById(teams, r.team_b_id);
      const winner = r.winner_team_id ? teamById(teams, r.winner_team_id) : null;
      return '<article class="card result-card result-card--detail"><div class="result-scoreline">' +
        '<div class="result-team' + (r.winner_team_id === a.id ? " is-winner" : "") + '"><span class="team-badge" style="--c:' + E(a.color) + '">' + E(a.short) + "</span><strong>" + E(U.L(a, "name")) + "</strong></div>" +
        '<div class="result-score">' + U.num(r.score_a) + "<br><small>" + E(T("vs")) + "</small><br>" + U.num(r.score_b) + "</div>" +
        '<div class="result-team' + (r.winner_team_id === b.id ? " is-winner" : "") + '"><strong>' + E(U.L(b, "name")) + "</strong><span class=\"team-badge\" style=\"--c:" + E(b.color) + '">' + E(b.short) + "</span></div></div>" +
        '<div class="fixture-meta">' + U.fmtDate(r.date) + " · 📍 " + E(U.L(r, "venue")) +
        (winner ? " · 🏆 " + E(T("winner")) + ": <strong>" + E(U.L(winner, "name")) + "</strong>" : " · " + E(T("st_scheduled"))) +
        (r.potm_bn ? " · ⭐ " + E(T("potm")) + ": " + E(U.pick(r.potm_bn, r.potm_en)) : "") + "</div>" +
        (U.L(r, "report") ? '<p class="muted">' + E(U.L(r, "report")) + "</p>" : "") + "</article>";
    }
  };

  /* ================= PLAYERS ================= */
  PAGES.players = function (main) {
    const teams = S.list("teams"), sports = S.list("sports"), tours = S.list("tournaments");
    const sp = U.qs("sport") || "", tm = U.qs("team") || "", tr = U.qs("t") || "", ac = U.qs("active") || "";
    let list = S.list("players");
    if (sp) list = list.filter(p => p.sport_id === sp);
    if (tm) list = list.filter(p => p.team_id === tm);
    if (tr) list = list.filter(p => p.tournament_id === tr);
    if (ac) list = list.filter(p => String(p.active) === ac);
    main.innerHTML = '<section class="page-hero"><div class="container"><h1>' + E(T("players_title")) + "</h1></div></section>" +
      '<section class="section"><div class="container">' +
      '<div class="filter-bar">' + sel("f-sport", sports.map(s => ({ v: s.id, l: U.L(s, "name") })), sp, T("all_sports")) +
      sel("f-team", teams.map(t => ({ v: t.id, l: U.L(t, "name") })), tm, T("all_teams")) +
      sel("f-tour", tours.map(t => ({ v: t.id, l: U.L(t, "name") })), tr, T("all")) +
      sel("f-active", [{ v: "true", l: T("active") }, { v: "false", l: T("inactive") }], ac, T("all")) + "</div>" +
      '<div class="grid grid--4">' + (list.length ? list.map(U.playerCard).join("") : empty("empty_players")) + "</div></div></section>";
    bindFilters(["f-sport", "f-team", "f-tour", "f-active"], ["sport", "team", "t", "active"], "players.html");
  };

  /* ================= PLAYER DETAIL ================= */
  PAGES.player = function (main) {
    const ps = S.list("players");
    const p = ps.find(x => x.slug === U.qs("p") || x.id === U.qs("p"));
    if (!p) { main.innerHTML = notFound(); return; }
    const team = S.list("teams").find(t => t.id === p.team_id) || {};
    const sport = S.list("sports").find(s => s.id === p.sport_id) || {};
    const tours = S.list("tournaments").filter(t => t.id === p.tournament_id);
    const results = S.list("results").filter(r => r.tournament_id === p.tournament_id && (r.team_a_id === p.team_id || r.team_b_id === p.team_id)).sort(byDateDesc);
    const isCricket = sport.score_format === "cricket";
    const statDefs = isCricket
      ? [["st_matches", p.stats.matches], ["st_runs", p.stats.runs], ["st_wickets", p.stats.wickets], ["st_average", p.stats.average], ["st_sr", p.stats.sr]]
      : [["st_matches", p.stats.matches], ["st_goals", p.stats.goals], ["st_assists", p.stats.assists], ["st_yellow", p.stats.yellow], ["st_red", p.stats.red]];
    main.innerHTML = '<section class="page-hero player-hero"><div class="container player-hero-inner">' +
      '<img class="player-hero-photo" src="' + (p.image || U.avatar(U.L(p, "name"), p.id)) + '" alt="' + E(U.L(p, "name")) + '">' +
      '<div><span class="jersey jersey--lg">#' + U.num(p.jersey) + "</span><h1>" + E(U.L(p, "name")) + "</h1>" +
      '<p class="muted">' + E(U.L(p, "position")) + " · " + E(U.L(team, "name")) + " · " + E(sport.icon + " " + U.L(sport, "name")) + " · " + (p.active ? E(T("active")) : E(T("inactive"))) + (p.demo ? " " + U.demoChip : "") + "</p></div></div></section>" +
      '<section class="section"><div class="container">' +
      '<div class="stat-cards">' + statDefs.map(([k, v]) => '<div class="stat"><span class="stat-num">' + U.num(v) + "</span><span class='stat-label'>" + E(T(k)) + "</span></div>").join("") + "</div>" +
      '<div class="card pad" style="margin-top:2rem"><h2>' + E(T("bio")) + "</h2><p>" + E(U.L(p, "bio")) + "</p>" +
      (p.achievements_bn && p.achievements_bn.length ? "<h2>" + E(T("achievements")) + '</h2><ul class="check-list">' + U.pick(p.achievements_bn, p.achievements_en).map(a => "<li>🏅 " + E(a) + "</li>").join("") + "</ul>" : "") + "</div>" +
      '<div class="card pad" style="margin-top:2rem"><h2>' + E(T("tab_tournaments")) + '</h2><div class="stack">' + (tours.length ? tours.map(t => '<a class="row-link" href="tournament.html?t=' + E(t.slug) + '">' + E(U.L(t, "name")) + U.statusChip(t.status) + "</a>").join("") : empty("empty_tournaments")) + "</div></div>" +
      '<div class="card pad" style="margin-top:2rem"><h2>' + E(T("tab_results")) + '</h2><div class="stack">' + (results.length ? results.map(r => resultRow(r, S.list("teams"))).join("") : empty("empty_results")) + "</div></div>" +
      '<a class="text-link" href="players.html">← ' + E(T("players_title")) + "</a></div></section>";
  };

  /* ================= COMMITTEE ================= */
  PAGES.committee = function (main) {
    const comms = S.list("committee").slice().sort((a, b) => b.year - a.year);
    const years = comms.map(c => c.year).sort((a, b) => b - a);
    const yr = parseInt(U.qs("year") || (years[0] || "0"), 10);
    const comm = comms.find(c => c.year === yr) || comms[0];
    const order = ["president", "vp", "gs", "joint_gs", "treasurer", "sports_sec", "org_sec", "member"];
    const members = comm ? comm.members.slice().sort((a, b) => order.indexOf(a.position_key) - order.indexOf(b.position_key)) : [];
    main.innerHTML = '<section class="page-hero"><div class="container"><h1>' + E(T("committee_title")) + '</h1><p class="muted">' + E(T("committee_sub")) + "</p></div></section>" +
      '<section class="section"><div class="container">' +
      '<div class="year-tabs">' + years.map(y => '<a class="year-tab' + (y === yr ? " is-active" : "") + '" href="committee.html?year=' + y + '">' + E(T("year")) + " " + U.num(y) + "</a>").join("") + "</div>" +
      (comm ? "<h2 class='center'>" + E(U.L(comm, "label")) + " " + U.demoChip + "</h2>" + '<div class="grid grid--4">' + members.map(U.memberCard).join("") + "</div>" : empty("empty_committee")) +
      "</div></section>";
  };

  /* ================= GALLERY ================= */
  PAGES.gallery = function (main) {
    const albums = S.list("gallery"), years = S.years(), events = S.list("events");
    const yr = U.qs("year") || "", ev = U.qs("event") || "", ab = U.qs("album") || "";
    if (ab) {
      const album = albums.find(g => g.id === ab);
      if (!album) { main.innerHTML = notFound(); return; }
      const ph = album.photos.map(p => Object.assign({ album: album.id }, p));
      main.innerHTML = '<section class="page-hero"><div class="container"><a class="text-link" href="gallery.html">← ' + E(T("gallery_title")) + "</a><h1>" + E(U.L(album, "title")) + '</h1><p class="muted">' + U.fmtDate(album.date) + " · " + U.num(album.photos.length) + " " + E(T("photos")) + '</p></div></section>' +
        '<section class="section"><div class="container"><div class="gallery-grid">' +
        ph.map((p, i) => '<button class="gallery-item" data-idx="' + i + '"><img loading="lazy" src="' + (p.src || U.img(p.id, 400, 300, "")) + '" alt="' + E(U.L(p, "caption")) + '"></button>').join("") + "</div></div></section>";
      main.querySelectorAll("[data-idx]").forEach(btn => btn.addEventListener("click", () => U.lightbox(ph, parseInt(btn.dataset.idx, 10))));
      return;
    }
    let list = albums;
    if (yr) list = list.filter(g => String(g.year) === yr);
    if (ev) list = list.filter(g => g.event_id === ev || g.tournament_id === ev);
    main.innerHTML = '<section class="page-hero"><div class="container"><h1>' + E(T("gallery_title")) + "</h1></div></section>" +
      '<section class="section"><div class="container">' +
      '<div class="filter-bar">' + sel("f-year", years.map(y => ({ v: y, l: U.num(y) })), yr, T("all_years")) +
      sel("f-event", [].concat(S.list("tournaments"), events).map(x => ({ v: x.id, l: U.L(x, "name") })), ev, T("all")) + "</div>" +
      '<div class="grid grid--3">' + (list.length ? list.map(g => '<a class="card album-card" href="gallery.html?album=' + g.id + '"><img loading="lazy" src="' + (g.cover || (g.photos[0] && g.photos[0].src) || U.img(g.id, 400, 280)) + '" alt=""><div class="card-body"><h3>' + E(U.L(g, "title")) + '</h3><p class="muted">' + U.fmtDate(g.date) + " · " + U.num(g.photos.length) + " " + E(T("photos")) + '</p></div><div class="album-count">▦ ' + U.num(g.photos.length) + "</div></a>").join("") : empty("empty_gallery")) + "</div></div></section>";
    bindFilters(["f-year", "f-event"], ["year", "event"], "gallery.html");
  };

  /* ================= DONATE ================= */
  PAGES.donate = function (main) {
    const d = S.donation(), lang = S.lang();
    const methods = d.methods.filter(m => m.id !== "bank");
    const bank = d.methods.find(m => m.id === "bank");
    function copyBtn(val) { return '<button type="button" class="btn btn--sm btn--outline copy-btn" data-copy="' + E(val) + '">📋 ' + E(T("copy")) + "</button>"; }
    main.innerHTML = '<section class="page-hero"><div class="container"><h1>' + E(T("donate_title")) + '</h1><p class="muted">' + E(d.headline_bn ? U.pick(d.headline_bn, d.headline_en) : T("donate_sub")) + "</p></div></section>" +
      '<section class="section"><div class="container">' +
      '<div class="callout">ℹ️ ' + E(T("donate_manual_note")) + "</div>" +
      "<h2>" + E(T("donate_methods_title")) + '</h2><div class="grid grid--3">' +
      methods.map(m => '<div class="card pad method-card"><div class="method-head"><span class="method-logo method-logo--' + m.id + '">' + E(m.name_bn) + '</span><span class="muted">' + E(U.L(m, "type")) + "</span></div>" +
        '<p class="method-number"><span class="' + (U.isPlaceholder(m.number) ? "ph-value" : "") + '">' + E(m.number) + "</span> " + (U.isPlaceholder(m.number) ? U.phChip : "") + "</p>" +
        copyBtn(m.number) + '<p class="muted small">' + E(U.L(m, "instructions")) + "</p></div>").join("") +
      "</div>" +
      (bank ? '<div class="card pad" style="margin-top:2rem"><h2>🏦 ' + E(U.L(bank, "name")) + '</h2><div class="bank-grid">' +
        [["bank_name", bank.bank_name], ["branch", bank.branch], ["account_name", bank.account_name], ["account_number", bank.account_number], ["routing", bank.routing], ["swift", bank.swift]]
          .map(([k, v]) => '<div class="bank-field"><span>' + E(T(k)) + "</span><strong class='" + (U.isPlaceholder(v) ? "ph-value" : "") + "'>" + E(v) + "</strong> " + (U.isPlaceholder(v) ? U.phChip : "") + "</div>").join("") +
        '</div><p class="muted small">' + E(bank.instructions_bn ? U.L(bank, "instructions") : "") + "</p></div>" : "") +
      '<div class="card pad donation-form-wrap" style="margin-top:2rem"><h2>' + E(T("donate_form_title")) + '</h2><p class="muted">' + E(T("donate_form_sub")) + '</p>' +
      '<form id="donation-form" class="form" novalidate>' +
      '<div class="form-grid">' +
      field("name", T("donor_name"), "text", true) +
      field("phone", T("phone"), "tel", true) +
      field("email", T("email"), "email", false) +
      field("amount", T("amount"), "number", true) +
      '<div class="form-field"><label for="method">' + E(T("payment_method")) + '</label><select id="method" name="method">' + d.methods.map(m => '<option value="' + m.id + '">' + E(m.name_bn) + "</option>").join("") + "</select></div>" +
      field("txn", T("txn_id"), "text", true) + "</div>" +
      '<div class="form-field"><label for="message">' + E(T("msg_optional")) + '</label><textarea id="message" name="message" rows="3"></textarea></div>' +
      '<label class="check"><input type="checkbox" id="anonymous"> ' + E(T("anonymous")) + "</label>" +
      '<button class="btn btn--primary btn--lg" type="submit">' + E(T("submit_donation")) + "</button>" +
      '<p class="form-status" id="df-status" role="status"></p></form></div>' +
      "</div></section>";
    document.getElementById("donation-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const f = e.target, st = document.getElementById("df-status");
      const val = id => f[id].value.trim();
      let ok = true;
      [["name", v => !!v, T("err_required")], ["phone", v => /^[+\d][\d\s-]{6,15}$/.test(v), T("err_phone")], ["email", v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), T("err_email")], ["amount", v => parseFloat(v) > 0, T("err_required")], ["txn", v => !!v, T("err_required")]]
        .forEach(([id, fn, msg]) => {
          const el = f[id]; const bad = !fn(val(id));
          el.classList.toggle("is-invalid", bad);
          if (bad) ok = false;
        });
      if (!ok) { st.textContent = T("err_required"); st.className = "form-status is-error"; return; }
      S.addSub("donation", {
        name: document.getElementById("anonymous").checked ? "(Anonymous)" : val("name"),
        phone: val("phone"), email: val("email"), amount: parseFloat(val("amount")),
        method: f.method.value, txn: val("txn"), message: val("message"),
        anonymous: document.getElementById("anonymous").checked, status: "pending", lang: lang
      }).then(() => {
        st.textContent = "✓ " + T("donate_success"); st.className = "form-status is-success";
        U.toast("✓ " + T("donate_success"));
        f.reset();
      });
    });
    main.querySelectorAll(".copy-btn").forEach(b => b.addEventListener("click", () => { navigator.clipboard.writeText(b.dataset.copy).then(() => { b.textContent = "✓ " + T("copied"); setTimeout(() => { b.innerHTML = "📋 " + T("copy"); }, 1600); }); }));
    function field(id, label, type, req) {
      return '<div class="form-field"><label for="' + id + '">' + E(label) + (req ? ' <span class="req" aria-hidden="true">*</span>' : "") + '</label><input id="' + id + '" name="' + id + '" type="' + type + '"' + (req ? " required" : "") + "></div>";
    }
  };

  /* ================= CONTACT ================= */
  PAGES.contact = function (main) {
    const site = S.site(), lang = S.lang(), c = site.contact;
    const addr = lang === "en" ? c.address_en : c.address_bn;
    const socials = [["facebook", "Facebook"], ["instagram", "Instagram"], ["youtube", "YouTube"], ["threads", "Threads"]].filter(([k]) => c[k]);
    main.innerHTML = '<section class="page-hero"><div class="container"><h1>' + E(T("contact_title")) + '</h1><p class="muted">' + E(T("contact_sub")) + '</p></div></section>' +
      '<section class="section"><div class="container contact-grid">' +
      '<div class="card pad"><h2>' + E(T("contact_info")) + '</h2><ul class="fact-list">' +
      "<li><span>📍 " + E(T("address")) + "</span><strong class='" + (U.isPlaceholder(addr) ? "ph-value" : "") + "'>" + E(addr) + "</strong> " + (U.isPlaceholder(addr) ? U.phChip : "") + "</li>" +
      "<li><span>📞 " + E(T("phone_label")) + "</span><strong class='" + (U.isPlaceholder(c.phone) ? "ph-value" : "") + "'>" + E(c.phone) + "</strong> " + (U.isPlaceholder(c.phone) ? U.phChip : "") + "</li>" +
      "<li><span>✉️ " + E(T("email_label")) + "</span><strong class='" + (U.isPlaceholder(c.email) ? "ph-value" : "") + "'>" + E(c.email) + "</strong> " + (U.isPlaceholder(c.email) ? U.phChip : "") + "</li></ul>" +
      "<h2>" + E(T("social_links")) + "</h2><p class='footer-social'>" + (socials.length ? socials.map(([k, l]) => '<a href="' + E(c[k]) + '" rel="noopener">' + l + "</a>").join(" · ") : '<span class="muted">[Facebook · Instagram · YouTube · Threads]</span> ' + U.phChip) + "</p></div>" +
      '<div class="card pad map-card"><h2>🗺️ ' + E(T("map_note")) + '</h2><div class="map-placeholder" role="img" aria-label="Map placeholder"><span>📍</span><p class="muted">' + E(T("map_note")) + "</p></div></div>" +
      '<div class="card pad contact-form-wrap"><h2>' + E(T("contact_title")) + '</h2>' +
      '<form id="contact-form" class="form" novalidate>' +
      '<div class="form-grid">' +
      '<div class="form-field"><label for="name">' + E(T("donor_name")).replace(T("donor_name"), S.lang() === "bn" ? "নাম" : "Name") + '</label><input id="name" name="name" type="text" required></div>' +
      '<div class="form-field"><label for="phone">' + E(T("phone")) + '</label><input id="phone" name="phone" type="tel" required></div>' +
      '<div class="form-field"><label for="email">' + E(T("email")) + '</label><input id="email" name="email" type="email" required></div>' +
      '<div class="form-field"><label for="subject">' + E(T("subject")) + '</label><input id="subject" name="subject" type="text" required></div></div>' +
      '<div class="form-field"><label for="message">' + E(T("message")) + '</label><textarea id="message" name="message" rows="5" required></textarea></div>' +
      '<button class="btn btn--primary btn--lg" type="submit">' + E(T("send")) + "</button>" +
      '<p class="form-status" id="cf-status" role="status"></p></form></div></div></section>';
    document.getElementById("contact-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const f = e.target, st = document.getElementById("cf-status");
      const val = id => f[id].value.trim();
      let ok = true;
      [["name", v => !!v, T("err_required")], ["phone", v => /^[+\d][\d\s-]{6,15}$/.test(v), T("err_phone")], ["email", v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), T("err_email")], ["subject", v => !!v, T("err_required")], ["message", v => !!v, T("err_required")]]
        .forEach(([id, fn, msg]) => { const bad = !fn(val(id)); f[id].classList.toggle("is-invalid", bad); if (bad) ok = false; });
      if (!ok) { st.textContent = T("err_required"); st.className = "form-status is-error"; return; }
      S.addSub("contact", { name: val("name"), phone: val("phone"), email: val("email"), subject: val("subject"), message: val("message"), status: "new", lang: lang }).then(() => {
        st.textContent = "✓ " + T("contact_success"); st.className = "form-status is-success";
        U.toast("✓ " + T("contact_success"));
        f.reset();
      });
    });
  };

  /* ================= SEARCH ================= */
  PAGES.search = function (main) {
    const q = (U.qs("q") || "").trim(); const k = q.toLowerCase();
    const teams = S.list("teams");
    let out = "";
    function group(title, items) { return items.length ? '<div class="card pad" style="margin-bottom:1.5rem"><h2>' + E(title) + ' <span class="count-pill">' + U.num(items.length) + '</span></h2><div class="stack">' + items.join("") + "</div></div>" : ""; }
    if (q) {
      const news = publishedNews().filter(n => (U.L(n, "title") + " " + U.L(n, "excerpt")).toLowerCase().includes(k)).map(n => '<a class="row-link" href="article.html?item=' + E(n.slug || n.id) + '">📰 ' + E(U.L(n, "title")) + "<time>" + U.fmtDate(n.date) + "</time></a>");
      const evs = S.list("events").filter(e => U.L(e, "title").toLowerCase().includes(k)).map(e => '<a class="row-link" href="events.html?item=' + e.id + '">📅 ' + E(U.L(e, "title")) + "<time>" + U.fmtDate(e.date) + "</time></a>");
      const pls = S.list("players").filter(p => U.L(p, "name").toLowerCase().includes(k)).map(p => '<a class="row-link" href="player.html?p=' + E(p.slug || p.id) + '">🏃 ' + E(U.L(p, "name")) + "</a>");
      const trs = S.list("tournaments").filter(t => U.L(t, "name").toLowerCase().includes(k)).map(t => '<a class="row-link" href="tournament.html?t=' + E(t.slug) + '">🏆 ' + E(U.L(t, "name")) + "</a>");
      const cms = S.list("committee").flatMap(c => c.members.map(m => ({ m, c }))).filter(x => U.L(x.m, "name").toLowerCase().includes(k)).map(x => '<a class="row-link" href="committee.html?year=' + x.c.year + '">🧑‍💼 ' + E(U.L(x.m, "name")) + " — " + E(U.L(x.m, "position")) + " (" + U.num(x.c.year) + ")</a>");
      const gal = S.list("gallery").filter(g => U.L(g, "title").toLowerCase().includes(k)).map(g => '<a class="row-link" href="gallery.html?album=' + g.id + '">🖼️ ' + E(U.L(g, "title")) + "</a>");
      out = group(T("tab_news"), news) + group(T("tab_events"), evs) + group(T("tab_players"), pls) + group(T("tab_tournaments"), trs) + group(T("tab_committee"), cms) + group(T("tab_gallery"), gal);
      if (!out) out = empty("search_none");
    } else out = '<div class="empty-state">' + E(T("search_ph")) + "</div>";
    main.innerHTML = '<section class="page-hero"><div class="container"><h1>' + E(T("search_title")) + '</h1><p class="muted">' + E(T("search_for")) + " “" + E(q) + '”</p></div></section><section class="section"><div class="container">' + out + "</div></section>";
  };

  /* ================= LEGAL / 404 ================= */
  PAGES.privacy = function (main) {
    main.innerHTML = '<section class="page-hero"><div class="container"><h1>' + E(T("privacy_title")) + '</h1><p class="muted">' + U.num(S.list("reports").length ? "" : "") + E(U.fmtDate(window.SPUS_DATA.pages.privacy_updated)) + '</p></div></section><section class="section"><div class="container"><div class="card pad"><p>' + H(T("privacy_body")) + "</p></div></div></section>";
  };
  PAGES.terms = function (main) {
    main.innerHTML = '<section class="page-hero"><div class="container"><h1>' + E(T("terms_title")) + '</h1><p class="muted">' + E(U.fmtDate(window.SPUS_DATA.pages.terms_updated)) + '</p></div></section><section class="section"><div class="container"><div class="card pad"><p>' + H(T("terms_body")) + "</p></div></div></section>";
  };
  PAGES.error = function (main) { main.innerHTML = notFound(); };
  function notFound() {
    return '<section class="section error-page"><div class="container center"><p class="error-code">404</p><h1>' + E(T("err404_title")) + '</h1><p class="muted">' + E(T("err404_sub")) + '</p><a class="btn btn--primary" href="index.html">' + E(T("err404_btn")) + "</a></div></section>";
  }

  /* ================= filter binding ================= */
  function bindFilters(ids, keys, base) {
    ids.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("change", () => {
        const p = new URLSearchParams(location.search);
        const v = el.value; if (v) p.set(keys[i], v); else p.delete(keys[i]);
        p.delete("p");
        location.href = base + (p.toString() ? "?" + p.toString() : "");
      });
    });
  }

  /* ================= boot ================= */
  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page || "error";
    U.boot(main => (PAGES[page] || PAGES.error)(main));
  });
})();
