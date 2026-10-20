# Brief — ism-internal-audit-checklist-yacht

> Hand-written brief for the compliance lead-magnet piece. Claude drafts `draft.html`
> against this, passes `gate.mjs` on both `draft.html` and `meta.json`, then the founder
> gates `publish.mjs`.

## Target

- **Keyword:** `ISM internal audit checklist yacht`
- **Chapter:** `ledger`
- **Format:** lead-magnet / how-to checklist
- **Slug / URL:** `/blogs/ism-internal-audit-checklist-yacht`
- **Angle:** Pass Your ISM Internal Audit — the yacht checklist where every line ties to a retrievable record.
- **Search intent:** A chief engineer, ETO, DPA-side superintendent or master preparing for an internal ISM audit (SMS requirement, element 12). They want a usable checklist. The differentiator: each checklist line maps to an append-only record you can produce on demand, so audit prep becomes retrieval, not assembly.

## Thesis

The internal audit doesn't fail on whether the work was done. It fails on whether you can
**produce the evidence** — the right record, attributed and dated, on the day the auditor
asks. So the checklist is organised around the question "can you retrieve this in front of
the auditor?" Every line names the record it depends on.

## SAFE claim phrasings available for this chapter (ledger) — verbatim or trivially inflected

- The ledger is append-only. Nothing is ever overwritten.
- Corrections are recorded as new entries referencing the original. The original remains intact.
- Every action — logging a fault, creating a work order, signing a handover — is attributed and timestamped.
- Who acted, what they did, when, and which record was affected.
- Open any record and read its full audit trail.
- Deleted rows are struck through, never purged — the trail is the trail.
- The audit trail is not a feature. It is a legal defence.
- Records that can be retroactively modified cannot serve as evidence.
- Audit prep becomes retrieval, not assembly.

Cross-chapter SAFE lines that may be borrowed (in-truth, pre-cleared):
- Search: "Natural-language search across your vessel's records and manuals." / "Results open the source record itself." / "Type what you'd ask a colleague."
- Show Related: "Open any record and CelesteOS surfaces what's related." / "See what's connected. Immediately."
- Cloud: "CelesteOS is the planned maintenance system." / "Existing manuals, PDFs, scans and exports are imported as they are."
- Certificate (VITAMIN, line only): "Certificates tracked to expiry, with renewal dates and the source PDF attached." / "Alerts as expiry approaches."
- Verifier: "Every record independently verifiable → verifier.celeste7.ai"
- Security: "ISM Code — Aligned. Sections 10 and 11. Audit evidence, not class approval."

## Do NOT write (gate hard-fails)

- No AI/smart/ML/automate/seamless/optimize/magic/revolutionary/intelligent lexicon on product claims.
- No "writes itself / assembles itself / auto-generated / every domain cited / mapped to root cause /
  hop back / Chrome-history / sealed PDF / money-finder / cascade / propagate / knowledge graph /
  sub-second / real-time / works offline / onboard in hours".
- No pricing, no $/€/£, no "per month/vessel". CALL-ONLY.
- Host is `verifier.celeste7.ai`, never `verify.`.
- No "SOC 2 certified / GDPR compliant". Use the aligned forms with the caveat intact.
- No invented metrics. Industry stats need a named source. ISM clause references must be accurate.

## Assets (respect NEVER lines)

- `{{asset:ledger}}` — RETIRED 20 Oct 2026 (image shows a purchase-order entry). Do not use. Append-only activity timeline. NEVER hop-back/Chrome-history, NEVER sealed PDF.
- `{{asset:work-order}}` — work order carrying its official docs (SOP, ISM procedure, class cert) +
  running-hours schedule. Calm evidence frame for "the record carries its paperwork".
- `{{asset:fault-detail}}` — fault lens with corrective action + related entities (WO, equipment,
  warranty). Show-related is the strongest live moment — lead the retrieval point with it.

## Structure

1. Header: angle H1, meta line, lede leading with the problem (the audit fails on retrieval).
2. Why internal audits fail on evidence, not effort.
3. What the ISM Code actually requires (accurate clause refs: element 12 internal audits; 10
   maintenance; 11 documentation; 9 non-conformities/CAR).
4. The checklist — grouped by SMS area, each line ending "→ the record you produce".
   Sub-sections: maintenance & equipment; certificates; non-conformities & corrective action;
   drills & familiarisation/handover; documentation control. {{asset:work-order}} under maintenance,
   {{asset:fault-detail}} under non-conformities.
5. "Audit prep is retrieval, not assembly" — the ledger payoff. {{asset:ledger}}.
6. Name CelesteOS late: CelesteOS is the planned maintenance system; records captured as crew work,
   attributed, connected, searchable, independently verifiable.
7. FAQ (4). Summary list. CTA → /#pilot.

## Internal links

- `/blogs/audit-trail-superyacht` — append-only audit trail (chapter pillar; link in, don't compete)
- `/blogs/yacht-maintenance-audit-trail` — maintenance audit-trail pillar
- `/blogs/warranty-claim-documentation` — warranty evidence money page
- `/blogs/knowledge-crisis-superyachts` — handover / knowledge-loss flagship
- `https://verifier.celeste7.ai` — the proof payoff

## References (named sources only)

- IMO ISM Code — internal audit / element 12, maintenance s.10, documentation s.11, NC/CAR s.9.
- Class society (e.g. Lloyd's Register / DNV) ISM internal audit guidance.
- Seahub handover survey (already cited across the cluster) for the handover-evidence line.
