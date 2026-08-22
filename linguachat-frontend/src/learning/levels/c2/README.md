# C2 level — write scope for LC-CONT-C2

Open the `levels/c2/` write scope with a placeholder pointing at the authoritative
`docs/curriculum/blueprints/c2.json` / `c2.md` blueprint (`LC-BP-C2`), before content
authoring begins.

This directory is level-owned per `docs/curriculum/curriculum-master-a1-c2.md` §14. Nothing
here is wired into the shared runtime (`curriculum/levels.js`, `curriculum/episodeContent.js`,
`engine/responseEvaluation.js`, `components/session/SessionRunner.jsx`) — that wiring is
shared-core and outside this task's write scope. See `.ai/foundry/requests/LC-CONT-C2.md` for
the confirmed blocker and `docs/curriculum/implementation/c2/` for the design/proof artifacts
this task produces instead.
