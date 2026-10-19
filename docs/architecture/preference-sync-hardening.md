# Preference sync hardening — gated client protocol

`CLOUD_PREFERENCES_RELEASED=false`. This work does not authorize a rollout,
authenticated hosted CRUD, progress sync, or schema/RLS changes.

## Reproduction and verification

Run from `linguachat-frontend`:

```sh
node src/cloud/check-preference-sync.mjs
node src/cloud/check-preference-transport.mjs
node src/cloud/check-sync-runtime.mjs
```

The sync check includes `check-preference-faults.mjs`, using Node's built-in test
runner and deterministic Storage/server fixtures. No new dependency or network
credentials are needed. The coordinator is recreated after every injected crash;
only the simulated durable local store and server survive.

The new regressions reproduced these faults before their fixes:

- Identity obtained after the initial await could adopt a new account; an old A
  operation could also become trusted after A→B→A without an explicit cancel.
  Sync now captures the owner and the existing `captureLearnerAccess()` lease
  before awaiting. Transport checks that lease after its own `getUser` await,
  immediately before constructing a query. Already submitted A requests may
  commit only to A; their late responses cannot import into the new session.
- Shared interests-array references hid in-place edits made during a request.
  Preference snapshots now copy the array, and a fresh local read after cleanup
  prevents returning `synced` while another local change remains dirty.
- An empty journal was silently treated as absence. It now fails closed with
  its original bytes retained. Journal shape, version, owner, base, backup,
  conflicts and pending import are checked before network access.
- Invalid local values could be sent before validation of the remote response.
  Both coordinator and transport now validate the allowed preference values.
  A missing owner can no longer match a signed-out `undefined` identity.
- JavaScript date coercion accepted non-timestamp CAS revisions. Revisions now
  require a valid timestamp, including calendar/date-range checks; successive
  writes advance beyond the previous revision even with a backward local clock.
- A scheduled `changed()` could consume the existing in-flight promise and lose
  its dirty signal. The scheduler retains a fresh pass after completion, fences
  obsolete timers, and keeps one retry timer with backoff capped at 60 seconds.

The crash matrix covers journal persistence before/after, read failure, after
read, before CAS, after committed CAS, staged base/pending import before/after,
apply before/after, cleanup before/after, and before returning synced. Every case
restarts, adds a real disjoint local edit, checks local/remote/base/backup/conflicts,
owner/status/write count, then repeats sync without extra writes or journal growth.
Additional fixtures force concurrent first insert, disjoint two-device CAS,
same-field remote-wins conflict plus a subsequent legitimate edit, four-attempt
CAS exhaustion, wrong-account/stale-generation work, malformed input and Storage
denial. The runtime checks also exercise offline/reconnect, stale callbacks and stop.

## Remaining rollout blockers

- The generic `applyLocal` contract is synchronous, durable and lease-bound.
  AppContext's future adapter still writes multiple preference/language keys,
  defers a tutor save through a React updater, and uses save helpers that swallow
  Storage errors. Its complete atomic durability is **not proven** by the
  coordinator fixtures. Its journal writes now use captured learner access;
  the gate stays closed until the import adapter itself is made durable and
  exercised under partial local-save failures. Existing non-cloud fields must
  continue to survive the import mapping.
- With only `pendingImport.before/value`, an unapplied import and an applied
  import followed by an explicit revert to exactly `before` are indistinguishable.
  Recovery conservatively replays the staged value and durably retains the
  ambiguous prior choice in `conflicts` before applying. Distinct later edits
  survive automatically. Automatic intent recovery for the exact revert is **not
  claimed**; it needs an atomic local import marker/revision. Conflicts remain
  recovery data, not a shipped conflict-resolution UI.
- Journal growth is bounded by preference fields and normalized interests; each
  conflict field retains its latest losing choice, not an unlimited edit history.
  Device clocks provide CAS revision tokens only, never account ownership.
- Real hosted A/B/anonymous access, logout/relogin persistence, authenticated
  preference CRUD, device audio and password mail flow still require external QA.
  Public-entry browser smoke does not establish those authenticated flows.

Teaching policy remains capability-scoped. F28 is an imported design-only fixture,
not a new cross-skill engine or evidence of human learning efficacy. Pre-A1 stays
frozen and A1–C2 stay unavailable.
