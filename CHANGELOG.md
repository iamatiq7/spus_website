# Changelog — শান্তিনগর পল্লী উন্নয়ন সমিতি website

All notable changes to the site. Dates in Asia/Dhaka. Live: https://iamatiq7.github.io/spus_website/

## 2026-09-29 — Live completion & verification pass
- **Fix (High):** 4.2 s blank-page boot delay on every page (content-probe fallback waited 4 s
  unconditionally). Boot now resolves as soon as the probe settles → first render ~130–730 ms.
- **Fix (Low):** removed per-page console noise (optional-probe 404s) — `content.json` placeholder
  shipped; `/api/ping` probe skipped on GitHub Pages.
- **Fix (Medium, a11y):** WCAG AA contrast pass — footer text, amber placeholder values, team badges,
  fixture "VS", Nagad chip, 404 watermark. axe-core: zero violations afterwards (Lighthouse a11y 100).
- **Fix (Medium, a11y):** heading order (footer headings, hidden section headings on events/players/
  gallery) and invalid `role="tablist"` on archive/tournament link menus.
- **Fix (Low, a11y):** admin page landmarks (`<main>` + `<h1>`) — axe-clean login & dashboard.
- **Fix (Low):** detail pages (article/player/tournament/event) now set unique `document.title`; article page
  also updates its meta description.
- **Docs:** `live-verification-2026-09-29.md` full live test report; this changelog; handover/readme
  updates (placeholder + rollback).
- Commits: `8d0f64e`, `5f98926`, `b73fdce`, `9de9b41` (merges `a5c4f48`, `5919290`, `a136a7d`, `3681f5e`).
- Tags: `pre-fix-2026-09-29`, `pre-fix-a11y-2026-09-29`, `pre-fix-titles-2026-09-29`.

## 2026-09-14 — Deployment verified
- Final push completed (remote `main` = `1551b64`); GitHub Pages verified live: sitemap/canonical/OG on
  the final domain; content system live in `store.min.js`.
- Commit `14bd6e4` (completion report update). Rollback tag: `backup-before-live-update` (`94f78aa`).

## 2026-09-09 — Content publish flow + performance/SEO
- `content.json` live-update system (admin edits → export → commit for all visitors).
- Performance: non-blocking fonts, system Bengali font stack, minified bundles (`*.min.js`),
  `content-visibility`; Lighthouse 96/96/100/100 at the time.
- SEO: final domain in sitemap/robots/canonical/OG (`iamatiq7.github.io/spus_website`).

## 2026-09-08 — Initial release
- Full community portal: home, about, news, events, sports, fixtures, results, players, committee,
  archive, gallery, donate, contact, search, legal pages, 404; bilingual বাংলা/English; admin dashboard
  (localStorage overlay + optional Node backend); forms with validation; CSV exports.
- `94f78aa` initial commit — verified with a 39-URL crawl, 77 functional assertions, admin suite and
  responsive checks (`verification.md`).
