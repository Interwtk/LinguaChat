# STATE — where LinguaChat actually is

Rewrite this file at the end of every task. It describes measured reality, not
intentions. Live GitHub evidence wins over prose.

_Last product-content baseline: A1 arc 5 on main. LC-OPS-009 cloud automation is
merged, LC-I18N-001 audited language architecture, LC-I18N-003 (canonical
`user_language`) is complete in PR #19, LC-OPS-010 (resumable Claude lanes +
research/first-launch/Supabase-beta contracts) is merged, LC-I18N-004
(welcome/placement/profile localization + plural-aware counts) is complete in
PR #22, LC-I18N-005 (honest first-launch device-language detection) is complete
in PR #24, and LC-PROD-001 (honest placement/profile/Home curriculum agreement)
is complete in PR #25._

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

`LC-PED-001` remains the intermediate simulated-learning stress gate: >=20 distinct
learner journeys per completed runtime arc. `LC-PED-002` remains the final all-arcs
gate after A1 arcs 6–7; with today's 6 Pre-A1 + 7 A1 design it implies >=260 final
arc scenarios plus longitudinal journeys. Human efficacy claims require later real
pilot data and must not be inferred from simulated QA.

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
`Intl.PluralRules`-based plural-category model; see `.ai/TRANSLATIONS.md`.

Still open before language expansion:

- picker exposes 46 option rows / 34 base languages but only 8 full base locales
  exist (`en/es/pt/fr/it/de/ja/ar`);
- current `check:i18n` still cannot detect most semantic/claim defects beyond key
  parity and plural-category completeness (`LC-QA-001` addresses this).

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

## Ordered quality queue after LC-PROD-001

1. `LC-PED-001` — >=20 distinct learner journeys per completed runtime arc.
2. `LC-I18N-002` — truthful language support catalog; future expansion in small complete batches.
3. `LC-QA-001` — real i18n lint/regression gates.
4. `LC-SEC-001` — investigate 1 moderate + 3 high npm advisories safely.
5. `LC-BE-001` — migrate Pydantic V1 validator.
6. `LC-DOC-001` — stale README / proven-unused historical debris.

`LC-CLOUD-001` is blocked only on project identity/creation, not on owner intent.
Arc 6/7 are seeded only after the language/product/pedagogical foundation is stable.

## Other confirmed quality signals

- `npm ci`: 1 moderate + 3 high vulnerability advisories; no blind force fix.
- backend: one Pydantic V1-style `@validator` deprecation warning.
- README is materially stale.
- current auth/login/signup are localStorage mocks; they must not be marketed as
  real cloud accounts until LC-CLOUD work proves real Auth.

## Blockers

No owner-PC/OAuth/OIDC/GitHub-App blocker. Supabase cloud implementation has one
specific blocker: no safely identified LinguaChat project yet. All other work is
product/engineering quality handled through the queue and QA gates.
