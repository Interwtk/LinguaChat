# TASKS — the queue

One task, one owner, one branch, one PR. Ids are PERMANENT: never renumber or reuse.
Move a whole task block between sections when its state changes.

## Ownership, so two agents cannot collide

A task is claimed on `main` by moving it to IN_PROGRESS and filling `owner` and
`branch` in the same commit before functional work starts. Resume an existing
branch/PR instead of duplicating it.

---

## IN_PROGRESS

_(none — the queue is open)_

## TODO — ordered; take the first unclaimed one you are allowed to do

- [LC-PED-002] Final all-arcs learning acceptance gate before A1 can open
  owner:  unclaimed
  branch: none
  why:    the full A1 curriculum is now implemented, integrated, supervisor-accepted and release-hardened, but A1 must still be re-proven end-to-end before any availability decision.
  done:   on the final integrated/hardened curriculum head, re-derive every Pre-A1 + A1 arc and run at
          least 20 distinct learner journeys per arc plus longitudinal new-learner
          journeys through A1 exit; prove delayed recall, transfer, support fading/
          recovery, independent can-do evidence, no false mastery, no duplicate
          rewards, prerequisite reuse and 390px/1440px es/ja/ar usability. Require
          two consecutive clean full cycles after the last fix. A1 MUST remain
          unavailable until this gate is DONE and a separate availability decision is
          explicitly approved.

## BLOCKED

- [LC-CLOUD-001] Cloud persistence / Supabase
  owner:  unclaimed
  branch: none
  blocked-on: explicit future owner instruction changing the current product contract
  why:    the current LinguaChat contract forbids adding Supabase/Auth/Postgres/
          Storage/pgvector/Edge Functions. Historical planning documents are
          non-operative references only and do not authorize implementation.
  done:   non-claimable while the current contract remains in force. Do not connect,
          create or modify a Supabase project for LinguaChat unless the owner gives a
          new explicit instruction that changes this rule.

## DONE

- [LC-DOC-001] Reconcile README and historical repository debris with the real product — PR #34.
- [LC-BE-001] Remove the Pydantic V1 validator deprecation safely — PR #33; migrated to `field_validator`, behavior preserved, 444 pytest.
- [LC-SEC-001] Audit and safely resolve frontend dependency vulnerabilities — PR #32; safe compatible upgrades, `npm audit` 0, no forced audit fix.
- [LC-QA-001] Extend `check:i18n` into a real source linter — PR #31.
- [LC-I18N-002] Stop advertising unsupported languages as supported — PR #30.
- [LC-PED-001] Stress-test completed teaching arcs — PR #26; 253 distinct journeys across 11 runtime arcs plus real es/ja/ar browser proof.
- [LC-PROD-001] Make placement/profile/Home honest about currently playable curriculum — PR #25.
- [LC-I18N-005] Detect preferred device language before login without geo guessing — PR #24.
- [LC-I18N-004] Localize welcome/placement/profile and plural-aware counts — PR #22.
- [LC-OPS-010] Resilience + evidence-first product contract — PR #20.
- [LC-I18N-003] One canonical `user_language` — PR #19.
- [LC-I18N-001] Eight-language phase-A audit — PR #18.
- [LC-OPS-009] Cloud autonomy repair — PR #17.
- [LC-CURR-005d] A1 arc 5 proof against blueprint — PR #15.
- [LC-CURR-005c] A1 arc 5 locale copy — PR #14.
- [LC-CURR-005b] A1 arc 5 backend/evaluator parity — PR #12.
- [LC-CURR-005a] A1 arc 5 content/resolver skeleton — PR #11.
- [LC-OPS-007] Dead runs leave resumable work behind.
- [LC-OPS-006] Writer-lane parity and shared lock.
- [LC-OPS-005] Bot allowlist and i18n routing.
- [LC-OPS-004] Stale-claim healing.
- [LC-OPS-002] Claude workflows enabled with OIDC/App token path.
- [LC-OPS-003] Safe chaining and single-next-task dispatch.
- [LC-OPS-001] Autonomous-operations infrastructure — PR #1.
- [LC-CURR-004] A1 arc 4 `finding_your_way`.
- [LC-CURR-003] A1 arc 3 `people_around_you`.
- [LC-CURR-002] A1 arc 2 `daily_rhythm`.
- [LC-CURR-001] A1 arc 1 `work_and_study`.
- [LC-UI-001] Visual architecture restored and frozen — Hoy/Chats/Palabras/Tú, navigation and personalization.

## Separate i18n lane

`LC-I18N-006` is tracked in issue #81 and remains separate from `LC-PED-002`.
It may localize integrated A2–C2 auxiliary-language copy, but must not modify curriculum logic,
evaluator behavior or level availability.
