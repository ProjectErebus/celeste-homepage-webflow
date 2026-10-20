# ASSET REGISTRY — CelesteOS content engine

The quality firewall. Every asset below was rendered from the component prototypes in
`/Users/celeste7/Desktop/pilot-call-bundle/renders/`, screenshotted at 1440×900, **viewed and judged by a human-grade reviewer** against:

1. **Render correctness** — no broken layout, no missing CSS, no error text, no spec-callout badges, no demo-state buttons.
2. **Brand canon (restraint)** — banned hype words on product claims: AI / smart / ML / automate / seamless / optimize. Calm, evidence-led, one focal point per media.
3. **Production truth (2026-06-05 audit)** — claims an asset supports MUST be in the SAFE/LIVE list. Overclaims are listed per-asset as **NEVER** lines. Pricing/$ figures are CALL-ONLY and never appear in captions.

A local LLM using these assets must NOT judge them — pick by chapter + claim, copy the approved alt text, respect the NEVER lines and usage notes verbatim.

**Global truth rules (apply to every asset):**
- Handover: say "captured as you work", "one tap from the queue into the draft". NEVER "writes itself", NEVER "auto-generated".
- Suggested documents: say "suggested — you confirm", "manual linking + discovery". NEVER "auto-propagates", NEVER "cascades automatically".
- Ledger: say "append-only". NEVER "hop back / resume like Chrome history", NEVER "sealed PDF" (planned, not live).
- Search: say "natural-language search across records and manuals". NEVER "every domain cited".
- Verifier host is **verifier.celeste7.ai** (verify.celeste7.ai is dead).
- No money-finder / [VERIFY]-tag depictions. No $ figures.

---

## Accepted assets

| id | file | what it shows | chapter | claims it can support | approved alt text | usage notes |
|----|------|---------------|---------|----------------------|-------------------|-------------|
| search-results | `assets/search-results-grouped.png` | Query "oil" with an "Understood: oil filter · main engine · location" line and results grouped FAULTS / INVENTORY / DOCUMENTS, each row citing ref · severity · status | search | Natural-language search across records and manuals; results grouped by domain with the record reference visible; keyboard-first (navigate/open/esc) | Searching "oil" in CelesteOS: results grouped into Faults, Inventory and Documents — an engine-room oil leak fault, oil filter stock levels, and the engine oil change procedure from the machinery manual. | Strongest search frame. Do NOT claim "every domain cited" (gating uncertain). The "Understood" line is interpretation display, not an "AI" claim — never caption it with banned words. |
| handover-draft | `assets/handover-draft-drawer.png` | Dark drawer "My Handover Draft — 7 items · Engineering": day-grouped items (fault, work order, equipment, parts, note) with severity badges, Export Handover + Add Note buttons | handover | Handover captured as you work — items collect into a draft day by day; export when ready; nothing retyped at crew change | The handover draft drawer in CelesteOS: seven items grouped by day — a critical coolant fault, an oil-change work order, a watermaker note — each tagged and time-stamped, with an Export Handover button at the top. | NEVER "writes itself" / "auto-generated" / "auto-written". Reality: 1-tap capture from a queue into the draft. Tall right-hand drawer crop (460×900); some dark space below the list is the real drawer surface. |
| handover-export | `assets/handover-export-report.png` | Cover page of the exported Technical Handover Report (document no., generated timestamp, period, contents by department) | handover | The draft exports to a formal, dated handover report; covers N items across departments; reads like a document a surveyor can hold | Cover page of a CelesteOS technical handover report: document number, generation date, the period covered, and a contents list by department. | "Generated" on the cover = export timestamp; never caption the CONTENT as auto-written. Do not call the export "sealed PDF" (not live). First-page viewport crop of a longer document. |
| handover-signatures | `assets/handover-signature-block.png` | Sign-off section: "Both sides have read this report." — outgoing C/E signed/sealed, incoming C/E critical acknowledgement, captain notified at sign-off, receipt line "independently verifiable at verifier.celeste7.ai" | handover, verifier.celeste7.ai | Outgoing/incoming two-signature flow (live); incoming chief acknowledges in writing; captain notified at sign-off — no one can claim they weren't told; receipt independently verifiable on the verifier | The handover sign-off in CelesteOS: outgoing and incoming chief engineers' signatures side by side, the incoming chief's written acknowledgement above, and a note that the captain was notified at sign-off. | Hostname in-image was corrected to verifier.celeste7.ai before capture (source HTML says verify. — dead host; fix upstream before re-rendering). "Sealed" here refers to the receipt, which is live — do NOT extend to "sealed PDF". |
| handover-linked | `assets/handover-linked-records.png` | One handover entry (starboard chiller short-cycling) with LINKED RECORDS panel: fault, work order, part, OEM bulletin — each resolving to a live entity ("View Fault →") | handover, show related | The handover wormhole (live): every entry links to the live record — incoming chief reads, clicks, lands in the fault/WO/part/document itself | A single handover entry in CelesteOS with its linked records panel: the original fault, the work order with labour hours, the replacement part, and the OEM bulletin cited in the diagnosis — each one a link into the live record. | The in-image caption "Every entry in the handover behaves like this" is approved. Card crop 720×520. |
| certificate | `assets/certificate-lens.png` | Dark certificate lens: STCW Certificate of Competency, Valid + renewal-due-92-days badges, authority/expiry/survey-window fields, holder's all-documents list with CURRENT/EXPIRING/EXPIRED counts | certificate bundle | Certificates with expiry and survey windows visible; per-holder document list with current/expiring/expired status at a glance; upload renewed version | A crew certificate in CelesteOS: an STCW Certificate of Competency marked Valid with renewal due in 92 days, its issuing authority and survey window, and below it the holder's full document list with current, expiring and expired counts. | A "Fields auto-filled from scanned document" strip was HIDDEN before capture (banned "auto-" family, unverified vs shipped code) — do not re-render with it. Cert-expiry is a VITAMIN per offer canon: use as supporting line/visual, not a headline feature. |
| suggested-docs | `assets/suggested-docs-component.png` | Equipment documents panel: one linked manual, then SUGGESTED DOCUMENTS — three OEM docs each asking "Want to add this document to the equipment?" with match % and accept/decline buttons | suggested documents | Documents suggested with a match score — a person confirms every link; discovery of relevant OEM bulletins/schematics you didn't know you had | The suggested documents panel on a generator in CelesteOS: three Caterpillar documents found for this equipment — a fuel-system bulletin, a cooling diagram, a vibration procedure — each waiting for the engineer to accept or decline. | NEVER "auto-propagation" / "cascades" (not shipped — manual linking + discovery only). Spec callout badges and a "Cascaded from equipment" meta line were removed before capture; do not re-render with them. |
| fault-detail | `assets/fault-detail-related.png` | Dark fault lens: port fuel isolation valve leak — status/severity badges, equipment link, corrective action narrative, RELATED ENTITIES (work order, equipment, warranty claim) | show related, search | Show-related (fully live — the strongest moment): from a fault, the related work order, equipment and warranty claim are one click away; the full corrective-action story lives on the record | A fault record in CelesteOS: a port fuel isolation valve leak under review, the corrective action written out, and its related entities below — the replacement work order, the valve assembly, a warranty claim. | Show-related is the strongest verified claim — lead with it. Viewport crop; related list continues below the fold. |
| work-order | `assets/work-order-detail.png` | Dark work order lens: emergency valve replacement — in progress/critical, due date, 500-hr schedule, est/actual hours, OFFICIAL DOCUMENTS (SOP, ISM procedure, class certificate) | show related, search | Work orders carry their official documents (SOP, ISM procedure, class cert) on the record; running-hours schedule and time tracking visible | A work order in CelesteOS: an emergency valve replacement in progress, its 500-hour schedule and time estimates, and the official documents attached — the SOP, the ISM isolation procedure, the engine-room fire-safety class certificate. | Calm evidence frame for "the record carries its paperwork". No banned-word risks in-image. |

---

## Rejected renders

| render | verdict | reason |
|--------|---------|--------|
| `render-cascade-decisions.html` | REJECTED — truth | Its entire story is document AUTO-PROPAGATION: "ACCEPTED ON EQUIPMENT → CASCADES" fanning out to fault/WO/part, each stamped "Cascaded from equipment". Per the production-truth audit this is NOT shipped (manual linking + discovery only) — the image IS the banned claim, unsalvageable by cropping. Also: numbered callout badges overlap the link text (3/4/5 sit on top of document names). |
| `render-equipment-detail.html` | REJECTED — broken + truth | "Other attachments" row renders as empty grey placeholder boxes (missing images — reads as a broken render). Carries the same "Cascaded from equipment" propagation claim and five spec-callout badges in-frame. The chapter is already covered by the sanitized `suggested-docs-component.png`. Fixable: supply the attachment thumbnails, strip callouts + cascade copy, then re-submit. |
| `render-multi-vessel.html` | REJECTED — broken + canon | Layout is mostly an empty dark frame: a vessel-switcher dropdown floating over a blank content area, callout badges (1/3/4) clipping the dropdown edge, truncated sidebar. Also fleet/multi-vessel is a VITAMIN per the offer canon — featuring it makes us "look like the PMS". Do not admit even if fixed, without CEO sign-off. |

### Sanitizations applied (superseded raw captures — not admitted)
- `render-search-results.html` raw capture included demo state-switcher buttons → re-shot with them hidden (both states admitted).
- `render-certificates.html` raw capture included a "Fields auto-filled from scanned document" strip → banned "auto-" family + unverified vs shipped code; re-shot with the strip hidden.
- `render-suggested-docs-tab.html` raw capture included numbered spec callouts + one "Cascaded from equipment" meta line → re-shot with callouts hidden and the cascade suffix removed.
- `render-handover-signature-block.html` source contains `verify.celeste7.ai` (dead host) → corrected to `verifier.celeste7.ai` in-DOM before capture. **Fix the source HTML before any future re-render.**

*Registry built 2026-06-11 from pilot-call-bundle renders, judged against the 2026-06-05 production-truth audit and brand canon.*


## Retired assets (founder ruling 20 Oct 2026)

Hours of rest, email, shopping list, purchase order and receiving pages no longer exist on the product. These screenshots show them, so they are removed from lib/assets.json (moved to lib/assets-retired.json). The gate rejects any draft that references them. Retake without the retired pages before reuse.

- search-idle: Screenshot shows a Receiving expected today item, Shipment Arriving and Log HOR quick filters (receiving, hours of rest retired).
- ledger: Screenshot shows a PO-2026-0087 purchase order entry in the activity timeline (purchase orders retired).
- parts: Screenshot shows a Raise Purchase Order button (purchase orders retired).
- vessel-surface: Needs-attention list includes a receiving / parts delivery item (receiving retired).
- surface-full: Dashboard grid shows hours of rest, purchase order, shopping list and receiving cards (all retired).
- surface-sidebar: Navigation shows Hours of Rest, Email, Purchase Orders (all retired).