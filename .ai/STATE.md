# STATE — where LinguaChat actually is

Rewrite this file at the end of every task. It describes measured reality, not
intentions. Live GitHub evidence wins over prose.

_Last product-content baseline: A1 arc 5 on main. LC-OPS-009 cloud automation is
merged and LC-I18N-001 is complete in its audit PR._

## Product / repository

- Default branch: `main`; public repo `Interwtk/LinguaChat`.
- Vite + React 18 frontend, FastAPI pedagogical backend.
- Visual architecture frozen; primary nav Hoy · Chats · Palabras · Tú.
- No Supabase, real-provider QA, voice/STT/TTS/WebRTC/pronunciation/calls/video.
- Provider QA remains `LINGUACHAT_PROVIDER=local`.
- Owner archives/secrets are not project inputs and are never touched.

## Verified QA baseline

LC-OPS-009 final evidence established:

- `check:all` **51/51**;
- `check:cloud-automation` **12/12 groups**;
- production build green, entry **436.85 kB** (<500 kB);
- i18n structural parity **1580/1580** for es/pt/fr/it/de/ja/ar;
- backend compileall clean;
- **444 pytest passed**;
- draft→ready live QA event proved on PR #17.

LC-I18N-001 is documentation/coordination only; its PR must still pass the current
full QA gate before merge.

## Curriculum truth

| level | state |
|---|---|
| Pre-A1 | 17 episodes, frozen and available |
| A1 arcs 1–5, episodes 18–33 | runtime-ready |
| A1 arc 6, episodes 34–35 | designed only |
| A1 arc 7, episodes 36–38 | designed only |

A1 remains `contentStatus: partial`, `available: false`. No A2/B1/B2/C1/C2
structured curriculum contracts exist in the current curriculum docs; placement
badges for those levels are therefore not evidence that the app can teach a full
structured path at those levels.

The daily-session call site is currently bound to `episodesOfLevel(PRE_A1)`, which
must be reconciled before any second level becomes truly playable.

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

1. Legacy native/interface storage and APIs can still diverge; existing mismatches
   are preserved instead of migrated to one `user_language`.
2. Meanings still use `native -> interface -> English` fallback rather than one
   user language -> English.
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

1. `LC-I18N-003` — canonical user_language + safe legacy migration.
2. `LC-I18N-004` — localize welcome/placement/profile hardcodes + plural-aware counts.
3. `LC-PROD-001` — make placement/profile/planner truthful about available curricula.
4. `LC-I18N-002` — make the language picker/support claims honest.
5. `LC-QA-001` — real i18n lint/regression protection.
6. `LC-SEC-001` — investigate 1 moderate + 3 high npm advisories and upgrade safely.
7. `LC-BE-001` — migrate Pydantic V1 validator without semantic drift.
8. `LC-DOC-001` — reconcile stale README / prove unused historical debris before cleanup.

Only after the language/product-truth foundation is stable should the queue be
seeded with Arc 6/7 implementation tasks from the live A1 blueprint and authoring
contract, followed by the separate A1 completion gate. A2+ curriculum requires its
own deliberate CEFR design phase; do not invent it from placement questions.

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
