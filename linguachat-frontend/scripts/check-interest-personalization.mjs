/*
 * check-interest-personalization — two people, the same lesson, different
 * conversations.
 *
 * The promise this file protects is narrow and worth stating exactly: interests
 * change WHAT IS TALKED ABOUT and nothing else. Not what must be learned, not
 * what counts as evidence, not how much XP anything is worth, not who graduates.
 * If any of those moved with a hobby, personalisation would be a fairness bug
 * wearing a friendly hat.
 *
 * So the groups below fall into three families:
 *
 *   THE ENGINE — one source of truth for the ids, storage that survives being
 *     edited by hand, a choice that is the same on every reload, rotation that
 *     does not repeat, a small share of contexts outside what was chosen, and a
 *     neutral answer whenever nothing fits.
 *
 *   THE BOUNDARIES — a topic never reaches a slot it does not fit, the provider
 *     is told one topic rather than a profile, and mastery, XP, the Garden and
 *     readiness cannot see any of this.
 *
 *   THE FUTURE — a synthetic story template, personalised two ways, proving the
 *     skill is identical in both. It is never registered as an episode: A1 has no
 *     runtime content and this sprint does not give it any.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* A localStorage good enough for the preferences, and nothing more. */
const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
}

const {
  INTEREST_CONTEXTS, KNOWN_INTERESTS, NEUTRAL_CONTEXT, MAX_SELECTED_INTERESTS,
  normalizeInterests, relatedInterests, facetsOf, nuggetFor, getInterestContext,
} = await import('../src/learning/engine/interests.js')
const {
  selectTopic, describeTopic, providerTopicContext, supportsTypes,
  TOPIC_SOURCES, TOPIC_MIX, PERSONALIZATION_STRENGTHS,
} = await import('../src/learning/engine/topicSelection.js')
const {
  personalizeStory, templateProblems, invariantDrift, PERSONALIZATION_MODES, KNOWN_SLOT_TYPES,
} = await import('../src/learning/engine/storyPersonalization.js')
const {
  INTEREST_OPTIONS, MAX_INTERESTS, toggleInterestId, loadTutorPreferences, saveTutorPreferences,
  DEFAULT_TUTOR_PREFERENCES,
} = await import('../src/services/tutorPreferences.js')
const {
  normalizeMemoryContext, dismissTopic, recordTopicUse, recentTopicIds, isTopicDismissed,
  loadMemoryContext, MEMORY_CONTEXT_KEY,
} = await import('../src/learning/engine/memoryContext.js')
const { isCountableThing, thingById, asSubjectValue, isContextCompatible, classifyValue } =
  await import('../src/learning/engine/semanticContext.js')
const { createLearnerModel } = await import('../src/learning/engine/learnerModel.js')

let groups = 0
const ok = () => { groups += 1 }
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

/* Fixed clocks: every day-dependent assertion is told what day it is. */
const DAY = 24 * 60 * 60 * 1000
const TODAY = new Date('2026-08-06T10:00:00Z').getTime()
const TOMORROW = TODAY + DAY

/* ---- 1) one catalogue, and the ids the product offers come from it ---- */
{
  assert.deepEqual(INTEREST_OPTIONS, KNOWN_INTERESTS,
    'the ids offered at onboarding must be the ids the engine understands')
  assert.equal(MAX_INTERESTS, MAX_SELECTED_INTERESTS, 'one cap, not two')
  assert.ok(KNOWN_INTERESTS.length >= 12, `a usable catalogue: found ${KNOWN_INTERESTS.length}`)
  assert.ok(KNOWN_INTERESTS.length <= MAX_SELECTED_INTERESTS,
    'a learner must be able to choose the whole catalogue if they want to')

  /* every entry is complete, safe at Pre-A1, and says what it may talk about */
  for (const [id, ctx] of Object.entries(INTEREST_CONTEXTS)) {
    assert.ok(asSubjectValue(ctx.targetNoun), `"${id}" offers "${ctx.targetNoun}", which cannot be liked`)
    assert.equal(ctx.objects.length, 2, `${id} must offer exactly two objects`)
    assert.ok(ctx.activity && ctx.sceneKey, `${id} is incomplete`)
    assert.ok(ctx.facets?.topics?.length, `${id} has nothing to talk about`)
    for (const text of [ctx.targetNoun, ...ctx.objects, ctx.activity, ...ctx.facets.topics]) {
      assert.ok(!/[A-Z]/.test(text), `${id}: "${text}" looks like a brand or a proper noun`)
      assert.ok(text.split(/\s+/).length <= 5, `${id}: "${text}" is too long`)
    }
    /* an object facet must be a thing the semantic layer knows how to count */
    for (const objectId of ctx.facets.objects || []) {
      assert.ok(thingById(objectId), `${id} offers object "${objectId}", which is not a known thing`)
    }
    /* relations are explicit, real, and few */
    assert.deepEqual(relatedInterests(id), (ctx.related || []).filter(other => other !== id),
      `${id}: a related id must exist in the catalogue`)
    assert.ok(relatedInterests(id).length <= 4, `${id} relates to too much to be explainable`)
    /* a nugget, if there is one, must be safe: no numbers, no dates, no records */
    const nugget = nuggetFor(id)
    if (nugget) {
      assert.ok(!/\d/.test(nugget), `${id}'s nugget contains a number: "${nugget}"`)
      assert.ok(!/\b(most|best|first|largest|fastest|record)\b/i.test(nugget),
        `${id}'s nugget makes a superlative claim: "${nugget}"`)
      assert.ok(nugget.length <= 140, `${id}'s nugget is too long to be an aside`)
    }
  }
  console.log(`\n  ${KNOWN_INTERESTS.length} interests, max ${MAX_SELECTED_INTERESTS} selectable`)
  ok()
}

/* ---- 2) storage is read defensively, and never loses a valid choice ---- */
{
  assert.deepEqual(normalizeInterests(['music', 'music', 'travel']), ['music', 'travel'], 'duplicates collapse')
  assert.deepEqual(normalizeInterests(['music', 'not_a_real_interest', 'travel']), ['music', 'travel'],
    'an unknown id is dropped and the valid ones survive')
  assert.deepEqual(normalizeInterests(['MUSIC', ' travel ']), ['music', 'travel'], 'case and spacing are forgiven')
  assert.deepEqual(normalizeInterests(null), [], 'a missing list is not an error')
  assert.deepEqual(normalizeInterests('music'), [], 'a string is not a list')
  assert.equal(normalizeInterests([...KNOWN_INTERESTS, ...KNOWN_INTERESTS]).length, KNOWN_INTERESTS.length,
    'the cap is never exceeded, however corrupt the input')

  /* through the real storage layer */
  store.clear()
  localStorage.setItem('lc2-tutor-preferences', JSON.stringify({
    interests: ['music', 'music', 'ghost_interest', 'travel'], tone: 'friendly',
  }))
  assert.deepEqual(loadTutorPreferences().interests, ['music', 'travel'], 'storage is sanitised on the way in')
  assert.equal(loadTutorPreferences().tone, 'friendly', 'and the rest of the preferences are untouched')

  /* choosing nothing is an answer, and it survives a reload */
  saveTutorPreferences({ ...DEFAULT_TUTOR_PREFERENCES, interests: [] })
  assert.deepEqual(loadTutorPreferences().interests, [], 'an empty list must not spring back to a default')

  /* unreadable storage recovers instead of resetting anything */
  localStorage.setItem('lc2-tutor-preferences', '{not json at all')
  const recovered = loadTutorPreferences()
  assert.deepEqual(recovered.interests, DEFAULT_TUTOR_PREFERENCES.interests, 'corrupt storage falls back cleanly')
  assert.ok(recovered.tone, 'and still returns a usable object')
  store.clear()
  ok()
}

/* ---- 3) the toggle: one behaviour on both surfaces ---- */
{
  assert.deepEqual(toggleInterestId(['music'], 'travel'), ['music', 'travel'], 'adding works')
  assert.deepEqual(toggleInterestId(['music', 'travel'], 'music'), ['travel'], 'removing works')
  assert.deepEqual(toggleInterestId(['music'], 'music'), [], 'removing the last one leaves nothing')
  assert.deepEqual(toggleInterestId(['music'], 'not_real'), ['music'], 'an unknown id cannot be added')
  const full = KNOWN_INTERESTS.slice(0, MAX_SELECTED_INTERESTS)
  assert.equal(toggleInterestId(full, full[0]).length, full.length - 1, 'at the cap, removing still works')

  /* both selectors must call it, so they cannot drift apart again */
  for (const path of [
    'src/components/onboarding/TutorPersonalizationStep.jsx',
    'src/components/identity/LanguageIdentity.jsx',
  ]) {
    const src = read(path)
    assert.match(src, /toggleInterestId\(/, `${path} must use the shared toggle`)
    assert.ok(!/interests: next\.length \? next : \['travel'\]/.test(src),
      `${path} still forces an interest when the learner picks none`)
    assert.ok(!/\.slice\(0, 6\)/.test(src), `${path} still caps the list at six`)
    assert.match(src, /aria-pressed=\{selected\}/, `${path} must announce which chips are chosen`)
    assert.match(src, /t\('interestsHelp'\)/, `${path} must say what the choice is for`)
  }
  ok()
}

/* ---- 4) the choice is deterministic ---- */
{
  const interests = ['music', 'games', 'travel']
  const a = selectTopic({ explicitInterests: interests, seed: 'sofia:2026-08-06' })
  const b = selectTopic({ explicitInterests: interests, seed: 'sofia:2026-08-06' })
  assert.deepEqual(a, b, 'the same learner, day and seed must give the same topic')
  assert.ok(TOPIC_SOURCES.includes(a.source), 'and it must say where it came from')
  assert.ok(a.interestId === null || KNOWN_INTERESTS.includes(a.interestId))

  /* a different context may differ — that is what stops every activity being the same */
  const picks = new Set(['ep1', 'ep2', 'ep3', 'ep4', 'ep5', 'ep6']
    .map(id => selectTopic({ explicitInterests: interests, seed: `sofia:${id}` }).interestId))
  assert.ok(picks.size >= 2, 'across contexts a learner should meet more than one topic')

  /* nothing in the engine may reach for the clock or the dice */
  const engine = read('src/learning/engine/topicSelection.js')
  assert.ok(!/Math\.random|Date\.now\(\)/.test(engine),
    'topic selection must not depend on randomness or on what time it is')
  assert.deepEqual(PERSONALIZATION_STRENGTHS, ['strong', 'medium'])
  ok()
}

/* ---- 5) rotation: recently used topics wait their turn ---- */
{
  const interests = ['music', 'games', 'travel', 'history', 'technology']
  const chosen = selectTopic({ explicitInterests: interests, seed: 'rotation:1' })
  const next = selectTopic({
    explicitInterests: interests, recentTopics: [chosen.interestId], seed: 'rotation:1',
  })
  assert.notEqual(next.interestId, chosen.interestId, 'the topic just used must not be the next one')

  /* nobody starves: over many contexts, most of the list gets used */
  const seen = new Set()
  let recent = []
  for (let i = 0; i < 30; i += 1) {
    const topic = selectTopic({ explicitInterests: interests, recentTopics: recent, seed: `day:${i}` })
    if (topic.interestId) seen.add(topic.interestId)
    recent = [topic.interestId, ...recent].filter(Boolean).slice(0, 3)
  }
  const covered = interests.filter(id => seen.has(id)).length
  assert.ok(covered >= 4, `rotation should reach most of the list, reached ${covered}/5`)

  /* and with everything on cooldown it still answers, rather than giving up */
  const cornered = selectTopic({
    explicitInterests: ['music'], recentTopics: ['music'], strength: 'medium', seed: 'cornered',
  })
  assert.equal(cornered.interestId, 'music', 'a single interest comes back when it is all there is')
  ok()
}

/* ---- 6) twenty interests: represented, rotated, and never all sent ---- */
{
  const twenty = KNOWN_INTERESTS.slice(0, 20)
  assert.equal(normalizeInterests(twenty).length, twenty.length, 'twenty must be storable')

  const counts = new Map()
  let recent = []
  for (let i = 0; i < 120; i += 1) {
    const topic = selectTopic({ explicitInterests: twenty, recentTopics: recent, seed: `big:${i}` })
    if (topic.interestId) counts.set(topic.interestId, (counts.get(topic.interestId) || 0) + 1)
    recent = [topic.interestId, ...recent].filter(Boolean).slice(0, 3)
  }
  const distinct = [...counts.keys()].filter(id => twenty.includes(id)).length
  assert.ok(distinct >= 12, `the first indices must not monopolise: ${distinct}/20 seen`)

  /* the provider is told one topic, whatever the size of the list */
  const topic = selectTopic({ explicitInterests: twenty, seed: 'payload' })
  const payload = providerTopicContext(topic)
  assert.deepEqual(Object.keys(payload).sort(), ['topic', 'topic_facet'],
    'exactly one topic and one phrase may travel')
  assert.equal(typeof payload.topic, 'string')
  assert.ok(JSON.stringify(payload).length < 120, 'the topic context must stay tiny')
  console.log(`  20 interests → ${distinct} distinct topics over 120 contexts`)
  ok()
}

/* ---- 7) one interest is a preference, not a prison ---- */
{
  const only = ['music']
  const sources = new Set()
  for (let i = 0; i < 40; i += 1) {
    sources.add(selectTopic({ explicitInterests: only, seed: `single:${i}` }).source)
  }
  assert.ok(sources.has('explicit'), 'most contexts must still be the interest they chose')
  assert.ok(sources.size > 1, 'and some must be something else, or the topic is a cage')

  /* the mix is a product judgement, and says so */
  assert.equal(TOPIC_MIX.explicit + TOPIC_MIX.related + TOPIC_MIX.exploration, 100)
  assert.ok(TOPIC_MIX.explicit > TOPIC_MIX.related + TOPIC_MIX.exploration,
    'what the learner chose must dominate')
  const engine = read('src/learning/engine/topicSelection.js')
  assert.match(engine, /UNMEASURED PRODUCT CONSTANTS/,
    'the weights must not read as if they were measured')

  /* related and exploration both actually happen, for a normal profile */
  const observed = new Set()
  for (let i = 0; i < 60; i += 1) {
    observed.add(selectTopic({ explicitInterests: ['games', 'music'], seed: `mix:${i}` }).source)
  }
  for (const source of ['explicit', 'related', 'exploration']) {
    assert.ok(observed.has(source), `${source} contexts never happen`)
  }
  ok()
}

/* ---- 8) related topics are the declared ones, not a graph ---- */
{
  const related = selectTopic({
    explicitInterests: ['games'],
    /* force the related branch by exhausting the explicit one */
    recentTopics: ['games'], seed: 'related:seed',
  })
  assert.ok(related.interestId !== 'games' || related.source === 'explicit')
  const declared = relatedInterests('games')
  assert.ok(declared.length && declared.every(id => KNOWN_INTERESTS.includes(id)))
  assert.ok(!declared.includes('games'), 'an interest is not related to itself')
  ok()
}

/* ---- 9) "another topic" is about today, not about the learner ---- */
{
  store.clear()
  const before = normalizeMemoryContext({ version: 2, dayKey: '2026-08-06' }, TODAY)
  const after = dismissTopic('games', { atMs: TODAY, context: before })
  assert.ok(isTopicDismissed(after, 'games'), 'the topic is set aside')

  /* the preference is untouched */
  saveTutorPreferences({ ...DEFAULT_TUTOR_PREFERENCES, interests: ['games', 'music'] })
  assert.deepEqual(loadTutorPreferences().interests, ['games', 'music'],
    'declining a subject must not deselect the interest')

  /* the next choice is something else */
  const next = selectTopic({
    explicitInterests: ['games', 'music'], dismissedTopics: after.dismissedTopicIds, seed: 'dismissed',
  })
  assert.notEqual(next.interestId, 'games', 'a declined topic must not be chosen again today')

  /* and tomorrow it may come back, while the cooldown window survives */
  const tomorrow = normalizeMemoryContext(after, TOMORROW)
  assert.deepEqual(tomorrow.dismissedTopicIds, [], 'yesterday\'s "not today" has expired')
  const used = recordTopicUse('music', { atMs: TODAY, context: after })
  assert.deepEqual(recentTopicIds(normalizeMemoryContext(used, TOMORROW)), ['music'],
    'but what was already talked about is still remembered')

  /* an unknown or absent id changes nothing */
  assert.deepEqual(dismissTopic('nonsense', { atMs: TODAY, context: after }).dismissedTopicIds,
    after.dismissedTopicIds)
  assert.deepEqual(recordTopicUse(null, { atMs: TODAY, context: after }).recentTopics, after.recentTopics)

  /* the memory context still refuses to know anything about mastery */
  /*
   * Identifiers, not prose: this file's own comments talk about activity
   * preferences and about a dismissal expiring, and a loose case-insensitive
   * search finds "xp" inside "expired".
   */
  const source = read('src/learning/engine/memoryContext.js')
  assert.ok(!/learnerFacts|activityPreferences|episodeRuns|languageItems|localProgress/.test(source),
    'the topic memory must not reach into the learner model')
  store.clear()
  ok()
}

/* ---- 10) a topic never lands in a slot it does not fit ---- */
{
  /* "music" is uncountable: it may be liked, and it may never be counted */
  assert.ok(asSubjectValue('music'), 'music is something you can like')
  assert.equal(isCountableThing('music'), false, 'and something you can never have two of')

  const music = describeTopic('music', { seed: 'x' })
  assert.equal(music.object, null, 'an interest with no countable object must offer none')

  /* only interests that really have one claim to support a countable object */
  for (const id of KNOWN_INTERESTS) {
    const claims = supportsTypes(id, ['generic_object'])
    const has = (facetsOf(id).objects || []).some(objectId => isCountableThing(objectId))
    assert.equal(claims, has, `${id} misreports whether it has a countable object`)
    if (claims) {
      const described = describeTopic(id, { seed: 'y' })
      assert.ok(isCountableThing(described.object), `${id} offered an uncountable object`)
      assert.equal(described.objectSingular, thingById(described.object).singular)
    }
  }

  /* an unknown semantic type is never claimed to be supported */
  assert.equal(supportsTypes('music', ['place']), false, 'a place is the learner\'s own, never an interest')
  assert.equal(supportsTypes('music', ['not_a_type']), false)

  /* and a slot that needs a countable object skips the interests without one */
  const forObject = selectTopic({
    explicitInterests: ['music', 'history'], acceptedSemanticTypes: ['generic_object'], seed: 'obj',
  })
  assert.ok(forObject.interestId === null || isCountableThing(forObject.object),
    'a slot needing a thing must not be given an abstraction')

  /* every targetNoun the engine can produce is usable in the sentence that uses it */
  for (const id of [...KNOWN_INTERESTS, null]) {
    const topic = describeTopic(id, { seed: 'z' })
    assert.ok(isContextCompatible('yes_no_preference', classifyValue(topic.targetNoun)),
      `"${topic.targetNoun}" cannot be offered as a preference`)
  }
  ok()
}

/* ---- 11) nothing chosen: a complete, neutral context ---- */
{
  /*
   * A learner who skipped the question gets varied everyday conversation, which
   * in free chat means the engine may still offer something from the catalogue —
   * an invitation costs nothing and can be ignored in one reply. What it must
   * never do is fail, return an empty string, or claim they chose anything.
   */
  const nobody = selectTopic({ explicitInterests: [], seed: 'nobody' })
  assert.ok(nobody, 'there is always an answer')
  assert.ok(nobody.targetNoun && nobody.activity, 'and it is complete enough to use')
  assert.equal(nobody.source, 'exploration', 'nothing is presented as their own choice')

  /* and a truly neutral context sends nothing at all */
  assert.equal(providerTopicContext(describeTopic(null, { seed: 'nobody' })), null,
    'with no topic, nothing travels')

  const ghosts = selectTopic({ explicitInterests: ['ghost', 'also_ghost'], seed: 'nobody' })
  assert.ok(ghosts.targetNoun, 'a profile of unknown ids behaves like an empty one')
  assert.equal(ghosts.source, 'exploration', 'and never pretends the unknown ids were used')

  /* medium surfaces promise nothing rather than inventing a subject */
  const medium = selectTopic({ explicitInterests: [], strength: 'medium', seed: 'nobody' })
  assert.equal(medium.interestId, null, 'Home must not promise a topic nobody chose')
  assert.equal(getInterestContext([], 'nobody').interestId, null)
  assert.ok(NEUTRAL_CONTEXT.facets.topics.length, 'the neutral context has things to talk about too')
  ok()
}

/* ---- 12) free chat: one topic, only at the start, and the learner outranks it ---- */
{
  const api = read('src/services/api.js')
  const context = read('src/context/AppContext.jsx')

  assert.match(api, /topicContext = null/, 'the request takes the chosen topic')
  assert.match(api, /interests: _droppedInterests/, 'and drops the interest list')
  assert.match(context, /providerTopicContext\(conversationTopic\)/, 'built by the local selector')
  /*
   * The screen opens with Lingua's welcome, so "the history is empty" is never
   * true and the topic would never have travelled at all. What decides is whether
   * the LEARNER has spoken: before that there is no subject of theirs to respect.
   */
  assert.match(context, /const learnerHasSpoken = messages\.some\(m => m\.role === 'user'\)/,
    'the opening message must be recognised by the learner having spoken')
  assert.match(context, /topicContext: learnerHasSpoken \? null : providerTopicContext\(conversationTopic\)/,
    'and the topic travels only before they have')
  assert.match(context, /recordTopicUse\(conversationTopic\.interestId\)/, 'what was discussed is remembered')

  /* the provider is never asked to choose, and never told why */
  const engine = read('src/learning/engine/topicSelection.js')
  assert.match(engine, /export function providerTopicContext/)
  const payload = providerTopicContext(describeTopic('games', { source: 'exploration', seed: 's' }))
  assert.ok(!('source' in payload), 'the reason for the choice must stay on the device')
  assert.ok(!('interests' in payload) && !('recentTopics' in payload), 'and so must the profile')

  /* the backend refuses anything that is not an id */
  const route = read('../linguachat-backend/app/routes/chat.py')
  assert.match(route, /TOPIC_ID_PATTERN/, 'the server validates the topic shape')
  assert.match(route, /\^\[a-z\]\[a-z0-9_\]\{0,31\}\$/, 'a topic is a slug, never prose')
  const local = read('../linguachat-backend/ai/local_engine.py')
  assert.match(local, /_topic_opener/, 'the topic is used to open a conversation')
  assert.match(local, /if topic_facet and not has_history/, 'only when the learner has not set the subject')
  const tutor = read('../linguachat-backend/ai/openai_tutor.py')
  assert.match(tutor, /If the learner writes about something else, follow the learner/,
    'the prompt must say the learner leads')
  assert.match(tutor, /Never claim personal experience/, 'and that Lingua has no personal life')
  assert.match(tutor, /Do not invent numbers, dates, records, rankings/, 'and must not fabricate facts')
  assert.match(tutor, /Keep the ENGLISH at the learner's level/, 'a complex topic is not complex language')
  ok()
}

/* ---- 13) sessions rotate too, and still promise what they show ---- */
{
  const session = read('src/learning/engine/session.js')
  assert.match(session, /strength: 'medium'/, 'a session stays inside what the learner chose')
  assert.match(session, /recentTopics/, 'and avoids what they heard about recently')
  const context = read('src/context/AppContext.jsx')
  assert.match(context, /recentTopics: recentTopicIds\(memory\)/, 'the app supplies the cooldown window')
  ok()
}

/* ---- 14) a future A1 story, personalised two ways, teaching one thing ---- */
{
  /*
   * A synthetic template. It is defined HERE, is not registered anywhere, and no
   * A1 episode exists: this proves the contract without creating content.
   */
  const template = {
    id: 'synthetic_polite_request',
    canDoId: 'ask_for_something_politely',
    intent: 'polite_request',
    evidence: ['can_ask_politely'],
    xp: 60,
    difficulty: 'a1.arc1',
    correctBranch: 'b',
    personalizationMode: 'light',
    slots: { thing: 'object', subject: 'subject', about: 'topic' },
    neutralFallback: { thing: 'water', subject: 'music', about: 'everyday life', scene: 'at a counter' },
  }
  assert.deepEqual(templateProblems(template), [], 'the template must be well formed')

  const withObject = personalizeStory(template, describeTopic('technology', { seed: 's1' }))
  const without = personalizeStory(template, describeTopic('history', { seed: 's2' }))

  /* the setting moved */
  assert.equal(withObject.story.thing, 'phone', 'an interest with a countable object supplies it')
  assert.equal(withObject.story.personalizedWith, 'technology')
  assert.notEqual(withObject.story.about, without.story.about, 'the two learners talk about different things')

  /* an interest with no countable object falls back for that slot only */
  assert.equal(without.story.thing, 'water', 'a missing value uses the template\'s own neutral')
  assert.equal(without.story.personalizedWith, 'history')

  /* and the lesson did not move at all */
  assert.deepEqual(invariantDrift(withObject.story, without.story), [],
    'two personalisations must teach exactly the same thing')
  for (const field of ['canDoId', 'intent', 'evidence', 'xp', 'difficulty', 'correctBranch']) {
    assert.deepEqual(withObject.story[field], template[field], `${field} must survive personalisation`)
  }

  /* no interests at all: the neutral story, and nothing broken */
  const plain = personalizeStory(template, describeTopic(null, { seed: 's3' }))
  assert.equal(plain.story.personalizedWith, null)
  assert.equal(plain.story.thing, 'water')
  assert.deepEqual(invariantDrift(plain.story, withObject.story), [])

  /* mode "none" ignores the topic entirely */
  const fixed = personalizeStory({ ...template, personalizationMode: 'none', slots: {} },
    describeTopic('technology', { seed: 's4' }))
  assert.equal(fixed.story.personalizedWith, null, 'a controlled story stays controlled')

  /* and a template that tries to personalise the lesson is refused */
  for (const [label, broken] of [
    ['the capability', { ...template, slots: { ...template.slots, canDoId: 'object' } }],
    ['the evidence', { ...template, slots: { ...template.slots, evidence: 'topic' } }],
    ['an unknown slot type', { ...template, slots: { thing: 'anything_goes' } }],
    ['a mode nobody implements', { ...template, personalizationMode: 'wild' }],
    ['themed with no themes', { ...template, personalizationMode: 'themed' }],
  ]) {
    assert.ok(templateProblems(broken).length > 0, `a template personalising ${label} must be refused`)
    assert.throws(() => personalizeStory(broken, describeTopic('music', { seed: 's5' })),
      /story personalization refused/, `and refusing must be loud for ${label}`)
  }
  assert.deepEqual(PERSONALIZATION_MODES, ['none', 'light', 'themed'])
  assert.ok(KNOWN_SLOT_TYPES.includes('object') && KNOWN_SLOT_TYPES.includes('topic'))
  ok()
}

/* ---- 15) nothing about learning moved ---- */
{
  /* the learner model has no idea any of this exists */
  const model = createLearnerModel()
  assert.equal('interests' in model, false, 'interests do not belong in the mastery model')
  assert.equal('recentTopics' in model, false)
  assert.equal(model.version, 7, 'and none of this needed a new model version')

  /* no XP anywhere in the personalization layer, and no Garden grants */
  /*
   * The rule is about MODIFYING, not mentioning: storyPersonalization names `xp`
   * precisely because it must copy it through unchanged, which is the opposite of
   * awarding any. So the assertion looks for the ways progress is actually written.
   */
  for (const path of [
    'src/learning/engine/interests.js',
    'src/learning/engine/topicSelection.js',
    'src/learning/engine/storyPersonalization.js',
  ]) {
    const src = read(path)
    assert.ok(!/recordPractice|saveLocalProgress|awardEpisode|localProgress|\+= *xp|xp \+/.test(src),
      `${path} must not award anything`)
    assert.ok(!/gardenItems|recordItemAttempt|recordCanDoAttempt|learningState|can_use|saveLearnerModel/.test(src),
      `${path} must not touch the Garden or mastery`)
    assert.ok(!/deriveReadiness|reconcileLevelMilestones|levelMilestones/.test(src),
      `${path} must not touch readiness or graduation`)
  }

  /* interests, facts and activity preferences are three different things */
  const facts = read('src/learning/engine/learnerFacts.js')
  assert.ok(!/INTEREST_CONTEXTS|explicitInterests/.test(facts),
    'a captured fact must never become a selected interest')
  const topics = read('src/learning/engine/topicSelection.js')
  assert.ok(!/learnerFacts|activityPreferences|ACTIVITY_FORMATS/.test(topics),
    'a topic must not be chosen from facts or from activity preferences')
  ok()
}

/* ---- 16) no A1 content arrived with any of this ---- */
{
  const { runtimeEpisodeCount, getLevel } = await import('../src/learning/curriculum/levels.js')
  assert.equal(runtimeEpisodeCount('a1'), 0, 'A1 must still have no runtime episodes')
  assert.equal(getLevel('a1').implemented, false)
  assert.equal(getLevel('a1').available, false)
  assert.equal(runtimeEpisodeCount('pre_a1'), 17, 'and Pre-A1 must be untouched')
  for (const path of ['src/learning/engine/interests.js', 'src/learning/engine/storyPersonalization.js']) {
    assert.ok(!/episode18|a1Arc1/.test(read(path)), `${path} must not create A1 content`)
  }
  ok()
}

console.log(`\ncheck-interest-personalization — OK  (${groups} personalization groups verified)`)
