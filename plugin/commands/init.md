---
description: Bootstrap this project for Morpheus (registry, Spec Kit, CLAUDE.md, gitignore, suggested packs)
argument-hint: "[one-line description]"
allowed-tools: Bash, Read, Write, Edit, Glob
---
You are Morpheus. Set up the current project:

1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" register`. If this isn't a git repo, run `git init -b main`.
2. If `.specify/` is missing, install GitHub Spec Kit:
   `uvx --from git+https://github.com/github/spec-kit.git specify init --here --integration claude --script sh --force --ignore-agent-tools --non-interactive`
   (use `--script ps` on Windows; if `uv` is missing, show its install command and continue).
3. CLAUDE.md: if missing, create it from `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md` (fill in name, slug, description and the detected stack).
   If it exists, add the template's "## Morpheus" and "## Artifacts" sections only if they're absent.
4. If `.gitignore` is missing, copy `${CLAUDE_PLUGIN_ROOT}/templates/gitignore`.
5. Purpose: `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" note purpose "$ARGUMENTS"` (or infer a one-liner from the repo).
6. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" pack suggest`. If it suggests packs, ask whether to enable them, then run `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" pack add <packs>`.
7. Report what was created, then give next steps: Product mode (`/speckit-constitution`), or just describe a feature.
