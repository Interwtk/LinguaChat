# TRANSLATIONS — the i18n ledger

Owned by the translation track (`LC-I18N-*`). Curriculum PRs touch this file only
for the keys their own arc needs.

## Architecture — three languages, never conflated

| | |
|---|---|
| `interface_language` | the chrome: nav, buttons, settings |
| `native_language` | explanations, hints, why-that-was-wrong |
| `target_language` | what is being learned — English today |

The case that must always work: interface `es` + native `ja` + target `en`.
Arabic: RTL chrome, LTR English target and input, Chatto never mirrored.

NEVER translate the English the learner is practising. Explanations may and should
use the native language.

## Current coverage — measured, not claimed

As of `401113a`, `npm run check:i18n` reports 1485 visible keys in the English base.

| language | keys | coverage | notes |
|---|---|---|---|
| en (base) | 1485 | source | |
| es | 1485 | 100 % | historical strings outside audited surfaces still lack diacritics |
| pt | 1485 | 100 % | |
| fr | 1485 | 100 % | |
| it | 1485 | 100 % | |
| de | 1485 | 100 % | |
| ja | 1485 | 100 % | locale chunk 84.4 kB |
| ar | 1485 | 100 % | RTL verified; chunk 86.2 kB |

## The honesty gap — LC-I18N-002

`LANGUAGE_OPTIONS` advertises 46 entries. Beyond the eight above, 26 distinct base
languages have NO locale file and silently fall back to English:

    zh ko hi ru tr nl pl vi id th uk el he sv no da fi ro cs hu bn ur fa sw fil ms

Derive that list from the code before acting on it — it is a snapshot, not truth.
A language may not be presented as supported on the strength of a fallback.

## How to add a language, per batch

Small batches. For each language: every key present, placeholders preserved
byte-for-byte, `check:i18n` green, the chunk lazy-loaded, RTL respected where it
applies (ar, he, fa, ur), no English duplicated inside the chunk, no curriculum
prose in the entry bundle, and no budget raised without the numbers.

Copy must read like real UI in that language, not like a translation. Protect
variables, placeholders, function names, product names (LinguaChat, Lingua, Chatto)
and the pedagogical English that must stay English.

## Known debt

- LC-I18N-003 — instructional prose sometimes sourced from `interface_language`
  where the architecture says `native_language`. Its own sprint, with tests; do not
  fold it into a curriculum arc.
- LC-I18N-004 — the unauthenticated entry screen still has unaccented Spanish
  ("TU COMPANERA DE INGLES", "Conversaciones pequenas").
