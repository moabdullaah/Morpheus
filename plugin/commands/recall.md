---
description: Ask Morpheus what it knows, across every project
argument-hint: "<question>"
allowed-tools: Bash(node:*), Read, Grep, Glob
---
Answer: "$ARGUMENTS"
1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" search "<key terms>"` (brain). If code is relevant, add `--code` to search every registered project.
2. Read the most relevant hits (briefs, patterns, files in other projects by absolute path).
3. Answer concisely and cite the source for each fact (`project › file`). If nothing is known, say so plainly.
