# HANDOFF — read this, then start

Keep this file current: what just happened, what is proved, what comes next, and
what will bite the next operator.

_Written for LC-I18N-002 on 2026-08-20. Live main/TASKS wins if it changes after
this branch was cut._

## What just happened

LC-OPS-009 already repaired the cloud chain and made the owner's PC irrelevant to
normal work. LC-I18N-001 audited the language architecture, and LC-I18N-003 (PR
#19) made one canonical `user_language` real: native/interface legacy state now
reconciles to one value, supported APIs cannot independently diverge it, meanings
use `user_language -> English`, and es/ja/ar reload + Arabic RTL were browser-proved.
LC-OPS-010 turned the failure class exposed by run `32331959420` into the current
resumable-worker architecture and added the learning-science/first-launch/
Supabase-beta contracts referenced below. LC-I18N-004 (PR #22) then closed the three
concrete hardcoded-copy defects LC-I18N-001 found by code (welcome message,
placement instructions/prompts/explanations/level-plan text, LanguageIdentity mood/
relationship/progress/style literals) and replaced the fixed `{count}` template
model with real `Intl.PluralRules`-based plural categories.

LC-I18N-005 (PR #24) then implemented `docs/product/language-detection-contract.md`:
`detectNativeLanguage()` (`services/language.js`) used to take
`navigator.languages[0]` unconditionally, so a device set to an unimplemented
language (e.g. `hi-IN`) would be persisted as `user_language` and set
`document.lang` to it while every visible string silently rendered English — the
false-support-claim failure mode the contract explicitly forbids. It now walks the
ordered preference list and returns the first candidate whose base is in
`SUPPORTED_LOCALES` (the same list the lazy-locale loader uses), falling back to
English when nothing matches; an already-persisted choice is untouched and still
always wins. A new compact `LanguageSwitcher` (limited to the eight actually
supported locales) is now reachable from `AuthShell` and `SetupShell`, since no
manual override existed anywhere before login prior to this task, and the contract
requires one. Full measured evidence is in `.ai/TRANSLATIONS.md` under
"LC-I18N-005"; short version: new `check:language-detection` (9 groups) proves the
contract's own QA-acceptance list against the real detection function, `check:all`
53/53 two consecutive clean cycles, build entry 447.28 kB two clean cycles, backend
444 pytest passed unchanged, and real Playwright browser proof at 390px/1440px for
es-CL/ja-JP/ar-SA device preferences, an unsupported-only preference list falling
back to English, a `pt-BR` regional preference resolving to base `pt`, and a manual
switcher choice surviving a later reload under a different device preference.

LC-PROD-001 (PR #25) then closed the gap this queue had flagged since LC-I18N-005:
placement, the profile "journey map" and Home's daily planner could each disagree
with what curriculum LinguaChat can actually teach. `calculatePlacementResult()`
returned a raw CEFR label (A1–C2) with no ceiling tied to real content and
`LevelReveal` rendered it as if a structured path existed there; Home's daily
planner and the session builder (`AppContext.jsx`) were hardcoded to
`episodesOfLevel(PRE_A1)` independent of the placement result; and the profile
journey map (`ProgressMap`/`JourneyRail`) placed "you are here" from that same raw
CEFR label against a `LEVEL_TO_NODE` map, so a B1+ placement could point at a
Travel/Confidence/Fluency node this build has no content for. Only Pre-A1 is
`available` (`learning/curriculum/levels.js`), so every one of those was an implied
promise this build could not keep.

The fix keeps the diagnostic CEFR read (`level`/`detectedLevel`) but adds a
separate, honest answer — `currentCourseLevelId`/`currentCourseLabelKey` — derived
from the curriculum registry via `playableLevelId()`, never assumed equal to the
diagnostic. `LevelReveal` now shows both, side by side, so a learner who tests above
Pre-A1 is never left assuming a path exists that isn't open yet. Home, the session
builder, the replay list (`CompletedEpisodes.jsx`) and the journey map
(`COURSE_NODE_BY_LEVEL_ID` in `mockData.js`, replacing `LEVEL_TO_NODE`) all now
derive from `playableLevelId()` instead of a hardcoded level id or the raw CEFR
label, so this stays correct the day a second level opens instead of silently
continuing to plan/show Pre-A1 forever. New `check-placement-honesty` (7 groups)
pins the whole chain; `check-curriculum-authoring.mjs` now checks each of the five
scoped call sites against its own required pattern instead of one shared literal.
`check:all` 54/54 (was 53) two consecutive clean cycles, build entry 447.64 kB two
clean cycles, backend 444 pytest passed unchanged, and real Playwright browser
proof at 390px/1440px: a live signup → placement → LevelReveal walk at a B1
diagnostic shows the honest PRE-A1 course card; seeded Home/profile-journey walks
for a beginner (A1 diagnostic) and an above-curriculum learner (C1 diagnostic)
render the IDENTICAL Pre-A1 session and "you are here: Start" node in both cases;
Arabic RTL end to end with no overflow, no raw keys, no console errors.

LC-PED-001 (PR #26) then closed the intermediate pedagogical-quality gate this
queue had pointed at since `LC-OPS-010`: every prior check proved content was
well-formed and that one canonical, hand-picked transcript produces the right
evidence — not that the sequence actually teaches well against real, varied
learner behaviour. New `check-pedagogical-journeys.mjs` (wired into `check:all`)
plays all 11 completed runtime arcs (Pre-A1's six, A1's first five) through the
real evaluator/scaffold/learner-model engine via `scripts/lib/journey.mjs`, with
**253 distinct learner journeys** — natural-variant phrasing, wrong/near-miss/
nonsense + retry, assisted/model-copy play (with a dedicated recall-is-help-proof
check), novel-context transfer, replay/idempotency, delayed-retrieval scheduling
and a refusal-boundary sweep per arc, every arc clearing the >=20 floor. Building
the harness found two real defects: arc 5 (`paying_and_choosing`) was never wired
into the harness's episode lookup chain, so no arc-5 journey could ever play; and
`playEpisode` had no way to substitute a natural-variant/near-miss/novel-context
reply, so optional `answerOverride`/`ctxOverride`/`wrongText` hooks were added
(all default to prior exact behaviour; no existing caller's behaviour changed).
`docs/curriculum/pedagogical-journeys-report.md` documents methodology, per-arc
coverage and an age-sensitive usability review read from the real session/
scaffolding/profile code (no artificial time pressure, real session-length
autonomy, a real `textSize` control, non-punitive retry copy, assistance never
gates progress; flags one out-of-scope gap for a future task — `localProgress`'s
streak has no grace/recovery state, which CLAUDE.md requires).

This PR had stalled across several prior runs (draft checkpoint, then repeated
claim/release cycles while an unrelated queue-boundary bug was fixed in
`LC-OPS-012`/`LC-OPS-013`). Its report had also drifted ahead of its evidence: an
earlier checkpoint described the 390px/1440px es/ja/ar Playwright browser walk in
the past tense before that walk had actually been run — a process defect (implying
a test ran when it had not), not a finding about the product. This run actually
performed that walk live before closing the task: a seeded, authenticated Pre-A1
`greetings` session driven through the real UI (`npm run dev`, Playwright/Chromium
installed ad hoc with `--no-save` and removed afterward — `package.json`
unchanged) at 390px/1440px in es/ja/ar (6 runs) — Today → episode intro → a
`model` step → a `comprehension` choice → the `word_order` step submitted wrong
then recovered via the real "Almost — the correct order is: Hi I'm Alex." retry
copy → the following `fill_blank` step. All 6 runs: no horizontal overflow, no raw
i18n keys, no console/page errors; Arabic renders `dir="rtl"` end to end at both
viewports (verified visually — mirrored bottom nav on mobile, mirrored sidebar/
chat panel/content column on desktop); the `word_order` tokens, the retry sentence
and the `fill_blank` free-text input all measured `lang="en" dir="ltr"` by direct
DOM inspection in every locale/viewport. `check:all` 55/55 (was 54), two
consecutive clean cycles; build entry 447.64 kB / bundle-boundaries entry
438.4 kB, two consecutive clean cycles; backend `compileall` clean + 444 pytest
passed, two consecutive clean cycles, unchanged.

**Note for the next operator (still true, kept from the LC-I18N-004 handoff):** a
task can show `unclaimed` on `main` while its branch/PR already has real commits
sitting in draft — check the branch and PR first before assuming there is nothing to
do, and resume/finish existing work rather than re-claiming and re-releasing it. No
such stale branch existed for LC-I18N-005 at claim time; `i18n/lc-i18n-005` was
created fresh.

LC-I18N-002 (PR #30) then closed the picker/support-honesty gap this queue had
pointed at since `LC-I18N-001` finding A6: `LanguageIdentity`'s post-login picker
still let a learner select any of 46 rows / 34 base languages, and picking one of
the 26 with no implemented locale persisted it as `user_language` and set
`document.lang` to it while every visible string kept silently rendering English
— the same false-support-claim failure mode `LC-I18N-005` had already closed for
*automatic* detection, still reachable through manual selection. `services/
language.js`'s `LANGUAGE_OPTIONS` now carries a `supported` flag computed from
`SUPPORTED_LOCALES` (the loader's own real list, not a second hand-maintained
one); the picker disables the 26 unsupported rows with a "coming soon" badge
instead of letting them be chosen; `ensureLanguagePreferences()` self-heals a
persisted-but-unsupported base (from before this fix, or hand-edited storage)
back to a genuinely supported one on the next load, the same self-healing
pattern `LC-I18N-003` already applies to a legacy native/interface mismatch.
The drifted, zero-importer duplicate `LANGUAGE_OPTIONS`/`detectNativeLanguage`/
`getLanguageName` registry LC-I18N-001 flagged in `i18n/translations.js`
(finding A7 — six rows, missing `ja`/`ar` entirely) is now removed outright
rather than merely unused, so it can never be picked up by a future accidental
import. New `check-language-support` (10 groups) pins all of this; `check:all`
56/56 (was 55), two consecutive clean cycles; build entry 447.81 kB /
bundle-boundaries entry 438.6 kB, two consecutive clean cycles; backend
`compileall` clean + 444 pytest passed, two consecutive clean cycles, unchanged.
Real browser proof (Playwright/Chromium, installed ad hoc with `--no-save` and
removed afterward) at 390px/1440px in es/ja/ar (6 runs): searching "hindi" in
the real popover shows it disabled with the locale's own "coming soon" badge;
searching "japan" shows it enabled with no badge, and selecting it then Save
actually persists `ja` end to end — the supported path stays fully working, not
merely visually unaffected; no overflow, no console errors, no raw `{key}`
leaks; Arabic `dir="rtl"`, Spanish/Japanese `dir="ltr"`, all six runs. Full
detail in `.ai/TRANSLATIONS.md` under "LC-I18N-002".

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

`LC-PED-001` is DONE (PR #26): 253 distinct learner journeys across all 11
completed runtime arcs. `LC-PED-002` remains the final all-arcs gate after A1
arcs 6/7. Software simulation cannot replace the later real-learner beta/pilot
evidence — `LC-PED-001` proves internal pedagogical consistency, not human
efficacy.

## First-launch language — implemented, do not infer language from country

Source: `docs/product/language-detection-contract.md`, implemented by LC-I18N-005.

The learner should get an understandable interface from the very first screen, but
country/physical location is not the correct primary signal. India, Canada,
Switzerland and many other places are multilingual; travellers/VPNs exist.

Correct priority on a clean launch, now real in `services/language.js`:

1. explicit persisted LinguaChat choice, if one exists (`ensureLanguagePreferences`
   reads storage first, unchanged by this task);
2. ordered device/browser preferred languages (`navigator.languages` on web/PWA);
3. first honestly supported base-locale match (`detectNativeLanguage()` now filters
   through `SUPPORTED_LOCALES`, not merely `candidates.find(Boolean)`);
4. safe English fallback;
5. an immediately accessible manual language switcher (new `LanguageSwitcher` in
   `AuthShell`/`SetupShell`).

Region only disambiguates a language variant that is actually implemented (proved:
`pt-BR` resolves to base `pt`, not English). No GPS/IP/SIM lookup is needed or used
(proved: a `navigator.geolocation.getCurrentPosition` stub that throws is never
called). Explicit learner choice always wins (proved: a manual switcher pick
survives a later reload under a completely different device preference).

Do not auto-select Hindi merely because a device is in India; `hi-IN`, `ta-IN`,
`bn-IN`, `en-IN`, etc. are different language preferences and only genuinely
supported locales may be selected — this is now enforced in code, not just policy.

## Current i18n path

`LC-I18N-005` is DONE (PR #24), `LC-PROD-001` is DONE (PR #25), `LC-PED-001` is
DONE (PR #26), and `LC-I18N-002` is DONE (PR #30, merged into main's
`.ai/TASKS.md` DONE section in this same PR). The next language/quality task is:

1. `LC-QA-001` — turn remaining i18n failure classes into regression gates.

Do not mass-add Hindi/Korean/etc. as selector labels first. A language becomes
supported only after login/onboarding/UI + explanations/hints/corrections/meanings
are actually complete and tested — and, since `LC-I18N-002`, only after it is
added to `SUPPORTED_LOCALES` (`i18n/translations.js`'s `LOADERS`), which is now
the single flag that makes a base selectable everywhere at once: the post-login
`LanguageIdentity` picker (via `LANGUAGE_OPTIONS.supported`) and the pre-login
`LanguageSwitcher` (which already only ever lists `SUPPORTED_LOCALES`) both read
the same source, so there is no longer a second catalog to remember to update in
step. Adding a base to `SUPPORTED_LOCALES` before its locale dictionary, native
copy review and browser/RTL proof are actually complete would make it fully
selectable immediately — do the work first, wire the loader last.

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
