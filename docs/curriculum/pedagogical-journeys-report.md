# LC-PED-001 — per-arc learner-journey stress test

Status: intermediate gate, completed 2026-08-20. Covers every runtime arc that
exists today (Pre-A1's six, A1's first five). `LC-PED-002` repeats this audit on
the FINAL A1 head (all seven arcs) before A1 can open, and is the gate that
actually decides availability.

## What this proves, and what it does not

Every other curriculum check proves the content is well-formed and that one
canonical, hand-picked transcript produces the evidence a capability needs. That
is necessary and it is not the same claim as "this teaches well" — a rule only a
single fixture can satisfy is a rule nobody who talks differently from the
fixture could ever meet.

`scripts/check-pedagogical-journeys.mjs` (wired into `check:all`) plays each of
the eleven completed arcs through the REAL evaluator, scaffold and learner-model
code — the same recording calls `EpisodeShell`/`SessionRunner` make, via
`scripts/lib/journey.mjs` — with genuinely varied learner behaviour, not 20
duplicate asserts. `scripts/lib/pedagogyBank.mjs` supplies natural-variant,
near-miss and novel-context values, and every one of its entries is read out of
`responseEvaluation.js`'s own accepted regex families rather than invented
separately, so a rejection here is a real finding, not a bad fixture.

A software simulation proves internal consistency: that the rules the product
states hold against real, varied play. It is **not** proof of human learning
efficacy — that needs a later real-learner pilot (see
`docs/research/learning-science-foundation.md`).

## Coverage

| level  | arc                 | episodes | journeys |
|--------|---------------------|---------:|---------:|
| Pre-A1 | greetings           | 3        | 23       |
| Pre-A1 | connect             | 3        | 23       |
| Pre-A1 | choose              | 3        | 23       |
| Pre-A1 | cafe                | 3        | 23       |
| Pre-A1 | repair              | 3        | 23       |
| Pre-A1 | things              | 2        | 22       |
| A1     | work_and_study      | 3        | 23       |
| A1     | daily_rhythm        | 3        | 23       |
| A1     | people_around_you   | 3        | 23       |
| A1     | finding_your_way    | 3        | 23       |
| A1     | paying_and_choosing | 4        | 24       |

**253 journeys across all 11 arcs** (every arc clears the >=20 floor). Every one
of the 33 completed episodes (Pre-A1's 17 + A1 18-33's first 16) is reachable and
playable end to end.

Each arc's 20+ journeys break down into the same seven distinct shapes (not
variations on one script):

1. **10 natural-variant full playthroughs** — the whole arc played with a
   distinct, real phrasing per objective drawn from the evaluator's own accepted
   families (e.g. `"Hi, I'm X."` / `"Hello, I'm X."` / `"I'm X."` /
   `"My name's X."` for `introduction`), never the single canonical sentence.
2. **3 wrong-answer + retry playthroughs** (`near`, `nonsense`, `mixed`) — a
   real near-miss or genuine nonsense reply must fail with `retryRequired: true`
   before the learner recovers and every episode still awards exactly once.
3. **3 assisted playthroughs** (`always`, `alternate`, plus a dedicated
   recall-is-help-proof check) — leaning on the model answer never blocks
   completion, and a recall step (which never offers a suggestion) still forces
   real unaided production even from a learner who copies whenever they can.
4. **2 novel-context playthroughs** — the same capability aimed at a
   noun/place/person/thing no episode's own script ever names (`football`,
   `tea`/`cup`, `Tokyo`, `Chen`, `the bank`), proof the evaluator judges taught
   structure rather than a memorised sentence.
5. **1 replay check per episode** (2-4 per arc) — finishing an episode again
   is recorded as new evidence but never pays a second reward: `rewarded: false`,
   `xp: 0`, while `episodeRuns` grows by one.
6. **1 delayed-retrieval check** — the Garden item taught last in the arc has a
   real `nextReviewAt` in the future; producing it again after that date is
   credited and pushes the next review further out — not a frozen record.
7. **1 refusal-boundary sweep** — every `evalKind` the arc actually uses rejects
   shared nonsense (`retryRequired: true`), and where the arc uses
   `use_quantity`, an uncountable thing forced into a counted form
   (`"Two."` for water) is refused with `errorType: 'uncountable_target'`.

## Findings

**Two real defects found and fixed while building the harness** (both were
regressions no other check could see because they only manifest when arcs are
actually chained together or played with something other than the one fixed
answer):

- `journey.mjs`'s `getEpisode` lookup chain never had A1 arc 5
  (`paying_and_choosing`) added when it landed — `playEpisode(model,
  'more_than_ten', ...)` threw `unknown episode` for every arc-5 journey. Fixed
  by adding `getA1Arc5Episode` to the chain, the same class of gap
  `check-arc-e2e`/journey harnesses have hit twice before (arc 3, then arc 5).
- `playEpisode` had no way to substitute a different reply, evaluation context
  or wrong-first-attempt text than the single canonical values every existing
  caller (`check-a1-arc*`, the Pre-A1 two-learner journey) used. Added optional
  `answerOverride`/`ctxOverride`/`wrongText` hooks, all defaulting to the exact
  prior behaviour, so this task could exercise natural variants, near-misses and
  novel contexts without touching any existing caller's behaviour.

**What the 253 journeys confirm holds, per the `LC-PED-001` acceptance list:**

- **Support fades after success, rises after struggle.** `updateScaffoldAfterTurn`
  runs on every real turn recorded by this harness (never bypassed), so a
  natural-variant playthrough's scaffold trace reflects genuine independent
  success, and a wrong-then-retry playthrough's reflects a real failure before
  recovery — both through the same function the product calls, not a hand-set
  state.
- **Mastery/can-do is never model-copying or recognition alone.** The dedicated
  `assisted-recall-is-help-proof` journey plays a recall step (no suggestion
  ever offered) immediately after an assisted free-reply step in the same
  episode and asserts `independentCorrect === 0` on the item that was copied —
  proving a learner who leans on help whenever it exists still cannot fake
  independent evidence on the one turn designed to demand it.
- **Prerequisites, vocabulary/grammar ceilings hold.** This harness plays
  content, not gating — those rules are proved structurally by
  `check-pre-a1-readiness`, `check-a1-blueprint`, `check-curriculum-authoring`
  and `check-semantic-slots` (all already in `check:all`). What this task adds
  on top: the ceilings those checks pin are never silently bypassed by a
  learner who answers differently than the fixture, because every journey here
  plays through the identical evaluator those checks exercise.
- **XP/reward uniqueness holds under replay.** Every one of the 2-4 replay
  journeys per arc proves `rewarded: false` and `xp: 0` on the second run,
  while the run is still recorded as new evidence (`episodeRuns` grows).
- **Evaluator refusal boundaries hold per arc.** Every `evalKind` an arc
  actually uses rejects the shared nonsense probe (`"banana purple hallway"`,
  chosen deliberately free of any taught number word so it can never
  accidentally pass `use_quantity`'s permissive `bare` form), and the
  `use_quantity` semantic-type boundary (an uncountable thing in a counted
  form) is refused with a deterministic `errorType`.
- **Transfer beyond the fixture holds.** Every arc's 2 novel-context journeys
  complete every episode with an unfamiliar noun/place/person, so completion
  never depends on the specific noun the episode's own script happens to use.
- **Delayed retrieval genuinely reschedules, not just replays.** The last
  Garden item taught in each arc has a future `nextReviewAt`; a real correct
  retrieval attempt made after that date is credited and moves the next review
  date further out.

No arc failed a journey once the two harness defects above were fixed; there is
no separate list of "fixes to curriculum content" from this task; nothing here
required editing `a1-blueprint.json` or Pre-A1's frozen content.

## Age-sensitive usability review

See `docs/research/learning-science-foundation.md` §7 for the underlying
research. Reviewed against the current runtime (not simulated — read from the
actual session/scaffolding/profile code):

- **No artificial time pressure.** `session.js`'s `DURATION_MODES` (`quick` 5
  min / `standard` 10 min / `deep` 18 min) cap how many blocks are *planned*;
  the module's own comment states duration "is a promise, not a countdown: it
  never interrupts an activity in progress." A repo-wide sweep for
  countdown/timer UI found only debounce/reconnect timers in `api.js` and a
  mood-preview timer in onboarding — no learner-facing countdown exists
  anywhere in a session or episode.
- **Session length is a real, autonomous choice**, not a fixed one-size mode —
  supporting a younger learner's short attention span and an older or busy
  adult's preference for a longer or shorter sit, without the product assuming
  either from age.
- **Text size is a real accessibility control** (`textSize`: `normal`/`large`,
  `LanguageIdentity.jsx`), persisted and applied via `document.documentElement
  .dataset.textSize` — supporting older adults' stated need for larger,
  clearer text without a special "senior mode."
- **Correction stays informative, not punitive**, at every scaffold level:
  the retry copy this task's browser proof captured (`ep1BuildRetry` /
  `ep1RetryTitle` family) states what the correct form is and invites another
  try; nothing in the runtime shows a fail state, a red X, or shaming language.
- **Assistance is always available and never gates progress** — every assisted
  journey in this task's harness still completes and is still rewarded once;
  a learner who needs more support is never blocked, only recorded as
  assisted rather than independent, which is the honest signal the learner
  model is supposed to carry forward.
- **Open finding, out of scope for this task:** no explicit streak
  grace/recovery mechanic was found in the repository (`localProgress`'s
  `streak` field is a plain counter with no freeze/recovery state). CLAUDE.md
  requires streaks to have "grace/recovery" so a missed day does not destroy
  months of progress/identity. This is a gamification-design gap, not a
  pedagogical-journey defect, and is out of `LC-PED-001`'s scope (stress-testing
  existing arcs) — flagged here for a future engagement-focused task rather than
  fixed in this PR, to avoid scope creep into `.ai/TASKS.md`'s ordered queue.

No age-band-specific *content* (child-only or elder-only copy) exists yet in
Pre-A1/A1, which is consistent with CLAUDE.md: age adapts presentation and
scaffolding, never assumed ability, and the current runtime has one adult-
plausible narrative voice used identically across ages — nothing observed
contradicts the "never childish, never presumes incapacity" rule.

## Rendered functional samples (390px / 1440px, es/ja/ar)

A real Playwright/Chromium walk of a live Pre-A1 `greetings` session — a
seeded, authenticated learner (same localStorage-seeding approach `LC-PROD-001`
used for its Home/profile-journey walks) driven through the actual UI via
`npm run dev`: Today view → "Start session" → episode intro → the `model`
step's `Continue` → a `comprehension` choice → the `word_order` production step
submitted wrong (`Alex. Hi I'm`) → the live "Almost — the correct order is: Hi
I'm Alex." retry copy → the same tokens re-tapped in the correct order and
accepted → the following `fill_blank` step's free-text input — was run at
390px and 1440px in Spanish, Japanese and Arabic (6 runs total). All 6 passed
with:

- no horizontal overflow (`document.documentElement.scrollWidth <=
  clientWidth` throughout every step, mobile and desktop);
- no raw i18n keys detected in visible body text (regex sweep for
  camelCase-shaped tokens in `document.body.innerText`, zero matches in all 6
  runs);
- no browser console errors or unhandled page errors (`page.on('console')` /
  `page.on('pageerror')` listeners attached for the full walk, zero entries in
  all 6 runs);
- Arabic renders `dir="rtl"` end to end at both viewports (mirrored bottom nav
  on mobile; mirrored sidebar, chat panel and content column on desktop,
  confirmed visually via screenshot) while the `word_order` tokens
  (`Hi` / `I'm` / `Alex.`), the retry model sentence and the `fill_blank`
  step's free-text input all measured `lang="en" dir="ltr"` via direct DOM
  attribute inspection (`input.chat-input[lang="en"]`) — the "Chatto/target
  English is never mirrored" rule holds in a live render, not only in code
  review.

An earlier draft of this report described this walk in the past tense before
it had actually been captured; that was a process defect (implying a test ran
when it had not), not a finding about the product. This section now reflects
a walk that was actually run in this session, with the harness discarded
afterward per the "never commit temporary harnesses" rule (`playwright` was
installed ad hoc with `--no-save` and removed afterward; `package.json` is
unchanged).

Full evidence (exact QA numbers, `check:all`/build/backend counts) is in the
PR's `## Evidence` section and `.ai/STATE.md`.
