/*
 * C2 intent catalog — one intent per communicative function
 * (`c2.json#/intentStrategy`'s rule), with a worked example set per intent
 * matching the blueprint's own section 11 categories: correct / natural
 * variant / near miss / wrong meaning / nonsense / pragmatically
 * inappropriate. Unlike lower levels' five-category convention,
 * `pragmaticallyInappropriate` is a BASE category here, not an optional
 * extra — c2.md section 11 requires it for every new C2 intent, since
 * grammatically flawless-but-pragmatically-wrong output is exactly the
 * failure mode C2 evaluation must catch.
 *
 * This is content, not evaluator code: nothing here is wired into
 * `engine/responseEvaluation.js`'s dispatch (out of this task's write
 * scope). It is the exact spec `LC-INT-001` needs to write real per-intent
 * evaluator functions against — see
 * `docs/curriculum/implementation/c2/core-engine-handoff.md`.
 *
 * Every example below is authored in
 * `docs/curriculum/implementation/c2/content-plan.json` first, against the
 * same source texts the arc content modules use, then transcribed here
 * verbatim; `scripts/foundry/c2/check-c2-intent-catalog.mjs` diffs the two.
 */

export const C2_INTENTS = [
  {
    id: 'extract_argument',
    capabilityId: 'extract_key_argument_from_dense_text',
    evaluationBucket: 'hybrid',
    examples: {
      correct: "The author's claim is that the flexible-hours policy may be doing more harm than good, based on falling meeting attendance and missed deadlines, though the author hedges by admitting it could still be an adjustment period.",
      naturalVariant: "Basically the writer thinks the new schedule policy might not be worth it - meetings are being missed and two projects were late, even though they say give it more time.",
      nearMiss: 'The office started a flexible hours policy and meetings and deadlines got worse.',
      nearMissNote: 'recognized as a topic summary, marked as missing the claim/support/hedge structure the capability actually tests',
      wrongMeaning: 'The author argues that flexible hours have clearly failed and should be scrapped immediately.',
      nonsense: 'Meetings happen when people want coffee.',
      pragmaticallyInappropriate: 'lol flex hours suck get rid of them',
    },
  },
  {
    id: 'synthesize_viewpoints',
    capabilityId: 'synthesize_multiple_viewpoints',
    evaluationBucket: 'hybrid',
    examples: {
      correct: "One resident feels the bike lane has clearly reduced car traffic near the school, while another agrees it looks good on paper but argues delivery-truck double-parking has actually made drop-off traffic worse - so the two accounts genuinely disagree on the real-world effect, not just its framing.",
      naturalVariant: "The two neighbors don't agree: one says the bike lane cut traffic a lot, the other says trucks parking in the road made it worse at pickup time.",
      nearMiss: 'The bike lane cut car traffic outside the school by half.',
      nearMissNote: 'recognized as reporting only one viewpoint, marked as missing the actual disagreement',
      wrongMeaning: 'Both residents agree the bike lane has made the street calmer and safer.',
      nonsense: 'Elm Street has more bikes now than before the lane existed, probably.',
      pragmaticallyInappropriate: "one person likes it, one doesn't, whatever",
    },
  },
  {
    id: 'identify_stance',
    capabilityId: 'identify_authors_stance_and_bias',
    evaluationBucket: 'hybrid',
    examples: {
      correct: "The author is skeptical of the policy but not fully committed to condemning it yet - the hedge 'perhaps it is' shows they're leaving room for the adjustment-period explanation before drawing a final conclusion.",
      naturalVariant: 'The writer seems doubtful about the new hours policy, though they admit it might just need more time.',
      nearMiss: "The author doesn't like the new policy.",
      nearMissNote: 'recognized as a correct polarity read, marked as missing the certainty/hedge evidence the capability actually tests',
      wrongMeaning: 'The author is fully in favor of the flexible-hours policy.',
      nonsense: 'The author works in an office.',
      pragmaticallyInappropriate: 'the boss is obviously lying to cover it up',
    },
  },
  {
    id: 'reformulate_for_audience',
    capabilityId: 'reformulate_dense_source_for_a_new_audience',
    evaluationBucket: 'hybrid',
    examples: {
      correct: "From next month, if you spend more than $50, you'll need to attach a digital receipt and a short note saying what it was for - otherwise it gets sent back and your reimbursement takes 3-5 days longer.",
      naturalVariant: "Basically, big expenses (over $50) now need a receipt and a quick explanation, or they'll bounce back and you'll wait longer to get paid back.",
      nearMiss: "Big expenses need a receipt now, so you'll get your money back.",
      nearMissNote: 'recognized as an attempt at reformulation, marked for dropping the hedge/condition (the single most likely near-miss failure mode per c2.md arc 2 risk note)',
      wrongMeaning: 'All expense claims will now be rejected automatically.',
      nonsense: 'Receipts are stored in the third filing cabinet.',
      pragmaticallyInappropriate: 'Per Section 4.2(b), all expenditures exceeding the stipulated $50 threshold shall be accompanied by requisite documentary evidence.',
    },
    subtypes: [
      {
        id: 'summarize',
        usedIn: ['precise_reformulation'],
        capabilityId: 'summarize_preserving_nuance',
        examples: {
          correct: 'New rule: receipts and a reason are required for expenses over $50, or reimbursement is delayed a few days.',
          naturalVariant: 'Expenses over $50 now need proof and a short reason, or it takes longer to get paid back.',
          nearMiss: 'Expenses over $50 need a receipt.',
          nearMissNote: 'recognized as a summary, marked for dropping the justification requirement and the delay consequence',
          wrongMeaning: 'All expenses now require manager approval.',
          nonsense: '$50 is a common number in accounting.',
          pragmaticallyInappropriate: 'ugh more paperwork, whatever, $50, receipts, done',
        },
      },
      {
        id: 'paraphrase',
        usedIn: ['precise_reformulation'],
        capabilityId: 'paraphrase_to_avoid_flattening_meaning',
        examples: {
          correct: "If a claim is missing the receipt or the justification, it won't be processed - it'll just be sent back.",
          naturalVariant: 'Without both the receipt and the reason, the claim gets bounced back unprocessed.',
          nearMiss: 'Claims without receipts get rejected.',
          nearMissNote: "recognized as an attempt, marked for flattening the source's either/or condition into a single cause",
          wrongMeaning: 'Claims are always processed within 3-5 days.',
          nonsense: 'The claim department has a mailbox.',
          pragmaticallyInappropriate: "your claim's getting sent back lol",
        },
      },
    ],
  },
  {
    id: 'recognize_implication',
    capabilityId: 'recognize_implied_meaning',
    evaluationBucket: 'hybrid',
    examples: {
      correct: "The stylist is politely saying no for this afternoon - 'fully booked' is the actual refusal, and the cancellation-list offer is a genuine but separate alternative, not a promise.",
      naturalVariant: "She's basically turning the customer down for today, just not saying 'no' directly - she offers the waitlist instead.",
      nearMiss: "She said she's fully booked until Thursday.",
      nearMissNote: 'recognized as a literal restatement, marked as missing the implied refusal',
      wrongMeaning: 'She is telling the customer to come back Thursday for a guaranteed appointment.',
      nonsense: 'Haircuts take about thirty minutes.',
      pragmaticallyInappropriate: "she's clearly lying about being booked",
    },
    subtypes: [
      {
        id: 'irony',
        usedIn: ['implication_and_subtext'],
        capabilityId: 'recognize_irony_and_understatement',
        note: "distractor items (a plausible literal reading) are required, not optional — c2.md arc 3's stated highest false-positive risk",
        examples: {
          correct: "Saying 'that was a quick meeting' after it ran three hours over is ironic - the speaker means the opposite: it dragged on far too long.",
          naturalVariant: "They're being sarcastic - the meeting was actually really long, not quick at all.",
          nearMiss: 'The meeting was quick.',
          nearMissNote: 'the literal-reading distractor: plausible on the surface, marked as missing the ironic inversion',
          wrongMeaning: 'The speaker is happy the meeting ended early.',
          nonsense: 'Meetings are held in conference rooms.',
          pragmaticallyInappropriate: 'yeah lol so quick',
        },
      },
      {
        id: 'indirect_speech_act',
        usedIn: ['implication_and_subtext'],
        capabilityId: 'respond_appropriately_to_an_indirect_speech_act',
        examples: {
          correct: 'Sorry about that - let me close the door and turn the music down.',
          naturalVariant: "Oh sorry, I'll quiet things down over here.",
          nearMiss: 'Yes, it is quite loud today.',
          nearMissNote: 'recognized as noticing the comment, marked as treating it as a plain observation rather than acting on the implied request',
          wrongMeaning: "I can't hear you, can you speak up?",
          nonsense: 'The office was built in 1998.',
          pragmaticallyInappropriate: 'why does that matter to you',
        },
      },
    ],
  },
  {
    id: 'shift_register',
    capabilityId: 'shift_register_deliberately',
    evaluationBucket: 'deterministic_local',
    examples: {
      correct: 'We regret to inform you that the item is currently out of stock; we will notify you as soon as it becomes available.',
      naturalVariant: 'We apologize, but this item is currently unavailable. We will contact you once it is back in stock.',
      nearMiss: 'Sorry we don’t have that right now, we will inform you.',
      nearMissNote: 'recognized as a register attempt, marked as a mismatched register blend (informal opener + formal closer) rather than a clean shift',
      wrongMeaning: 'We regret to inform you that this item has been discontinued permanently.',
      nonsense: 'The warehouse is painted blue.',
      pragmaticallyInappropriate: 'Pursuant to inventory protocol, the requested article is presently unattainable through standard procurement channels.',
      pragmaticallyInappropriateNote: 'grammatically flawless, but overshoots the requested register into bureaucratic jargon a real customer-service reply would never use',
    },
    subtypes: [
      {
        id: 'face_saving_disagreement',
        usedIn: ['register_and_pragmatics'],
        capabilityId: 'manage_face_in_disagreement',
        examples: {
          correct: "I take your point about speed, but I'd push back on skipping testing - I think we lose more time later if something breaks.",
          naturalVariant: "That's fair, though I'm a bit worried that skipping testing might cost us more time down the line.",
          nearMiss: "No, that's a bad idea, we should test first.",
          nearMissNote: 'recognized as disagreement, marked as missing the face-saving concession before the counter',
          wrongMeaning: 'I completely agree, let’s skip testing.',
          nonsense: 'Testing happens in QA environments.',
          pragmaticallyInappropriate: 'whatever, do what you want then',
        },
      },
      {
        id: 'genre_adaptation',
        usedIn: ['stylistic_control'],
        capabilityId: 'adapt_a_text_across_genre_and_register',
        examples: {
          correct: 'Notice: plumbing repairs are scheduled for Thursday. We apologize in advance for any noise during this work.',
          naturalVariant: 'Please be advised that plumbing repairs will take place on Thursday; we apologize for any inconvenience.',
          nearMiss: 'The pipes will be fixed Thursday, sorry for noise.',
          nearMissNote: 'recognized as a content-accurate rewrite, marked as still informal-register rather than a genuine genre shift to a notice',
          wrongMeaning: 'Notice: plumbing repairs have been cancelled.',
          nonsense: 'Pipes carry water.',
          pragmaticallyInappropriate: 'IT HAS COME TO OUR ATTENTION THAT AUDITORY DISTURBANCES MAY EMANATE FROM PLUMBING APPARATUS',
        },
      },
    ],
  },
  {
    id: 'qualify_claim',
    capabilityId: 'soften_or_intensify_a_claim',
    evaluationBucket: 'deterministic_local',
    examples: {
      correct: "The launch will probably slip by about a week, though it's too early to be certain.",
      naturalVariant: "It looks like the launch might be pushed back roughly a week, but that's not confirmed yet.",
      nearMiss: 'The launch might maybe possibly slip, I guess, perhaps.',
      nearMissNote: 'recognized as hedging, marked as over-hedged (stacked hedges) rather than one proportionate hedge',
      wrongMeaning: 'The launch is undeniably delayed by exactly one month.',
      nonsense: 'The launch happens in a building.',
      pragmaticallyInappropriate: 'the launch WILL 100% be late, no doubt',
    },
    reuseExamples: {
      qualify_a_position_with_precision: {
        usedIn: ['argument_and_position'],
        examples: {
          correct: 'The honor system would likely reduce fee revenue somewhat, though probably not eliminate it entirely, since some libraries still charge for lost or badly damaged items.',
          naturalVariant: 'Fee income would probably drop a fair bit, but not necessarily to zero, since damaged or lost items might still cost something.',
          nearMiss: 'The honor system will definitely eliminate all fee revenue forever.',
          nearMissNote: 'over-boosted where the evidence only supports a hedge — a calibration failure, not a form failure',
          wrongMeaning: 'The honor system will increase fee revenue.',
          nonsense: 'Revenue is a financial term.',
          pragmaticallyInappropriate: 'obviously it kills all revenue duh',
        },
      },
    },
  },
  {
    id: 'develop_argument',
    capabilityId: 'develop_an_extended_qualified_argument',
    evaluationBucket: 'hybrid',
    examples: {
      correct: "On balance, an honor system seems worth trying: late fees mostly punish people who already struggle to return books on time, and the fine revenue is small compared to the goodwill lost. That said, libraries would need some replacement - even a gentle reminder system - or borrowed books might simply stop coming back.",
      naturalVariant: "I think dropping late fees for an honor system makes sense overall, since fees mostly just hurt people already having a hard time, though they'd still need reminders so books actually get returned.",
      nearMiss: 'Late fees are bad and should be removed.',
      nearMissNote: 'recognized as a position, marked as missing both the qualification and the concession the capability actually tests',
      wrongMeaning: 'Libraries should charge higher fees to make people return books faster.',
      nonsense: 'Libraries have many books.',
      pragmaticallyInappropriate: 'fees are literally theft honestly disgusting',
    },
  },
  {
    id: 'rebut_counterargument',
    capabilityId: 'preempt_and_rebut_a_counterargument',
    evaluationBucket: 'hybrid',
    examples: {
      correct: "That's a fair concern, and it's probably true for a small number of borrowers - but most studies on this show the honor system mainly changes who pays a fee, not whether books come back, since most late returns are already accidental rather than deliberate.",
      naturalVariant: "That's true for a few people, sure, but most late returns happen by accident anyway, so removing the fee probably won't change return rates much.",
      nearMiss: 'No, that’s not true, people will still return books.',
      nearMissNote: 'recognized as disagreement, marked as rebuttal-without-concession — the near-miss the blueprint explicitly flags as pragmatically weaker, not just stylistically (c2.md arc 5 risk note)',
      wrongMeaning: "You're right, we should keep the fees exactly as they are.",
      nonsense: 'Books are made of paper.',
      pragmaticallyInappropriate: "that's a silly thing to worry about",
    },
  },
  {
    id: 'sustain_coherence',
    capabilityId: 'sustain_coherence_across_topic_shifts',
    evaluationBucket: 'hybrid',
    evaluationSpan: 'multiTurn',
    examples: {
      correct: "Yeah, that's fair - and while we're on it, I think the grocery money split has been uneven too, since I've been buying most of the shared stuff lately.",
      naturalVariant: "Totally, and speaking of splitting things fairly, I feel like the grocery costs have been kind of one-sided too.",
      nearMiss: 'Also, did you see the game last night?',
      nearMissNote: 'a real topic shift, marked as an unsignalled non-sequitur rather than a coherent bridge (the off_topic_drift failure mode)',
      wrongMeaning: "No, I don't mind doing the dishes.",
      nonsense: 'Dishes are usually made of ceramic.',
      pragmaticallyInappropriate: "well maybe if you actually cleaned properly we wouldn't have this problem",
    },
    subtypes: [
      {
        id: 'unfamiliar_exchange',
        usedIn: ['discourse_flexibility'],
        capabilityId: 'function_inside_an_unfamiliar_high_ambiguity_exchange',
        evaluationSpan: 'multiTurn',
        examples: {
          correct: "I'm not totally sure what you mean by 'uneven by accident' - do you mean the amounts, or how often each of us pays?",
          naturalVariant: 'Sorry, can you say more about what you mean by that? I want to make sure I understand before we sort it out.',
          nearMiss: 'Nice weather we’re having.',
          nearMissNote: 'a genuine attempt to stay pleasant, marked as evading the ambiguity rather than functioning inside it',
          wrongMeaning: 'responds to a completely different, invented topic than what was actually ambiguous',
          nonsense: 'Ceramics are fired in a kiln.',
          pragmaticallyInappropriate: 'it doesn’t matter, forget it',
        },
      },
    ],
  },
  {
    id: 'repair_at_intention_level',
    capabilityId: 'repair_a_misunderstanding_at_intention_level',
    evaluationBucket: 'hybrid',
    examples: {
      correct: "Sorry, I didn't mean it as an accusation - I just meant we should double check the numbers together, since I think it's just gotten uneven by accident.",
      naturalVariant: "Oh, I didn't mean to imply you weren't paying your share - I just think it's worth checking since it might've drifted without either of us noticing.",
      nearMiss: 'No, we’re not splitting it evenly, I checked the receipts.',
      nearMissNote: 'a real, well-formed reply, marked as repairing the FACT rather than the misread INTENTION — the capability the level introduces as genuinely new',
      wrongMeaning: 'You’re right, forget I said anything.',
      nonsense: 'Receipts are printed on thin paper.',
      pragmaticallyInappropriate: "why are you being so sensitive about this",
    },
  },
  {
    id: 'edit_for_precision',
    capabilityId: 'edit_own_text_for_precision_and_tone',
    evaluationBucket: 'hybrid',
    examples: {
      correct: 'Notice: the elevator will be out of service next week. Please use the stairs during this time.',
      naturalVariant: 'Please note that the elevator will be unavailable next week; residents are asked to use the stairs.',
      nearMiss: 'Hey everyone, the elevator won’t work next week, please use the stairs.',
      nearMissNote: 'grammar-correct and content-correct, marked for failing the actual test — the tone is still casual for an official notice',
      wrongMeaning: 'Notice: the elevator has been permanently removed.',
      nonsense: 'Elevators use a pulley system.',
      pragmaticallyInappropriate: 'BY ORDER OF THE BUILDING MANAGEMENT COMMITTEE, ALL RESIDENTS SHALL REFRAIN FROM ELEVATOR USAGE',
      pragmaticallyInappropriateNote: 'overcorrects into an unnaturally severe register for a routine building notice',
    },
    subtypes: [
      {
        id: 'lexical_variety',
        usedIn: ['stylistic_control'],
        capabilityId: 'vary_expression_to_avoid_flattening_meaning',
        examples: {
          correct: 'The main issue is the schedule; the budget is a second concern. Both need addressing, and the sooner the better.',
          naturalVariant: 'There are two issues - the schedule and the budget - and both should be sorted out soon.',
          nearMiss: 'The problem is the schedule. The problem is also the budget. This issue needs a fix.',
          nearMissNote: 'grammar-correct, marked for repeating "problem"/"issue" without a non-repeating collocate',
          wrongMeaning: 'The schedule and budget are both fine now.',
          nonsense: 'Budgets are made of numbers.',
          pragmaticallyInappropriate: "the schedule's a disaster and so is the budget, ugh",
        },
      },
    ],
  },
  {
    id: 'mediate_disagreement',
    capabilityId: 'mediate_a_complex_disagreement_for_a_third_party',
    evaluationBucket: 'hybrid',
    evaluationSpan: 'multiTurn',
    graduationCapstone: true,
    examples: {
      correct: "The landlord believes the tenant owes three months of increased rent because a notice was given; the tenant disputes this, saying they never received anything in writing, only a verbal mention, and won't pay a rate that was never formally confirmed. Both sides agree there was some kind of notice attempt, but disagree about whether it met a standard the tenant could reasonably act on. A useful next step might be for the landlord to produce whatever written notice does exist, if any, and for the two sides to agree on a clear cutoff date.",
      naturalVariant: "So the landlord thinks the tenant just hasn't paid the higher rent that was properly announced, but the tenant says they never got anything official - just heard about it secondhand - so they don't think they should have to pay yet. Maybe the fix is to check if there's any written notice at all, and set a clear date going forward.",
      nearMiss: "The tenant is right that a verbal mention isn't a proper notice, so they shouldn't have to pay yet.",
      nearMissNote: 'takes a side rather than representing both faithfully — the exact failure mode the capability is designed to catch (editorializing instead of mediating)',
      wrongMeaning: 'Both sides agree the tenant owes the back rent and just need to set a payment plan.',
      nonsense: 'Rent is usually paid monthly.',
      pragmaticallyInappropriate: 'honestly the landlord sounds shady, tenants never get proper notice',
    },
  },
]

export const getC2Intent = (id) => C2_INTENTS.find((i) => i.id === id) || null

export const C2_INTENT_IDS = C2_INTENTS.map((i) => i.id)

/*
 * Flattened subtype index: `{ intentId, subtypeId } -> capabilityId`, for
 * scripts and future evaluator-dispatch code that need a direct lookup
 * without walking the nested `subtypes` arrays each time.
 */
export const C2_INTENT_SUBTYPES = C2_INTENTS.flatMap((intent) =>
  (intent.subtypes || []).map((subtype) => ({
    intentId: intent.id,
    subtypeId: subtype.id,
    capabilityId: subtype.capabilityId,
    usedIn: subtype.usedIn,
  })),
)
