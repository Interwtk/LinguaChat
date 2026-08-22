/*
 * C2 arc 8 — "Standing between two people who disagree"
 * (`integrated_mediation`), the level's graduation capstone.
 *
 * Derived from docs/curriculum/blueprints/c2.json arc `integrated_mediation`
 * and docs/curriculum/implementation/c2/content-plan.json's matching arc
 * entry. Prerequisite arcs: precise_reformulation, register_and_pragmatics,
 * argument_and_position, discourse_flexibility. Introduces the level's only
 * capstone capability: mediate_a_complex_disagreement_for_a_third_party
 * (required, evaluationSpan: multiTurn, evidence.delayedRetrieval: true).
 * personalizationMode: none — by design, since it is the graduation
 * capstone (content-plan.json's own note: "no interest-flavored variant").
 * Unlike B1/B2's own capstones, this arc therefore needs neither a
 * themed/neutral variant pair nor per-step personalization markers.
 *
 * SINGLE-EPISODE SHAPE. Unlike every earlier C2 arc (one episode per new
 * capability + an integrated closer), this arc introduces exactly one
 * capability, so it is ONE episode structured as the four-step progression
 * content-plan.json's own arc entry already specifies: (1) a reading step
 * identifying each side's claim/basis, reusing arc 1's extraction skill;
 * (2) a guided mediation draft, explicitly checked for editorializing;
 * (3) a fully independent mediation task carrying the arc's
 * `delayedRetrievalChecks` — logged against the seven OTHER required/should
 * capabilities from arcs 1-7 that `c2EvaluationContracts.js`'s
 * `C2_CAPSTONE_DELAYED_RETRIEVAL_CHECKS` names, per
 * `coreEngineRequirements[3]`; (4) a transfer attempt on a wholly new
 * disagreement (content-plan.json's own transfer target: two neighbors
 * disputing a shared fence repair cost).
 *
 * MULTI-TURN SHAPE. Every evaluated step carries `evaluationSpan:
 * 'multiTurn'` and a `sourceTextEn` holding the FULL two-sided dispute (not
 * a single sentence) — `c2EvaluationContracts.js`'s
 * `C2_MULTI_TURN_SPAN_FIXTURES` spanKind `full_dispute_plus_mediation`,
 * minimumTurnsInSpan 3 (both sides' statements plus the learner's
 * mediation). This is structure for `LC-INT-001` to implement grading logic
 * against, not the grading logic itself.
 *
 * EVIDENCE ACCOUNTING (must match c2.json#/canDos[].evidence:
 * independent:2, transfer:1, delayedRetrieval:true):
 *   step 3 (independent, delayedRetrievalChecks logged) + step 4
 *   (independent, transfer:true) = independent:2, transfer:1,
 *   delayedRetrieval:true. `scripts/foundry/c2/check-c2-evidence-paths.mjs`
 *   counts these mechanically; a dedicated check in
 *   `check-c2-blueprint-fidelity.mjs`/`check-c2-arc-content.mjs` confirms
 *   `delayedRetrievalChecks` on step 3 names exactly the seven capability
 *   ids `C2_CAPSTONE_DELAYED_RETRIEVAL_CHECKS` declares — no more, no
 *   fewer.
 *
 * All prose lives behind i18n keys; every English target/prompt/source
 * text is literal. Key namespace: c2ep29 (the arc's single episode).
 */

const MEDIATE_01 = {
  id: 'c2_integrated_mediation_capstone',
  arc: 'integrated_mediation',
  level: 'C2',
  role: 'integrated',
  graduationCapstone: true,
  titleKey: 'c2ep29Title',
  goalKey: 'c2ep29Goal',
  canDoId: 'mediate_a_complex_disagreement_for_a_third_party',
  canDoNameKey: 'c2ep29CanDoName',
  durationKey: 'c2ep29Duration',
  estimatedMinutes: 20,
  xp: 200,
  prerequisites: [],
  skillPrerequisites: [
    'summarize_preserving_nuance', 'manage_face_in_disagreement',
    'preempt_and_rebut_a_counterargument', 'repair_a_misunderstanding_at_intention_level',
  ],
  gardenItems: ['reformulation_connector_pattern', 'face_saving_disagreement_pattern', 'concession_then_position_pattern', 'paragraph_scale_cohesion_pattern', 'mediate', 'represent both sides', 'next step'],
  reuseSkills: [
    'summarize_preserving_nuance', 'manage_face_in_disagreement', 'preempt_and_rebut_a_counterargument',
    'repair_a_misunderstanding_at_intention_level', 'sustain_coherence_across_topic_shifts',
    'recognize_irony_and_understatement', 'edit_own_text_for_precision_and_tone',
  ],
  steps: [
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep29SceneTitle', bodyKey: 'c2ep29SceneBody', showGoal: true, ctaKey: 'c2ep29Start',
      sourceTextEn: "Landlord: 'The tenant hasn't paid the increased rent since the notice went out three months ago, and I've been more than patient.' Tenant: 'I never actually received a proper written notice - someone mentioned it in passing, but nothing was posted or mailed, and I'm not going to pay a rate I was never formally told about.'" },
    {
      type: 'comprehension', instructionKey: 'c2ep29ExtractInstruction',
      target: "The landlord's basis is that a notice went out and enough time has passed; the tenant's basis is that no proper written notice ever reached them.",
      itemId: 'evidentiality_stance_pattern',
      options: [{ key: 'c2ep29CompOptCorrect', correct: true }, { key: 'c2ep29CompOptWrong1' }, { key: 'c2ep29CompOptWrong2' }],
    },
    {
      type: 'model',
      target: "The landlord believes the tenant owes three months of increased rent because a notice was given; the tenant disputes this, saying they never received anything in writing, only a verbal mention, and won't pay a rate that was never formally confirmed. Both sides agree there was some kind of notice attempt, but disagree about whether it met a standard the tenant could reasonably act on. A useful next step might be for the landlord to produce whatever written notice does exist, if any, and for the two sides to agree on a clear cutoff date.",
      meaningItems: ['reformulation_connector_pattern', 'concession_then_position_pattern'], explainKey: 'c2ep29ModelExplain',
    },
    {
      type: 'choice', instructionKey: 'c2ep29NearMissInstruction',
      target: "The tenant is right that a verbal mention isn't a proper notice, so they shouldn't have to pay yet.",
      itemId: 'reformulation_connector_pattern',
      options: [{ key: 'c2ep29NearMissOptCorrect', correct: true }, { key: 'c2ep29NearMissOptWrong1' }, { key: 'c2ep29NearMissOptWrong2' }],
      explainKey: 'c2ep29NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Draft a mediation summary of the dispute above. Represent both sides faithfully - don't take a side.",
      instructionKey: 'c2ep29GuidedInstruction', evalKind: 'mediate_disagreement', canDoId: 'mediate_a_complex_disagreement_for_a_third_party',
      evaluationSpan: 'multiTurn', sourceRef: true,
      turnContext: [
        { speaker: 'landlord', textEn: "The tenant hasn't paid the increased rent since the notice went out three months ago, and I've been more than patient." },
        { speaker: 'tenant', textEn: "I never actually received a proper written notice - someone mentioned it in passing, but nothing was posted or mailed, and I'm not going to pay a rate I was never formally told about." },
      ],
      suggestionEn: "The landlord believes the tenant owes the increased rent because a notice was given; the tenant disputes ever receiving proper written notice. Both sides agree some notice attempt happened, but disagree about whether it counted.",
      itemIds: ['reformulation_connector_pattern', 'concession_then_position_pattern'], evidenceType: 'assistedOpen',
    },
    /*
     * Seven quick delayed-retrieval warm-up checks, one per prerequisite
     * capability C2_CAPSTONE_DELAYED_RETRIEVAL_CHECKS names — a short
     * "show me you still have this tool" turn for each, immediately before
     * the main independent mediation attempt that actually logs
     * `delayedRetrievalChecks`. This is what makes the reuse matrix's
     * T/D/F markers for this arc real authored content, not just a
     * metadata list on the big free_reply step below.
     */
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Quick check before the full task: summarize this line from the dispute for someone who's never heard of it - 'the tenant hasn't paid since the notice went out' - preserving the actual uncertainty about whether the notice was proper.",
      instructionKey: 'c2ep29RetrievalSummarize', evalKind: 'reformulate_for_audience', subtype: 'summarize', canDoId: 'summarize_preserving_nuance',
      itemIds: ['reformulation_connector_pattern'], evidenceType: 'delayedRetrieval', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "The landlord snaps: 'Are you saying I'm lying about sending notice?' Respond in a face-saving way, without fully agreeing or attacking back.",
      instructionKey: 'c2ep29RetrievalFace', evalKind: 'shift_register', subtype: 'face_saving_disagreement', canDoId: 'manage_face_in_disagreement',
      itemIds: ['face_saving_disagreement_pattern'], evidenceType: 'delayedRetrieval',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Someone argues: 'The tenant clearly just doesn't want to pay more rent, notice or no notice.' Rebut that counterargument fairly.",
      instructionKey: 'c2ep29RetrievalRebut', evalKind: 'rebut_counterargument', canDoId: 'preempt_and_rebut_a_counterargument',
      itemIds: ['concession_then_position_pattern'], evidenceType: 'delayedRetrieval',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "The tenant says: 'Wait, are you saying this is my fault?' Repair the misunderstanding - you're not blaming them, you're trying to establish the facts.",
      instructionKey: 'c2ep29RetrievalRepair', evalKind: 'repair_at_intention_level', canDoId: 'repair_a_misunderstanding_at_intention_level',
      itemIds: ['face_saving_disagreement_pattern'], evidenceType: 'delayedRetrieval',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "The landlord adds: 'And while we're at it, the tenant's been leaving bikes in the hallway too.' Acknowledge that, then bridge back to the actual rent-notice question at hand.",
      instructionKey: 'c2ep29RetrievalSustain', evalKind: 'sustain_coherence', canDoId: 'sustain_coherence_across_topic_shifts',
      evaluationSpan: 'multiTurn', turnContext: [{ speaker: 'landlord', textEn: "And while we're at it, the tenant's been leaving bikes in the hallway too." }],
      itemIds: ['paragraph_scale_cohesion_pattern'], evidenceType: 'delayedRetrieval',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "The tenant mutters: 'Oh sure, because landlords always remember to send notices on time.' What's really being communicated there?",
      instructionKey: 'c2ep29RetrievalIrony', evalKind: 'recognize_implication', subtype: 'irony', canDoId: 'recognize_irony_and_understatement',
      itemIds: ['irony_understatement_marker_pattern'], evidenceType: 'delayedRetrieval',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Your draft opening line was: 'So basically the landlord's mad and the tenant's annoyed too.' Edit it for the precision and tone a real mediation summary needs.",
      instructionKey: 'c2ep29RetrievalEdit', evalKind: 'edit_for_precision', canDoId: 'edit_own_text_for_precision_and_tone',
      itemIds: ['lexical_precision_substitution_pattern'], evidenceType: 'delayedRetrieval',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Now complete the full mediation task independently: represent both sides faithfully and propose a useful next step.",
      instructionKey: 'c2ep29IndependentInstruction', evalKind: 'mediate_disagreement', canDoId: 'mediate_a_complex_disagreement_for_a_third_party',
      evaluationSpan: 'multiTurn', sourceRef: true,
      turnContext: [
        { speaker: 'landlord', textEn: "The tenant hasn't paid the increased rent since the notice went out three months ago, and I've been more than patient." },
        { speaker: 'tenant', textEn: "I never actually received a proper written notice - someone mentioned it in passing, but nothing was posted or mailed, and I'm not going to pay a rate I was never formally told about." },
      ],
      itemIds: ['reformulation_connector_pattern', 'face_saving_disagreement_pattern', 'concession_then_position_pattern', 'paragraph_scale_cohesion_pattern'],
      evidenceType: 'independent',
      delayedRetrievalChecks: [
        'summarize_preserving_nuance', 'manage_face_in_disagreement', 'preempt_and_rebut_a_counterargument',
        'repair_a_misunderstanding_at_intention_level', 'sustain_coherence_across_topic_shifts',
        'recognize_irony_and_understatement', 'edit_own_text_for_precision_and_tone',
      ],
      note: 'the exact seven capability ids c2EvaluationContracts.js\'s C2_CAPSTONE_DELAYED_RETRIEVAL_CHECKS declares — logged as delayedRetrieval evidence against this single task completion, per coreEngineRequirements[3]',
    },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep29TransferSceneTitle', bodyKey: 'c2ep29TransferSceneBody', ctaKey: 'c2ep29TransferStart',
      sourceTextEn: "Neighbor A: 'The shared fence between our yards blew down in the storm, and I've already paid a contractor half the cost - I think it's only fair we split it evenly.' Neighbor B: 'I never agreed to hire that specific contractor or that price - if I'd been asked first, I'd have found someone cheaper, so I don't think I should owe half of whatever you already decided to pay.'" },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Transfer: a wholly new dispute never used in any earlier arc. Complete the full mediation task, unaided.",
      instructionKey: 'c2ep29TransferInstruction', evalKind: 'mediate_disagreement', canDoId: 'mediate_a_complex_disagreement_for_a_third_party',
      evaluationSpan: 'multiTurn', sourceRef: true,
      turnContext: [
        { speaker: 'neighbor_a', textEn: "The shared fence between our yards blew down in the storm, and I've already paid a contractor half the cost - I think it's only fair we split it evenly." },
        { speaker: 'neighbor_b', textEn: "I never agreed to hire that specific contractor or that price - if I'd been asked first, I'd have found someone cheaper, so I don't think I should owe half of whatever you already decided to pay." },
      ],
      itemIds: ['reformulation_connector_pattern', 'face_saving_disagreement_pattern', 'concession_then_position_pattern', 'paragraph_scale_cohesion_pattern'],
      evidenceType: 'independent', transfer: true,
    },
    { type: 'completion', canDoNameKey: 'c2ep29CanDoName', titleKey: 'c2ep29CloseTitle', bodyKey: 'c2ep29CloseBody', ctaKey: 'c2ep29CloseCta' },
  ],
}

export const C2_ARC8 = [MEDIATE_01]
export const C2_ARC8_ID = 'integrated_mediation'
export const getC2Arc8Episode = (id) => C2_ARC8.find((ep) => ep.id === id) || null
