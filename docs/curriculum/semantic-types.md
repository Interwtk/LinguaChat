# Cross-level semantic type registry

The canonical decision record for slot/semantic types that more than one CEFR level's blueprint
declares or proposes. The master contract (`curriculum-master-a1-c2.md` §18) lists "semantic type
system" as shared-core: a level worker who discovers a shared-core need must raise it rather than
quietly implementing a private workaround. This document is where LC-FND-002 resolves those raised
needs, per `docs/curriculum/cross-level-audit.json` finding F9.

This is a design decision record, not runtime code. The runtime registry
(`linguachat-frontend/src/learning/engine/semanticContext.js`) implements the decisions below when a
level's runtime content actually needs the type; no type here is live until a level with runtime
content requires it.

---

## 1. `problem` (B1) and `problem_type` (B2) — reconciled into one family

**The conflict LC-AUD-001 found (F9):** B1's blueprint (`blueprints/b1.json`) proposes `problem`
("an issue attached to a thing or event", examples `broken item`, `wrong order`, `delayed delivery`,
`lost item`), required by `escalate_and_resolve_a_problem`, `negotiate_a_solution`,
`express_frustration_politely`. B2's blueprint (`blueprints/b2.json`) independently proposes
`problem_type` ("a categorized situation", examples `delay`, `damage`, `wrong_item`,
`missed_appointment`), required by `justify_a_request_for_change`, `negotiate_a_resolution`,
`express_frustration_diplomatically`, `negotiate_an_agreement_under_pushback`. The two proposals were
authored in parallel lanes with no cross-reference, and their examples are near-synonyms at different
granularity (`delayed delivery` / `delay`, `wrong order` / `wrong_item`, `broken item` / `damage`).

**Decision:** one semantic type, `problem`, owned by B1. B2 does **not** get a second, independent
`problem_type` type. Instead, a `problem` value carries a `category` field drawn from a closed set
(`delay`, `damage`, `wrong_item`, `missed_appointment`, extendable) that B1's capabilities may leave
implicit (a B1 problem statement names what's wrong in free language: "there's a problem with my
order") and B2's capabilities require explicit (`justify_a_request_for_change` and
`negotiate_an_agreement_under_pushback` need to name the category to justify a request or hold a
position under pushback). This is a genuine B1→B2 escalation — implicit categorization becoming
explicit, structured categorization — not two unrelated concepts sharing accidentally similar
examples.

**What this changes for B1/B2's blueprints:** B2's `canDos[].semanticNeeds` entries that currently
read `["problem_type"]` should be read as `["problem"]` with the categorization requirement carried
by the capability's own evaluation logic, once B2's blueprint next receives a maintenance pass. This
document is the authorization for that rename; it is not applied to `b2.json` by this task, since
`b2.json` is not in a broken/unresolved state the way the id-collision findings (F1-F6) were — B2's
`problem_type` does not collide with anything and is internally consistent within B2's own file. The
reconciliation is recorded here so it is not rebuilt from scratch when B2 next needs a revision, and
so the runtime registry (below) is not built with two types for one concept.

**Runtime registry implication (for whoever implements `semanticContext.js`'s B1/B2 support):**
register exactly one semantic type, `problem`, with an optional `category` field. Do not register
`problem_type` as a second `SEMANTIC_TYPES` entry.

## 2. `negotiated_item` (C1) — generalizes `problem`, not a fourth type

**The conflict LC-AUD-001 found (F9):** C1's blueprint (`blueprints/c1.json`) proposes
`negotiated_item_semantic_type` for `negotiate_a_mutually_acceptable_outcome` and
`propose_and_defend_an_alternative`, explicitly flagged by C1's own authors as "worth checking against
A2/B1/B2 blueprints before building twice" (`.ai/foundry/requests/LC-BP-C1.md`).

**Why `negotiated_item` is not simply `problem` renamed:** C1's negotiation-and-complexity arc's own
neutral fallback contexts are broader than a malfunction: "a returned purchase" and "a service booking
gone wrong" are problem-shaped, but "a shared calendar conflict" is not — nobody's calendar is broken,
two people's constraints just don't fit. A `negotiated_item` can be the resolution to a `problem` (a
replacement item, a refund) or a genuinely problem-free negotiable object (a meeting slot, a
compromise plan). Forcing every C1 negotiation into `problem`'s shape would misdescribe the
calendar-conflict case.

**Decision:** `negotiated_item` is a distinct semantic type from `problem`, but it **generalizes**
`problem` rather than standing as a fourth independent type: every `problem` value is a valid
`negotiated_item` value (the thing being negotiated, when there is one, is often the resolution to a
named problem), but `negotiated_item` also accepts problem-free negotiable objects (a time slot, a
plan, a compromise) that `problem` must continue to reject (per B1's own `incompatibleWith` list,
which stays unchanged). This is an is-a relationship — `problem ⊆ negotiated_item` — not two unrelated
types, and not a merge, because merging would let `report_a_problem`-style capabilities accept a
calendar slot as if it were a malfunction.

**Runtime registry implication:** register `negotiated_item` as a second semantic type whose accepted
values are a superset of `problem`'s. Concretely, the neutral-catalogue and value-classification
tables (`NEUTRAL_CATALOG`, `classifyValue()`/`KNOWN_VALUES` in `semanticContext.js`) should list every
`problem` value under `negotiated_item` as well, plus C1's own problem-free examples (a proposed
meeting time, a compromise plan). `INTENT_SLOTS` entries that currently only accept `problem` are
unaffected; only C1's negotiation intents accept the broader `negotiated_item`.

## 3. Why this belongs in LC-FND-002, not a fourth parallel proposal

Per the master contract's shared-core rule, this is exactly the kind of decision a level blueprint
lane may raise but must not resolve unilaterally (B1 and B2 already didn't cross-reference each
other; C1 explicitly deferred the check to whichever task could see all four blueprints at once).
LC-FND-002's write scope covers `docs/curriculum/**` and the shared engine, making it the first task
in the current graph positioned to make this call once A2, B1, B2 and C1 have all landed. It does not
retroactively edit B2's or C1's own capability/semantic-type declarations beyond what is recorded
above, consistent with the same scope discipline LC-AUD-001 exercised: a decision is recorded here so
future blueprint maintenance and runtime implementation both draw from one source, rather than each
guessing independently a second time.
