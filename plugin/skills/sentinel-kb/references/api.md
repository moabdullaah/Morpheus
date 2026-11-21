# APIs & authorization

- [ ] **Broken object-level authorization (IDOR)**: every lookup by id is scoped to the caller (owner, tenant, membership). Test by swapping ids between two users.
- [ ] **Function-level authorization**: admin and internal endpoints are unreachable for normal users, including "hidden" routes.
- [ ] **Mass assignment**: explicit allowlists (zod `.pick`/`.strict()`); never bind the whole body to the model.
- [ ] **Excessive data exposure**: response DTOs with explicit fields; pagination limits (`take ≤ 100`); no sequential ids where enumeration hurts (prefer UUID/cuid).
- [ ] **Injection**: parameterized queries / ORM; no string-built SQL (`$queryRawUnsafe`, template-string `sql` without tagging), no `eval`/`new Function`, no shell with user input (`execFile` with arg arrays only).
- [ ] **Rate limiting & quotas** on expensive endpoints (AI, search, exports, email/SMS sending) and per-user cost caps.
- [ ] **GraphQL**: depth and complexity limits, introspection off in prod, field-level authorization.
- [ ] **CSRF**: cookie-authenticated mutations require same-site cookies plus Origin checks or tokens (Next server actions check Origin; custom route handlers must too).
- [ ] **Errors**: consistent shapes, no stack traces or SQL errors to clients; log server-side with a request id.
- [ ] **Idempotency** for create and charge endpoints (idempotency keys) to stop duplicate submissions.
- [ ] **Business logic**: negative quantities, race conditions (double-spend, coupon reuse). Use DB constraints and transactions with row locks.
