/*
 * A2 semantic-type proposals — level-owned, not registered.
 *
 * `engine/semanticContext.js`'s `SEMANTIC_TYPES` is a shared, flat registry
 * (curriculum-isolation-plan.md's survey names it explicitly). This task's write
 * scope does not include `engine/**`, so nothing here mutates that registry —
 * exactly the boundary `docs/curriculum/blueprints/a2.json#semanticTypes`
 * describes as "proposed", not built. This module is the level-owned, executable
 * form of that proposal: the same shape `SEMANTIC_TYPES`/`isSemanticType` already
 * use, plus a validator per type, ready for a later integration task
 * (`LC-INT-001`, which does have `engine/**` in scope) to fold in — see
 * `docs/curriculum/implementation/a2/core-requirements.md` for the exact ask.
 *
 * Six types total: five newly proposed by A2 (`past_time`, `future_time`,
 * `month`, `date_ordinal`, `quality`, `problem` — six, see count below) plus one
 * A1 already proposed and left unregistered (`day`), which A2 is the first level
 * to actually need. `a2.json#counts.newSemanticTypesRequired` says 5; `problem`
 * makes the sixth entry here because a2.json's own `canDos` list references it
 * twice (report_a_problem, ask_for_help_solving_a_problem) even though the top
 * count summary undercounts it — both are reproduced faithfully below rather
 * than silently reconciled, since reconciling a blueprint number is not this
 * task's job.
 */

/*
 * Same list shape as `engine/semanticContext.js`'s `SEMANTIC_TYPES` array, kept
 * separate on purpose: this task cannot import from `engine/**`, and importing a
 * shared array from a level-owned module would blur exactly the isolation
 * boundary this task is scoped to respect.
 */
export const A2_SEMANTIC_TYPES = ['past_time', 'future_time', 'month', 'date_ordinal', 'quality', 'problem', 'day']

export const isA2SemanticType = (type) => A2_SEMANTIC_TYPES.includes(type)

/*
 * Every entry below states the SAME four things a2.json#semanticTypes.proposed
 * already states in prose (requiredBy, examples, incompatibleWith, why), plus a
 * `validate(value)` function so the proposal is directly testable rather than
 * only readable. `validate` is intentionally conservative — a closed example
 * list plus a light shape check — exactly like A1's registered types (e.g.
 * `time_point`), not a general-purpose parser.
 */
export const A2_SEMANTIC_TYPE_DEFS = {
  past_time: {
    requiredBy: ['talk_about_what_you_did', 'narrate_a_sequence_of_past_events'],
    examples: ['yesterday', 'last night', 'last week', 'two days ago'],
    incompatibleWith: ['future_time', 'time_point'],
    why: "A1's time_point is an hour inside a day that is still happening; a past time anchors a sentence entirely outside the present and takes a different verb form with it.",
    validate(value) {
      const v = String(value || '').trim().toLowerCase()
      if (!v) return false
      if (/^(yesterday|last night)$/.test(v)) return true
      if (/^last (week|month|year|weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/.test(v)) return true
      if (/^(a couple of|two|three|four|five|\d+) days? ago$/.test(v)) return true
      return false
    },
  },
  future_time: {
    requiredBy: ['talk_about_future_plans', 'invite_someone_to_do_something'],
    examples: ['tomorrow', 'next week', 'this weekend'],
    incompatibleWith: ['past_time', 'time_point'],
    why: "Symmetric with past_time: 'going to' needs a slot that rejects 'yesterday' the way ability rejects a repair-request reading.",
    validate(value) {
      const v = String(value || '').trim().toLowerCase()
      if (!v) return false
      if (/^(tomorrow|tonight|this weekend|this evening)$/.test(v)) return true
      if (/^next (week|month|year|weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/.test(v)) return true
      return false
    },
  },
  month: {
    requiredBy: ['use_dates_and_months'],
    examples: ['January', 'March', 'December'],
    incompatibleWith: ['day'],
    why: "A month and a weekday combine ('the third of March') but are not interchangeable; a slot that accepts 'Monday' for a month would let the engine build 'the third of Monday'.",
    validate(value) {
      const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
      return MONTHS.includes(String(value || '').trim().toLowerCase())
    },
  },
  date_ordinal: {
    requiredBy: ['use_dates_and_months'],
    examples: ['the first', 'the twentieth', 'the thirty-first'],
    incompatibleWith: ['time_point'],
    why: "An ordinal position in a month is not an hour and not a cardinal quantity; 'the three of March' is exactly the error this type exists to block.",
    validate(value) {
      const v = String(value || '').trim().toLowerCase()
      return /^(the )?(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|twenty-first|twenty-second|twenty-third|twenty-fourth|twenty-fifth|twenty-sixth|twenty-seventh|twenty-eighth|twenty-ninth|thirtieth|thirty-first)$/.test(v)
    },
  },
  quality: {
    requiredBy: ['describe_a_person_or_place', 'compare_two_things'],
    examples: ['big', 'small', 'quiet', 'expensive', 'cheap', 'friendly'],
    incompatibleWith: ['activity', 'place'],
    why: "A comparable attribute is neither the place nor the object it describes; the comparative pattern needs a slot it can put '-er than' on, which a place or object type cannot take.",
    validate(value) {
      const QUALITIES = ['big', 'small', 'quiet', 'noisy', 'expensive', 'cheap', 'friendly', 'unfriendly', 'clean', 'dirty', 'old', 'new', 'modern', 'crowded', 'empty', 'safe', 'central', 'far', 'near', 'nice', 'good', 'bad']
      return QUALITIES.includes(String(value || '').trim().toLowerCase())
    },
  },
  problem: {
    requiredBy: ['report_a_problem', 'ask_for_help_solving_a_problem'],
    examples: ['broken', "doesn't work", 'lost', 'the wrong one', 'cold', 'noisy'],
    incompatibleWith: ['feeling'],
    why: "A malfunction is not an emotional state, even though both can follow 'it's'; conflating them would let 'I'm broken' pass as a valid problem report. Bounded to the level's three neutral problem contexts (a cold room, a wrong order, a lost item) per a2.md's explicit ceiling — this is not an open-ended catalogue.",
    validate(value) {
      const v = String(value || '').trim().toLowerCase()
      const PROBLEM_PHRASES = ['broken', "doesn't work", "isn't working", 'lost', 'missing', 'the wrong one', 'cold', 'too cold', 'noisy', 'too noisy', "not what i ordered", 'wrong order']
      return PROBLEM_PHRASES.some((p) => v === p || v.includes(p))
    },
  },
  day: {
    requiredBy: ['use_dates_and_months', 'book_a_room_or_table'],
    examples: ['Monday', 'Tuesday', 'Saturday'],
    incompatibleWith: ['time_point', 'relation'],
    why: "Proposed by A1 for its designed-only arc 7 (making_arrangements) and not yet built into the engine. A2 is the first level whose implementation actually needs it. Incompatibilities reused verbatim from A1's own proposal (a1-blueprint.json) so a later single registration does not silently fork the type — see core-requirements.md.",
    validate(value) {
      const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      return DAYS.includes(String(value || '').trim().toLowerCase())
    },
  },
}

/*
 * Personalization slot compatibility for A2's themed/light arcs
 * (a2.md §7). Declared here, not invented ad hoc per episode, so
 * `check-a2-structure.mjs` and a future personalization-invariant test have one
 * source of truth for "which slot types may a given arc's personalized value
 * use".
 */
export const A2_ARC_PERSONALIZATION = {
  what_happened: { mode: 'light', slots: ['activity'], neutralFallback: 'a shared neutral daily activity ("I worked", "I studied")' },
  making_plans: { mode: 'light', slots: ['activity', 'future_time'], neutralFallback: "I'm going to relax this weekend." },
  people_and_places: { mode: 'themed', slots: ['place', 'person', 'quality'], neutralFallback: 'a generic neutral café/neighbourhood pair' },
  getting_around: { mode: 'none', slots: [], neutralFallback: null },
  booking_a_stay: { mode: 'light', slots: ['activity', 'date_ordinal', 'month'], neutralFallback: 'a generic restaurant-table booking' },
  everyday_problems: { mode: 'light', slots: ['problem'], neutralFallback: 'the room is cold' },
  lets_do_something: { mode: 'themed', slots: ['activity'], neutralFallback: 'go to the cinema' },
}
