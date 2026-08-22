# LC-AUD-001 — cross-level A1-C2 pedagogical and psychological audit

Status: **complete**. This is a design-time audit of the six level blueprints
(`docs/curriculum/blueprints/{a1,a2,b1,b2,c1,c2}.json` and their `.md`
companions) against `curriculum-master-a1-c2.md`, `level-blueprint-template.md`
and the now-qualified evidence supervisors (`LC-SUP-001`). It changes no
runtime code, edits no blueprint, and does not open any level. Machine-readable
findings live in `cross-level-audit.json`; this document explains the
reasoning behind them.

## What this proves, and what it does not

This audit proves that the A1-C2 capability graph, as currently authored
across six independently-worked lanes, is internally traceable: every
capability id, every prerequisite reference and every proposed shared-engine
requirement was checked against what the other five blueprints actually
declared, not against what an earlier lane assumed they would declare. It does
**not** certify that any level is pedagogically approved for real learners —
per-level pedagogical/psychological review under
`supervisor-evidence-contract.md` remains a separate, later step — and it does
not certify human-learner efficacy, which still requires the pilot process in
`docs/research/learning-science-foundation.md`.

## Why this task exists and what made it tractable

Four of the six blueprints (B1, C1, C2, and to a lesser extent A2) were
authored in parallel lanes before their predecessor level had landed on
`main`. Each one handled that honestly: rather than inventing a real id from
memory, B1's `prerequisiteReconciliation` field named its expected A2 exit
capabilities and stated in plain language that *"LC-AUD-001 must resolve every
id... against the actual A2 blueprint... A mismatch is a cross-level defect to
fix before LC-FND-002, not a B1 defect to silently work around."* C1 and C2
did the same thing for B2 and C1 respectively, using `assumed_unverified` /
`PENDING` placeholder ids. This audit's first and most concrete job was
therefore already scoped by the blueprints themselves: resolve those
placeholders against the real ids and report what does, and does not, line up.

B2 is the control case: it was authored *after* B1 had already merged, used
B1's real ids from the start (`b1.give_an_opinion`, `b1.narrate_connected_event`,
...), and every one of those references resolves correctly. That is the
pattern the other four boundaries need to be corrected to match.

## Method

A deterministic Python resolver (not a language-model read-through) loaded all
six blueprints, normalized their differing schemas, and:

1. built the full id graph, including the Pre-A1 required core inherited by A1;
2. found every bare capability id that appears identically in more than one
   level;
3. resolved every prerequisite string — bare id, `b1.x` dot-notation,
   `b2_x` underscore-notation, or `c1_assumed__x` placeholder-notation — against
   same-level, earlier-level, and explicitly-prefixed targets, and flagged
   anything that resolves nowhere;
4. ran cycle detection on each level's own same-level subgraph;
5. checked every *required* capability for a non-empty independent-evidence
   target and a non-empty transfer context, per master section 9;
6. checked CEFR-reference presence on every capability, per master section 3
   and template section 3;
7. cross-referenced every `coreEngineRequirements` and
   `semanticTypes.proposed` entry across all six blueprints for duplicate or
   overlapping asks;
8. cross-referenced pattern ids (`patterns` / `languageInfrastructure`) across
   levels for silent re-introduction or reuse of the same id for an
   incompatible grammatical form.

Full findings, confidence levels and recommended fixes are in
`cross-level-audit.json`. Severities below are ordered high to low.

## High-severity findings

**Three capability ids collide across levels with incompatible or duplicated
meaning** (F1, F2, F3): `report_a_problem` (A2 vs B1) names two different
capabilities; `infer_implied_meaning` (B2 vs C1) is redefined at C1 without
linking back to B2's should-scope version it should be escalating; and
`reformulate_for_a_different_audience` (C1 vs C2) is declared as a near-
identical required capability at both levels, with C2's own blueprint
describing it as "the product's first sustained mediation task" — a claim
directly contradicted by C1 already owning that id. These are the audit's
sharpest findings because each one also has a downstream broken-prerequisite
symptom (below), meaning the id collision is not just a naming clash but the
root cause of a real dependency-graph hole.

**Nineteen prerequisite strings across B1, C1 and C2 do not resolve to any
real capability anywhere in the graph** (F4, F5, F6) — exactly the class of
defect each of those blueprints' own reconciliation notes predicted and asked
this task to resolve. For every one of them this audit identified a concrete,
named real capability in the correct earlier level that the placeholder was
clearly gesturing at (confidence ranges from high to, in one case, low — see
`cross-level-audit.json` F6's `sustain_coherence_across_topic_shifts` row,
which needs a human judgment call rather than a mechanical rename because its
own target is itself still resting on an unresolved B2 placeholder). None of
these are fixed in this PR — this task's write scope is the audit documents
only — but the exact string-for-string fix is now on record for LC-FND-002.

**A2 has zero CEFR references** across all 19 of its capabilities (F7), the
only one of the six levels with this gap. The master contract requires every
level to map its capabilities to CEFR Companion Volume descriptors before that
mapping is translated into testable product behaviour; A2 currently cannot
honestly make that translation.

## Medium-severity findings

**Duplicate CORE-engine asks** (F8): B2 and C1 each independently proposed a
register-appropriateness scoring dimension and a discourse-coherence scoring
path, worded differently but describing the same shared-evaluator capability.
Building both independently in LC-FND-002 risks two incompatible
implementations of the same evaluator feature; one implementation should
satisfy both.

**Semantic-type fragmentation risk** (F9): C1's own blueprint explicitly asked
this audit to check its proposed `negotiated_item` semantic type against
A2/B1/B2 before building it. The direct answer: B1 already has a `problem`
type and B2 already has a related-but-distinct `problem_type`, both in the
same conceptual neighborhood as C1's proposal, and none of the three lanes
cross-referenced the others. LC-FND-002 should reconcile `problem` and
`problem_type` and decide whether `negotiated_item` can extend that family
rather than becoming a fourth independent type.

**Pattern-id reuse with pedagogical stakes** (F10, F11): `because_reason_pattern`
is independently "introduced" at both A2 and B1 despite B1's own note
admitting it is an A2-expected reuse, and `hedging_pattern` is reused at C2 for
a structurally different, more formal form than the one it names at B2. These
read as naming-hygiene issues on the surface, but they carry a genuine
psychological/spacing risk: if the shared spaced-retrieval engine keys off
pattern-first-appearance to decide what is "new" versus due for retrieval,
either failure mode is possible — re-teaching a pattern an A2-graduate learner
already produced independently (wastes time, reads as repetitive rather than
personal, contra master section 13's healthy-motivation principle), or
crediting a learner with mastery of a hedging register they were never
actually taught (a false-mastery risk under master principle 12). This is the
audit's clearest example of why the "pedagogical and psychological" framing in
this task's title matters beyond pure graph hygiene: a structural naming
collision is also a retrieval-practice and false-mastery risk once it reaches
a real spaced-review scheduler.

## Low-severity / carried-forward finding

**A1's three required capabilities with empty transfer contexts** (F12:
`ask_the_price`, `buy_something`, `arrange_to_meet`) are a real, confirmed gap
— but A1's own blueprint already disclosed it as a "single-appearance risk"
with a named review-scheduler mitigation, and A1 is frozen and live. This
audit carries the gap forward as a tracked risk rather than treating it as a
new defect; no action is requested from LC-FND-002.

## What is healthy and should not be "fixed"

- Zero prerequisite cycles anywhere in the six levels.
- A1's required capabilities are fully and traceably reused into A2 — the one
  boundary with a complete, checkable reuse ledger (`a1Inheritance`).
- B2's cross-level prerequisites are the one boundary that already resolves
  cleanly end-to-end, because B2 was authored after B1 landed. This is the
  target pattern.
- All six blueprints correctly declare `available: false` and explicitly
  reaffirm A1's fail-closed state; none attempts to imply availability.
- Independent-evidence thresholds for required capabilities stay roughly flat
  (around 2) from A1 through C2 rather than inflating with level number;
  complexity instead rises through task demand (discourse length, register
  control, ambiguity, counterargument). This matches master section 9's
  instruction that evidence *type* may not be weakened while exact thresholds
  may be revised — the six lanes independently converged on the same healthy
  interpretation without being told to.
- Every level's evidence model retains the full
  recognition → guided → assisted → independent → transfer → delayed-retrieval
  structure inherited from the master contract, even where three blueprints
  (A2, B2, C2) do not restate the "cannot graduate on recognition alone" prose
  as explicitly as B1 and C1 do — the structural fields still carry the same
  substance, so this is a documentation-consistency note, not a functional gap.

## Handoff

This task's write scope is exactly `docs/curriculum/cross-level-audit.md` and
`docs/curriculum/cross-level-audit.json` — it cannot edit the blueprint files
that need fixing. Every recommended fix above, with exact old/new id
mappings, is handed to `LC-FND-002` (the next task in the graph, whose write
scope includes `docs/curriculum/**`) via `.ai/foundry/requests/LC-AUD-001.md`,
consistent with the coordination contract's rule against quietly implementing
out-of-scope changes.

## Human-pilot / efficacy disclaimer

This audit establishes internal structural and cross-level consistency of
design artifacts only. It is not evidence of real-learner pedagogical
efficacy. That claim requires the pilot process (pre-test, learning period,
immediate post-test, delayed post-test with unfamiliar examples) described in
`docs/research/learning-science-foundation.md` and master section 19.
