# LC-RC-001 — release-candidate hardening after A1–C2 supervisor acceptance

Status: **hardening pass complete, no level opened**. This report records what
was audited and changed after `docs/curriculum/final-supervisor-acceptance.md`
(`LC-SUP-002`, verdict `PASS_WITH_CONDITIONS`) and what was deliberately left
untouched, and why.

## What this is not

This is not a re-run of curriculum/pedagogical acceptance — that is
`LC-SUP-002`'s job and it is not repeated here. This is not A1's own
completion gate (`LC-PED-002` and the dedicated availability-flip task remain
separate and untouched). This task's write scope
(`linguachat-frontend/**`, `linguachat-backend/**`, `docs/release/**`,
`docs/curriculum/**`) explicitly excludes `docs/research/**`, so it cannot and
does not rewrite the evidence corpus (`.github/scripts/check-foundry-automation.mjs`
enforces this at the manifest level).

## 1. LC-SUP-002 follow-up items — resolved this pass

`LC-SUP-002` §7 named three narrow, non-blocking documentation/authoring-parity
gaps and asked a future task with write access to those files to pick them up.
Two were closed here:

| Gap | Fix | File |
|---|---|---|
| C2's `coreEngineRequirements[3]` (multi-capability delayed retrieval) was genuinely implemented by `LC-INT-001` but never annotated as resolved, unlike the parallel F8 entries in `b2.json`/`c1.json` | Added the same `"RESOLVED by ..."` note pattern, pointing at `LC-INT-001` and `learnerModel.js`'s `recordDelayedRetrievalEvidence` | `docs/curriculum/blueprints/c2.json` |
| C1's personalization section referenced the master's invariant (§7) by number only, unlike A1/A2/B1's verbatim quote | Added the same quoted invariant sentence for documentation parity (no behavioral change — C1 has no runtime episodes yet) | `docs/curriculum/blueprints/c1.md` |

The third item is **deliberately not resolved here**:

- **B1's `suggestionEn`-presence evidence-tagging convention** (`b1Arc1.js`
  and five sibling files distinguish independent/assisted evidence by whether
  a `suggestionEn` field is present, instead of the explicit `evidenceType`
  field A2/B2/C1/C2 use). `LC-SUP-002` §3 explicitly called this "recommended
  for a future B1 content-alignment pass, not blocking since B1 stays
  unavailable." Rewriting the evidence-tagging convention across six files
  that already work, that no real learner can reach (`available: false`),
  carries real regression risk for zero shipped benefit, and touches
  evaluator/scaffolding-adjacent code outside a narrow hardening scope. Left
  openly tracked here rather than silently dropped, for whichever future
  task owns B1 content alignment.
- **C2's deliberately-deferred prerequisite** (`sustain_coherence_across_topic_shifts`,
  the one item `LC-AUD-001` itself asked to leave to explicit human judgment
  rather than auto-resolve) is untouched, per that task's own instruction —
  this task is not the human-judgment step it called for.

## 2. Hardening audit performed

Spot-checked, not a from-scratch security review (the codebase already
carries load-bearing safety conventions from earlier tasks that this pass
verified rather than redesigned):

- **Provider safety**: `ai/provider_policy.py` still refuses to start on a
  real-provider request with no key; `LINGUACHAT_PROVIDER=local`/`fake` stays
  the CI/QA default. No code path was found that could silently switch a
  request to the real OpenAI provider from key presence alone.
- **No accidental level opening**: `linguachat-frontend/src/learning/curriculum/levels.js`
  — Pre-A1 `available: true` (frozen, 17 episodes, `check:pre-a1-freeze` OK,
  7 freeze groups); A1/A2/B1/B2/C1/C2 all `available: false`.
- **Secrets/leftover debug code**: no hardcoded API keys/tokens found; no
  `console.log`/`debugger` statements in `linguachat-frontend/src` outside
  tests; no `TODO`/`FIXME`/`XXX` markers in either app; no user-owned
  `linguachat-*.zip` archives present in the working tree to protect.
  Only `.env.example` templates are tracked, no real `.env` files.
- **Backend attack-surface review** (`linguachat-backend/app/routes/*.py`,
  `main.py`): no `eval`/`exec`/`pickle`/`subprocess(shell=True)` usage
  anywhere in the backend. CORS is an explicit allow-list (localhost dev
  origins union `CORS_ORIGINS` env var) rather than a wildcard, so
  `allow_credentials=True` does not create an open-CORS hole.
  `/learning/evaluate` never returns a raw 5xx to the client — confirmed the
  triple-fallback (`evaluate_episode_response` → `evaluate_deterministic` →
  hardcoded safe verdict) is real, matching its own docstring.
- **Unbounded-input gap found and fixed**: `ChatRequest.message`
  (`app/routes/chat.py`) had no `max_length`, unlike every other free-text
  field in this codebase's request models (`EvaluateRequest.learner_response`
  is `max_length=500`, `learner_name`/`target_noun`/etc. are all bounded).
  Added `max_length=4000` so `/chat` cannot accept an unbounded request body.
  Verified no test fixture sends a message anywhere near that size (longest
  found: 22 characters). `history`/`preferences` were reviewed and left as
  they were: `history` is already trimmed to the last 8 turns before use
  (`ai/engine.py`), and `preferences` is already passed through
  `_safe_preferences`/`_safe_tutor_preferences`, which allow-list keys and
  truncate every string value to 80 characters before use.

## 3. Evidence

```
cd linguachat-frontend && npm run check:all && npm run build && npm run check:i18n
cd linguachat-backend  && python -m compileall . && python -m pytest -q
node .github/scripts/check-foundry-scope.mjs --branch foundry/integration/lc-rc-001-hardening --base origin/main --head HEAD
node .github/scripts/check-supervisor-evidence.mjs
```

See the PR's `## Evidence` section for the exact measured output of each
command (two consecutive clean cycles, zero source edits between runs).

## 4. What remains open

Everything `LC-SUP-002` §7 already logged as open remains open, except the
two items closed in §1 above:

1. GC1 (recognition-vs-production) and GC6 (older-adult L2 scaffolding)
   evidence claims must keep being described at the confidence level the two
   corpora actually support, not overstated — unchanged by this task, no
   product copy touched here makes either claim.
2. B1's evidence-tagging convention (§1 above) — future B1 content-alignment
   task.
3. C2's `sustain_coherence_across_topic_shifts` prerequisite — future
   human-judgment step, not this task.

This report does not open any level. A1/A2/B1/B2/C1/C2 remain `available: false`;
Pre-A1 remains frozen at 17 episodes. A1's own separate completion gate
(`LC-PED-002` and the dedicated availability-flip task) is untouched and still
required before A1 opens.
