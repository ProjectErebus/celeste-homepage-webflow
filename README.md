# Celeste Homepage (Webflow Export)

Static site exported from Webflow.

## Local preview
Open `index.html` in a browser or serve locally:

```sh
python3 -m http.server 8080
```

Then visit http://localhost:8080

## Deploy (Vercel)
This repo is ready for a static deploy on Vercel.
- Framework preset: Other
- Build command: (leave empty)
- Output directory: /

Notes:
- Webflow CMS/E‑commerce/Search and native Webflow forms are not included in code exports. If you need forms, connect a provider (Formspree/Basin) or add a Vercel serverless function.
- `404.html` and `401.html` are included and will be served automatically.


Redeploy

Last redeploy trigger: 2026-02-09T21:48:43Z

## Exit popup (drop-in for SITE01)
Self-contained lead popup: `js/celeste-popup.js` + `css/celeste-popup.css` (it loads its own CSS and `js/celeste-events.js`). Add ONE line to a page, ideally near the end of `<body>` or in `<head>` with `defer`:

```html
<script src="/js/celeste-popup.js" defer data-api="https://control.celeste7.ai"></script>
```

- Native `<dialog>` + `showModal()` (focus trap, Esc, backdrop). Split card: image left, form right; image strip on top under 640px. Light by default, dark only under `prefers-color-scheme: dark`.
- Triggers: desktop exit intent (after 8 s on the page); phone 50% scroll, or 30 s. Once per visitor per 30 days (`celeste_popup_shown` in localStorage; fail closed if storage throws). Never on `/book*`; never after a lead (`celeste_lead_submitted`).
- Copy is placeholder text in elements marked `data-copy-slot` (heading, body, imo-hint, consent, submit, success-heading, success-body, book). Edit `COPY` in `celeste-popup.js` or set `window.celestePopupCopy = { heading: '...' }` before the script.
- Image: `data-image-slot`. Default `/img/hull-light.webp` (cropped clear of the bow lettering), or `/img/popup-lifestyle.webp` if that file exists, or `data-image="/img/x.webp"` on the script tag.
- Submits `POST /api/book/lead` with `source=popup`, role `other`. `data-api` is honoured on localhost only; real hosts always use `https://control.celeste7.ai`.
- Events (consent-gated, no PII): `popup_shown`, `popup_dismissed`, `popup_submit` via `js/celeste-events.js`.
- Test page: `tests/popup/popup-test.html` (the only page that includes it). Specs: `npx playwright test -c playwright.book.config.js`.
