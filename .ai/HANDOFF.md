# HANDOFF — read this, then start

Keep this file current: what just happened, what is proved, what comes next, and
what will bite the next operator.

_Written at the end of LC-I18N-001 on 2026-08-20._

## What just happened

LC-OPS-009 is merged. The development loop is cloud-hosted and no normal worker
depends on the owner's PC. PR #17 proved 51/51 checks, cloud-automation 12/12,
build green, 1580-key structural parity, compileall clean and 444 backend tests.

LC-I18N-001 then audited the eight implemented language experiences instead of
assuming “100% keys” meant “translations are finished”. The full evidence is in
`.ai/TRANSLATIONS.md` under `LC-I18N-001 — phase-A audit, 2026-08-20`.

## The important finding

The locale dictionaries are structurally strong; the **architecture around them**
is where most material defects live.

Confirmed:

- native/interface can still diverge through legacy storage/APIs;
- meaning fallback still models two auxiliary languages;
- welcome is hardcoded English and assumes Spanish;
- placement A1–C2 auxiliary copy is hardcoded Spanish;
- LanguageIdentity leaks English literals;
- picker: 46 rows / 34 bases, but only 8 implemented base locales;
- a stale second language registry omits ja/ar;
- `translate()` has no plural-category model;
- current `check:i18n` cannot see these failure classes;
- placement can report A2–C2 even though only Pre-A1 + partial A1 structured
  curriculum exists, and the daily planner is still bound to PRE_A1.

Do not “fix translations” by mass-editing seven locale files. Follow the queue.

## Next task — LC-I18N-003

Make `user_language` the one real auxiliary-language preference.

Required behaviour:

```text
user_language = one persisted user choice
UI/chrome = user_language
explanations/hints/corrections/meanings = user_language
target_language = English
```

Legacy native/interface keys may be migrated, but after migration supported product
state cannot contain two different choices. Preserve progress/preferences. Meaning
fallback becomes user language -> English. Add reload/migration regressions for es,
ja and ar. Arabic auxiliary UI is RTL; target English/input LTR; Chatto never
mirrors.

This is an architecture fix, not a copy rewrite. Do not mix placement translations,
picker support pruning or curriculum work into it.

## Then, in order

1. `LC-I18N-004` — move visible welcome/placement/profile auxiliary literals into
   i18n and add plural-aware count handling.
2. `LC-PROD-001` — placement/profile/planner must tell the truth about curricula
   actually available; do not invent A2+ here and do not open partial A1.
3. `LC-I18N-002` — one truthful support catalog; 26 unimplemented bases cannot look
   fully supported because English fallback renders.
4. `LC-QA-001` — turn the audit's failure classes into regression/lint gates.
5. `LC-SEC-001`, `LC-BE-001`, `LC-DOC-001` — dependency advisories, Pydantic
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
  categories; keep embedded English LTR and do not mirror Chatto.
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
