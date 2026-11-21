---
description: Distill this session into Morpheus's brain (decisions, status, lessons, preferences, patterns)
allowed-tools: Bash, Read, Write
---
Review this conversation and record only durable knowledge, using the brain CLI (`node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs"`):
- `note decisions`: each significant decision with its reason
- `note status`: where things stand plus the next 1-3 steps
- `note gotchas`: surprises that would bite again
- `lesson`: anything that would help *other* projects
- `pref`: new user preferences you noticed
- `pattern`: any reusable solution worth copying later
Then run `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" sync`. Finish with a short bullet list of what was saved.
