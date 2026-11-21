---
description: List or search every project Morpheus knows
argument-hint: "[search]"
allowed-tools: Bash(node:*), Read
---
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" projects $ARGUMENTS` and present the result as a compact table.
If exactly one project matches, also run `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" show $ARGUMENTS` and summarize its purpose, stack, status and key decisions in four lines.
