/*
 * check-fifth-arc — the repair arc, and the claims it is allowed to make.
 *
 * Episodes 13-15 teach what to do when a conversation stops making sense. Three
 * things about them are easy to get wrong and are checked here rather than
 * trusted:
 *
 *   - the arc must not quietly declare Pre-A1 finished (two required
 *     capabilities are still missing, and finishing episode 15 is not an A1 exit)
 *   - a repair must never be the last thing that happens: the conversation has to
 *     continue, or the episode teaches a phrase instead of a strategy
 *   - episode 15 must host the REAL mini-story renderer, not a second one
 *
 * It also closes the hole that let this arc reach a green suite with not one
 * translated string: every key any episode references must exist in every locale.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ARC, ARCS, getEpisode, episodesInArc } from '../src/learning/episodes/index.js'
import { getStory, storyTurns, storyBranches, storyHome, defaultBranch, turnText } from '../src/learning/engine/miniStory.js'
import { CAN_DO_INTENT, PRE_A1_EXIT_CRITERIA, canDoCoverage, intentsForEpisode, episodesProducing, skillPrerequisitesOf, prerequisiteChain } from '../src/learning/curriculum/preA1Map.js'
import { CAPABILITY_MAP } from '../src/learning/curriculum/preA1Audit.js'
import { REPAIR_KINDS } from '../src/learning/engine/responseEvaluation.js'
import { SEED_VOCAB } from '../src/data/vocabulary.js'

let n = 0
const ok = () => { n++ }

const REPAIR_IDS = ['lost_you', 'say_again', 'we_can_continue']
const [EP13, EP14, EP15] = REPAIR_IDS.map(getEpisode)
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')

/* ---- 1) three episodes, one arc, in order, behind the café ---- */
{
  assert.deepEqual(ARCS, ['greetings', 'connect', 'choose', 'cafe', 'repair', 'things'])
  assert.deepEqual(episodesInArc('repair').map(e => e.id), REPAIR_IDS)
  assert.equal(ARC.length, 17)
  assert.deepEqual(EP13.prerequisites, ['your_first_order'])
  assert.deepEqual(EP14.prerequisites, ['lost_you'])
  assert.deepEqual(EP15.prerequisites, ['say_again'])
  assert.equal(prerequisiteChain('we_can_continue').length, 14, 'the whole arc must sit behind the other twelve')
  for (const ep of [EP13, EP14, EP15]) {
    assert.equal(ep.level, 'Pre-A1')
    assert.equal(ep.arc, 'repair')
    assert.ok(ep.titleKey && ep.goalKey && ep.canDoNameKey && ep.durationKey, `${ep.id} missing keys`)
    assert.ok(ep.estimatedMinutes >= 5 && ep.estimatedMinutes <= 12, `${ep.id} claims ${ep.estimatedMinutes} minutes`)
    assert.equal(ep.steps.at(-1).type, 'completion')
    assert.ok(ep.steps.length >= 6, `${ep.id} is a real episode`)
  }
  // XP in the band the rest of the curriculum uses; the finale pays more
  assert.ok(EP13.xp >= 50 && EP13.xp <= 60, `ep13 xp ${EP13.xp}`)
  assert.ok(EP14.xp >= 50 && EP14.xp <= 60, `ep14 xp ${EP14.xp}`)
  assert.ok(EP15.xp >= 70 && EP15.xp <= 80, `ep15 xp ${EP15.xp}`)
  ok()
}

/* ---- 2) one capability with two episodes, not two invented capabilities ---- */
{
  assert.equal(EP13.canDoId, 'ask_for_repair')
  assert.equal(EP14.canDoId, 'ask_for_repair', 'repair is one capability with more than one strategy')
  assert.equal(EP14.reinforces, true, 'the second episode must say it is not the primary one')
  assert.notEqual(EP13.reinforces, true)
  assert.equal(EP15.canDoId, 'close_an_encounter')

  const repair = canDoCoverage('ask_for_repair')
  assert.equal(repair.introducedIn, 'lost_you', 'coverage must still have exactly one answer')
  assert.deepEqual(repair.reinforcedIn, ['say_again'])
  assert.equal(CAN_DO_INTENT.ask_for_repair, 'repair_request')
  assert.equal(CAN_DO_INTENT.close_an_encounter, 'close_encounter')
  ok()
}

/* ---- 3) five phrases, three strategies, and no intent explosion ---- */
{
  const src = read('src/learning/engine/responseEvaluation.js')
  const dispatched = [...src.matchAll(/case '([a-z_]+)': return evaluate/g)].map(m => m[1])
  for (const invented of ['signal_i_dont_understand', 'ask_repeat', 'ask_slow', 'say_sorry', 'ask_repeat_polite']) {
    assert.ok(!dispatched.includes(invented),
      `${invented} is a strategy, not an intent — it belongs to repair_request`)
  }
  assert.ok(dispatched.includes('repair_request') && dispatched.includes('close_encounter'))
  assert.deepEqual(REPAIR_KINDS, ['signal_nonunderstanding', 'repeat', 'slow_down'])

  // every repair step names its strategy; nothing else does
  for (const ep of ARC) {
    for (const step of ep.steps) {
      if (step.evalKind === 'repair_request') {
        assert.ok(REPAIR_KINDS.includes(step.repairKind),
          `${ep.id}: a repair step without a strategy is a step graded against the wrong sentence`)
      } else {
        assert.equal(step.repairKind, undefined, `${ep.id}: ${step.evalKind} does not have strategies`)
      }
    }
  }
  const ids = new Set(SEED_VOCAB.map(v => v.id))
  for (const id of ['i_dont_understand', 'can_you_repeat', 'speak_slowly', 'bye', 'see_you', 'repair_pattern']) {
    assert.ok(ids.has(id), `${id} is not real vocabulary`)
  }
  // the arc's new language, and not one word more
  const newItems = [...new Set([EP13, EP14, EP15].flatMap(e => e.gardenItems || []))]
  assert.equal(newItems.length, 6, `the arc grants ${newItems.length} items: ${newItems.join(', ')}`)
  ok()
}

/* ---- 4) a repair is never the end of the turn ---- */
{
  for (const ep of [EP13, EP14]) {
    const steps = ep.steps
    const repairs = steps.map((s, i) => [s, i]).filter(([s]) => s.evalKind === 'repair_request')
    assert.ok(repairs.length >= 2, `${ep.id} practises repair ${repairs.length} times`)
    /*
     * At least one repair must be followed by the conversation carrying on —
     * another production that is NOT itself a repair. An episode where every
     * repair is followed by the completion screen teaches the phrase and drops
     * the skill.
     */
    const leadsOn = repairs.some(([, i]) => steps.slice(i + 1).some(s =>
      (s.type === 'free_reply' || s.type === 'recall') && s.evalKind !== 'repair_request'))
    assert.ok(leadsOn, `${ep.id}: no repair leads back into the conversation`)
  }
  // and the recognition step never counts as the capability
  const choice = EP14.steps.find(s => s.type === 'choice')
  assert.ok(choice, 'ep14 recognises before it produces')
  assert.notEqual(choice.evalKind, 'repair_request', 'a choice is not a repair produced')
  ok()
}

/* ---- 4b) a gap with one right answer checks it, and never shows it ---- */
{
  /*
   * Two bugs found by walking the episode in a browser, pinned here.
   *
   * The placeholders were literally the answers — "understand" and "repeat" — so
   * the learner read the target out of the input box, and `fill_blank` accepted
   * anything non-empty because the format was built for capture steps where
   * there is nothing to validate. Both recorded guided practice for a word that
   * may never have been typed.
   */
  const base = read('src/i18n/translations.js')
  for (const ep of ARC) {
    for (const step of ep.steps) {
      if (step.type !== 'fill_blank') continue
      /*
       * A gap accepts anything unless it says otherwise, which is right for
       * three of them and wrong for a gap with one answer:
       *   captureFact   — the learner's own place or interest
       *   contextIntent — any value from the controlled catalogue
       *   expects       — one right answer, and therefore checkable
       *
       * The two gaps below are the learner's own NAME, typed into a taught
       * sentence; there is nothing to validate and they predate this rule. They
       * are named rather than pattern-matched so that a new gap cannot join them
       * by accident: anything else must declare which of the three it is.
       */
      const OWN_NAME = new Set(['im', 'my_name_is'])
      const kind = step.captureFact ? 'capture'
        : step.contextIntent ? 'open'
          : step.expects ? 'exact'
            : OWN_NAME.has(step.itemId) ? 'own_name' : null
      assert.ok(kind, `${ep.id}: a gap must say whether it captures, opens or expects an answer`)
      if (!step.placeholderKey) continue
      for (const locale of ['translations', 'es', 'ja', 'ar']) {
        const src = locale === 'translations' ? base : read(`src/i18n/locales/${locale}.js`)
        const m = src.match(new RegExp(`^\\s*${step.placeholderKey}: "([^"]*)"`, 'm'))
        assert.ok(m, `${step.placeholderKey} missing from ${locale}`)
        if (step.expects) {
          assert.notEqual(m[1].trim().toLowerCase(), String(step.expects).toLowerCase(),
            `${ep.id}: the placeholder in ${locale} is the answer`)
        }
      }
    }
  }
  const shell = read('src/components/episode/EpisodeShell.jsx')
  assert.ok(/if \(step\.expects\)/.test(shell), 'the shell must check a gap that declares an answer')
  // the high-support example must be the word, not whatever the fallback had
  assert.ok(/if \(s\.expects\) return s\.expects/.test(shell),
    'a gap with one answer must show that answer as its example, not the learner’s name')
  assert.ok(/step\.captureFact/.test(shell), 'a capture gap must still accept whatever the learner writes')
  ok()
}

/* ---- 5) three different shapes, so the arc does not feel like one episode ---- */
{
  const shape = (ep) => ep.steps.map(s => s.type).join(',')
  assert.notEqual(shape(EP13), shape(EP14))
  assert.notEqual(shape(EP14), shape(EP15))
  assert.notEqual(shape(EP13), shape(EP15))
  const formats = (ep) => new Set(ep.steps.map(s => s.type))
  assert.ok(formats(EP13).has('comprehension') && formats(EP13).has('word_order'))
  assert.ok(formats(EP14).has('choice') && formats(EP14).has('fill_blank'))
  assert.ok(formats(EP15).has('mini_story'))
  assert.ok(!formats(EP15).has('comprehension') && !formats(EP15).has('word_order'),
    'the finale is a conversation, not an exercise set')
  ok()
}

/* ---- 6) episode 15 hosts the real story, and there is only one of them ---- */
{
  const step = EP15.steps.find(s => s.type === 'mini_story')
  assert.ok(step, 'episode 15 must host a story')
  const story = getStory(step.storyObjective)
  assert.ok(story, `unknown story ${step.storyObjective}`)
  assert.equal(storyHome(story), 'episode', 'a hosted story must say the episode owns it')
  assert.deepEqual(storyBranches(story), ['repeat', 'slow_down'], 'two strategies, both correct')
  assert.ok(storyTurns(story).length >= 7, `the story has ${storyTurns(story).length} turns`)

  // both branches are complete and comparable
  const byBranch = storyTurns(story).filter(t => t.byBranch)
  assert.ok(byBranch.length >= 1, 'the branches must actually change what happens')
  for (const branch of storyBranches(story)) {
    for (const turn of storyTurns(story)) {
      if (turn.kind === 'reply') continue
      if (turn.kind === 'choose') {
        assert.ok(turn.options.some(o => o.branch === branch), `no option leads to ${branch}`)
        continue
      }
      assert.ok(turnText(turn, branch, story), `${branch}: an empty ${turn.kind} turn`)
    }
  }
  const lengths = storyBranches(story).map(b => storyTurns(story)
    .map(t => turnText(t, b, story)).filter(Boolean).length)
  assert.equal(new Set(lengths).size, 1, 'one branch must not be shorter than the other')
  assert.ok(storyTurns(story).some(t => t.kind === 'close'), 'the story must end, not stop')
  // the seeded branch is deterministic and always one of this story's own
  for (const seed of ['Sebastian', 'guest', 'Kenji']) {
    assert.ok(storyBranches(story).includes(defaultBranch(seed, story)), `seed ${seed} chose a foreign branch`)
    assert.equal(defaultBranch(seed, story), defaultBranch(seed, story), 'branch choice must be reproducible')
  }

  // ONE implementation: the episode shell renders the shared component
  const shell = read('src/components/episode/EpisodeShell.jsx')
  assert.ok(/import\s+\{?\s*MiniStory\s*\}?\s+from/.test(shell) || /MiniStory/.test(shell),
    'the shell must use the shared MiniStory')
  assert.ok(/<MiniStory\b/.test(shell), 'the shell must render MiniStory rather than reimplement it')
  assert.ok(!/kind === 'line'|storyTurns\(/.test(shell),
    'the shell is walking story turns itself — that is a second story engine')
  assert.ok(/scaffoldLevel=\{/.test(shell), 'the hosted story must inherit the episode’s support level')
  /*
   * The hosted story must tell the episode which ending was played. It did not,
   * so a finished episode 15 recorded branchId: null and the "try the other
   * strategy" offer pointed back at the one the learner had just done.
   */
  assert.ok(/onDone=\{\(branchId\)/.test(shell), 'the shell must receive the story’s ending')
  assert.ok(/updateActiveRun\(modelRef\.current, \{ branchId \}\)/.test(shell),
    'the ending must be recorded on the run, or branch replay cannot work')
  const mini = read('src/components/session/MiniStory.jsx')
  assert.ok(/onDone\(state\.branchId/.test(mini), 'MiniStory must pass its branch to whoever hosts it')
  assert.ok(/scaffoldLevel\s*=\s*null/.test(mini), 'MiniStory must accept a host support level')
  assert.ok(/runMode/.test(mini), 'MiniStory must know whether this run can be rewarded')
  ok()
}

/* ---- 7) the story's turns are real evidence, not decoration ---- */
{
  const story = getStory('repair_request')
  const replies = storyTurns(story).filter(t => t.kind === 'reply')
  assert.ok(replies.length >= 2, 'the story must ask for more than one sentence')
  for (const t of replies) {
    assert.ok(t.evalKind, 'a reply turn without an objective cannot be judged')
    assert.ok((t.itemIds || []).length, 'a reply turn must record what it practised')
  }
  // and the registry can see them
  assert.ok(intentsForEpisode('we_can_continue').includes('yes_no_preference'),
    'the map must count what the hosted story practises')
  assert.ok(episodesProducing('bye').includes('we_can_continue'),
    'the goodbye is produced inside the story')
  ok()
}

/* ---- 8) episode 15 is at least as much of a conversation as episode 6 ---- */
{
  const flatten = (ep) => ep.steps.flatMap(s => (s.type !== 'mini_story'
    ? [s]
    : storyTurns(getStory(s.storyObjective)).map(t => (t.kind === 'reply'
      ? { type: 'free_reply', evalKind: t.evalKind, suggestionEn: t.suggestionEn }
      : t.kind === 'choose' ? { type: 'choice' } : { type: 'scene' }))))
  const productive = (ep) => flatten(ep).filter(s => s.type === 'free_reply' || s.type === 'recall').length
  const turns = (ep) => flatten(ep).length
  const EP6 = getEpisode('first_conversation')
  assert.ok(turns(EP15) >= 7, `ep15 has ${turns(EP15)} turns`)
  assert.ok(productive(EP15) >= productive(EP6),
    `ep15 asks for ${productive(EP15)} productions, ep6 asks for ${productive(EP6)}`)
  assert.ok(turns(EP15) >= turns(EP6), `ep15 ${turns(EP15)} turns vs ep6 ${turns(EP6)}`)
  ok()
}

/* ---- 9) old skills come back, produced rather than merely heard ---- */
{
  /*
   * Reading a sentence is not practising it. Reuse only counts when the learner
   * has to produce the thing, which is what `episodesProducing` measures.
   */
  for (const [item, intent] of [['and_you', 'reciprocal_question'], ['no_thank_you', 'decline_offer'],
    ['im_good', 'answer_wellbeing'], ['do_you_like', 'yes_no_preference'], ['im_from', 'answer_origin']]) {
    const inArc5 = episodesProducing(item).filter(id => REPAIR_IDS.includes(id))
    assert.ok(inArc5.length > 0, `${item} is not produced anywhere in the repair arc`)
    const evaluated = inArc5.some(id => intentsForEpisode(id).includes(intent))
    assert.ok(evaluated, `${item} appears in ${inArc5.join(', ')} but ${intent} is never evaluated there`)
  }
  // the two capabilities the audit called low-reuse are now genuinely reused
  for (const id of ['bounce_a_question_back', 'decline_an_offer']) {
    const cap = CAPABILITY_MAP.find(c => c.id === id)
    assert.equal(cap.status, 'covered', `${id} is reused now and the map must say so`)
    const eps = ARC.filter(e => intentsForEpisode(e.id).includes(cap.covers.intent)).map(e => e.id)
    assert.ok(eps.length >= 2, `${id} is called covered but ${cap.covers.intent} is in ${eps.length} episode(s)`)
  }
  ok()
}

/* ---- 10) linguistic prerequisites are stated, not inferred from the order ---- */
{
  assert.deepEqual(skillPrerequisitesOf('lost_you'), ['full_conversation'],
    'ordering a coffee is the gate before repair, not what makes repair possible')
  assert.deepEqual(skillPrerequisitesOf('say_again'), ['ask_for_repair'])
  assert.deepEqual(skillPrerequisitesOf('we_can_continue'), ['ask_for_repair', 'full_conversation'])
  // an episode that declares nothing still gets an honest answer
  assert.deepEqual(skillPrerequisitesOf('anything_else'), ['polite_request'])
  for (const id of REPAIR_IDS) {
    for (const canDo of skillPrerequisitesOf(id)) {
      assert.ok(ARC.some(e => e.canDoId === canDo), `${id} leans on ${canDo}, which nothing teaches`)
    }
  }
  ok()
}

/* ---- 11) what arc 5 owes the level, and what the level now owes it ---- */
{
  /*
   * This group used to assert that two required capabilities were still
   * missing. That was true of the curriculum in the week arc 5 shipped, not of
   * arc 5, and arc 6 built both — so the assertion becomes the part that IS
   * about arc 5: its two capabilities are required, and the goodbye it could
   * not reuse has since been reused rather than quietly re-graded.
   */
  assert.ok(PRE_A1_EXIT_CRITERIA.requiredCanDos.includes('ask_for_repair'))
  assert.ok(PRE_A1_EXIT_CRITERIA.requiredCanDos.includes('close_an_encounter'))

  const close = CAPABILITY_MAP.find(c => c.covers?.canDo === 'close_an_encounter')
  assert.equal(close.status, 'covered', 'closing was reused by a later arc, and the map says so')
  const reused = canDoCoverage('close_an_encounter').reusedIn
  assert.ok(reused.length >= 1, 'a capability may only be called covered once something asks for it again')
  assert.ok(!reused.includes('we_can_continue'), 'reuse means a DIFFERENT episode requiring it')

  // repair travelled furthest: three episodes, two of them not about repair
  const repair = canDoCoverage('ask_for_repair').reusedIn
  assert.ok(repair.includes('how_many'), 'the repair arc must still be reused outside itself')
  ok()
}

/* ---- 12) the engine does not know these episodes by name ---- */
{
  const files = [
    'src/components/episode/EpisodeShell.jsx',
    'src/components/session/MiniStory.jsx',
    'src/learning/engine/scaffolding.js',
    'src/learning/engine/session.js',
    'src/learning/engine/formatChoice.js',
    'src/learning/engine/responseEvaluation.js',
    'src/learning/engine/learnerModel.js',
    'src/learning/engine/hybridEvaluation.js',
  ]
  for (const f of files) {
    const src = read(f)
    for (const id of REPAIR_IDS) {
      assert.ok(!src.includes(`'${id}'`) && !src.includes(`"${id}"`),
        `${f} names the episode ${id}; the engine must be driven by data`)
    }
    assert.ok(!/episodeId\s*[=><]=?\s*1[0-9]/.test(src), `${f} branches on an episode number`)
    assert.ok(!/=== 13|>= 13/.test(src), `${f} branches on episode 13`)
  }
  ok()
}

/* ---- 13) every key every episode references exists, in every locale ---- */
{
  /*
   * The hole this closes: the whole arc once passed the entire suite with not one
   * translated string, because nothing checked that an episode's keys exist. It
   * covers all fifteen episodes, not just the new ones.
   */
  const keys = new Set()
  const walk = (o) => {
    if (!o || typeof o !== 'object') return
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && (/Key$/.test(k) || k === 'key')) keys.add(v)
      else if (typeof v === 'object') walk(v)
    }
  }
  for (const ep of ARC) {
    walk(ep)
    for (const step of ep.steps) {
      walk(step)
      if (step.type === 'mini_story') for (const t of storyTurns(getStory(step.storyObjective))) walk(t)
    }
  }
  assert.ok(keys.size > 300, `only ${keys.size} keys found — the walk is not seeing the data`)
  const base = read('src/i18n/translations.js')
  const missingBase = [...keys].filter(k => !new RegExp(`^\\s*${k}:`, 'm').test(base))
  assert.deepEqual(missingBase, [], 'keys referenced by an episode and missing from the base language')
  for (const locale of ['es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']) {
    const src = read(`src/i18n/locales/${locale}.js`)
    const missing = [...keys].filter(k => !new RegExp(`^\\s*${k}:`, 'm').test(src))
    assert.deepEqual(missing, [], `${locale} is missing episode keys`)
  }
  ok()
}

/* ---- 14) the learner-facing copy talks about capabilities, not episode numbers -*/
{
  const base = read('src/i18n/translations.js')
  const arc5 = base.slice(base.indexOf('ep13Title'), base.indexOf('storyReplyClose'))
  assert.ok(arc5.length > 500, 'the arc-5 block was not found')
  assert.ok(!/Episode 1[345]|episode 1[345]/.test(arc5), 'the learner never hears an episode number')
  for (const key of ['ep13CanDoName', 'ep14CanDoName', 'ep15CanDoName']) {
    const m = base.match(new RegExp(`^\\s*${key}: "([^"]+)"`, 'm'))
    assert.ok(m, `${key} missing`)
    assert.ok(!/^Episode/.test(m[1]), `${key} is "${m[1]}"`)
    assert.ok(m[1].length <= 40, `${key} is too long for a badge: "${m[1]}"`)
  }
  ok()
}

console.log(`check-fifth-arc — OK  (${n} repair-arc groups verified)`)
