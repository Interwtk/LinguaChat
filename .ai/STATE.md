# STATE — where LinguaChat actually is

Rewrite this file at the end of every task. It describes measured reality, not
intentions. Live GitHub evidence wins over prose.

_Last product-content baseline: A1 arc 5 on main. LC-OPS-009 cloud automation is
merged, LC-I18N-001 audited the language architecture, and LC-I18N-003 (canonical
`user_language`) is complete in PR #19._

## Product / repository

- Default branch: `main`; public repo `Interwtk/LinguaChat`.
- Vite + React 18 frontend, FastAPI pedagogical backend.
- Visual architecture frozen; primary nav Hoy · Chats · Palabras · Tú.
- No Supabase, real-provider QA, voice/STT/TTS/WebRTC/pronunciation/calls/video.
- Provider QA remains `LINGUACHAT_PROVIDER=local`.
- Owner archives/secrets are not project inputs and are never touched.

## Verified QA baseline

LC-OPS-009 final evidence established:

- `check:cloud-automation` **12/12 groups**;
- i18n structural parity **1580/1580** for es/pt/fr/it/de/ja/ar;
- draft→ready live QA event proved on PR #17.

LC-I18N-001 is documentation/coordination only; its PR still passed the full QA
gate before merge.

LC-I18N-003 (PR #19) re-measured the full gate after collapsing native/interface
into one canonical `user_language`:

- `check:all` **52/52** (51 existing + new `check-user-language`, 9 groups), exit
  code 0, two consecutive clean cycles;
- production build green, entry **436.66 kB** (<500 kB), both cycles;
- backend `compileall` clean and **444 pytest passed**, both cycles (backend
  untouched — audited and confirmed it never consumed `interface_language`
  divergently);
- real browser proof at 390px/1440px: a seeded legacy `native=ja`/`interface=es`
  mismatch reconciled to `ja`/`ja` on reload, and Arabic rendered
  `document.documentElement.dir="rtl"` with no console errors or overflow at
  either width.

## Curriculum truth

| level | state |
|---|---|
| Pre-A1 | 17 episodes, 6 arcs, frozen and available |
| A1 arcs 1–5, episodes 18–33 | runtime-ready |
| A1 arc 6, episodes 34–35 | designed only |
| A1 arc 7, episodes 36–38 | designed only |

A1 remains `contentStatus: partial`, `available: false`. No A2/B1/B2/C1/C2
structured curriculum contracts exist in the current curriculum docs; placement
badges for those levels are therefore not evidence that the app can teach a full
structured path at those levels.

The daily-session call site is currently bound to `episodesOfLevel(PRE_A1)`, which
must be reconciled before any second level becomes truly playable.

## Pedagogical acceptance — new hard quality requirement

Passing evaluators and structural checks is necessary but not enough. Before more
curriculum is built on top of the existing sequence, `LC-PED-001` must stress-test
**every completed runtime arc with at least 20 distinct learner journeys per arc**.
The current runtime has 6 Pre-A1 arcs + 5 A1 arcs, so the audit is at least **220
arc-level scenarios** if the runtime count is unchanged when the task starts.

Those scenarios must exercise independent natural answers, wrong/near-miss + retry,
help/model use, nonsense/refusal, replay/idempotency, delayed recall and transfer to
a novel context. They must verify that support fades after real success, rises after
struggle, assisted/recognition-only work cannot create false mastery, prerequisites
and vocabulary/grammar ceilings hold, and rewards/progress are not duplicated.
Rendered samples must include mobile/desktop and es/ja/ar auxiliary experiences.

A second task, `LC-PED-002`, is reserved as the **final all-arcs learning acceptance
gate** and stays BLOCKED until A1 arcs 6–7 exist. On the final curriculum head it
must repeat at least 20 journeys for every Pre-A1 + A1 arc and add longitudinal
new-learner→A1-exit journeys. The current blueprint contains 6 Pre-A1 + 7 A1 arcs,
so that would be at least **260 final arc scenarios** if the blueprint remains
unchanged. A1 must not become available until this gate is DONE and the separate
availability decision is explicitly approved.

These software/simulated-learner audits can establish internal pedagogical logic,
transfer proxies and absence of false mastery; they cannot scientifically prove
that real humans learn. Any public claim of real-human learning efficacy requires
later pilot data from actual learners, kept distinct from simulated QA evidence.

## Language truth after LC-I18N-001

Authoritative product rule:

```text
user_language = one user choice
UI / explanations / hints / corrections / meanings = user_language
target_language = English
```

Structural coverage remains 1580 keys in each implemented locale, but the audit
proved that structural parity is not product completeness.

### Confirmed cross-language defects

1. ~~Legacy native/interface storage and APIs can still diverge~~ — **fixed by
   LC-I18N-003**: `services/language.js` has one storage writer, no independent
   interface-only setter is exported, and any pre-existing mismatch is
   deterministically reconciled to one value on every load.
2. ~~Meanings still use `native -> interface -> English` fallback~~ — **fixed by
   LC-I18N-003**: `getLocalizedMeaning`/`getLocalizedVocab` now resolve
   `user_language -> English` only.
3. The Lingua welcome message is hardcoded English and tells everyone they may ask
   for a word “in Spanish”.
4. Placement A1–C2 instructions/explanations are hardcoded Spanish and bypass i18n.
5. LanguageIdentity leaks English mood/relationship/progress/style literals.
6. The visible picker has **46 option rows / 34 base languages**, while only
   **8 base auxiliary locales** exist (`en/es/pt/fr/it/de/ja/ar`): 26 bases have no
   full locale implementation.
7. A second six-row `LANGUAGE_OPTIONS` in `translations.js` has drifted and even
   omits implemented ja/ar; current visible picker uses the larger service catalog.
8. `translate()` has placeholder substitution but no plural-category mechanism;
   fixed `{count}` strings are grammatically unsafe, demonstrably in Spanish and
   especially Arabic.
9. `check:i18n` currently validates missing/extra keys + placeholder parity only;
   it cannot detect most defects above.

Full evidence and per-language findings are in `.ai/TRANSLATIONS.md` under
`LC-I18N-001 — phase-A audit, 2026-08-20`.

## Ordered quality queue after the audit

1. ~~`LC-I18N-003` — canonical user_language + safe legacy migration.~~ **Done, PR #19.**
2. `LC-I18N-004` — localize welcome/placement/profile hardcodes + plural-aware counts.
3. `LC-PROD-001` — make placement/profile/planner truthful about available curricula.
4. `LC-PED-001` — >=20 distinct simulated learner journeys per completed runtime arc; fix pedagogical defects before more curriculum is layered on top.
5. `LC-I18N-002` — make the language picker/support claims honest.
6. `LC-QA-001` — real i18n lint/regression protection.
7. `LC-SEC-001` — investigate 1 moderate + 3 high npm advisories and upgrade safely.
8. `LC-BE-001` — migrate Pydantic V1 validator without semantic drift.
9. `LC-DOC-001` — reconcile stale README / prove unused historical debris before cleanup.

After that foundation, seed Arc 6/7 implementation tasks from the live A1 blueprint
and authoring contract. `LC-PED-002` is the mandatory final all-arcs gate after Arc
7 and before any A1 availability decision. A2+ curriculum requires its own
deliberate CEFR design phase; do not invent it from placement questions.

## Automation

LC-OPS-009 is live and cloud-hosted:

- chain owns scheduling/routing and has hourly watchdog;
- same-run merge→advance is the normal path;
- `next-task.mjs` is the queue authority;
- task/i18n/mention writers share one concurrency lock;
- red/draft/incomplete work is resumable;
- final TASKS/STATE/HANDOFF is atomic with task PRs;
- ready_for_review triggers QA;
- no generic Claude push loop.

The owner PC is not part of normal execution.

## Other confirmed quality signals

- `npm ci`: 1 moderate + 3 high vulnerability advisories; no blind force fix.
- backend: one Pydantic V1-style `@validator` deprecation warning.
- README is materially stale relative to frozen/current architecture.
- auth/login/signup are localStorage mocks and must not be represented as real cloud
  accounts while persistent auth remains deferred.

## Blockers

No owner-PC/OAuth/OIDC/GitHub-App blocker. Remaining work is product and engineering
quality handled through the queue and QA gates.
