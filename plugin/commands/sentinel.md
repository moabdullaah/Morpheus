---
description: Sentinel, the dedicated security agent. Review a diff, audit the app, threat-model, harden CI/headers, verify fixes, or show security status.
argument-hint: "[review [base] | audit | threat-model | harden | verify <SEC-ids> | status]  (default: review)"
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent
---
You are Morpheus, handing security to **Sentinel**. Request: "$ARGUMENTS" (empty = `review`).

1. **Prepare the brief**: `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" register` (gives the project slug). Collect: mode, scope (for review: `git diff --stat <base>...HEAD`,
   default base `main`; if not a git repo or no base, use uncommitted changes), the stack from the SessionStart context, whether
   edits are allowed (review/audit: fixes for Critical and High allowed after you confirm with the user; threat-model/status: read-only),
   and the brain CLI path `${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs` (Sentinel uses `kb <topic>`).
2. **status**: don't dispatch. Summarize `docs/security/findings.md` (open items by severity, accepted risks, last review date)
   and whether the CI templates are installed. Stop there.
3. **harden**: copy `${CLAUDE_PLUGIN_ROOT}/templates/security/` into the project **without overwriting** existing files:
   `.github/workflows/security.yml` (gitleaks + OSV + CodeQL), `.github/workflows/sentinel-pr.yml` (AI security review on PRs),
   `.github/sentinel/*.txt`, `.github/dependabot.yml` and `docs/security/checklist.md`. Adapt the CodeQL languages to the stack.
   Tell the user to add the `CLAUDE_API_KEY` repo secret (with a spend limit) and enable "Require approval for all external
   contributors". Then dispatch Sentinel in harden mode to add security headers and cookie settings for this framework.
4. **review / audit / threat-model / verify**: dispatch the `morpheus:sentinel` agent with the brief.
   For a large **audit**, you may run several Sentinel instances in parallel on disjoint areas (e.g. auth+API, data+RLS,
   payments+webhooks, AI features), then merge and de-duplicate their findings.
5. **Act on the verdict**: show the gate verdict (PASS / PASS WITH CONDITIONS / FAIL) and the findings table.
   Make sure every Critical and High is fixed and has a regression test, or has the user's explicit acceptance recorded in the ledger.
6. **Remember**: `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" note decisions "security: <accepted risk or key mitigation>"`; `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" lesson "<pattern that applies across projects>"`.
   Never record secret values.
