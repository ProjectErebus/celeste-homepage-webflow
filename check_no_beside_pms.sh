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
