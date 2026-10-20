# REFRESH PLAN — celeste7.ai blog content engine

**Status:** Actionable plan. Synthesized 2026-06-11 from the 11-post audit set, `claims-allowlist.md` (truth gate), `ASSET-REGISTRY.md` (approved renders), the 2026-06-05 production-truth audit, and the ALE-232 keyword research + first-10 blog plan.
**Scope:** the 11 existing posts in `/blogs/`, the 3 known technical SEO defects, and how refreshed posts + ALE-232's first-10 NEW posts slot into the 9-chapter pillar-cluster structure without cannibalizing each other.

## Operating rules (non-negotiable, in order)

1. **Truth first.** Every violation in §B ships fixed BEFORE or WITH the first retarget. A banned claim live on the site is brand risk today; a missed keyword is only opportunity cost. The mechanical gate in `claims-allowlist.md` is the source of truth — when an audit line and the allowlist disagree, the allowlist wins.
2. **URLs are the only trusted asset. Never change a slug** (one exception: `auto-generated-handover` is 301-folded — the slug itself is a banned claim).
3. **One keyword, one URL.** Ownership decisions in §D are binding. If an existing post owns a keyword, the corresponding ALE-232 new-post entry becomes a refresh, not a new URL.
4. **Renders come from `content-engine/assets/` only**, with the approved alt text and NEVER-lines from `ASSET-REGISTRY.md`. One media = one focal point. No pricing anywhere (CALL-ONLY).
5. After each deploy: bump `dateModified` + visible "Updated June 2026" line, update sitemap `lastmod`, request reindex in GSC, annotate the date, then **leave the URL alone for 4–6 weeks**.

---

## A. Priority-ordered refresh queue

Ranking = GSC trust (impressions/position on the URL) × keyword fit (how little the content must change to match validated demand) × effort.

| # | Slug | Target keyword (tier) | Verdict | GSC signal | Effort |
|---|------|----------------------|---------|------------|--------|
| 1 | `engineering-handover-superyacht` | chief engineer handover checklist (B); secondary: engine room handover checklist (B, same URL) | retarget-refresh | 97 impr · pos 7.1 · 3 clicks — best URL on site | S — H2 already matches; title/H1/markup work |
| 2 | `knowledge-crisis-superyachts` | crew turnover knowledge loss superyacht (B, FLAGSHIP); secondary: retain crew knowledge institutional memory yacht (B) | retarget-refresh | 94 impr · pos 8.3 | M — retitle + FAQ + PSC subsection |
| 3 | `auto-generated-handover` | — (de-cannibalize) | **fold + 301 → engineering-handover-superyacht** | unknown | S — merge unique content, redirect |
| 4 | `siloed-maintenance-systems` | best yacht maintenance software (A); secondary: ship management software vs Excel support | retarget-refresh | pos 2.5 (trusted URL) | M — retitle + checklist section + h3s |
| 5 | `software-bypass-superyachts` | ship management software vs Excel (A); secondary: how to manage maintenance on a superyacht weave | retarget-refresh | pos 5.8 | M — retitle + comparison section |
| 6 | `warranty-claim-documentation` | verifiable auditable maintenance record yacht (A); secondary: yacht maintenance log book digital records support | retarget-refresh | pos 6.3 | M — retitle + h3s + render swaps |
| 7 | `fault-patterns-superyachts` | yacht maintenance log book digital records (B) | retarget-refresh | pos ~6.8 | M — retitle + replace 2 untruthful concept images |
| 8 | `seven-connections-yacht-pms` | how to evaluate yacht maintenance software / seven-connections test (C-adjacent); supporting mention only of "best yacht maintenance software" | retarget-refresh (de-cannibalized — see §D) | 13 impr · pos 12.8 | M |
| 9 | `natural-language-search-yacht` | how to organize yacht manuals onboard (B) — absorbs ALE-232 new-post #5 | retarget-refresh | not in audit set (low/unknown) | L — needs a practical how-to section added |
| 10 | `audit-trail-superyacht` | yacht maintenance audit trail (uniqueness angle); supports warranty post on the Tier-A record term | retarget-refresh (supporting role) | not in audit set | S–M |
| 11 | `cross-domain-actions-yacht` | — (no validated keyword) | truth-fix only; keep as handover-cluster support | not in audit set | S |

### Per-post refresh specs (condensed — the post audits carry the full text)

**1. engineering-handover-superyacht** — chief engineer handover checklist
- Title: "Chief Engineer Handover Checklist for Superyachts: 7 Domains a Proper Handover Covers — Celeste"; H1 "The Chief Engineer Handover Checklist Most Yachts Don't Have"; meta ≤155 chars containing "chief engineer handover checklist" + "engine room".
- Convert the 7-domain section to `<ol>` + H3 per domain under exact-match H2; add ItemList JSON-LD.
- NEW H2 "Engine room handover checklist: applying the seven domains" (150–250 words: generators, watermakers, bilge/fire config, alarm thresholds) — captures the secondary keyword on the same URL (ALE-232 new-posts #2 and #7 are served here; see §D).
- Truth fixes per §B (lines 224, 210, 143, 193).
- FAQ (4 Qs) + FAQPage schema. Product links: `/handover` at the two-signature image, `/search` at the search paragraph.
- Renders: `handover-draft-drawer.png` in the checklist section; `search-results-grouped.png` at the search paragraph; `ledger-activity-drawer.png` at the immutable-record paragraph. Keep `art2-handover-signatures.png` + `art2-fault-entities.png`. Commission a cert render slot for domain 5 only if `certificate-lens.png` doesn't fit.
- Optional high-leverage: printable one-page 7-domain checklist (HTML print view, no gate).
- Absorb the surviving substance of `auto-generated-handover` (the 24-items/5-departments example and the live-links wormhole passage, rewritten to "captured as you work / every entry resolves to a live record") under a short H2 "What the compiled draft contains".

**2. knowledge-crisis-superyachts** — crew turnover knowledge loss superyacht (FLAGSHIP)
- Title/og/twitter/H1: "Crew Turnover and Knowledge Loss on Superyachts: When the Chief Engineer Leaves — Celeste". Meta leads with crew turnover / knowledge loss / institutional memory.
- H2 promotions: "Retaining institutional memory when crew rotate" (absorbs the Hill Robinson paragraph); "The rotation reality: 37% annual crew turnover".
- Truth fixes per §B (lines 196, 199, 190, 192).
- 3-question FAQ + FAQPage schema (knowledge loss at rotation / what a chief engineer handover should include → link engineering-handover / does the ISM Code require knowledge transfer).
- Expand the one-sentence flag-state line into a 2–3 paragraph PSC subsection linking `/blogs/audit-trail-superyacht` (anchor: "append-only audit trail").
- Internal links: natural-language-search-yacht from the search-figure section; `/#product` from the handover split.
- Renders: keep fault-history (show-related moment) + search full-bleed; `handover-draft-drawer.png` with captured-as-you-work caption; `ledger-activity-drawer.png` beside the inspection paragraph; `certificate-lens.png` beside the cert-expiry sentence.
- Schema: image property, dateModified bump, consider Person author. Re-verify all 9 citations (Seahub, YPI, Quay/Megayacht 37%).

**3. auto-generated-handover** — fold + 301
- The slug, title, meta, og/twitter, schema headline, and breadcrumb ALL carry "Auto-Generated" — the URL itself is the banned claim; it cannot be sanitized in place without leaving the violation in every share/snippet.
- Migrate the truthful unique content into post #1 (see above), then 301 `/blogs/auto-generated-handover` → `/blogs/engineering-handover-superyacht`. Re-point the 4+ internal links (from audit-trail-superyacht ×1, cross-domain-actions-yacht ×3, knowledge-crisis sibling slot). Update sitemap + feed.xml.
- Fallback if the CEO wants the URL kept: full on-page retitle to "What a Compiled Engineering Handover Draft Contains" + every banned string fixed — but the slug still says "auto-generated"; fold is the clean fix.

**4. siloed-maintenance-systems** — best yacht maintenance software (KEYWORD OWNER)
- Title: "Yacht Maintenance Software: The Cross-Domain Test Most Systems Fail" (~62 chars); H1 to match; meta with the one-search-test hook.
- Promote the five silo `<span class="topic-label">` to `<h3>` with keyword variants.
- NEW H2 "What to demand from yacht maintenance software" — 6–8 item evaluation checklist (cross-domain links, one-search retrieval, append-only history, handover draft built from captured work, certificate visibility, survives crew rotation).
- Short H2 "Spreadsheets vs a connected system" — links to software-bypass-superyachts as the vs-Excel owner.
- Truth fixes per §B (lines 150, 204, 171, 190–191).
- Renders: `fault-detail-related.png` (show-related) at the test section; `search-results-grouped.png` at the split; `ledger-activity-drawer.png` beside the warranty-evidence paragraph + link to verifier.celeste7.ai. Skip suggested-docs unless the caption stays manual-link honest.
- FAQ ×3 + FAQPage schema; internal links to verifier.celeste7.ai and `/#product`; fix the nav UTM-after-fragment bug (template-level, §C).

**5. software-bypass-superyachts** — ship management software vs Excel (KEYWORD OWNER)
- Title: "Ship Management Software vs Excel and WhatsApp: Why Yacht Crews Bypass the PMS — Celeste"; H1 "Ship Management Software vs Excel: Why Superyacht Crews Bypass the System at 2am"; keep the WhatsApp line as the lede pull-quote.
- Five bypass reasons → `<h3>`. New H2: honest two-column Excel-wins / Excel-fails comparison (the retarget payload; future link target for the new spreadsheet-template money page, ALE-232 #3).
- Truth fixes per §B (work-as-record, auto-surfacing list, "two seconds").
- Product links: search at the friction comparison, handover at the verbal-handover paragraph, verifier.celeste7.ai at the system-of-record warranty paragraph.
- Renders: `search-results-grouped.png` in the split; `ledger-activity-drawer.png` at the warranty paragraph; `handover-draft-drawer.png` at the handover paragraph. Keep `art7-bypass-reality.png` full-bleed.
- FAQ ×3 + FAQPage schema; dateModified bump; keep URL + 4 sibling links untouched.

**6. warranty-claim-documentation** — verifiable auditable maintenance record yacht (KEYWORD OWNER)
- Title: "Verifiable, Auditable Maintenance Records: Why Yacht Warranty Claims Get Denied — Celeste"; H1 variant with "your yacht warranty claim". Meta ≤155 with the EUR 20k–100k stake + burden-of-proof hook.
- Five failure modes → `<h3>`; H2 renamed "What makes a yacht maintenance record verifiable and auditable".
- Truth fixes per §B (lines 151, 201, 218) — captured-as-crew-work / linked-by-the-engineer / discoverable framing. NO claim-pack / [VERIFY] / money-finder depictions.
- Renders (replace art3-* mocks): `ledger-activity-drawer.png` at "immutable"; `fault-detail-related.png` at "no linked history"; `search-results-grouped.png` at "searchable"; optional `work-order-detail.png` at "linked across domains".
- FAQ ×3–4 + FAQPage schema; image property in Article schema.
- Cannibalization resolution: this post OWNS the Tier-A record term (money intent); audit-trail-superyacht links IN with anchor "verifiable, auditable maintenance records" instead of competing. Add reciprocal keyword-anchor links FROM knowledge-crisis and audit-trail. Introduce verifier.celeste7.ai as the "independently checkable" payoff. Refresh the in-copy example date.

**7. fault-patterns-superyachts** — yacht maintenance log book digital records
- Title: "Yacht Maintenance Log Book: Why Digital Records Reveal the Fault Patterns Paper Logs Hide — Celeste"; narrative title demoted to lede/deck. H2s reworked to carry log-book/digital-records language.
- Truth fixes per §B (closing supplier-data claim, predictive adjacency, two concept-image alts).
- Replace BOTH `art5-fault-pattern.png` and `art5-fault-timeline.png` (they depict unshipped "fault pattern view"/"fault timeline" surfaces) with `fault-detail-related.png` (show-related — the live feature this post actually describes) + honest alt text; `search-results-grouped.png` into "Record format prevents analysis"; `ledger-activity-drawer.png` into "The cost of pattern blindness".
- FAQ ×3–4 + FAQPage schema. Links: show-related mention → product section on `/`; warranty paragraph → audit-trail-superyacht; crew-rotation section → engineering-handover-superyacht.
- This refresh SERVES ALE-232 new-post #9 (same keyword) — no new URL.

**8. seven-connections-yacht-pms** — de-cannibalized to the evaluation angle
- OWNERSHIP CALL (binding): siloed-maintenance-systems owns "best yacht maintenance software" (stronger GSC trust at pos 2.5, keyword-led retitle). This post differentiates: title ≈ "How to Evaluate Yacht Maintenance Software: The Seven-Connections Test | Celeste"; H1 ≈ "Evaluating yacht maintenance software: the seven connections almost none make". "Best yacht maintenance software" appears once in body as a supporting mention linking to siloed-maintenance-systems.
- Seven connection-card titles → `<h3>` + ItemList JSON-LD; image property in Article schema.
- Truth fixes per §B (card 07, closing paragraph, card 02, "every domain" caption).
- FAQ ×3 + FAQPage schema (the connections test / is a spreadsheet enough → links software-bypass / what should a yacht PMS connect).
- Renders: `fault-detail-related.png` at card 03; `search-results-grouped.png` in the search section (caption enumerates faults/work orders/parts/manuals — never "every domain"); `certificate-lens.png` at card 06 (vitamin: visual line, not a feature); `handover-draft-drawer.png` at card 07 (the truthful mechanic fixes the overclaim visually).
- Weave "how to manage maintenance on a superyacht" once into the evaluate-H2 intro, linking the future MOFU hub (ALE-232 #10) when it exists.

**9. natural-language-search-yacht** — how to organize yacht manuals onboard (absorbs ALE-232 new-post #5)
- Current title ("Search Like You Think…") is zero-demand. Retitle ≈ "How to Organize Yacht Manuals Onboard (So Anyone Can Actually Find Anything) — Celeste"; keep the NL-search substance as the payoff half of the post.
- ADD the practical how-to half (this is the L-effort part): naming/locating conventions, what to do with OEM PDFs/scans, the indexing-as-they-are path ("Your existing manuals, PDFs, scans, exports, and emails are indexed as they are" — SAFE line), ending on search as the reason organization stops mattering.
- Truth fixes per §B (lines 123, 186 "every domain"; line 176 "real time").
- Suggested-documents discovery framing belongs here (allowlist §5 SAFE lines only — "suggested, you confirm"; never propagation). Render: `suggested-docs-component.png` with registry alt text; `search-results-grouped.png` as the search payoff.
- FAQ + FAQPage schema; links: knowledge-crisis (flagship), engineering-handover, `/search` product page. The "AI maritime document intelligence" Tier-A term stays OFF this page (AI is editorial-only territory; park it for a separate, carefully framed piece).

**10. audit-trail-superyacht** — yacht maintenance audit trail (supporting)
- Keep the strong title angle but carry the keyword: ≈ "The Yacht Maintenance Audit Trail: Every Action Has a Name and a Timestamp — Celeste".
- Truth fixes per §B (lines 130, 180, 172/196, meta description read-tracking claim).
- Cannibalization resolution: warranty-claim-documentation owns the Tier-A "verifiable auditable maintenance record yacht"; this post links to it with keyword-bearing anchor and takes the audit-trail/uniqueness angle. It is also the future internal-link hub for the Tier-B PSC-deficiencies post (knowledge-crisis's new PSC subsection links here today).
- Render: `ledger-activity-drawer.png` (registry NEVER-lines apply: no hop-back/resume, no sealed PDF). Link verifier.celeste7.ai as the proof point.
- Re-point its `auto-generated-handover` link to engineering-handover-superyacht after the fold. FAQ + schema/freshness pass same as others.

**11. cross-domain-actions-yacht** — truth-fix only
- No validated keyword fits; do NOT force one. Fix §B violations (lines 163, 173, 182), KEEP line 144 ("The system does not auto-create work orders… It proposes the next logical step and waits for the engineer to confirm") — this is the model "system proposes, engineer decides" framing; use it as the template for the other fixes.
- Re-point its three `auto-generated-handover` links to engineering-handover-superyacht. Add one link up to knowledge-crisis (pillar). Schema/freshness pass. Revisit targeting only if GSC surfaces a query for it.

---

## B. Truth violations — fix FIRST (single pass across all 11 posts, before/with refresh #1)

These are brand-risk, not SEO. Ship them as one batch even for posts whose retarget comes later. Canon substitutions: handover = "captured as you work" / "built from one-tap captures, reviewed before signing"; linking = "linked by the engineer, discoverable via Show Related"; search = enumerate domains, never "every domain"; ledger = "append-only", attribution "by signed-in user and role"; no read-tracking claims; no real-time/latency counters.

### knowledge-crisis-superyachts
1. L196 img alt "auto-generated engineering handover report… across every domain" → "engineering handover draft built from entries captured as the engineer works — maintenance records, fault history, and parts".
2. L199 figcaption "auto-generated from vessel data… independent of the outgoing engineer's availability or willingness" → drop both clauses; "captured as you work, signed by the outgoing engineer and head of department" ("signed" is safe — two-signature flow is live).
3. L190 body "must produce, automatically, a structured handover document" → "must assemble a structured handover draft from entries captured as the engineer works".
4. L192 "a product of the system, not a product of individual effort" (borderline beside the auto caption) → "supported by the system, not dependent on memory alone".

### engineering-handover-superyacht
5. L224 boilerplate "auto-generates structured handover documents from connected vessel data across every operational domain" → "compiles a structured handover draft from the vessel's own records — captured as the crew works, signed by the outgoing engineer and HOD".
6. L210 caption "surfaced automatically… without manual assembly" → "Outstanding defects carried into the handover draft from the live defect list — severity, status, and linked work orders visible to the incoming engineer".
7. L143 "structured, system-generated handover… does not depend on individual effort" → "structured, signed".
8. L193 "automatically pulling from maintenance history" → "drawn from"; keep industry-editorial, decoupled from the product claim.
9. L221 summary bullet "generated from vessel data, not from individual effort" — acceptable as editorial ONLY once #5 is fixed; otherwise reword.

### auto-generated-handover (resolved by fold + 301; if retained, every item below must be fixed)
10. Slug + title + meta + og/twitter + schema headline + breadcrumb: "Auto-Generated" claim baked into every machine-readable surface.
11. Meta/og/twitter description "compiles faults, work orders, parts, and certificates automatically".
12. L121 "compiled automatically from every operational domain" (double violation: auto + every-domain).
13. L147 figcaption "Assembled automatically from how the vessel is managed".
14. L150 H2 "How it assembles itself" (banned verbatim pattern).
15. L186 summary "compiles items automatically from every operational domain".
16. L188 "Auto-linking to source records" (auto-stem; the wormhole itself IS live — say "every item links to its source record").
17. L192 closer "auto-generates structured handover documents".

### cross-domain-actions-yacht
18. L163 "The handover assembles itself as the engineer works." (banned verbatim) → "The handover draft accumulates as the engineer works — one tap per item."
19. L173 H2 "Handover auto-population" → "One tap into the handover draft".
20. L182 img alt "auto-population drawer… automatically compiled into the engineering handover draft" → "handover drawer showing connected records — faults, work orders and parts captured into the draft as the engineer works".
21. KEEP L144 ("does not auto-create… proposes the next logical step and waits for the engineer to confirm") — model framing.

### natural-language-search-yacht
22. L123 "returns results from every domain" (banned absolute) → "returns results across faults, work orders, inventory, documents and equipment" (enumerate).
23. L186 summary "results from every domain: faults, work orders, inventory, documents, certificates, and equipment" → drop "every domain" framing; enumerate only what is demonstrable.
24. L176 "updated in real time… problems surface themselves" → drop "real time" (banned pattern); "what needs attention surfaces without being asked" (registry-approved framing).

### audit-trail-superyacht
25. L130 "attributed to a named individual" (universal claim — live attribution defaults to role) → "attributed — by signed-in user and role — and timestamped".
26. L180 "a layer that records interactions automatically as the engineer works" (auto-stem + passive read-tracking implication) → "Actions are recorded as the crew works — no checkbox, no extra step."
27. L172 + L196 "created in real time… proof in real time" → "created at the moment of the work" (no real-time counter).
28. Meta description "who opened a document, who reviewed a record" — read-event tracking is NOT in the verified-shipped set (NEEDS-EVIDENCE) → scope to actions: "who logged, changed, signed and linked — attributed and timestamped".

### siloed-maintenance-systems
29. L150 "a system that can automatically compile equipment status… into a single document" → "a system that assembles equipment status, outstanding defects, parts on order and certificate dates into a handover draft — captured as the engineer works, not reconstructed from memory".
30. L204 closer "every record — faults, work orders, parts, certificates, budgets, and supplier correspondence — …searchable in a single query" → drop "budgets" + "every record/single query" absolutes; "where faults, work orders, parts, certificates and records are connected across domains and searchable in one place".
31. L171 img alt claiming supplier-correspondence search → trim to verified domains.
32. L190–191 figure/caption supplier-correspondence link claim → trim caption to verified link types (equipment, work orders, parts, certificates).

### warranty-claim-documentation
33. L151 caption "linked in a single traceable record" (implied auto-chain) → "fault diagnosis, corrective action, parts and warranty status — linked by the engineer as the work happens, discoverable later".
34. L201 img alt "linked in a single traceable chain" → same fix; never drift into claim-pack/[VERIFY] depictions.
35. L218 boilerplate "creates timestamped, immutable, cross-domain linked records" → "keeps an append-only, timestamped record of maintenance, faults, parts and compliance, with links captured as crew work" (timestamped/immutable are safe; the linking VERB was the violation).

### software-bypass-superyachts
36. "logging a fault surfaces the equipment's history, the parts available, the warranty status, and the last three work orders" → trim to shipped reality (search + show-related surfacing fault history and related records; warranty is pull-on-open, not fault-triggered).
37. "work-as-record… the act of doing and the act of recording are the same action… a natural product of the work itself" (writes-itself adjacent) → "captured as you work — one tap from the queue into the draft".
38. "One search, full context in two seconds" → unverified counter; "one search, connected records".

### seven-connections-yacht-pms
39. Card 07 "automatically reflecting the actual state of the vessel" → "compiled from records captured as the engineer works — not assembled from memory".
40. Closing paragraph claiming ALL seven connections shipped ("every record — faults… costs, and supplier correspondence — connected… searchable in a single query") → restate to SAFE claims only: show-related context on every fault; handover captured as you work with the two-signature flow; append-only ledger; natural-language search across records and manuals.
41. Card 02 "inventory should update automatically… reorder alert should trigger" — keep ONLY as industry evaluation criteria; must not be swept into the CelesteOS closer (fixing #40 resolves it).
42. "One search, every domain." caption + "across every domain" sentence → enumerate faults/work orders/parts/manuals.

### fault-patterns-superyachts
43. Closer "connected to… supplier data — making recurring patterns visible" → drop "supplier data"; "fault records sit alongside the related work orders, parts and documents — Show Related surfaces the connection across crew rotations".
44. Pull-quote "what will happen next" directly above the product paragraph (implied prediction) → keep the editorial concept, decouple from the product line ("visible", never "predicted").
45. Both art5 image alts depict an unshipped "CelesteOS fault pattern view"/"fault timeline… revealing root cause" → replace images with `fault-detail-related.png` + honest alt (related records surfaced; no root-cause/timeline claims).
46. "Without a system that flags the recurrence" — keep generic/non-attributed only (recurrence alerting is not shipped; cert-expiry alerts are).

**Adjacent (already catalogued, not this plan's scope):** the 18 live-site product-page violations in `claims-allowlist.md` §LIVE-SITE VIOLATIONS (index/handover/records/search/intelligence pages) — same canon, same fix pass; coordinate so blog and product pages don't contradict each other for a crawl cycle.

---

## C. Technical SEO fixes

1. **Duplicate `www.celeste7.ai` property splitting GSC signal (46 impr at pos 16).** 301 `www` → apex at the edge (Vercel domain redirect), verify every canonical tag points to `https://celeste7.ai/...` (apex), keep the www property in GSC to watch the consolidation. One fix consolidates ~46 impressions of split trust into the apex URLs being retargeted above.
2. **`api.celeste7.ai` is being indexed.** Serve `X-Robots-Tag: noindex` on ALL api-host responses (robots.txt `Disallow` alone will NOT deindex already-indexed URLs — it blocks the crawler from seeing the noindex). Then file a GSC removal request for the host. Once deindexed, optionally add robots.txt disallow.
3. **Sitemap `lastmod` stale at 2026-03-30.** Update `lastmod` per URL as each refresh deploys (real dates only — never blanket-bump unchanged URLs), add the 301 removal of `auto-generated-handover`, resubmit in GSC. Wire `lastmod` into the deploy step so it never goes stale again. Update `feed.xml` alongside.
4. **Nav UTM-after-fragment bug (site-wide template).** Links like `/#Hero?utm_source=blog&utm_medium=nav` put the query string inside the fragment — UTM never reaches analytics and URLs look malformed. Fix the blog template: query string BEFORE `#fragment` (`/?utm_source=blog&utm_medium=nav#Hero`). Benefits every blog page at once.
5. **301:** `/blogs/auto-generated-handover` → `/blogs/engineering-handover-superyacht`; re-point the internal links from audit-trail-superyacht (×1) and cross-domain-actions-yacht (×3).
6. **Schema pass bundled into each refresh:** add `image` to Article JSON-LD (all 11 are missing it); FAQPage where specced; ItemList on the two list posts (engineering-handover, seven-connections); bump `dateModified` honestly; consider a named Person author with a one-line maritime credential (E-E-A-T — currently Organization-only everywhere).
7. **Meta description truncation:** several posts run 196–246 chars; rewrite to ≤155 during each retarget.
8. **Post-deploy ritual (every refresh):** GSC URL inspection → request indexing; annotate the date; watch the query report 4–6 weeks before touching the URL again.

---

## D. Pillar-cluster integration — 9 chapters × 11 refreshed posts × ALE-232 first-10

### Keyword ownership decisions (binding, anti-cannibalization)

| Keyword (tier) | OWNER | Others link in (never compete in title/H1) |
|---|---|---|
| crew turnover knowledge loss superyacht (B, flagship) | knowledge-crisis-superyachts | all handover-cluster posts |
| chief engineer handover checklist (B) | engineering-handover-superyacht | knowledge-crisis, cross-domain-actions |
| engine room handover checklist (B) | engineering-handover-superyacht (subsection) | spin out a dedicated URL ONLY if GSC shows the subsection can't rank after 6–8 weeks |
| best yacht maintenance software (A) | siloed-maintenance-systems | seven-connections (evaluation angle, one supporting mention) |
| ship management software vs Excel (A) | software-bypass-superyachts | siloed (spreadsheet subsection links here) |
| verifiable auditable maintenance record yacht (A) | warranty-claim-documentation | audit-trail-superyacht links in with keyword anchor |
| yacht maintenance log book digital records (B) | fault-patterns-superyachts | warranty post (secondary support only) |
| how to organize yacht manuals onboard (B) | natural-language-search-yacht | — |

### ALE-232 first-10 plan, reconciled (5 become refreshes/folds, 5 stay NEW)

| ALE-232 # | Keyword | Resolution |
|---|---|---|
| 1 | crew turnover knowledge loss superyacht | **REFRESH** knowledge-crisis-superyachts (queue #2) — Google already trusts this URL (94 impr, pos 8.3); a new URL would compete with our own signal |
| 2 | chief engineer handover (notes/checklist) | **REFRESH** engineering-handover-superyacht (queue #1) — its H2 already matches; the downloadable checklist becomes the printable one-pager there |
| 3 | yacht maintenance log spreadsheet template (A) | **NEW URL** — no existing post; links to/from software-bypass's Excel comparison |
| 4 | ISM internal audit checklist yacht | **NEW URL** — compliance lead magnet; no existing post |
| 5 | how to organize yacht manuals onboard | **REFRESH** natural-language-search-yacht (queue #9) — existing search post is the vehicle; add the practical how-to half |
| 6 | how to digitize yacht maintenance records | **NEW URL** — migration guide; links to fault-patterns (log book) + natural-language-search (payoff) |
| 7 | engine room handover checklist | **SUBSECTION** of engineering-handover refresh; conditional dedicated URL later (see ownership table) |
| 8 | ISM Code yacht requirements | **NEW URL** — knowledge-crisis already reserves an internal-link slot for it ("add a link slot once one exists") |
| 9 | yacht maintenance log book digital records | **REFRESH** fault-patterns-superyachts (queue #7) — exact keyword match |
| 10 | how to manage maintenance on a superyacht | **NEW URL** — MOFU hub linking #1–#9; different content shape from anything existing; seven-connections weaves the phrase once and links to it |

### Chapter map (which posts prove which chapter)

| Chapter | Pillar / cluster posts | Notes |
|---|---|---|
| **handover** | PILLAR: knowledge-crisis (flagship) + engineering-handover (checklist asset). Cluster: cross-domain-actions (support), folded auto-generated-handover, NEW #4/#8 ISM posts link in | Strongest demand cluster; every post uses "captured as you work" canon |
| **search** | PILLAR: natural-language-search (manuals refresh). Cluster: NEW #6 digitize-records, siloed (one-search test), software-bypass (friction) | Enumerate domains, never "every domain" |
| **ledger** | PILLAR: audit-trail-superyacht. Cluster: warranty-claim (Tier-A money page), fault-patterns (history angle), future PSC post (Tier-B #12, not in first-10) | Append-only is the safe spine claim |
| **verifier.celeste7.ai** | No dedicated post. Linked as the proof payoff from warranty-claim, audit-trail, siloed, software-bypass | Host is verifier. — verify. is NXDOMAIN |
| **suggested documents** | No dedicated post (truth constraint: manual link + discovery only). Carried as lines + `suggested-docs-component.png` in the manuals refresh | NEVER propagation/cascade |
| **certificate bundle** | VITAMIN — lines + supporting visuals only (`certificate-lens.png` in knowledge-crisis, seven-connections card 06, NEW ISM posts) | Never a hero section or dedicated post (offer canon) |
| **show related** | Carried inside fault-patterns, siloed (the test section), seven-connections card 03, warranty-claim | Strongest fully-live moment — lead with it visually, no dedicated URL needed |
| **cloud-based** | software-bypass (vs Excel/WhatsApp), NEW #3 spreadsheet template, NEW #6 digitize records | "CelesteOS is the planned maintenance system"; no offline/real-time claims |
| **security** | No blog post yet. NEW #4/#8 ISM posts carry the calibrated lines (ISM "Aligned — Sections 10 and 11. Audit evidence, not class approval") | Only the full calibrated sentences from allowlist §9 |

### Sequencing

1. **Week 1 — Phase 0:** §B truth pass across all 11 posts + §C items 1–5 (one deploy). This is the brand-risk burn-down; nothing else ships before it.
2. **Weeks 1–2:** refresh queue #1–#3 (engineering-handover + knowledge-crisis + the fold). Highest GSC trust, lowest effort-to-fit.
3. **Weeks 2–4:** queue #4–#7 (the three Tier-A money retargets + fault-patterns).
4. **Weeks 4–6:** queue #8–#11 (seven-connections de-cannibalized, manuals expansion, audit-trail, cross-domain truth-fix if not already done in Phase 0).
5. **From week 3 in parallel:** ALE-232 NEW URLs in plan order #3 → #4 → #6 → #8 → #10 (the hub last, so it has everything to link to).
6. **Continuous:** GSC reindex + annotation per deploy; 4–6-week observation window per URL; feed new striking-distance queries back into this queue (ALE-238 loop).
