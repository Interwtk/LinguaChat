/*
 * check-personalized-home — the light personalization Home is allowed to show.
 *
 * Home may promise "Today: music". It may never show an interest id, a score,
 * or anything about how the choice was made; it must stay silent when there is
 * nothing to promise; and a session already under way must keep its subject
 * matter even if the learner edits their interests afterwards.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve as resolvePath } from 'node:path'
import { ARC } from '../src/learning/episodes/index.js'
import { buildSessionPlan, getOrCreateSession, normalizeSession, startSession, SESSION_VERSION } from '../src/learning/engine/session.js'
import { createLearnerModel, setEpisodeState } from '../src/learning/engine/learnerModel.js'
import { KNOWN_INTERESTS } from '../src/learning/engine/interests.js'

const here = dirname(fileURLToPath(import.meta.url))
const read = (p) => readFileSync(resolvePath(here, '..', p), 'utf8')
// The English dictionary is read as source (same approach as check-i18n), so
// this check never has to run the locale loader.
const BASE_SRC = read('src/i18n/translations.js')
const hasKey = (key) => new RegExp(`^\\s*${key}:`, 'm').test(BASE_SRC)

let n = 0
const ok = () => { n++ }
const AT = new Date('2026-05-20T09:00:00Z').getTime()

function learner() {
  const m = createLearnerModel()
  for (const id of ['first_greeting', 'ask_name', 'nice_to_meet', 'how_are_you', 'where_from', 'first_conversation']) {
    setEpisodeState(m, id, { status: 'completed', stepIndex: 8, awarded: true })
  }
  return m
}

// 1) a plan pins a topic, and the topic is a localizable label, not an id
{
  const plan = buildSessionPlan(learner(), ARC, { durationMode: 'standard', atMs: AT, interests: ['music'], learnerKey: 'sofia' })
  assert.equal(plan.topic.interestId, 'music')
  assert.equal(plan.topic.labelKey, 'interest_music')
  assert.ok(hasKey(plan.topic.labelKey), 'the label key must exist in the base locale')
  ok()
}

// 2) every interest in the catalogue has a label in every locale
{
  const locales = ['es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']
  for (const id of KNOWN_INTERESTS) {
    const key = `interest_${id}`
    assert.ok(hasKey(key), `${key} missing from the base locale`)
    for (const loc of locales) {
      const src = read(`src/i18n/locales/${loc}.js`)
      assert.ok(src.includes(`${key}:`), `${key} missing from ${loc}`)
    }
  }
  assert.match(BASE_SRC, /sessionTopicToday: "[^"]*\{topic\}/, 'the topic line must interpolate a name')
  ok()
}

// 3) no interests → no topic promised, and nothing breaks
{
  const plan = buildSessionPlan(learner(), ARC, { durationMode: 'standard', atMs: AT, interests: [], learnerKey: 'sofia' })
  assert.equal(plan.topic.interestId, null)
  assert.equal(plan.topic.labelKey, null, 'with nothing to promise Home stays quiet')
  ok()
}

// 4) unknown or malformed interests are ignored rather than shown
{
  for (const interests of [['not_a_real_interest'], [null], 'music', undefined, [{}]]) {
    const plan = buildSessionPlan(learner(), ARC, { durationMode: 'standard', atMs: AT, interests, learnerKey: 'x' })
    assert.ok(plan.topic.labelKey === null || hasKey(plan.topic.labelKey), `bad interests leaked: ${JSON.stringify(interests)}`)
  }
  ok()
}

// 5) several interests → one stable choice, reproducible across rebuilds
{
  const a = buildSessionPlan(learner(), ARC, { durationMode: 'standard', atMs: AT, interests: ['music', 'games', 'travel'], learnerKey: 'sofia' })
  const b = buildSessionPlan(learner(), ARC, { durationMode: 'standard', atMs: AT, interests: ['music', 'games', 'travel'], learnerKey: 'sofia' })
  assert.equal(a.topic.interestId, b.topic.interestId)
  assert.ok(['music', 'games', 'travel'].includes(a.topic.interestId))
  ok()
}

// 6) a session already under way keeps its topic when interests change
{
  const model = learner()
  const started = startSession(buildSessionPlan(model, ARC, { durationMode: 'standard', atMs: AT, interests: ['music'], learnerKey: 'sofia' }))
  const later = getOrCreateSession(model, ARC, {
    durationMode: 'standard', atMs: AT, stored: started,
    interests: ['sports', 'food'],           // the learner edits their profile mid-session
    learnerKey: 'sofia',
  })
  assert.equal(later.topic.interestId, 'music', 'today\'s promise cannot change under the learner')
  assert.equal(later.status, 'active')
  ok()
}

// 7) a NEW session may legitimately pick a different context
{
  const model = learner()
  const today = buildSessionPlan(model, ARC, { durationMode: 'standard', atMs: AT, interests: ['music'], learnerKey: 'sofia' })
  const tomorrow = buildSessionPlan(model, ARC, { durationMode: 'standard', atMs: AT + 86400000, interests: ['sports'], learnerKey: 'sofia' })
  assert.equal(today.topic.interestId, 'music')
  assert.equal(tomorrow.topic.interestId, 'sports')
  ok()
}

// 8) a session stored before topics existed still loads (no forced reset)
{
  const legacy = buildSessionPlan(learner(), ARC, { durationMode: 'standard', atMs: AT, interests: ['music'], learnerKey: 'sofia' })
  delete legacy.topic
  const restored = normalizeSession(legacy, ARC)
  assert.ok(restored, 'an older stored session must still be usable')
  assert.equal(restored.topic.interestId, null)
  assert.equal(restored.version, SESSION_VERSION)
  // and corrupt topics are replaced, never rendered
  const corrupt = normalizeSession({ ...legacy, topic: ['music'] }, ARC)
  assert.equal(corrupt.topic.interestId, null)
  ok()
}

// 9) Home renders the topic from the stored plan, and never an id or a score
{
  const home = read('src/components/today/TodayView.jsx')
  assert.ok(/sessionTopicToday/.test(home), 'the topic line must actually be rendered')
  assert.ok(/sessionTopicRemembered/.test(home), 'a remembered fact must read differently from a chosen interest')
  assert.ok(/session\.topic\b/.test(home), 'the topic must come from the stored plan')
  assert.ok(!/loadLearnerModel\(\)\.learnerFacts/.test(home), 'Home must not go digging for facts itself')
  assert.ok(!/topic\.interestId\}/.test(home), 'an interest id must never be printed')
  // (the existing "confidence" stat pill is the learner's own progress figure,
  // not the preference model — the preference internals are what must not leak)
  assert.ok(!/activityScore|activityPreference|CONFIDENT_PREFERENCE|topic\.score/.test(home),
    'Home never shows the preference algorithm')
  ok()
}

// 10) the episode inside a session uses the pinned topic, not a fresh guess
{
  const runner = read('src/components/session/SessionRunner.jsx')
  assert.ok(/interestId=\{dailySession\.topic\?\.interestId/.test(runner),
    'the session must hand its pinned topic to the episode')
  const shell = read('src/components/episode/EpisodeShell.jsx')
  assert.ok(/interestId\s*\?\s*getInterestContext\(\[interestId\]/.test(shell),
    'a pinned topic must win over the episode\'s own seed')
  ok()
}

console.log(`check-personalized-home — OK  (${n} personalization groups verified)`)
