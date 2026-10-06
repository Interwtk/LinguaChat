# Preference sync checkpoint (2026-10-06)

PR #123 remains Draft. The existing public browser Auth client is reused. Runtime
rollout is explicitly off (`CLOUD_PREFERENCES_RELEASED = false`) pending the owner
schema/RLS gate. No database configuration, paid provider, SMTP or deployment was
performed. Progress, conversations, mastery and XP remain local/account-isolated.

Implemented: verified `getUser` identity on every table operation, owner checks
across asynchronous boundaries, account-scoped backup/journal before import,
three-way field merge, remote-wins same-field conflict with saved losing values,
compare-and-set by updated_at, concurrent-insert handling, serialized requests,
offline retention/reconnect, bounded backoff and logout/disposal cancellation.
A first login with an existing remote record imports remote preferences while
preserving the complete original preference backup. Repeated sync does not write
unchanged rows. Edits made during a request remain dirty for another iteration.
Only existing preference columns may leave the browser; no learner progress is
sent. This does not claim cloud progress persistence or hosted RLS verification.

SDK loading is now asynchronous and cached separately from the entry chunk. The
previous Auth integration made post-build QA fail at 393 kB app code vs a 290 kB
budget. The new build measures about 180 kB app code, with unchanged thresholds.
Listener cleanup and retry after chunk-load failure have executable regressions.

Verification: `npm run check:cloud-preferences`, `node
src/auth/check-lazy-provider.mjs`, build then check:all (including built bundle
checks), check:i18n, backend compileall and pytest. Fixtures prove coordinator and
adapter behavior, not hosted identity/RLS, mail delivery or multi-device E2E.

Remaining activation proof: reproducible owner-authorized schema/RLS mechanism,
real A/B and anonymous denial, measured storage/database growth and bytes per
user, controlled browser account tests and recovery email callback expiry/reuse.
Two read-only public-schema inspections timed out in the connected database;
no schema state was inferred from these errors. Local agent-browser daemon failed
to start twice, so no browser E2E result is claimed in this checkpoint.

References checked: Supabase changelog (2026-10-06), official JavaScript getUser
and update API documentation. No server-adapter/DB upgrade was performed.
