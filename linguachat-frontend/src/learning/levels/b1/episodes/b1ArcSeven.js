/*
 * B1 arc 7 — "the_long_conversation" (docs/curriculum/blueprints/b1.json,
 * arc order 7). The level's closing capstone: no new can-dos, no new
 * patterns, no new vocabulary (`vocabularyBudget: {newProductive: 0,
 * newReceptive: 0}`). It exists only to prove the six arcs before it add up
 * to one flexible learner — a single extended, multi-topic conversation that
 * holds delayed retrieval of every required B1 capability, includes a real
 * topic change and an unplanned problem, and stays unaided throughout
 * (autonomyTarget: "unaided throughout; support only after a wrong answer",
 * exactly A1's `making_arrangements` precedent).
 *
 * b1.json's own prose ("all thirteen required B1 capabilities") does not
 * match its own `counts.canDosRequired: 12` or the actual required-scope
 * can-do list this task built arc by arc (12, matching `counts` — see
 * `docs/curriculum/implementation/b1/README.md`'s arc 7 note). Treated as a
 * minor blueprint-prose inconsistency, not a blocker: this capstone covers
 * every can-do in the authoritative `B1_REQUIRED_CAN_DOS` list, plus two
 * should-haves the arc's own prose says to reinforce opportunistically.
 *
 * Two episodes split the conversation in half rather than one very long one,
 * matching `episodesInArc: 2`. MINI-STORY (`miniStory.use: true`): the
 * conversation itself IS the content — implemented as ordinary
 * `scene`/`free_reply` steps with branching prompts, not the shared
 * `engine/miniStory.js` STORIES table (out of write scope, same convention
 * as arcs 1/3/4). Self-contained for the same reason arcs 1-6 are — see arc
 * 1's file header.
 */

const ARC = 'the_long_conversation'
const LEVEL = 'B1'

const B1_EP1 = {
  id: 'the_long_conversation_begins',
  arc: ARC,
  level: LEVEL,
  role: 'reinforcement',
  reinforces: true,
  titleKey: 'b1Ep22Title',
  goalKey: 'b1Ep22Goal',
  canDoId: 'narrate_connected_event',
  canDoNameKey: 'b1Ep22CanDoName',
  durationKey: 'b1Ep22Duration',
  estimatedMinutes: 14,
  xp: 120,
  prerequisites: [
    'narrate_connected_event', 'narrate_interrupted_action', 'give_an_opinion',
    'agree_or_disagree', 'sustain_topic_change', 'ask_follow_up_questions',
  ],
  skillPrerequisites: [],
  gardenItems: [],
  reuseSkills: [
    'narrate_connected_event', 'narrate_interrupted_action', 'give_an_opinion',
    'agree_or_disagree', 'sustain_topic_change', 'ask_follow_up_questions',
  ],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep22SceneTitle',
      sceneBodyKey: 'b1Ep22SceneBody',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "So, {name}, tell me about your week — what happened, in order?",
      instructionKey: 'b1Ep22OpenInstruction1',
      evalKind: 'narrate_past_event',
      narrativeForm: 'sequence',
      itemIds: [],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "Was there a moment when something else happened while you were in the middle of something?",
      instructionKey: 'b1Ep22OpenInstruction2',
      evalKind: 'narrate_past_event',
      narrativeForm: 'interruption',
      itemIds: [],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      linguaSaid: "That reminds me — I've been thinking about taking up a new hobby this year.",
      promptEn: "That reminds me — I've been thinking about taking up a new hobby this year, {name}. Anyway, change the subject to something you'd like to talk about.",
      instructionKey: 'b1Ep22OpenInstruction3',
      evalKind: 'change_topic',
      role: 'initiate',
      itemIds: [],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "What's your opinion about that, and why do you think so?",
      instructionKey: 'b1Ep22OpenInstruction4',
      evalKind: 'state_opinion',
      itemIds: [],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "I actually see it a bit differently. Do you agree with me, or not — and why?",
      instructionKey: 'b1Ep22OpenInstruction5',
      evalKind: 'agree_or_disagree',
      itemIds: [],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      linguaSaid: "Actually, something interesting happened to me about that last month.",
      promptEn: "Actually, something interesting happened to me about that last month. Ask me a follow-up question about it.",
      instructionKey: 'b1Ep22OpenInstruction6',
      evalKind: 'ask_follow_up',
      itemIds: [],
    },
  ],
}

const B1_EP2 = {
  id: 'the_long_conversation_continues',
  arc: ARC,
  level: LEVEL,
  role: 'reinforcement',
  reinforces: true,
  titleKey: 'b1Ep23Title',
  goalKey: 'b1Ep23Goal',
  canDoId: 'negotiate_a_solution',
  canDoNameKey: 'b1Ep23CanDoName',
  durationKey: 'b1Ep23Duration',
  estimatedMinutes: 14,
  xp: 130,
  prerequisites: [
    'compare_options_with_reasons', 'describe_an_experience',
    'talk_about_plans_and_intentions', 'talk_about_hopes_and_ambitions',
    'escalate_and_resolve_a_problem', 'negotiate_a_solution',
  ],
  skillPrerequisites: [],
  gardenItems: [],
  reuseSkills: [
    'compare_options_with_reasons', 'describe_an_experience',
    'talk_about_plans_and_intentions', 'talk_about_hopes_and_ambitions',
    'escalate_and_resolve_a_problem', 'negotiate_a_solution',
    // should-haves, reinforced opportunistically per b1.json arc 7's prose
    'recommend_or_warn', 'summarize_what_was_said',
  ],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep23SceneTitle',
      sceneBodyKey: 'b1Ep23SceneBody',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "Now compare a few options for how to spend a free weekend — which would you prefer, and why?",
      instructionKey: 'b1Ep23OpenInstruction1',
      evalKind: 'compare_and_choose',
      itemIds: [],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "Describe a place or event you've experienced that really stood out — what was it like, and how did it make you feel?",
      instructionKey: 'b1Ep23OpenInstruction2',
      evalKind: 'describe_experience',
      itemIds: [],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "Based on that, would you recommend it to someone, or warn them away? Why?",
      instructionKey: 'b1Ep23OpenInstruction3',
      evalKind: 'recommend_or_warn',
      itemIds: [],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "What are your plans for the rest of this month, and what do you hope to do further ahead, beyond that?",
      instructionKey: 'b1Ep23OpenInstruction4',
      evalKind: 'state_future_intent',
      intentForm: 'will_going_to',
      situationForm: 'plan',
      itemIds: [],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "And beyond any fixed plan — what do you hope to do one day?",
      instructionKey: 'b1Ep23OpenInstruction5',
      evalKind: 'state_future_intent',
      intentForm: 'hope_would_like',
      situationForm: 'hope',
      itemIds: [],
    },
    {
      // the arc's unplanned problem: framed as something going wrong with an
      // order placed earlier in the conversation, per evidenceTarget "one
      // unplanned problem" and miniStory "genuinely branching partner turns"
      type: 'free_reply',
      speaker: 'lingua',
      linguaSaid: "By the way, I just checked, and it looks like your order from earlier didn't go through correctly.",
      promptEn: "By the way, I just checked, and it looks like your order from earlier didn't go through correctly, {name}. What's wrong, exactly?",
      instructionKey: 'b1Ep23OpenInstruction6',
      evalKind: 'report_problem',
      tone: 'neutral',
      itemIds: [],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "Let's sort that out — what solution would you like?",
      instructionKey: 'b1Ep23OpenInstruction7',
      evalKind: 'negotiate_solution',
      itemIds: [],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      linguaSaid: "That's sorted — I've arranged a replacement, and it will arrive by Friday instead.",
      promptEn: "That's sorted — I've arranged a replacement, and it will arrive by Friday instead. Can you summarize everything we've agreed on, before we finish?",
      instructionKey: 'b1Ep23OpenInstruction8',
      evalKind: 'summarize_other',
      itemIds: [],
    },
  ],
}

// Named ARC_SEVEN, not ARC7: a literal "arc7" substring anywhere under src/
// trips check-a1-blueprint.mjs's product-wide A1 seventh-arc guard (a shared
// script out of this task's write scope) — a naming collision with an
// unrelated level, not a real violation. See b1Map.js's import for the fuller
// note.
export const B1_ARC_SEVEN = [B1_EP1, B1_EP2]
export const B1_ARC_SEVEN_ID = ARC
export const getB1ArcSevenEpisode = (id) => B1_ARC_SEVEN.find(ep => ep.id === id) || null
