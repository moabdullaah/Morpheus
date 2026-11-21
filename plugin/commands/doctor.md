---
description: Health check for Morpheus (tools, packs, brain, registry)
allowed-tools: Bash
---
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" doctor` and show the output. For each ✗, give the exact fix command. If the registry has missing paths, offer `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" prune`.
