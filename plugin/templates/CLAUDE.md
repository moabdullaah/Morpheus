# {{PROJECT_NAME}}

{{DESCRIPTION}}

## Morpheus
This project is orchestrated by **Morpheus** (global brain plugin): follow the `morpheus:morpheus` skill for
planning, design, architecture, building and shipping. Project memory: `~/.morpheus/projects/{{SLUG}}.md`.
Run `/morpheus:reflect` after meaningful sessions.

## Stack
{{STACK}}

## Artifacts
| What | Where |
|---|---|
| Product (PRD, personas, voice) | `docs/product/` |
| Specs | `specs/NNN-feature/` · `docs/superpowers/specs/` |
| Design system | `design-system/MASTER.md` |
| Architecture / ADRs | `docs/architecture/` · `docs/adr/` |
| Plans | `docs/superpowers/plans/` |
| Ops / runbooks | `docs/ops/` |

## Conventions
- Library facts come from context7, not memory.
- Done = typecheck, lint and tests pass (output shown), plus Playwright screenshots at 375/1280 for UI.
- UI: tokens only, responsive, keyboard accessible, WCAG AA, dark mode.
- Feature branches, small commits, no direct pushes to `main`. Never read or commit `.env*`.
