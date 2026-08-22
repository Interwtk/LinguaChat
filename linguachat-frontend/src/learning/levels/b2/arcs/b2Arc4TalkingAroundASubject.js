/*
 * B2 arc 4 — "Talking around a subject" (`talking_around_a_subject`).
 *
 * Derived from docs/curriculum/blueprints/b2.json arc `talking_around_a_subject`
 * (order 4) and b2.md section 4 / arc 4 entry. Independent arc, prerequisite:
 * B1 exit only (b1.narrate_connected_event, b1.sustain_topic_change).
 * Introduces summarize_for_someone_else and reformulate_to_clarify (both
 * required) and report_someone_elses_opinion (should). Also reuses B2's own
 * develop_and_defend_opinion ("recognizing an opinion well enough to report
 * it", per b2.json arc.b2Reuse) without evaluating it as a separate step —
 * that recognition lives inside EP3's source material.
 *
 * MEDIATION SHAPE. This arc is the curriculum's first required capability
 * family where processing someone else's language for a third party is
 * itself the skill (b2.json coreEngineRequirements
 * `meaning_preserved_reformulation_check`). Every teaching episode therefore
 * presents a short SOURCE TEXT/conversation via a `scene` step carrying an
 * extra literal-English `sourceTextEn` field (harmless extra key on an
 * existing step type, not a new step type), followed by a `free_reply` step
 * whose `promptEn` is a third party's request and which carries `sourceRef:
 * true` so a future evaluator knows to grade it against the preceding
 * `sourceTextEn` for meaning-preservation rather than a canonical frame match
 * (documented gap: docs/curriculum/core-engine-requirements.md /
 * b2.md section 15.4 — not solved here, only structured for it).
 *
 * STRUCTURE. Four episodes, same shape as b2Arc1MakingTheCase.js: one
 * teaching episode per new capability (assisted-open production on one
 * source text, then one unaided production on a second source text) plus an
 * arc-closing INTEGRATED episode that reuses every capability the arc taught
 * against a genuinely NEW topic (a book club's changed plans) never used in
 * EP1-EP3 — this is what makes those turns TRANSFER evidence rather than
 * repetition, and it is also where the arc's second independent-production
 * instance for each required capability lives.
 *
 * EVIDENCE ACCOUNTING (must match b2.json#/canDos[].evidence):
 *   summarize_for_someone_else (required, independent:2, transfer:1) —
 *     1 independent in EP1 (step 8), 1 independent + 1 transfer in EP4
 *     (step 3).
 *   reformulate_to_clarify (required, independent:2, transfer:1) —
 *     1 independent in EP2 (step 9), 1 independent + 1 transfer in EP4
 *     (step 7).
 *   report_someone_elses_opinion (should, independent:1, transfer:0) —
 *     1 independent in EP3 (step 8); EP4 (step 5) reinforces it with guided
 *     reuse only, matching its lighter evidence target (no transfer
 *     required), the same convention b2Arc1MakingTheCase.js uses for its own
 *     should-scope capability (concede_a_point_and_counter) in INTEGRATED_04.
 *
 * STEP TYPES. Only the nine types `EpisodeShell.jsx` already renders (scene,
 * model, comprehension, choice, word_order, fill_blank, free_reply, recall,
 * completion). `evalKind` values are B2 intent ids from `b2Intents.js`;
 * `canDoId` is added explicitly on every evaluated step so validation never
 * has to infer it from the intent map.
 *
 * All prose lives behind i18n keys (never populated by this task); every
 * English target/prompt/source text is literal, exactly as every earlier
 * level does it. Key namespace: b2ep13 (EP1) - b2ep16 (EP4), chosen because
 * b2ep1-b2ep12 are already spoken for by arcs 1-3.
 */

const SUMMARIZE_01 = {
  id: 'b2_talking_around_a_subject_summarize',
  arc: 'talking_around_a_subject',
  level: 'B2',
  role: 'primary',
  titleKey: 'b2ep13Title',
  goalKey: 'b2ep13Goal',
  canDoId: 'summarize_for_someone_else',
  canDoNameKey: 'b2ep13CanDoName',
  durationKey: 'b2ep13Duration',
  estimatedMinutes: 10,
  xp: 90,
  prerequisites: [],
  skillPrerequisites: ['b1.narrate_connected_event', 'b1.sustain_topic_change'],
  gardenItems: ['reported_speech_pattern', 'summary_connector_pattern', 'so_basically', 'long_story_short', 'the_gist_of_it_is', 'to_sum_it_up'],
  reuseSkills: ['b1.narrate_connected_event', 'b1.sustain_topic_change'],
  steps: [
    { type: 'scene', mood: 'attentive', titleKey: 'b2ep13SceneTitle', bodyKey: 'b2ep13SceneBody', showGoal: true, ctaKey: 'b2ep13Start' },
    {
      type: 'model',
      target: "So basically, they were saying the deadline's been pushed to Friday, and the client wants a shorter proposal.",
      meaningItems: ['summary_connector_pattern', 'reported_speech_pattern'], explainKey: 'b2ep13ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'b2ep13ComprehensionInstruction',
      target: 'Long story short, she mentioned the venue had changed and asked us to confirm by Friday.',
      itemId: 'reported_speech_pattern',
      options: [{ key: 'b2ep13CompOptCorrect', correct: true }, { key: 'b2ep13CompOptWrong1' }, { key: 'b2ep13CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'b2ep13NearMissInstruction',
      target: "MAYA: Can we push the 10am meeting to 2pm? TOM: Sure. Actually, can we do Thursday instead? MAYA: Thursday at 2 is fine, I'll update the invite.",
      itemId: 'summary_connector_pattern',
      options: [{ key: 'b2ep13NearMissOptCorrect', correct: true }, { key: 'b2ep13NearMissOptWrong1' }, { key: 'b2ep13NearMissOptWrong2' }],
      explainKey: 'b2ep13NearMissExplain',
    },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'b2ep13SourceSceneTitle', bodyKey: 'b2ep13SourceSceneBody', ctaKey: 'b2ep13SourceStart',
      sourceTextEn: "MAYA: Can we push the 10am meeting to 2pm? I've got a dentist appointment. TOM: Sure, that works for me. Actually, can we do it on Thursday instead? Friday's really packed for the whole team. MAYA: Thursday at 2 is fine. I'll update the invite.",
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Hey, what did Maya and Tom decide about the meeting? I just got back from lunch.",
      instructionKey: 'b2ep13AssistedInstruction', evalKind: 'summarize_for_third_party', canDoId: 'summarize_for_someone_else',
      suggestionEn: "So basically, they moved the meeting to Thursday at 2pm because Maya has a dentist appointment and Friday's packed for the team.",
      itemIds: ['reported_speech_pattern', 'summary_connector_pattern'], evidenceType: 'assistedOpen', sourceRef: true,
    },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'b2ep13SourceScene2Title', bodyKey: 'b2ep13SourceScene2Body', ctaKey: 'b2ep13SourceStart2',
      sourceTextEn: "PRIYA: Are we still on for hiking Saturday? JON: Actually, the forecast says rain, so I was thinking we push it to Sunday instead, if that works. PRIYA: Sunday's better for me anyway. Let's do that, and maybe start earlier, like 8am. JON: 8am Sunday, sounds good.",
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Quick question, did Priya and Jon figure out the hiking plan? I missed the messages.',
      instructionKey: 'b2ep13IndependentInstruction', evalKind: 'summarize_for_third_party', canDoId: 'summarize_for_someone_else',
      itemIds: ['summary_connector_pattern'], evidenceType: 'independent', sourceRef: true,
    },
    { type: 'recall', instructionKey: 'b2ep13FinalInstruction', evalKind: 'summarize_for_third_party', canDoId: 'summarize_for_someone_else', itemIds: ['reported_speech_pattern'] },
    { type: 'completion', canDoNameKey: 'b2ep13CanDoName', titleKey: 'b2ep13CloseTitle', bodyKey: 'b2ep13CloseBody', ctaKey: 'b2ep13CloseCta' },
  ],
}

const REFORMULATE_02 = {
  id: 'b2_talking_around_a_subject_reformulate',
  arc: 'talking_around_a_subject',
  level: 'B2',
  role: 'primary',
  titleKey: 'b2ep14Title',
  goalKey: 'b2ep14Goal',
  canDoId: 'reformulate_to_clarify',
  canDoNameKey: 'b2ep14CanDoName',
  durationKey: 'b2ep14Duration',
  estimatedMinutes: 10,
  xp: 90,
  prerequisites: ['b2_talking_around_a_subject_summarize'],
  skillPrerequisites: ['summarize_for_someone_else'],
  gardenItems: ['reformulation_marker_pattern', 'to_put_it_another_way', 'if_i_understood_correctly', 'let_me_break_it_down', 'essentially', 'just_to_clarify'],
  reuseSkills: ['summarize_for_someone_else'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'b2ep14RecallInstruction', evalKind: 'summarize_for_third_party', canDoId: 'summarize_for_someone_else', itemIds: ['summary_connector_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'b2ep14SceneTitle', bodyKey: 'b2ep14SceneBody', ctaKey: 'b2ep14Start' },
    {
      type: 'model',
      target: "In other words, your account's on hold until the verification email is confirmed — essentially, just check your inbox.",
      meaningItems: ['reformulation_marker_pattern'], explainKey: 'b2ep14ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'b2ep14ComprehensionInstruction',
      target: "Put simply, we're just waiting on your signature before the contract can start.",
      itemId: 'reformulation_marker_pattern',
      options: [{ key: 'b2ep14CompOptCorrect', correct: true }, { key: 'b2ep14CompOptWrong1' }, { key: 'b2ep14CompOptWrong2' }],
    },
    {
      type: 'word_order', instructionKey: 'b2ep14BuildInstruction', hintKey: 'b2ep14BuildHint', itemId: 'reformulation_marker_pattern',
      tokens: ['What', 'I', 'mean', 'is', ',', 'the', 'account', 'is', 'still', 'active', '.'],
    },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'b2ep14SourceSceneTitle', bodyKey: 'b2ep14SourceSceneBody', ctaKey: 'b2ep14SourceStart',
      sourceTextEn: 'AUTOMATED MESSAGE: Your request ref #4471 has been escalated pending secondary review; please allow 3-5 business days, though expedited processing may apply if supplementary documentation was previously submitted.',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'I got this message about my order and I have no idea what it means. Can you explain it?',
      instructionKey: 'b2ep14AssistedInstruction', evalKind: 'reformulate_for_clarity', canDoId: 'reformulate_to_clarify',
      suggestionEn: "Put simply, they're reviewing your request and it'll take three to five days — it might be faster if you already sent extra documents.",
      itemIds: ['reformulation_marker_pattern'], evidenceType: 'assistedOpen', sourceRef: true,
    },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'b2ep14SourceScene2Title', bodyKey: 'b2ep14SourceScene2Body', ctaKey: 'b2ep14SourceStart2',
      sourceTextEn: 'GYM APP: Your membership tier has been auto-adjusted following the promotional period lapse; continued access to premium facilities is contingent on tier reconfirmation within the applicable grace window.',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "This gym message makes zero sense to me — what's it actually saying?",
      instructionKey: 'b2ep14IndependentInstruction', evalKind: 'reformulate_for_clarity', canDoId: 'reformulate_to_clarify',
      itemIds: ['reformulation_marker_pattern'], evidenceType: 'independent', sourceRef: true,
    },
    { type: 'recall', instructionKey: 'b2ep14FinalInstruction', evalKind: 'reformulate_for_clarity', canDoId: 'reformulate_to_clarify', itemIds: ['reformulation_marker_pattern'] },
    { type: 'completion', canDoNameKey: 'b2ep14CanDoName', titleKey: 'b2ep14CloseTitle', bodyKey: 'b2ep14CloseBody', ctaKey: 'b2ep13CloseCta' },
  ],
}

const REPORT_OPINION_03 = {
  id: 'b2_talking_around_a_subject_report_opinion',
  arc: 'talking_around_a_subject',
  level: 'B2',
  role: 'secondary',
  titleKey: 'b2ep15Title',
  goalKey: 'b2ep15Goal',
  canDoId: 'report_someone_elses_opinion',
  canDoNameKey: 'b2ep15CanDoName',
  durationKey: 'b2ep15Duration',
  estimatedMinutes: 8,
  xp: 75,
  prerequisites: ['b2_talking_around_a_subject_reformulate'],
  skillPrerequisites: ['summarize_for_someone_else', 'b1.give_an_opinion'],
  gardenItems: ['what_they_were_saying_was', 'the_way_i_understood_it', 'a_key_takeaway', 'hearsay'],
  reuseSkills: ['summarize_for_someone_else', 'develop_and_defend_opinion'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'b2ep15RecallInstruction', evalKind: 'reformulate_for_clarity', canDoId: 'reformulate_to_clarify', itemIds: ['reformulation_marker_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'b2ep15SceneTitle', bodyKey: 'b2ep15SceneBody', ctaKey: 'b2ep15Start' },
    {
      type: 'model',
      target: "What they were saying was that, in their view, the rooftop venue would work better than the hotel — they seemed pretty convinced.",
      meaningItems: ['reported_speech_pattern', 'what_they_were_saying_was'], explainKey: 'b2ep15ModelExplain',
    },
    {
      /*
       * canDoId here is a deliberate light touch, not new evidence: b2.json
       * arc.b2Reuse names develop_and_defend_opinion as reused in this arc
       * ("recognizing an opinion well enough to report it"), and this is
       * exactly that recognition act — spotting the opinion ("worth the
       * extra cost") inside someone else's reported speech, the prerequisite
       * skill report_someone_elses_opinion actually needs. No evidenceType
       * is set: its own independent/transfer evidence is already met by
       * arc 1 and reinforced in arc 6, so this is recognition-reuse only.
       */
      type: 'comprehension', instructionKey: 'b2ep15ComprehensionInstruction',
      target: 'The way I understood it, he thought the earlier flight was worth the extra cost.',
      itemId: 'reported_speech_pattern', canDoId: 'develop_and_defend_opinion',
      options: [{ key: 'b2ep15CompOptCorrect', correct: true }, { key: 'b2ep15CompOptWrong1' }, { key: 'b2ep15CompOptWrong2' }],
    },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'b2ep15SourceSceneTitle', bodyKey: 'b2ep15SourceSceneBody', ctaKey: 'b2ep15SourceStart',
      sourceTextEn: "LEO: Honestly, I don't know, I mean the beach trip could be fun, but it's such a long drive, and then parking is always a nightmare there, so... I don't know, maybe the lake would just be easier? I keep going back and forth, but yeah, I think I'd lean towards the lake, if I'm honest.",
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Did Leo ever decide what he thinks, beach or lake? I couldn't follow all of that.",
      instructionKey: 'b2ep15AssistedInstruction', evalKind: 'report_third_party_opinion', canDoId: 'report_someone_elses_opinion',
      suggestionEn: 'The way I understood it, he thinks the lake would be easier, mainly because of the drive and the parking at the beach.',
      itemIds: ['reported_speech_pattern'], evidenceType: 'assistedOpen', sourceRef: true,
    },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'b2ep15SourceScene2Title', bodyKey: 'b2ep15SourceScene2Body', ctaKey: 'b2ep15SourceStart2',
      sourceTextEn: "NADIA: I mean, the new scheduling tool is fine, I guess, it's just, there's so many extra steps now, and half the team still uses the old spreadsheet anyway, so I don't really see the point, but maybe I just need more time with it, who knows.",
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'What does Nadia actually think of the new scheduling tool? Worth switching or not?',
      instructionKey: 'b2ep15IndependentInstruction', evalKind: 'report_third_party_opinion', canDoId: 'report_someone_elses_opinion',
      itemIds: ['reported_speech_pattern'], evidenceType: 'independent', sourceRef: true,
    },
    { type: 'completion', canDoNameKey: 'b2ep15CanDoName', titleKey: 'b2ep15CloseTitle', bodyKey: 'b2ep15CloseBody', ctaKey: 'b2ep13CloseCta' },
  ],
}

const INTEGRATED_04 = {
  id: 'b2_talking_around_a_subject_integrated',
  arc: 'talking_around_a_subject',
  level: 'B2',
  role: 'integrated',
  titleKey: 'b2ep16Title',
  goalKey: 'b2ep16Goal',
  canDoId: 'summarize_for_someone_else',
  canDoNameKey: 'b2ep16CanDoName',
  durationKey: 'b2ep16Duration',
  estimatedMinutes: 12,
  xp: 110,
  prerequisites: ['b2_talking_around_a_subject_report_opinion'],
  skillPrerequisites: ['summarize_for_someone_else', 'reformulate_to_clarify', 'report_someone_elses_opinion'],
  gardenItems: [],
  reuseSkills: ['summarize_for_someone_else', 'reformulate_to_clarify', 'report_someone_elses_opinion', 'develop_and_defend_opinion'],
  /*
   * Transfer topic: the learner's book club — genuinely new, never used in
   * EP1-EP3 (b2.json canDos[].transferContexts: "summarizing a source
   * text/conversation not used during teaching" / "reformulating a passage
   * not used during teaching"). This is what makes the two production turns
   * below TRANSFER, not repetition.
   */
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'b2ep16SceneTitle', bodyKey: 'b2ep16SceneBody', showGoal: true, ctaKey: 'b2ep16Start' },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'b2ep16SourceSceneTitle', bodyKey: 'b2ep16SourceSceneBody', ctaKey: 'b2ep16SourceStart',
      sourceTextEn: "REN: Should we move book club to the café instead of Ana's place this month? Ana's redecorating. SAM: Café works, but it's smaller — should we cap it at eight people? REN: Good idea, let's cap it at eight and I'll message everyone.",
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Did the book club people decide where they're meeting this month? I saw a bunch of messages but didn't read them.",
      instructionKey: 'b2ep16SummarizeInstruction', evalKind: 'summarize_for_third_party', canDoId: 'summarize_for_someone_else',
      itemIds: ['reported_speech_pattern', 'summary_connector_pattern'], evidenceType: 'independent', transfer: true, sourceRef: true,
    },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'b2ep16SourceScene2Title', bodyKey: 'b2ep16SourceScene2Body', ctaKey: 'b2ep16SourceStart2',
      sourceTextEn: "SAM: Honestly, between the mystery novel and the memoir, I keep changing my mind — the memoir's supposed to be beautifully written, but the mystery just sounds like more fun for a group discussion, so... yeah, I think I'd lean mystery, but I'm genuinely fine with either.",
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'What does Sam think about which book to read next? I trust her taste.',
      instructionKey: 'b2ep16ReportInstruction', evalKind: 'report_third_party_opinion', canDoId: 'report_someone_elses_opinion',
      suggestionEn: "The way I understood it, she thinks the mystery novel would be more fun to discuss than the memoir, but she's genuinely open to either.",
      itemIds: ['reported_speech_pattern'], evidenceType: 'guided', sourceRef: true,
    },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'b2ep16SourceScene3Title', bodyKey: 'b2ep16SourceScene3Body', ctaKey: 'b2ep16SourceStart3',
      sourceTextEn: 'SIGN-UP SYSTEM: Attendance confirmation for recurring participants is now contingent on prior RSVP submission within the 48-hour pre-event window; non-compliant entries default to waitlist status pending capacity review.',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "This sign-up email is so confusing — what is it actually telling people to do?",
      instructionKey: 'b2ep16ReformulateInstruction', evalKind: 'reformulate_for_clarity', canDoId: 'reformulate_to_clarify',
      itemIds: ['reformulation_marker_pattern'], evidenceType: 'independent', transfer: true, sourceRef: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Okay, that all makes sense now — thanks for catching me up. Anything else before I message the group?',
      instructionKey: 'b2ep16CloseInstruction', evalKind: 'summarize_for_third_party', canDoId: 'summarize_for_someone_else',
      suggestionEn: "No, I think that covers it — just the café, the book pick, and the new RSVP rule.",
      itemIds: ['summary_connector_pattern'], evidenceType: 'assistedOpen',
    },
    { type: 'recall', instructionKey: 'b2ep16FinalInstruction', evalKind: 'reformulate_for_clarity', canDoId: 'reformulate_to_clarify', itemIds: ['reformulation_marker_pattern'] },
    { type: 'completion', canDoNameKey: 'b2ep16CanDoName', titleKey: 'b2ep16CloseTitle', bodyKey: 'b2ep16CloseBody', ctaKey: 'b2ep13CloseCta' },
  ],
}

export const B2_ARC4 = [SUMMARIZE_01, REFORMULATE_02, REPORT_OPINION_03, INTEGRATED_04]
export const B2_ARC4_ID = 'talking_around_a_subject'
export const getB2Arc4Episode = (id) => B2_ARC4.find((ep) => ep.id === id) || null
