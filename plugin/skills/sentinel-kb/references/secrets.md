# Secrets

- [ ] Nothing secret in code, tests, fixtures, docs, commits or git history. Run `gitleaks detect --redact` (covers history).
- [ ] Client bundle check: build, then grep `.next/static` (or `dist`) for key prefixes (`sk_`, `sk-`, `service_role`, `AKIA`, `ghp_`). `NEXT_PUBLIC_*` / `VITE_*` / `EXPO_PUBLIC_*` must be public-safe.
- [ ] `.env*` git-ignored except `.env.example` (names only). Production secrets in the platform's secret store.
- [ ] Logs, Sentry and analytics: scrub `authorization`, cookies, tokens, passwords and PII (Sentry `beforeSend`, `sendDefaultPii: false`).
- [ ] Least privilege: restricted API keys, scoped tokens, separate keys per environment.
- [ ] **A leaked secret must be rotated.** Removing it from the code is not enough; also revoke it, check provider logs, then purge history if needed.
