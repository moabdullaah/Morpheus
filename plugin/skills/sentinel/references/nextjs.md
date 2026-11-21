# Next.js / React (App Router)

## Server actions & route handlers: the #1 bug class
- [ ] Every server action is a **public HTTP endpoint**. Re-check auth *inside* the action, never rely on the page that renders the form being protected.
- [ ] Ownership check on every id from the client (`where: { id, ownerId: session.user.id }`), not just "is logged in".
- [ ] Validate arguments with zod. Server actions receive arbitrary serialized input, not your TypeScript types.
- [ ] No mass assignment: don't spread `formData`/body into DB updates (`role`, `ownerId`, `plan`, `isAdmin` injection).
- [ ] Route handlers (`app/**/route.ts`) check method, auth and ownership; return 404 rather than 403 for other users' resources where enumeration matters.
- [ ] `revalidatePath`/`revalidateTag` and cache: no user-specific data in shared caches (`fetch` cache, `unstable_cache`, ISR pages). Per-user data must use `cache: 'no-store'` or be keyed by user.

## Middleware
- [ ] Middleware is an optimization, **not** the authorization layer: re-check in the handler or action. Matchers miss paths (`/api`, trailing slashes, `_next/data`, locales).
- [ ] Never trust `x-middleware-subrequest` or similar internal headers from clients (patched CVE class). Keep Next.js updated.

## Data exposure
- [ ] Server Components can pass secrets to Client Components through props by accident. Only serializable, public fields go to `'use client'` components. Consider the `server-only` package and React taint APIs for secrets and modules.
- [ ] `NEXT_PUBLIC_*` env vars are shipped to the browser: never secret keys (service role, Stripe secret, OpenAI/Anthropic keys).
- [ ] API responses: select explicit columns, never return password hashes, tokens, internal flags or other users' emails.
- [ ] Error pages and `error.tsx` don't render stack traces or raw error messages in production.

## XSS
- [ ] `dangerouslySetInnerHTML` only with sanitized HTML (DOMPurify / sanitize-html with a strict allowlist).
- [ ] Markdown rendering: disable raw HTML or sanitize; watch `javascript:` links (`href` from user data must be http(s) or relative).
- [ ] `next/link` / `<a href>` / `router.push` with user-controlled values allow `javascript:` URLs and open redirects.
- [ ] JSON embedded in `<script>` must be escaped (`<` → `<`).

## Redirects & images
- [ ] `redirect(searchParams.next)` is an open redirect. Allow only relative paths starting with a single `/` (not `//` or `/\`).
- [ ] `next.config` `images.remotePatterns` should be specific hosts, not `**` (the image optimizer becomes an SSRF/proxy).

## Config
- [ ] Security headers set in `next.config` `headers()` or middleware (see headers.md). `poweredByHeader: false`.
- [ ] Source maps not publicly served in production unless intended.
