#!/usr/bin/env bash
# Refresh the bundled wshobson/agents plugins (vendor/wshobson) to a newer upstream commit, after review.
# Usage: tools/vendor-sync.sh [commit|HEAD]     Shows risky changes per plugin, asks before copying.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REF="${1:-HEAD}"; WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
git clone -q --filter=blob:none https://github.com/wshobson/agents "$WORK/up"
NEW="$(git -C "$WORK/up" rev-parse "$REF")"
echo "Upstream wshobson/agents @ ${NEW:0:7}"
for d in "$DIR"/vendor/wshobson/*/; do
  p="$(basename "$d")"; up="$WORK/up/plugins/$p"
  [ -d "$up" ] || { echo "!! $p no longer exists upstream"; continue; }
  if diff -rq -x .codex-plugin "$d" "$up" >/dev/null; then continue; fi
  echo "══ $p changed:"
  diff -ru -x .codex-plugin "$d" "$up" | grep -E '^[+-]{3}|^\+' | grep -nE '^\+\+\+|curl |wget |fetch\(|https?://|child_process|subprocess|os\.system|eval\(|exec\(|base64|process\.env|"command"|"mcpServers"|"hooks"' | head -25 | sed 's/^/   /'
  read -r -p "   Copy $p @ ${NEW:0:7}? [y/N] " ok </dev/tty
  [[ "$ok" =~ ^[Yy] ]] && rm -rf "$d" && cp -r "$up" "$d" && rm -rf "$d/.codex-plugin" && echo "   ✓ updated"
done
echo "Then: update the @commit note in .claude-plugin/marketplace.json, bump the morpheus version, commit, push."
