# Headers, CSP, CORS, cookies, CSRF

Baseline response headers:
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://<api hosts>; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin
```
- [ ] CSP via nonces in middleware for Next.js; avoid `'unsafe-eval'`; start with `Content-Security-Policy-Report-Only` to tune.
- [ ] CORS: explicit origin allowlist; never reflect arbitrary `Origin` with `Access-Control-Allow-Credentials: true`; no `*` on authenticated APIs.
- [ ] Cookies: `HttpOnly; Secure; SameSite=Lax|Strict`; `__Host-` prefix for session cookies where possible.
- [ ] CSRF: SameSite cookies plus Origin/Referer checks on state-changing requests (custom route handlers); tokens for legacy form posts.
- [ ] Clickjacking: `frame-ancestors 'none'` (or a specific allowlist).
- [ ] Verify with `curl -sI http://localhost:3000` and securityheaders-style checks.
