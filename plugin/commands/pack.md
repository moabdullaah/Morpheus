---
description: Show or switch Morpheus plugin packs for this project (core, build, design, backend, pm, ops, meta)
argument-hint: "[list | add <packs…> | remove <packs…>]"
allowed-tools: Bash(node:*)
---
Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" pack $ARGUMENTS` (no arguments means `list`) and show the output.
When enabling or disabling, remind the user to run `/reload-plugins` or restart Claude Code. If logins are
needed (Figma, Linear, Notion, Supabase, Vercel, Sentry), mention `/mcp`.
