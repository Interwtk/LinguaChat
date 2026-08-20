# LinguaChat — Supabase beta persistence plan

Status: design only until a LinguaChat-specific Supabase project is positively
identified or created. Do **not** point LinguaChat at an EvoLabs project by guess.

Owner authorization changed on 2026-08-20: Supabase is no longer permanently
postponed. It may be introduced gradually for the public/friends beta, but only
through dedicated `LC-CLOUD-*` tasks with measured storage budgets, RLS and rollback.
Voice/video/media remain deferred.

## 1. Current connected-account reality

The connected Supabase account currently exposes:

- `Evolabs Platform` — active;
- `SG-Evolabs-Auth-Testing` — inactive.

Neither the live LinguaChat repository nor its current configuration contains a
LinguaChat Supabase project ref. The inactive project must not be restored merely
because it is the only paused project: its name indicates EvoLabs testing.

A LinguaChat cloud task remains blocked until the exact project is identified or a
new project is deliberately created in a user-confirmed Supabase organization.

## 2. Free-plan budget to design against

Current official Supabase Free-plan headline limits (verify again at implementation
time because quotas can change):

- 500 MB database size per project;
- 1 GB file storage;
- 5 GB egress + 5 GB cached egress;
- 50,000 monthly active users;
- free projects may pause after about one week of low activity;
- maximum two active Free projects across organizations where the user is owner/admin.

Sources:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://supabase.com/docs/guides/platform/database-size

## 3. LinguaChat internal safety thresholds

The product must not wait for Supabase's 500 MB read-only boundary.

Use internal thresholds for the beta:

- <250 MB: healthy;
- 250–350 MB: investigate growth and largest tables;
- 350–425 MB: stop adding new high-volume data classes; compact/purge safely;
- >=425 MB: critical cleanup/retention mode;
- >=450 MB: treat as incident; no optional writes until usage is reduced;
- 500 MB: platform may enter read-only mode — this is a failure, not a target.

A recurring supervisor check should query `pg_database_size(current_database())`,
largest relations and row counts. Alerts report growth rate, not only absolute size.

## 4. What belongs in Supabase first

### Phase A — identity + compact progress only

1. Supabase Auth for real beta accounts.
2. `profiles`
   - user id;
   - `user_language`;
   - target language (currently English);
   - optional coarse learning preferences;
   - created/updated timestamps.
3. `episode_progress`
   - one compact row per user + episode;
   - completion state;
   - attempts;
   - assisted vs independent evidence;
   - last practised / next review timestamps;
   - no duplicated copy of episode content.
4. `capability_progress`
   - one compact row per user + can-do;
   - independent evidence count;
   - support level / review health;
   - last/next review timestamps.
5. `learner_facts`
   - only facts the product actually uses for personalization;
   - strict text-length/count limits;
   - user can delete them.

### Phase B — only if the beta proves it is needed

- cross-device conversation summaries;
- compact user feedback/bug-report records;
- opt-in learning analytics aggregates.

Do not add Phase B merely because space exists.

## 5. What does NOT belong in the database initially

- audio;
- video;
- call recordings;
- screenshots;
- build artifacts;
- raw model traces;
- raw prompts/responses for every internal evaluation;
- full immutable event streams with no retention policy;
- duplicate curriculum/localization text already shipped with the app;
- large JSON snapshots of the whole learner state on every turn;
- telemetry that has no defined product question.

Supabase Storage should remain unused in the first persistence milestone unless a
specific small asset class is justified. Voice/video later requires a separate cost,
privacy and retention design.

## 6. Conversation history policy

Full chat logs are the easiest way to turn a small beta into an unbounded database.
For the first cloud milestone:

- keep the existing local archive for rich local history;
- cloud-sync compact pedagogical summaries/state rather than every raw message;
- if raw conversation sync is later required, set explicit per-user and time caps
  before shipping it (for example a bounded recent window), and measure bytes/user;
- never use indefinite append-only retention by default.

## 7. Schema / database hygiene

Every table must have:

- primary key appropriate to the entity;
- `user_id` ownership where applicable;
- RLS enabled before public beta;
- policies proving a user can read/write only their own data;
- cascade/delete strategy for account deletion;
- indexes only for measured access patterns;
- bounded text/JSON fields where possible;
- timestamps needed for retention/review, not decorative columns.

Avoid premature pgvector, Realtime fan-out, Edge Functions or complex triggers.
Use ordinary Postgres first. Add infrastructure only when a measured requirement
cannot be met simply.

## 8. Sync architecture

Local-first should remain valuable:

1. app can render/use the last safe local state quickly;
2. authenticated cloud state synchronizes compact learner progress;
3. writes are idempotent/upsertable;
4. conflict resolution is deterministic and tested;
5. offline progress is not silently lost;
6. a cloud outage does not erase local learning history;
7. migration from existing localStorage data is explicit and one-time, not a hidden
   destructive reset.

## 9. Privacy and minors

Supporting children publicly is not merely a pedagogy decision. Before allowing
minor accounts, LinguaChat needs a dedicated legal/privacy/parental-consent review
for the markets where it will operate. Until that review exists, do not collect
birth dates or sensitive child-profile data just to personalize exercises.

For age adaptation, prefer the minimum data needed (for example an optional coarse
age band during a controlled pilot) and document why it is collected.

## 10. Rollout sequence

1. positively identify/create LinguaChat Supabase project;
2. record baseline database size/advisors;
3. design migrations in repo; never hand-edit production schema without migration;
4. Auth + profiles only;
5. RLS/security advisor clean;
6. migrate/sync one compact progress domain;
7. measure bytes/user and query patterns;
8. add capability/review state only after the previous stage is stable;
9. run a multi-user beta simulation;
10. enable for real pilot users gradually;
11. daily/weekly size-growth monitoring and retention checks.

Every stage gets a rollback and does not proceed on red QA/security advisors.

## 11. Pausing reality

Free projects may be automatically paused for low activity. Restoring a paused
project is normal and preserves data/configuration during the supported restore
window, but LinguaChat must not manufacture meaningless keep-alive traffic just to
pretend usage exists. During active beta, real app activity should normally be
sufficient; before launch, a pause is acceptable and should be handled gracefully.

## 12. Acceptance gate for LC-CLOUD-001

Before any Supabase-backed beta is called ready:

- exact project id is documented without secrets;
- no EvoLabs project was reused accidentally;
- migrations are reproducible;
- Auth flow is real, not localStorage masquerading as cloud auth;
- RLS tests cover cross-user denial;
- existing local progress migrates without loss;
- offline/reconnect/idempotent retry tested;
- database size and estimated bytes/user measured;
- no raw audio/video/media storage;
- security/performance advisors reviewed;
- full frontend/backend QA and 390px/1440px browser journeys pass;
- two consecutive clean cycles after final fix.
