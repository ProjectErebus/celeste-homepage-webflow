#!/bin/sh
# Fails if the retired "beside/alongside your PMS" positioning appears in published HTML (meta, JSON-LD or visible).
# Excluded: legal pages, seanet proposal/overview pages, content-engine, dist, node_modules, *.md.
cd "$(dirname "$0")"
PAT='beside the PMS|you already run|alongside your existing PMS|next to your PMS|alongside the vessel.s certified PMS|certified PMS|Nothing to replace|Nothing to migrate|rip out|Keep AMOS|Sits Alongside|Technical Intelligence System|what does this replace'
bad=$(grep -rnIE "$PAT" --include='*.html' --include='llms.txt' . \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=content-engine --exclude-dir=dist --exclude-dir=prototypes --exclude-dir=design-studio \
  --exclude='seanet-*' --exclude='privacy-policy.html' --exclude='acceptable-use.html' --exclude='cookies.html' --exclude='terms*.html' --exclude='companion.html' | cut -c1-160)
[ -z "$bad" ] || { echo "FAIL:"; echo "$bad"; exit 1; }
echo PASS

# Retired features (hours of rest, HoR, shopping list, purchase order, receiving, email ingestion) must not be presented as CelesteOS features.
# Reader-status-quo mentions such as "supplier email threads" are allowed. Legal pages and the seanet client pages are exempt.
RET='hours of rest|\bHoR\b|shopping list|purchase order|\bPO-[0-9]|receiving (OCR|ocr)|RECEIVING|>06 · Receiving|delivery note|email (ingest|inbox|integration|sync)|connect(s)? your (email|inbox)|Outlook'
bad2=$(grep -nIE "$RET" landing-v2.html landing-v3.html landing-v4.html index.html about.html trust.html sources.html 2>/dev/null | cut -c1-160)
[ -z "$bad2" ] || { echo "FAIL (retired features):"; echo "$bad2"; exit 1; }
echo PASS-retired
