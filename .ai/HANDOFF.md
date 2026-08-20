# HANDOFF — read this, then start

Keep this file current: what just happened, what is proved, what comes next, and
what will bite the next operator.

_Written for LC-I18N-004 on 2026-08-20. Live main/TASKS wins if it changes after
this branch was cut._

## What just happened

LC-OPS-009 already repaired the cloud chain and made the owner's PC irrelevant to
normal work. LC-I18N-001 audited the language architecture, and LC-I18N-003 (PR
#19) made one canonical `user_language` real: native/interface legacy state now
reconciles to one value, supported APIs cannot independently diverge it, meanings
use `user_language -> English`, and es/ja/ar reload + Arabic RTL were browser-proved.
LC-OPS-010 turned the failure class exposed by run `32331959420` into the current
resumable-worker architecture and added the learning-science/first-launch/
Supabase-beta contracts referenced below.

LC-I18N-004 (PR #22) then closed the three concrete hardcoded-copy defects
LC-I18N-001 found by code — the welcome message, the placement flow's
instructions/prompts/explanations/level-plan text, and LanguageIdentity's mood/
relationship/progress/style literals — and replaced the fixed `{count}` template
model with real `Intl.PluralRules`-based plural categories. Full measured evidence
is in `.ai/TRANSLATIONS.md` under "LC-I18N-004"; the short version: `check:i18n`
1724 base keys (6 plural-aware) at 100% coverage across es/pt/fr/it/de/ja/ar,
`check:all` 52/52 two consecutive clean cycles, build entry 447.05 kB two clean
cycles, backend 444 pytest passed two clean cycles, and real Playwright-driven
browser proof at 390px/1440px for es/ja/ar covering entry/signup/placement/
identity screens with correct Arabic RTL and no raw-key/overflow/console-error
regressions.

**Note for the next operator:** this branch/PR had previously accumulated several
claim/release cycles on `main` (visible in `git log`) without the underlying work
actually finishing — the branch had real, substantial commits sitting in draft
PR #22 the whole time, but nobody had run final QA, browser proof and bookkeeping
to close it out. If you see a similar pattern (task shows `unclaimed` on main but
its branch already has commits/an open PR), check the branch and PR first before
assuming there is nothing to do — resume and finish existing work rather than
re-claiming and re-releasing it.

## The 40-turn failure — what it actually means now

Run `32331959420` was an interactive `Claude — mention` run. It authenticated on a
GitHub-hosted Ubuntu runner, had no permission denial, then hit the old 40-turn
ceiling at turn 41 before pushing a branch. It was also the wrong lane for a large
workflow/infrastructure task.

The correct 24/7 architecture is **not one infinite Claude process**. Every hosted
runner/process has sensible boundaries. Reliability comes from bounded runs that
checkpoint remote work and can be resumed by the cloud chain/watchdog.

LC-OPS-010 therefore changes `Claude — mention` into triage/review only:

- no automatic run from issue assignment;
- repository contents read-only;
- no Write/Edit Claude tools;
- explicit prohibition on queue-sized implementation or `.github/workflows` edits;
- bounded analysis ceiling raised 40 -> 80 so reviews have headroom.

Actual implementation remains in the autonomous task/i18n workers, which already:

- claim through the shared queue;
- push a branch/draft PR in the first 15 turns;
- push every milestone and never intentionally go 20 turns without remote progress;
- leave resumable draft work or release the claim if a run ends;
- are recovered by the chain/watchdog rather than losing the project at a turn
  boundary.

`check-cloud-automation` now pins the mention lane as triage-only so this regression
cannot quietly return.

## Learning-science baseline — read before learner-facing design

New source: `docs/research/learning-science-foundation.md`.

Before materially changing curriculum sequence, feedback, mastery, review timing,
scaffolding, motivation/gamification or age adaptation, the task/PR must identify:

1. the learner problem;
2. measured LinguaChat evidence;
3. the supporting research principle/source;
4. what would falsify the design;
5. a learning measure independent of clicks/completion.

The baseline incorporates CEFR action-oriented can-dos, Nation's Four Strands,
retrieval practice, spacing, interaction/output, corrective feedback, age-sensitive
adaptation, autonomy/competence/relatedness, healthy gamification and habit
formation.

Do **not** implement pseudo-neuroscience or generic dopamine claims. LinguaChat should
be compelling and habit-forming, but success is retained learning per useful minute
and healthy return behaviour — not maximizing addiction or raw screen time. No
loot-box/variable gambling rewards, fake urgency, shame notifications, forced
infinite scroll or punitive streak destruction.

`LC-PED-001` remains the intermediate >=20-distinct-journeys-per-completed-arc audit.
`LC-PED-002` remains the final all-arcs gate after A1 arcs 6/7. Software simulation
cannot replace the later real-learner beta/pilot evidence.

## First-launch language — do not infer language from country

New source: `docs/product/language-detection-contract.md`.

The learner should get an understandable interface from the very first screen, but
country/physical location is not the correct primary signal. India, Canada,
Switzerland and many other places are multilingual; travellers/VPNs exist.

Correct priority on a clean launch:

1. explicit persisted LinguaChat choice, if one exists;
2. ordered device/browser preferred languages (`navigator.languages` on web/PWA);
3. first honestly supported base-locale match;
4. safe English fallback;
5. an immediately accessible manual language switcher.

Region only disambiguates a language variant that is actually implemented. No
GPS/IP/SIM lookup is needed. Explicit learner choice always wins.

`LC-I18N-005` implements this now that LC-I18N-004 is done. Do not auto-select
Hindi merely because a device is in India; `hi-IN`, `ta-IN`, `bn-IN`, `en-IN`,
etc. are different language preferences and only genuinely supported locales may
be selected.

## Current i18n path

`LC-I18N-004` is DONE (PR #22, merged into main's `.ai/TASKS.md` DONE section in
this same PR). The next language task is:

1. `LC-I18N-005` — preferred-device-language detection before login;
2. `LC-PROD-001` — make placement/profile/planner truthful about curricula actually available;
3. `LC-PED-001` — >=20 distinct learner journeys per completed runtime arc;
4. `LC-I18N-002` — one truthful supported-language catalog; expand future languages
   only in small complete batches;
5. `LC-QA-001` — turn remaining i18n failure classes into regression gates.

Do not mass-add Hindi/Korean/etc. as selector labels first. A language becomes
supported only after login/onboarding/UI + explanations/hints/corrections/meanings
are actually complete and tested.

## Supabase — owner now authorizes gradual beta persistence, but do not guess a project

New source: `docs/architecture/supabase-beta-plan.md`.

Connected Supabase discovery on 2026-08-20 showed only:

- `Evolabs Platform` — active;
- `SG-Evolabs-Auth-Testing` — inactive.

No LinguaChat project ref was found in the live repo/current configuration. The
inactive project must **not** be restored merely because it is paused: its name
suggests EvoLabs testing and touching the wrong project risks work data.

`LC-CLOUD-001` is therefore BLOCKED until the exact LinguaChat Supabase project is
positively identified, or a new dedicated project is deliberately created in a
Supabase organization confirmed by the owner.

When unblocked, first cloud milestone is deliberately small:

- real Supabase Auth;
- profiles;
- compact episode/capability progress;
- minimal learner facts actually used;
- RLS + cross-user denial tests;
- one-time local-state migration + offline/idempotent retry;
- measured database bytes/user and growth thresholds.

Do not initially store raw audio/video, screenshots, indefinite conversation/event
logs, duplicate curriculum content or whole learner-state snapshots on every turn.
No pgvector, Edge Functions, Realtime fan-out or Storage in the first milestone
unless a later measured requirement justifies them.

The current Free plan is intentionally treated as a tight budget. The architecture
document defines internal warning thresholds well below the platform database cap;
verify official quotas again at implementation time because service limits change.

## Children / age adaptation

Pedagogically, LinguaChat should adapt presentation/scaffolding to younger, adult and
older learners without equating age with intelligence. Public accounts for minors
also require a separate privacy/consent/compliance review before release. Do not
collect exact birth dates just to personalize lessons unless a later legal/product
review proves the need.

## Still open engineering signals

- `npm ci` reports 1 moderate + 3 high advisories; `LC-SEC-001` audits exact paths
  before any upgrade; never force-fix blindly.
- backend has one Pydantic V1 `@validator` deprecation; `LC-BE-001` handles it.
- README is stale; `LC-DOC-001` updates it only after proving historical debris is unused.
- current login/signup remain localStorage mocks until dedicated cloud work proves
  real Auth; never market them as cloud accounts before then.

## Permanent traps

- Quality over speed. One functional task per PR.
- Live GitHub evidence wins over prose.
- Count `check:all` by exit code.
- A green suite is not functional/browser/pedagogical proof.
- Never infer A1 completeness from currently-built episodes.
- A1 cannot open before LC-PED-002 + separate availability decision.
- Voice/STT/TTS/WebRTC/pronunciation/calls/video remain deferred.
- Provider QA remains local/fake; no real paid OpenAI calls without written owner authorization.
- Supabase is permitted only through dedicated LC-CLOUD scope; never improvise a
  connection or relax QA guards early.
- Never touch owner archives/secrets.
- Never blind-rerun failed CI; diagnose the deterministic cause or make the work resumable.
