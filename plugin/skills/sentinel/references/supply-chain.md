# Dependencies, CI, containers

- [ ] New dependency? Check it's maintained, popular and not typo-squatted (`npm view <pkg>` shows repo, weekly downloads, maintainers, publish date). Prefer the platform or stdlib over tiny packages.
- [ ] Lockfile committed; CI uses `pnpm install --frozen-lockfile` / `npm ci`.
- [ ] Install scripts: be wary of packages with `postinstall`; consider `pnpm` `onlyBuiltDependencies` allowlist.
- [ ] `osv-scanner -r .` or `pnpm audit --prod`: no known Critical/High in production deps without a documented exception.
- [ ] Dependabot or Renovate enabled; security updates merged promptly.
- [ ] **GitHub Actions**: `permissions:` least privilege at workflow and job level; pin third-party actions to a commit SHA; no `pull_request_target` checkout of untrusted code with secrets; never interpolate `${{ github.event.* }}` (PR titles, branch names) directly into `run:` (script injection). Pass via `env:` instead.
- [ ] Secrets in CI scoped to environments; OIDC to cloud instead of long-lived keys.
- [ ] Docker: pinned base image digest, non-root user, no secrets in layers or build args, minimal image, `.dockerignore` includes `.env*`.
