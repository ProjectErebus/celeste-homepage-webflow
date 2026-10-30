#!/usr/bin/env bash
# set-booking-url.sh <new-booking-url>
#
# Points every "Book a demo" link on the site at a Microsoft Bookings page, and rewrites any
# user-facing copy that promises a Zoom call to "Microsoft Teams".
#
# - Replaces ANY current Bookings page URL (https://outlook.office.com/book/<page>/ or
#   https://bookings.cloud.microsoft/book/<page>/), so it is safe to re-run: placeholder first,
#   real URL later.
# - Only git-tracked text files are touched. js/celeste-attribution.js and tests/ are skipped
#   (they match the Bookings hosts by prefix, not a specific page).
# - Prints every change as file:line so the diff can be reviewed before committing.
#
# Usage: scripts/set-booking-url.sh https://outlook.office.com/book/Demo@celeste7.ai/
set -euo pipefail

NEW="${1:-}"
if [[ ! "$NEW" =~ ^https://(outlook\.office\.com|bookings\.cloud\.microsoft)/book/[^[:space:]\"\'\<\>]+$ ]]; then
  echo "usage: $0 https://outlook.office.com/book/<Name>@celeste7.ai/   (or https://bookings.cloud.microsoft/book/...)" >&2
  exit 2
fi
case "$NEW" in */) ;; *) NEW="$NEW/" ;; esac

cd "$(git rev-parse --show-toplevel)"

URL_RE='https://(?:outlook\.office\.com|bookings\.cloud\.microsoft)/book/[^\s"'"'"'<>)]+'
# "Zoom" as a whole word, not inside base64 / data URIs. Case-sensitive on purpose: CSS "zoom" is not copy.
ZOOM_RE='(?<![A-Za-z0-9+/])Zoom(?![A-Za-z0-9+/=])'

files=$(git ls-files -z | xargs -0 grep -IlE 'https://(outlook\.office\.com|bookings\.cloud\.microsoft)/book/.|(^|[^A-Za-z0-9+/])Zoom([^A-Za-z0-9+/=]|$)' 2>/dev/null \
  | grep -vE '^(js/celeste-attribution\.js|tests/|scripts/set-booking-url\.sh$|node_modules/)' \
  | grep -E '\.(html|htm|txt|xml|json|md|js|mjs|njk|hbs|eml)$' \
  | grep -vE '^docs/' || true)

url_n=0; zoom_n=0
for f in $files; do
  out=$(NEW="$NEW" URL_RE="$URL_RE" ZOOM_RE="$ZOOM_RE" perl -i -ne '
    BEGIN { $u = 0; $z = 0; $new = $ENV{NEW}; $ure = qr/$ENV{URL_RE}/; $zre = qr/$ENV{ZOOM_RE}/; }
    my $orig = $_;
    $u += s/$ure/$new/g;
    $z += (my $c = s/$zre/Microsoft Teams/g);
    if ($c) { (my $o = $orig) =~ s/^\s+|\s+$//g; (my $n = $_) =~ s/^\s+|\s+$//g;
              print STDERR "COPY $ARGV:$.: \"" . substr($o,0,160) . "\" -> \"" . substr($n,0,160) . "\"\n"; }
    print;
    END { print STDERR "COUNT $u $z\n"; }
  ' "$f" 2>&1)
  u=$(printf '%s\n' "$out" | awk '/^COUNT/{print $2}'); z=$(printf '%s\n' "$out" | awk '/^COUNT/{print $3}')
  printf '%s\n' "$out" | grep '^COPY' || true
  [ "${u:-0}" -gt 0 ] && echo "URL  $f: $u"
  url_n=$((url_n + ${u:-0})); zoom_n=$((zoom_n + ${z:-0}))
done

echo "---"
echo "booking URL -> $NEW : $url_n replacement(s)"
echo "Zoom copy -> Microsoft Teams : $zoom_n replacement(s)"
left=$(git ls-files -z | xargs -0 grep -In 'CelesteOSPilot@celeste7\.ai/' 2>/dev/null | grep -v '^scripts/set-booking-url\.sh' || true)
[ -n "$left" ] && { echo "WARNING old booking URL still present:"; echo "$left"; }
echo "Note: bare mailbox mentions (CelesteOSPilot@celeste7.ai as an email, e.g. llms.txt, index.html JSON-LD) are NOT changed."
