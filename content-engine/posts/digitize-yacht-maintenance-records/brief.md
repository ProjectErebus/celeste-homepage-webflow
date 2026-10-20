# Brief — digitize-yacht-maintenance-records

> The spec Claude drafted against. NEW post (no retarget).
> Claude writes `posts/digitize-yacht-maintenance-records/draft.html` (BODY html + `{{asset:id}}` placeholders), then it passes `gate.mjs`, then the founder gates `publish.mjs`.

## Target

- **Keyword:** `how to digitize yacht maintenance records`
- **Chapter:** `search`
- **Format:** migration guide (how-to / informational)
- **Slug / URL:** `/blogs/digitize-yacht-maintenance-records`
- **Canonical:** `https://celeste7.ai/blogs/digitize-yacht-maintenance-records`
- **Search intent:** A chief engineer, ETO, or superintendent holding paper binders and Excel exports wants a practical path to a searchable record. Lead with the steps; land the product as the payoff — natural-language search returning the actual record, not a snippet.

## Angle

"From Paper Binders to Searchable History — digitizing yacht maintenance records." The payoff is not "scanned PDFs in a folder" (that is still un-findable). The payoff is asking a plain question and landing on the underlying record — the fault, the work order, the manual page.

## SAFE claim phrasings used (search chapter — verbatim or trivially inflected)

- Natural-language search across your vessel's records and manuals.
- Type what you'd ask a colleague.
- Search returns the record, not a snippet.
- Finds what you mean, not what you typed.
- Results open the source record itself.
- Results are scoped to your vessel and role — no filter to set up first.
- Your existing manuals, PDFs, scans, exports, and emails are indexed as they are. No reformatting exercises.
- CelesteOS is the planned maintenance system.
- Open any record and CelesteOS surfaces what's related — work orders, parts, equipment, handovers, and correspondence. (show-related, fully live — the strongest moment)
- The audit trail is append-only. (ledger)

## Do NOT write (gate hard-fails these)

- No AI/smart/ML/automate/seamless/optimize/magic/revolutionary/intelligent lexicon as product claims.
- No "every domain cited", "all 14 domains", "mapped to root cause", "real-time", "sub-second", "works offline", "sealed PDF", "money-finder", "cascade/propagate" (suggested-docs), "knowledge graph".
- No pricing or currency figures (CALL-ONLY).
- Host is `verifier.celeste7.ai` — never `verify.`.
- "Immediately searchable" → "searchable as soon as import completes."
- Onboarding: "measured in days, not months" — never "in hours".

## Assets used

- `{{asset:search-results}}` — the payoff: "oil" grouped into Faults / Inventory / Documents, each citing the record reference. NEVER "every domain cited".
- `{{asset:fault-detail}}` — show-related from a fault to its work order, equipment, warranty claim. Strongest live moment.
- `{{asset:work-order}}` — the work order carries its official documents (SOP, ISM procedure, class cert) on the record.

## Internal links

- `/blogs/natural-language-search-yacht` — plain-language search
- `/blogs/knowledge-crisis-superyachts` — knowledge walking off the gangway
- `/blogs/audit-trail-superyacht` — append-only audit trail
- verifier → `https://verifier.celeste7.ai`
- CTA → `/#pilot`

## Sources (industry stats — named, cited)

- Seahub — paper/spreadsheet maintenance record-keeping prevalence and risk.
- IMO ISM Code §10 — records of maintenance activity must be kept.
- Boat International — hidden cost of external technician callouts.

## Structure

- One `<h1>` (angle title), meta line, lede.
- H2 sections: the binder problem → why scanning isn't digitizing → the migration steps (`<ol>`) → the payoff (search returns the record) → show-related → audit trail across the migration.
- FAQ (4 Qs) → FAQPage schema in meta.json.
- Summary `<ul class="summary-list">`.
- `<div class="article-sources">` numbered refs.
- `<div class="article-cta">` → `/#pilot`.
