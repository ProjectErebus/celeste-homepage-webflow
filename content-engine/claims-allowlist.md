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
# U03/U36/U04 — lexicon (CC01)
U03 /\bai\b/ editorial domain_guard
U03 /artificial intelligence/ editorial
U03 /machine ?learning/ editorial
U03 /\bml\b/ editorial domain_guard
U03 /\bsmart\b/
U03 /\bautomat\w*/
U03 /\bauto ?(generat|add|populat|link|propagat|alert|execut|assembl|compil|writ)\w*/
U03 /\bseamless\w*/
U03 /\boptimi[sz]\w*/
U03 /\beffortless\w*/
U03 /\bmagic\w*/
U03 /\brevolutio\w*/
U03 /game ?chang\w*/
U03 /\bintelligen(t|ce)\b/ editorial
U03 /\blearns? from\b/
U03 /entity extraction|semantic search|\bvector\b|\bembedd\w*|cosine similarity|\d+ dimension/
U04 /\bhallucinat\w*/
U36 /cutting ?edge/
U36 /\bnext ?gen(eration)?\b/
U36 /\bleverag\w*/
U36 /\bdon'?t worry\b/
U36 /\bhang tight\b/
U36 /\bi (think|believe)\b/
# overclaims (CC02)
U01 /\b(write|draft|build|create|assemble|compile|generate|fill|populate|complete)s? itself\b/
U01 /(assembled|compiled|generated) automatically/
U01 /not assembled manually/
U01 /already written/
U01 /watch it assemble/
U01 /\bassembled? from\b|\bassembles from\b/
U01 /\bput together for you\b|(assembled|written|compiled|put together|built) [a-z ]{0,20}(on its own|by itself)/
U01 /notes become (a|the) [a-z ]{0,20}handover/
U01 /\bwe create\b/
U01 /\bgenerated from\b/
U01 /\bsystem already (has|knows)\b/
U02 /every (answer|result) (cites|is cited)/
U02 /every domain/
U02 /all \d+ domains/
U02 /\bsearch(es)? every (manual|document|record|domain)/
U02 /every action (is|gets) (sealed|signed|verified)|seals every action/
U05 /real ?time/
U05 /sub ?second/
U05 /\b\d+ ?(ms|milliseconds?)\b/
U05 /always current/
U06 /knowledge graph/
U06 /walks the [a-z ]{0,30}graph/
U06 /root cause/
U07 /sealed pdf/
U07 /structured pdf/
U07 /(export|download)\w* [a-z ]{0,30}\bpdf\b/
U07 /\b(one|1) ?click [a-z ]{0,30}(bundle|pack|report|export)/
U07 /inspection bundle|bundle export/
U08 /\b30\/14\/7\b/
U09 /works? offline/
U09 /offline (mode|first|access)/
U09 /syncs? when (the )?connection/
U10 /onboard(ed|ing)? in (hours|minutes|a single|an afternoon|\d+)/
U10 /(searchable|live|onboarded|running|ready) on day 1\b/
U10 /within 2 weeks/
U10 /up and running in/
U10 /in (a single|1) afternoon/
U11 /(alongside|beside|next to|on top of|over) (your|the) [a-z' ]{0,30}pms\b/
U11 /layer over/
U11 /nothing to (replace|migrate)/
U11 /keep amos/
U11 /you already run/
U11 /class society approvals/
U11 /technical intelligence system/
U11 /rip out/
U11 /sits alongside/
U11 /certified pms/
U11 /what does this replace/
U12 /gdpr compliant/
U12 /soc ?(2|ii) (certified|compliant|certification)/
U12 /\b(class|type) approved/
U12 /approved by class/
U13 /zero data retention/
U13 /never leaves/
U13 /no third party (ever )?sees/
U14 /\b(military|bank) ?(grade|level)\b/
U15 /verify\.celeste7\.ai/
U16 /read tracking/
U16 /for how long/
U16 /read (it )?in full/
U16 /measured duration/
U16 /read events?/
U16 /evidence of awareness/
U17 /hours of rest/
U17 /shopping lists?/
U17 /purchase orders?/
U17 /\breceiving (page|module|workflow|screen|log|ocr)\b/
U17 /\binbox\b|(outlook|exchange) integration|email (integration|ingest\w*|sync)/
U17 /\bhor\b/
U17 /\bpo \d/
U17 /delivery note/
U17 /connects? your (email|inbox)/
U18 /cascad\w*/
U18 /propagat\w*/
U18 /already attached/
U20 /hours,? not days/
U20 /24\/7/
U20 /round the clock/
U20 /(reply|replies|response|respond)\w* within (an? )?hours?/
U21 /uptime guarantee/
U21 /guaranteed (uptime|sla|availability)/
U21 /uptime (is )?guaranteed/
U21 /\bsla\b/
U21 /service credits?/
U22 /\b(we|our team) (migrate|import)\w*/
U22 /migration (is )?included/
U23 /\bwaive[sd]?\b/
U23 /onboarding fee/
U24 /nothing to install/
U24 /no (app )?installation/
U24 /zero install/
U25 /standard rate is higher/
U25 /\bdiscount\w*/
U25 /\d+% off/
U25 /limited time/
U25 /\d+ (pilot )?(spots|places) left/
U26 /processed in the (united states|us)\b/
U27 /no lock ?in/
U27 /cancel any ?time/
U27 /no contract/
U28 /\b\d{4,} to \d{4,}\b/
U28 /\b(cost|costs|runs|worth|saves?)\b (¤ ?)?\d{4,}/
U29 /\b1% of\b/
U29 /running costs?|costs? to run/
U30 /\b\d+(\+| \+)/
U30 /\bover \d+ (engineers|crew|yachts|vessels|captains|people)/
U30 /follow the build/
U31 /saved \d+ (hours?|minutes?|days?)/
U31 /\bcut [a-z ]{0,30}by \d+%/
U31 /\d+x (faster|quicker|more)/
U31 /trusted by/
U31 /customers (report|say|save)/
U31 /\bour customers\b/
U31 /\b[ms]\/y\b/
U31 /"[^"]{3,200}" ?- ?(captain|chief|owner|engineer|eto|manager)/
U31 /bitcoin/
U32 /browser('s)? history/
U32 /chrome ?history/
U32 /hop back/
U32 /pick (up )?where you left off/
U32 /pick (a|the) record back up/
U33 /the moment it'?s (written|saved|logged)/
U33 /(searchable|findable|indexed|available|visible) (instantly|immediately|in real time)/
U33 /\binstant(ly|aneously)\b/
U34 /money ?finder/
U34 /warranty (finder|claim pack)/
U34 /claim pack/
U34 /audit grade pack/
U34 /(pack|bundle|report|claim)[a-z ]{0,20}in seconds/
U35 /\b\d+ ?(minute|min)s? demo\b/
U37 /named individual/
U37 /\b(two|2) ?factor|\b2fa\b/
U37 /everything you do/
U37 /certificate bundle/
U37 /\[verify\]/
# call-only (CC03) — exempt only inside an approved commercial.C* line on a channel it lists
K01 /¤ ?\d/
K02 /\b\d[\d.]* ?(dollars?|euros?|pounds)\b/
K03 /per (month|28 days|year)\b/
K03 /per vessel (per|a|each) (month|year)/
K04 /pilot pricing/
K05 /locked for 12 months/
K07 /free trial|\b\d+ day trial\b/
```

### Synonyms (folded before matching; longest first)
```synonyms
round the clock => 24/7
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
