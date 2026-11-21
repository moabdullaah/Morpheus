# Supabase / Postgres

## Row Level Security
- [ ] `alter table … enable row level security;` on **every** table in exposed schemas (`public`), including join tables and new tables in every migration. Query: `select tablename from pg_tables where schemaname='public' and not rowsecurity;` must return nothing.
- [ ] Policies exist for each operation needed (select/insert/update/delete). RLS enabled with no policy means deny-all (safe but broken); `using (true)` means public.
- [ ] `insert`/`update` policies need `with check (...)`. Without it, users can write rows owned by others or change `owner_id`.
- [ ] Ownership via `auth.uid()` (wrap as `(select auth.uid())` for performance). Never trust a `user_id` column the client sets without `with check (user_id = auth.uid())`.
- [ ] Multi-tenant: membership checks through a `security definer` helper or join, not client-sent `org_id`.
- [ ] `security definer` functions: set `search_path = ''` (or a fixed schema), check `auth.uid()` inside, revoke execute from `anon`/`public` when not needed.
- [ ] Views bypass RLS by default (owner rights). Use `with (security_invoker = true)` on Postgres 15+.
- [ ] Don't use `auth.jwt() -> 'user_metadata'` for authorization: users can edit their own user_metadata. Use `app_metadata` or a roles table.

## Keys
- [ ] `service_role` key only on the server (never `NEXT_PUBLIC_`, never in client bundles, mobile apps or edge code reachable by users). It bypasses RLS.
- [ ] The anon key is public by design. Security comes from RLS, so test RLS.

## Storage
- [ ] Buckets private unless truly public; storage policies on `storage.objects` scoped by `auth.uid()` and path prefix (`(storage.foldername(name))[1] = auth.uid()::text`).
- [ ] Signed URLs short-lived; validate content type and size on upload (see uploads-ssrf.md).

## Auth settings
- [ ] Email confirmation on; secure password policy; leaked-password protection; rate limits configured; redirect URL allowlist exact (no wildcards to attacker domains).

## Testing
- [ ] Regression tests with two real users (anon key + each user's JWT): A cannot select, update or delete B's rows; anon cannot read private tables. pgTAP or integration tests.
