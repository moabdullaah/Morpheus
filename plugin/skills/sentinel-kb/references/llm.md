# LLM / AI features (OWASP Top 10 for LLM apps)

- [ ] **Prompt injection (direct & indirect)**: any untrusted text (user input, web pages, emails, documents, tool results, RAG chunks) can carry instructions. Keep it delimited and labeled as data. Never let it alone trigger privileged tools.
- [ ] **Excessive agency**: tools follow least privilege (read-only by default, scoped to the current user/tenant); destructive or external-side-effect tools (send email, pay, delete, post) need explicit user confirmation.
- [ ] **Insecure output handling**: model output is untrusted input. Escape before rendering (XSS via markdown/HTML), never `eval`, never pass to SQL or shell, validate structured output with a schema.
- [ ] **Data leakage**: no secrets or other tenants' data in system prompts or context; RAG retrieval filtered by the caller's permissions *before* the model sees it; logs redact PII.
- [ ] **Exfiltration channels**: markdown images and links rendered from model output can leak data via URL params. Restrict to allowlisted domains or strip them.
- [ ] **Denial of wallet**: per-user rate limits, max tokens, timeouts, and a budget cap; reject huge inputs.
- [ ] **Keys** server-side only; streaming endpoints authenticated.
- [ ] **Supply chain**: pin model ids and SDK versions; vet third-party MCP servers and tools.
- [ ] **Evals for safety**: include injection and jailbreak cases in the eval set for agentic features.
