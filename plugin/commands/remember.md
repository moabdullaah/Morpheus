---
description: Save a fact, decision, preference, lesson or pattern into Morpheus's brain
argument-hint: "<what to remember>"
allowed-tools: Bash(node:*), Bash(cat:*), Write
---
Classify "$ARGUMENTS" and store it with exactly one brain CLI call:
- user preference → `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" pref "…"`
- this project's decision / status / gotcha / purpose → `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" note <decisions|status|gotchas|purpose> "…"`
- useful in other projects → `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" lesson "…"`
- a reusable multi-line solution → write it to a temp .md file, then `cat it | node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" pattern <name>`
Rewrite it as one crisp, durable sentence first. The CLI refuses secrets; if it refuses, tell the user why. Confirm in one line.
