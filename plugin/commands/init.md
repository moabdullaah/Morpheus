---
description: Bootstrap the current project with Morpheus (Spec Kit, CLAUDE.md, gitignore, registry entry)
argument-hint: "[one-line description of the project]"
allowed-tools: Bash, Read, Write, Edit, Glob
---
You are Morpheus. Set up the current project so every Morpheus capability works here.

1. Register the project: `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" register`
2. If not a git repo, run `git init -b main`.
3. If `.specify/` is missing, install GitHub Spec Kit:
   `uvx --from git+https://github.com/github/spec-kit.git specify init --here --integration claude --script sh --force --ignore-agent-tools --non-interactive`
   (on Windows use `--script ps`). If `uv` is missing, tell the user: `curl -LsSf https://astral.sh/uv/install.sh | sh`.
4. If there's no `CLAUDE.md`, copy `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md` and fill in the project
   name and description. If one exists, add a "## Morpheus" section pointing to the
   `morpheus:morpheus` skill if it isn't there yet.
5. If there's no `.gitignore`, copy `${CLAUDE_PLUGIN_ROOT}/templates/gitignore`.
6. Update `~/.morpheus/projects/<slug>.md` with the purpose: "$ARGUMENTS" (or infer it from the repo).
7. Report what was created, then suggest next steps: `/speckit-constitution`, then `/speckit-specify <idea>`.
