# Security findings ledger

Maintained by Sentinel. One row per finding; details below. Statuses: open · fixed · accepted · false-positive.

| ID | Sev | Confidence | Title | Location | Status | Fix | Regression test |
|---|---|---|---|---|---|---|---|
| SEC-001 | High | Confirmed | Example: invoice IDOR | app/api/invoices/[id]/route.ts:14 | fixed | abc1234 | invoices.security.test.ts |

## SEC-001: Example: invoice IDOR
- **Found:** YYYY-MM-DD (mode: review) · **Fixed:** YYYY-MM-DD
- **Attack:** authenticated user B requests `/api/invoices/<A's id>` and receives A's invoice.
- **Impact:** cross-tenant data exposure.
- **Fix:** scope query by `ownerId = session.user.id`; return 404 otherwise.
- **Accepted risk (if any):** decision by <user>, reason, review date.
