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

Latest verified main after LC-I18N-004 (PR #22): `npm run check:i18n` reports
**1724 visible keys** in the English base (6 plural-aware) and 100% coverage in
the seven implemented locale files. Coverage now includes plural-category
completeness, not just flat key parity; it still does not by itself certify
translation quality.

| language | keys | structural coverage | audit status |
|---|---:|---:|---|
| en (base) | 1724 | source | structural baseline; welcome/placement/profile now route through it |
| es | 1724 | 100% | implemented; plural-aware, placement/profile/welcome localized (LC-I18N-004) |
| pt | 1724 | 100% | implemented; plural-aware, placement/profile/welcome localized (LC-I18N-004) |
| fr | 1724 | 100% | implemented; plural-aware, placement/profile/welcome localized (LC-I18N-004) |
| it | 1724 | 100% | implemented; plural-aware, placement/profile/welcome localized (LC-I18N-004) |
| de | 1724 | 100% | implemented; plural-aware, placement/profile/welcome localized (LC-I18N-004) |
| ja | 1718 | 100% | implemented; fewer keys is correct — Japanese has no grammatical plural, so it needs one category per plural key instead of six |
| ar | 1748 | 100% | implemented; more keys is correct — Arabic plural grammar needs `zero/one/two/few/many/other`, all six populated |

The seven lazy locale modules actually present are `es/pt/fr/it/de/ja/ar`; English
is the base dictionary. This is the real implemented set today.

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
