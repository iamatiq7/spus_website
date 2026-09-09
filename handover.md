# Handover — শান্তিনগর পল্লী উন্নয়ন সমিতি ওয়েবসাইট

Everything a non-developer admin needs to run this website long-term.

## 1. Where things live

| What | Where |
|---|---|
| Live preview URL | the AutoClaw preview link for this project (shareable over HTTPS). After you click **Publish** in the app, the stable URL replaces the preview. |
| All content | stored in the browser (admin edits) on top of the seed dataset `assets/js/data.js` |
| Contact form submissions | Admin → **যোগাযোগ বার্তা** (every message, timestamped) |
| Donation submissions | Admin → **দান** (with যাচাই / verify button) |
| Payment numbers | Admin → **দান → পেমেন্ট মাধ্যমের তথ্য** |
| Homepage statistics | Admin → **সেটিংস → হোমপেজ পরিসংখ্যান** |
| Admin password | Admin → **সেটিংস → পাসওয়ার্ড পরিবর্তন** |

## 2. Admin login

1. Open the site → footer → **অ্যাডমিন** (or `/admin.html`).
2. Default credentials: username `admin`, password `spus2026` — **change immediately** in Settings.
3. The password is stored as a SHA-256 hash in the browser; it never appears in the source code.

## 3. Editing content (no developer needed)

- Every section of the admin sidebar maps to a public page:
  - **সংবাদ** → News (set প্রকাশিত status, featured flag, category, year)
  - **ইভেন্ট / ঘোষণা / কমিটি / গ্যালারি / খেলোয়াড় / দল / টুর্নামেন্ট / ফিক্সচার / ফলাফল / পয়েন্ট তালিকা** → respective pages
  - **বছর** → add new years (e.g. 2027); the Yearly Archive picks them up automatically
- Images: use the upload field in any edit form — uploads are auto-resized and stored with the record.
- Committee is **year-based**: create a new committee entry for each year; old ones stay browsable in the archive.
- Results connect to fixtures: add the fixture first, then the result (fixture link optional).

## 4. Where submissions live & how to export

**Static preview mode** (AutoClaw preview): submissions are saved in the visitor browser's `localStorage`
(`spus_submissions` key) — i.e., they persist per browser/device. This is fine for demo, **but for real operation
run the Node backend** so every submission from every visitor lands in one server-side database file.

**Server mode** (`node server/server.js` on your own hosting):
- Storage file: `server/data/db.json` (`contact[]`, `donation[]` — each record has `ts` timestamp)
- Admin can view/verify/delete in the dashboard; CSV export buttons are on both panels
- Server-side CSV: `GET /api/export/contact.csv`, `/api/export/donations.csv` (Basic auth `ADMIN_USER/ADMIN_PASSWORD`)
- Back up by copying `server/data/db.json`

## 5. Deploying updates

- **AutoClaw preview:** ask the assistant to update the site; it redeploys automatically.
- **Own hosting (recommended for production):**
  1. Copy this folder to the host (any static host, or Node host for the backend).
  2. Static-only: any static server (nginx/Apache/Netlify) serving these files works.
  3. With backend: `node server/server.js` behind a process manager (`pm2 start server/server.js`).
  4. Set env vars from `server/.env.example` (PORT, ADMIN_PASSWORD). Never commit the real `.env`.
  5. Point your domain, enable HTTPS (Let's Encrypt), then update the domain inside `sitemap.xml` and `robots.txt`.

## 6. Credentials & secrets inventory

| Item | Location |
|---|---|
| Admin dashboard password | set in browser at first login (hashed); default `spus2026` documented in README — change it |
| Server admin password | `server/.env` → `ADMIN_PASSWORD` (you create this file; it is excluded from uploads/commits) |
| Payment numbers | Admin → দান section (no secrets in code) |
| No API keys are required anywhere | — |

## 7. Replacing demo data

See [PLACEHOLDERS.md](PLACEHOLDERS.md) for the full checklist of demo/placeholder items. The fastest path:
log in as admin, edit each section, and delete demo records you replace. A full reset is available in
**সেটিংস → ডেমো ডেটা রিসেট** (restores the original seed dataset).

## 8. Known limitations

- Static-preview admin edits live in that browser only until exported/imported elsewhere (JSON backup in Settings).
- Online payment gateways (bKash API etc.) are intentionally not integrated; the donation flow is manual-verify by design.
- Lighthouse scores depend on the hosting CDN; the site itself ships zero libraries and inlines nothing heavy.
