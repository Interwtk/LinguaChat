# F21 — Clustered same-session probes must not masquerade as longitudinal replication

Status: deterministic curricular acceptance fixture; a hypothesis-calibration defect, **not** evidence of improved human learning. Integrated source HEAD: `09879ee4037841ee61187200db97b1f0b7fdf66f`. Pre-A1 remains frozen; A1–C2 remain unavailable.

## Reproduction using original runtime functions

Run the unmodified `teachingHistory()`, `teachingEstimates()` and `chooseTeaching()` exports from `linguachat-frontend/src/learning/engine/teachingPolicy.js` at the pinned HEAD. All observations share capability `goal-1`; candidates are `['word_order', 'recall']`, seed `alpha`. Keep the same CEFR objective, rubric and candidate set throughout.

1. Instruction exposure: `{ id:'instruction:1', capability:'goal-1', format:'word_order', session:'day-1', context:'home', at:1000, success:null }`.
2. Delayed independent probe: `{ id:'probe:1', capability:'goal-1', format:'recall', session:'day-2', context:'market', at:86401000, success:true, independent:true, assisted:false, retried:false }`.
3. In the clustered condition only, add `probe:2` and `probe:3` with the same fields, same `day-2` session and `market` context, at `86402000` and `86403000`. These are distinct questions and event IDs, not duplicate events. The elapsed time since instruction is about one day; all three tests occur in a single later session.

Observed using the original module functions in a deterministic JavaScript harness:

| Condition | Raw attributed probe count | Smoothed retention value | `chooseTeaching(...,'alpha')` |
| --- | ---: | ---: | --- |
| One delayed probe in `day-2` | 1 | 0.6667 | `null` (insufficient count) |
| Three probes clustered in the same `day-2` session | 3 | 0.8 | `word_order`, reason `later-independent-retrieval` |

The second condition crosses the `count >= 3` decision gate with **only one independent retrieval occasion/session**. The three answers are legitimate distinct task observations, but they are not three longitudinally separated confirmations. The output conflates raw item-level count with independent longitudinal opportunities and can overstate confidence in an instructional method.

## Required acceptance behavior

Preserve all three valid answers as task evidence, including success/failure and context. Separately track the number of independent retrieval occasions, distinct sessions and elapsed time from attributable teaching, with provenance and uncertainty. A cluster of probes in one session must not gain the same longitudinal corroboration status as comparable probes separated across multiple genuine sessions or days. A selection may still explore or make a provisional recommendation, but its reason must accurately distinguish clustered evidence from independently replicated delayed retention.

Add a positive control with three genuinely separated delayed sessions and a negative control where three probes are duplicate event IDs. Do not assume that `3` is a scientifically validated minimum; calibrate thresholds empirically. Keep alternatives sampled, protect balanced modalities and shared CEFR mastery gates, and never infer a fixed learning style. Interest categories remain a soft, rotating context layer, not an objective filter.

Scope: curriculum acceptance fixture only. No Auth, cloud, Supabase, schema, production, infrastructure, paid models, level release or auto-merge.
