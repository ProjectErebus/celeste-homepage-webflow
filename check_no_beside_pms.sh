#!/bin/sh
# Fails if hidden metadata (meta/og/twitter/JSON-LD description) carries retired "beside/alongside PMS" wording.
cd "$(dirname "$0")"
bad=$(grep -nE '(<meta[^>]*(description)[^>]*|"description": *)"?[^<]*(beside the PMS|you already run|alongside your existing PMS|next to your PMS)' about.html landing-v2.html landing-v3.html)
[ -z "$bad" ] || { echo "FAIL:"; echo "$bad" | cut -c1-160; exit 1; }
echo PASS
