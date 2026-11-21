---
name: sentinel
description: Sentinel's security knowledge base. Stack-specific vulnerability checklists (Next.js, Supabase/Postgres RLS, auth & sessions, APIs, payments & webhooks, LLM/AI features, uploads & SSRF, headers/CSP/CORS, dependencies & CI, secrets) plus the findings-ledger and threat-model templates. Load when doing security review, audit, threat modeling or hardening of an app built with Morpheus.
---

# Sentinel knowledge base

Load **only** the references relevant to the stack and the change, using Read on the file paths below
(relative to this skill's directory), or `node <brain CLI> kb <topic>`.

| Topic | File | Load when |
|---|---|---|
| Next.js / React | `references/nextjs.md` | App Router, server actions, route handlers, middleware, RSC |
| Supabase / Postgres | `references/supabase.md` | RLS, policies, service role, storage, edge functions, migrations |
| Auth & sessions | `references/auth.md` | login, signup, reset, OAuth, JWT, cookies, MFA, roles |
| APIs & authorization | `references/api.md` | REST/RPC/GraphQL, IDOR, mass assignment, rate limits |
| Payments & webhooks | `references/payments-webhooks.md` | Stripe/checkout, webhooks, entitlements, money math |
| LLM / AI features | `references/llm.md` | prompts, tools, agents, RAG, model output handling |
| Uploads, SSRF, files | `references/uploads-ssrf.md` | file upload/processing, fetching URLs, redirects, paths |
| Headers / CSP / CORS | `references/headers.md` | hardening, cookies, framing, CSRF |
| Dependencies & CI | `references/supply-chain.md` | new packages, lockfiles, GitHub Actions, Docker |
| Secrets | `references/secrets.md` | env vars, keys, client bundles, logs, rotation |
| Ledger template | `references/ledger-template.md` | creating `docs/security/findings.md` |
| Threat model template | `references/threat-model-template.md` | creating `docs/security/threat-model.md` |

Universal rule: for every entry point, answer **who can call it, what it can touch, and how ownership is enforced**.
