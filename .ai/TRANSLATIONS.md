# TRANSLATIONS — the i18n ledger

Owned by the translation track (`LC-I18N-*`). Curriculum PRs touch this file only
for the keys their own arc needs.

## Architecture — one user language, English target

The learner chooses one **`user_language`**. It governs the complete auxiliary
experience:

| surface | language |
|---|---|
| nav, buttons, settings, chrome | `user_language` |
| explanations and hints | `user_language` |
| corrections and why-it-was-wrong prose | `user_language` |
| interpretations / meanings | `user_language` |
| pedagogical support that is not target material | `user_language` |
| language being learned / practised | English (`target_language`) |

Legacy `interface_language` and `native_language` names may remain in runtime or
storage for compatibility, but they represent **the same user choice** and must stay
synchronised. They are not two independent settings.

Correct regression examples:

- Spanish learner: UI + explanations + hints + corrections + meanings in Spanish;
  English practice remains English.
- Japanese learner: the complete auxiliary experience in Japanese; English target.
- Arabic learner: auxiliary experience Arabic/RTL, target English and English input
  LTR, Chatto never mirrored.

The previous requirement `interface=es + native=ja + target=en` is **superseded and
must not be implemented or tested as a supported product state**.

NEVER translate the English the learner is practising.

## Current coverage — measured, not claimed

Latest verified main after A1 arc 5: `npm run check:i18n` reports **1580 visible
keys** in the English base and 100% key parity in the seven implemented locale
files. Key parity means structure is complete; it does **not** certify linguistic
quality, truthful support, pluralisation or absence of hardcoded strings.

| language | keys | structural coverage | current status |
|---|---:|---:|---|
| en (base) | 1580 | source | target + base auxiliary copy |
| es | 1580 | 100% | implemented; quality audit pending |
| pt | 1580 | 100% | implemented; quality audit pending |
| fr | 1580 | 100% | implemented; quality audit pending |
| it | 1580 | 100% | implemented; quality audit pending |
| de | 1580 | 100% | implemented; quality audit pending |
| ja | 1580 | 100% | implemented; quality audit pending |
| ar | 1580 | 100% | implemented; RTL/quality re-audit pending |

`LC-I18N-001` is the required quality audit before treating “100%” as anything
stronger than key parity.

## The honesty gap — LC-I18N-002

The product currently advertises substantially more language options than it has
full locale implementations. Historical snapshots counted 46 option rows and 26
additional base languages without locale files, but those numbers must be derived
again from live code during LC-I18N-002 rather than copied as truth.

Historical candidates without full locale files included:

    zh ko hi ru tr nl pl vi id th uk el he sv no da fi ro cs hu bn ur fa sw fil ms

No language may be labelled fully supported merely because English fallback keeps
the screen from crashing. The picker must tell the truth about implemented,
partial/interface-only or coming-soon support.

## Audit contract — LC-I18N-001

Audit all eight currently implemented languages for more than key counts:

- natural, idiomatic UI copy and correct register;
- missing diacritics / punctuation conventions;
- placeholder integrity and suspicious interpolation;
- plural/count grammar;
- hardcoded visible strings bypassing i18n;
- raw keys on real rendered surfaces;
- silent English fallbacks;
- consistent one-`user_language` behaviour across UI, explanations, hints,
  corrections and meanings;
- target English never translated accidentally;
- RTL direction, nested LTR English and Chatto non-mirroring.

The audit reports findings first; fixes land in small, reviewable PRs so one large
translation diff cannot hide regressions.

## How to add a language, per batch

Small batches. A language is “supported” only after the product can honestly provide
its complete auxiliary experience in that language. For each implementation batch:

- every required key present and placeholders byte-for-byte compatible;
- copy reviewed as native product copy, not literal translation;
- `check:i18n`, full `check:all`, build, compileall and pytest green;
- locale chunk lazy-loaded and within measured bundle budgets;
- browser proof at 390px and 1440px;
- RTL proof when applicable (`ar`, future `he/fa/ur` etc.);
- target English and English input remain LTR and untranslated;
- no silent fallback masquerades as support;
- no budget raised without measured justification.

Protect variables, function names and product names (LinguaChat, Lingua, Chatto).

## Known debt / queued work

- `LC-I18N-001` — audit the eight implemented languages for real quality.
- `LC-I18N-002` — make advertised support match implemented support.
- `LC-QA-001` — turn `check:i18n` from a key-parity check into a real linter for
  hardcoded visible strings, fallback leaks, raw keys, plurals and support honesty.
- Historical entry-screen Spanish and other hardcoded copy should be treated as
  audit findings and fixed from evidence rather than carried forward as unverified
  permanent assumptions.
