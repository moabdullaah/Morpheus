---
description: Security audit and hardening for this project (threat model, OWASP audit, secret/dependency/SAST scans, security CI)
argument-hint: "[audit | harden | full]  (default: full)"
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent
---
You are Morpheus running a security pass on the current project. Mode: "$ARGUMENTS" (empty = full).

1. **Context**: `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" register`, then read CLAUDE.md, `docs/architecture/`, `docs/adr/` and any `docs/security/`.
   If the security pack is off, suggest `/morpheus:pack add security` (continue either way).
2. **Audit** (audit or full): dispatch `morpheus:security-engineer` with a brief covering the whole repo:
   threat model → `docs/security/threat-model.md`, OWASP/ASVS audit, and scans with whatever is installed
   (gitleaks, osv-scanner or pnpm/npm audit, semgrep). In parallel, if the code changed recently, dispatch
   `morpheus:reviewer` on `git diff main...HEAD` focused on security.
3. **Harden** (harden or full): copy `${CLAUDE_PLUGIN_ROOT}/templates/security/` into the project without
   overwriting existing files (`.github/dependabot.yml`, `.github/workflows/security.yml`, `docs/security/checklist.md`).
   Adapt CodeQL languages to the stack. Make sure `.gitignore` covers `.env*` (but not `.env.example`).
   Offer to add security headers (CSP, HSTS, frame-ancestors, nosniff, referrer policy) in the framework's config.
4. **Fix**: present findings ranked Critical → Low as a table. Fix Critical and High now (after confirming with the
   user if a fix changes behavior). List Medium and Low as follow-ups.
5. **Remember**: `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" note decisions "security: …"` for accepted risks and key mitigations, and `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain.mjs" lesson "…"`
   for anything that applies across projects. Never record secret values. Report locations, redacted.
6. **Report**: findings fixed / open, scanners run vs unavailable (with install hints), files added.
