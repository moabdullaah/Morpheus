#!/usr/bin/env bash
# Review what changed in each PINNED community marketplace before bumping its pin.
# Usage: tools/review-update.sh            → report only
#        tools/review-update.sh --apply    → after review, rewrite pins in plugin/dependencies.txt to the new HEAD
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPS="$DIR/plugin/dependencies.txt"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
apply=false; [ "${1:-}" = "--apply" ] && apply=true

grep '^@marketplace ' "$DEPS" | while IFS='|' read -r head repo ref; do
  [ -z "${ref:-}" ] && continue
  name="${head#@marketplace }"
  new="$(git ls-remote "https://github.com/$repo" HEAD | cut -f1)"
  echo "══ $name ($repo)"
  if [ "$new" = "$ref" ]; then echo "   up to date at ${ref:0:7}"; continue; fi
  git clone -q --filter=blob:none "https://github.com/$repo" "$WORK/$name"
  cd "$WORK/$name"
  # Only review the plugins Morpheus actually installs from this marketplace (plus the catalog).
  scope=(".claude-plugin/marketplace.json")
  for pl in $(grep -E "^[a-z]+ [^ ]+@$name\b" "$DEPS" | awk '{print $2}' | cut -d@ -f1); do
    [ -d "plugins/$pl" ] && scope+=("plugins/$pl")
  done
  [ ${#scope[@]} -eq 1 ] && scope=(".")
  echo "   ${ref:0:7} → ${new:0:7}  ($(git rev-list --count "$ref..$new") commits; reviewing ${#scope[@]} path(s))"
  echo "   ── files that can execute code or reach the network:"
  git diff --stat "$ref" "$new" -- "${scope[@]}" | grep -E 'hooks|\.mcp\.json|plugin\.json|\.(sh|py|js|mjs|ts)\b|package\.json' | tail -25 | sed 's/^/      /'
  echo "   ── suspicious additions (network / exec / env / encoded payloads):"
  git diff "$ref" "$new" -- "${scope[@]}" ':!*.md' ':!*.csv' ':!*.lock' ':!*lock.json' ':!*lock.yaml' | grep -E '^\+' | grep -nE 'curl |wget |fetch\(|https?://|child_process|subprocess|os\.system|eval\(|exec\(|base64|process\.env|os\.environ|\.ssh|\.aws|ANTHROPIC_API_KEY|GITHUB_TOKEN' | head -30 | sed 's/^/      /' || echo "      none"
  echo "   ── new hook / MCP declarations:"
  git diff "$ref" "$new" -- "${scope[@]}" | grep -A0 -E '^\+\+\+ .*(hooks\.json|\.mcp\.json|plugin\.json)' >/dev/null; git diff "$ref" "$new" -- "${scope[@]}" | grep -E '^\+.*("command"|"url"|"mcpServers"|"hooks")' | sed 's/^/      /' || echo "      none"
  cd "$DIR"
  if $apply; then
    read -r -p "   Pin $name to ${new:0:7}? [y/N] " ok </dev/tty
    [[ "$ok" =~ ^[Yy] ]] && sed -i.bak "s#^@marketplace $name|$repo|$ref#@marketplace $name|$repo|$new#" "$DEPS" && rm -f "$DEPS.bak" && echo "   ✓ pinned" 
  fi
done
$apply && echo "Re-run ./install.sh to apply new pins." || echo "Review above, then: tools/review-update.sh --apply"
