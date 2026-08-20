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

- [LC-I18N-005] Detect the learner's preferred device language before login without geo guessing
  owner:  unclaimed
  branch: none
  blocked-on: LC-I18N-004
  why:    the first screen should already be understandable, but country/location is not a reliable language selector in multilingual countries or for travellers.
  done:   implement `docs/product/language-detection-contract.md`: on a clean first
          launch choose the first honestly supported locale from ordered device/browser
          preferences (`navigator.languages` on web/PWA), allow safe base-locale
          fallback, and persist one user_language; explicit user choice always wins;
          no GPS/IP/SIM location is required. Prove es-CL, ja-JP, ar-SA RTL/LTR,
          regional fallback, unsupported-first-language fallback and persisted manual
          override at 390px/1440px with no mixed auxiliary copy or raw keys.

- [LC-PROD-001] Make placement results honest about the curriculum the app can teach
  owner:  unclaimed
  branch: none
  blocked-on: LC-I18N-004, LC-I18N-005
  why:    placement can announce A1–C2 while only Pre-A1 + partial A1 have structured curriculum, and the daily planner is hard-wired to Pre-A1.
  done:   no learner is promised a structured CEFR path that does not exist; profile,
          placement reveal, Home and daily-session planning agree on what is actually
          available; unfinished A1 remains fail-closed; future level selection is
          driven by available curriculum rather than a permanent PRE_A1 constant;
          no A2+ curriculum is invented in this task; regression/browser journeys
          cover beginner plus a placement result above current curriculum.

- [LC-PED-001] Stress-test every completed teaching arc with real learner-shaped scenarios
  owner:  unclaimed
  branch: none
  blocked-on: LC-PROD-001
  why:    green structural/evaluator checks do not prove the sequence teaches well, resists false mastery, or transfers beyond memorised answers.
  done:   use `docs/research/learning-science-foundation.md`, derive the completed
          runtime arc list from live curriculum sources, and run at least 20 DISTINCT
          learner journeys per arc (not 20 duplicate asserts). Per arc cover varied
          independent natural answers, wrong/near-miss + retry, help/model use that
          remains assisted, nonsense/out-of-scope/refusal, replay/idempotency/progress
          persistence, delayed retrieval after intervening material and transfer to a
          novel context. Verify support fades after genuine success and rises after
          struggle; mastery/can-do never comes from model copying or recognition alone;
          prerequisites, vocabulary/grammar ceilings, XP/reward uniqueness and
          evaluator refusal boundaries hold. Include age-sensitive usability review
          for younger, adult and older learner profiles without assuming age=ability.
          Run rendered functional samples at 390px/1440px including es/ja/ar while
          target English stays English. Commit a per-arc pedagogical report with
          failures, fixes and evidence; any fix resets clean-cycle count. Software
          simulation is not scientific proof of human efficacy.

- [LC-I18N-002] Stop advertising languages that only fall back to English (phase B)
  owner:  unclaimed
  branch: none
  why:    the visible picker has 46 rows / 34 base languages while only 8 base auxiliary locales are implemented.
  done:   derive picker/support metadata from one source of truth; the 26 currently
          unimplemented bases are honestly unavailable, partial/coming-soon, or
          implemented before being called supported; regional variants do not imply
          region-specific copy when only a base locale exists; ja/ar cannot disappear
          through the stale six-row registry; no language is supported merely by
          English fallback. Subsequent language expansion happens in small reviewed
          batches and a language becomes selectable only when login/onboarding/UI,
          explanations, hints, corrections and meanings are genuinely complete.

- [LC-QA-001] Extend check:i18n into a real linter
  owner:  unclaimed
  branch: none
  blocked-on: LC-I18N-002, LC-I18N-004
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
