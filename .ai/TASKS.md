# TASKS — the queue

One task, one owner, one branch, one PR. Ids are PERMANENT: never renumber or reuse.
Move a whole task block between sections when its state changes.

## Ownership, so two agents cannot collide

A task is claimed on `main` by moving it to IN_PROGRESS and filling `owner` and
`branch` in the same commit before functional work starts. Resume an existing
branch/PR instead of duplicating it.

---

## IN_PROGRESS

- [LC-I18N-006] Localize A1 arcs 6–7 + integrated A2–C2 curriculum auxiliary copy
  owner:  claude-i18n
  branch: i18n/lc-i18n-006
  issue:  #81
  why:    A1 arcs 6–7 and A2–C2 are integrated and structurally i18n-complete, but
          the seven auxiliary locale files still contain English placeholder
          instructional copy from the integration phase. Structural 100% key parity
          does not prove that auxiliary-language copy is semantically localized.
  done:   remove unintended English placeholder auxiliary copy from A1 arcs 6–7 and
          the integrated A2–C2 instructional surface in es/pt/fr/it/de/ja/ar while
          preserving interpolation variables and intentional target-English content;
          keep Pre-A1 frozen; keep A1 `available:false`; keep Arabic auxiliary UI RTL,
          target-English content/input LTR and Chatto unmirrored; do not change
          curriculum logic, evaluator behavior, level availability, providers,
          Supabase/voice/media or frozen visuals; prove affected explanations/hints/
          corrections/meanings with es/ja/ar functional/browser spot checks including
          390px and 1440px where rendered UI is touched; `check:i18n`, `check:all`,
          production build, backend compileall/pytest and guards green; two consecutive
          complete clean cycles on the exact final head after the last fix.

## TODO — ordered; take the first unclaimed one you are allowed to do

- [LC-OPS-025] Restore chain watchdog + post-worker resume continuity
  owner:  unclaimed
  branch: ops/lc-ops-025
  issue:  #110
  why:    live evidence across issue #110 shows a checkpointed `Claude — translations`
          worker (success or `error_max_turns` failure) has no dependable same-run wake
          for `Claude — chain`: the only follow-ups are a second `workflow_run` event
          (sometimes suppressed for GITHUB_TOKEN-dispatched runs) and a `*/5 * * * *`
          cron that has repeatedly gone stale for hours. `claude-chain.yml` also has no
          `push: [main]` trigger, unlike `curriculum-foundry.yml`. Redispatch after a
          worker failure is also not progress-gated, so a release/reclaim/merge-sync
          with a zero-diff tree can loop without producing a new checkpoint.
  note:   `next-task.mjs`'s claimability lock (`.github/scripts/next-task.mjs`, the
          `busy` check) is global: ANY task sitting in IN_PROGRESS blocks ALL new
          claims, regardless of TODO order. So while `LC-I18N-006` remains IN_PROGRESS,
          this entry cannot actually be claimed by the automated chain no matter where
          it sits in this list — reordering alone does not resolve a stalled task
          blocking the fix for its own stall. Unblocking this without silently
          weakening CLAUDE.md's stated "one IN_PROGRESS task maximum" queue lock needs
          an explicit owner decision: either (a) authorize a narrow, auditable
          exception in `next-task.mjs` for disjoint `LC-OPS-*` bootstrap tasks that
          touch no locked branch, or (b) manually `workflow_dispatch` `claude-task.yml`
          for this task while `LC-I18N-006` stays IN_PROGRESS. `.github/workflows/*`
          are outside the interactive triage lane's write scope; this task must be
          implemented by the autonomous general lane or a manually-dispatched run.
  done:   `claude-i18n.yml`/`claude-task.yml` dispatch `claude-chain.yml` directly from
          their own completion step (covering both success and `error_max_turns`) so
          recovery does not depend on a second `workflow_run` event; `claude-chain.yml`
          gains a `push: [main]` wake source alongside its 5-minute schedule fallback;
          redispatch after a worker failure is progress-gated (a no-diff release/
          reclaim/merge-sync does not count as progress or reset any attempt/backoff
          counter); existing busy/identity gates keep active-writer-skip and
          no-checkpoint/no-hot-loop behavior intact; deterministic regression fixtures
          cover same-run wake, push wake, duplicate-wake suppression, success/failure
          recovery, exact task/branch continuity, active-writer skip and no-hot-loop;
          `check:all`, production build, backend compileall/pytest and guards green;
          two consecutive complete clean cycles on the exact final head. Must not touch
          `i18n/lc-i18n-006`, PR #108, locale content, curriculum, evaluator behavior,
          level availability, providers, Supabase/voice/media or frozen visuals.

## BLOCKED

- [LC-PROD-002] Explicit A1 availability decision gate
  owner:  unclaimed
  branch: none
  issue:  #101
  blocked-on: explicit owner approval to open A1 and completion of LC-I18N-006
  why:    LC-PED-002 proved the final Pre-A1+A1 learning gate, but that proof was
          deliberately not authorization to expose A1 to learners; A1 arcs 6–7 also
          still need honest auxiliary-language localization before any release decision.
  done:   if and only if the owner explicitly approves opening A1 after LC-I18N-006 is
          DONE, make the smallest A1-only availability change and re-prove affected
          navigation/availability surfaces plus full QA and two exact-head clean cycles.
          Without approval or while LC-I18N-006 is incomplete, keep A1
          `available:false` and make no availability change.

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

- [LC-OPS-021] Continuous recovery + live Evidence hardening — PR #100; eliminated stale PR-body Evidence races, reduced watchdog fallback to 5 minutes, separated review from implementation writer concurrency, preserved durable task→checkpoint branch identity across claim release, resumed released TODO checkpoints from branch+Draft PR proof, prevented no-checkpoint hot loops, and replaced the unreliable GITHUB_TOKEN Draft→Ready second-cycle trigger with an explicitly dispatched exact-head QA cycle. Final head passed two consecutive complete clean cycles before merge.
- [LC-PED-002] Final all-arcs learning acceptance gate before A1 can open — PR #91; final integrated/hardened Pre-A1+A1 head re-proven end to end: 298 per-arc journeys across 13 arcs, a 7-proof/38-episode longitudinal Pre-A1→A1-exit new-learner journey (delayed recall, transfer, prerequisite reuse across the Pre-A1/A1 boundary, scaffold fading, assisted-vs-independent evidence, no false mastery, no duplicate replay reward), 41/41 arc-6/7 evaluator cases, and real es/ja/ar browser proof at 390px/1440px for arcs 6-7 (RTL correct, target-English stays lang=en/LTR, Chatto not mirrored, no overflow/raw keys/console errors). Also fixed a stale `check-cloud-automation.mjs` assertion left behind by an unrelated main commit (LC-OPS-019) so the suite could run clean. Two consecutive clean full non-draft QA cycles required before merge; A1 stays `available:false` — this gate does not itself open A1.
- [LC-DOC-002] Sync agent/operator contracts with the integrated A1–C2 baseline — PR #90; `CLAUDE.md` Curriculum state, `.ai/TRANSLATIONS.md` coverage table (1726→5205 base keys) and `check-a1-blueprint.mjs`'s printed conclusion aligned with the real integrated-runtime state; no curriculum/evaluator/availability/provider/visual changes.
- [LC-OPS-017] Refresh coordination after A1–C2 Foundry completion — PR #84; bookkeeping only, no runtime/curriculum/i18n/provider/visual changes; makes LC-PED-002 the next serial gate while keeping A1 unavailable.
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

`LC-I18N-006`'s current state (TODO/unclaimed or IN_PROGRESS/claimed) and owner/branch are
whatever the structured task block above says right now — read that block fresh instead of
trusting this paragraph, which is not guaranteed to be updated on every claim/release cycle.
Its `LC-I18N-*` prefix routes it to the translations worker regardless of section. Its real
scope is A1 arcs 6–7 plus integrated A2–C2 auxiliary-language instructional copy; Pre-A1
stays frozen. It remains independent from availability and must not modify curriculum logic,
evaluator behavior, level availability or frozen visuals.
