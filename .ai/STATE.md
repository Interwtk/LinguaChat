# STATE — where LinguaChat actually is

Rewrite this file at the end of every task. It describes measured reality, not
intentions. Live GitHub evidence wins over prose.

_Last product-content baseline: A1 arc 5 on main. LC-OPS-009 cloud automation is
merged, LC-I18N-001 audited language architecture, LC-I18N-003 (canonical
`user_language`) is complete in PR #19, LC-OPS-010 (resumable Claude lanes +
research/first-launch/Supabase-beta contracts) is merged, LC-I18N-004
(welcome/placement/profile localization + plural-aware counts) is complete in
PR #22, LC-I18N-005 (honest first-launch device-language detection) is complete
in PR #24, LC-PROD-001 (honest placement/profile/Home curriculum agreement) is
complete in PR #25, LC-PED-001 (per-arc learner-journey pedagogical stress
test) is complete in PR #26, LC-I18N-002 (honest language-support catalog —
only the 8 implemented bases are selectable anywhere) is complete in PR #30,
LC-QA-001 (a real i18n linter over reachable source, not just dictionary
parity) is complete in PR #31, LC-SEC-001 (frontend dependency
vulnerability audit and safe resolution) is complete in PR #32, LC-BE-001
(Pydantic V2 validator migration) is complete in PR #33, and LC-DOC-001
(README rewritten for the real product, proven-unused repository debris
removed) is complete in PR #34._

## Product / repository

- Default branch: `main`; public repo `Interwtk/LinguaChat`.
- Vite + React 18 frontend, FastAPI pedagogical backend.
- Visual architecture frozen; primary nav Hoy · Chats · Palabras · Tú.
- Provider QA remains `LINGUACHAT_PROVIDER=local`.
- Voice/STT/TTS/WebRTC/pronunciation/calls/video remain deferred.
- Owner archives/secrets are not project inputs and are never touched.

## Verified QA baseline

LC-PROD-001 (PR #25), latest measured baseline:

- new `check-placement-honesty` — 7 groups proving the diagnostic CEFR placement
  level can land anywhere on the scale without moving what the app claims to
  actually teach, that an unavailable level can never acquire a `labelKey`, that
  Home/AppContext/CompletedEpisodes all derive their arc from `playableLevelId()`
  rather than a hardcoded level id, and that the profile journey map's "current"
  node agrees with that same registry answer, never the raw placement label;
- `check-curriculum-authoring.mjs` extended so each of the five scoped call sites
  is checked against its OWN required pattern (`readiness.js`/`preA1Map.js` keep
  the literal `episodesOfLevel(PRE_A1)` for Pre-A1's frozen exit criteria; Home/
  AppContext/CompletedEpisodes now require `episodesOfLevel(playableLevelId())`);
- two new i18n keys (`placementCourseHeading`, `placementCourseBody`) for the
  honest "what LinguaChat teaches you today" card in `LevelReveal`, translated in
  all seven non-English locales — `check:i18n` **1726** base keys, 100% coverage
  unchanged elsewhere;
- `check:all` **54/54** (was 53), two consecutive clean cycles;
- production build green, entry **447.64 kB** (<500 kB), two consecutive clean
  cycles; `check-bundle-boundaries` entry 438.4 kB, 26 JS chunks, 1435.0 kB total;
- backend `compileall` clean and **444 pytest passed**, two consecutive clean
  cycles, unchanged (one pre-existing Pydantic V1 `@validator` warning, tracked as
  `LC-BE-001`);
- real browser proof (Playwright/Chromium) at 390px/1440px: a fresh signup →
  placement → LevelReveal walk landing at a B1 diagnostic renders both the raw
  diagnostic badge AND "What LinguaChat teaches you today: ... PRE-A1"; seeded
  Home/profile-journey walks for a beginner (diagnostic A1) and a learner who
  tested above current curriculum (diagnostic C1) render the IDENTICAL Pre-A1
  session and "you are here: Start" journey node in both cases — the core claim
  of this task, proven live rather than only by unit assertion; Arabic renders
  RTL end to end (mirrored nav/layout), no horizontal overflow, no raw i18n keys,
  no console errors, and the target-English phrase stayed LTR.

Full detail in `.ai/TASKS.md` DONE entry for `LC-PROD-001` (prior baseline:
"LC-I18N-005" in `.ai/TRANSLATIONS.md`).

`LC-PED-001` (PR #26), latest measured baseline on top of that:

- new `check-pedagogical-journeys` — 253 distinct learner journeys across all
  11 completed runtime arcs (every arc clears the >=20 floor), played through
  the real evaluator/scaffold/learner-model engine, not fixtures; two real
  harness defects found and fixed (arc 5 unreachable, no override hooks for
  natural-variant/near-miss/novel-context play);
- `check:all` **55/55** (was 54), two consecutive clean cycles;
- build entry 447.64 kB, `check-bundle-boundaries` entry 438.4 kB, two
  consecutive clean cycles; backend `compileall` clean + 444 pytest passed,
  two consecutive clean cycles, unchanged;
- real browser proof (Playwright/Chromium, installed ad hoc and removed after
  use): a seeded Pre-A1 `greetings` session driven through the live UI at
  390px/1440px in es/ja/ar (6 runs) — a `word_order` step submitted wrong,
  recovered via the real retry copy, then completed; no overflow, no raw
  keys, no console/page errors in any run; Arabic `dir="rtl"` end to end at
  both viewports; target-English tokens/retry text/free-text input all
  measured `lang="en" dir="ltr"` by DOM inspection.

`LC-I18N-002` (PR #30), latest measured baseline on top of that:

- `LANGUAGE_OPTIONS.supported` (`services/language.js`) now derived from
  `SUPPORTED_LOCALES`; `LanguageIdentity`'s post-login picker disables the 26
  unimplemented bases with a "coming soon" badge instead of letting them be
  selected and silently persisted as `user_language` under English fallback;
  `ensureLanguagePreferences()` self-heals a persisted-but-unsupported base;
  the drifted zero-importer duplicate `LANGUAGE_OPTIONS` registry in
  `i18n/translations.js` (missing `ja`/`ar`) is removed outright;
- new `check-language-support` — 10 groups;
- `check:all` **56/56** (was 55), two consecutive clean cycles;
- build entry 447.81 kB, `check-bundle-boundaries` entry 438.6 kB, two
  consecutive clean cycles; backend `compileall` clean + 444 pytest passed,
  two consecutive clean cycles, unchanged;
- real browser proof (Playwright/Chromium, installed ad hoc and removed after
  use) at 390px/1440px in es/ja/ar (6 runs): searching "hindi" in the picker
  shows it disabled with the locale's own "coming soon" badge; searching
  "japan" shows it enabled with no badge, and selecting it then Save actually
  persists `ja` end to end; no overflow, no console errors, no raw `{key}`
  leaks; Arabic `dir="rtl"`, Spanish/Japanese `dir="ltr"`, all six runs.

`LC-QA-001` (PR #31), latest measured baseline on top of that:

- new `check-i18n-lint.mjs` (wired into `check:all` right after `check-i18n.mjs`)
  walks the real import graph from `src/main.jsx` with `@babel/parser`/
  `@babel/traverse` and gates two defect classes a dictionary-diff can never
  see: raw-key/silent-fallback (`t('typoedKey')` — every locale "has" it,
  every learner sees the literal key) and hardcoded visible auxiliary strings
  (JSXText/`aria-label`/`placeholder`/`title`/`alt` prose that was never a
  key), excluding the codebase's own `lang="en"` target-English convention;
  unreachable `.jsx` (found: `OnboardingFlow.jsx`, dead code) is reported, not
  gated;
- `check-i18n.mjs` gains a duplicate-key gate (a repeated `key:` in one
  dictionary literal silently keeps only the last value); both scripts share
  new `scripts/lib/i18nSource.mjs`;
- combined with `check:language-support` (LC-I18N-002) and `check:user-language`
  (LC-I18N-003), every defect class this task's `done` criteria named is now a
  real regression gate;
- one real defect found and fixed (not baselined): `ConversationArchive.jsx`'s
  `"+N confidence pts"` hardcoded string is now `confidencePtsGained`,
  translated in all 7 locales;
- each of the three gates (duplicate-key, raw-key, hardcoded-string) verified
  live by injecting a synthetic defect and confirming the exact gate fails
  with the right file/line, then restoring clean;
- `check:all` **57/57** (was 56), two consecutive clean cycles; `check:i18n`
  base grows to 1727 keys, 100% coverage es/pt/fr/it/de/ja/ar unchanged;
- build entry 447.85 kB, `check-bundle-boundaries` entry 438.6 kB, two
  consecutive clean cycles; backend `compileall` clean + 444 pytest passed,
  two consecutive clean cycles, unchanged;
- real browser proof (Playwright/Chromium, installed ad hoc and removed after
  use) at 390px/1440px in es/ja/ar (6 runs): a seeded learner with one real
  archived session opens Chats → Conversation archive and sees the fixed
  `confidencePtsGained` string render correctly localized ("+5 puntos de
  confianza" / "自信ポイント +5" / "+5 نقطة ثقة"); no console/page errors, no
  horizontal overflow, no raw key leaks; Arabic `dir="rtl"` end to end at both
  viewports.

`LC-SEC-001` (PR #32), latest measured baseline on top of that:

- `npm audit` on `linguachat-frontend` reported 4 advisories (1 moderate, 3
  high): postcss (`GHSA-fxqj-rqcc-2cmp`, `GHSA-r28c-9q8g-f849`, high),
  transitive nanoid (`GHSA-28wg-ghj8-5hjv`, `GHSA-2v37-7h3g-55p8`, high),
  transitive esbuild (`GHSA-67mh-4wv8-2f99`, moderate) and vite
  (`GHSA-4w7w-66w2-5vf9`, `GHSA-v6wh-96g9-6wx3`, `GHSA-fx2h-pf6j-xcff`) —
  all in devDependencies/build tooling, none reachable from the shipped
  production bundle;
- postcss/nanoid fixed by the safe non-forced `npm audit fix`: postcss
  8.5.15 → 8.5.26, still inside the existing `^8.4.38` range, zero
  `package.json` change; nanoid resolved to 3.3.18 as postcss's own
  dependency;
- esbuild/vite are dev-server-only issues (two of the three vite ones
  Windows-specific); `vite.config.js` never sets `server.host` so the dev
  server binds to localhost only, and no CI workflow runs `vite dev`/
  `npm run dev` publicly. Fixed with one controlled major bump, vite
  5.4.21 → `^6.4.3` — not the 5→8.2.2 three-major jump `npm audit fix
  --force` proposed; confirmed `@vitejs/plugin-react@4.7.0` already
  supports vite `^6` first;
- `npm audit` now reports **0 vulnerabilities**;
- `check:all` **57/57** unchanged (no new suite — this is a dependency-only
  change), two consecutive clean cycles; production build byte-identical
  before/after, same content hash, entry `450.83 kB` / gzip `131.70 kB`,
  two consecutive clean cycles; backend `compileall` clean + 444 pytest
  passed, two consecutive clean cycles, unchanged;
- no functional/runtime code changed (package.json/package-lock.json only),
  so no browser walkthrough beyond the build/bundle-boundary checks above
  applies.

`LC-BE-001` (PR #33), latest measured baseline on top of that:

- `ai/schemas.py`'s `MissionFeedback.score` validator was the only Pydantic
  V1-style `@validator` left in the backend; migrated to
  `@field_validator("score", mode="before")`. Behaviour (clamp to 0-100,
  non-numeric/`None` falls back to 0) is unchanged — verified with 8 manual
  parity cases (negative, zero, mid-range, exact bound, over bound, numeric
  string, non-numeric string, `None`), identical output before/after;
- `pytest -W error::pydantic.PydanticDeprecatedSince20` — all 444 tests pass
  with the deprecation promoted to a hard error, proving it no longer fires
  anywhere in the suite (not just in the one file touched);
- `check:all` **57/57** unchanged (frontend untouched by this task), two
  consecutive clean cycles; production build byte-identical, entry
  `450.83 kB`, two consecutive clean cycles; backend `compileall` clean +
  444 pytest passed, two consecutive clean cycles;
- no frontend/UI code changed, so no browser walkthrough applies; this is a
  backend-only internal API migration with no observable behaviour change.

`LC-DOC-001` (PR #34), latest measured baseline on top of that:

- `README.md` rewritten in English to match `CLAUDE.md`/`docs/`: Lingua/Chatto,
  the frozen Hoy·Chats·Palabras·Tú nav, current curriculum state (Pre-A1
  frozen/available, A1 arcs 1-5 built but `available: false` until all seven
  arcs pass their gates), the real `user_language` localization architecture
  (8 locales, Arabic RTL, English target never translated), and an explicit
  "what's real / what's mocked or deferred" split (mock `localStorage` auth —
  not real accounts; no cloud persistence until a dedicated `LC-CLOUD-*` task;
  no voice/media; no A2+ curriculum; no payments/deploy);
- `linguachat-frontend-old/` (a superseded Create-React-App frontend, its own
  17k-line `package-lock.json`), `pacientes.txt` and `procedimientos.txt`
  (both empty) removed after confirming via `git grep` across every tracked
  file that none of the three is referenced by any CI workflow, build script
  or source file — only by README's own stale diagram and this task's `.ai/
  TASKS.md` description, both now updated/resolved;
- no owner-owned untracked archive (`linguachat-*.zip`) or secret touched;
  nothing under `linguachat-frontend/src` or `linguachat-backend/` changed;
- `check:all` **57/57** unchanged (docs/removal-only change), two consecutive
  clean cycles; production build byte-identical, entry `450.83 kB` / gzip
  `131.70 kB`, two consecutive clean cycles; backend `compileall` clean + 444
  pytest passed, two consecutive clean cycles, unchanged;
- no runtime/UI behaviour changed, so no browser walkthrough applies beyond
  the build/bundle-boundary checks above.

## Curriculum truth

| level | state |
|---|---|
| Pre-A1 | 17 episodes, 6 arcs, frozen and available |
| A1 arcs 1–5, episodes 18–33 | runtime-ready |
| A1 arc 6, episodes 34–35 | designed only |
| A1 arc 7, episodes 36–38 | designed only |

A1 remains `contentStatus: partial`, `available: false`. No A2/B1/B2/C1/C2
structured curriculum contracts exist. Placement labels for those levels do not
mean LinguaChat can yet teach full paths at those levels.

Placement, Home's daily planner, the session builder and the profile journey map
now all derive their curriculum from `playableLevelId()` (the curriculum registry)
rather than a hardcoded level id or the raw CEFR placement label (`LC-PROD-001`,
PR #25) — this stays correct the day a second level opens instead of quietly
continuing to plan/show Pre-A1 forever.

## Pedagogical quality contract

`docs/research/learning-science-foundation.md` now records the research baseline for
learner-facing work: CEFR action-oriented can-dos; Nation's meaning-focused input,
meaning-focused output, language-focused learning and fluency strands; retrieval
practice; distributed practice; interaction/pushed output; corrective feedback;
age-sensitive adaptation; autonomy/competence/relatedness; healthy gamification and
habit formation.

It explicitly rejects pseudo-neuroscience / generic "dopamine hack" reasoning.
Product success is retained learning and healthy return behaviour, not maximum raw
time-on-screen.

`LC-PED-001` is complete (PR #26): the intermediate simulated-learning stress
gate — 253 journeys across all 11 completed runtime arcs, each clearing the
>=20-distinct-journeys floor. `LC-PED-002` remains the final all-arcs gate
after A1 arcs 6–7; with today's 6 Pre-A1 + 7 A1 design it implies >=260 final
arc scenarios plus longitudinal journeys. Human efficacy claims require later
real pilot data and must not be inferred from simulated QA — `LC-PED-001`'s
253 journeys establish internal pedagogical consistency, not human efficacy.

## Language truth

Authoritative rule:

```text
user_language = one user choice
UI / explanations / hints / corrections / meanings = user_language
target_language = English
```

LC-I18N-003 fixed native/interface divergence and simplified meaning fallback to
`user_language -> English`. LC-I18N-004 fixed the three concrete hardcoded-copy
defects LC-I18N-001 found (welcome, placement, LanguageIdentity) and added a real
`Intl.PluralRules`-based plural-category model. LC-I18N-002 closed finding A6/A7:
the post-login picker still listed 46 rows / 34 base languages, but only the 8
implemented bases (`en/es/pt/fr/it/de/ja/ar`) can now actually become the
persisted `user_language` anywhere in the product — the other 26 render
disabled with a "coming soon" badge instead of silently falling back to
English under a false language label; see `.ai/TRANSLATIONS.md`.

`LC-QA-001` (PR #31) then closed the remaining gap: `check:i18n` still only
proved dictionary parity, not that the reachable code actually calls real
keys or never hardcodes visible auxiliary prose. New `check-i18n-lint.mjs`
(AST-based, walks the real `src/main.jsx` import graph) plus a duplicate-key
gate in `check-i18n.mjs` now cover raw-key/silent-fallback, hardcoded visible
strings and duplicate locale keys as real regression gates, alongside the
unsupported-language (LC-I18N-002) and `user_language`-divergence
(LC-I18N-003) gates already in place.

## First-launch language detection — implemented (LC-I18N-005)

`docs/product/language-detection-contract.md` defines the correct approach, and
`LC-I18N-005` (PR #24) implements and browser-proves it:

- device/browser preferred-language order is the first-launch hint;
- on web/PWA use `navigator.languages` / base-locale matching;
- explicit LinguaChat choice always wins;
- region may disambiguate an implemented variant but physical country never maps to
  one assumed language;
- no GPS/IP/SIM location permission is needed for language selection;
- only honestly supported locales may be auto-selected.

`detectNativeLanguage()` (`services/language.js`) now walks `navigator.languages` in
order and returns the first candidate whose base is in `SUPPORTED_LOCALES`
(`en/es/pt/fr/it/de/ja/ar`), instead of unconditionally taking the first preference
regardless of support — the previous behaviour could set `document.lang` to an
unimplemented language (e.g. `hi`) while every string silently rendered English. A
compact `LanguageSwitcher` (new, limited to the same eight locales) is now reachable
from `AuthShell` and `SetupShell`, since no manual override existed before login
prior to this task. See `.ai/TRANSLATIONS.md` under "LC-I18N-005" for full evidence.

## Automation — LC-OPS-010 delta

The 2026-08-20 failed `Claude — mention` run was not a powered-off-PC failure. It
was the wrong execution lane for a large infrastructure task and hit the old
interactive 40-turn ceiling before remote progress.

LC-OPS-010 changes the architecture so this failure class is not used for real work:

- `Claude — mention` loses issue-assignment auto-runs and code mutation tools;
- it is explicitly triage/review only;
- bounded analysis ceiling rises from 40 to 80 turns;
- queue-sized implementation remains in autonomous task/i18n workers, which already
  checkpoint within 15 turns, push milestones and leave resumable work/release
  claims when a run ends;
- `check-cloud-automation` gains a regression that prevents the mention lane from
  silently becoming a long-running implementation path again.

No run is literally infinite; 24/7 reliability comes from resumable bounded runs +
cloud orchestration/watchdog, not one process that can never end.

## Supabase — owner authorization changed, implementation still blocked safely

The owner now authorizes gradual Supabase persistence for a friends/public beta,
with cost/size discipline. `docs/architecture/supabase-beta-plan.md` defines a
staged Auth + compact Postgres plan and internal usage thresholds below Free-plan
limits.

Live connected Supabase discovery on 2026-08-20 shows only:

- `Evolabs Platform` — ACTIVE_HEALTHY;
- `SG-Evolabs-Auth-Testing` — INACTIVE.

No LinguaChat project ref exists in the current repo/search. The inactive project
cannot be assumed to be LinguaChat merely because it is paused. `LC-CLOUD-001`
therefore stays BLOCKED until a LinguaChat-specific project is positively identified
or deliberately created in a user-confirmed Supabase organization.

Initial cloud scope when unblocked:

- real Auth;
- profiles;
- compact episode/capability progress;
- minimal learner facts actually used;
- RLS + cross-user denial tests;
- local-state migration/offline/idempotent sync;
- measured bytes/user and database growth.

No raw audio/video, indefinite chat/event logs, pgvector, Edge Functions or Storage
in the first cloud milestone.

## Ordered quality queue after LC-DOC-001

_(none — the general engineering TODO queue is empty)_. `LC-CLOUD-001` is
blocked only on project identity/creation, not on owner intent. Arc 6/7 are
seeded only after the language/product/pedagogical foundation is stable, and
`LC-PED-002` moves to TODO only once arcs 6/7 are implemented.

## Other confirmed quality signals

- `npm ci` / `npm audit`: 0 vulnerabilities (`LC-SEC-001`, PR #32).
- backend: `LC-BE-001` (PR #33) migrated `MissionFeedback.score`'s validator to
  `@field_validator(mode="before")`; `pytest -W error::pydantic.PydanticDeprecatedSince20`
  passes all 444 tests, confirming the deprecation no longer fires anywhere in
  the suite. No Pydantic V1-style `@validator` remains in the backend.
- README now matches the real product as of `LC-DOC-001` (PR #34); keep it
  current as architecture/curriculum state changes.
- current auth/login/signup are localStorage mocks; they must not be marketed as
  real cloud accounts until LC-CLOUD work proves real Auth.

## Blockers

No owner-PC/OAuth/OIDC/GitHub-App blocker. Supabase cloud implementation has one
specific blocker: no safely identified LinguaChat project yet. All other work is
product/engineering quality handled through the queue and QA gates.
