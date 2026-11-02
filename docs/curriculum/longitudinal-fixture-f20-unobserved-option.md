# F20 — Unobserved option must not be labeled evidence-backed

Status: deterministic acceptance fixture; design-only, not a validated learning improvement. Pre-A1 frozen; A1–C2 unavailable.

At the existing versioned can-do goal-1, use two eligible instructional options: word_order and recall. Record one actual word_order exposure (s0, timestamp 1000, success=null), then three independent, unassisted failed probes in a distinct real session s1 at timestamps 2000, 3000 and 4000. Each probe has its own ID. All probes are assessment events, not teaching exposures. Keep the same goal, evaluation rubric, contexts and seed.

Reproduced with original teachingPolicy.js and variation.js at integrated HEAD 09879ee4037841ee61187200db97b1f0b7fdf66f in an isolated JS harness: teachingEstimates gives word_order count=3, retention=0.2 and recall count=0, retention=0.5 (prior-smoothed default). chooseTeaching with seed 'alpha' (FNV hash modulo 5 = 2) chooses recall and sets reason='later-independent-retrieval', even though recall has zero attributed observations.

Expected: an unobserved option may be chosen to explore uncertainty or avoid repeatedly failing instruction, but its selection must not claim later independent retrieval evidence. Keep unobserved/prior-only estimates distinct from empirically supported comparisons; label the decision as exploration/insufficient comparative evidence and log uncertainty. A minimum sample count in only one option cannot establish the relative benefit of another. Do not force a permanent learning-style category, remove alternative sampling, weaken CEFR gates or claim measured retention. Add an executable regression for seed 'alpha' and a positive control with independent delayed evidence for both options.

No Auth, cloud, production, schema, Supabase, merge or level release changes.
