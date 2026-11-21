# 🧠 Morpheus

**One brain for all your projects.** Morpheus is a Claude Code plugin plus an installer. It gives every
project on your machine the same orchestrator, a 14-member specialist crew, built-in security guardrails, a lean plugin core with
switchable packs, and one shared memory that grows with each project you build.

## Install (once per machine)
```bash
git clone https://github.com/<you>/morpheus ~/.morpheus-src
cd ~/.morpheus-src && ./install.sh          # Windows: .\install.ps1
```
Options: `MORPHEUS_PACKS="build,design"` turns packs on everywhere · `MORPHEUS_PROJECTS="$HOME/code $HOME/work"`
sets readable code folders · `TWENTYFIRST_API_KEY=…` adds the 21st.dev Magic MCP.
Requires Claude Code, Node 18+ and git. Recommended: `uv` (Spec Kit), `python3`, `gh`, `rg`.

## Use it anywhere
```bash
cd any/project && morpheus      # Claude Code running as Morpheus
```
Or say **"Morpheus, …"** in any Claude Code session.

| Command | What it does |
|---|---|
| `/morpheus:init [desc]` | Bootstrap: registry, Spec Kit, CLAUDE.md with artifact map, suggested packs |
| `/morpheus:pack [add\|remove] <packs>` | Switch plugin packs for this project (with token costs) |
| `/morpheus:projects [q]` | List/search every known project |
| `/morpheus:recall <question>` | Answer from the brain plus code across all projects, with sources |
| `/morpheus:remember <fact>` | Save a preference / decision / lesson / pattern |
| `/morpheus:reflect` | Distill the session into the brain, then sync |
| `/morpheus:secure [audit\|harden]` | Threat model, OWASP audit, secret/dependency/SAST scans, security CI |
| `/morpheus:doctor` | Health check: tools, packs, brain, registry, security posture |
| `/morpheus:sync` | Commit and push the brain to its private git remote |

## How it's designed

### 1. Modes sized to the task
Morpheus picks a mode and says so: **Quick** (just do it) · **Fix** (systematic debugging, failing test first) ·
**Feature** (brainstorm → plan → crew builds → review) · **Product** (Frame → Spec → Experience →
Architecture → Plan → Build → Prove → Ship, with a gate at each phase) · **Explore** (sourced recommendation).

### 2. The crew: 14 specialists, one protocol
strategist · delivery-lead · ux-researcher · design-director · copywriter · architect · frontend-engineer ·
backend-engineer · ai-engineer · qa-engineer · reviewer · security-engineer · devops-engineer · researcher

Every crew member reads the same inputs (project CLAUDE.md, brain brief, artifact map), writes to the same
artifact locations, and returns the same report: *Result · Changes · Verification · Decisions · Open
questions · Memory candidates*. That lets Morpheus run them in parallel and merge the results cleanly.

### 3. One owner per job, lean by default
Plugins are grouped into packs (`plugin/dependencies.txt`). Only **core** is on everywhere (~3k tokens of
context, down from ~32k when everything was on). The others are installed but off; switch them on per project:

| Pack | Contents | ~Tokens |
|---|---|---|
| **core** | superpowers, ui-ux-pro-max, frontend-design, c4-architecture, before-you-build, accessibility, code-review, commit-commands, security-guidance, context7, playwright, github, typescript-lsp | 3.1k |
| build | full-stack-orchestration, agent-teams, feature-dev, ralph-loop, tdd-workflows, pr-review-toolkit, chrome-devtools, mattpocock-skills | 7.2k |
| design | ui-design, ui-theme-designer, superdesign, modern-web-guidance, figma | 5.3k |
| backend | backend-development, database-design, api-scaffolding, supabase, deployment-validation | 3.2k |
| security | claude-security, semgrep, security-scanning, backend-api-security, frontend-mobile-security | 2.5k |
| pm | conductor, linear, notion | 0.8k |
| ops | vercel, sentry | 5.3k |
| meta | claude-md-management, hookify, skill-creator, plugin-dev, mcp-server-dev, document & example skills | 5.7k |

Morpheus suggests packs from the detected stack (e.g. Next.js → design, Supabase → backend).

### 4. Memory: markdown is the single source of truth
```
~/.morpheus/
├── profile.md          preferences & default stack
├── lessons.md          dated cross-project lessons
├── projects.json       registry (path, remote, stack, last seen)
├── projects/<slug>.md  brief: Purpose · Stack · Key decisions · Status · Gotchas
└── patterns/           reusable solutions, with their source project
```
- **One writer:** all writes go through `brain.mjs` (dated, consistent format, **refuses secrets**). Crew members
  only *propose* memories; Morpheus decides what to keep.
- **Auto-load:** the SessionStart hook registers the project, detects its stack, and injects a compact brief.
- **Auto-capture:** after a heavy session (5+ file edits) with no memory update, a Stop hook asks Morpheus
  once to record decisions, status and lessons. Turn it off with `MORPHEUS_AUTOCAPTURE=0`.
- **Auto-save:** the SessionEnd hook commits the brain if it's a git repo. `/morpheus:sync` pushes it, so the same
  brain works on every machine (use a **private** repo).
- **Cross-project search:** `brain.mjs search "<q>" --code` covers the brain plus code in every registered project.

### 5. Security (see [SECURITY.md](SECURITY.md) for the full threat model)
- **Guard hook** checks every tool call: it blocks reading credential files (`.env`, `~/.ssh`, `~/.aws`, keys)
  through Read *and* Bash, denies catastrophic deletes, and asks before force pushes, hard resets, `curl | sh`, sudo
  and env dumps. Decisions are logged to `~/.morpheus/.state/guard.log`.
- **Supply chain**: community plugin sources are pinned to audited commits. `tools/review-update.sh` shows hook,
  MCP, network and exec changes before you bump a pin. MCP packages are version-pinned.
- **Memory safety**: the brain refuses secrets on write, scans before every sync, never pushes to a public repo,
  and is private to your user (700/600).
- **Prompt-injection hygiene**: memory and other projects' files reach Claude marked as untrusted data. Other
  projects are read-only, and cross-project access is opt-in.
- **Secure apps by default**: threat model at the Architecture gate, security audit at the Prove gate,
  `/morpheus:secure` installs gitleaks + OSV + CodeQL CI and Dependabot, and an opt-in security pack.

### 6. Quality gates
Nothing is "done" without shown typecheck, lint and test output; Playwright screenshots at 375 and 1280px for UI;
secrets, authZ and RLS checks; and a reviewer verdict.

## Brain CLI
```
node plugin/scripts/brain.mjs <command>
  projects [q] · show <q> · search <q> [--code]
  note <purpose|stack|decisions|status|gotchas> "<text>" · lesson "<text>" · pref "<text>" · pattern <name> < file.md
  pack [list|add|remove|suggest] · register · prune · sync · doctor
```

## Layout
```
.claude-plugin/marketplace.json     this repo is a plugin marketplace
plugin/
  skills/morpheus/SKILL.md          operating system: modes, crew dispatch, tool map, gates, memory API
  agents/                           morpheus + 14 crew members (shared protocol)
  commands/                         init, pack, projects, recall, remember, reflect, secure, doctor, sync
  hooks/hooks.json                  PreToolUse (guard) · SessionStart (load) · Stop (capture) · SessionEnd (autosave)
  scripts/brain.mjs                 zero-dependency brain engine
  dependencies.txt                  marketplaces + packs (edit this to grow Morpheus)
  .mcp.json                         sequential-thinking, shadcn
  templates/                        CLAUDE.md, .gitignore, security/ (CI workflow, Dependabot, checklist)
tools/review-update.sh              review community plugin changes before bumping pins
SECURITY.md                         threat model, audit notes, controls
install.sh / install.ps1            one-command setup (user scope)
```

## Update
```bash
cd ~/.morpheus-src && git pull && ./install.sh
```
