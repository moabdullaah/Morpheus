# Threat model: {{PROJECT}}

_Last updated: YYYY-MM-DD by Sentinel_

## Assets
What attackers want: user data (PII), credentials and sessions, payments and entitlements, admin capabilities, API keys and AI budget, availability.

## Actors
Anonymous visitor · authenticated user · user of another tenant · admin · third-party service (webhooks) · malicious content (prompt injection, uploaded files).

## System & trust boundaries
```mermaid
flowchart LR
  U[Browser] -->|HTTPS| N[Next.js app / server actions]
  N -->|service key, server only| DB[(Postgres + RLS)]
  N --> S[Stripe]
  S -->|signed webhook| N
  N --> L[LLM API]
```

## Threats (STRIDE)
| Boundary | Threat | S/T/R/I/D/E | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|---|---|

## Residual risks & assumptions
