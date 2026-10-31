# content-engine — the celeste7.ai content pipeline

Quality, not volume. The pipeline turns a keyword target into a published,
truth-gated blog post on the static Webflow site, with a human and the founder
in the loop at the two places that matter: **Claude writes the draft**, and the
**founder gates publish**. The scripts do the mechanical work and enforce the
brand's honesty rules — they never write marketing copy and never publish on
their own.

```
idea → target → BRIEF → (Claude drafts) → GATE → founder review → PUBLISH → MEASURE → iterate
        run.mjs new        ↑ human          gate.mjs   ↑ founder    publish.mjs   scorecard.mjs
                           Claude Code                  node run.mjs ship
```

- **Node v24, zero npm dependencies — Node stdlib only.** Every script is `.mjs`.
- Run everything through `run.mjs`, or call the underlying scripts directly.

## The data contract (what everything aligns on)

| File | Shape | Source of truth |
|---|---|---|
| `lib/assets.json` | `[{id, file, chapter, supports[], never[], alt, usage}]` | parsed from `ASSET-REGISTRY.md` |
| `lib/claims.json` (+ `.sha256`) | `claims/2.0.0`: `meta`, `approved[]`, `rules[]`, `channels{}`, `synonyms{}`, `claim_triggers[]`, `hosts{}`, `internal_names[]`, `footers{}` + legacy `banned_lexicon[]`, `banned_overclaims[]`, `call_only[]`, `chapters{}` | **generated** from `claims-allowlist.md` by `gen-claims.mjs` — never hand-edit |
| `posts/<slug>/draft.html` | BODY html only, with `{{asset:id}}` placeholders | **Claude writes this** |
| `posts/<slug>/meta.json` | `{title, description, canonical, slug, keyword, chapter, jsonld?, updated}` | `brief.mjs` seeds it, Claude fills it |

`{{asset:<id>}}` in a draft is resolved by `publish.mjs` via `assets.json` into a
`<figure>` with the registry-approved `alt`, and the asset file is copied to the
served path `images/blog/<file>`. An unbound `{{asset:}}` is a hard gate failure.

## How to run

### 1. Brief — pick a target, generate the spec

```sh
node run.mjs new --slug crew-turnover-knowledge-loss \
  --keyword "crew turnover knowledge loss superyacht" \
  --chapter handover --format pillar \
  --refresh knowledge-crisis-superyachts --date 2026-06-11
```

Writes `posts/<slug>/brief.md` (the SAFE chapter claims, 3–5 suggested registry
assets with their NEVER lines, the SERP angle from `REFRESH-PLAN.md` when
`--refresh` matches, internal-link targets, the required structure) and a
starter `meta.json`. Known chapters and formats are validated by `brief.mjs`.

### 2. Draft — the human-in-the-loop step (Claude writes it)

`brief.mjs` does **not** write `draft.html`. You open `posts/<slug>/brief.md`
and have **Claude** (Claude Code / the Claude API) draft `posts/<slug>/draft.html`
against it — body HTML, `{{asset:id}}` placeholders for every image, only the
SAFE claims for the chapter, host `verifier.celeste7.ai`, no pricing.

Why Claude and not a local model: every product claim has to map to shipped code
and survive the truth gate. A small local LLM (an 8B Ollama model) manufactures
exactly the banned overclaims — "writes itself", "every domain", "sealed PDF" —
that this brand exists to refuse. See `PIPELINE.md` → *Claude vs Ollama*.

### 3. Gate — the truth + brand firewall (run until clean)

```sh
node run.mjs gate <slug>            # gates posts/<slug> (draft.html + meta.json)
node gate.mjs --self-test           # PASS/FAIL fixtures prove the gate itself
node gen-claims.mjs --check         # claims.json is in sync with claims-allowlist.md
node tests/claims/run_corpus.mjs    # acceptance corpus: 211/211 banned blocked, 0/299 approved blocked, 7/7 homepage meta
node tests/claims/site_sweep.mjs    # every live page + llms.txt through the gate
```

The same checks run for every channel (blog, page_meta, email, linkedin, meta,
google_ads, social_generic): `node gate.mjs <file> --channel <c> [--json]`, or
`node gate.mjs --artifact <input.json>` for a full ClaimsCheckInput (JSON result in
the ReviewRecord check shape; exit 0 pass|warn, 1 fail, 3 abstain). Import
`lib/claims-check.mjs` (`checkArtifact`, `loadPack`) to call it in-process. Rules run on
normalised text (tags, entities, curly quotes, hyphens, numbers and currency folded).
To change a claim or rule, edit `claims-allowlist.md` and run `node gen-claims.mjs`;
the gate refuses to run if the two files drift.

The gate fails (exit 1) on any banned-lexicon / banned-overclaim / call-only
(pricing) match, the dead host `verify.celeste7.ai`, internal code/file names,
unbound `{{asset:}}` placeholders, and structural defects (missing canonical on a
full page, >1 `<h1>`, `<title>` outside 30–65 chars, meta description >155, no
JSON-LD). Each violation prints with a line number and the safe substitute.
**Do not weaken the gate to pass — fix the draft.**

### 4. Ship — gate (fail-closed) then publish (the founder runs this)

```sh
node run.mjs ship <slug> --date 2026-06-11 --check   # dry-run: render nothing
node run.mjs ship <slug> --date 2026-06-11           # real: write the page
```

`ship` re-runs the gate fail-closed, then `publish.mjs` resolves assets into the
`templates/post.html` shell, writes `../blogs/<slug>.html`, copies the referenced
assets to `../images/blog/`, and upserts the `<url>` in `../sitemap.xml` with an
honest `lastmod`. It then prints the git/PR + GSC-request-indexing next steps.
Publishing is a **git** operation on the static site — no CMS, no API push.

> The served filename is derived from the **dir slug**. For a refresh, name the
> post dir exactly the canonical slug (e.g. `knowledge-crisis-superyachts`) so the
> served file lands at the trusted URL. `run.mjs ship` warns when the dir slug and
> the canonical in `meta.json` disagree.

### 5. Score — the measure leg (close the loop)

```sh
node run.mjs score                  # 28d vs prior 28d GSC, classifies each URL
```

Pulls Search Console by page for `sc-domain:celeste7.ai`, classifies each
`/blogs/*` URL climbing / stalled / dead, prints a table, and writes
`scorecard-latest.json`. Stalled/dead posts are the ones to re-brief for Claude
to rewrite against a sharper keyword — the same restraint as the rest of the
pipeline. Reads the JARVIS GSC OAuth token; override with `GSC_OAUTH_TOKEN`.

## The two gates that aren't code

- **Claude drafts** (step 2) — judgment a script can't have: which SAFE claim
  fits, which asset shows the moment, how to say it in the brand's voice.
- **Founder gates publish** (step 4) — the page converts traffic; the founder
  converts the prospect. Nothing reaches the served tree without a human running
  `ship`, and nothing reaches the public site without a human running `git push`.

## Layout

```
content-engine/
  run.mjs              orchestrator (new / gate / ship / score)
  brief.mjs            step 1 — writes the brief Claude drafts against
  gate.mjs             step 3 — the truth + brand firewall CLI (+ --self-test, --channel, --json, --artifact, --blind)
  gen-claims.mjs       claims-allowlist.md → lib/claims.json + .sha256 (--check)
  lib/claims-check.mjs the claims check library (every channel; pure, importable)
  lib/normalise.mjs    text normaliser with offset map
  lib/check.mjs        blog-gate view (legacy checkText)
  tests/claims/        acceptance corpus + run_corpus.mjs + site_sweep.mjs
  publish.mjs          step 4 — gate-guarded render → ../blogs + ../images + sitemap
  scorecard.mjs        step 5 — GSC feedback loop → scorecard-latest.json
  templates/post.html  the page shell publish.mjs injects into
  lib/assets.json      parsed asset registry (the {{asset:}} resolver)
  lib/claims.json      GENERATED truth gate (approved ids, rules, channels; legacy keys kept)
  assets/              the 15 QA'd product screenshots
  posts/<slug>/        brief.md (generated) · draft.html (Claude) · meta.json
  ASSET-REGISTRY.md    human source for lib/assets.json
  claims-allowlist.md  human source for lib/claims.json
  REFRESH-PLAN.md      the 11 existing posts to retarget + the first-10 plan
  PIPELINE.md          the design doc (stage flow + obstacle/solution/why)
```
