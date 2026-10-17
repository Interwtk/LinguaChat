# LinguaChat cloud preferences: applied foundation (2026-09-19)

**Status:** The two migrations `linguachat_learner_preferences_v1` and `linguachat_align_preference_fields_v2` were applied through the authenticated Supabase connector **only** to the existing LinguaChat project. They have NOT been applied to any other project. This document records the resulting schema; do not re-run an initial `CREATE TABLE` against that already-migrated database. The React app is NOT yet connected to it.

## Existing table `public.learner_preferences`

- `user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
- `user_language text` (`en/es/pt/fr/it/de/ja/ar`, default `es`); `target_language text` (`en` only in the current product)
- `learning_goal text` (existing local IDs `daily_conversation`, `travel`, `work`, `school`, `confidence`; extensible options `interview`, `study`, `social`, `general`)
- `interests text[]` (max 20), `correction_style` (`gentle/balanced/strict`), `tone` (`friendly/motivating/fun/professional/calm`), `pace` (`slow_clear/normal/fast`), `explanation_depth` (`very_simple/normal/detailed`)
- `english_variant` (`adaptive/us/uk`), `conversation_register` (`adaptive/casual/neutral/formal`), `updated_at timestamptz`

All fields above are learner preferences, **not** evidence of proficiency or an authorization mechanism. No raw conversations, achievements, billing country, account age, subscription entitlements or payment credentials are stored here. The age-sensitive/child-safe release is a separate design and legal gate.

RLS is enabled. Anonymous role has no table privileges. Authenticated clients have SELECT/INSERT/UPDATE/DELETE privileges and four separate policies, each restricted by `auth.uid() = user_id`; UPDATE also has `WITH CHECK`. Verified after migration: one table, RLS on, four policies, anonymous SELECT grant false and zero learner records. These structural checks alone are not a complete multi-user authorization test; run allow/deny tests with distinct authenticated users before release.

## Mapping and migration rules

The existing source of truth is `linguachat-frontend/src/services/tutorPreferences.js`; interests come from the controlled catalogue in `learning/engine/interests.js`. `cloudPreferenceMapping.js` projects a validated allowlist of those local settings into the new table without transmitting `learner_style`, local learner facts, raw dialogue or billing information. It is intentionally a PURE helper; no network calls, no account handling and no automatic localStorage replacement.

Before wiring persistence, implement and test: authenticated account creation/session handling; reliable account-to-device merge policy with opt-in and backup; separate durable learner-progress data model with concurrent-write protection and no fabricated mastery; profile deletion/export; clear UX for offline failure; RLS two-user tests; rate limiting for AI. Never infer a paid country or an adult/child authorization status from client-editable preferences. Regional prices and entitlements require verified billing/webhooks server-side.

**Quality gate:** `node linguachat-frontend/scripts/check-cloud-preferences.mjs` tests the pure mapping, but does not prove online login, synchronization or paid tutor inference. Existing `CLAUDE.md` and `.github/workflows/qa.yml` still prohibit Supabase runtime integration until a separate, explicit coordination/QA update; do not bypass those guards or merge a broken PR. Maintain Hoy/Chats/Palabras/Tú, Lingua as sole tutor, Chatto as mascot and Pre-A1 frozen.
