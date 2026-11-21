# Payments & webhooks

- [ ] **Price comes from the server**, never from the client. Create Checkout Sessions with server-side `price` ids; ignore client-sent amounts.
- [ ] **Entitlements are granted from verified webhooks** (`checkout.session.completed`, `invoice.paid`), not from the success-page redirect.
- [ ] Webhook signature verified with the raw body (`stripe.webhooks.constructEvent(rawBody, sig, secret)`); reject on failure with 400; no JSON parsing before verification.
- [ ] Handlers are **idempotent** (store processed `event.id`); tolerate retries and out-of-order delivery; re-fetch objects from the API when state matters.
- [ ] Map Stripe customer ↔ user server-side; never trust `client_reference_id`/metadata alone without matching the session's customer.
- [ ] Money math in integer minor units; currency validated; coupons and discounts validated server-side and single-use where intended.
- [ ] Generic webhooks (GitHub, Slack, Clerk, Resend…): verify HMAC with constant-time compare; check timestamp tolerance (replay protection).
- [ ] Webhook endpoints excluded from CSRF and auth middleware deliberately, and protected by signature instead.
- [ ] Secrets: restricted Stripe keys with minimal permissions; live keys only in production env.
