#!/usr/bin/env bash
# Morpheus installer: makes Morpheus available in every project on this machine (user scope).
# Usage:  ./install.sh                     (from a clone of this repo)
#         MORPHEUS_SOURCE=owner/morpheus ./install.sh   (register the GitHub repo as the marketplace)
#         MORPHEUS_PROJECTS="$HOME/code $HOME/work" ./install.sh   (folders Morpheus may read)
#         MORPHEUS_PACKS="build,design" ./install.sh   (packs to switch on globally, besides core)
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE="${MORPHEUS_SOURCE:-}"
if [ -z "$SOURCE" ]; then
  remote="$(git -C "$DIR" config --get remote.origin.url 2>/dev/null || true)"
  if [[ "$remote" =~ github\.com[:/]([^/]+/[^/.]+)(\.git)?$ ]]; then SOURCE="${BASH_REMATCH[1]}"; else SOURCE="$DIR"; fi
fi

say()  { printf '\033[1;32m▸\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m✗\033[0m %s\n' "$*"; exit 1; }

# 1. Prerequisites
command -v claude >/dev/null || fail "Claude Code not found. Install: curl -fsSL https://claude.ai/install.sh | bash"
command -v node   >/dev/null || fail "Node.js 18+ is required (MCP servers and the brain CLI use it): https://nodejs.org"
command -v npx    >/dev/null || fail "npx is required (comes with Node.js)."
command -v git    >/dev/null || fail "git is required."
node -e 'process.exit(+process.versions.node.split(".")[0] >= 18 ? 0 : 1)' || fail "Node.js 18+ required (found $(node -v))."
command -v uv      >/dev/null || warn "uv not found: needed for Spec Kit (/morpheus:init). Install: curl -LsSf https://astral.sh/uv/install.sh | sh"
command -v python3 >/dev/null || warn "python3 not found: ui-ux-pro-max's search script needs it."
command -v gh      >/dev/null || warn "gh (GitHub CLI) not found: optional, but recommended."

# 2. Marketplaces + plugins (user scope). Every pack is installed; only core (+ MORPHEUS_PACKS) is ON globally.
#    Other packs are switched on per project with /morpheus:pack add <pack>.
DEPS="$DIR/plugin/dependencies.txt"
GLOBAL_PACKS=" core $(printf "%s" "${MORPHEUS_PACKS:-}" | tr , " ") "
say "Adding marketplaces…"
grep '^@marketplace ' "$DEPS" | while read -r _ spec; do
  IFS='|' read -r _name repo ref <<< "$spec"
  src="$repo${ref:+#$ref}"   # community marketplaces are pinned to an audited commit
  if out="$(claude plugin marketplace add "$src" --scope user 2>&1)"; then echo "   ✓ $repo${ref:+ (pinned ${ref:0:7})}"
  elif grep -qi already <<< "$out"; then echo "   • $repo (already added)"; else warn "marketplace $repo: $(tail -1 <<< "$out")"; fi
done
claude plugin marketplace add "$SOURCE" --scope user >/dev/null 2>&1 && echo "   ✓ morpheus ($SOURCE)" || echo "   • morpheus (already added)"
claude plugin marketplace update >/dev/null 2>&1 || true

say "Installing plugins (global packs:${GLOBAL_PACKS})…"
on=0; off=0; bad=()
while read -r pack plugin _; do
  [[ -z "${pack:-}" || "$pack" == \#* || "$pack" == @* || -z "${plugin:-}" ]] && continue
  if ! out="$(claude plugin install "$plugin" --scope user -y 2>&1)"; then bad+=("$plugin"); warn "$plugin: $(tail -1 <<< "$out")"; continue; fi
  if [[ "$GLOBAL_PACKS" == *" $pack "* ]]; then
    claude plugin enable "$plugin" --scope user >/dev/null 2>&1; on=$((on+1))
  else
    claude plugin disable "$plugin" --scope user >/dev/null 2>&1; off=$((off+1))
  fi
done < "$DEPS"
claude plugin install morpheus@morpheus --scope user -y >/dev/null 2>&1 && claude plugin enable morpheus@morpheus --scope user >/dev/null 2>&1 || bad+=("morpheus@morpheus")
echo "   ✓ $on plugins on everywhere, $off installed per-project (off by default)"
[ ${#bad[@]} -gt 0 ] && warn "Failed: ${bad[*]} (retry: claude plugin install <name> --scope user)"

# 3. Optional MCP that needs a key
if [ -n "${TWENTYFIRST_API_KEY:-}" ]; then
  claude mcp add magic-ui --scope user -e "API_KEY=$TWENTYFIRST_API_KEY" -- npx -y @21st-dev/magic@latest >/dev/null 2>&1 && say "21st.dev Magic MCP added"
fi

# 4. Brain + user settings + global CLAUDE.md + shell command
say "Creating the brain at ~/.morpheus…"
node "$DIR/plugin/scripts/brain.mjs" path >/dev/null

# Cross-project read access is opt-in: only folders you name (or confirm) are added.
PROJECT_DIRS="${MORPHEUS_PROJECTS:-}"
if [ -z "$PROJECT_DIRS" ] && [ -t 0 ]; then
  found=""
  for d in "$HOME/projects" "$HOME/Projects" "$HOME/code" "$HOME/Code" "$HOME/dev" "$HOME/src" "$HOME/Developer" "$HOME/repos" "$HOME/workspace"; do
    [ -d "$d" ] && found="$found $d"
  done
  if [ -n "$found" ]; then
    printf '\n  Let Morpheus read your other projects in:%s ? [y/N] ' "$found"
    read -r ans; [[ "$ans" =~ ^[Yy] ]] && PROJECT_DIRS="$found"
  fi
fi

say "Updating ~/.claude/settings.json…"
MORPHEUS_DIRS="$PROJECT_DIRS" node - <<'NODE'
const fs = require("fs"), os = require("os"), path = require("path");
const p = path.join(os.homedir(), ".claude", "settings.json");
fs.mkdirSync(path.dirname(p), { recursive: true });
let s = {}; try { s = JSON.parse(fs.readFileSync(p, "utf8")); } catch {}
if (fs.existsSync(p)) fs.copyFileSync(p, p + ".bak-morpheus");
s.permissions ??= {};
const brain = path.join(os.homedir(), ".morpheus");
const dirs = [brain, ...(process.env.MORPHEUS_DIRS || "").split(/\s+/).filter(Boolean)];
s.permissions.additionalDirectories = [...new Set([...(s.permissions.additionalDirectories || []), ...dirs])];
// Read-only by default: brain writes go through brain.mjs (dated, secret-guarded).
const allow = ["Read(~/.morpheus/**)", "mcp__plugin_morpheus_sequential-thinking", "mcp__plugin_morpheus_shadcn"];
s.permissions.allow = [...new Set([...(s.permissions.allow || []), ...allow])];
// Credential files are never readable, in any project (the Morpheus guard hook also covers Bash access).
const deny = ["Read(**/.env)", "Read(**/.env.local)", "Read(**/.env.*.local)", "Read(**/.env.production)", "Read(**/.env.development)", "Read(**/.env.test)",
  "Read(~/.ssh/**)", "Read(~/.aws/**)", "Read(~/.gnupg/**)", "Read(~/.kube/**)", "Read(~/.docker/config.json)", "Read(~/.config/gh/**)",
  "Read(~/.netrc)", "Read(~/.npmrc)", "Read(~/.pypirc)", "Read(~/.pgpass)", "Read(~/.git-credentials)", "Read(**/*.pem)", "Read(**/*.key)", "Read(**/id_rsa*)", "Read(**/id_ed25519*)"];
s.permissions.deny = [...new Set([...(s.permissions.deny || []), ...deny])];
s.env ??= {}; s.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS ??= "1";
s.env.VERCEL_PLUGIN_TELEMETRY ??= "off";   // the Vercel plugin sends usage telemetry unless disabled
fs.writeFileSync(p, JSON.stringify(s, null, 2) + "\n");
console.log("   ✓ readable dirs: " + s.permissions.additionalDirectories.join(", "));
NODE

GLOBAL_MD="$HOME/.claude/CLAUDE.md"
touch "$GLOBAL_MD"
if ! grep -q "BEGIN MORPHEUS" "$GLOBAL_MD"; then
  cat >> "$GLOBAL_MD" <<'MD'

<!-- BEGIN MORPHEUS -->
## Morpheus
Morpheus is my global engineering brain (plugin `morpheus`). Whenever I say "Morpheus", or ask to
plan, design, architect, build or ship something, load the `morpheus:morpheus` skill and act as
Morpheus. Global memory lives in `~/.morpheus/`. Use it to reuse knowledge across projects and
keep it updated.
<!-- END MORPHEUS -->
MD
  say "Added Morpheus section to ~/.claude/CLAUDE.md"
fi

FN='morpheus() { claude --agent morpheus:morpheus --add-dir "$HOME/.morpheus" "$@"; }'
for rc in "$HOME/.zshrc" "$HOME/.bashrc"; do
  [ -f "$rc" ] || [ "$rc" = "$HOME/.bashrc" ] || continue
  grep -q "morpheus()" "$rc" 2>/dev/null || { printf '\n# Morpheus: launch Claude Code as the Morpheus brain\n%s\n' "$FN" >> "$rc"; say "Added 'morpheus' command to $rc"; }
done

cat <<'DONE'

  🧠 Morpheus is installed.

  • In any project:   morpheus            (new shell, or: source ~/.zshrc / ~/.bashrc)
                      or in any Claude session just say "Morpheus, …"
  • Commands:         /morpheus:init  /morpheus:pack  /morpheus:projects  /morpheus:recall
                      /morpheus:remember  /morpheus:reflect  /morpheus:doctor  /morpheus:sync
  • Packs:            core is on everywhere; per project: /morpheus:pack add design backend …
  • One-time logins:  run /mcp inside Claude → GitHub, Figma, Linear, Notion, Supabase, Vercel, Sentry
  • Brain:            ~/.morpheus  → sync across machines: cd ~/.morpheus && git init -b main
                      && git remote add origin <PRIVATE repo>   then /morpheus:sync
DONE
