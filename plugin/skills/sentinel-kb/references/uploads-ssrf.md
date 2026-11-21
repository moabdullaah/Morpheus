# Uploads, files, SSRF, redirects

## Uploads
- [ ] Size limits enforced server-side; type checked by magic bytes, not just extension or `Content-Type`.
- [ ] Store outside the web root or in object storage with **random names**; serve with `Content-Disposition: attachment` for untrusted types; never serve user HTML or SVG inline from the app origin (stored XSS). Use a separate domain or sanitize SVG.
- [ ] Image processing libraries patched (ImageMagick/sharp); archives: zip-slip and zip-bomb protection.
- [ ] Per-user quotas; malware scanning if files are shared with others.

## Paths
- [ ] No user input in filesystem paths without normalization plus prefix check (`path.resolve(base, input).startsWith(base + sep)`); reject `..`, absolute paths and null bytes.

## SSRF (server fetches a user-supplied URL: webhooks, link previews, imports, image proxies)
- [ ] Allowlist schemes (`https`) and, ideally, hosts.
- [ ] Resolve DNS and block private, loopback, link-local and metadata ranges (`127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254.169.254`, `::1`, `fc00::/7`); re-check after redirects; disable or limit redirects; timeouts and size limits.

## Redirects
- [ ] Open redirects: only relative paths or allowlisted hosts for `next`/`returnTo`/`redirect_uri`.
