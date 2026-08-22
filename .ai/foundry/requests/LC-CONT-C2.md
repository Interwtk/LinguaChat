# LC-CONT-C2 — status and core-engine handoff

## Current status (2026-08-22, after supervisor correction)

Level-owned C2 content is authored and self-validated inside this task's
write scope. See `docs/curriculum/implementation/c2/README.md` for the full
build summary and `docs/curriculum/implementation/c2/core-engine-handoff.md`
for the itemized shared-core wiring spec this document originally proposed
inline — that spec now lives in the handoff doc, kept in sync with
`LC-CONT-B1`/`LC-CONT-B2`'s own handoffs rather than duplicated here.

C2 remains unavailable to a learner: no runtime module imports this
content, and `docs/curriculum/blueprints/c2.md`'s product-availability
statement is unaffected.

## Historical finding (superseded — kept for the record)

Earlier resumes of this task concluded that `LC-CONT-C2` was blocked and
that a new CORE task (tentatively `LC-FND-003`) was required before any
runtime content could be authored, on the reasoning that no `LC-CONT-*`
content lane can make a genuinely new evaluator intent run from inside its
`levels/<level>/**` write scope alone. That file:line evidence about the
shared engine's current shape (`engine/responseEvaluation.js`'s per-intent
switch, `SessionRunner.jsx`'s flat tables, `curriculum/levels.js`'s
hardcoded registry, `i18n`'s flat locale files) was, and still is,
accurate — it is exactly why
`docs/curriculum/implementation/c2/core-engine-handoff.md` can be as
concrete as it is.

What was wrong was the conclusion drawn from it. The repository owner
corrected this directly on PR #76: `.ai/foundry/tasks.json` already
provides the intended shared-runtime integration lane, `LC-INT-001`, which
depends on all six `LC-CONT-*` tasks and owns the exact shared surfaces
this content needs. No `LC-FND-003`-equivalent task should be invented.
Sibling lanes `LC-CONT-A2` and `LC-CONT-B2` had already completed on this
understanding before this correction landed here. This task now follows
the same corrected boundary: author complete, self-contained, level-owned
content and defer shared wiring + live browser proof to `LC-INT-001`,
documenting the exact requirement rather than either quietly working
around it or refusing to proceed.

The four C2-specific core-engine gaps this document originally flagged
beyond the general registration wall (multi-turn evaluation span, a
multi-capability delayed-retrieval record, the four new semantic types,
real register/discourse-coherence scoring) are now answered with concrete,
content-backed specs in `core-engine-handoff.md` sections 3-4, not merely
named as open questions.
