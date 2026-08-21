# TASKS — the queue

One task, one owner, one branch, one PR. Ids are PERMANENT: never renumber, never
reuse. Move a whole block between sections rather than editing it in place, so
`git log -p .ai/TASKS.md` reads as a history.

## Ownership, so two agents cannot collide

A task is claimed by moving it to IN_PROGRESS and filling `owner` and `branch` in
the same commit, on `main`, before any work starts. If a task already has an owner,
pick another one. If the owner's branch has had no commit for 24 h it may be
reclaimed — say so in `.ai/HANDOFF.md` when you do.

    - [LC-XXXX-NNN] title
      owner:  <agent or human> | unclaimed
      branch: <branch name> | none
      why:    one sentence
      done:   what has to be true, checkable

---

## IN_PROGRESS

_(none — the queue is open)_

## TODO — ordered; take the first unclaimed one you are allowed to do

- [LC-QA-001] Extend check:i18n into a real linter
  owner:  unclaimed
  branch: none
  why:    the current check proves key parity only and missed every material defect found in LC-I18N-001.
  done:   detect hardcoded visible auxiliary strings, placeholder mismatches,
          duplicate locale keys, unsupported-language claims, raw-key/silent fallback
          cases that can be proved statically or through a harness, plural-category
          contract violations, and user_language divergence without absurd false
          positives for product names, URLs, codes or intentional target English.

- [LC-SEC-001] Audit and safely resolve the current frontend dependency vulnerabilities
  owner:  unclaimed
  branch: none
  blocked-on: LC-QA-001
  why:    `npm ci` reports 1 moderate and 3 high vulnerabilities; severity alone is not enough to justify a forced upgrade.
  done:   record exact advisory/package/dependency paths and runtime-vs-build exposure;
          upgrade only through compatible safe ranges or document why an advisory is
          not reachable; never use `npm audit fix --force` blindly; full frontend,
          backend and rendered smoke QA remains green with no bundle regression.

- [LC-BE-001] Remove the Pydantic V1 validator deprecation safely
  owner:  unclaimed
  branch: none
  blocked-on: LC-SEC-001
  why:    backend tests pass but `ai/schemas.py` emits a V1-style `@validator` deprecation that will matter before Pydantic v3.
  done:   migrate to the supported Pydantic API without changing accepted/rejected
          provider verdict semantics; parity/refusal tests pin behaviour; compileall
          clean and pytest green without that deprecation warning.

- [LC-DOC-001] Reconcile README and historical repository debris with the real product
  owner:  unclaimed
  branch: none
  blocked-on: LC-BE-001
  why:    README still describes legacy Practice/Journey/mock/B1 behaviour and old root/frontend artifacts can mislead future agents.
  done:   README describes the current architecture and explicit local-only/deferred
          boundaries; prove whether `linguachat-frontend-old/`, `pacientes.txt` and
          `procedimientos.txt` are unused before removing anything; no owner archive
          or secret is touched; docs cannot claim A2+ curriculum, real auth, voice or
          other unavailable functionality.

## BLOCKED

- [LC-CLOUD-001] Introduce size-capped Supabase beta accounts and compact learner progress
  owner:  unclaimed
  branch: none
  why:    the owner authorized gradual Supabase use for the beta, but no LinguaChat-specific project is currently identified in the connected account and guessing could corrupt EvoLabs data.
  done:   first positively identify or deliberately create a LinguaChat Supabase
          project in a user-confirmed organization. Then implement only the staged
          minimum in `docs/architecture/supabase-beta-plan.md`: reproducible migrations,
          real Auth, profiles + compact episode/capability progress, RLS with cross-user
          denial tests, safe one-time local-state migration, offline/retry/idempotency,
          measured database bytes/user and internal size thresholds. No raw audio/video,
          indefinite chat/event logs, pgvector, Edge Functions or Storage in this
          first milestone. Security/performance advisors reviewed and two clean cycles.

- [LC-PED-002] Final all-arcs learning acceptance gate before A1 can open
  owner:  unclaimed
  branch: none
  why:    the owner requires every arc to be re-reviewed as one complete learning journey before learners can enter finished A1.
  done:   move this task to TODO only after A1 arcs 6 and 7 are implemented from the
          live blueprint/authoring contract. On the FINAL curriculum head, re-derive
          every Pre-A1 + A1 arc and run at least 20 distinct learner journeys per arc
          again (the current blueprint implies 6 Pre-A1 + 7 A1 arcs, so >=260 final
          arc scenarios if that design remains current), plus longitudinal journeys
          from a new learner through A1 exit. Prove delayed recall after intervening
          sessions, transfer to unfamiliar examples, support fading/recovery,
          independent evidence for every required can-do, no false mastery, no
          duplicate rewards, no regression in earlier arcs, cross-arc prerequisite
          reuse, and browser usability at 390px/1440px for es/ja/ar. Two consecutive
          clean full cycles after the last fix. A1 MUST remain unavailable until
          LC-PED-002 is DONE and the separate availability decision is explicitly
          approved. Simulations establish internal pedagogical correctness; claims
          about real-human learning efficacy require later real-learner pilot data.

## DONE

- [LC-I18N-002] Stop advertising languages that only fall back to English
  (phase B) — PR #30: `services/language.js`'s `LANGUAGE_OPTIONS` now carries
  a `supported` flag computed from `SUPPORTED_LOCALES` (the one real source of
  truth, unchanged) instead of every one of its 46 rows being equally
  selectable; new `isSupportedLanguage()` is the one reusable predicate.
  `LanguageIdentity`'s post-login picker now renders the 26 unimplemented
  bases as visibly disabled with a "coming soon" badge (reusing the existing
  `upcoming` key) instead of letting them be chosen and silently persisted as
  `user_language` while every string renders English fallback under a false
  label — the exact defect LC-I18N-001 finding A6 confirmed. Regional variants
  inherit their base's support (`es-CO`/`pt-BR`/`fr-CA` stay selectable,
  `zh-CN` does not), so a region row can never imply region-specific copy
  beyond its base. `ensureLanguagePreferences()` now self-heals a
  persisted-but-unsupported base instead of letting a pre-fix or hand-edited
  choice keep claiming a language forever, the same self-healing pattern
  LC-I18N-003 already applies to a legacy native/interface mismatch. Removed
  the drifted, zero-importer duplicate `LANGUAGE_OPTIONS`/`detectNativeLanguage`/
  `getLanguageName` registry in `i18n/translations.js` (finding A7 — six rows,
  missing `ja`/`ar` entirely) outright, so it can never be picked up by a
  future accidental import. New `check:language-support` (10 groups). No
  locale copy touched; `check:i18n` unchanged at 1726 base keys, 100% coverage
  es/pt/fr/it/de/ja/ar. `check:all` 56/56 (was 55), two consecutive clean
  cycles; build entry 447.81 kB / bundle-boundaries entry 438.6 kB, two
  consecutive clean cycles; backend `compileall` clean + 444 pytest passed,
  two consecutive clean cycles, unchanged. Real browser proof (Playwright/
  Chromium) at 390px/1440px for es/ja/ar (6 runs): searching "hindi" shows the
  Hindi row disabled with the locale's own "coming soon" badge; searching
  "japan" shows it enabled with no badge, and clicking it then Save actually
  persists `ja` — the supported path stays fully working end to end; no
  horizontal overflow, no console errors, no raw `{key}` leaks; Arabic
  `dir="rtl"`, Spanish/Japanese `dir="ltr"`, all six runs.
- [LC-PED-001] Stress-test every completed teaching arc with real learner-shaped
  scenarios — PR #26: new `check-pedagogical-journeys.mjs` (wired into
  `check:all`) plays all 11 completed runtime arcs (Pre-A1's six, A1's first
  five) through the real evaluator/scaffold/learner-model engine via
  `scripts/lib/journey.mjs`, with **253 distinct learner journeys** (every arc
  clears the >=20 floor): natural-variant phrasing, wrong/near-miss/nonsense +
  retry, assisted/model-copy play (with a dedicated recall-is-help-proof
  check), novel-context transfer, replay/idempotency, delayed-retrieval
  scheduling and a refusal-boundary sweep, per arc. Building the harness found
  and fixed two real defects: arc 5 (`paying_and_choosing`) was never wired
  into the harness's episode lookup so no arc-5 journey could ever play, and
  `playEpisode` had no way to substitute a natural-variant/novel-context/
  near-miss reply, so `answerOverride`/`ctxOverride`/`wrongText` hooks were
  added (all default to prior exact behaviour; no existing caller changed).
  `docs/curriculum/pedagogical-journeys-report.md` documents methodology,
  per-arc coverage, findings, and an age-sensitive usability review of the
  real session/scaffolding/profile code (no artificial time pressure, real
  session-length autonomy, a real `textSize` control, non-punitive retry
  copy, assistance never gates progress; flags one out-of-scope gap for a
  future task — `localProgress`'s streak has no grace/recovery state).
  `check:all` 55/55, two consecutive clean cycles; build entry 447.64 kB /
  bundle-boundaries entry 438.4 kB, two consecutive clean cycles; backend
  `compileall` clean + 444 pytest passed, two consecutive clean cycles,
  unchanged. Real browser proof (Playwright/Chromium, installed ad hoc with
  `--no-save` and removed afterward — `package.json` unchanged): a seeded,
  authenticated Pre-A1 `greetings` session driven through the live UI at
  390px/1440px in es/ja/ar (6 runs) — Today → episode intro → a `model` step
  → a `comprehension` choice → the `word_order` step submitted wrong then
  recovered correct via the real "Almost — the correct order is: Hi I'm
  Alex." retry copy → the following `fill_blank` step. All 6 runs: no
  horizontal overflow, no raw i18n keys, no console/page errors; Arabic
  renders `dir="rtl"` end to end at both viewports (verified visually); the
  `word_order` tokens, the retry sentence and the `fill_blank` free-text
  input all measured `lang="en" dir="ltr"` by direct DOM inspection at both
  viewports in all three locales. An earlier checkpoint of this PR's report
  had described this walk before it was actually captured (a process defect,
  since corrected) — this evidence was captured live in this session, not
  carried forward from that draft.
- [LC-PROD-001] Make placement results honest about the curriculum the app can teach
  — PR #25: `calculatePlacementResult()` still returns the diagnostic CEFR
  `level`/`detectedLevel` but now separately returns `currentCourseLevelId`/
  `currentCourseLabelKey`, derived from the curriculum registry
  (`playableLevelId()`), never assumed equal to the diagnostic score. `LevelReveal`
  shows both: the raw diagnostic badge and a new honest "what LinguaChat teaches
  you today" card, proven live in a real browser to say the same PRE-A1 course
  whether the diagnostic lands at A1 or C1. `ProgressMap`/`JourneyRail`'s "you are
  here" now derives from the same registry answer (new `COURSE_NODE_BY_LEVEL_ID`
  in `mockData.js`) instead of the raw CEFR label, so a high placement can no
  longer point the profile journey map at a Travel/Confidence/Fluency node this
  build has no content for. Home's daily planner, the session builder
  (`AppContext.jsx`) and the replay list (`CompletedEpisodes.jsx`) all now derive
  their arc from `playableLevelId()` instead of a hardcoded `PRE_A1` constant, so
  they stay correct the day a second level opens; `check-curriculum-authoring.mjs`
  was extended to enforce this per call site while Pre-A1's own frozen exit
  criteria (`readiness.js`/`preA1Map.js`) keep their literal `PRE_A1` call. New
  `check-placement-honesty` (7 groups) pins all of this. No A2+ curriculum
  invented; A1 stays `available: false`. `check:all` 54/54 (was 53), two
  consecutive clean cycles; build entry 447.64 kB / bundle-boundaries entry
  438.4 kB, two consecutive clean cycles; backend `compileall` clean + 444 pytest
  passed, two consecutive clean cycles, unchanged. Real browser proof (Playwright/
  Chromium) at 390px/1440px: a fresh signup → placement → LevelReveal walk landing
  at diagnostic B1 shows "What LinguaChat teaches you today: ... PRE-A1"; seeded
  Home/profile-journey walks for a beginner (diagnostic A1) and a learner who
  tested above current curriculum (diagnostic C1) render the identical Pre-A1
  session and "you are here: Start" journey node in both cases; Arabic renders
  RTL end to end with no horizontal overflow, no raw i18n keys and no console
  errors, and the target-English phrase stayed LTR.
- [LC-I18N-005] Detect the learner's preferred device language before login without
  geo guessing — PR #24: `detectNativeLanguage()` now returns the first
  `navigator.languages` candidate whose base is in `SUPPORTED_LOCALES`
  (`en/es/pt/fr/it/de/ja/ar`) instead of the first preference regardless of support,
  so an unimplemented device language can no longer be persisted/displayed while
  every string silently renders English; a persisted choice still always wins. New
  compact `LanguageSwitcher` (same eight locales) added to `AuthShell`/`SetupShell`
  — no manual override existed anywhere pre-login before this task. New
  `check:language-detection` (9 groups) proves the contract's QA-acceptance list
  directly against the detection function. `check:all` 53/53, two consecutive clean
  cycles; build entry 447.28 kB, two clean cycles; backend 444 pytest passed,
  unchanged. Real browser proof at 390px/1440px: es-CL/ja-JP/ar-SA resolve
  correctly (Arabic RTL), an unsupported-only preference list falls back to
  English, `pt-BR` resolves to base `pt`, and a manual switcher choice survives a
  reload under a different device preference.
- [LC-I18N-004] Localize welcome/placement/profile + plural-aware counts — PR #22:
  welcome message reads from `linguaWelcomeGreeting` via `user_language`, no
  Spanish assumption; placement instructions/prompts/options-note/feedback and the
  per-tier strengths/focus/correction/recommendation plan render through
  `instructionKey`/`promptKey`/`explanationKey`/`placementPlan<Tier>*` i18n keys
  (English practice options untouched); LanguageIdentity mood/relationship/
  progress/style literals localized; `Intl.PluralRules`-based plural categories
  replace fixed `{count}` templates (`sessionDoneCount_one/two/few/many/other`
  etc.), `check-i18n.mjs` extended to validate per-locale plural-category
  completeness. `check:i18n` 1724 base keys, es/pt/fr/it/de/ja/ar 100% coverage
  (ja 1718/ar 1748 keys reflect Japanese's no-plural vs Arabic's 6-way plural
  grammar, both structurally complete). `check:all` 52/52 scripts green, `build`
  entry 447.05 kB, two consecutive clean cycles; backend `compileall` clean +
  444 pytest passed, two consecutive clean cycles. Real browser proof at
  390px/1440px for es/ja/ar: entry, signup, placement intro/question/feedback,
  and identity/profile screens — no raw keys, no horizontal overflow, no console
  errors; Arabic renders RTL end to end (mirrored layout/nav/forms) while English
  practice content and email placeholders stay LTR.
- [LC-OPS-010] Resilience + evidence-first product contract — interactive @claude is
  triage/review only instead of a lossy long-task runner; its old issue-assignment
  path is removed and its turn ceiling raised to 80 for bounded analysis. Autonomous
  workers remain the resumable implementation path with early checkpoints. Added
  authoritative learning-science, first-launch locale-detection and size-capped
  Supabase-beta design contracts; Supabase implementation stays blocked until the
  exact LinguaChat project is identified/created.
- [LC-I18N-003] One canonical `user_language` — PR #19: `services/language.js` has
  a single storage writer so native/interface can no longer diverge through a
  supported API; `ensureLanguagePreferences()` reconciles any pre-existing
  mismatch deterministically on every load; meaning fallback simplified to
  `user_language -> English`; new `check-user-language` regression (9 groups,
  wired into `check:all`); es/ja legacy-mismatch + Arabic RTL proved in a real
  browser at 390px/1440px; backend audited and needed no change
- [LC-I18N-001] Eight-language phase-A audit — evidence in `.ai/TRANSLATIONS.md`:
  structural parity is real but hardcoded placement/profile/welcome copy,
  user_language divergence, plural gaps, support-honesty drift and RTL/fallback
  risks are not solved by 1580/1580 key counts
- [LC-OPS-009] Cloud autonomy repair — PR #17: same-run advancement after merge,
  hourly chain watchdog, one shared task selector, one Claude writer lock, red/draft
  recovery, atomic final bookkeeping, QA on ready_for_review, corrected user_language
  worker contract, and `check:cloud-automation` regression coverage
- [LC-CURR-005d] A1 arc 5 proved against the blueprint — check:a1-arc5 (19 groups),
  plus a browser walkthrough of all four episodes: happy path, a wrong answer and
  its retry, the model taken and recorded as assistance, replay without a second
  reward — PR #15
- [LC-CURR-005c] A1 arc 5 part 3 — copy in eight languages: 78 step-level
  keys (episodes 30-33 scene/instruction/model/retry/praise prose plus two
  new mini-story keys) in the English base and es/pt/fr/it/de/ja/ar,
  check:i18n at 100 % — PR #14
- [LC-CURR-005b] A1 arc 5 part 2 — backend ask_price evaluator (parity with the
  frontend), and a real fix: placeName/relationHint were dropped inside
  evaluateEpisodeResponse's own local re-evaluation, so ask_location (arc 4)
  and ask_price/state_location (arc 5) showed the wrong model answer — PR #12
- [LC-CURR-005a] A1 arc 5 part 1 — content, resolver, skeleton and the
  ask_price frame check — PR #11
- [LC-OPS-007] A run that dies leaves its work behind: push early, draft PR
  enforced by the workflow, a draft never freezes a claim, ceiling back to 150
- [LC-OPS-006] Lane parity: the i18n lane accepts the input the chain sends,
  and "one agent at a time" now counts both lanes
- [LC-OPS-005] Allow the one bot, route i18n to its own lane, true up the queue
- [LC-OPS-004] The chain heals a stale claim; max-turns 200 — PR #6
- [LC-OPS-002] Claude workflows enabled — secret, id-token: write and the GitHub
  App are all in place; OIDC and the app-token exchange both work
- [LC-OPS-003] Safe chaining: merge on green, verify, dispatch exactly one next task
- [LC-OPS-001] Autonomous-operations infrastructure — PR #1, merged as `0e5ce9f`
- [LC-CURR-004] A1 arc 4 finding_your_way (27-29) — 401113a
- [LC-CURR-003] A1 arc 3 people_around_you (24-26), incl. browser chunk recovery
- [LC-CURR-002] A1 arc 2 daily_rhythm (21-23)
- [LC-CURR-001] A1 arc 1 work_and_study (18-20)
- [LC-UI-001] Visual architecture restored and frozen — nav, Chats, flame, personalization