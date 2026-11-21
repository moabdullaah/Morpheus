# Authentication & sessions

- [ ] Use a proven provider or library (Supabase Auth, Auth.js, Clerk, Lucia-style patterns). No home-made password hashing (if needed: argon2id or bcrypt cost ≥ 12).
- [ ] Session cookies: `HttpOnly; Secure; SameSite=Lax` (or `Strict`); scoped `Path`; reasonable expiry; rotation on login and privilege change (prevents session fixation).
- [ ] JWT: verify signature **and** `exp`/`aud`/`iss`; reject `alg: none`; never decode-without-verify for authorization; keep access tokens short-lived.
- [ ] Logout invalidates server-side sessions and refresh tokens.
- [ ] Password reset / magic links: single-use, short expiry, high-entropy tokens, stored hashed. The response must not reveal whether an email exists (generic message, same timing).
- [ ] Login, signup, reset and MFA endpoints are **rate limited** per IP and per account, with lockout or backoff.
- [ ] OAuth: `state` and PKCE validated; redirect URIs exact-match; don't link accounts by unverified email.
- [ ] Email change requires re-auth and confirmation on both addresses; sensitive actions (delete account, change password, add payout) require recent auth.
- [ ] Roles: stored server-side (DB or `app_metadata`), checked server-side; the UI hiding a button is not authorization.
- [ ] Admin panels: separate role check on every admin route and action; audit-log admin actions.
- [ ] MFA available for privileged users; recovery codes hashed.
