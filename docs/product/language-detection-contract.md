# LinguaChat — first-launch language detection contract

Status: product contract, 2026-08-20.

## Goal

A new learner should see the auxiliary experience in a language they already
understand from the very first screen, before login/onboarding, without asking for
location permission and without guessing a language from country alone.

`user_language` governs UI/chrome, explanations, hints, corrections,
interpretations and meanings. The target language is currently English.

## Source priority

On first launch, and only while the learner has not made an explicit LinguaChat
language choice:

1. explicit persisted LinguaChat `user_language`, if present and supported;
2. the ordered device/browser preferred-language list;
3. the first supported base-language match from that list;
4. English as the final safe fallback;
5. always expose a language switcher before/inside login/onboarding so the learner
   can override the automatic choice immediately.

On web/PWA, use `navigator.languages` (BCP 47 order) and `navigator.language` as a
fallback. Server-rendered or request-time negotiation may use `Accept-Language` as
a hint, but it must never override an explicit LinguaChat choice.

If/when native Android/iOS shells exist, use the operating system's preferred/app
language APIs. Do not invent a second geo-language system.

## Country/region is not the language source

Do **not** infer language as `country -> one language`.

Examples:

- India is multilingual. `hi-IN` can select Hindi only if Hindi is fully supported;
  `ta-IN` should select Tamil only if Tamil is fully supported; `en-IN` should remain
  English. Being physically in India is not enough to choose Hindi.
- Canada may mean English or French.
- Switzerland may mean German, French, Italian or Romansh.
- A traveller or VPN user should not have the app suddenly change languages.

Region is useful only after a language preference exists, mainly for locale
variants such as `pt-BR` vs `pt-PT`, `es-CL` vs `es-ES`, or Chinese script/region
variants when those variants are genuinely implemented.

## Supported-language honesty

Automatic detection may choose only a language that LinguaChat can actually serve
at the advertised quality level. A locale is not supported merely because English
fallback renders.

Until a language is complete, the product may:

- choose the next supported preferred language from the device list;
- fall back to English;
- show the unavailable language as "coming soon" if the picker contract allows it.

Never silently present mostly-English UI while labeling the experience Hindi,
Korean, Arabic, etc.

## Persistence and changes

- First automatic resolution is persisted as `user_language` only after the
  application has a stable supported match.
- Any manual learner choice wins permanently until the learner changes it again.
- A later operating-system language change may be offered as a suggestion, not
  forced over an explicit choice.
- Legacy `native_language` / `interface_language` storage, while it exists, must be
  reconciled to the one `user_language` value.

## Directionality

The selected auxiliary language controls document direction:

- Arabic and future RTL auxiliary locales -> chrome/explanations RTL;
- target-English practice, English examples and English input -> LTR;
- Chatto is never mirrored.

Directionality is based on the locale metadata, not on country.

## Privacy

No GPS, IP geolocation, SIM-country lookup or precise location is required for
language selection. Preferred-language settings are sufficient and are both more
accurate for multilingual users and more privacy-preserving.

## QA acceptance

A dedicated implementation task must prove at minimum:

- clean first launch with `navigator.languages = ['es-CL','en-US']` -> Spanish;
- `['ja-JP','en-US']` -> Japanese;
- `['ar-SA','en-US']` -> Arabic + RTL shell, English target LTR;
- an unsupported language followed by supported English -> English, with no false
  support claim;
- regional fallback (`pt-BR` -> base `pt`) only when the base locale is supported;
- persisted manual choice overrides later browser/device preference changes;
- no raw keys, layout overflow or mixed auxiliary language at 390px and 1440px.

## External basis

- MDN `navigator.languages`: ordered user preferred languages, BCP 47.
  https://developer.mozilla.org/en-US/docs/Web/API/Navigator/languages
- MDN `Accept-Language`: preference hint; explicit user choice must win.
  https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Language
- Android per-app language preferences / LocaleManager.
  https://developer.android.com/guide/topics/resources/app-languages
- Apple `Locale.preferredLanguages` / application localization selection.
  https://developer.apple.com/documentation/foundation/locale/preferredlanguages
