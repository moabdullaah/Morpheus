---
description: Save a fact, decision, preference or lesson into Morpheus's global brain
argument-hint: "<what to remember>"
allowed-tools: Bash, Read, Write, Edit
---
Save this to Morpheus's brain: "$ARGUMENTS"

Classify it and write it to the right place (see the morpheus skill, section 4):
- preference about how the user works → `~/.morpheus/profile.md`
- decision/status for this project → `~/.morpheus/projects/<current slug>.md` (dated)
- lesson useful in other projects → append `- YYYY-MM-DD [slug] ...` to `~/.morpheus/lessons.md`
- reusable solution → `~/.morpheus/patterns/<name>.md`
Also add it to the `morpheus-memory` knowledge graph (entity + observation, plus relations).
Refuse to store secrets. Confirm in one line where it went.
