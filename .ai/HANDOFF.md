# HANDOFF — read this, then start

Keep this file current: what just happened, what is proved, what comes next, and
what will bite the next operator.

_Written at the end of LC-I18N-003 on 2026-08-20._

## What just happened

LC-OPS-009 is merged and LC-I18N-001 audited the language architecture (full
evidence in `.ai/TRANSLATIONS.md`). LC-I18N-003 then closed the first and largest
architecture defect that audit found: `user_language` is now genuinely one value.

`services/language.js` had three storage writers (`writeLanguage('native', …)`,
`setInterfaceLanguage`) that could leave native and interface pointing at two
different languages. It now has exactly one writer (`writeUserLanguage`), and
`ensureLanguagePreferences()` rewrites both native and interface storage from the
one resolved language on **every** load — not only when nothing was stored — so a
legacy or hand-edited mismatch (e.g. `native=ja` / `interface=es`, the exact case
the audit flagged) is deterministically reconciled instead of preserved.
`AppContext` no longer exposes `updateInterfaceLanguage`; only
`updateNativeLanguage` exists, and it mirrors into both fields. Meaning fallback
(`getLocalizedMeaning`/`getLocalizedVocab`) collapsed from
`native -> interface -> English` to `user_language -> English`.

Backend was audited, not changed: `ai/openai_tutor.py`, `ai/local_engine.py` and
`ai/evaluator.py` only ever read `native_language`; `interface_language` was
accepted by the schema but never consumed divergently, so there was nothing to fix
there.

Full evidence — including the browser proof of a legacy-mismatch reload and
Arabic RTL at 390px/1440px — is in `.ai/TRANSLATIONS.md` under
`LC-I18N-003 — one canonical user_language, 2026-08-20`. PR: #19.

## The important finding (still true, narrowed)

The locale dictionaries are structurally strong; the **architecture around them**
is where most material defects live. LC-I18N-003 closed the native/interface
divergence and the two-language meaning fallback. Still open:

- welcome is hardcoded English and assumes Spanish;
- placement A1–C2 auxiliary copy is hardcoded Spanish;
- LanguageIdentity leaks English literals;
- picker: 46 rows / 34 bases, but only 8 implemented base locales;
- a stale second language registry omits ja/ar;
- `translate()` has no plural-category model;
- current `check:i18n` (now plus `check:user-language`) still cannot see the
  welcome/placement/profile hardcodes or the plural gap;
- placement can report A2–C2 even though only Pre-A1 + partial A1 structured
  curriculum exists, and the daily planner is still bound to PRE_A1.

Do not "fix translations" by mass-editing seven locale files. Follow the queue.

## Next task — LC-I18N-004

Localize visible auxiliary copy and add plural-aware count rendering.

Required behaviour:

- the Lingua welcome message (`AppContext.jsx` `WELCOME_MESSAGE`) must use
  `user_language`, not hardcoded English that assumes Spanish;
- `SetupFlow.jsx` / `placement.js` / `placementQuestions.js` auxiliary copy
  (instruction, prompt, option text, feedback explanation, strengths/focus/
  correction/recommendation) must go through `t()` in `user_language`, not
  hardcoded Spanish;
- `LanguageIdentity.jsx` mood/relationship/progress/style literals must go
  through `t()`;
- `translate()` needs a real plural-category mechanism so `{count}` templates
  (e.g. `sessionDoneCount`, `replayTimesPractised`) are grammatically correct in
  every implemented locale, Arabic especially;
- every implemented locale (es/pt/fr/it/de/ja/ar) stays structurally complete
  after the new keys land;
- real browser proof at 390px/1440px covering es/ja/ar, no raw keys, no overflow,
  no bidi leakage;
- target-English practice material stays English and untranslated.

This is still not the place to invent A2–C2 curriculum content, prune the
picker, or touch backend evaluators — those are LC-PROD-001, LC-I18N-002 and
out of scope respectively.

## Then, in order

1. `LC-PROD-001` — placement/profile/planner must tell the truth about curricula
   actually available; do not invent A2+ here and do not open partial A1.
2. `LC-I18N-002` — one truthful support catalog; 26 unimplemented bases cannot look
   fully supported because English fallback renders.
3. `LC-QA-001` — turn the audit's remaining failure classes into regression/lint
   gates (hardcoded-copy detection, plural-contract checks — user_language
   divergence detection is already covered by `check-user-language`).
4. `LC-SEC-001`, `LC-BE-001`, `LC-DOC-001` — dependency advisories, Pydantic
   deprecation, and stale docs/repo debris respectively.

After that foundation, seed Arc 6/7 from the **live** A1 blueprint + authoring
contract, then a separate final A1 completion gate. A2–C2 need a later explicit
curriculum design phase; placement questions are not a curriculum specification.

## Language-specific cautions

- Spanish: placement accents/copy debt + singular count forms are confirmed.
- Portuguese/French regional picker variants currently share one base locale; do
  not imply region-specific copy that does not exist.
- Japanese: implemented locale is real; stale six-row registry omits it.
- Arabic: Spanish placement can appear inside RTL UI; count grammar needs real plural
  categories; keep embedded English LTR and do not mirror Chatto. LC-I18N-003
  proved the shell itself (`document.dir`) is already correctly RTL for Arabic at
  both 390px and 1440px — this caution is about the copy still hardcoded inside it.
- English: even the English auxiliary experience is not clean because placement is
  Spanish and the welcome assumes Spanish support.

Naturalness/register still deserves rendered/native-quality review after the
structural defects are fixed. Static reading is not proof of native perfection.

## Keep these non-i18n signals visible

- `npm ci` reports 1 moderate + 3 high advisories; investigate dependency paths and
  compatible versions, never force-fix blindly.
- backend emits one Pydantic V1 `@validator` deprecation warning.
- README is stale and still describes legacy Practice/Journey/mock/B1 behaviour.
- login/signup are localStorage mocks; do not market them as real cloud accounts.

## Permanent traps

- Quality over speed. One task per PR.
- Count `check:all` by exit code.
- Tests are not functional proof; use browser/evaluator evidence required by CLAUDE.md.
- Never infer A1 completeness from currently-built A1 episodes.
- No Supabase, paid-provider QA, voice/STT/TTS/WebRTC/pronunciation/calls/video.
- Never touch owner archives/secrets.
- Never blind-rerun failed CI; read the log and fix the cause.
