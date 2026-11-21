# {{PROJECT_NAME}}

{{DESCRIPTION}}

## Morpheus
This project is orchestrated by **Morpheus** (global brain plugin). For planning, design,
architecture, building and shipping, follow the `morpheus:morpheus` skill. Project memory lives in
`~/.morpheus/projects/{{SLUG}}.md`. Run `/morpheus:reflect` at the end of meaningful sessions.

## Stack
<!-- fill in: framework, data, auth, testing, deploy -->

## Conventions
- Look up library docs with context7 before writing framework code.
- Verify before claiming done: typecheck, lint, tests, and a Playwright check for UI.
- UI: responsive, keyboard accessible, WCAG AA, dark mode, design tokens only.
- Specs in `specs/`, architecture in `docs/architecture/`, ADRs in `docs/adr/`.
- Feature branches, small commits, never push to main directly. Never read or commit `.env*`.
