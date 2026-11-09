# শান্তিনগর পল্লী উন্নয়ন সমিতি — Official Community Website

A complete, mobile-first community portal for **Shantinagar Polli Unnayan Somiti** (শান্তিনগর পল্লী উন্নয়ন সমিতি).
Primary language **Bangla (বাংলা)** with an **English** switcher (বাংলা | English, Bangla default).

> ⚠️ Demo content: all team/player/member names, statistics, news and history entries are **demo data** and clearly
> marked on the site (`ডেমো তথ্য` chips). Real organization info (phone, email, address, bKash/Nagad/Rocket numbers,
> bank details) is intentionally left as `[ADD ...]` placeholders — see [PLACEHOLDERS.md](PLACEHOLDERS.md).

## What's inside

| Area | Details |
|---|---|
| Public site | Home, About (+ history timeline), News (listing + article), Events, **Yearly Archive**, Sports, Tournament detail (fixtures/results/standings/players/stats tabs), Fixtures (card+list views), Results, Players (+ profiles with sport-specific stats), Committee (year-based), Gallery (albums + lightbox), Donate (bKash/Nagad/Rocket/Bank + manual transaction form), Contact (form + info), Search, Privacy/Terms, 404 |
| Admin dashboard | `admin.html` — role-gated CRUD for news, events, notices, years, sports, tournaments, teams, players, fixtures, results, standings, committee, gallery; donations verification; contact-message log with **CSV export**; site settings, homepage stats, password change, JSON backup/restore |
| Data layer | `assets/js/data.js` = seed demo dataset; every admin edit is stored as a browser-local overlay (`localStorage`) and can be **exported/imported as JSON** |
| Submissions | Contact + donation forms store every submission **with timestamp** in a persistent record: browser `localStorage` in the static preview, or the included Node backend when self-hosted |
| Optional backend | `server/` — dependency-free Node.js app with real JSON-file storage + Basic-auth API (see below) |
| SEO | Per-page titles/descriptions, Open Graph + Twitter cards, `sitemap.xml`, `robots.txt`, SVG favicon, OG image |

## Run locally (static preview)

Any static file server works. Examples (run from this folder):

```bash
# Python
python -m http.server 8080
# or Node (with the included backend, recommended — real submission storage)
node server/server.js        # → http://localhost:3000
```

Open `http://localhost:8080` (or `:3000`).

## Admin login

- URL: `/admin.html`
- Default demo credentials: **admin / spus2026** (change in Settings → পাসওয়ার্ড পরিবর্তন; stored SHA-256 hashed in the browser)
- Roles: Super Admin (all), Editor (news/events/notices/gallery/messages), Sports Manager (tournaments…standings), Donation Manager (donations). Role is assigned when signing in as Super Admin via Settings.

> The static preview's login is browser-level (demo-grade). For real protection, self-host with the included Node
> backend and keep the admin panel behind your host's access control (or extend `server/server.js` with sessions).

## Optional Node backend (real persistent submissions)

```bash
copy server\.env.example server\.env   # fill ADMIN_PASSWORD
node server/server.js
```

- `POST /api/contact`, `POST /api/donation` — public form endpoints (validated, size-limited)
- `GET/PATCH/DELETE /api/contact…`, `GET/PATCH/DELETE /api/donation…` — admin (HTTP Basic auth)
- `GET /api/export/contact.csv`, `/api/export/donations.csv` — CSV export
- Storage: `server/data/db.json`; env config in `server/.env` (never committed)
- The frontend detects the server automatically (`/api/ping`) and switches from localStorage to API storage.

## Project structure

```
├── index.html … 404.html      # 20 static pages (JS-rendered content, Bangla default)
├── admin.html                 # admin dashboard shell
├── assets/
│   ├── css/style.css          # design system (Preset "11 Build" × community green)
│   ├── css/admin.css
│   ├── js/i18n.js             # বাংলা/English UI strings
│   ├── js/data.js             # demo dataset (single source of seed content)
│   ├── js/store.js            # overlay CRUD, submissions, auth, export/import
│   ├── js/ui.js               # header/footer, cards, lightbox, placeholders, CSV
│   ├── js/main.js             # all public page renderers
│   ├── js/admin.js            # admin dashboard
│   └── img/                   # logo, favicon, og-image
├── server/                    # optional production backend (Node, no deps)
├── sitemap.xml, robots.txt
├── PLACEHOLDERS.md            # what to replace with real information
├── HANDOVER.md                # how to maintain: edit, deploy, submissions
└── VERIFICATION.md            # test report (responsive/browser/perf/a11y/forms)
```

## Tech notes & known limitations

- Pure HTML/CSS/JS — **no build step, no framework, no external JS libraries** (fast, auditable).
- Bangla font: Hind Siliguri via Google Fonts (system Bengali fonts as fallback; works offline with degraded typography).
- Detail pages use query params (`article.html?item=slug`) — SEO-friendly rewrite rules can be added at the host
  (the included Node server already falls back unknown paths to `index.html`).
- Online payments are **not** processed: manual payment + transaction verification by design (gateway-ready architecture).
- `sitemap.xml`/`robots.txt` ship with a placeholder domain — update the domain after pointing real hosting (see HANDOVER.md).
