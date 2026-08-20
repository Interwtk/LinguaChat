# HANDOFF — read this, then start

Keep this file short and current: what just happened, what is still being proved,
what comes next, and what will bite the next operator.

_Written during LC-OPS-009 / PR #17 on 2026-08-20._

## What just happened

A1 arc 5 (`paying_and_choosing`, episodes 30–33) is already complete on main. Its
four PRs delivered content/resolver, evaluator parity + a routing bug fix, all eight
current locale copies, and `check:a1-arc5`; a later production-build browser
walkthrough covered all four episodes, wrong-answer retry, model/help assistance and
replay without duplicate reward. Do **not** redo arc 5.

The automation then exposed another seam. After arc 5 bookkeeping became correct,
the queue had `LC-I18N-001` claimable but no event woke the next worker. On
2026-08-20 the owner also triggered issue #16 through `@claude`; run `32331959420`
authenticated correctly on a GitHub-hosted Ubuntu runner but died at the interactive
lane's 40-turn ceiling (`error_max_turns`, turn 41, zero permission denials) before
pushing a remote branch. Issue-mode Claude also cannot modify `.github/workflows`,
so that was the wrong execution lane for an infrastructure repair.

ChatGPT supervisor claimed `LC-OPS-009` on main (`393fe540`) and is implementing the
workflow repair directly in PR #17, branch `ops/lc-ops-009-cloud-autonomy-v2`.

## PR #17 — what the candidate repair changes

- `Claude — chain` advances in the SAME workflow invocation after it merges a green
  agent PR; it no longer relies on GitHub generating a second workflow event from a
  `GITHUB_TOKEN` merge.
- The chain has an hourly watchdog (`17 * * * *`) as a recovery net.
- General and i18n workers no longer have their own schedules.
- `next-task.mjs` is the one selector; an explicit task id that is not currently
  claimable is refused safely and each lane refuses the other's task family.
- `claude-task`, `claude-i18n` and `claude-mention` share one writer concurrency
  group.
- A shared merge script requires green checks, `## Evidence`, and for queue-backed
  task branches final `.ai/TASKS.md` + `.ai/STATE.md` + `.ai/HANDOFF.md` bookkeeping
  in the same PR. The task must be under DONE on the branch before merge.
- Watchdog recovery can merge a READY green PR whose event was missed. A dead/red
  READY PR is returned to draft and its claim released so the **same branch/PR** can
  be resumed rather than deadlocking or duplicating work.
- QA listens to `ready_for_review` explicitly.
- Autonomous prompts now carry the owner-corrected language rule: ONE
  `user_language` for UI + explanations + hints + corrections + meanings; English
  is the target language. Legacy interface/native names are one synchronized choice.
- `check:cloud-automation` was added to `check:all` with focused routing/locking/
  schedule/same-run/language/queue fixtures.

This description is implementation state, not acceptance evidence. **Read PR #17
and its latest GitHub Actions before assuming any of it is verified.**

## Next action

1. Finish PR #17 documentation/bookkeeping and inspect its draft QA.
2. Fix every real failure at root cause; do not rerun blindly.
3. Because this task already involved fixes, obtain **two consecutive clean full QA
   cycles** after the final fix.
4. Replace PR #17's pending Evidence section with exact focused-check, check:all,
   build, compileall and pytest numbers.
5. Move LC-OPS-009 to DONE on the PR branch, update STATE/HANDOFF, then mark ready.
   `ready_for_review` must itself trigger a fresh QA run.
6. Merge only after that ready-state QA is green. The new chain/watchdog should then
   discover the next claimable task without owner-PC involvement.

After LC-OPS-009, the current queue intentionally starts with:

- `LC-I18N-001` — audit the eight implemented languages for real quality, not key
  counts;
- `LC-I18N-002` — make advertised language support truthful;
- `LC-QA-001` — strengthen i18n linting.

A1 arcs 6–7 are designed in the live blueprint but are not yet queued. Do not invent
their task contracts from this handoff; read the blueprint/authoring contract when
seeding them after the infrastructure/i18n base is honest.

## Language rule — do not regress this again

The old three-independent-language contract is obsolete.

```text
user_language = the user's language
UI / explanations / hints / corrections / meanings = user_language
target_language = English
```

While legacy `interface_language` and `native_language` variables exist, they must
represent the same user choice. Spanish user => all auxiliary experience Spanish;
Japanese user => all auxiliary experience Japanese; Arabic user => auxiliary Arabic
RTL while target English/input stay LTR. Chatto is never mirrored.

## Traps this repo has already sprung

- Count `check:all` by exit code, not success-string grep.
- A suite going green is not functional proof. Episodes need happy + wrong/retry +
  assisted + replay evidence; UI/i18n needs a real browser at 390/1440; evaluators
  need frontend/backend refusal/acceptance parity.
- A step/story field must reach both local evaluation and provider payload. Bugs
  have already come from dropped `repairKind`, `placeName`, `relationHint`,
  `timeForm` and partner/person context.
- Any model answer displayed to a learner must pass the evaluator judging it.
- A missing dynamic-import chunk is memoized by browsers; the recovery path needs a
  document reload and must not be simplified into an inert retry.
- Never infer “A1 complete” from “all runtime A1 episodes pass” while arcs 6–7 do
  not exist. Keep A1 partial/unavailable until its final gate.
- No Supabase, real OpenAI QA, voice/STT/TTS/WebRTC/pronunciation/calls/video calls.
- Do not touch owner archives/secrets.
- Do not send a workflow-editing infrastructure task through interactive
  `@claude`; issue-mode Claude cannot modify `.github/workflows` and its 40-turn
  bound is intentionally for smaller interactive work.
- Do not blindly rerun a red workflow. Read the job log, identify the deterministic
  cause, then change the cause or make the work safely resumable.
