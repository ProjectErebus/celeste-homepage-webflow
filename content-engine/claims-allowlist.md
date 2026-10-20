# CelesteOS Claims Allowlist — the truth gate

**Status:** Canon. Every draft (blog, landing, social, email) is checked against this file before publish.
**Sources of truth:** 2026-06-05 production-truth audit (verified vs shipped Cloud_PMS code), pilot-call-companion.html (claims actually made to prospects), CEO brand canon (restraint).
**Rule of precedence:** if a phrase appears in BANNED anywhere in this file, it loses — even if a SAFE claim sounds similar. When in doubt, claim less.

Severity legend used below:
- **BANNED** — never publish. Mechanical gate must hard-fail.
- **NEEDS-EVIDENCE** — treat as banned until a verified measurement / live confirmation exists. Gate flags for human review.
- **CALL-ONLY** — never in published copy; reserved for live conversations.

---

## 1. SEARCH

### SAFE (approved phrasings — use verbatim or trivially inflected)
- "Natural-language search across your vessel's records and manuals."
- "Type what you'd ask a colleague."
- "Search lives at the top of every screen — phone, tablet, laptop."
- "Every result is a live record. One click lands on the actual work order — status, history, parts."
- "Search returns the record, not a snippet."
- "Finds what you mean, not what you typed."
- "There is nothing to learn. The engineer types what they need."
- "Results open the source record itself."
- "Vessel and role context carry automatically into results scope" → rewrite without auto-stem: "Results are scoped to your vessel and role — no filter to set up first."

### BANNED overclaims
| Banned phrasing | Why | Safe substitute |
|---|---|---|
| "Every answer cites its source" / "every domain cited" | Domain-cited gating uncertain in live code (F1 gating vs SEARCH8888 — unconfirmed). | "Results open the source record itself." |
| "No hallucinated content" / any "hallucinat*" | Invokes AI-magic framing; banned lexicon territory. | "If CelesteOS cannot find a record, it says so." (only if live-confirmed; until then omit) |
| "All 12 domains simultaneously" / "All 14 domains" / "every domain" | Exhaustive-coverage guarantee not live-verified for all domains (faults/certs coverage was historically gated). | "Across work orders, documents, and the vessel's records." Name only domains you can demo. |
| "Sub-second" / any latency number | NEEDS-EVIDENCE — no published measurement. | "Fast enough to use at 2am." (no number) |
| "Mapped to root cause" | Similarity surfacing, not causal mapping. Nothing maps root cause. | "Fault history, with prior occurrences surfaced alongside." |
| "Entity extraction + semantic search" as buyer copy | Mechanism talk drifts toward ML claims. | "Finds what you mean, not what you typed." |

### CALL-ONLY
- Index size, latency numbers, % vectorised, infrastructure details.

---

## 2. HANDOVER

### SAFE (approved phrasings)
- **Canonical line: "Captured as you work."**
- "Every record an engineer closes — a fault, a work order, a note — offers a single tap to add it to the handover draft."
- "The draft accumulates as the engineer works."
- "Months of context accumulate as a by-product of normal work."
- "Never asked twice if dismissed."
- "The outgoing engineer reviews the draft, then signs. The incoming engineer acknowledges in writing that the operational state of the vessel has been read and understood."
- "Both signatures timestamped. Locked after dual signature." (two-signature outgoing/HOD flow is live)
- "Every entry resolves back to a live record — one click opens the fault, the work order, the part." (handover wormhole is live)
- "The handover is a live index into the vessel's operational data, not a static document."
- "The incoming engineer inherits context, not chaos."
- "Built from one-tap captures as the engineer works — reviewed, then signed by both parties."

### BANNED overclaims
| Banned phrasing | Why | Safe substitute |
|---|---|---|
| "The handover writes itself" / "writes itself" (any subject) | Reality = 1-tap capture from a queue into a draft. Nothing writes itself. | "Captured as you work." |
| "auto-generated" / "auto-generates" / "generated automatically" | Same. | "Built from one-tap captures, reviewed before signing." |
| "assembled automatically" / "compiled automatically" / "assembles itself" / "not assembled manually" | Same. | "The draft accumulates as the engineer works." |
| "The departing engineer does not need to remember what to include. The system already has it." | Implies full auto-assembly; capture requires the engineer's tap. | "Each tap while working is one less thing to remember at rotation." |
| "Rough notes become a structured handover" | Implies transformation without the capture step. | "One-tap captures become the handover draft." |
| "You review, we create" | "We create" = auto-write framing. | "You capture as you work. You review. Both sides sign." |
| "Generated from operational data — not memory" | "Generated" framing. | "Compiled from the entries the engineer captured — not from memory." |

### CALL-ONLY
- Draft entry counts ("200+ entries") unless from a real, citable pilot vessel.

---

## 3. LEDGER

### SAFE (approved phrasings)
- "The ledger is append-only. Nothing is ever overwritten."
- "Corrections are recorded as new entries referencing the original. The original remains intact."
- "Every action — logging a fault, creating a work order, signing a handover — is attributed and timestamped."
- "Who acted, what they did, when, and which record was affected." (attribution shown by role)
- "Open any record and read its full audit trail."
- "Deleted rows are struck through, never purged — the trail is the trail."
- "The audit trail is not a feature. It is a legal defence."
- "Records that can be retroactively modified cannot serve as evidence."
- "Audit prep becomes retrieval, not assembly."

### BANNED overclaims
| Banned phrasing | Why | Safe substitute |
|---|---|---|
| "Hop back into anyone's work" / "pick a record back up days later" / any Chrome-history / resume framing | No resume capability is shipped. | "Open any record and read its full audit trail — who touched what, when." |
| "Sealed PDF" / "audit trail exportable as a structured PDF" | Planned (v1.0), not live. | "Every record's history is available on demand, and independently verifiable at verifier.celeste7.ai." |
| "The system records who opened it, when, and for how long" / "measured duration" / "whether they read it in full" | Read-duration / read-completion tracking is NOT in the verified-shipped set. | "Actions on records are logged — created, updated, signed, linked." (NEEDS-EVIDENCE before any read-event claim) |
| "Read events logged — evidence of awareness" | Same — NEEDS-EVIDENCE. | Omit, or scope to actions. |
| "records interactions automatically" | Auto-stem; also implies passive read-tracking. | "Actions are recorded as the crew works — no checkbox, no extra step." |
| "One click on Generate warranty claim pack" / "audit-grade pack in seconds" | Money-finder/claim-pack territory — pull-on-open, not buyer-visible; do not depict. | "Warranty history and its evidence live on the record." (roadmap tease only, clearly labelled) |
| "named individual" as a universal claim | Live attribution defaults to role (Captain/Chief); personal-name display is gated. | "attributed — by signed-in user and role — and timestamped" |

### CALL-ONLY
- Notification routing internals (L2 attest, SigL4), seal-chain mechanics.

---

## 4. VERIFIER.CELESTE7.AI

### SAFE (approved phrasings)
- "Every record independently verifiable → verifier.celeste7.ai"
- "CelesteOS seals actions — faults, work orders, handovers, signatures — into a cryptographic receipt that anyone can independently verify."
- "Verify a sample receipt."
- "Proof, when proof matters."
- "Few systems produce proof. CelesteOS seals its records."

### BANNED overclaims
| Banned phrasing | Why | Safe substitute |
|---|---|---|
| "verify.celeste7.ai" (any reference) | NXDOMAIN. The live host is **verifier.celeste7.ai**. | "verifier.celeste7.ai" |
| "Sealed PDF" / "download the sealed PDF" | Planned, not live. | "Verify the receipt online at verifier.celeste7.ai." |
| "seals every action" (absolute) | Sweeping absolute; seal coverage is per-flow. | "seals key actions — faults, work orders, handovers, signatures" |

### CALL-ONLY
- Hash-chain mechanics, HMAC implementation details.

---

## 5. SUGGESTED DOCUMENTS

### SAFE (approved phrasings)
- "The right manual surfaces on the entity card." (discovery is live)
- "Suggested documents appear with a match score. The engineer accepts or denies — one tap."
- "Accept links the document to the record in front of you." (manual linking is live)
- "Deny is per-record. Every accept and deny is recorded in the ledger."
- "Finds the manual even when nobody remembers the filename."
- "Documents connected to the work they describe."

### BANNED overclaims
| Banned phrasing | Why | Safe substitute |
|---|---|---|
| "Accept once on the equipment. It propagates everywhere." | AUTO-propagation is NOT shipped. Only manual linking + discovery exist. | "Accept links the document to the record in front of you." |
| "cascade" / "cascades to every fault, WO, part" / "cascaded to every entity" / "walks the equipment graph" | Same — cascade not shipped; also graph framing is false (similarity, not graph). | "Linked documents are discoverable from related records via Show Related." |
| "every fault, every work order opens with its manuals already attached" | Depends on the unshipped cascade. | "Suggestions surface on faults, work orders, parts, and equipment; the engineer links with one tap." |
| "1536-dimension vector" / "cosine similarity" / "embedded using the same model" in buyer copy | Mechanism talk = ML claim drift. | "Matched by content and metadata." |
| "it learns from the corpus" | "Learns" = ML/AI product-magic claim. | "Matched by content and metadata." |
| "auto-link" (any form) | Auto-stem + propagation implication. | "one tap links" |

### CALL-ONLY
- Refresh cadence ("daily re-embed"), match-score thresholds.

---

## 6. CERTIFICATE BUNDLE

**Positioning rule (CEO canon): certificates are a VITAMIN — mention in lines, never feature as a hero section. Featuring them = "looking like the PMS".**

### SAFE (approved phrasings — single lines only)
- "Certificates tracked to expiry, with renewal dates and the source PDF attached."
- "Alerts as expiry approaches." (cert expiry notification scan is live)
- "Cross-linked to the equipment it certifies."
- "Certificates current and findable on inspection day."

### BANNED overclaims
| Banned phrasing | Why | Safe substitute |
|---|---|---|
| "Auto-alerts" | Auto-stem. | "Alerts as expiry approaches." |
| "Auto-alerts at 30 / 14 / 7 days" (the schedule) | Specific schedule NEEDS-EVIDENCE (not live-verified). | "Alerts as expiry approaches." |
| Featuring a certificate-bundle hero section / dedicated chapter page | Vitamin rule — lines only. | One line inside a painkiller chapter. |
| "One-click inspection bundle" / "bundle export" | Bundle export not in the verified-shipped set. | "Certificates current and findable on inspection day." |

### CALL-ONLY
- Anything about bundle/export roadmap.

---

## 7. SHOW RELATED

**This is the strongest fully-live moment. Lead with it.**

### SAFE (approved phrasings)
- "Open any record and CelesteOS surfaces what's related — work orders, parts, equipment, and handovers."
- "See what's connected. Immediately."
- "Stay oriented without leaving the page."
- "Show Related sits in every record's header."
- "Following one record leads to every connected record."
- "Documents that should have been linked. Faults the previous chief logged but never closed."

### BANNED overclaims
| Banned phrasing | Why | Safe substitute |
|---|---|---|
| "graph" / "knowledge graph" / "walks the graph" / "enters the graph" | Show Related is similarity-based; the graph system is built-but-dead code. | "surfaces related records" |
| "indexed the moment it's written" / "the instant" | Absolute-latency claim; indexing is worker-driven, not instantaneous-guaranteed. | "becomes findable as you work" |
| "Mapped to root cause" | See Search — no causal mapping. | "Prior occurrences surfaced alongside." |
| "Everything you do becomes findable" + enumerating every CRUD type as guaranteed | Coverage absolutes; keep to what's demonstrable. | "Notes, photos, handovers, and records become findable as you work." |

### CALL-ONLY
- Similarity mechanism, index internals.

---

## 8. CLOUD-BASED

### SAFE (approved phrasings)
- "Nothing to install."
- "CelesteOS is the planned maintenance system."
- "Existing manuals, PDFs, scans and exports are imported as they are."
- "Browser-based. Any modern browser — desktop, tablet, mobile. No app installation."
- "Crew on rotation can review records remotely with their existing credentials."
- "Your data is yours. Nothing is held hostage." (export commitment — keep as commitment, not feature depiction)
- "Your existing manuals, PDFs, scans, and exports are indexed as they are. No reformatting exercises." (emails are NOT ingested — retired)

### BANNED overclaims
| Banned phrasing | Why | Safe substitute |
|---|---|---|
| "Runs alongside your existing PMS" / "nothing to replace, nothing to migrate" / "your existing PMS keeps its class society approvals, workflows, crew familiarity" / "a layer over your PMS" | Founder ruling 20 Oct 2026: CelesteOS is the planned maintenance system, not an add-on beside another one. | "CelesteOS is the planned maintenance system." |
| "Works offline" / "core functions work with intermittent connectivity, and data syncs when the connection is restored" | Offline/sync NOT in the verified-shipped set. NEEDS-EVIDENCE. | "Designed for the connectivity reality of superyachts." (nothing more specific) |
| "Onboard in hours, not weeks" as an absolute | Conflicts with the pilot's own "import takes 3–5 working days". NEEDS-EVIDENCE for "hours". | "Onboarding measured in days, not months." or omit the number. |
| "The vessel's record becomes searchable immediately" | "Immediately" absolute vs import/indexing lead time. | "The vessel's record becomes searchable as soon as import completes." |
| "real-time" (any) / "always current" / "live data, always current" | Real-time absolutes not guaranteed by worker-driven pipeline. | "Live data from the vessel's records." |

### CALL-ONLY
- Import timelines per vessel, hosting/provider details, fleet rollout dates (Q3 2026 may be referenced ONLY with the "(Available …)" roadmap label, never as live).

---

## 9. SECURITY

### SAFE (approved phrasings — these exact honesty-calibrated forms)
- "GDPR — Aligned. EU data processed in the United States under SCCs and UK IDTA. DPA available on request."
- "SOC 2 — Aligned with TSC. Controls built against AICPA Trust Services Criteria. Audit not yet commissioned."
- "ISM Code — Aligned. Sections 10 and 11. Audit evidence, not class approval."
- "Each vessel's data is isolated. Role-based access throughout." (yacht isolation live-verified)
- "Row-level security isolates each vessel's data."
- "Encrypted at rest and in transit."
- "Fleet view aggregates statistics without exposing cross-vessel records." (only when fleet is labelled roadmap)
- "Captain handovers visible only to the back-to-back and fleet manager. Role-based throughout."

### BANNED overclaims
| Banned phrasing | Why | Safe substitute |
|---|---|---|
| "GDPR compliant" / "SOC 2 certified" / "SOC 2 compliant" | No audit commissioned; "aligned" is the honest calibrated word. | "Aligned" forms above, with the caveat sentence intact. |
| "class approved" / anything implying class society approval of CelesteOS | CelesteOS is audit evidence, not class approval. Never claim class approval. | "CelesteOS is audit evidence, not class approval." |
| "zero data retention" / "your data never leaves" / "no third party ever sees your data" | OpenAI subprocessor: no ZDR at current tier, 30-day abuse retention. Documented in the Sub-Processor Register. | "Sub-processor register and DPA available on request." |
| "optional two-factor" | NEEDS-EVIDENCE — not live-verified. | Omit until verified. |
| "military-grade encryption" / "bank-level security" | Hype lexicon. | "Encrypted at rest and in transit." |
| Caveat-stripping (publishing "SOC-2" without "audit not yet commissioned", or "GDPR" without the SCC/IDTA sentence) | The caveat IS the claim. | Always ship the full calibrated sentence. |

### CALL-ONLY
- Penetration-test status, incident history, key-management details, sub-processor specifics.

---

## GLOBAL — banned hype lexicon & tone rules

### Banned lexicon (product claims; blog may discuss AI topically/editorially, NEVER as product-magic)
Mechanical gate — hard-fail a draft if any of these match in product-claim context:

```
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
/\bintelligen(t|ce)\b/i      ("Maritime Technical Intelligence System" legacy name: do NOT introduce in new copy; CelesteOS IS the planned maintenance system. "intelligence" as product-magic is off-brand; say "knowledge")
```

### Banned overclaim patterns (cross-chapter, mechanical)
```
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
/cascad\w*/i                 (suggested-docs context)
/propagat\w*/i               (suggested-docs context)
/knowledge graph/i
/walks the .*graph/i
/sub[- ]?second/i
/real[- ]?time/i
/works? offline/i
/onboard(ed|ing)? in hours/i
/read (it )?in full/i
/measured duration/i
/for how long/i              (document-access context)
/verify\.celeste7\.ai/i      (wrong host — must be verifier.celeste7.ai)
/SOC[- ]?2 (certified|compliant)/i
/GDPR compliant/i
/zero data retention/i
/hours[- ]of[- ]rest/i        (retired page — founder ruling 20 Oct 2026)
/shopping[- ]lists?/i          (retired page)
/purchase[- ]orders?/i         (retired page)
/\breceiving (page|module|workflow|screen|log)\b/i   (retired page)
/\binbox\b|(outlook|exchange) integration|email (integration|ingest\w*|sync)/i   (retired — emails are never ingested)
```

### CALL-ONLY patterns (pricing — never in published copy)
```
/\$\s?\d/                    ($450, $15k, any dollar figure)
/(EUR|€|£|GBP|USD)\s?\d/
/per (month|28 days|vessel)\b/   (in a pricing context)
/pilot pricing/i
/locked for 12 months/i
```

### Tone rules (human review, not regex)
1. Quietly confident, evidence-led. No fake counters, no invented statistics, no urgency theatre.
2. **No unsourced outcome metrics.** "After 90 days, record completeness improves", "37% turnover", "weeks → hours" tables: every number needs a citable source or a real pilot measurement. Industry stats in blogs need a named source.
3. **The system proposes; the engineer decides.** This is the approved framing for every assistance feature. "Nothing executes without explicit consent" is SAFE and on-truth.
4. **Painkillers lead, vitamins are lines.** Handover, search/discovery, show-related, ledger-proof lead. Cert-expiry, notifications, bundles, fleet = one-liners only.
5. Roadmap features (fleet, money-finder, sealed PDF) may ONLY appear with an explicit forward-looking label ("Available Q3 2026", "on the roadmap") — never depicted as in-use today.
6. Anchor on the loss (knowledge walking off the gangway), never on the price.
7. Compounding language ("worth more next year") applies to USEFULNESS of the record, never asset VALUE.
8. Internal code/file names (HandoverDraftPanel.tsx, ConfirmExportModal.tsx, executeAction(...), POST /v1/...) never appear in buyer-facing copy.

---

## LIVE-SITE VIOLATIONS FOUND (2026-06-11 read — fix list)

| # | File | Quote | Violation |
|---|---|---|---|
| 1 | index.html:304 | "The handover that writes itself." | BANNED auto-write claim |
| 2 | index.html:779 | "If this describes your vessel, *the next handover writes itself.*" | BANNED auto-write claim |
| 3 | index.html:422 | "Handover drafts … assembled automatically from real work." | BANNED "assembled automatically" |
| 4 | index.html:416 | "You review, we create" | Auto-write framing |
| 5 | index.html:344 | "Every answer cites its source … No hallucinated content." | Citation absolute (gating uncertain) + hallucination lexicon |
| 6 | index.html:322,325,327 | "Fault history. Mapped to root cause." (+2 alt/title attrs) | No causal mapping shipped |
| 7 | index.html:756 | "$450" (per 28 days pricing block) | Pricing is CALL-ONLY |
| 8 | handover.html:6,8,14,36 | "CelesteOS auto-generates structured handover documents…" (meta ×4) | BANNED "auto-generates" — also leaks into Google/social snippets |
| 9 | handover.html:147 | "not assembled manually. It is compiled automatically…" | BANNED auto-assembly |
| 10 | handover.html:149 | "The departing engineer does not need to remember what to include. The system already has it." | Auto-assembly implication |
| 11 | handover.html:138 | alt: "…auto-added to outgoing engineer handover document" | BANNED auto-add |
| 12 | records.html:101 | "…who opened the document, when, and whether they read it in full." | Read-completion tracking not shipped |
| 13 | records.html:121 | "who opened it, when, and for how long … a measured duration" | Read-duration tracking not verified |
| 14 | records.html:158 | "records interactions automatically as the crew works" | Auto-stem + passive read-tracking implication |
| 15 | search.html:123,125 | "results from every domain simultaneously" / "One query. Every domain." | Exhaustive-coverage absolute, unverified |
| 16 | intelligence.html:153 | "The handover assembles itself as the engineer works." | BANNED "assembles itself" |
| 17 | intelligence.html:167 | "After 90 days of use, record completeness improves" | Unsourced outcome metric |
| 18 | intelligence.html:150 | alt: "handover fields auto-populated from linked fault and work order records" | Auto-stem (use "pre-populated after the engineer's tap") |

Note: intelligence.html body copy ("The system proposes, the engineer decides. Nothing executes without explicit consent.") is the MODEL framing — it matches shipped reality and should be the template for fixing the other pages.
