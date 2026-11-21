---
description: List or search every project Morpheus knows, optionally open one
argument-hint: "[search term]"
allowed-tools: Bash, Read, Grep, Glob
---
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" find $ARGUMENTS` and show the results as a short table.
If exactly one project matches, also run `... show $ARGUMENTS` and summarize its purpose, stack, status
and key decisions in a few lines.
