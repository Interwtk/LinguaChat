# Preference sync hardening — gated client protocol

`CLOUD_PREFERENCES_RELEASED=false`. This work does not authorize a rollout,
authenticated hosted CRUD, progress sync, or schema/RLS changes.

## Reproduction and verification

Run from `linguachat-frontend`:

```sh
node src/cloud/check-preference-sync.mjs
node src/cloud/check-preference-transport.mjs
node src/cloud/check-sync-runtime.mjs
npm run check:preference-import
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

## Durable local application import

The real AppContext adapter previously returned success after tutor or language
Storage failures: the normal save helpers swallowed those exceptions, and React
updates performed persistence later. The baseline reproduced this at the tutor
write and all seven compatibility language keys. This boundary now uses the
dedicated synchronous `src/cloud/preferenceImport.js` adapter instead.

This is logical, recoverable atomicity, **not physical multi-key atomicity**:

1. Validate the cloud fields and capture the existing own-account learner access.
   Snapshot local preferences, retaining non-cloud tutor/options properties.
2. Persist and read back `lc2-cloud-preference-import` before data writes. Its
   strict version-1 shape is `userId`, `phase`, `before`, `value`, `conflicts`.
   Phase is `prepared` or `applied`; all preference objects use the cloud allowlist.
3. Write options, normalized tutor preferences, all native/interface/legacy
   language keys and fixed English target through that same captured access.
   Verify each write and then the complete set. Exceptions propagate.
4. Persist any ambiguous recovery choices in the bounded account-local
   `lc2-cloud-preference-import-conflicts` record, then persist an `applied` marker.
   Remove the pending journal only after full durable confirmation. Removal and
   readback failures also throw. Only then return a fresh durable snapshot to React.

Recovery replays a prepared target, retaining distinct later field edits and all
current non-cloud properties. Preserved edits are staged before replay so another
crash cannot erase them. An `applied` marker proves the prior set was durable:
current preferences after that marker are retained as later edits. When a pending
import exists, `apply` finishes that intent first; the unchanged coordinator sees
any remaining dirty edit on its subsequent local read. Completed retries do no
data writes. The protocol uses no clock or global revision and keeps one pending
record plus at most one losing choice per allowed field.

AppContext recovers before language normalization at startup and retries under
verified account activation before opening private UI. Failed recovery skips
normalizers/default writes and keeps the entry screen. Cloud `readLocal` reads
durable Storage rather than a pinned remote object. `applyLocal` publishes pure
React state updates only after strict persistence succeeds; equal state retains
its identity so the dirty effect settles. The redundant tutor save effect was
removed: the normal interactive setters already persist their own updates.

The dedicated check executes the actual AppContext apply callback against the
real adapter and captured physical storage. Its 37 cases cover before/after each
data write, journal prepare/completion/cleanup, restart, repeated recovery failure,
denied reads/removal, corrupt/foreign journals, A→B and A→B→A, local-only fields,
post-crash edits, exact-revert evidence, actual startup failure, fixed target,
cleanup-boundary edits and adapter/coordinator/scheduler integration. A normal
tutor edit and manual language change remain visible to `readLocal`, sync, and
reach an empty timer queue. These checks run in `check:all` and
`check:cloud-preferences`; no authenticated remote service is used.

## Remaining rollout blockers

- With only `pendingImport.before/value`, an unapplied import and an applied
  import followed by an explicit revert to exactly `before` are indistinguishable.
  Recovery conservatively replays the staged value and durably retains the
  ambiguous prior choice in `conflicts` before applying. Distinct later edits
  survive automatically. Automatic intent recovery for the exact revert is **not
  claimed**. The local adapter's `applied` marker resolves cases where it is
  present, but crashes before that marker or after its cleanup retain the
  conservative conflict rule. Conflicts remain recovery data, not a shipped
  conflict-resolution UI.
- Journal growth is bounded by preference fields and normalized interests; each
  conflict field retains its latest losing choice, not an unlimited edit history.
  Device clocks provide CAS revision tokens only, never account ownership.
- Real hosted A/B/anonymous access, logout/relogin persistence, authenticated
  preference CRUD, device audio and password mail flow still require external QA.
  Public-entry browser smoke does not establish those authenticated flows.

Teaching policy remains capability-scoped. F28 is an imported design-only fixture,
not a new cross-skill engine or evidence of human learning efficacy. Pre-A1 stays
frozen and A1–C2 stay unavailable.
