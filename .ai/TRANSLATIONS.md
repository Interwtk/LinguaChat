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

Re-measured for `LC-DOC-002` on the final integrated A1–C2 Curriculum Foundry
head (after `LC-INT-001`/`LC-SUP-002`/`LC-RC-001`), superseding the 1726-key
figure recorded when this table was last refreshed (`LC-PROD-001`, PR #25): the
base dictionary grew as the Foundry's six content lanes and shared-runtime
integration added copy. `npm run check:i18n` now reports **5205 visible keys**
in the English base (still 6 plural-aware) and 100% structural coverage in all
seven implemented locale files — zero missing, zero extra, zero placeholder
mismatches. This is structural key/plural-category parity only; a locale being
100% here is not a claim that its copy is human-reviewed translation quality,
and none of these levels is available to learners regardless of coverage.

| language | keys | structural coverage | audit status |
|---|---:|---:|---|
| en (base) | 5205 | source | structural baseline; welcome/placement/profile now route through it |
| es | 5205 | 100% | implemented; plural-aware, placement/profile/welcome localized (LC-I18N-004) |
| pt | 5205 | 100% | implemented; plural-aware, placement/profile/welcome localized (LC-I18N-004) |
| fr | 5205 | 100% | implemented; plural-aware, placement/profile/welcome localized (LC-I18N-004) |
| it | 5205 | 100% | implemented; plural-aware, placement/profile/welcome localized (LC-I18N-004) |
| de | 5205 | 100% | implemented; plural-aware, placement/profile/welcome localized (LC-I18N-004) |
| ja | 5199 | 100% | implemented; fewer keys is correct — Japanese has no grammatical plural, so it needs one category per plural key instead of six |
| ar | 5229 | 100% | implemented; more keys is correct — Arabic plural grammar needs `zero/one/two/few/many/other`, all six populated |

The seven lazy locale modules actually present are `es/pt/fr/it/de/ja/ar`; English
is the base dictionary. This is the real implemented set today — the same 8 bases
(`en` + these 7) `LC-I18N-002` now makes the ONLY selectable set anywhere in the
product, closing the gap where the post-login picker previously let a learner
choose any of 46 rows / 34 base languages.

---

# LC-I18N-002 — stop advertising languages that only fall back to English, 2026-08-20

Phase B of the LC-I18N-001 audit (findings A6/A7). PR #30, branch `i18n/lc-i18n-002`.
Touches no locale copy — the 1726/100% table above is unchanged by this task.

## What was wrong

`LanguageIdentity.jsx`'s post-login picker rendered all 46 rows of
`services/language.js`'s `LANGUAGE_OPTIONS` (34 base languages) as equally
selectable. Picking any of the 26 bases with no implemented locale
(`zh ko hi ru tr nl pl vi id th uk el he sv no da fi ro cs hu bn ur fa sw fil ms`)
persisted it as `user_language`, set `document.documentElement.lang` to it, and
then every visible string silently rendered English — the exact false-support
claim `docs/product/language-detection-contract.md` already forbade for
*automatic* detection (fixed by LC-I18N-005), but which manual selection could
still reach. Separately, `i18n/translations.js` carried its own drifted, six-row
`LANGUAGE_OPTIONS` (missing `ja`/`ar` entirely, unaccented `Espanol`/`Portugues`/
`Francais` labels) plus a dead `detectNativeLanguage`/`getLanguageName` pair —
confirmed by grep to have zero real importers anywhere in `src/`, `scripts/` or
tests, i.e. genuinely unused rather than merely superseded.

## What changed

- **`services/language.js`**: `LANGUAGE_OPTIONS` now carries a `supported`
  field computed from `SUPPORTED_LOCALES` (`i18n/translations.js`'s own export
  — the same list the lazy locale loader ships, already the one real source of
  truth used by `LanguageSwitcher` and `detectNativeLanguage`). No row is
  hand-flagged; the flag can never drift from what locale dictionaries actually
  exist. New `isSupportedLanguage(base)` is the one reusable predicate — the
  picker and `ensureLanguagePreferences` both call it rather than each growing
  their own copy of the rule. `getLanguageOption`'s custom/no-match branch and
  `searchLanguages`'s results carry the same flag through.
- **`ensureLanguagePreferences()`**: a persisted native/interface base that is
  **not** in `SUPPORTED_LOCALES` no longer survives a reload. Before this task
  the picker could persist any of the 26 unsupported bases; without this guard
  that stale choice would keep silently claiming a language forever. It now
  self-heals to the next genuinely supported device preference, or English if
  none exists — the same self-healing pattern LC-I18N-003 already applies to a
  legacy native/interface mismatch. A genuinely supported persisted choice is
  completely unaffected (proved: `ja` survives reload under a later `fr-FR`
  device preference, same as LC-I18N-005's regression).
- **`LanguageIdentity.jsx`**: the popover's option rows now render the 26
  unsupported bases as visibly disabled (`disabled`, `aria-disabled`, muted
  color, `cursor: not-allowed`, ~60% opacity) with a `t('upcoming')` badge
  ("Coming soon" — the existing key `CallSurface.jsx` already uses for
  voice/video), and their `onClick` is a no-op. They stay listed and
  searchable for roadmap visibility (per the task's "honestly unavailable,
  partial/coming-soon" options — this batch chose coming-soon over removing
  them outright) but can never become the persisted choice. The 8 supported
  rows are completely unaffected — same click-to-select-then-Save flow as
  before.
- **`i18n/translations.js`**: removed the dead duplicate `LANGUAGE_OPTIONS` /
  `detectNativeLanguage` / `getLanguageName` (LC-I18N-001 finding A7) outright,
  not merely left unused — it can no longer be picked up by a future accidental
  import and reintroduce a second, wrong source of truth that omits `ja`/`ar`.
  `SUPPORTED_LOCALES` (used elsewhere, unaffected) remains the only export of
  its kind in this file.
- New **`check:language-support`** (`scripts/check-language-support.mjs`, wired
  into `check:all`), 10 groups.

Regional variants inherit their **base**'s support, not a hand-set flag of their
own: `es-CO`/`pt-BR`/`fr-CA` (bases already implemented) stay selectable, while
`zh-CN`/`zh-TW` (base `zh`, unimplemented) are disabled exactly like plain `zh` —
so a region row can never imply region-specific copy beyond what its base locale
actually has, and the "8 supported bases" invariant can't be quietly widened by
adding a plausible-looking regional row.

## Evidence

- `check:language-support` — 10 groups: the supported base set is exactly
  `en/es/pt/fr/it/de/ja/ar`, no more (overclaiming) and no fewer (`ja`/`ar`
  cannot silently disappear now that the drifted six-row registry is gone);
  all 26 unimplemented bases are present in the catalog (still discoverable)
  but explicitly `supported:false`; `es-CO`/`pt-BR`/`fr-CA` stay supported while
  `zh-CN` does not (regional-variant honesty); `getLanguageOption` reports the
  flag correctly both directions including an unknown made-up code;
  `searchLanguages` propagates the flag through its results; a base persisted
  before this fix (simulated: `hi` written directly to the legacy storage keys)
  self-heals to the next supported device preference on reload, or to English
  with no supported preference anywhere; a genuinely supported persisted choice
  (`ja`) is completely unaffected by a later different device preference;
  `isSupportedLanguage` is exported as the one predicate; `translations.js` no
  longer exports `LANGUAGE_OPTIONS`/`detectNativeLanguage`/`getLanguageName`,
  and `SUPPORTED_LOCALES` still has exactly 8 entries.
- `check:i18n` — 1726 base keys, es/pt/fr/it/de/ja/ar all 100%, unchanged (no
  locale-dictionary edits in this task).
- `check:all` — **56/56** (was 55), two consecutive clean cycles.
- `build` — entry `447.81 kB` gzip `130.90 kB` (< 500 kB budget, +0.17 kB over
  LC-PED-001's `447.64 kB` from the `supported` computation and the picker's
  disabled-row styling), two consecutive clean cycles; `check:bundle-boundaries`
  7 boundary groups, entry `438.6 kB`, 26 JS chunks, 1435.6 kB total, two
  consecutive clean cycles.
- Backend: `compileall` clean, `pytest -q` 444 passed, two consecutive clean
  cycles — unchanged, confirming no backend edit was needed (this is a
  frontend-only picker/storage concern, same as LC-I18N-005).
- Real browser proof (Playwright against the built `dist/` via `vite preview`,
  system Chromium at `/usr/bin/chromium`, installed transiently with
  `npm install --no-save playwright` and removed afterward — `package.json`
  unchanged, same technique as every prior LC-I18N browser pass) at **390px and
  1440px** for **es/ja/ar** (6 runs), each seeded via `localStorage` into an
  authenticated session on the real "You" screen, then the real popover opened
  through the real "Change language" button:
  - Searching "hindi" in all 6 runs: the Hindi row renders `disabled` with the
    locale's own `upcoming` badge text visible (`Próximamente`/`近日公開`/`قريبًا`).
  - Searching "japan" in all 6 runs: the Japanese row stays enabled with no
    badge; clicking it then Save actually persists `lc2-native-language-base
    = "ja"` — the supported path is fully unaffected end to end, not merely
    "not disabled" in the DOM.
  - All 6 runs: no horizontal overflow, no console/page errors, no raw
    `{key}`-shaped untranslated placeholder anywhere in the visible page text.
  - `document.documentElement.dir` is `"rtl"` for `ar` and `"ltr"` for `es`/`ja`
    at both viewports, confirming the disabled-row styling doesn't break the
    existing RTL layout.

## What is still open after this task

`LC-QA-001` (turning these and other i18n failure classes into a general
linter) remains next. Actually implementing any of the 26 unsupported bases —
locale dictionaries, native-quality copy review, browser/RTL proof — is future
small-batch work per "How to add a language, per batch" below; this task made
the picker honest about what exists today, it did not add a ninth language.

---

# LC-I18N-005 — honest first-launch device-language detection, 2026-08-20

Implements `docs/product/language-detection-contract.md` for the first screen a new
learner sees, before any explicit choice exists. PR #24, branch `i18n/lc-i18n-005`.

## What changed

- **`detectNativeLanguage()`** (`services/language.js`): used to take
  `navigator.languages[0]` unconditionally via `candidates.find(Boolean)`. Any
  device preference — supported or not — was persisted as `user_language` and set
  `document.documentElement.lang` to it, while `translate()`'s locale fallback
  silently rendered English for any unimplemented locale. A device set to `hi-IN`
  therefore produced `lang="hi-IN"` with entirely English visible copy — precisely
  the false support claim the contract forbids ("never silently present
  mostly-English UI while labeling the experience Hindi"). It now walks the ordered
  preference list and returns the first candidate whose **base** language is in
  `SUPPORTED_LOCALES` (imported from `i18n/translations.js`, the same list the
  lazy-locale loader itself uses — one source of truth, not a second hardcoded set),
  falling back to English when no candidate matches. `ensureLanguagePreferences()`
  is unchanged: an already-persisted choice is still read first and always wins,
  so this only affects the very first, storage-empty launch.
- **`LanguageSwitcher`** (`components/ui/LanguageSwitcher.jsx`, new): the contract
  requires a manual override to be reachable "before/inside login/onboarding" so a
  learner can immediately fix a wrong or absent automatic detection. No such control
  existed pre-login before this task — the only language picker
  (`LanguageIdentity.jsx`, with its full 46-row aspirational catalog and search
  popover) lives inside the main app, after signup/placement/setup complete. The new
  component is a compact native `<select>` limited to the eight locales
  `SUPPORTED_LOCALES` actually implements (not the 46-row picker, so it cannot
  advertise an unsupported language), wired through the existing
  `setNativeLanguage`/`updateNativeLanguage` context API — no new persistence path.
  Added next to `ThemeToggle` in `AuthShell` (`AuthFlow.jsx`: entry/login/signup/
  forgot) and `SetupShell` (`SetupFlow.jsx`: placement/setup-choice/personality/
  learning-prefs), the two shared headers that cover every screen before the main
  app.
- **`scripts/check-language-detection.mjs`** (new, wired into `check:all` as
  `check:language-detection`): proves the contract's own "QA acceptance" list
  directly against `detectNativeLanguage()`/`ensureLanguagePreferences()` using a
  mocked `localStorage` + `navigator` (same isolated-module-per-scenario technique
  `check-user-language.mjs` uses), so the regression is pinned to the real
  first-launch code path rather than a UI-level approximation.

## Evidence

- `check:language-detection` — 9 groups: `es-CL`+`en-US` → `es` (region preserved in
  `code`, base drives locale/RTL); `ja-JP`+`en-US` → `ja`; `ar-SA`+`en-US` → `ar`;
  `hi-IN`+`en-US` → `en` (unsupported preference skipped, not honoured); `hi-IN`+
  `ko-KR`+`th-TH` with **no** supported candidate anywhere → `en` (the regression
  this task exists for — the old code would have picked `hi` unconditionally);
  `pt-BR`+`en-US` → `pt` (regional variant resolves to its supported base, not to
  English); a persisted manual choice (`ar`) survives a later "reload" that presents
  a completely different device preference (`fr-FR`); target language stays `en`
  regardless of the detected auxiliary language; a `navigator.geolocation` stub whose
  `getCurrentPosition` throws is never called — detection depends only on
  `navigator.languages`/`navigator.language`.
- `check:all` — 53/53 scripts green (new script included), two consecutive clean
  cycles.
- `build` — entry `447.28 kB` gzip `130.70 kB` (<500 kB budget, +0.23 kB over
  LC-I18N-004's `447.05 kB` from the new switcher component), two consecutive clean
  cycles; `check:bundle-boundaries` 7 boundary groups, entry `438.0 kB`, 26 JS
  chunks, 1432.1 kB total.
- Backend: `compileall` clean, `pytest -q` 444 passed — unchanged, confirming no
  backend edit was needed (detection is a frontend-only, `navigator`-driven
  concern).
- Real browser proof (Playwright against the built `dist/` via `vite preview`,
  system Chromium at `/usr/bin/chromium`, installed transiently for this task and
  **not** added to `package.json` — same as the prior LC-I18N-003/004 browser
  passes) at **390px and 1440px**, each context seeded with `navigator.languages`
  via `addInitScript` before any page script runs:
  - `['es-CL','en-US']` → `document.documentElement.lang="es-CL"`, `dir="ltr"`,
    entry title renders in Spanish, no raw `{key}` placeholders, no horizontal
    overflow, no console errors, at both viewports.
  - `['ja-JP','en-US']` → `lang="ja-JP"`, `dir="ltr"`, entry title in Japanese, same
    clean checks at both viewports.
  - `['ar-SA','en-US']` → `lang="ar-SA"`, `dir="rtl"`, entry title in Arabic, same
    clean checks at both viewports; Chatto is not mirrored (icon only, no directional
    asset) and the English target phrase inside placement is unaffected by this
    change (untouched by this task).
  - `['hi-IN','ko-KR']` (no supported candidate at all) → `lang="en"`, confirming the
    fallback holds even when nothing in the preference list is a supported base.
  - `['pt-BR','en-US']` → `lang="pt-BR"` (base `pt`), confirming the regional
    fallback resolves to the implemented base instead of dropping to English.
  - Manual override: with device preference `en-US`, selecting Arabic from the new
    `LanguageSwitcher` on the entry screen immediately set `lang="ar"`/`dir="rtl"`;
    reloading the same page with the device preference now claiming `ja-JP` left the
    interface on `lang="ar"` — the explicit choice was not overwritten by a later
    automatic re-detection, per the contract's "any manual learner choice wins
    permanently until the learner changes it again."
  - No test used `navigator.geolocation`, IP lookup or any permission prompt.

## Known pre-existing issue observed, not fixed here

The Spanish entry screen renders `entryTitle: 'Practica ingles'` (missing the accent
on "inglés", `es.js:565`). This is unrelated to detection/switcher logic, was not
introduced by this change, and falls under the native-copy review LC-I18N-001
already flagged for Spanish (missing diacritics) — left for a future small-batch
copy pass rather than fixed inside this detection-logic task.

---

# LC-I18N-004 — welcome/placement/profile localization + plural categories, 2026-08-20

Resolves the three concrete defects LC-I18N-001 confirmed by code (A3 welcome,
placement Spanish-only, LanguageIdentity English leaks) plus the missing
plural-category model. PR #22, branch `i18n/lc-i18n-004`.

## What changed

- **Welcome message** (`AppContext.jsx`): `WELCOME_MESSAGE` constant replaced with
  `createWelcomeMessage(language)`, rendering `linguaWelcomeGreeting` through
  `translate()` instead of a hardcoded English string that assumed the reader
  could parse "ask for a word in Spanish."
- **Placement flow** (`SetupFlow.jsx`, `services/placement.js`,
  `data/placementQuestions.js`): every question's `instruction`/`prompt`/
  `explanation` and the aggregate `skill` field became `instructionKey`/
  `promptKey`/`explanationKey`/`skillKey`, resolved via `t()` at the call site.
  `levelPlan()` in `services/placement.js` no longer hardcodes Spanish
  strengths/focus/correction/recommendation text per CEFR tier — it now looks up
  `placementPlan<Tier>Strength1/2`, `...Focus1/2/3`, `...Correction`,
  `...Recommendation` through `translate(language, key)`, with `language` passed
  down from `calculatePlacementResult(state, language)`. The English practice
  options themselves (`Where you live?` etc.) are untouched — only the
  auxiliary instruction/explanation/plan prose moved to `user_language`.
- **LanguageIdentity** (`LanguageIdentity.jsx`): mood, relationship, progress-path
  and tutor-style literals localized; option config (`PERSONALITIES`,
  `GOAL_OPTIONS`, `VIBE_OPTIONS`, `CORRECTION_OPTIONS`) consolidated into
  `services/tutorPreferences.js`, shared between `SetupFlow.jsx` and
  `LanguageIdentity.jsx` so the same id -> label-key mapping cannot drift
  between the two screens.
- **Plural categories** (`i18n/translations.js`, all seven locale files,
  `scripts/check-i18n.mjs`): count copy (`sessionDoneCount` etc.) now resolves
  through `Intl.PluralRules` per-locale categories instead of a single
  `{count}` template string. `check-i18n.mjs` validates that every plural-aware
  base key has all categories a given locale's `Intl.PluralRules` actually uses
  (Japanese: `other` only; Arabic: `zero/one/two/few/many/other`) rather than
  assuming English's `one/other` split universally.

## Evidence

- `check:i18n`: 1724 base keys (6 plural-aware), es/pt/fr/it/de/ja/ar all 100%
  coverage (ja 1718 keys, ar 1748 keys — see table above for why those counts
  differ from 1724 and are still "100%").
- `check:all`: 49/49 scripts green, two consecutive clean cycles.
- `build`: entry `447.05 kB` gzip `130.83 kB` (< 500 kB budget), two consecutive
  clean cycles; `check-bundle-boundaries` 7 boundary groups, entry `437.8 kB`,
  25 JS chunks, 1431.1 kB total.
- Backend: `compileall` clean, `pytest -q` 444 passed, two consecutive clean
  cycles (one pre-existing Pydantic V1 `@validator` deprecation warning,
  tracked separately as `LC-BE-001`, unrelated to this change).
- Real browser proof (Playwright against a local `vite` dev server, system
  Chromium) at 390px and 1440px for es/ja/ar: entry screen, signup form,
  placement intro/question/feedback, and the identity/profile screen. No raw
  `t()` keys rendered, no `document.documentElement.scrollWidth` overflow past
  viewport width at any captured screen, no browser console errors. Arabic
  renders `dir="rtl"` on both `<html>` and inside the flow (mirrored sidebar/nav
  on desktop, mirrored form layout on mobile) while English placement options
  and the `you@example.com` email placeholder correctly stay LTR. Chatto is not
  present on the identity screen (avatar only), so no mirroring regression to
  check there.

---

# LC-I18N-001 — phase-A audit, 2026-08-20

This audit is intentionally **diagnostic only**. It does not bulk-edit translation
copy. Findings below are separated into what static/runtime code proves and what
still needs rendered/native-speaker quality review.

## A. Cross-language defects confirmed by code

### A1. The product can still persist two different languages

`services/language.js` stores separate native and interface keys and
`ensureLanguagePreferences()` preserves an already-stored mismatch instead of
reconciling it. `AppContext` still exposes a separate `updateInterfaceLanguage()`.

At the same time, `updateNativeLanguage()` sets both values together. This means
normal use often looks correct, but old storage or an internal caller can still
produce the product state the owner explicitly rejected.

**Impact:** all eight language experiences.

Required fix: one canonical `user_language`; legacy native/interface storage may be
read during migration but must deterministically converge to the same value and may
not be independently writable through supported product APIs.

### A2. Meanings still implement the superseded two-language fallback

`localizedMeaning.js` resolves in this order:

1. native full code;
2. native base;
3. interface base;
4. English.

`learningContent.js` therefore still accepts both native and interface language.
Under the corrected product contract there is only `user_language -> English
fallback` for auxiliary meaning text.

**Impact:** all languages; especially legacy-mismatch users.

### A3. The welcome message bypasses i18n and assumes Spanish

`AppContext.jsx` hardcodes the initial Lingua message in English and includes:
“ask for a word in Spanish”. It does not use `user_language` at all.

**Impact:** every non-English interface sees English auxiliary copy; Japanese,
Arabic, Portuguese, French, Italian and German users are explicitly told to ask in
Spanish. The assumption is also conceptually wrong for an English-interface user.

### A4. Placement is Spanish-only while claiming A1–C2

`SetupFlow.jsx` renders placement question `instruction`, `prompt`, option text and
feedback explanation directly rather than through `t()`.

`placement.js` contains the level-plan strengths/focus/correction/recommendation in
hardcoded Spanish, including missing diacritics in several strings.

`placementQuestions.js` defines `CEFR_LEVELS = ['A1','A2','B1','B2','C1','C2']` but
all auxiliary instructions/explanations are hardcoded Spanish.

**Impact by user language:**

| user_language | placement auxiliary experience today |
|---|---|
| es | understandable, but contains accent/copy debt |
| en | Spanish instructions/explanations |
| pt | Spanish instructions/explanations |
| fr | Spanish instructions/explanations |
| it | Spanish instructions/explanations |
| de | Spanish instructions/explanations |
| ja | Spanish instructions/explanations |
| ar | Spanish instructions/explanations inside an RTL shell |

This is both i18n debt and **product-truth debt**: the placement can announce A2,
B1, B2, C1 or C2 even though the structured curriculum repository currently has
only frozen Pre-A1 and partial A1 contracts/runtime. The daily-session planner is
also currently wired to `episodesOfLevel(PRE_A1)`. A learner can therefore be shown
a high CEFR badge without receiving a structured curriculum at that level.

Do not solve this by inventing A2–C2 content inside an i18n PR. Product truth and
future CEFR curriculum design need their own task.

### A5. Profile / Language Identity has visible English literals

`LanguageIdentity.jsx` contains visible labels outside i18n, including:

- mood names: `Calm`, `Energetic`, `Grounded`, `Playful`;
- relationship stages: `New acquaintances`, `Familiar faces`, `Steady companions`,
  `Close companions`, `Long-time partners`;
- `Now` in progress data;
- fallback `B1`;
- `Gentle Guide` plus literal `style`.

These are visible auxiliary strings and must follow `user_language`.

`JourneyRail` is rendered there as an **embedded section**, not a global navigation
rail. That is not itself a frozen-architecture violation; do not remove it merely
because the component name is historical.

### A6. The visible language picker advertises far more than implemented locales

`services/language.js`, which feeds `LanguageIdentity`, contains **46 option rows**
covering **34 base languages**. Only 8 base languages have an implemented auxiliary
locale today: `en/es/pt/fr/it/de/ja/ar`.

That leaves **26 base languages without full locale implementations**:

`zh ko hi ru tr nl pl vi id th uk el he sv no da fi ro cs hu bn ur fa sw fil ms`

Variants such as `zh-CN`, `zh-TW`, `es-CO`, `pt-BR` are options, not additional base
locale implementations. LC-I18N-002 must make the support claim honest rather than
counting picker rows as languages.

### A7. Two language-option registries have drifted

`services/language.js` has the 46-row picker catalog. `i18n/translations.js` also
exports a separate `LANGUAGE_OPTIONS` containing only six rows (`es/en/pt/fr/it/de`)
and omits implemented `ja/ar`; its display labels also contain unaccented
`Espanol`, `Portugues`, `Francais`.

Current code search found the visible picker using the service catalog; no product
consumer of the six-row export was established during this audit. Treat it as
**confirmed source-of-truth drift / likely dead API**, not as proof of a visible
bug. Consolidate only after usage is proved.

### A8. No pluralisation mechanism exists

`translate()` performs key lookup plus `{placeholder}` replacement only. It has no
plural-category selection.

Visible count strings such as `sessionDoneCount` and `replayTimesPractised` use one
fixed template. Spanish already demonstrates the issue (`1 actividades
completadas` is possible). Arabic requires multiple grammatical number categories,
so one fixed Arabic template cannot be generally correct either.

**Impact:** potentially all locales; severity varies by grammar. This is a QA/system
gap, not something to patch by adding one Spanish conditional in a component.

### A9. Current `check:i18n` cannot detect the defects above

It checks only:

- missing keys;
- extra keys;
- placeholder-name parity.

It does **not** detect hardcoded visible strings, raw-key rendering in real UI,
silent English fallback, plural/count grammar, duplicate source keys,
user-language divergence, advertised-but-unimplemented languages or RTL semantic
mistakes. This confirms LC-QA-001 is necessary.

## B. Per-language audit summary

“Confirmed” below means supported by current source/runtime structure. “Review”
means linguistic naturalness still requires rendered/native-quality inspection; no
claim of native-language perfection is made from static reading alone.

### English (`en`)

- Base dictionary: 1580 keys.
- Confirmed: placement/support content bypasses dictionary and is Spanish, so an
  English auxiliary experience is not fully English.
- Confirmed: welcome is English but assumes Spanish as the user's support language.
- Confirmed: profile literals happen to be English, masking the fact they bypass
  localisation.
- Confirmed: count system has no plural engine.
- Review: tone consistency and whether target-English examples are clearly
  distinguished from auxiliary English when both are visually identical.

### Spanish (`es`)

- 1580/1580 structural parity; placeholders structurally green.
- Confirmed: placement copy is Spanish but contains documented missing diacritics
  (`ingles`, `basicas`, `proxima`, `corregira`, etc.).
- Confirmed: `sessionDoneCount` uses one plural template and can produce singular
  errors such as `1 actividades completadas`.
- Confirmed: LanguageIdentity English mood/relationship/style literals leak into
  Spanish UI.
- Review: older episode/tutorial phrasing and regional neutrality; stale keys that
  mention “Práctica” are not automatically visible defects and must be checked at
  their consumer before editing.

### Portuguese (`pt`)

- 1580/1580 structural parity; placeholders structurally green.
- Confirmed: placement is Spanish, welcome is English/Spanish-assumptive, and
  profile mood/relationship literals are English.
- Confirmed: no locale-aware plural mechanism.
- Review: Brazilian-vs-European neutrality and count/gender agreement in rendered
  surfaces. `pt-BR` / `pt-PT` picker variants currently resolve to one base `pt`
  auxiliary locale, so the product must not imply region-specific copy unless it
  actually provides it.

### French (`fr`)

- 1580/1580 structural parity; placeholders structurally green.
- Confirmed: placement Spanish; welcome/profile hardcoded leaks; no plural engine.
- Confirmed: `fr-CA` picker variant maps to base `fr`; no separate Canadian French
  locale exists.
- Review: register consistency (`tu`), typography/spacing around French
  punctuation, and regional claim honesty.

### Italian (`it`)

- 1580/1580 structural parity; placeholders structurally green.
- Confirmed: placement Spanish; welcome/profile hardcoded leaks; no plural engine.
- Review: natural register, gender/number agreement and count strings in rendered
  UI.

### German (`de`)

- 1580/1580 structural parity; placeholders structurally green.
- Confirmed: placement Spanish; welcome/profile hardcoded leaks; no plural engine.
- Review: compound/long-label layout at 390px, case/gender agreement in
  interpolation and consistency of informal `du` register.

### Japanese (`ja`)

- 1580/1580 structural parity; placeholders structurally green.
- Confirmed: placement Spanish; welcome/profile hardcoded leaks.
- Confirmed: Japanese is implemented but omitted by the duplicate six-row
  `translations.js` language registry.
- Review: natural product register, punctuation/spacing around embedded English,
  line wrapping at 390px and whether count phrases need Japanese counters rather
  than literal Western constructions.

### Arabic (`ar`)

- 1580/1580 structural parity; placeholders structurally green.
- Confirmed: main document/profile RTL decision is currently keyed specifically to
  `base === 'ar'`; this works for Arabic today but is not a reusable RTL-language
  model for future Hebrew/Persian/Urdu support.
- Confirmed: placement inserts Spanish auxiliary text inside the Arabic RTL
  experience.
- Confirmed: target-English phrases are intentionally present in Arabic support
  copy; these must remain LTR and must not be mistaken for untranslated leakage.
- Confirmed: a single `{count}` template cannot model Arabic plural categories.
- Review: nested bidi isolation for every English token/example/input, punctuation,
  line wrapping, focus order and Chatto non-mirroring in real rendered screens.

## C. Raw keys / silent fallback assessment

The normal translator falls back `locale dictionary -> English base -> raw key`.
Current structural QA proves implemented locale files contain all 1580 base keys,
so a missing-key English fallback is not expected for those keys at this commit.
That does **not** prove no raw key can render from an unknown/dynamic key at runtime.
Rendered-route tests are still required.

Unsupported picker languages do fall through the locale-loader/fallback model rather
than possessing their own complete auxiliary dictionary. That is the material
support-honesty defect addressed by LC-I18N-002.

## D. Fix order created from this audit

Do not bulk-fix seven locale files at once. The safe order is:

1. **LC-I18N-003 — canonical `user_language` + legacy migration.** Remove supported
   interface/native divergence, reconcile old storage, simplify meaning fallback,
   and add es/ja/ar reload + RTL/LTR regressions.
2. **LC-I18N-004 — visible hardcoded auxiliary copy.** Move welcome, placement and
   LanguageIdentity literals into the one-language i18n path; add plural-aware
   count handling rather than one-off singular hacks.
3. **LC-PROD-001 — placement/curriculum truth.** A placement result may not promise
   a structured A2–C2 learning path that does not exist, and the daily planner may
   not stay permanently bound to Pre-A1 once another level becomes truly
   available. Solve product truth without opening unfinished A1 or inventing A2+.
4. **LC-I18N-002 — support/picker honesty.** Derive the one language catalog from
   real support metadata; 26 unimplemented bases must be honestly unavailable,
   partial/coming-soon, or implemented before being called supported.
5. **LC-QA-001 — real i18n linter.** Pin the failure classes above so they cannot
   return.

After those structural fixes, perform language-specific native/rendered copy PRs in
small batches. “1580/1580” must never again be reported as synonymous with
“translation quality is finished.”

## E. Separate non-i18n quality signals discovered while auditing

These are not fixes for this audit PR, but they affect the owner's “deliverable
product” goal and must remain visible:

- `README.md` is materially stale: it still describes Practice/Journey/mocks and a
  B1 payload in ways that no longer match the frozen architecture/current product.
- auth/login/signup are localStorage mocks while their UI can look account-like;
  product must be honest about local-only identity until real persistence is an
  authorised scope.
- current repo has no A2/B1/B2/C1/C2 curriculum contracts; only Pre-A1 and A1
  curriculum documents exist. Supporting “any level” therefore requires deliberate
  post-A1 CEFR curriculum design, not merely exposing the placement badges.
- `npm ci` reports 1 moderate + 3 high dependency vulnerabilities; audit affected
  dependency paths before upgrading, never `npm audit fix --force` blindly.
- backend has a Pydantic V1 `@validator` deprecation warning to migrate before
  Pydantic v3.

---

# LC-I18N-003 — one canonical `user_language`, 2026-08-20

Closes the architecture defect A1 (and simplifies A2) from the phase-A audit:
`services/language.js` used to have three writers (`writeLanguage('native', …)`,
`setInterfaceLanguage`) that could leave native and interface storage pointing at
two different languages. It now has exactly one writer, `writeUserLanguage()`,
called by the one exported setter (`setNativeLanguage`, aliased in `AppContext` as
`updateNativeLanguage`). There is no `setInterfaceLanguage` export and no
`updateInterfaceLanguage` context API left to call independently.

`ensureLanguagePreferences()` rewrites both native and interface storage from the
one resolved language **every load**, not only when nothing was stored — this is
what deterministically reconciles a legacy or hand-edited mismatch (e.g.
`native=ja` / `interface=es`, the exact state LC-I18N-001 flagged) instead of
preserving it.

`localizedMeaning.js`'s `getLocalizedMeaning()` and `learningContent.js`'s
`getLocalizedVocab()` dropped their second `interfaceLanguage` argument: the
fallback chain is now `user_language full code -> user_language base -> English`,
matching the corrected product contract. The three call sites that used to pass
both (`TodayView`, `MemoryGarden`, `EpisodeShell`) now pass one.

Backend was audited, not changed: `ai/openai_tutor.py`, `ai/local_engine.py` and
`ai/evaluator.py` only ever read `native_language` for explanations/corrections;
`interface_language` is accepted by the schema but was never consumed to produce
divergent auxiliary-language behaviour, so no backend fix was required for this
task.

## Measured evidence

- `npm run check:i18n` — 1580/1580 keys, 100% parity across es/pt/fr/it/de/ja/ar;
  unaffected by this change (no locale-dictionary edits).
- New `npm run check:user-language` (`scripts/check-user-language.mjs`, wired into
  `check:all`) — 9 groups: no independent interface-only setter exported; es/ja/ar
  each survive a simulated reload with native/interface still equal; a seeded
  legacy `native=ja` / `interface=es` mismatch collapses to one language
  (`ja`/`ja`) and the interface storage key itself is rewritten, not merely
  shadowed; target language stays English regardless of `user_language`;
  `getLocalizedMeaning` falls back to English, never to a third language.
- `npm run check:all` — 52/52 scripts, exit code 0, two consecutive clean cycles.
- `npm run build` — exit code 0 both cycles; entry bundle 436.66 kB (<500 kB budget
  unchanged); `check-bundle-boundaries` OK.
- Backend: `python -m compileall .` clean and `python -m pytest -q` 444 passed,
  both cycles — unchanged, confirming the backend truly needed no edit.
- Real browser proof (Playwright/Chromium against the Vite dev server) at **390px
  and 1440px**: seeded legacy `native=ja`/`interface=es` localStorage and reloaded
  — the app converged to `native=ja, interface=ja`
  (`document.documentElement.lang="ja"`), all auxiliary copy rendered in Japanese.
  Set Arabic through the one supported path and reloaded —
  `document.documentElement.dir="rtl"`, layout mirrored correctly at both widths,
  no horizontal overflow, the target-English phrase (`"Can I have water?"`) stayed
  LTR/untranslated, Chatto was not mirrored, and `console --errors` was empty at
  both viewports.
- The pre-existing hardcoded-English welcome bubble (LC-I18N-001 finding A3) is
  still visibly present and unchanged — confirmed out of scope for this task and
  left for LC-I18N-004, not silently fixed or silently left undocumented.

## What is still open after this task

A1 (native/interface divergence) and the two-language meaning fallback half of A2
are closed. Still open, unchanged by this task and tracked by their own ids:
welcome/placement/profile hardcodes (LC-I18N-004), placement/curriculum truth
(LC-PROD-001), picker/support honesty (LC-I18N-002), plural-aware count rendering
(LC-I18N-004), and a real i18n linter (LC-QA-001).

---

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
