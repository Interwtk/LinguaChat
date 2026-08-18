# HANDOFF — read this, then start

The last agent wrote this for the next one. Keep it short and current: what just
happened, what is half-done, what to do next, and what will bite you.

_Written 2026-08-18, from `4df7d26`, on branch `main`._

## What just happened

LC-CURR-005c — A1 arc 5, part 3 (copy in eight languages) — done, PR #14 open
(draft opened early per LC-OPS-007, then filled in and readied as the work
completed). Not yet observed merged by the chain as this was written.

1. LC-CURR-005a had deliberately left 78 step-level keys undefined in
   `translations.js` (scene/instruction/model/retry/praise prose for episodes
   30-33) plus two new `storyReply*` keys the arc's own `buying_a_ticket`
   mini-story (episode 33, in `miniStory.js`) needs, plus five `ask_price`
   retry/praise keys LC-CURR-005b's evaluator (`responseEvaluation.js`)
   dispatches to (`ep31RetryPromptEmpty`, `ep31RetryPromptFrame`,
   `ep31RetryExplainFrame`, `ep31PraiseAsked`, `ep31PraiseIndependent`) — none
   of which existed anywhere, base or locale, before this PR.
2. Wrote English for all 78, then translated into es/pt/fr/it/de/ja/ar,
   matching each locale's already-established register and quoting
   convention for embedded target-language phrases (tú/você/tu/du informal
   address; “ ” in es/pt/it, « » in fr/ar, „ “ in de, 「」 in ja). Reused
   episode 12's `storyReplyOrder`/`storyReplyFinish` translations verbatim
   where the English was identical to `finish_order`'s existing phrasing.
3. `check:i18n`: 1579 base keys, 100% in all seven locales, 0 missing/extra/
   placeholder-mismatch (none of the new keys use placeholders).
4. Evidence gathered without an installed browser-automation dependency in
   the repo: added `playwright-core` with `--no-save` (not committed), drove
   the real system Chromium against the dev server for a smoke screenshot at
   390px and 1440px (clean boot, no console/page errors), and — separately —
   called the app's own `translate()` across all 98 keys the arc's episode
   module, evaluator and mini-story reference, in all 8 languages (784
   resolutions, 0 raw-key leaks). Did **not** walk episodes 30-33 end to end
   in the rendered UI: arc 5 unlocks only after 29 prior episodes and no dev
   bypass exists, so reaching it live was out of scope for a copy-only PR.
   Said so plainly in the PR body instead of implying otherwise.
5. `check:all` 49/49 (exit code), `build` green (entry chunk 436.69 kB,
   budget 500), backend `compileall` clean, 444 pytest passing — one full
   clean cycle; nothing needed a fix, so the two-cycle rule wasn't triggered.

## Next task

`LC-CURR-005d` — A1 arc 5, part 4: `check:a1-arc5`, in the shape of
`check:a1-arc4`. Blocked on 005a/005b/005c, all now done, so it is claimable.
Needs: every modelled answer on screen passes its own evaluator, the
arc-frontier lists (`A1_RUNTIME_ARCS` and friends) move by exactly one, and
the two-clean-cycles rule applies for real this time if anything needs fixing.
Once 005d lands, arc 5 flips from "content+evaluation+copy done" to "ready"
in `.ai/STATE.md`, matching arc 4's line.

## Traps this repo has already sprung

- Count `check:all` by exit code. Grepping for a success string undercounts by two.
- A step's own fields (repairKind, placeName, timeForm, partner, relationHint)
  must travel to the evaluator AND the provider payload, in steps and in story
  turns. FOUR separate bugs have now come from that one gap — check any new
  call site against `check-hybrid-evaluation.mjs` group 17 and
  `check-memory-and-story.mjs`'s "found by playing arc 4's story in a browser"
  group before assuming a new field is wired correctly just because the
  preview looks right.
- Any answer modelled on screen must pass the evaluator that will judge the
  learner's copy of it. `check:a1-arc4` group 13 exists because one did not.
- An episode-hosted story must never be offered as a loose session block, and an
  objective with no authored story must never be planned into a story format.
- A failed dynamic import is memoised by the browser: retrying the same specifier
  makes no request at all. `useLazyContent` handles it; do not simplify that away.
- A budget may be raised only with the numbers that justify it, and never by
  weakening the structural assertion underneath it.
- `gh pr ready` does not retrigger PR-scoped CI: GitHub's default
  `pull_request` trigger types are `[opened, synchronize, reopened]`, and
  `ready_for_review` is not among them. Close/reopen the PR, or push one more
  real commit after calling `gh pr ready`, or the chain will never see a
  mergeable, non-draft green run to merge.
- No `playwright`/`puppeteer` is an installed project dependency, but the
  runner does have a system Chromium (`/usr/bin/chromium`) and network access
  to npm. `npm install --no-save playwright-core` (the driver only, no
  browser download) plus `chromium.launch({ executablePath:
  '/usr/bin/chromium' })` gets a real, screenshot-capable browser without
  touching `package.json`/`package-lock.json`. Useful for the "UI or i18n"
  evidence row when a task doesn't warrant a permanent devDependency.
