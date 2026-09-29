# Live verification — শান্তিনগর পল্লী উন্নয়ন সমিতি website
### Session of 2026-09-29 · live site: https://iamatiq7.github.io/spus_website/

**Scope:** complete the remaining work on the `iamatiq7/spus_website` repository, test every page and
feature on the **live** site (not localhost), fix everything found, redeploy, and re-verify.

**Method:** headless-browser CDP harnesses (Chrome, Edge) + geckodriver (Firefox) + HTTP crawling +
SHA-256 byte-comparison of live vs repo + axe-core 4.10.2 + Google Lighthouse 13.5 + targeted
screenshot review. All evidence files are kept in the delivery workspace
(`.cluster/spus-20260929/evidence/`: JSON results, logs, screenshots).

---

## 1. Result summary

| Suite (all against the LIVE site) | Result |
|---|---|
| Page loads: 17 pages + 3 detail pages + 404 handling | **21/21 pass** — 0 console errors, 0 failed requests, 0 broken images, no horizontal overflow |
| Interactions & forms & admin (Chrome) | **27/27 effective** (26/27 in the run; the single "fail" was a headless test artifact — copy button re-verified PASS with a trusted input event, clipboard content read back successfully) |
| Responsive: 7 pages × 360 / 768 / 1024 / 1440 px | **30/30 pass** — no overflow, no broken images, mobile menu correct at every breakpoint |
| Accessibility (axe-core): 19 pages incl. tournament detail, 404, admin login + dashboard | **0 violations** (after fixes; was 10 pages with serious contrast + 5 heading/ARIA findings) |
| Lighthouse (mobile, live homepage) | Performance **97** · Accessibility **100** · Best Practices **100** · SEO **100** · LCP 1.4 s · CLS 0 · 50 KiB |
| Cross-browser | Chrome: full suite (pages 21/21, interactions 27/27 effective, responsive 30/30, axe clean). Edge: pages 21/21 + interactions 27/27. Firefox: 17/17 flows (renders, language switch, lightbox, both forms, admin login) |
| Live vs repo integrity | 40/40 files byte-identical (SHA-256) after deploy |
| Forms → retrievable record | Donation + contact submissions stored with timestamps; visible in Admin panels; CSV export downloads a real file containing the records; `content.json` export valid |
| Page speed (boot) | first render **~130–730 ms** (was ~4,200 ms before the fix) |

## 2. Repository audit (before changes)

- **Repo:** [github.com/iamatiq7/spus_website](https://github.com/iamatiq7/spus_website) (public) — the
  Shantinagar Polli Unnayan Somiti community portal. Clone at `C:\Users\Administrator\Documents\GitHub\shantinagar-somiti-website`.
- **Stack:** pure static HTML/CSS/JS, no framework, no build step. Pages render client-side into `#main`.
  Optional Node backend (`server/`) for self-hosting form collection. Admin dashboard (`admin.html`) with
  browser-local overlay editing + `content.json` publish flow. Bilingual বাংলা (default) / English.
- **State found:** fully committed and pushed (`14bd6e4`), GitHub Pages live and serving the repo build.
  Remaining work was: deep end-to-end verification of the live site, fixing everything found, and
  finishing the verification/handover documentation.
- **Hosting:** GitHub Pages (deploys automatically from `main`).

## 3. Defects found and fixed (this session)

| # | Severity | Defect | Fix | Commits |
|---|---|---|---|---|
| 1 | **High** | Every page showed a blank screen for **~4.2 s** before rendering. `ready()` always waited the full 4 s fallback because the optional `content.json` probe failed on static hosting. | Boot now resolves as soon as the content probe settles (success *or* failure). | `8d0f64e` (merge `a5c4f48`) |
| 2 | Low | Browser console showed 2 network-error lines per page load (`content.json`, `/api/ping` 404s from feature probes). | Shipped a documented `content.json` placeholder file; `/api/ping` probe is skipped on `*.github.io` where no server can exist. Console is now fully clean. | `8d0f64e` |
| 3 | Medium | axe **serious** contrast failures in 6 patterns: footer muted text (2.23–2.95:1), amber placeholder values (3.04–3.18:1), team badges (2.74–4.4:1), fixture "VS" (3.18:1), Nagad logo (2.32:1), 404 watermark (1.07:1). | Darkened the text colors / scoped tokens to WCAG AA (≥4.5:1, ≥3:1 for large text) without changing layout or brand feel. | `5f98926` (merge `5919290`) |
| 4 | Medium | axe **moderate** heading-order issues on events / gallery / players / search / 404 (h1 → h3 jumps). | Footer column headings `<h3>`→`<h2>`; added visually-hidden `<h2>` before the events/players/gallery card grids. | `5f98926` |
| 5 | Medium | axe **critical** `aria-required-children` on archive year tabs and tournament tabs (`role="tablist"` on plain link menus). | Removed the invalid roles (these are navigation links, not ARIA tabs). | `5f98926` |
| 6 | Low | Admin page: no `<main>` landmark, no `<h1>`, content outside landmarks (axe moderate). | Login screen + dashboard now use `<main>` landmarks and a visually-hidden/visible `<h1>`. | `b73fdce` (merge `a136a7d`) |

Nothing else was found: zero dead links, zero broken images, zero console errors, zero overflow at any
tested width, and every form/admin flow works on the live site.

## 4. What was verified on the live site (detail)

- **Pages:** home, about, news (+ article detail), events, sports, tournament detail (all 7 tabs),
  fixtures, results, players (+ player profile), committee, archive (year tabs), gallery (album → lightbox),
  donate, contact, privacy, terms, search (with & without query), 404. Menu + footer link trees clicked.
- **Forms:** empty-submit validation (both forms); valid donation (stored, timestamped); valid contact
  message (stored, timestamped); persistence across reload; visible in Admin → দান / যোগাযোগ বার্তা.
- **Admin:** wrong-password rejection; login; 8-card dashboard; news/entity CRUD verified earlier + full
  section walk; donation verify button; contact list; **CSV export** (real downloaded file containing the
  test records); **content.json export** (valid bundle); logout.
- **content.json publish flow:** mechanics verified end-to-end in the prior session on identical code;
  this session verified the live site loads the published layer and the placeholder file is served.
- **Responsive:** 360/768/1024/1440 — no horizontal scroll on any tested page, burger menu appears at
  mobile widths and hides at 1440.
- **Cross-browser:** Chrome, Edge (full suites) and Firefox (main flows) — see summary table.
- **Bengali typography:** correct rendering and correct `lang="bn"`; English switcher flips `lang` to `en`.

## 5. Rollback (one step)

Every change set has a pre-change tag (nothing was deleted or force-pushed):

| To undo | Command |
|---|---|
| The whole 2026-09-29 session | `git revert -m 1 a136a7d` then push (or revert each merge: `a5c4f48`, `5919290`, `a136a7d`) |
| The a11y round only | `git revert -m 1 5919290` + `git revert -m 1 a136a7d` |
| The boot-delay fix only | `git revert -m 1 a5c4f48` |
| Back to the state before everything | `git checkout pre-fix-2026-09-29` (tag `14bd6e4`) |

After any revert, GitHub Pages rebuilds automatically in ~1 minute. Working branches are preserved
(`fix/boot-delay-and-console-noise`, `fix/a11y-contrast-and-headings`, `fix/admin-landmarks`).

## 6. Notes & limitations

- **Static hosting storage:** on GitHub Pages, form submissions are stored in the *visitor's browser*
  (localStorage) and exportable as CSV from the admin panel. For one shared committee inbox, run the
  included Node backend (`server/`) — documented in `handover.md` §4.
- Contact details / social links intentionally show "প্রয়োজনীয় তথ্য দিন" placeholder chips until the
  committee enters real values (per the no-invented-data rule).
- Firefox console-log capture is not available through WebDriver; console cleanliness is covered by the
  Chrome and Edge results.
- The 404 page returns the site's custom 404 page with a correct 404 status (verified).
