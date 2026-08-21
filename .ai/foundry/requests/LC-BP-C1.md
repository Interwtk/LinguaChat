# LC-BP-C1 — CORE requirements discovered while blueprinting C1

## Status

`docs/curriculum/blueprints/c1.md` and `docs/curriculum/blueprints/c1.json` are complete and
internally consistent: 28 capabilities (21 required, 7 should) across 7 arcs, no prerequisite
cycles, no orphan required capability, every required capability has a non-empty independent
evidence target and transfer context (validated by script during authoring — see the PR's
`## Evidence` section). This is not a blocker report about broken automation; it is the blueprint
template's own §15, filed here per the curriculum master's rule that "when a level worker
discovers a shared-core need, it must raise the requirement instead of quietly implementing a
private workaround" (`curriculum-master-a1-c2.md` §14).

## What this blueprint needs from CORE that does not exist yet

C1's capability graph depends on evaluator/engine behaviour beyond what the shared A1-era engine
is documented to support. Full detail is in `c1.md` §15 and `c1.json.coreEngineRequirements`;
summary:

1. **Register-appropriateness scoring** as a distinct evaluation dimension, independent of
   intent-match correctness — needed from Arc B (`register_and_diplomacy`) onward, since a
   grammatically correct answer in the wrong register must be distinguishable from a correct
   answer.
2. **Discourse-coherence scoring for multi-sentence turns** — needed from Arc E
   (`extended_structured_discourse`) onward, since existing per-turn evaluation appears
   single-utterance-oriented and C1 needs to grade whether several linked sentences in one turn
   cohere.
3. **Bounded conversation-state tracking across topic shifts** — needed for Arc G
   (`sustained_interaction`)'s `refer_back_to_earlier_discourse`, to credit an accurate reference
   to something said several turns earlier in the same session.
4. **A `negotiated_item` semantic slot type** (or equivalent) — needed for Arc F
   (`negotiation_and_complexity`) personalization; no existing semantic type cleanly covers a
   personalizable transactional good/service with a neutral fallback. **Worth checking against
   A2/B1/B2 blueprints before building twice** — a transactional slot type is plausible in more
   than one level.

None of these four are implemented by this PR. `c1.md`/`c1.json` are design artifacts only; no
runtime code is touched by `LC-BP-C1`'s `writeScopes`, and no private workaround was built for
any of the four.

## Why this does not block LC-BP-C1 itself

Per `.ai/foundry/tasks.json`, `LC-BP-C1` `requiresEvidenceReady: false` and its write scope is
exactly `docs/curriculum/blueprints/c1.md` and `docs/curriculum/blueprints/c1.json` — a design
artifact, not runtime content. The blueprint phase's job (curriculum master §15,
"blueprint-before-content rule") is precisely to surface these needs before `LC-CONT-C1` starts,
not to resolve them. `LC-FND-002` ("Isolate shared curriculum infrastructure for collision-free
parallel authoring") is the earliest task in the current graph whose `writeScopes` cover shared
engine code and is therefore the natural home for items 1–3; item 4 could land there or in a
later shared-slot-type pass once A2/B1/B2 blueprints confirm whether they need the same type.

## What LC-CONT-C1 will be blocked on

`LC-CONT-C1` (`dependsOn: ["LC-FND-002"]`) cannot honestly implement Arc B/E/G runtime content
that claims to evaluate register, coherence or discourse reference without items 1–3 existing in
the shared engine first. This is already expressed structurally in `tasks.json` (content depends
on the FND-002 core-isolation task), so no `tasks.json` change is requested here — this document
exists so the CORE lane has a concrete, itemized list rather than having to re-derive it from
`c1.json` from scratch.
