# M/Y Euphoria proposal set

The private proposal pages prepared for SeaNet and M/Y Euphoria. Live at celeste7.ai behind a
light access gate (code held in each page, key `seanet_access_granted` in localStorage) and
`noindex`. This file is the map: what each file does, the conventions, and how to change them
safely.

## Files

| File | What it is |
|---|---|
| `seanet-euphoria.html` | Landing page. Links the three documents. Its card styles are inline (`.doc-card`). |
| `seanet-euphoria-overview.html` | The 10-slide overview deck (`body.deck`). Navigation via `initDeck()`. |
| `seanet-euphoria-proposal.html` | The technical proposal (`body.doc`), 17 numbered sections. Scroll behaviour via `initDoc()`. |
| `seanet-security-companion.html` | Security companion. Self-contained (own inline styles and fonts); does not use the shared CSS or JS. Closes like the proposal: founder signature and the Anthropic programme line (`.cl-closer`). |
| `css/seanet-euphoria.css` | One stylesheet for the landing page, deck and proposal, in 14 ordered sections (see its header). |
| `js/seanet-euphoria.js` | Animation sequencing, reduced motion, deck navigation, proposal scroll state. |
| `images/euphoria/` | Yacht photography, founder photo, Celeste logo, Anthropic wordmark. Every file is referenced. |
| `middleware.ts` | Serves these pages when `SEANET_VISIBLE=true`; `/seanet` redirects to `/seanet-euphoria`; the retired `/seanet-overview`, `/seanet-proposal`, `/seanet-security` return 404. |
| `tests/journeys/seanet-euphoria.spec.js` | Contract test: structure, copy, layouts, accessibility names, deck focus, phone layout. |

There is no build step. Animations are inline SVG on purpose: the JS sequences them, and inline
SVG can read the stylesheet's colour tokens, which external SVG files (`<img>`, `<object>`) cannot.
Token use is partial today: the drawings carried over from the original SeaNet proposal use
`var(--teal-accent)` / `var(--tx*)`, while the sequenced drawings still hold raw colour values.

## Proposal sections

01 Summary · 02 Euphoria today · 03 Scattered · 04 Onboarding · 05 Over time · 06 Warranty ·
07 Handover · 08 Documents · 09 Search · 10 Proof · 11 ISM package · 12 Fleet · 13 Security ·
14 The first month (`#first-month`) · 15 Alongside SeaNet's systems · 16 Investment · 17 Next step.

The section id, its `data-title` (shown in the top bar), its `.sec-num` line and its contents
entry must agree. The test checks the order and numbering.

Layouts are deliberately different per kind of point: labelled Today/With Celeste rows (02),
comparison table (03), Tonight/By morning sheet (04), access-record strip (13), step cards and
measures (14), the "alongside" block (15), terms rows (16), signature close (17).

## Animations

- Every animation is `<svg class="anim" role="img" aria-label="…">`. Every one needs an `aria-label`.
- Two authoring styles exist:
  - **Sequenced** (`data-dur` on the svg, `data-in`/`data-out` on elements, as fractions of the
    cycle). The JS adds the fade animations. Used by the warranty, handover, verifier, fleet view
    and the deck's own animations.
  - **Self-animated** (SMIL `<animate>` inside). Used by the animations carried over from the
    original SeaNet proposal. They use the `--teal-accent` / `--tx*` tokens.
- **Phone versions.** Where a drawing is unreadable at 390px, the page carries a second copy:
  `.only-wide` (shown above 640px) and `.only-narrow` (shown at 640px and below). Most narrow
  copies are the wide drawing with larger type; a few are re-laid out (the plan timeline is
  vertical, warranty and handover stack their panels, "Over time" splits into its two halves).
  Edit both copies together.
- **Reduced motion.** The JS shows every animation at its finished frame and pauses it, never at
  its first frame. Short pulse loops (breathing dots, marching dashes) are replaced by their resting
  state so nothing freezes mid-pulse.
- **Shared with the deck.** The warranty, handover, verifier and fleet-view drawings (and their
  phone versions) also appear in the overview deck. A change to one must be copied to its twin.
- **Phone copies that show part of a wider drawing** carry the `clip` class so the rest of the
  drawing does not spill in (section 05).

## Copy rules (founder)

- Show, don't tell. Lead with the cost to Euphoria, then the outcome. No internal workings for their own sake.
- Certain language: no "about", "may", "typically". Celeste is the answer.
- Timeline: onboarding overnight in November; a one-month proof; review at the end of month one.
  Never the refit, the Barcelona yard or 6 November.
- One idea per section, one animation per section. Proof (10) currently shows two; whether to keep both is open with the founder.
- Anthropic: "Celeste has been accepted into Anthropic's Claude for Startups programme." Never
  partner, backed or endorsed.
- No vessel identifiers (official number, MMSI, call sign) or ownership details: the repo is public.

## Checking a change

```bash
python3 -m http.server 8080 &
TEST_URL=http://localhost:8080 npx playwright test tests/journeys/seanet-euphoria.spec.js --project=chromium
```

Then look at the proposal at 1440px and 390px. A section that reads the same as the one before it,
or an animation too small to read on a phone, is a failure even when the test passes.
