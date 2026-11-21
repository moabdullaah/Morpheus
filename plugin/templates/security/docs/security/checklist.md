# Security checklist

Tick these before each release. Morpheus's security-engineer keeps this file current.

## Secrets
- [ ] No secrets in code, git history, logs, or client bundles (`NEXT_PUBLIC_*` holds only public values)
- [ ] `.env*` ignored; `.env.example` documents every variable without values
- [ ] Production secrets live in the hosting platform's secret store; tokens are least-privilege

## Authentication & authorization
- [ ] Every route, server action, API handler and webhook checks auth **and** ownership (no IDOR)
- [ ] Supabase/Postgres: RLS enabled on every table; policies tested with two users; service-role key server-only
- [ ] Sessions: `HttpOnly; Secure; SameSite=Lax|Strict` cookies; logout invalidates; password reset tokens single-use and expiring
- [ ] Rate limiting on login, signup, password reset, AI and other expensive endpoints

## Input & output
- [ ] All input validated at the boundary (zod); file uploads limited by type and size
- [ ] No raw HTML from users (`dangerouslySetInnerHTML` is sanitized when unavoidable)
- [ ] No user-controlled URLs fetched server-side without an allowlist (SSRF); no open redirects
- [ ] Parameterized queries only

## Transport & headers
- [ ] HTTPS only, HSTS
- [ ] CSP (no `unsafe-inline` scripts where avoidable), `frame-ancestors`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`
- [ ] CORS allowlist (no `*` with credentials); CSRF protection on cookie-authenticated mutations

## Dependencies & CI
- [ ] `security.yml` passing (gitleaks, OSV, CodeQL); Dependabot enabled
- [ ] No critical or high vulnerabilities without a documented exception

## AI features (if any)
- [ ] API keys server-side only; per-user rate and cost limits
- [ ] Untrusted content (web pages, uploads, emails) can't trigger privileged tool calls without confirmation
- [ ] Model output is validated before use; no cross-tenant data in prompts

## Operations
- [ ] Errors are reported (Sentry) without PII or secrets; audit log for sensitive actions
- [ ] Backups enabled and restore tested; incident contact in `SECURITY.md`
