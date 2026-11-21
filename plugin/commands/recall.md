---
description: Ask Morpheus what it knows across all projects
argument-hint: "<question>"
allowed-tools: Bash, Read, Grep, Glob
---
Answer from Morpheus's brain: "$ARGUMENTS"

Search in this order and cite which project or file each fact came from:
1. `morpheus-memory` MCP `search_nodes`
2. `grep -ri` across `~/.morpheus/` (profile, lessons, projects/, patterns/)
3. `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" find <keywords>`, then read the relevant files in
   those projects by absolute path.
If nothing is known, say so plainly.
