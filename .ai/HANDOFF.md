# HANDOFF — read this, then start

The last agent wrote this for the next one. Keep it short and current: what just
happened, what is half-done, what to do next, and what will bite you.

_Written 2026-08-18, from `7d36a79`, on branch `main`._

## What just happened

LC-CURR-005b — A1 arc 5, part 2 (evaluation) — done, PR #12 merged by the chain.

1. Backend `_ask_price` evaluator added to `linguachat-backend/ai/evaluator.py`,
   routed in `evaluate_deterministic`, parity with the frontend's
   `evaluateAskPrice`. `use_bigger_numbers` reuses `use_quantity` and
   `buy_something`'s headline evidence reuses `cafe_order_conversation` — both
   already had backend evaluators, so `ask_price` was the only new dispatch
   this arc needed.
2. Found and fixed a real bug while wiring the above: `evaluateEpisodeResponse`
   in `hybridEvaluation.js` (frontend) destructured `place`, `repairKind`,
   `partner`, `quantityForm`, `timeForm`, `usualTime`, `targetCount` for its
   own internal local re-evaluation, but never `placeName` or `relationHint` —
   even though callers already passed both and the provider-payload builder
   already read them correctly. Since `ask_location` (arc 4) and
   `ask_price`/`state_location` (arc 5) are all `deterministic_local` and
   never escalate, the verdict actually shown to the learner always came from
   that starved local branch, so the model answer silently fell back to "the
   toilet" / "it" / "here" regardless of the step's real place or relation.
   Fixed; regression test added to `check-hybrid-evaluation.mjs` (verified it
   fails without the fix, by stashing it and re-running).
3. Backend tests mirroring arc 4's `test_learning.py` pattern: 431 -> 444
   pytest passing.

## Nothing is waiting on a human

The chain merged this one itself end to end. One wrinkle worth knowing: taking
a PR out of draft with `gh pr ready` does **not** retrigger the `QA` workflow,
because GitHub's default `pull_request` trigger types are
`[opened, synchronize, reopened]` — `ready_for_review` is not among them. So
the `evidence` job (which is gated on `draft == false`) stays "skipping"
against the run that happened while still in draft, and the chain's `merge`
job — which only fires on a completed `QA` `workflow_run` — never gets a
fresh trigger either. The fix used here: `gh pr close` then `gh pr reopen`,
which fires a `reopened` event and retriggers `QA` with the PR already
non-draft. If you open a draft PR early (as LC-OPS-007 requires) and finish in
the same run, remember this — either push one more real commit after calling
`gh pr ready`, or close/reopen, so the chain actually sees a green,
non-draft run to merge.

## Next task

`LC-CURR-005c` — A1 arc 5, part 3: copy in eight languages. Blocked only on
`LC-CURR-005a` (done), so it is claimable now. Every key the arc's episodes
use (`ep30*`..`ep33*` and friends in `a1Arc5.js`) needs to land in the English
base and in es/pt/fr/it/de/ja/ar, placeholders preserved, `check:i18n` at
100%, no raw key ever reaching the screen. `LC-CURR-005d` (the arc's own
`check:a1-arc5`) stays blocked until 005c also lands.

## Traps this repo has already sprung

- Count `check:all` by exit code. Grepping for a success string undercounts by two.
- A step's own fields (repairKind, placeName, timeForm, partner, relationHint)
  must travel to the evaluator AND the provider payload, in steps and in story
  turns. FOUR separate bugs have now come from that one gap — the last two
  (placeName, relationHint) were inside `evaluateEpisodeResponse` itself, not
  a story or step wiring site; check any new call site against
  `check-hybrid-evaluation.mjs` group 17 and `check-memory-and-story.mjs`'s
  "found by playing arc 4's story in a browser" group before assuming a new
  field is wired correctly just because the preview looks right — the preview
  and the returned verdict are built by two different code paths.
- Any answer modelled on screen must pass the evaluator that will judge the
  learner's copy of it. `check:a1-arc4` group 13 exists because one did not.
- An episode-hosted story must never be offered as a loose session block, and an
  objective with no authored story must never be planned into a story format.
- A failed dynamic import is memoised by the browser: retrying the same specifier
  makes no request at all. `useLazyContent` handles it; do not simplify that away.
- A budget may be raised only with the numbers that justify it, and never by
  weakening the structural assertion underneath it.
- `gh pr ready` does not retrigger PR-scoped CI (see above) — close/reopen or
  push a real commit afterward, or the chain will never see a mergeable state.
