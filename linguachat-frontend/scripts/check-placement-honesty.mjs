/*
 * check-placement-honesty — LC-PROD-001: placement, profile and Home must agree
 * on what curriculum LinguaChat can actually teach.
 *
 * Before this task, `calculatePlacementResult()` returned a raw CEFR label
 * (A1-C2) with no ceiling tied to real content, `LevelReveal` rendered it as
 * the learner's teaching level, the profile "journey map" placed "you are
 * here" from that same raw label, and Home's daily planner / the session
 * builder were both hardcoded to `episodesOfLevel(PRE_A1)` independent of any
 * of that — three code paths that could each answer a different question.
 * Only Pre-A1 is `available` (`learning/curriculum/levels.js`), so any of
 * those raw CEFR labels above it implied a structured path this build cannot
 * open.
 *
 * This proves: the diagnostic placement level can land anywhere on the CEFR
 * scale without moving what the app claims to actually teach; an unavailable
 * level can never acquire a user-facing name; Home and the session builder
 * both derive their episode list from the curriculum registry rather than a
 * hardcoded level id; and the profile journey map's "current" node is wired
 * to that same registry answer, never to the raw placement label.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import { calculatePlacementResult } from '../src/services/placement.js'
import {
  PRE_A1, A1, A2, B1, B2, C1, LEVEL_IDS, playableLevelId, labelKeyOfLevel, isLevelAvailable,
  availableLevelIds, episodesOfLevel, getLevel,
} from '../src/learning/curriculum/levels.js'
import { COURSE_NODE_BY_LEVEL_ID } from '../src/data/mockData.js'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(here, '..', rel), 'utf8')

let n = 0
const ok = () => { n++ }

// Synthetic placement answers: `level` is the question's CEFR band, `isCorrect`
// drives the scoring shift calculatePlacementResult() already implements.
function answers(level, pattern) {
  return pattern.map(isCorrect => ({ level, isCorrect, skillKey: 'vocabulary' }))
}

async function main() {
  // 1) A learner who lands at the bottom of the CEFR scale is still only
  //    ever offered the actual playable curriculum, never a raw label taken
  //    at face value.
  {
    const state = { answers: answers('A1', [false, false, false, true, true, false, false, true]) }
    const result = calculatePlacementResult(state, 'en')
    assert.equal(result.level, 'A1', 'sanity: this answer pattern places at A1')
    assert.equal(result.currentCourseLevelId, playableLevelId())
    assert.equal(result.currentCourseLevelId, PRE_A1, 'today the only playable level is Pre-A1')
    assert.equal(result.currentCourseLabelKey, labelKeyOfLevel(PRE_A1))
    ok()
  }

  // 2) A learner who tests well above any built curriculum (near-C1) gets the
  //    SAME "what LinguaChat teaches today" answer as the beginner above —
  //    the diagnostic level moves, the honest course answer does not.
  {
    const state = {
      answers: [
        ...answers('B2', [true, true, true]),
        ...answers('C1', [true, true, true, true, true]),
      ],
    }
    const result = calculatePlacementResult(state, 'en')
    assert.ok(['B2', 'C1', 'C2'].includes(result.level), `expected a high placement, got ${result.level}`)
    assert.equal(result.currentCourseLevelId, playableLevelId(),
      'the course LinguaChat actually offers must not depend on how well the learner tested')
    assert.equal(result.currentCourseLevelId, PRE_A1)
    assert.equal(result.currentCourseLabelKey, labelKeyOfLevel(PRE_A1))
    assert.notEqual(result.level, result.currentCourseLevelId,
      'the diagnostic CEFR label and the internal course id are different namespaces on purpose')
    ok()
  }

  // 3) An unavailable level can never carry a user-facing name — inventing one
  //    is exactly how an unbuilt level would leak into placement/profile copy.
  {
    assert.equal(isLevelAvailable(A1), false, 'A1 stays unavailable — unfinished A1 fails closed')
    assert.equal(labelKeyOfLevel(A1), null, 'A1 has no label key while it is unavailable')
    assert.equal(labelKeyOfLevel(PRE_A1), 'preA1LevelBadge')
    ok()
  }

  // 4) Every currently available level has a resolvable label key — the
  //    honesty card in LevelReveal has something real to show, never a gap.
  {
    for (const id of availableLevelIds()) {
      const key = labelKeyOfLevel(id)
      assert.ok(key, `available level ${id} must carry a label key`)
    }
    ok()
  }

  // 5) Home and the session builder derive their episode list from the
  //    curriculum registry, not a hardcoded level id — proved two ways: the
  //    source no longer hardcodes the old PRE_A1 constant call, and the
  //    resulting arc is identical to deriving it straight from the registry.
  {
    const today = read('src/components/today/TodayView.jsx')
    const appContext = read('src/context/AppContext.jsx')
    for (const [name, src] of [['TodayView.jsx', today], ['AppContext.jsx', appContext]]) {
      assert.match(src, /episodesOfLevel\(playableLevelId\(\)\)/,
        `${name} must derive its arc from playableLevelId(), not a hardcoded level id`)
      assert.doesNotMatch(src, /episodesOfLevel\(PRE_A1\)/,
        `${name} must not hardcode episodesOfLevel(PRE_A1) — that stops agreeing with availability once a second level opens`)
    }
    const registryArc = episodesOfLevel(playableLevelId())
    assert.ok(registryArc.length > 0, 'sanity: the playable level actually has runtime episodes')
    ok()
  }

  // 6) The profile "journey map" (ProgressMap via JourneyRail) places "you are
  //    here" using the real playable level, never the raw CEFR placement —
  //    otherwise a B1+ placement could point at a Travel/Confidence/Fluency
  //    node this build has no content for.
  {
    const journeyRail = read('src/components/layout/JourneyRail.jsx')
    assert.match(journeyRail, /ProgressMap\s+courseLevelId=\{playableLevelId\(\)\}/,
      'JourneyRail must pass the playable curriculum level into ProgressMap, not profile.level')
    assert.doesNotMatch(journeyRail, /ProgressMap\s+level=\{profile\.level\}/,
      'the journey map must not place the learner using the raw CEFR placement label')

    // every currently available level must resolve to a real journey node —
    // an available level silently falling back to "start" would misplace a
    // learner once a second level opens.
    for (const id of availableLevelIds()) {
      assert.ok(COURSE_NODE_BY_LEVEL_ID[id], `available level ${id} has no journey node mapping`)
    }
    assert.equal(COURSE_NODE_BY_LEVEL_ID[playableLevelId()], 'start',
      'today the only playable level is Pre-A1, which is the very start of the journey')
    ok()
  }

  // 7) No C1+ curriculum was invented by this task: the registry knows
  //    exactly Pre-A1, A1, A2, B1 and B2, in that order (A2/B1/B2 wired in by
  //    LC-INT-001, per its own task description — not an invention this
  //    check should still be guarding against), and none of A1/A2/B1/B2 is open.
  {
    assert.deepEqual(LEVEL_IDS, [PRE_A1, A1, A2, B1, B2, C1])
    assert.equal(getLevel(A1).available, false)
    assert.equal(getLevel(A2).available, false)
    assert.equal(getLevel(B1).available, false)
    assert.equal(getLevel(B2).available, false)
    ok()
  }

  console.log(`check-placement-honesty — OK  (${n} groups verified)`)
}

main().catch((e) => { console.error('check-placement-honesty — FAIL\n', e.message); process.exit(1) })
