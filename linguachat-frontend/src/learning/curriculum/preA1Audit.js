/*
 * preA1Audit — what an audit says about Pre-A1, in its own words.
 *
 * The registry next door DERIVES facts from the episodes. This file holds the
 * other half of that knowledge: the judgements code cannot make. Whether a
 * capability is covered or merely visited once, which patterns the level claims
 * to teach and how far each is meant to travel, and what is deliberately left
 * for A1 — each with the reasoning attached, because a status with no reason is
 * an opinion nobody can check.
 *
 * It lives apart from the runtime registry for a plain reason: the product never
 * reads any of it. The checks and the documentation do. Keeping it here means
 * the reasoning survives in full without being downloaded by every learner
 * before they have seen a single screen.
 */
import { ARC_CAN_DOS, LEVEL } from './preA1Map.js'

export { LEVEL }

/* every capability the level actually teaches, for checks that cross-reference */
export const TAUGHT_CAN_DOS = ARC_CAN_DOS

/*
 * The patterns Pre-A1 puts in front of the learner, and how far each one gets.
 *
 *   comprehension        it is explained or recognised
 *   guided_production    built with the words supplied (gap-fill, word order)
 *   independent          produced from scratch in a free reply or recall
 */
export const PATTERN_COVERAGE = {
  /*
   * Only two patterns are ever produced from scratch, and both because they are
   * tracked through the phrase that carries them. The other five are practised
   * with the words supplied — a gap to fill or options to choose — and then the
   * learner moves on. They can say the sentences; the pattern itself has never
   * had to come out of their own head.
   */
  im_pattern: { term: 'I’m + name', reaches: 'independent', trackedAs: 'im' },
  whats_your_pattern: { term: 'What’s your + noun', reaches: 'independent', trackedAs: 'whats_your_name' },
  im_feeling_pattern: { term: 'I’m + feeling', reaches: 'guided_production', trackedAs: 'im_feeling_pattern' },
  im_from_pattern: { term: 'I’m from + place', reaches: 'guided_production', trackedAs: 'im_from_pattern' },
  i_like_pattern: { term: 'I like + noun', reaches: 'guided_production', trackedAs: 'i_like_pattern' },
  i_want_pattern: { term: 'I want + noun', reaches: 'guided_production', trackedAs: 'i_want_pattern' },
  can_i_have_pattern: { term: 'Can I have + item + please?', reaches: 'guided_production', trackedAs: 'can_i_have_pattern' },
  /*
   * Guided only, and it will stay guided while the arc says "Please speak
   * slowly." rather than "Can you speak slowly, please?": the frame is filled in
   * once, with the verb supplied. Claiming more would be the overstatement this
   * table exists to catch.
   */
  repair_pattern: { term: 'Can you + verb + please?', reaches: 'guided_production', trackedAs: 'repair_pattern' },
  /*
   * Both reach independent production: episode 16 ends by asking for an
   * identification with no model on screen, and episode 17's last recall asks
   * for a counted noun the same way.
   */
  its_a_pattern: { term: 'It’s a + thing', reaches: 'independent', trackedAs: 'its_a_pattern' },
  quantity_pattern: { term: 'number + thing', reaches: 'independent', trackedAs: 'quantity_pattern' },
  numbers_1_10: { term: 'one … ten', reaches: 'independent', trackedAs: 'numbers_1_10' },
}

/*
 * THE COMPLETION MAP.
 *
 * status
 *   covered           taught and practised often enough to rely on
 *   fragile           taught, but produced in only one episode
 *   needs_reuse       taught and then dropped; it must come back, not be retaught
 *   missing_required  Pre-A1 cannot honestly be called finished without it
 *   optional          would help, would not be missed
 *   defer_a1          real English, wrong level
 *
 * `covers` names the can-do or intent that already carries the capability, so
 * a check can confirm the claim instead of trusting it.
 */
export const CAPABILITY_MAP = [
  /* ---- already carried by the twelve episodes ---- */
  { id: 'greet_and_introduce', status: 'covered', covers: { canDo: 'introduce_self' }, note: 'produced in six episodes; the most reused skill in Pre-A1' },
  { id: 'ask_someones_name', status: 'covered', covers: { canDo: 'ask_name' } },
  { id: 'close_a_greeting', status: 'covered', covers: { canDo: 'full_greeting' } },
  { id: 'ask_and_answer_wellbeing', status: 'covered', covers: { canDo: 'ask_wellbeing' } },
  { id: 'ask_and_answer_origin', status: 'covered', covers: { canDo: 'ask_origin' } },
  { id: 'hold_a_first_conversation', status: 'covered', covers: { canDo: 'full_conversation' } },
  { id: 'express_a_preference', status: 'covered', covers: { canDo: 'express_preferences' } },
  { id: 'express_a_want_or_need', status: 'covered', covers: { canDo: 'express_needs' } },
  { id: 'agree_a_small_plan', status: 'covered', covers: { canDo: 'make_plan' } },
  { id: 'make_a_polite_request', status: 'covered', covers: { canDo: 'polite_request' } },
  { id: 'answer_a_follow_up_offer', status: 'covered', covers: { canDo: 'respond_anything_else' } },
  { id: 'complete_a_transaction', status: 'covered', covers: { canDo: 'cafe_order' } },

  /* ---- taught once and never asked for again ---- */
  { id: 'say_what_you_dislike', status: 'fragile', covers: { intent: 'express_dislike' },
    note: 'produced only in episode 7; "I don’t like…" never returns' },
  { id: 'answer_a_yes_no_preference', status: 'covered', covers: { intent: 'yes_no_preference' },
    note: 'episode 7, then episode 13 and inside episode 15’s story — answering a yes/no question is now what a repaired conversation leads back into' },
  { id: 'say_what_you_need', status: 'fragile', covers: { intent: 'express_need' },
    note: 'produced only in episode 8; the café practises wanting, never needing' },
  { id: 'decline_an_offer', status: 'covered', covers: { intent: 'decline_offer' },
    note: 'episode 8, then required again in episode 15 seven episodes later' },
  { id: 'bounce_a_question_back', status: 'covered', covers: { intent: 'reciprocal_question' },
    note: 'episodes 4 and 5, then produced again in episode 14 after a nine-episode gap' },

  /* ---- built by the fifth arc ---- */
  { id: 'repair_understanding', status: 'covered', covers: { canDo: 'ask_for_repair' },
    note: 'episodes 13 and 14; three strategies under one function, and every repair leads back into the conversation' },
  /*
   * Taught, and honestly not yet safe. Closing an encounter is produced twice
   * inside episode 15 — the story’s last turn and the variation after it — and
   * then never again, because episode 15 is where the curriculum currently ends.
   * That is the definition of `needs_reuse`, and calling it covered would be the
   * same optimism this map exists to prevent. The next arc has to ASK for a
   * goodbye rather than teach one.
   */
  /*
   * Was `needs_reuse` after arc 5, and the note said the next arc should ASK
   * for a goodbye rather than teach one. Episode 17 does: the counter exchange
   * ends with the learner closing it. That is what moved this line, not a
   * decision to feel better about it.
   */
  { id: 'say_thank_you_and_goodbye', status: 'covered',
    covers: { canDo: 'close_an_encounter', intent: 'close_encounter' },
    note: 'episode 15 teaches it; episode 17 requires it at the end of the counter exchange' },

  /* ---- built by arc 6; nothing required is missing now ---- */

  /*
   * Both were `missing_required` until this arc. Neither is `covered` by
   * arithmetic: they are covered because the episodes ask for the capability in
   * open turns, and because episode 17 puts identifying, counting, repairing,
   * ordering and closing in one exchange rather than in five exercises.
   *
   * "How much is it?" was in the original plan for numbers and is NOT here.
   * Prices need a second thing (money) and a second question form, and the
   * capability the audit asked for — answer "How many?" and ask for two of
   * something — is complete without them. It moves to the optional list rather
   * than being quietly dropped.
   */
  /*
   * The asking half, tracked separately because it carries its own forgetting
   * risk: "What's this?" is produced in episode 16 and never asked again, even
   * though it is the question that lets a learner pick up words on their own.
   * A1 should require it, not re-teach it.
   */
  { id: 'ask_what_a_thing_is', status: 'needs_reuse', covers: { intent: 'ask_what_thing' },
    note: 'episode 16 only; identifying comes back in episode 17, asking does not' },

  { id: 'name_and_ask_about_things', status: 'covered', covers: { canDo: 'identify_things' },
    note: 'episode 16: asking comes before answering, and three nouns appear because a frame needs something to be about' },

  /*
   * Taught, used four times inside its own episode, and then nowhere else —
   * because episode 17 is where the curriculum ends. Exactly the position
   * closing an encounter was in after arc 5, and it gets exactly the same
   * honest label rather than a promotion for being last.
   *
   * This is the one capability A1 must ASK for rather than introduce.
   */
  { id: 'small_numbers_and_quantity', status: 'needs_reuse', covers: { canDo: 'use_small_numbers', intent: 'use_quantity' },
    note: 'episode 17 only: one to ten as a single item, then counted, requested and confirmed at a counter — and never required again' },

  { id: 'ask_a_price', status: 'optional', priority: 'optional',
    why: 'The other half of the café transaction. It needs money as a second countable domain, which is an A1-sized addition rather than a Pre-A1 one.' },

  /* ---- would help, would not be missed ---- */
  { id: 'say_your_age', status: 'optional', priority: 'optional',
    why: 'One sentence, and it rides on numbers the learner would already have.' },
  { id: 'introduce_another_person', status: 'optional', priority: 'optional',
    why: '"This is my friend." adds a third person to a curriculum that has only ever had two, which is a real jump in complexity for one sentence of value.' },
  { id: 'say_what_you_do', status: 'optional', priority: 'optional',
    why: '"I work." / "I study." is personal information rather than a routine, so it fits Pre-A1 — but nothing already taught depends on it.' },
  { id: 'here_and_there', status: 'optional', priority: 'optional',
    why: 'Useful in a café; not required by anything the learner can currently do.' },

  /* ---- real English, wrong level ---- */
  { id: 'daily_routines', status: 'defer_a1', why: 'a routine needs frequency and time expressions, which need the present simple as a system rather than as a phrase' },
  { id: 'talk_about_the_past', status: 'defer_a1', why: 'a second tense doubles every pattern already taught' },
  { id: 'describe_people_and_places', status: 'defer_a1', why: 'adjectives before a noun, plurals and "there is/are" — a grammar layer Pre-A1 deliberately avoids' },
  { id: 'give_directions', status: 'defer_a1', why: 'prepositions of place plus imperatives; "Where is…?" alone is optional Pre-A1, the answer is not' },
  { id: 'explain_a_reason', status: 'defer_a1', why: '"because" turns one clause into two' },
  { id: 'tell_the_time', status: 'defer_a1', why: 'numbers beyond ten, plus its own question form' },
]

export const capabilitiesWithStatus = (status) => CAPABILITY_MAP.filter(c => c.status === status)

export const LAST_PRE_A1_CAPABILITY = 'small_numbers_and_quantity'
export const FIRST_A1_CAPABILITY = 'daily_routines'
