#!/usr/bin/env bash
# One gate to run before any release of Ephemeris.
# Checks the things that are easy to break and expensive to notice late.
set -u
cd "$(dirname "$0")/.."
APP=ephemeris.html
fails=0
say() { printf '%-46s %s\n' "$1" "$2"; }
bad() { fails=$((fails+1)); }

# 1. the script parses at all
python3 - "$APP" > /tmp/eph-script.js <<'PY'
import re, sys
s = open(sys.argv[1]).read()
sys.stdout.write(re.search(r'<script>(.*)</script>', s, re.S).group(1))
PY
if node --check /tmp/eph-script.js 2>/dev/null; then say "script parses" "ok"; else say "script parses" "FAIL"; bad; fi

# 2. the version marker and the constant agree
marker=$(grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+ -->' "$APP" | head -1 | sed 's/ -->//;s/^v//')
const=$(grep -o 'const VER = "[0-9.]*"' "$APP" | head -1 | sed 's/.*"\(.*\)"/\1/')
if [ "$marker" = "$const" ] && [ -n "$marker" ]; then say "version marker matches VER ($const)" "ok"; else say "version marker vs VER" "FAIL ($marker vs $const)"; bad; fi

# 3. it must not be able to reach the network
if grep -qE '\b(fetch|XMLHttpRequest|WebSocket|EventSource|importScripts)\s*\(' "$APP"; then say "no network primitives" "FAIL"; bad; else say "no network primitives" "ok"; fi
if grep -q "connect-src 'none'" "$APP"; then say "content policy forbids connections" "ok"; else say "content policy forbids connections" "FAIL"; bad; fi

# 4. no remote assets of any kind
if grep -qE '(src|href)="https?://' "$APP"; then say "no remote assets" "FAIL"; bad; else say "no remote assets" "ok"; fi

# 5. house style
if grep -q '[—–]' "$APP" README.md; then say "no em or en dashes" "FAIL"; bad; else say "no em or en dashes" "ok"; fi

# 6. the palette stays readable
if node dev/check-contrast.mjs > /tmp/eph-contrast.out 2>&1; then
  say "palette clears WCAG AA" "ok"
else
  say "palette clears WCAG AA" "FAIL (see /tmp/eph-contrast.out)"; bad
fi

# 7. single file, no build step
if [ "$(ls -1 *.html | wc -l)" -eq 1 ]; then say "one html file ships" "ok"; else say "one html file ships" "FAIL"; bad; fi

# 8. the tests
if (cd test && npm run --silent test > /tmp/eph-test.out 2>&1); then
  say "harness" "$(tail -1 /tmp/eph-test.out)"
  say "in app self test" "$(grep 'self test:' /tmp/eph-test.out | tail -1 | sed 's/ *self test: //')"
else
  say "harness" "FAIL (see /tmp/eph-test.out)"; bad
fi

echo
if [ "$fails" -eq 0 ]; then echo "clean. safe to tag."; else echo "$fails checks failed. not releasable."; exit 1; fi
