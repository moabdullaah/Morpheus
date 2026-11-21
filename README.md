# 🧠 Morpheus

**One brain for all your projects.** Morpheus is a Claude Code plugin plus an installer. It gives every
project on your machine the same orchestrator, the same 50+ plugins and MCP servers, and one shared
memory that grows with each project you build.

## Install (once per machine)
```bash
git clone https://github.com/<you>/morpheus ~/.morpheus-src
cd ~/.morpheus-src && ./install.sh
```
Windows: run `install.ps1` in PowerShell. Optional: `TWENTYFIRST_API_KEY=… ./install.sh` adds the
21st.dev Magic UI MCP. `MORPHEUS_PROJECTS="$HOME/code $HOME/work"` sets which folders Morpheus may read.

Requires Claude Code, Node.js 18+, and git. Recommended: `uv` (for Spec Kit), `python3`, `gh`.

## Use it anywhere
```bash
cd any/project
morpheus                      # Claude Code running as Morpheus
```
Or, inside any Claude Code session, just say **"Morpheus, …"**.

| Command | What it does |
|---|---|
| `/morpheus:init [description]` | Bootstrap this project: Spec Kit, CLAUDE.md, .gitignore, brain entry |
| `/morpheus:projects [query]` | List/search every project Morpheus knows |
| `/morpheus:recall <question>` | "How did we do auth in the shop project?" Answers from all projects |
| `/morpheus:remember <fact>` | Save a preference, decision, lesson or pattern |
| `/morpheus:reflect` | End of session: distill what was learned into the brain |

## How the brain works
```
~/.morpheus/
├── profile.md          your preferences & default stack
├── lessons.md          cross-project lessons (dated, one line each)
├── projects.json       registry: every project Morpheus has seen (path, remote, stack)
├── projects/<slug>.md  per-project brief: purpose, decisions, status, gotchas
├── patterns/           reusable solutions (auth, RLS, deploy pipelines…)
└── memory.jsonl        knowledge graph (morpheus-memory MCP)
```
- **Auto-registration:** each time Claude Code starts in a project, a SessionStart hook registers the
  project, detects its stack, and loads the project brief, other known projects, your profile and
  recent lessons into context.
- **Cross-project access:** the installer adds `~/.morpheus` and your code folders (`~/code`,
  `~/projects`, …) to Claude's readable directories. Morpheus can then open any registered project
  by absolute path to reuse its code and decisions.
- **Sync between machines:** `cd ~/.morpheus && git init && git remote add origin <private repo>`.
  Keep this repo private. It's your memory.

## What Morpheus orchestrates
- **Process:** Superpowers (brainstorm → plan → subagent build → verify), feature-dev, ralph-loop
- **Spec & PM:** GitHub Spec Kit, conductor, Task Master MCP, Linear and Notion MCPs, PM/scrum agents
- **UI/UX & design:** ui-ux-pro-max, frontend-design, ui-design, ui-theme-designer, superdesign,
  accessibility-compliance, shadcn MCP, Figma MCP
- **Architecture:** c4-architecture, backend-development, database-design, api-scaffolding,
  sequential-thinking MCP, architect/API/Postgres/LLM agents
- **Build & orchestration:** full-stack-orchestration, agent-teams, agent-orchestration
- **Quality & ship:** code-review, pr-review-toolkit, code-simplifier, security-guidance, TDD,
  Playwright and Chrome DevTools MCPs, GitHub, Vercel, Sentry, Supabase, context7 (live docs)
- **33 specialist subagents** bundled as `morpheus:<name>`

The full list is in [`dependencies.txt`](dependencies.txt). Add a line and re-run `./install.sh` to grow it.

## Update
```bash
cd ~/.morpheus-src && git pull && ./install.sh
claude plugin marketplace update
```

## Layout
```
.claude-plugin/marketplace.json   this repo is a plugin marketplace
plugin/                           the morpheus plugin
  skills/morpheus/SKILL.md        the brain's operating system (routing, memory rules)
  agents/                         morpheus orchestrator + 33 specialists
  commands/                       init, projects, recall, remember, reflect
  hooks/hooks.json                SessionStart → scripts/brain.mjs
  scripts/brain.mjs               registry / context CLI (no dependencies)
  .mcp.json                       memory, sequential-thinking, shadcn, task-master
  templates/                      CLAUDE.md + .gitignore for new projects
dependencies.txt                  every plugin & marketplace Morpheus depends on
install.sh / install.ps1          one-command setup (user scope)
```
