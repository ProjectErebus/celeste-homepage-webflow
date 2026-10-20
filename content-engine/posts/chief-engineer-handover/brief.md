# Brief — chief-engineer-handover

> Refresh of the best-performing handover URL (97 impr · pos 7.1 · 3 clicks — top URL on site).
> Claude writes `posts/chief-engineer-handover/draft.html` (BODY html + `{{asset:id}}` placeholders),
> then it passes `gate.mjs`, then the founder gates `publish.mjs`.

## Target

- **Keyword:** `chief engineer handover checklist`
- **Chapter:** `handover`
- **Format:** structured guide / checklist (how-to + informational)
- **Slug:** `chief-engineer-handover`
- **Canonical / served URL:** `https://celeste7.ai/blogs/engineering-handover-superyacht` (REFRESH the trusted URL — do NOT mint a new one)
- **Search intent:** the reader wants the *checklist itself*. Lead with the practical, numbered structure; land CelesteOS as the payoff that makes the manual reconstruction stop mattering.

## Why a refresh, not a rewrite

The existing page ranks (pos 7.1, 97 impr). Keep its trust:
- keep the seven-domain spine, the Seahub / Manta / ISM / REG-Code citations, the "no industry-standard format" finding;
- keep the warranty-loss anchor and the ISM-doesn't-solve-it argument.

Deepen + retarget:
- retarget H1 + meta + first 100 words to the exact keyword "chief engineer handover checklist";
- convert the seven domains to a numbered `<ol>` (ItemList-friendly) with one tight line each;
- ADD a new "Engine room handover checklist" section (generators, watermakers, bilge/fire config, alarm thresholds) — the concrete, secondary-keyword section the old page lacked;
- ADD a "what the captured draft contains" payoff — the captured-as-you-work draft is the differentiator vs a paper checklist;
- ADD a 4-question FAQ (FAQPage schema in meta.json).

## Truth fixes carried over (the old page violated the gate)

The live page used **banned** phrasings that must NOT survive the refresh:
- "auto-generates structured handover documents" → "captured as you work / one tap from the queue into the draft"
- "generated from the vessel's operational data — automatically pulling…" → "compiled from the entries the engineer captured"
- "compiled report / surfaced automatically / without manual assembly" → "the draft accumulates as the engineer works"
- "Maritime Technical Intelligence System" → drop the legacy name entirely
The system PROPOSES, the engineer DECIDES. Nothing writes itself.

## SAFE claim phrasings available (handover chapter — use verbatim or trivially inflected)

- Captured as you work.
- Every record an engineer closes — a fault, a work order, a note — offers a single tap to add it to the handover draft.
- The draft accumulates as the engineer works.
- Months of context accumulate as a by-product of normal work.
- Never asked twice if dismissed.
- The outgoing engineer reviews the draft, then signs. The incoming engineer acknowledges in writing that the operational state of the vessel has been read and understood.
- Both signatures timestamped. Locked after dual signature.
- Every entry resolves back to a live record — one click opens the fault, the work order, the part.
- The handover is a live index into the vessel's operational data, not a static document.
- The incoming engineer inherits context, not chaos.
- Built from one-tap captures as the engineer works — reviewed, then signed by both parties.

## Do NOT write (gate hard-fails these)

writes itself · auto-generated / auto-generates · assembled/compiled automatically · assembles itself ·
not assembled manually · "you review, we create" · "generated from operational data" ·
AI/smart/automate/seamless/optimize/magic/revolutionary/intelligent lexicon ·
every domain / sealed PDF / sub-second / real-time / works offline ·
any pricing or $/€/£ figure · `verify.celeste7.ai` (host is `verifier.celeste7.ai`) ·
invented metrics / unsourced counters.

## Assets (placeholders; publish.mjs resolves to <figure> with approved alt)

- `{{asset:handover-draft}}` — the draft drawer (seven items, day-grouped, Export button). Place in the checklist payoff. NEVER "writes itself"/"auto-generated".
- `{{asset:handover-linked}}` — one handover entry with its linked-records panel (fault, WO, part, OEM bulletin). Place at "every entry resolves to a live record".
- `{{asset:handover-export}}` — cover page of the dated handover report. Place at the export/sign-off payoff. Never call it "sealed PDF".

## Internal links

- crew turnover / knowledge loss → `/blogs/knowledge-crisis-superyachts` (handover pillar)
- warranty evidence → `/blogs/warranty-claim-documentation`
- audit trail → `/blogs/audit-trail-superyacht`
- the product handover → `/#handover`
- verifier → `https://verifier.celeste7.ai`
- pilot CTA → `/#pilot`

## Required structure

- one `<h1>` near-match of the keyword; honest, specific.
- Apple-style lede (first sentence carries the claim).
- problem-led sections; the seven-domain checklist as a numbered `<ol>`; an engine-room section.
- payoff section = the captured draft (one suggested asset), CelesteOS named LATE.
- FAQ H2 + 4 question H3s → FAQPage schema in meta.json.
- `<ul class="summary-list">` takeaways.
- numbered `<div class="article-sources">`.
- close on a calm CTA → `/#pilot`.

## References to carry (verified on the existing page)

[1] Seahub — engineering handover survey (66% last ≤1 week; no standard format).
[2] YATCO — warranty-claim cost band ($20,000–100,000+).
[3] Manta Maritime — Chief Engineer's Handover Checklist (2014 paper template).
[4] IMO — ISM Code Sections 6 & 10.
[5] KRM Yacht — REG Yacht Code / flag-state rules.
