# celeste7.ai — handover

You've just inherited this repo. Read this once, top to bottom, and you'll be productive on day 1. Everything you need to know lives here or in the files this doc points to.

---

## 1. What this is

**celeste7.ai** — the public marketing site for CelesteOS, a search and handover layer for superyachts that runs alongside the vessel's existing PMS.

It's a **static site originally exported from Webflow** and then hand-edited. There is no Webflow account to log into for code changes. Edits happen here, in this repo, in the HTML/CSS/JS directly.

- **Production URL:** https://celeste7.ai
- **Hosting:** Vercel (auto-deploys every push to `main`)
- **GitHub:** https://github.com/ProjectErebus/celeste-homepage-webflow
- **Stack:** static HTML + CSS + a small amount of vanilla JS. No build step. No framework. No npm install needed to make a copy edit.

---

## 2. How to deploy

You don't, manually. Vercel watches `main` on GitHub and redeploys on every push.

To ship a change:

1. Make the edit on a branch off `main`.
2. Open a PR against `main`.
3. Vercel creates a **preview deploy** automatically — the URL appears as a check on the PR.
4. Inspect the preview URL in a browser.
5. Merge to `main` → production redeploys in ~60 seconds.
6. Verify on https://celeste7.ai (hard-refresh; cache).

If you need to roll back, the cleanest way is `git revert <bad-commit-sha>` and merge that PR. The Vercel dashboard also has a "Promote to Production" button on any earlier deploy.

---

## 3. File map

```
.
├── index.html              ← THE homepage. Most edits land here.
├── trust.html              ← /trust — GDPR, SOC-2, ISM Code, continuity
├── privacy-policy.html     ← /privacy-policy
├── sources.html            ← /sources — citations for any stats on the site
├── handover.html           ← /handover — deep page on the handover feature
├── search.html             ← /search — deep page on cross-domain search
├── intelligence.html       ← /intelligence
├── records.html            ← /records — deep page on the audit/proof concept
├── 401.html  404.html  410.html ← Vercel serves these automatically
├── llms.txt                ← AI-crawler hint file
├── robots.txt
├── sitemap.xml
├── vercel.json             ← redirects, headers, cleanUrls=true (no .html in URLs)
│
├── css/
│   ├── normalize.css       ← reset (don't touch)
│   ├── webflow.css         ← Webflow framework (don't touch)
│   ├── celeste7homepage.webflow.css   ← the site's main stylesheet (Webflow-generated)
│   ├── hp-tokens.css       ← OUR custom additions: @font-face for Eloquia, accent overrides
│   ├── hp-animations.css   ← scroll animation tweaks
│   └── hp-nav.css          ← navbar tweaks
│
├── fonts/                  ← self-hosted Eloquia Display (6 weights, woff2)
│
├── images/                 ← all site imagery + iframe-fallback static screenshots
│
├── js/
│   ├── webflow.js                ← Webflow runtime (don't touch)
│   ├── celeste-iframe-theme.js   ← syncs light/dark mode into embedded iframes;
│   │                               also resets wrap.scrollTop=0 so iframe content
│   │                               renders top-aligned (browser-quirk workaround)
│   ├── celeste-theme.js          ← the light/dark theme toggle
│   ├── celeste-mailto.js         ← turns data-mailto="pilot" anchors into mailto: links
│   ├── celeste-oc.js             ← operational-context scroll pair
│   ├── hp-scroll.js              ← scroll effects
│   └── hp-nav.js                 ← nav effects
│
├── prototypes/             ← live HTML mocks embedded as iframes inside index.html
│   ├── handover-cover.html ← the editorial A4 handover document (Service 03 visual)
│   ├── proof-receipt.html  ← the dark verifier receipt (Service 04 visual)
│   ├── show-related.html   ← the inline "Related context" card (OC section)
│   ├── editorial-*.html    ← other mocks used across the site
│   ├── lens-fault.html     ← fault-history mock
│   └── prototype-tokens.css + lens-base.css/.js   ← shared prototype styling
│
├── blogs/                  ← blog post HTML, listing at /blogs
├── docs/                   ← extra reference docs (changelog, etc.)
├── tests/                  ← Playwright tests (rarely run in this repo)
├── design-studio/          ← non-production design experiments (see §6)
├── .planning/              ← stale Feb 2026 planning notes (kept as history)
└── PLAN.md                 ← old plan doc from the Mar 2026 image cleanup
```

**The two files you'll edit most often are `index.html` and `css/hp-tokens.css`.**

---

## 4. How to make common edits

### Change copy on the homepage

Open `index.html`. Find the text via `grep -n "the exact phrase" index.html` or open it in your editor and Ctrl-F. Edit. Commit. PR. Done.

### Change a colour, font, or token

The site uses CSS variables defined in `css/celeste7homepage.webflow.css` (the original Webflow tokens) and overridden in `css/hp-tokens.css` (our custom layer). For brand changes, edit `hp-tokens.css` — it's small and human-readable. Don't touch the Webflow file unless you really mean to.

Key custom rules in `hp-tokens.css`:
- `@font-face` declarations for the six Eloquia Display weights (self-hosted in `/fonts/`)
- `body` font-family override to put Eloquia first across all Webflow breakpoints (Webflow redefines `--_size---font-family` to `'DM Sans'` at each breakpoint, so we override at every breakpoint)
- `.accent` class — body text accent in brand blue (was Cormorant italic, now inherits body)

### Add a new page

1. Copy an existing static page (e.g. `trust.html`) as a starting point.
2. Edit the `<title>`, `<h1>`, content.
3. Add the page to `sitemap.xml`.
4. Vercel's `cleanUrls: true` will serve `my-page.html` at `/my-page`. No routing config needed.
5. Link to it from the footer or wherever needed.

### Add a new prototype iframe

1. Create `prototypes/my-new-mock.html` — standalone HTML, can reference `lens-base.css` and `prototype-tokens.css`.
2. Embed in a parent page with:
   ```html
   <div class="iframe-product-wrap iframe-crop--service">
     <iframe src="prototypes/my-new-mock" loading="lazy" title="..." style="margin-top: 0px"></iframe>
   </div>
   ```
3. Note: the iframe `src` has **no `.html`** — Vercel's `cleanUrls: true` strips it. If you write `.html`, you'll get a 308 redirect on every iframe load (slow).
4. Production iframes are forced to 720×2000 by the `.iframe-product-wrap iframe` CSS rule, then cropped by the parent's `iframe-crop--X` class (e.g. `iframe-crop--service` = 590×540). The iframe content should be designed for a **720-wide viewport** but only the top-left portion (the crop size) will be visible.
5. `celeste-iframe-theme.js` will reset `wrap.scrollTop` to 0 on iframe load and on every visibility transition — necessary because Chromium auto-scrolls overflow:hidden wraps that are taller than their iframe child (a real browser quirk we hit and fought through PRs #15–#19).

### Edit the footer / nav

Both are inline in every page (this is a static export, no shared template). To change them everywhere, you'll edit each HTML file. Use a multi-file find-and-replace in your editor.

### Run the site locally

```sh
cd /Users/celeste7/Documents/celeste7homepage.webflow
python3 -m http.server 8989
# then open http://localhost:8989
```

⚠️ Caveat: when running locally with Python's http.server, Vercel's `cleanUrls` routing doesn't apply. Any iframe `src` that points at `prototypes/X` (without `.html`) will 404. You can either:
- (a) Open the file directly via `file://...` — works for inspecting individual pages but iframes still 404 on the clean URLs.
- (b) Inspect against the actual Vercel preview URL of your PR.

In practice, (b) is what we did. Push your branch, let Vercel build the preview, inspect on the preview URL.

---

## 5. Design system at a glance

The brand uses **four typefaces** in a strict hierarchy:

| Typeface | Where | Why |
|---|---|---|
| **Eloquia Display** (self-hosted, 6 weights) | Body, headings, navigation, most UI text | Sharp, modern, proprietary feel. Replaces DM Sans across all breakpoints. |
| **Cormorant Garamond** italic | Every `<em>` inside `.heading`, `.hero-heading`, `.cta-heading`, etc. | The one accent voice. Used sparingly, on the moments the page wants to slow down. |
| **IBM Plex Mono** | Section labels, eyebrows, citations, IDs, timestamps, "system voice" | Anything that should read as the system speaking, not the brand speaking. |
| **DM Sans** | Fallback only — Eloquia → DM Sans → system-ui | Was the original Webflow body font. Still in the fallback chain. |

**Accent colour** comes from `var(--_colors---accent)` (a teal blue). Used for the `(0X)` section markers, italic em-phrase colour, and most link colour.

**Don't invent new colours, fonts, or sizes.** Reach for an existing token. If a token doesn't exist, that's a signal to think harder about whether the change is necessary or whether an existing token already serves.

If you're working on UI design and want the full brand discipline document, invoke the `celeste-brand-typography` skill (from the Claude Code skills catalogue).

---

## 6. The `design-studio/` directory

This is non-production. None of the files in `design-studio/` are linked from the public site or the sitemap. They are design explorations kept in the repo so they're inspectable and not lost.

See `design-studio/README.md` for what's inside.

The most recent set is the **§11 reframe prototypes** (`reframe-v1.html` through `reframe-v4.html` plus `INDEX-reframes.html`). They live on the `studio/reframe-prototypes` branch only — not on `main`. The next engineer should:
1. Check out `studio/reframe-prototypes`.
2. Open `design-studio/INDEX-reframes.html` in Chrome.
3. Read `HANDOVER-REFRAME.md` (this file's companion, below).

---

## 7. What was being planned but not shipped

The site is currently positioned as a "search-first engineering intelligence system." A piece of internal review work (`/Users/celeste7/Documents/CelesteOS-Score/review/` on the CEO's machine) flagged this positioning as misdirected: the **handover** feature is the validated painkiller, search is a vitamin, and the cryptographic-receipt feature is a liability for the conservative buyer.

A full site reframe plan was written and four prototype variants built on the `studio/reframe-prototypes` branch. None of them has been merged. The CEO paused this work to evaluate which variant ships.

**Next engineer:** if/when this resumes, read in this order:
1. `/Users/celeste7/Documents/CelesteOS-Score/review/11_site_copy_reframe.md` — the canonical plan
2. `HANDOVER-REFRAME.md` in this repo — short summary
3. `design-studio/INDEX-reframes.html` — visual comparison of the four variants
4. `design-studio/reframe-v1.html` … `reframe-v4.html` — full prototype pages

Until then, **production is the current `main` branch** — the search-first homepage, with the section ordering and copy reflected in `index.html` as of commit `eada87d`.

---

## 8. Things to know before you touch anything

1. **There is no build step.** Edit HTML, edit CSS, commit, push. Vercel deploys the static files as-is.
2. **`cleanUrls: true` in `vercel.json`** strips `.html` from URLs and 308-redirects `/foo.html` → `/foo`. Always link to and embed iframes with the clean URL (no `.html`) to avoid the redirect.
3. **The Webflow CSS is enormous and partially generated.** Don't try to refactor it. Override what you need in `hp-tokens.css`.
4. **Image-fallback pattern:** every iframe has an `<img class="iframe-fallback">` next to it. On mobile (≤767px) iframes are hidden via CSS and the static image shows instead. If you add an iframe, add a fallback image of the same content.
5. **Theme toggle:** there's a sun/moon button in the navbar. It adds/removes `.dark-mode` on `<html>`. Custom CSS for dark mode lives mostly in `css/celeste7homepage.webflow.css` (search for `.dark-mode`). Inspect any change you make in both modes.
6. **Mailto pattern:** anchors with `data-mailto="pilot"` are turned into `mailto:contact@celeste7.ai?subject=...` links by `js/celeste-mailto.js` at runtime. Don't hardcode the email if you want consistent behaviour — use the data-attribute.
7. **Production secret:** there are none in this repo. It's a static marketing site. No API keys, no env vars. The Vercel project has a few env vars for the verifier subdomain — those live in the Vercel dashboard, not here.

---

## 9. Open / dead branches at handover

| Branch | Status | What to do |
|---|---|---|
| `main` | Production | Don't break this. Always PR. |
| `studio/reframe-prototypes` | Reframe prototypes, not merged | Keep alive as a reference. Read `HANDOVER-REFRAME.md` before deciding to merge or delete. |
| `copy/rejection-fixes` | Already merged into main | Safe to delete locally + on origin. |
| `style/strip-em-dashes` | Old branch from May | Already merged. Safe to delete. |
| `feat/site-update-brief-v1` | Old branch from May | Already merged. Safe to delete. |
| `revert-changes` | Old experimental | Verify it's not needed, then delete. |

---

## 10. Where the production iframes' content lives

The homepage has four embedded iframes in the `What it delivers` services section, plus one for the OC section. Their sources:

| Slot on homepage | iframe src | What it is |
|---|---|---|
| Service (01) Search idle | `prototypes/elegant-idle` | The idle-state search artefact |
| Service (02) Search results | `prototypes/elegant-results` | The results-stack search artefact |
| Service (03) Handover document | `prototypes/handover-cover` | The editorial A4 generated-handover card |
| Service (04) Verified receipt | `prototypes/proof-receipt` | The dark verifier-style sealed-receipt card |
| Operational Context | *(inline HTML, no iframe)* | The Related-context drawer card — was an iframe, hit a Chromium clipping issue, now lives directly in `index.html` (PR #19). The `prototypes/show-related.html` file exists but is no longer used by the homepage. |

---

## 11. Common questions

**"Where do I change the pilot price?"** — Search `index.html` for `$450`. There's one canonical place, near the CTA.

**"Where do I change the Trust GDPR / SOC-2 / ISM language?"** — `index.html` `#trust-posture` section. The deep page is `trust.html`.

**"How do I update the LinkedIn link?"** — Search for `linkedin.com/in/short-alex` and `linkedin.com/company/celesteos`. There's also an `aria-label` on the company link.

**"How do I add a blog post?"** — Each post is an HTML file under `blogs/`. The listing page is also in `blogs/`. Pattern-match an existing one.

**"How do I update the sitemap?"** — `sitemap.xml` at root. Bump `<lastmod>` and add new `<url>` blocks when you ship a new page.

**"Where do I see what's been changed recently?"** — `git log --oneline -30 main`. Each PR is one squashed commit with a descriptive title.

**"Where does the schema.org structured data live?"** — Top of `<head>` in every page. `index.html` has a `SoftwareApplication` block with the brand name and description.

---

## 12. The handoff itself

You have a clean `main`. Production is live and stable. The reframe work is on a separate branch with its own README. Nothing is half-merged. Nothing is half-deployed.

Read `design-studio/README.md` next. Then poke around `index.html` for 10 minutes. You'll have the shape of it.

If you get stuck, the git history is the most honest source of "why is this here?" — every commit message explains the change and why.

Good luck.
