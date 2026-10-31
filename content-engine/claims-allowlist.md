---
pack_id: celeste-brand-pack
version: 1.0.0
---
# CelesteOS Claims Allowlist — the truth gate (v2)

**Status:** Canon. Every artifact (blog, site page and meta, email, LinkedIn, Meta, Google Ads, social) is checked against this file before it ships.
**Sources of truth:** 2026-06-05 production-truth audit (verified vs shipped Cloud_PMS code), pilot-call-companion.html (claims actually made to prospects), CEO brand canon (restraint), the customer contract (FD4: where site or allowlist copy conflicts with the contract, the contract wins), and brand pack 10 §4–§7 (merged here; spec 29 §3).
**Rule of precedence:** if a phrase appears in BANNED anywhere in this file, it loses — even if a SAFE claim sounds similar. When in doubt, claim less.

**This file is the source. `lib/claims.json` is generated from it** by `node content-engine/gen-claims.mjs`, which also writes `lib/claims.json.sha256`. Never hand-edit the json. `node content-engine/gen-claims.mjs --check` fails if the two drift, and the gate refuses to run (fail-closed) when they do.

Severity legend used below:
- **BANNED** — never publish. Mechanical gate must hard-fail.
- **NEEDS-EVIDENCE** — treat as banned until a verified measurement / live confirmation exists. Gate flags for human review.
- **CALL-ONLY** — never in published copy; reserved for live conversations. The only exceptions are the `commercial.C*` lines below, on the channels they list.

### How an approved (SAFE) line is written
``- `<chapter>.<P|S|C|M><nn>` [channels] "text"`` — use verbatim or trivially inflected. Rewording means adding a `variant:` here in a founder-merged PR.
Channel codes: **B** blog · **L** page meta and site body · **E** email · **LI** LinkedIn · **M** Meta · **G** Google Ads · **SG** social (FB/IG). An id that carries both LI and M is also allowed on SG.
Ids are permanent: a retired line keeps its id out of use.

---

## 0. GLOBAL <!-- chapter: global -->

### SAFE
- `global.P01` [B L E LI M G] "CelesteOS is the planned maintenance system."
  - short: "The planned maintenance system"
- `global.P21` [B L E LI M G] "The system proposes; the engineer decides. Nothing executes without explicit consent."

---

## 1. SEARCH <!-- chapter: search legacy="search" -->

### SAFE (approved phrasings — use verbatim or trivially inflected)
- `search.P02` [B L E LI M G] "Natural-language search across your vessel's records and manuals."
  - short: "Natural-language vessel search"
- `search.P03` [B L E LI M G] "Type what you'd ask a colleague."
- `search.P04` [B L E LI M] "Search returns the record, not a snippet. Results open the source record itself."
- `search.P05` [B L E LI M G] "Finds what you mean, not what you typed."
  - short: "Finds what you mean"
- `search.P22` [B L E LI] "Search lives at the top of every screen — phone, tablet, laptop."
- `search.P23` [B L E LI] "Every result is a live record. One click lands on the actual work order — status, history, parts."
- `search.P24` [B L E LI] "There is nothing to learn. The engineer types what they need."
- `search.P25` [B L E LI] "Results are scoped to your vessel and role — no filter to set up first."

### BANNED overclaims
| id | Banned phrasing | Why | Safe substitute |
|---|---|---|---|
| U02 | "Every answer cites its source" / "every domain cited" | Domain-cited gating uncertain in live code (F1 gating vs SEARCH8888 — unconfirmed). | "Results open the source record itself." |
| U04 | "No hallucinated content" / any "hallucinat*" | Invokes AI-magic framing; banned lexicon territory. | "If CelesteOS cannot find a record, it says so." (only if live-confirmed; until then omit) |
| U02 | "All 12 domains simultaneously" / "All 14 domains" / "every domain" | Exhaustive-coverage guarantee not live-verified for all domains (faults/certs coverage was historically gated). | "Across work orders, documents, and the vessel's records." Name only domains you can demo. |
| U05 | "Sub-second" / any latency number | NEEDS-EVIDENCE — no published measurement. | "Fast enough to use at 2am." (no number) |
| U06 | "Mapped to root cause" | Similarity surfacing, not causal mapping. Nothing maps root cause. | "Fault history, with prior occurrences surfaced alongside." |
| U03 | "Entity extraction + semantic search" as buyer copy | Mechanism talk drifts toward ML claims. | "Finds what you mean, not what you typed." |

### CALL-ONLY
- Index size, latency numbers, % vectorised, infrastructure details.

---

## 2. HANDOVER <!-- chapter: handover legacy="handover" -->

### SAFE (approved phrasings)
- `handover.P06` [B L E LI M G] "Captured as you work."
  - variant: "Captured as the engineer works."
  - note: canonical handover line
- `handover.P07` [B L E LI] "The outgoing engineer reviews the draft, then signs; the incoming engineer acknowledges. Both signatures timestamped."
- `handover.P08` [B L E LI M] "Every handover entry resolves back to a live record."
- `handover.P09` [B L E LI M G] "The incoming engineer inherits context, not chaos."
  - short: "Context, not chaos"
- `handover.P26` [B L E LI] "Every record an engineer closes — a fault, a work order, a note — offers a single tap to add it to the handover draft."
- `handover.P27` [B L E LI] "The draft accumulates as the engineer works."
- `handover.P28` [B L E LI] "Months of context accumulate as a by-product of normal work."
- `handover.P29` [B L E LI] "Never asked twice if dismissed."
- `handover.P30` [B L E LI] "Both signatures timestamped. Locked after dual signature."
- `handover.P31` [B L E LI] "The handover is a live index into the vessel's operational data, not a static document."
- `handover.P32` [B L E LI] "Built from one-tap captures as the engineer works — reviewed, then signed by both parties."

### BANNED overclaims
| id | Banned phrasing | Why | Safe substitute |
|---|---|---|---|
| U01 | "The handover writes itself" / "writes itself" (any subject) / "already written" / "watch it assemble" | Reality = 1-tap capture from a queue into a draft. Nothing writes itself. | "Captured as you work." |
| U03 | "auto-generated" / "auto-generates" / "generated automatically" | Same. | "Built from one-tap captures, reviewed before signing." |
| U01 | "assembled automatically" / "compiled automatically" / "assembles itself" / "not assembled manually" / "assembles from logged work" | Same. | "The draft accumulates as the engineer works." |
| U01 | "The departing engineer does not need to remember what to include. The system already has it." | Implies full auto-assembly; capture requires the engineer's tap. | "Each tap while working is one less thing to remember at rotation." |
| U01 | "Rough notes become a structured handover" | Implies transformation without the capture step. | "One-tap captures become the handover draft." |
| U01 | "You review, we create" | "We create" = auto-write framing. | "You capture as you work. You review. Both sides sign." |
| U01 | "Generated from operational data — not memory" | "Generated" framing. | "Compiled from the entries the engineer captured — not from memory." |

### CALL-ONLY
- Draft entry counts ("200+ entries") unless from a real, citable pilot vessel.

---

## 3. LEDGER <!-- chapter: ledger legacy="ledger" -->

### SAFE (approved phrasings)
- `ledger.P10` [B L E LI M G] "The ledger is append-only. Nothing is ever overwritten."
  - short: "Append-only audit trail"
- `ledger.P11` [B L E LI M] "Every action is attributed and timestamped: who acted, what, when, which record."
- `ledger.P12` [B L E LI M G] "Audit prep becomes retrieval, not assembly."
- `ledger.P33` [B L E LI] "Corrections are recorded as new entries referencing the original. The original remains intact."
- `ledger.P34` [B L E LI] "Open any record and read its full audit trail."
- `ledger.P35` [B L E LI] "Deleted rows are struck through, never purged — the trail is the trail."
- `ledger.P36` [B L E LI] "The audit trail is not a feature. It is a legal defence."
- `ledger.P37` [B L E LI] "Records that can be retroactively modified cannot serve as evidence."

### BANNED overclaims
| id | Banned phrasing | Why | Safe substitute |
|---|---|---|---|
| U32 | "Hop back into anyone's work" / "pick a record back up days later" / "browser history" / any Chrome-history / resume framing | No resume capability is shipped. | "Open any record and read its full audit trail — who touched what, when." |
| U07 | "Sealed PDF" / "audit trail exportable as a structured PDF" | Planned (v1.0), not live. | "Every record's history is available on demand, and independently verifiable at verifier.celeste7.ai." |
| U16 | "The system records who opened it, when, and for how long" / "measured duration" / "whether they read it in full" | Read-duration / read-completion tracking is NOT in the verified-shipped set. | "Actions on records are logged — created, updated, signed, linked." (NEEDS-EVIDENCE before any read-event claim) |
| U16 | "Read events logged — evidence of awareness" | Same — NEEDS-EVIDENCE. | Omit, or scope to actions. |
| U03 | "records interactions automatically" | Auto-stem; also implies passive read-tracking. | "Actions are recorded as the crew works — no checkbox, no extra step." |
| U34 | "One click on Generate warranty claim pack" / "audit-grade pack in seconds" | Money-finder/claim-pack territory — pull-on-open, not buyer-visible; do not depict. | "Warranty history and its evidence live on the record." (roadmap tease only, clearly labelled) |
| U37 | "named individual" as a universal claim | Live attribution defaults to role (Captain/Chief); personal-name display is gated. | "attributed — by signed-in user and role — and timestamped" |

### CALL-ONLY
- Notification routing internals (L2 attest, SigL4), seal-chain mechanics.

---

## 4. VERIFIER.CELESTE7.AI <!-- chapter: verifier legacy="verifier.celeste7.ai" -->

### SAFE (approved phrasings)
- `verifier.P13` [B L E LI M] "Key actions (faults, work orders, handovers, signatures) are sealed into a receipt anyone can verify at verifier.celeste7.ai."
- `verifier.P38` [B L E LI] "Every record independently verifiable → verifier.celeste7.ai"
- `verifier.P39` [B L E LI] "Verify a sample receipt."
- `verifier.P40` [B L E LI M G] "Proof, when proof matters."
- `verifier.P41` [B L E LI] "Few systems produce proof. CelesteOS seals its records."

### BANNED overclaims
| id | Banned phrasing | Why | Safe substitute |
|---|---|---|---|
| U15 | "verify.celeste7.ai" (any reference) | NXDOMAIN. The live host is **verifier.celeste7.ai**. | "verifier.celeste7.ai" |
| U07 | "Sealed PDF" / "download the sealed PDF" | Planned, not live. | "Verify the receipt online at verifier.celeste7.ai." |
| U02 | "seals every action" / "every action is sealed" (absolute) | Sweeping absolute; seal coverage is per-flow. | "seals key actions — faults, work orders, handovers, signatures" |

### CALL-ONLY
- Hash-chain mechanics, HMAC implementation details.

---

## 5. SUGGESTED DOCUMENTS <!-- chapter: suggested_docs legacy="suggested documents" -->

### SAFE (approved phrasings)
- `suggested_docs.P15` [B L E LI] "Suggested documents appear with a match score; the engineer accepts or denies with one tap."
- `suggested_docs.P16` [B L E LI M G] "Finds the manual even when nobody remembers the filename."
- `suggested_docs.P42` [B L E LI] "Accept links the document to the record in front of you."
- `suggested_docs.P43` [B L E LI] "Deny is per-record. Every accept and deny is recorded in the ledger."
- `suggested_docs.P44` [B L E LI] "Documents connected to the work they describe."

### BANNED overclaims
| id | Banned phrasing | Why | Safe substitute |
|---|---|---|---|
| U18 | "Accept once on the equipment. It propagates everywhere." | AUTO-propagation is NOT shipped. Only manual linking + discovery exist. | "Accept links the document to the record in front of you." |
| U18 | "cascade" / "cascades to every fault, WO, part" / "cascaded to every entity" / "walks the equipment graph" | Same — cascade not shipped; also graph framing is false (similarity, not graph). | "Linked documents are discoverable from related records via Show Related." |
| U18 | "every fault, every work order opens with its manuals already attached" | Depends on the unshipped cascade. | "Suggestions surface on faults, work orders, parts, and equipment; the engineer links with one tap." |
| U03 | "1536-dimension vector" / "cosine similarity" / "embedded using the same model" in buyer copy | Mechanism talk = ML claim drift. | "Matched by content and metadata." |
| U03 | "it learns from the corpus" | "Learns" = ML/AI product-magic claim. | "Matched by content and metadata." |
| U03 | "auto-link" (any form) | Auto-stem + propagation implication. | "one tap links" |

### CALL-ONLY
- Refresh cadence ("daily re-embed"), match-score thresholds.

---

## 6. CERTIFICATES <!-- chapter: certificates legacy="certificate bundle" -->

**Positioning rule (CEO canon): certificates are a VITAMIN — mention in lines, never feature as a hero section. Featuring them = "looking like the PMS".**

### SAFE (approved phrasings — single lines only)
- `certificates.P17` [B L E LI] "Certificates tracked to expiry, source PDF attached; alerts as expiry approaches."
  - note: one line only, never a hero
- `certificates.P45` [B L E LI] "Cross-linked to the equipment it certifies."
- `certificates.P46` [B L E LI] "Certificates current and findable on inspection day."

### BANNED overclaims
| id | Banned phrasing | Why | Safe substitute |
|---|---|---|---|
| U03 | "Auto-alerts" | Auto-stem. | "Alerts as expiry approaches." |
| U08 | "Auto-alerts at 30 / 14 / 7 days" (the schedule, in any spelling) | Specific schedule NEEDS-EVIDENCE (not live-verified). | "Alerts as expiry approaches." |
| U37 | Featuring a certificate-bundle hero section / dedicated chapter page | Vitamin rule — lines only. | One line inside a painkiller chapter. |
| U07 | "One-click inspection bundle" / "bundle export" | Bundle export not in the verified-shipped set. | "Certificates current and findable on inspection day." |

### CALL-ONLY
- Anything about bundle/export roadmap.

---

## 7. SHOW RELATED <!-- chapter: show_related legacy="show related" -->

**This is the strongest fully-live moment. Lead with it.**

### SAFE (approved phrasings)
- `show_related.P14` [B L E LI M G] "Open any record and CelesteOS surfaces what's related: work orders, parts, equipment, handovers."
  - note: 96 chars, so it never fits a Google Ads headline (30) or description (90); CC07 blocks it there by length
- `show_related.P47` [B L E LI M G] "See what's connected. Immediately."
- `show_related.P48` [B L E LI] "Stay oriented without leaving the page."
- `show_related.P49` [B L E LI] "Show Related sits in every record's header."
- `show_related.P50` [B L E LI] "Following one record leads to every connected record."
- `show_related.P51` [B L E LI] "Documents that should have been linked. Faults the previous chief logged but never closed."

### BANNED overclaims
| id | Banned phrasing | Why | Safe substitute |
|---|---|---|---|
| U06 | "graph" / "knowledge graph" / "walks the graph" / "enters the graph" | Show Related is similarity-based; the graph system is built-but-dead code. | "surfaces related records" |
| U33 | "indexed the moment it's written" / "the instant" / "searchable immediately" | Absolute-latency claim; indexing is worker-driven, not instantaneous-guaranteed. | "becomes findable as you work" |
| U06 | "Mapped to root cause" | See Search — no causal mapping. | "Prior occurrences surfaced alongside." |
| U37 | "Everything you do becomes findable" + enumerating every CRUD type as guaranteed | Coverage absolutes; keep to what's demonstrable. | "Notes, photos, handovers, and records become findable as you work." |

### CALL-ONLY
- Similarity mechanism, index internals.

---

## 8. CLOUD-BASED <!-- chapter: cloud legacy="cloud-based" -->

### SAFE (approved phrasings)
- `cloud.P18` [B L E LI M G] "Existing manuals, PDFs, scans and exports are imported as they are. No reformatting."
- `cloud.P19` [B L E LI M G] "Works in any modern browser: desktop, tablet, mobile."
  - note: replaces "No app installation" (X05)
- `cloud.P20` [B L E LI] "Your data is yours. Download it free for 30 days after any ending."
  - variant: "Your data is yours. Nothing is held hostage."
  - note: contract §4.3
- `cloud.P52` [B L E LI] "Crew on rotation can review records remotely with their existing credentials."

Retired from SAFE (contract wins, FD4 / X05): "Nothing to install." and "Browser-based. Any modern browser — desktop, tablet, mobile. No app installation." (onboarding uses a sync-agent installer). Use `cloud.P19`.

### BANNED overclaims
| id | Banned phrasing | Why | Safe substitute |
|---|---|---|---|
| U11 | "Runs alongside your existing PMS" / "nothing to replace, nothing to migrate" / "your existing PMS keeps its class society approvals, workflows, crew familiarity" / "a layer over your PMS" | Founder ruling 20 Oct 2026: CelesteOS is the planned maintenance system, not an add-on beside another one. | "CelesteOS is the planned maintenance system." |
| U09 | "Works offline" / "core functions work with intermittent connectivity, and data syncs when the connection is restored" | Offline/sync NOT in the verified-shipped set. NEEDS-EVIDENCE. | "Designed for the connectivity reality of superyachts." (nothing more specific) |
| U10 | "Onboard in hours, not weeks" as an absolute / "searchable on day one" / "live within two weeks" | Conflicts with the pilot's own "import takes 3–5 working days". NEEDS-EVIDENCE for "hours". | Omit the number. |
| U33 | "The vessel's record becomes searchable immediately" | "Immediately" absolute vs import/indexing lead time. | "The vessel's record becomes searchable as soon as import completes." |
| U05 | "real-time" (any) / "always current" / "live data, always current" | Real-time absolutes not guaranteed by worker-driven pipeline. | "Live data from the vessel's records." |
| U24 | "Nothing to install" / "No app installation" / "zero install" | Contract (FD4): onboarding uses a sync-agent installer. | "Works in any modern browser: desktop, tablet, mobile." |
| U22 | "We import all your data" / "migration included" | Contract: data migration not included. | "Existing manuals, PDFs, scans and exports are imported as they are. No reformatting." |

### CALL-ONLY
- Import timelines per vessel, hosting/provider details, fleet rollout dates (Q3 2026 may be referenced ONLY with the "(Available …)" roadmap label, never as live).

---

## 9. SECURITY <!-- chapter: security legacy="security" -->

### SAFE (approved phrasings — these exact honesty-calibrated forms)
- `security.S01` [B L E LI] "Each vessel's data is isolated. Role-based access throughout."
- `security.S02` [B L E LI M G] "Encrypted at rest and in transit."
- `security.S03` [B L E] "Customer data is stored in Germany (EU); some services run in the US under Standard Contractual Clauses. DPA and sub-processor list available."
- `security.S04` [B L E LI] "ISM Code: aligned with sections 10 and 11. Audit evidence, not class approval."
- `security.S05` [B L E] "SOC 2: controls built against the AICPA Trust Services Criteria. Audit not yet commissioned."
- `security.S06` [B L E] "Row-level security isolates each vessel's data."
- `security.S07` [B L E] "Captain handovers visible only to the back-to-back and fleet manager. Role-based throughout."
- `security.S08` [B L E] "Fleet view aggregates statistics without exposing cross-vessel records."
  - note: only when fleet is labelled roadmap
- `security.S09` [B L E] "GDPR: aligned. Customer data is stored in Germany (EU); some services run in the US under Standard Contractual Clauses. DPA available on request."
  - note: the calibrated GDPR line (FD-29c); replaces "EU data processed in the United States under SCCs and UK IDTA" (X06)

### BANNED overclaims
| id | Banned phrasing | Why | Safe substitute |
|---|---|---|---|
| U12 | "GDPR compliant" / "SOC 2 certified" / "SOC 2 compliant" | No audit commissioned; "aligned" is the honest calibrated word. | "Aligned" forms above, with the caveat sentence intact. |
| U12 | "class approved" / anything implying class society approval of CelesteOS | CelesteOS is audit evidence, not class approval. Never claim class approval. | "CelesteOS is audit evidence, not class approval." |
| U13 | "zero data retention" / "your data never leaves" / "no third party ever sees your data" | OpenAI subprocessor: no ZDR at current tier, 30-day abuse retention. Documented in the Sub-Processor Register. | "Sub-processor register and DPA available on request." |
| U37 | "optional two-factor" | NEEDS-EVIDENCE — not live-verified. | Omit until verified. |
| U14 | "military-grade encryption" / "bank-level security" | Hype lexicon. | "Encrypted at rest and in transit." |
| U26 | "EU data processed in the United States" | Contract (FD4): customer data is stored in Germany. | `security.S03` |
| — | Caveat-stripping (publishing "SOC-2" without "audit not yet commissioned", or "GDPR" without the data-location sentence) | The caveat IS the claim. | Always ship the full calibrated sentence. |

### CALL-ONLY
- Penetration-test status, incident history, key-management details, sub-processor specifics.

---

## 10. COMMERCIAL <!-- chapter: commercial -->

Pricing and terms are CALL-ONLY except these exact lines, on the channels listed. On the site (L) a commercial line is allowed only inside an element marked `data-pricing` whose whole text is the approved line. Text comes from the customer contract (FD4).

### SAFE
- `commercial.C01` [L E] "USD 995 per vessel per month."
  - note: L only inside `data-pricing` (FD2)
- `commercial.C02` [B L E LI M G] "Per vessel, not per user. Unlimited seats. No per-module tiering."
  - short: "Per vessel, not per user"
- `commercial.C03` [L E] "Price fixed for 12 months from your first subscription start."
- `commercial.C04` [L E] "Monthly billing; cancel or remove a vessel with 30 days' written notice."
- `commercial.C05` [E] "30-day free trial, then USD 995 per vessel per month unless you tell us before it ends; reminder at least 7 days before."
  - note: 1:1 post-call email only (FD3)
- `commercial.C06` [E] "No set-up fee. Remote account set-up and crew training included."
- `commercial.C07` [L E] "Email support 09:00-17:00 US Eastern, Mon-Fri; reply within one business day."
  - note: replaces "hours, not days" (X04)
- `commercial.C08` [E] "Pay by card, ACH or US bank transfer from the emailed invoice; due within 30 days."
- `commercial.C09` [E] "Joining the Collective is optional and never affects price or access."
  - note: Collective terms under lawyer review

### BANNED
| id | Banned phrasing | Why | Safe substitute |
|---|---|---|---|
| U20 | "hours, not days" / "24/7" / "round-the-clock" / "reply within hours" | Contract: one business day, 09:00–17:00 US Eastern. | `commercial.C07` |
| U21 | "uptime guaranteed" / "SLA" / "service credits" | 99.5% is a target, not a guarantee. | omit |
| U23 | "onboarding fee waived" | Contract: no set-up fee exists to waive. | `commercial.C06` (E only) |
| U25 | "The standard rate is higher" / "pilot discount" / "20% off" / "limited time" / "2 spots left" | Contract: one list fee, no discount; no urgency theatre. | omit |
| U27 | "No lock-in" / "cancel anytime" / "no contract" | Contract: 30 days' written notice. | `commercial.C04` |
| U28 | "$20k–$100k+" / unsourced money figures | No citable source (FD5). | omit |
| U29 | "1% of what a 40m costs to run" | Unsourced ratio (FD5). | omit |
| U30 | "500+ follow the build" / "join 1,000+ yachts" | Unsourced counts (FD5). | omit |
| U31 | testimonials / "trusted by" / "saved 12 hours" / "3x faster" | No consented customer quote or measured result (CP §6.5). | omit |
| U35 | "Book a 30-Minute Demo" | Duration NEEDS-EVIDENCE. | "Book a demo" |

---

## 11. MARKET <!-- chapter: market -->

Industry statistics need the named source inline, linked to /sources (tone rule 2).

### SAFE
- `market.M01` [B L E LI M] "Annual crew turnover reaches 50%+ in some superyacht roles."
- `market.M02` [B L E LI] "ISM-related deficiencies lead as a cause of PSC detentions."
- `market.M03` [B L E LI] "IMO MSC.428(98) requires cyber risk to be addressed in the SMS (USCG enforcing since Jan 2021)."

---

## RULES — the mechanical gate <!-- register: rules -->

Every rule runs over **normalised** text (spec 29 §2.3): tags stripped, entities decoded, curly quotes and dashes folded, lowercase, hyphens between words become spaces, currency becomes `¤`, numbers folded (`20,000`/`20k`/`twenty thousand` → `20000`, `one`–`fifty` → digits, ranges → `A to B`, `24x7` → `24/7`, `30, 14 and 7` → `30/14/7`), synonyms below applied. So write patterns in lowercase, with a space where a hyphen may appear (` ?` when the joined form also exists), and never use an unbounded `.*` (use `[a-z ]{0,30}`).

Check ids: **CC01** banned lexicon · **CC02** banned overclaim · **CC03** call-only · **CC04** dead host / internal names. On the blog a rule hit with "not / never / nothing / no" up to 25 characters before it is a WARN (FD-29d); everywhere else it fails. A lexicon rule marked `editorial` is a WARN on a blog line marked `data-editorial` or `<!-- editorial`; everywhere else it fails.

| id | check | family | why | safe |
|---|---|---|---|---|
| U01 | CC02 | handover auto-write | Reality = 1-tap capture into a draft, then review and two signatures. Nothing writes, assembles or generates itself. | Captured as you work. |
| U02 | CC02 | coverage absolutes | Exhaustive coverage (every answer, every domain, every action) is not live-verified. | Results open the source record itself. |
| U03 | CC01 | AI / SaaS lexicon | Product-magic words and ML mechanism talk are off-brand and imply what is not shipped. | Finds what you mean, not what you typed. |
| U04 | CC01 | hallucination | AI-magic framing. | omit |
| U05 | CC02 | latency | Real-time and latency numbers NEED-EVIDENCE. | Live data from the vessel's records. |
| U06 | CC02 | graph / causal | Show Related is similarity-based; nothing maps root cause. | Open any record and CelesteOS surfaces what's related: work orders, parts, equipment, handovers. |
| U07 | CC02 | sealed PDF / bundle export | Sealed PDF and bundle export are planned, not live. | Key actions are sealed into a receipt anyone can verify at verifier.celeste7.ai. |
| U08 | CC02 | certificate alert schedule | The 30/14/7 schedule is not live-verified. | Certificates tracked to expiry, source PDF attached; alerts as expiry approaches. |
| U09 | CC02 | offline | Offline/sync is not in the verified-shipped set. | Designed for the connectivity reality of superyachts. |
| U10 | CC02 | onboarding speed | Onboarding durations NEED-EVIDENCE. | omit the number |
| U11 | CC02 | beside-PMS + retired positioning | CelesteOS is the planned maintenance system, not an add-on (founder ruling 20 Oct 2026). | CelesteOS is the planned maintenance system. |
| U12 | CC02 | certification | No audit commissioned; never claim class approval. | SOC 2: controls built against the AICPA Trust Services Criteria. Audit not yet commissioned. |
| U13 | CC02 | data retention | Sub-processors retain data (see the register). | Sub-processor register and DPA available on request. |
| U14 | CC02 | hype security | Hype lexicon. | Encrypted at rest and in transit. |
| U15 | CC04 | dead host | verify.celeste7.ai is NXDOMAIN. | verifier.celeste7.ai |
| U16 | CC02 | read tracking | Read-duration / read-completion tracking is not shipped. | Every action is attributed and timestamped: who acted, what, when, which record. |
| U17 | CC02 | retired features | Hours of rest, shopping list, purchase orders, receiving and email ingestion are retired (founder ruling 20 Oct 2026). | omit |
| U18 | CC02 | propagation | Auto-propagation / cascade is not shipped. | Accept links the document to the record in front of you. |
| U20 | CC02 | support speed | Contract: email support 09:00–17:00 US Eastern, reply within one business day. | Email support 09:00-17:00 US Eastern, Mon-Fri; reply within one business day. |
| U21 | CC02 | uptime / SLA | 99.5% is a target, not a guarantee; no SLA or service credits. | omit |
| U22 | CC02 | migration included | Contract: data migration is not included. | Existing manuals, PDFs, scans and exports are imported as they are. No reformatting. |
| U23 | CC02 | fee waived | Contract: there is no set-up fee to waive. | No set-up fee. Remote account set-up and crew training included. (email only) |
| U24 | CC02 | no install | Contract: onboarding uses a sync-agent installer. | Works in any modern browser: desktop, tablet, mobile. |
| U25 | CC02 | discount / urgency | Contract: one list fee; no discounts, no urgency theatre. | omit |
| U26 | CC02 | stale data location | Contract: customer data is stored in Germany (EU). | Customer data is stored in Germany (EU); some services run in the US under Standard Contractual Clauses. |
| U27 | CC02 | no lock-in | Contract: 30 days' written notice. | Monthly billing; cancel or remove a vessel with 30 days' written notice. |
| U28 | CC02 | unsourced money | Money figures need a citable source (FD5). | omit |
| U29 | CC02 | unsourced ratio | Ratios of running cost need a citable source (FD5). | omit |
| U30 | CC02 | unsourced counts | Audience / customer counts need a citable source (FD5). | omit |
| U31 | CC02 | testimonials / ROI | No consented customer quote or measured result exists (CP §6.5). | omit |
| U32 | CC02 | ledger resume | No resume / browser-history capability is shipped. | Open any record and read its full audit trail. |
| U33 | CC02 | absolute latency | Indexing is worker-driven; nothing is instant. | becomes findable as you work |
| U34 | CC02 | money / warranty finder | Roadmap only; never depicted as live. | roadmap label only |
| U35 | CC02 | demo duration | Demo length NEEDS-EVIDENCE. | Book a demo |
| U36 | CC01 | voice refusals | Off-voice hype and hedging (brand voice). | say it plainly |
| U37 | CC02 | allowlist leftovers | Named individuals, optional 2FA, everything-you-do, certificate-bundle hero, [VERIFY] markers. | Every action is attributed and timestamped: who acted, what, when, which record. |
| K01 | CC03 | call-only: currency figure | Pricing is CALL-ONLY except an approved commercial line on its channel. | remove — or use the exact commercial.C01 line where allowed |
| K02 | CC03 | call-only: currency words | Pricing is CALL-ONLY. | remove |
| K03 | CC03 | call-only: pricing period | Pricing is CALL-ONLY ("per vessel, not per user" alone is fine: commercial.C02). | remove — or use the exact commercial.C01 line where allowed |
| K04 | CC03 | call-only: pilot pricing | Pricing is CALL-ONLY. | remove |
| K05 | CC03 | call-only: locked price | Contract wording is commercial.C03. | Price fixed for 12 months from your first subscription start. (L, E) |
| K07 | CC03 | call-only: public trial | The trial is offered 1:1 by email only (FD3). | remove — commercial.C05 on email only |

```rules
# ── Concept patterns (v3). Text is normalised first: lowercase, NFKC + confusables, quotes/dashes folded,
# ── hyphens between words → space, & → and, ! ? ; : → comma, numbers/currency folded.
# ── Gaps are bounded word runs ([a-z0-9' ]{0,N}) so a match never crosses a comma or a sentence.
# U03/U36/U04 — lexicon (CC01)
U03 /\bai\b/ editorial domain_guard
U03 /artificial intelligence/ editorial
U03 /machine ?learning|deep learning|neural (net\w*|search|engine)|\bllms?\b|large language models?|\bgpt\w*\b|chat ?gpt|\bco ?pilot\b|predictive analytics|cognitive (search|engine)/ editorial
U03 /\bml\b/ editorial domain_guard
U03 /\bsmart\b[a-z ]{0,8}\b(pms|systems?|software|platform|search|maintenance|alerts?|handovers?|tools?|apps?|engines?|assistants?|features?|links?|linking|suggestions?|records?|logbook|way)\b/
U03 /\bautomat\w*/
U03 /\bauto ?(generat|add|populat|link|propagat|alert|execut|assembl|compil|writ|fill|draft|sync|import|tag|categori|classif|attach)\w*/
U03 /\bseamless\w*/
U03 /\boptimi[sz]\w*\b[a-z' ]{0,12}\b(maintenance|pms|handovers?|operations|vessels?|fleets?|records|workflows?|uptime|performance|engine rooms?|everything)\b/
U03 /\beffortless\w*/
U03 /\bmagic\w*/
U03 /\brevolutio\w*/
U03 /game ?chang\w*/
U03 /\bintelligen(t|ce)\b/ editorial
U03 /\blearns? from\b|\b(self ?learning|self ?improving|gets smarter)\b/
U03 /\b(it|celesteos|the system|the software|the platform)\b[a-z' ]{0,10}\b(understands?|thinks?|reasons?|knows?)\b[a-z' ]{0,10}\b(your|the) (vessel|boat|yacht|engine room|systems?|crew|equipment)\b/
U03 /entity extraction|semantic search|\bvectors?\b|\bembeddings?\b|\bembedded (using|with|by|via|as)\b|cosine similarity|\d+ dimension/
U04 /\bhallucinat\w*/
U04 /\b(never|doesn'?t|does not|won'?t|will not|cannot|can'?t) (make|makes|invent|invents|guess|guesses) (things|anything|stuff|answers|it) up\b|\bnever (invents|guesses)\b|\bmade ?up (answers|results|facts)\b/ selfneg
U36 /cutting ?edge/
U36 /\bnext ?gen(eration)?\b/
U36 /\bleverag\w*/
U36 /\bdon'?t worry\b/ selfneg
U36 /\bhang tight\b/
U36 /\bi (think|believe)\b/
U36 /\b(world ?class|best in class|state of the art|industry leading|market leading|ground ?breaking|best of breed|unparalleled|unrivall?ed|supercharg\w*|disruptive (technology|platform|software|solution)|disrupts? the (industry|market)|next level)\b/
# U01 — handover auto-write
U01 /\b(write|draft|build|create|assemble|compile|generate|fill|populate|complete|prepare|produce|finish|organi[sz]e|update)s? (itself|themselves)\b/
U01 /\b(puts?|put) (itself|themselves) together\b|\b(it|they) (self|it) ?(writes?|drafts?|builds?)/
U01 /\bhandovers?\b[a-z0-9' ,]{0,40}\b(on its own|by itself|for you|automatically|without (you|lifting|typing|writing|any effort|effort)|so you don'?t have to|while you (sleep|work|rest)|already (written|drafted|done|prepared|complete|completed|finished|there|waiting|ready)|ready and waiting|done for you|zero effort|no effort|(you )?never (had|have|need) to write|(finished|done|written|drafted|ready) before you)\b/
U01 /\b(already (written|drafted|done|prepared|complete|finished)|ready and waiting|zero effort|no effort|effortless|done for you|written for you|drafted for you|prepared for you|produced for you|generated for you|(we|we'll|we will) (write|draft|prepare|produce|compile|generate|build|create|do)|(the system|celesteos|the software|the platform|the app|it) (writes?|drafts?|prepares?|produces?|generates?|compiles?|builds?|creates?|assembles?|does)( up)?)\b[a-z0-9' ]{0,40}\bhandovers?\b/
U01 /(assembled|compiled|generated) automatically/
U01 /not assembled manually/
U01 /already written/
U01 /watch it assemble/
U01 /\bassembled? from\b|\bassembles from\b/
U01 /\bput together for you\b|(assembled|written|compiled|put together|built) [a-z ]{0,20}(on its own|by itself)/
U01 /notes become (a|the) [a-z ]{0,20}handover/
U01 /\byou review,? we create\b|\bwe create\b[a-z ]{0,15}\bhandovers?\b/
U01 /\bgenerated from (operational|your|the vessel|logged|work)/
U01 /\bsystem already (has|knows)\b/
# U02 — coverage absolutes
U02 /every (answer|result|response)[a-z' ]{0,15}\b(cites?|cited|comes with|has|shows|links? to|with|backed by|includes) (to |with )?(its |a |the )?(source|sources|citation|reference)/
U02 /\bevery domain|all \d+ domains|\b(every|all) (systems?|domains?|data sources?)\b/
U02 /\b(search\w*|finds?|query|queries|index\w*|covers?|connects?|unif\w*|reads?)\b[a-z' ]{0,20}\b(every|all)( of)?( your| the)?( [a-z]+)? (manuals?|documents?|records?|files?|logs?|drawings?|data|systems?|departments?|sources?)\b/
U02 /\b(nothing|no (record|document|file|detail|fault|entry|item))\b[a-z' ]{0,15}\b(is |gets |will be )?(ever )?(missed|lost|overlooked|slips|falls through|left behind|forgotten)\b/ selfneg
U02 /\b(complete|full|total|100%|entire|end to end|360) (coverage|visibility)\b/
U02 /\b(seals?|sealed|signs?|verif(y|ies)|hash(es)?|proves?)\b (every|all|each)( single)? (actions?|changes?|edits?|events?|entr(y|ies)|clicks?|keystrokes?)\b|every action\b[a-z' ]{0,15}\b(is|are|gets) [a-z ]{0,20}\b(sealed|signed|verified)\b/
U02 /\b(all|every)( of)?( your| the)? (vessel |ship |boat )?(data|information|knowledge)\b[a-z ]{0,12}\b(in (one|1)|unified|searchable|in a single|connected)\b|\b(every|all)( the| your)? (documents?|manuals?|records?|files?|drawings?) (on board|aboard|in one place)\b|\beverything (on board|aboard)\b/
# U05 — latency
U05 /\breal ?time\b[a-z ]{0,12}\b(data|sync\w*|updates?|search|monitoring|views?|visibility|tracking|alerts?|status|feeds?|indexing|information|answers|results)\b|\bin real ?time\b/
U05 /sub ?seconds?/
U05 /\b\d+ ?(ms|milliseconds?)\b|\bmilliseconds?\b/
U05 /\balways (current|up to date|in sync|fresh)\b/
U05 /\b(in|under|less than|within|below) (a|1) (second|sec)\b|\b(fraction|split) of a second\b|\bsplit second\b/
U05 /\b(lightning|blazing|blisteringly|insanely|super|ultra) ?(fast|quick|speed)\b/
U05 /\b(zero|no|without) (lag|latency|delays?|waiting|spinning wheel|load(ing)? times?)\b/ selfneg
U05 /\blive (sync|updates?|data feed)\b|\binstant (search|results|answers|sync|updates?|lookups?|access)\b/
U05 /\bfaster than (you can|the speed)/
# U33 — absolute latency
U33 /\b(searchable|findable|indexed|index\w*|available|visible|in search|in results|retrievable|synced|shared|live)\b[a-z' ]{0,30}\bthe (moment|instant|second) (it'?s|it is|you|they|anything|something|a record|an entry|the entry|a note)\b[a-z' ]{0,10}\b(saved|logged|written|typed|entered|uploaded|created|recorded|hit|press|click|tap|upload|save|log|write|type|enter)\b|\bthe (moment|instant|second) (it'?s|it is|you|they|anything|something|a record|an entry|the entry|a note)\b[a-z' ]{0,10}\b(saved|logged|written|typed|entered|uploaded|created|recorded|hit|press|click|tap|upload|save|log|write|type|enter)\b[a-z' ]{0,20}\b(it'?s |it is |they'?re |they are )?(searchable|findable|indexed|available|visible|in search|retrievable|synced|shared|live)\b|\bthe moment it'?s (written|saved|logged)\b/
U33 /\b(searchable|findable|indexed|available|visible|appears?|show(s)? up|in search|in results|retrievable|shared|synced)\b[a-z' ]{0,15}\b(instantly|immediately|straight away|right away|at once|in no time|without delay|with no delay|in seconds|in real time)\b/
U33 /\b(instantly|immediately|straight away|right away) (searchable|findable|indexed|available|visible|retrievable|shared|synced)\b/
U33 /\b(no|zero|without) (indexing|processing|upload|sync) (delay|lag|wait|time)\b/ selfneg
U33 /\b(searchable|findable|indexed|available|visible|in search)\b[a-z' ]{0,10}\b(as soon as|the moment|the second|once|when|right after|straight after|just after|immediately after|directly after) (you|it'?s|it is|they)\b[a-z' ]{0,8}\b(hit|press\w*|click\w*|tap\w*|sav\w*|log\w*|typ\w*|enter\w*|upload\w*|writ\w*)/
U33 /\btype it,? find it\b/
U33 /\binstant(ly|aneously)?\b[a-z ]{0,10}\b(search\w*|find\w*|findable|available|answers?|results?|access|sync\w*|updat\w*|index\w*|visible)\b|\b(search\w*|findable|available|answers?|results?|index\w*|visible|appears?)\b[a-z ]{0,10}\binstant(ly|aneously)\b/
# U06 — graph / causal
U06 /knowledge graph|\b(vessel|equipment|data|entity|relationship) graph\b/
U06 /\b(walks?|travers\w*|navigat\w*|explor\w*) (the |your |a )?[a-z ]{0,15}graph/
U06 /\b(map|maps|mapped|mapping|finds?|found|identif(y|ies|ied)|pinpoint\w*|surfac\w*|reveal\w*|shows?|showing|detect\w*|uncover\w*|expos\w*|diagnos(e|es|ed) automatically)( (to|you|for you|the|its|their|a|an|any|every|recurring|systemic|underlying|hidden|real|true|likely|probable))* root causes?\b/
U06 /\b(maps?|mapped|mapping|links?|linked|ties|traces?|traced)\b[a-z ]{0,25}\bto (its |the |a |their )?root causes?\b/
U06 /\bget(s|ting)? (you )?(straight )?to the root cause/
U06 /\broot causes? (is |are )?(visible|surfaced|identified|found|mapped|revealed|shown|for you|automatically|instantly|in seconds|at a glance|in 1 view|in a single view)/
# U07 — sealed PDF / bundle export
U07 /sealed pdf|structured pdf/
U07 /(export|download)\w* [a-z ]{0,30}\b(pdfs?|bundles?|binders?|dossiers?)\b/
U07 /\b(one|1|single) ?(click|tap)\b[a-z ]{0,30}\b(bundles?|packs?|reports?|exports?|pdfs?|binders?)\b/
U07 /\b(inspection|audit|survey|class|psc|surveyor) ?(ready )?(bundles?|packs?|binders?|dossiers?)\b|\bbundle export\b|\b(inspection|audit|survey) ready (pdf|export|report)/
# U08 — certificate alert schedule
U08 /\b30\/14\/7\b|\b\d+\/\d+\/\d+ ?(days?|weeks?|months?)\b|\b(alerts?|notif\w*|warnings?|reminders?)\b[a-z ]{0,12}\d+\/\d+\/\d+\b/
U08 /\b(alerts?|notif\w*|warnings?|reminders?)\b(?! at least)[a-z ]{0,10}\b(at |from |starting )?\d+ (days?|weeks?|months?) (before|ahead|prior|out|in advance)\b/
# U09 — offline
U09 /works? offline|\boffline\b[a-z ]{0,12}\b(mode|first|access|capab\w*|ready|support\w*|use|too|as well)\b|\b(works?|use|usable|available|accessible|capab\w*|ready|functional|runs?|full)\b[a-z ]{0,12}\boffline\b/
U09 /\b(works?|working|keeps? (working|running|going)|runs?|running|functional|operat\w*|usable|use it|no problem|carry on|continue\w*|designed to work|need(ed)?|required|fine)\b[a-z0-9' ]{0,40}\b(no|without|zero|lose|lost|loses|losing|no need for|even with no|with no|without any)\b[a-z' ]{0,12}\b(internet|connection|connectivity|signal|network|wi ?fi|satellite|vsat|starlink|bandwidth|data link|coverage)\b/
U09 /\b(no|without|zero|lose|lost|loses|losing|no need for|with no|without any)\b[a-z' ]{0,12}\b(internet|connection|connectivity|signal|network|wi ?fi|satellite|vsat|starlink|bandwidth|data link|coverage)\b[a-z0-9' ,]{0,30}\b(works?|working|keeps? (working|running|going)|runs?|functional|operat\w*|usable|no problem|carry on|continue\w*|needed|required|fine)\b/ selfneg
U09 /\b(internet|connection|connectivity|signal|network|wi ?fi|satellite( link)?|vsat|starlink|link)\b[a-z' ]{0,12}\b(is |goes )?(down|drops?|dropped|fails?|lost|out|outage|cuts? out)\b[a-z0-9' ,]{0,40}\b(works?|working|keeps? (working|running|going)|runs?|functional|operat\w*|usable|no problem|carry on|continue\w*|still)\b|\b(works?|working|keeps? (working|running|going)|runs?|functional|operat\w*|usable|carry on|continue\w*)\b[a-z0-9' ]{0,40}\b(internet|connection|connectivity|signal|network|wi ?fi|satellite( link)?|vsat|starlink|link)\b[a-z' ]{0,12}\b(is |goes )?(down|drops?|dropped|fails?|lost|outage|cuts? out)\b/
U09 /\b(sync\w*|upload\w*|catch\w* up|updat\w*)\b[a-z ]{0,30}\b(when|once|as soon as|after)\b[a-z' ]{0,20}\b(connection|signal|internet|back online|reconnect\w*|online again|restored)\b/
# U10 — onboarding speed
U10 /\b(onboard\w*|on board(ed|ing)|set ?up|setup|install\w*|deploy\w*|implement\w*|roll ?out|rolled out|go(es|ing)? live|went live|live|up and running|operational|ready|get started|started|start using|in use|configured|activated)\b[a-z' ]{0,20}\b(in|within|under|by|on|over) (\d+ (hours?|minutes?|mins?|hrs?|days?|weeks?)|hours|minutes|(a|an|1|one|a single|single) (hour|day|week|morning|afternoon|weekend|evening)|day 1|the same day|same day|today|tomorrow|overnight|no time|monday|tuesday|wednesday|thursday|friday|a few (hours|days|minutes))\b/
U10 /\b(ready|live|onboarded|running|set up|setup|operational|deployed)\b[a-z ]{0,5}\b(same day|today|tomorrow|overnight)\b/
U10 /\b(same|next) day (onboarding|setup|set up|go live|deployment|implementation|activation)\b|\b(fast|quick|rapid|speedy|instant|express|zero|easy|painless|effortless) (onboarding|setup|set up|deployment|implementation|rollout|go live)\b/
U10 /(searchable|live|onboarded|running|ready) on day 1\b|\bup and running in\b|\bin (a single|1) afternoon\b/
U10 /\b(onboarding|setup|set up|implementation|deployment)\b[a-z ]{0,10}\b(takes|in|under) (minutes|hours|\d+ (minutes|hours|mins|hrs))\b/
# U11 — beside-PMS / no migration
U11 /\b(keep|keeping|retain|stay with|stick with|continue (using|with)|still use|carry on using)\b[a-z' ]{0,20}\b((your |the )?(existing|current|old|legacy|present)[a-z' ]{0,10}\b(pms|systems?|software|tools?)|pms|amos|idea|voly|shipnet)\b/
U11 /\b(on top of|alongside|beside|next to|over|plugs? (in|into|straight into)|bolts? on( to)?|integrat\w* with|works? (with|alongside)|connects? (to|with)|layer(ed)? (on|over)|sits? (beside|on top|alongside|next to))\b[a-z' ]{0,20}\b((your|the|any) (existing|current|old|legacy|present)[a-z' ]{0,10}\b(pms|systems?|software|tools?)|(pms|systems?|software) you (already )?(use|have|run|know)|amos|idea|voly|shipnet|(your|the) [a-z' ]{0,20}pms)\b/
U11 /\b(add ?on|addon|companion|plug ?in|plugin|extension|overlay|layer)\b[a-z ]{0,15}\b(to|for|over)( your| the)?( existing| current| old| legacy)?[a-z ]{0,10}\b(pms|amos|idea|maintenance (system|software))\b/
U11 /\bno (need (to|for) )?(migrat\w*|switch\w*|replac\w*|rip and replace|changeover|change ?over|data migration)\b|\bnothing to (replace|migrate|switch|change)\b|\bwithout (migrating|switching|replacing)( from| away from)?( your| the)? [a-z ]{0,15}\b(pms|systems?|software|amos|idea)\b/ selfneg
U11 /\b(don'?t|do not|never|no) (have|need|needs) to (switch|replace|migrate|change|abandon|give up|leave)\b/ selfneg
U11 /layer over|keep amos|you already run|class society approvals|technical intelligence system|rip out|certified pms|what does this replace/
# U12 — certification
U12 /(?<!not )(?<!not a )\b(dnv( gl)?|lloyd'?s( register)?|lr|abs|american bureau of shipping|bureau veritas|bv|rina|class ?nk|nippon kaiji|korean register|ccs|irs|mca|uscg|flag state|class|classification society|class societ(y|ies)|iso ?\d*|soc ?(2|ii)( type (1|2|i|ii))?|gdpr|cyber ?essentials|hipaa|pci( dss)?)\b[a-z0-9' ]{0,12}\b(approved|certified|accredited|endorsed|recogni[sz]ed|validated|type approved|compliant)\b/
U12 /\b(achieved|holds?|has|have|granted|awarded|received|obtained|earned|with)\b[a-z0-9' ]{0,25}\b(dnv|lloyd'?s|abs|bureau veritas|rina|classnk|class|iso ?\d*|soc ?(2|ii)|gdpr)\b[a-z0-9' ]{0,12}\b(type approval|approval|certification|accreditation|compliance)\b/
U12 /\b(approved|certified|accredited|endorsed|recogni[sz]ed|validated|compliant|complies)\b( for [a-z ]{0,20})? (by|with|under|to) [a-z' ]{0,12}\b(dnv|lloyd'?s|abs|bureau veritas|bv|rina|class|classnk|mca|uscg|flag|iso|imo|gdpr|soc ?(2|ii)|hipaa)\b/
U12 /\b(class|type) approved\b|\bapproved by class\b/
# U13 — data retention
U13 /zero data retention|\bno (data )?(retention|logging)\b/
U13 /\b(your )?(data|records|information)\b[a-z' ]{0,20}\b(never|doesn'?t|does not|won'?t|will not|can'?t)\b[a-z' ]{0,10}\b(leaves?|leave|shared|sold|seen|accessed|touched)\b/ selfneg
U13 /\bnever leaves\b|\bno (one|third part(y|ies)|other company|vendor|outsider)\b[a-z' ]{0,20}\b(ever )?(sees?|access\w*|reads?|touch\w*|can see)\b/ selfneg
# U14 — hype security
U14 /\b(military|bank|government|enterprise|nsa|defen[cs]e)[ -]?(grade|level|class|strength)\b|\b(unhackable|hack ?proof|unbreakable)\b|\bbullet ?proof (security|encryption)\b/
U15 /verify\.celeste7\.ai/
# U16 — read tracking
U16 /\bread (tracking|receipts?|confirmations?|status)\b|\bread events?\b|\bmeasured duration\b|\bevidence of awareness\b/
U16 /\b(track\w*|log\w*|record\w*|knows?|captur\w*|measur\w*|proves?|shows?|see|tells? you)\b[a-z' ,]{0,20}\b(who|whether|if)\b[a-z' ]{0,15}\b(read|opened|viewed|seen|looked at)\b/
U16 /\b(open\w*|read\w*|view\w*|access\w*|look\w*)\b[a-z' ,]{0,25}\bfor how long\b|\b(duration|how long|time spent)\b[a-z' ]{0,20}\b(reading|viewing|on (the|each|a) (document|page|manual|sop)|of access|they (read|spent))\b|\b(access|views?|opens?|reads?)\b[a-z ]{0,10}\b(with|and) (its |their )?duration\b/
U16 /\b(whether|if|who|track\w*|log\w*|record\w*|know\w*|shows?|proof)\b[a-z' ]{0,25}\bread (it )?in full\b/
# U17 — retired features
U17 /\b(track\w*|log\w*|manag\w*|raise\w*|creat\w*|generat\w*|handl\w*|record\w*|built in|includes?)\b[a-z ]{0,15}\b(hours of rest|rest hours|work and rest hours|purchase orders|receiving|delivery notes?|procurement)\b|\b(hours of rest|rest hours|purchase orders?|receiving|procurement)\b[a-z ]{0,6}\b(module|tracking|tracker|workflow|feature|page|screen|log)\b|\bshopping lists?\b|\bhor\b|\bpo \d/
U17 /\b(read|reads|ingest\w*|import\w*|pull\w*|sync\w*|connect\w*|scan\w*|files?|sorts?|forward\w*|parses?)\b[a-z ]{0,10}\b(your |the |crew |all )?(inbox|e ?mails?|mailbox|outlook|gmail)\b|\b(outlook|exchange|gmail|inbox|e ?mail) (integration|ingest\w*|sync)\b/
# U18 — propagation
U18 /\bcascad\w*\b[a-z ]{0,20}\b(to|across|through|into)\b[a-z ]{0,15}\b(every|all|records?|faults?|work orders?|entit\w*|linked|related)|\b(links?|linked|documents?|manuals?|accept\w*)\b[a-z ]{0,20}\bcascad\w*|\bpropagat\w*\b[a-z ]{0,15}\b(everywhere|to every|to all|across|through)\b|\b(documents?|manuals?|links?|it)\b[a-z ]{0,10}\bpropagat\w*/
U18 /\balready attached\b/
U18 /\b(flows?|spread(s|ing)?|ripples?|carri(es|ed)|carry|push(es|ed)?|appl(y|ies|ied)|cop(y|ies|ied)|attach(es|ed)?|link(s|ed)?|sync\w*|updat(e|es|ed)|reflect\w*|replicat\w*|mirror\w*|shows? up|appears?|inherit\w*)\b[a-z' ]{0,25}\b((to|across|on|in|through|throughout|onto) )?(every|all|each|the whole|the entire)( of)?( the| your)?( linked| related| connected| other)?[a-z ]{0,12}\b(records?|faults?|work orders?|parts?|equipment|crews?|pumps?|places?|vessel|linked|related|connected)\b(?! ?(by hand|manually|one by one))/
U18 /\b(appl(y|ies|ied)|spreads?|propagates?|shows? up|flows?|available) everywhere\b|\baccept(ed|ing)? once\b|\b(approve|confirm|link|attach|accept)\w*( it| the [a-z]+)? once\b[a-z ,]{0,30}\b(everywhere|every|all|everyone|for good|forever)\b/
U18 /\b(one|1|single) (click|tap|approval|accept)\b[a-z ]{0,10}\b(links?|applies|updates?|attaches|pushes|spreads|copies|syncs)\b[a-z ]{0,15}\b(across|everywhere|every|all)\b/
U18 /\b(everyone|every crew|the next crew|all future crews?|every engineer)\b[a-z ]{0,25}\binherits? (it|the link|the links|that|this|the document|the manual|them)\b/
# U20 — support speed
U20 /hours,? not days/
U20 /\b(support|help|engineers?|team|us|we|available|on call|responses?|replies)\b[a-z' ]{0,20}\b(24\/7|24 hours a day|7 days a week|day and night|night and day|round the clock|any hour|every hour)\b|\b(24\/7|round the clock|24 hours a day)\b[a-z' ]{0,20}\b(support|help|engineers?|team|response|cover|service)\b/
U20 /\b(reply|replies|replied|response|responds?|respond\w*|answer\w*|get(s)? back|support)\b[a-z' ]{0,15}\b(within|in|under) (minutes|\d+ (minutes?|mins?|hours?|hrs?)|an? (hour|few hours|couple of hours)|(the|1) hour|hours|the same day|same day)\b/
U20 /\b(same|next) (day|hour) (response|reply|replies|support|answers?)\b|\b(instant|immediate|rapid|lightning|priority) (support|responses?|replies)\b/
# U21 — uptime / SLA
U21 /\b(guarantee\w*|promise\w*|commit\w*|assur\w*|warrants?|warranted|pledge\w*)\b[a-z0-9.' %]{0,30}\b(\d+(\.\d+)? ?(%|percent)|uptime|availability|up time|downtime)|(\d+(\.\d+)? ?(%|percent)|\buptime|\bavailability)\b[a-z0-9.' %]{0,30}\b(guarantee\w*|promise\w*|commit\w*|assur\w*|warranted|pledge\w*)\b/
U21 /\d+(\.\d+)? ?(%|percent) (uptime|availability|up time|available|reliab\w*|online)\b|\b(uptime|availability) (of|at|is|above) \d/
U21 /\balways (on|up|online|available)\b|\bnever (goes )?(down|offline)\b|\b(zero|no) (downtime|outages?)\b|\b(5|4|3) nines\b|\bservice credits?\b|\bslas?\b/ selfneg
# U22 — migration included
U22 /\b(we|we'll|we will|we'd|our (team|engineers|specialists|staff|people|onboarding team)|the celesteos team|celesteos)\b[a-z' ]{0,15}\b(migrat\w*|import\w*|mov(e|es|ing)|transfer\w*|bring(s|ing)?|load(s|ing)?|port(s|ing)?|convert\w*|carr(y|ies)|handl\w*|tak(e|es) care of|upload\w*|digiti[sz]\w*|key(s|ing)? in)\b[a-z' ]{0,30}\b(data|history|records?|archive|pms|amos|everything|it all|import|migration|across|over|spreadsheets?|register|logs?|manuals?)\b/
U22 /\b(migration|data import|data transfer|data migration|imports?|data entry)\b[a-z ]{0,15}\b(is |are )?(included|free|on us|at no (extra )?cost|done for you|handled for you|taken care of|complimentary|part of the (package|price|service))\b/
U22 /\bdone ?for ?you\b|\bwhite ?glove\b|\bfree (data )?(migration|import|transfer|data entry)\b|\bhands ?off (migration|onboarding|import)\b/
# U23 — fee waived
U23 /\b(fees?|charges?|costs?|onboarding|setup|set up)\b[a-z ]{0,15}\bwaive[sd]?\b|\bwaive[sd]?\b[a-z ]{0,10}\b(fees?|charges?|onboarding|setup|set up)\b|\bonboarding fee\b/
U23 /\b(free|complimentary|on us|at no (extra )?cost)\b[a-z ]{0,6}\b(onboarding|setup|set up|implementation|installation|activation)\b|\b(onboarding|setup|set up|implementation|installation)\b[a-z ]{0,10}\b(is |are )?(free|on us|complimentary)\b/
# U24 — no install
U24 /\bno (app |software |client |plugin )?(installation|install|download)s? (required|needed|necessary)\b|\bno (app |software |client |plugin )?installation\b|\bno (apps?|software|clients?|plugins?) to (install|download)\b|\b(nothing|zero) to (install|download)\b|\bzero install\w*\b|\bwithout (installing|downloading) (anything|software|an app)\b|\bnever (install|download) (anything|software)\b/ selfneg
# U25 — discount / urgency
U25 /standard rate is higher/
U25 /\b(pilot|early|launch|founding|special|introductory|exclusive|first|loyalty|fleet|volume|\d+ ?%)\b[a-z ]{0,10}\bdiscount\w*|\bdiscount\w*\b[a-z ]{0,10}\b(for|on) (early|pilot|founding|new|the first|your first)\b|\bdiscounted (rate|price|pricing|plan)\b/
U25 /\b\d+ ?(%|percent) (off|discount|saving|savings|less|cheaper|reduction)\b|\b(save|saving|saves) \d+ ?(%|percent)|\bhalf (price|off|the price)\b|\d+% off/
U25 /\b(early ?(adopter|bird|access|mover)|founding ?(member|customer|vessel|partner|fleet)s?|introductory|launch|intro|special|promo\w*|exclusive|charter member)\b[a-z ]{0,10}\b(pric\w*|rates?|offers?|deals?|terms|fees?|tiers?|plans?)\b/
U25 /\b(offer|deal|pricing|price|rate|discount|promotion)s?\b[a-z ]{0,20}\b(ends?|expires?|closes?|valid (until|till|through)|only until|runs out)\b/
U25 /\b(prices?|rates?|fees?|pricing)\b[a-z ]{0,10}\b(go(es)? up|going up|rises?|rising|will rise|increas\w*|double|jumps?)\b|\bbefore (prices?|rates?|fees?) (rise|go up|increase|change)\b/
U25 /\b(only|just|last) \d+[a-z ]{0,10}\b(slots?|spots?|places?|seats?|openings?|vessels?|pilots?)\b[a-z ]{0,5}\b(left|remain\w*|available|open)\b|\b\d+ (pilot )?(slots?|spots?|places?|openings?) (left|remain\w*)\b/
U25 /\bact (now|fast|today|quickly)\b|\block in (today'?s|this|the current|your|our) (price|rate|pricing)\b|\b(don'?t|do not) miss (out|this)\b|\blimited (time|availability|spots|places|slots|offer)\b|\bwhile (it|they|stocks?|places|spots) lasts?\b|\bhurry\b/ selfneg
# U26 — stale data location
U26 /\b(processed|stored|hosted|held|kept|resides?|lives?|sits?)\b[a-z ]{0,6}\b(in|on) (the )?(us|usa|united states|america|american (servers|data centres|data centers))\b/
# U27 — no-notice cancel
U27 /\bno lock ?ins?\b|\bcancel any ?time\b|\bno contracts?\b/ selfneg
U27 /\b(cancel\w*|leave|quit|stop|walk away|end it|terminate|exit|opt out|unsubscribe)\b[a-z' ,]{0,20}\b(any ?time|whenever|at any (time|point|moment)|instantly|immediately|with (a|1|one) (click|tap)|no questions( asked)?|without (notice|penalty|questions|warning)|no notice|no penalty|freely|on a whim)\b/
U27 /\bno (notice( period)?|commitment|minimum (term|period|contract|commitment)|strings( attached)?|tie ?ins?|long ?term (contracts?|commitments?)|obligation|fixed term|exit fees?)\b|\b(zero|without (any )?)(commitment|notice|lock ?in|tie ?in|obligation)\b|\bcommitment ?free\b/ selfneg
# U28 — unsourced money
U28 /\b(?!(19|20)\d\d to (19|20)\d\d\b)\d{4,} to (?!0\d)\d{4,}\b/
U28 /\b(cost|costs|runs|worth|saves?|saving|loses?|losing|lost|wastes?)\b (¤ ?)?\d{4,}/
U28 /\b(costs?|saves?|saving|worth|loses?|losing|wastes?)\b[a-z ]{0,10}\b(tens of thousands|hundreds of thousands|thousands|millions)\b/
# U29 — unsourced ratio
U29 /\b1% of\b|\b(\d+ ?%|percent|fraction|tiny|small part|sliver|less than)\b[a-z' ]{0,25}\b(running costs?|costs? to run|operating costs?|annual budget|what (a|one|1) [a-z ]{0,15}costs?)\b|\b(costs? less than|less than the cost of) (a|1|one) (single )?[a-z ]{0,15}\b(repair|claim|charter|day|crew|engineer|failure|service)\b/
# U30 — unsourced counts
U30 /\b\d+ ?\+(?! ?(years?|yrs?|months?|weeks?|days?|hours?|hrs?|minutes?|metres?|meters?|m|ft|feet|knots?|kts?|nm|%)\b)/
U30 /\bover \d+ (engineers|crew|yachts|vessels|captains|people)|follow the build/
U30 /\b(join\w*|used by|trusted by|chosen by|loved by|relied on by|follow\w*|already (on|using)|signed up|running on)\b[a-z ]{0,15}\b(\d+|over|more than|hundreds|thousands|dozens|many)\b[a-z ]{0,10}\b(vessels|yachts|superyachts|engineers|crew|captains|fleets|users|customers|members|followers|owners|boats)\b|\b(\d+|hundreds|thousands|dozens)\b[a-z+ ]{0,10}\b(vessels|yachts|superyachts|engineers|crew|captains|fleets|users|customers|owners)\b[a-z ]{0,15}\b(use|using|trust|rely|run|chose|choose|switched|already|follow|signed)\b/
# U31 — testimonials / ROI
U31 /saved \d+ (hours?|minutes?|days?)|\bsav(e|es|ing) \d+ (hours?|minutes?|days?)\b/
U31 /\b(cut|cuts|reduced?|reduces|slashe[sd]?|halved?|halves|freed? up|frees up)\b[a-z ]{0,30}\b(by )?\d+ ?(%|percent|hours?|days?|minutes?|weeks?)(?![a-z])|\b(cut|slash|halve)\w*[a-z ]{0,20}\b(in half|by half)\b/
U31 /\d+ ?(x|times) (faster|quicker|more|less|better|fewer)\b/
U31 /trusted by|customers (report|say|save)|\bour customers\b|\b(engineers|captains|crews?|users|owners) (report|say)\b|bitcoin/
U31 /\b[ms]\/y [a-z' ]{0,40}\b(saved|cuts?|reduced|reports?|says|said|swears|loves|recovered)\b|"[^"]{3,200}[^" ]" ?- ?(captain|chief|owner|engineer|eto|manager|bosun|purser)\b/
# U32 — ledger resume
U32 /browser('s)? history|chrome ?history|hop back|\b(like|as) a browser\b|reopen(ing)? a tab/
U32 /\b(pick|picks|picking) (it |them |a record |the record |things )?(back )?up (exactly )?where (you|they|we|i) (left|stopped)|\bwhere (you|they) (left off|stopped)\b|\bpick (a|the) record back up\b/
U32 /\b(resume|jump back|go back|get back|return|hop|dive back)\w*\b[a-z ]{0,10}\b(into|to) (any|your|anyone'?s|the) (job|work|task|record|work order)s?\b/
# U34 — money / warranty finder
U34 /money ?finder|warranty (finder|claim pack)|claim pack|audit grade pack|(pack|bundle|report|claim)[a-z ]{0,20}in seconds/
U34 /\b(recover\w*|reclaim\w*|claw\w* back|recoup\w*|find\w*|uncover\w*|unlock\w*|captur\w*|win\w* back|turn\w*|surfac\w*|spot\w*|catch\w*)\b[a-z0-9' ¤]{0,25}\b(money|cash|thousands|millions|value|revenue|dollars|funds|refunds?|payouts?|credits?|¤ ?\d+|\d{4,})\b[a-z ']{0,25}\b(warrant\w*|claims?|manufacturers?|oems?)\b/
U34 /\b(warrant\w*|claims?)\b[a-z' ]{0,25}\b(money|cash|revenue|payouts?|refunds?|recovery|recoveries|income)\b|\b(unclaimed|missed|lost|forgotten|hidden|untapped|expired)\b[a-z ]{0,10}\bwarrant\w*\b[a-z ]{0,20}\b(money|cash|value|revenue|claims?|recover\w*|into)\b/
U34 /\bpays? for itself\b|\bmoney (on the table|back|you'?re (leaving|losing|missing))|\bleaving money\b|\bget\w* (your )?(money|cash|value) back\b|\b(turn|convert)\w*\b[a-z ]{0,20}\bwarrant\w*\b[a-z ]{0,10}\binto (cash|money|revenue)/
# U35 — demo duration
U35 /\b\d+ ?(minute|min|hour)s? (demo|call|walkthrough|walk through|tour|meeting|session|chat)\b/
# U37 — allowlist leftovers
U37 /named individual|everything you do|certificate bundle|\[verify\]/
U37 /\b(two|2) ?(factor|step) (auth\w*|login|log in|sign in|verification)|\b2fa\b|\boptional (two|2|multi) ?(factor|step)|\b(supports?|offers?|includes?|built in|enables?) (mfa|multi ?factor)\b/
# call-only (CC03) — exempt only inside an approved commercial.C* line on a channel it lists
K01 /¤ ?\d|\d ?¤/
K02 /\b\d[\d.]* ?(dollars?|euros?|pounds|bucks)\b/
K03 /per (month|28 days|year|annum)\b|per vessel (per|a|each) (month|year)/
K03 /\b\d{3,}(\.\d+)? ?(\/|per|a|an|each) ?(month|mo|year|yr|annum|vessel|hull|boat|yacht|seat|user)\b|\b\d{3,}(\.\d+)? (monthly|annually|yearly)\b/
K03 /\b(priced|pricing|price|fee|subscription|rate)\b[a-z ]{0,12}\b(at|of|is|from)? ?\d{3,}\b|\b\d{3,}[a-z ,]{0,15}\b(billed|charged|invoiced|paid) (monthly|annually|yearly|per)\b|\b(monthly|annual|yearly) (fee|price|subscription|cost|rate) of \d/
K04 /pilot pricing/
K05 /locked for 12 months/
K07 /free trial|\b\d+ (day|week|month) (free )?trial\b|\btrial period\b|\btry (it |us |celesteos )?(free|for free)\b|\bfree for (a|1|\d+) (days?|weeks?|months?)\b(?! after)|\b(first|1st) (month|week|\d+ days) free\b|\bfree (month|pilot)\b/
```

### Synonyms (folded before matching; longest first)
```synonyms
round the clock => 24/7
around the clock => 24/7
it self => itself
them selves => themselves
your self => yourself
instantaneously => instantly
straight away => instantly
automagically => automatically
optimize => optimise
```

### Claim triggers (CC05: a sentence that matches one of these needs provenance on non-blog channels)
```triggers
/\b(?:celesteos|the system|we|it)\b (?:[a-z]+ )?(?:[a-z]+s|can|will|never|always)\b/
/\d|¤|%/
/\b(?:gdpr|soc|ism|class|certif\w*|encrypt\w*|iso)\b/
/\b(?:every|all|never|always|guarantee\w*|instantly|only)\b/
/\b(?:faster|better|best|leading)\b|(?:^|\s)#1\b/
```

### Internal code / file names (CC04; case-sensitive, raw text)
```internal_names
/HandoverDraftPanel/
/ConfirmExportModal/
/executeAction\s*\(/
/\b\w+\.tsx\b/
/POST\s+\/v1\//
/combined_service/
/f1_search_cards/
```

### Hosts (CC04 / CC10)
```json hosts
{ "allowed": ["celeste7.ai", "www.celeste7.ai", "verifier.celeste7.ai"], "dead": ["verify.celeste7.ai"] }
```

### Channel fields and limits (CC07; spec 29 §2.1)
```json channels
{
  "blog": { "fields": ["draft_html", "meta_json", "page_html"], "limits": {} },
  "page_meta": {
    "fields": ["title", "description", "og_title", "og_description", "twitter_title", "twitter_description", "og_url", "canonical", "llms_txt", "page_html"],
    "limits": { "title": { "min": 30, "max": 65 }, "description": { "max": 155 }, "og_description": { "max": 155 }, "twitter_description": { "max": 155 } },
    "equal_titles": true
  },
  "email": {
    "fields": ["subject", "preheader", "body"],
    "limits": { "subject": { "max": 60, "no_exclamation": true, "no_caps_word": true }, "preheader": { "max": 90 }, "body": { "words_max": 150, "when_basis": "relationship" } }
  },
  "linkedin": {
    "fields": ["post_text", "hashtags", "link", "intro_text", "headline", "description"],
    "limits": { "post_text": { "max": 3000 }, "hashtags": { "max_items": 3 }, "intro_text": { "max": 150 }, "headline": { "max": 70 }, "description": { "max": 100 } }
  },
  "meta": {
    "fields": ["primary_text", "headline", "description"],
    "limits": { "primary_text": { "min": 50, "max": 150 }, "headline": { "max": 27 }, "description": { "max": 27 } }
  },
  "google_ads": {
    "fields": ["headlines", "descriptions", "path1", "path2", "final_url"],
    "limits": { "headlines": { "count": [3, 15], "max": 30, "no_exclamation": true, "no_phone": true }, "descriptions": { "count": [2, 4], "max": 90, "no_phone": true }, "path1": { "max": 15 }, "path2": { "max": 15 } }
  },
  "social_generic": {
    "fields": ["text", "hashtags", "platform"],
    "limits": { "text": { "max": 2200 }, "hashtags": { "max_items": 5 } }
  }
}
```

### Email footers per basis (CC11; pack 10 §7.3)
```json footers
{
  "promotional": { "require": ["unsubscribe", "7901 4th st n"] },
  "relationship": { "require": ["celesteos", "reply .stop."] },
  "transactional": { "require": ["celesteos llc"] }
}
```

### Legacy keys (kept for brief.mjs and older tooling; the gate itself runs the rules above)

Banned lexicon:
```lexicon
/\bAI\b/                     (exception: editorial blog discussion of the topic, flagged for human review)
/artificial intelligence/i
/machine[ -]?learning/i
/\bML\b/                     (word-boundary; exclude "HTML", "XML" via boundary)
/\bsmart\b/i                 (exception: the competitor product name "smartPAL")
/\bautomat\w*/i              (automate, automatic, automatically, automated, automation)
/\bauto[- ]?(generat|add|populat|link|propagat|alert|execut|assembl|compil|writ)\w*/i
/\bseamless\w*/i
/\boptimi[sz]\w*/i
/\bhallucinat\w*/i
/\beffortless\w*/i
/\bmagic\w*/i
/\brevolutio\w*/i
/game[- ]chang\w*/i
/\bintelligen(t|ce)\b/i      ("intelligence" as product-magic is off-brand; say "knowledge")
```

Banned overclaim patterns:
```overclaims
/writes itself/i
/assembles itself/i
/(assembled|compiled|generated)\s+automatically/i
/not assembled manually/i
/every (answer|result) cites/i
/every domain/i
/all (12|14|twelve|fourteen) domains/i
/mapped to root cause/i
/hop back/i
/chrome[- ]history/i
/sealed pdf/i
/money[- ]?finder/i
/\[VERIFY\]/
/cascad\w*/i
/propagat\w*/i
/knowledge graph/i
/walks the [a-z ]{0,30}graph/i
/sub[- ]?second/i
/real[- ]?time/i
/works? offline/i
/onboard(ed|ing)? in hours/i
/read (it )?in full/i
/measured duration/i
/for how long/i
/verify\.celeste7\.ai/i
/SOC[- ]?2 (certified|compliant)/i
/GDPR compliant/i
/zero data retention/i
/hours[- ]of[- ]rest/i
/shopping[- ]lists?/i
/purchase[- ]orders?/i
/\breceiving (page|module|workflow|screen|log)\b/i
/\binbox\b|(outlook|exchange) integration|email (integration|ingest\w*|sync)/i
```

CALL-ONLY patterns (pricing):
```call_only
/\$\s?\d/
/(EUR|€|£|GBP|USD)\s?\d/
/per (month|28 days|year)\b/     (narrowed: "per vessel" alone is commercial.C02)
/pilot pricing/i
/locked for 12 months/i
```

---

## Tone rules (human review, not regex)
1. Quietly confident, evidence-led. No fake counters, no invented statistics, no urgency theatre.
2. **No unsourced outcome metrics.** "After 90 days, record completeness improves", "37% turnover", "weeks → hours" tables: every number needs a citable source or a real pilot measurement. Industry stats in blogs need a named source.
3. **The system proposes; the engineer decides.** This is the approved framing for every assistance feature. "Nothing executes without explicit consent" is SAFE and on-truth.
4. **Painkillers lead, vitamins are lines.** Handover, search/discovery, show-related, ledger-proof lead. Cert-expiry, notifications, bundles, fleet = one-liners only.
5. Roadmap features (fleet, money-finder, sealed PDF) may ONLY appear with an explicit forward-looking label ("Available Q3 2026", "on the roadmap") — never depicted as in-use today.
6. Anchor on the loss (knowledge walking off the gangway), never on the price.
7. Compounding language ("worth more next year") applies to USEFULNESS of the record, never asset VALUE.
8. Internal code/file names (HandoverDraftPanel.tsx, ConfirmExportModal.tsx, executeAction(...), POST /v1/...) never appear in buyer-facing copy.

---

## Conflict resolutions applied in this file (spec 29 §3.4)
| # | Conflict | Resolution |
|---|---|---|
| X01 | Price on site vs CALL-ONLY vs contract List Fee | `commercial.C01` on L (inside `data-pricing`) and E only; K01–K05 everywhere else |
| X02 | "The standard rate is higher. Pilot vessels keep this one." | Contract wins (FD4): U25 banned |
| X03 | "we import… / onboarding waived" vs contract | `commercial.C06` (E); U22, U23 banned |
| X04 | "response in hours, not days" vs contract support terms | `commercial.C07` (L, E); U20 banned |
| X05 | "Nothing to install" / "No app installation" vs the sync-agent installer | SAFE lines retired; U24 banned; `cloud.P19` |
| X06 | "EU data processed in the United States" vs "stored in Germany" | `security.S03` / `security.S09`; U26 banned |
| X07 | "No lock-in" vs 30 days' notice | `commercial.C04`; U27 banned |
| X08 | Contract "converts automatically" vs lexicon `automat*` | Lexicon unchanged; `commercial.C05` is the only trial line |
| X09 | Public trial | K07 call-only; `commercial.C05` E only |
| X10 | "Per vessel, not per user" vs the old "per vessel" pricing regex | K03 narrowed; `commercial.C02` passes everywhere |
| X11 | Site og/meta/llms.txt absolutes | U01, U02, U07, U08, U10 banned |
| X12 | "already written", "Watch it assemble", "Browser history", "indexed the moment", 30/14/7, testimonial, 500+ | U01, U32, U33, U08, U31, U30 banned |
| X13 | Unsourced $20k–100k, 1%, 500+ | U28–U30 banned |
| X15 | Meta ad limits | vendor numbers (primary 50–150, headline 27, description 27) |
| X16 | Pack id | `celeste-brand-pack` |
