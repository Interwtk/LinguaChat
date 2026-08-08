/*
 * check-curriculum-loading — knowing about the curriculum is not downloading it.
 *
 * Everything the product needs before a learner opens anything is structural:
 * which episode comes next, what it teaches, what is due, whether they are
 * ready. None of it is a word Lingua says. Yet asking any of those questions
 * used to load the whole level — every prompt, scene, model answer and hosted
 * story — into the first chunk, because the answers were derived by walking the
 * episode definitions.
 *
 * Three things are checked here, and the first is the one that keeps the other
 * two honest:
 *
 *   1. the generated skeleton still says exactly what the episodes say
 *   2. the first chunk carries the shape and not the content
 *   3. the content is really in a chunk that loads on demand, and a failure to
 *      fetch it is recoverable rather than a dead screen
 *
 * The build assertions read dist/, so they skip (without failing) on a fresh
 * clone that has not built yet — the skeleton check always runs.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

import { A1_ARC1 } from '../src/learning/episodes/a1Arc1.js'
import { ARC } from '../src/learning/episodes/index.js'
import { EPISODE_SKELETON, SKELETON_BY_ID } from '../src/learning/curriculum/preA1Skeleton.generated.js'
import { intentsForEpisode, productiveItemsOf, itemsOf, personalisesOf } from '../src/learning/curriculum/preA1Map.js'
import { PRE_A1_EXIT_CRITERIA } from '../src/learning/curriculum/preA1Map.js'

let groups = 0
const ok = () => { groups += 1 }

const SKELETON_PATH = 'src/learning/curriculum/preA1Skeleton.generated.js'

/*
 * Sentences that exist ONLY in the episode definitions and the hosted stories.
 *
 * Plenty of episode lines are interface strings too — the base dictionary
 * genuinely contains "Can I have two sandwiches, please?" as an example — and
 * the first chunk is entitled to the interface. Probing with those would prove
 * nothing either way, so they are excluded by looking at every other source
 * file in the project.
 */
const CURRICULUM_SOURCES = ['src/learning/episodes', 'src/learning/engine/miniStory.js']

const everythingElse = (() => {
  const texts = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`
      if (CURRICULUM_SOURCES.some(c => path.startsWith(c))) continue
      if (entry.isDirectory()) walk(path)
      else if (/\.(jsx?|mjs)$/.test(entry.name)) texts.push(readFileSync(path, 'utf8'))
    }
  }
  walk('src')
  return texts.join('\n')
})()

const curriculumOnlyProse = (minLength = 14) => {
  const lines = ARC.flatMap(ep => ep.steps.flatMap(s => [s.promptEn, s.sceneEn, s.suggestionEn, s.target, s.response]))
    .filter(t => typeof t === 'string' && t.length > minLength && !t.includes('{'))
  return [...new Set(lines)].filter(text => !everythingElse.includes(text))
}


/* ---- 1) the skeleton is the curriculum, not a second opinion about it ---- */
{
  const committed = readFileSync(SKELETON_PATH, 'utf8')
  execFileSync(process.execPath, ['scripts/build-curriculum-skeleton.mjs'], { stdio: 'pipe' })
  const regenerated = readFileSync(SKELETON_PATH, 'utf8')
  assert.equal(regenerated, committed,
    'the committed skeleton differs from the episodes — run `npm run build:skeleton` and commit the result')

  /*
   * EVERY level's episodes, which is what the skeleton is for. This compared
   * against Pre-A1's list alone, so A1 arc 1 looked like an undescribed extra
   * rather than the second level the skeleton exists to hold.
   */
  assert.equal(EPISODE_SKELETON.length, ARC.length + A1_ARC1.length, 'every episode must be described')
  assert.equal(EPISODE_SKELETON.filter(ep => ep.level === 'Pre-A1').length, ARC.length)
  assert.equal(EPISODE_SKELETON.filter(ep => ep.level === 'A1').length, A1_ARC1.length)
  for (const ep of ARC) {
    const skeleton = SKELETON_BY_ID[ep.id]
    assert.ok(skeleton, `${ep.id} is missing from the skeleton`)
    assert.equal(skeleton.canDoId, ep.canDoId, `${ep.id}: capability`)
    assert.equal(skeleton.xp, ep.xp, `${ep.id}: reward`)
    assert.equal(skeleton.arc, ep.arc, `${ep.id}: arc`)
    assert.deepEqual(skeleton.prerequisites, ep.prerequisites || [], `${ep.id}: prerequisites`)
    assert.deepEqual(skeleton.gardenItems || [], ep.gardenItems || [], `${ep.id}: garden`)
    assert.equal(skeleton.steps.length, ep.steps.length, `${ep.id}: step count`)
    ep.steps.forEach((step, i) => {
      assert.equal(skeleton.steps[i].type, step.type, `${ep.id} step ${i}: type`)
      assert.equal(skeleton.steps[i].evalKind, step.evalKind, `${ep.id} step ${i}: intent`)
    })
  }
  ok()
}

/* ---- 2) and it carries no prose ---- */
{
  const skeleton = readFileSync(SKELETON_PATH, 'utf8')
  /*
   * Probes taken from the episodes themselves: sentences the learner reads. If
   * any of them appear here, the skeleton has started carrying content and the
   * whole point of it is gone.
   */
  const prose = curriculumOnlyProse(12)
  assert.ok(prose.length >= 20, `the episodes should have plenty of prose to look for, found ${prose.length}`)
  const leaked = prose.filter(text => skeleton.includes(text))
  assert.deepEqual(leaked, [], `the skeleton is carrying rendered text: ${leaked.slice(0, 3).join(' | ')}`)
  ok()
}

/* ---- 3) the derivations still answer, and answer the same ---- */
{
  /*
   * The skeleton exists to be read by the registry, so the registry's answers
   * are what actually matter. These are the questions the planner, the support
   * engine and the readiness rules ask.
   */
  for (const ep of ARC) {
    const intents = intentsForEpisode(ep.id)
    const declared = [...new Set(ep.steps.map(s => s.evalKind).filter(Boolean))]
    for (const intent of declared) {
      assert.ok(intents.includes(intent), `${ep.id}: ${intent} was evaluated and the registry cannot see it`)
    }
    assert.ok(itemsOf(ep.id).length > 0, `${ep.id} touches no language at all`)
  }
  for (const canDoId of PRE_A1_EXIT_CRITERIA.requiredCanDos) {
    assert.ok(productiveItemsOf(canDoId).length > 0, `${canDoId} produces nothing the registry can name`)
  }
  // the one derivation that reads the English: personalisation, via placeholders
  assert.ok(personalisesOf('first_greeting').includes('name'),
    'the first episode uses the learner’s name and the registry should know')
  assert.ok(personalisesOf('where_from').length > 0, 'and the origin episode personalises something')
  ok()
}

/* ---- 4) the first chunk carries the shape, not the level ---- */
const DIST = 'dist/assets'
if (!existsSync(DIST)) {
  console.log('\ncheck-curriculum-loading — build assertions SKIPPED (no dist/, run `npm run build`)')
} else {
  const files = readdirSync(DIST).filter(f => f.endsWith('.js'))
  /*
   * The entry is the script the page loads, read from index.html. It used to be
   * found by its `index-` prefix, until a second chunk built from
   * `episodes/index.js` was named the same way and got mistaken for it.
   */
  const html = readFileSync('dist/index.html', 'utf8')
  const entryName = (html.match(/<script[^>]+src="\/assets\/([^"]+\.js)"/) || [])[1]
  assert.ok(entryName, 'index.html must load an entry chunk')
  assert.ok(files.includes(entryName), `index.html loads ${entryName}, which is not in the build`)
  const entry = readFileSync(join(DIST, entryName), 'utf8')

  {
    /*
     * Sentences from the episodes and from the hosted stories. A learner opening
     * Home has not asked for any of them.
     */
    const probes = curriculumOnlyProse()
    assert.ok(probes.length >= 15, `there should be plenty to probe with, found ${probes.length}`)
    const leaked = probes.filter(text => entry.includes(text))
    assert.deepEqual(leaked, [], `episode content is in the entry chunk: ${leaked.slice(0, 3).join(' | ')}`)

    // and neither is the vocabulary catalogue, which only the learning screens show
    const vocabProbes = ['Sorry, I don’t understand', 'Here you are']
    const vocabLeaked = vocabProbes.filter(text => entry.includes(text))
    assert.deepEqual(vocabLeaked, [], `the vocabulary catalogue is in the entry chunk: ${vocabLeaked.join(' | ')}`)

    // the shape, on the other hand, must be there: Home cannot plan without it
    assert.ok(entry.includes('first_greeting') && entry.includes('how_many'),
      'the entry needs the shape of the level to plan the day')
    ok()
  }

  {
    /*
     * The content has to be somewhere, and that somewhere must load on demand.
     * A chunk nobody fetches is not lazy, it is missing.
     */
    const sample = curriculumOnlyProse()[0]
    const carriers = files.filter(f => f !== entryName && readFileSync(join(DIST, f), 'utf8').includes(sample))
    assert.ok(carriers.length >= 1, 'the episode content must live in some chunk')
    for (const carrier of carriers) {
      /*
       * Named in full, in the chunk that imports it. Matching on the name prefix
       * (as this once did) is satisfied by any chunk sharing a first word, which
       * is no evidence at all now that two chunks are called `index-`.
       */
      const referrers = files.filter(f => f !== carrier && readFileSync(join(DIST, f), 'utf8').includes(carrier))
      assert.ok(referrers.length >= 1, `${carrier} is fetched by nothing: dead content, not lazy content`)

      // and the page must not pull it before the learner asks for it
      assert.ok(!html.includes(carrier), `${carrier} is preloaded by index.html, so it is not on demand`)

      /*
       * A content chunk must be distinguishable from the entry by name. This is
       * the invariant whose absence made this very check read the content chunk
       * as the entry, and it is what keeps the build output legible when each A1
       * arc adds one.
       */
      assert.ok(carrier !== entryName && !/^index-/.test(carrier),
        `${carrier} is named like the entry; give the level's content a named module`)
    }
    console.log(`\n  episode content: ${carriers.join(', ')}`)
    ok()
  }

  {
    // the budget, and no raising of the warning threshold to meet it
    const entryKb = statSync(join(DIST, entryName)).size / 1024
    assert.ok(entryKb < 400, `the entry chunk is ${entryKb.toFixed(1)} kB`)
    const viteConfig = readFileSync('vite.config.js', 'utf8')
    assert.ok(!/chunkSizeWarningLimit/.test(viteConfig),
      'the size warning must be earned, not silenced')
    console.log(`  entry ${entryKb.toFixed(1)} kB with the curriculum out of it`)
    ok()
  }

  {
    /*
     * A chunk that fails to arrive — a flaky connection, a stale deploy — must
     * be recoverable from the screen the learner is looking at.
     */
    const boundary = readFileSync('src/components/ui/LazyBoundary.jsx', 'utf8')

    // the rejection is caught, so a missing chunk shows a message rather than nothing
    assert.ok(/\.catch\(/.test(boundary), 'a failed chunk must be caught, not thrown at the learner')
    assert.ok(/setFailed\(true\)/.test(boundary), 'and must put the screen into a state it can report')
    assert.ok(/retryLabel/.test(boundary), 'with a way to try again, in the learner’s language')

    /*
     * Retrying has to actually retry. React.lazy would memoise the first
     * rejection and hand back the same failure for the rest of the page's life,
     * which is why this loads the module itself and re-runs the factory.
     */
    assert.ok(/setAttempt/.test(boundary), 'a retry must re-run the import')
    assert.ok(/\[attempt\]/.test(boundary), 'and the loader must depend on the attempt')
    // the file's own comments explain why React.lazy is avoided, so read past them
    const boundaryCode = boundary.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    assert.ok(!/React\.lazy|\blazy\(/.test(boundaryCode), 'React.lazy would cache the failure for ever')

    // a stale deploy needs one reload, and exactly one
    assert.ok(/RELOAD_GUARD/.test(boundary), 'a cached failure needs a reload to clear the module map')
    assert.ok(/sessionStorage/.test(boundary), 'guarded so a permanently missing chunk cannot loop')
    ok()
  }

  {
    /*
     * The listing is not the player.
     *
     * Home, the practice list, the replay list and session planning all describe
     * episodes; only starting, resuming or replaying one needs its steps. The
     * content used to be a static import of the practice screen, so opening the
     * list downloaded the whole level's prose — invisible to a check that only
     * asked whether the content was in the entry chunk.
     */
    const CONTENT_MODULE = /episodes\/(index|preA1Content)\.js/

    /* in source: exactly two modules may reach the content, and only to play it */
    const sourceFiles = [
      'src/components/layout/ConversationRoom.jsx',
      'src/components/today/TodayView.jsx',
      'src/components/episode/CompletedEpisodes.jsx',
      'src/components/episode/EpisodeShell.jsx',
      'src/components/session/SessionRunner.jsx',
      'src/context/AppContext.jsx',
      'src/learning/curriculum/readiness.js',
      'src/learning/curriculum/preA1Map.js',
      'src/learning/curriculum/episodeContent.js',
      'src/learning/engine/planner.js',
      'src/learning/engine/session.js',
    ]
    const staticImporters = []
    const dynamicImporters = []
    for (const path of sourceFiles) {
      const src = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      for (const line of src.split('\n')) {
        if (!CONTENT_MODULE.test(line)) continue
        if (/^\s*import\s|^\s*export\s.*\sfrom\s/.test(line)) staticImporters.push(path)
        else if (/import\s*\(/.test(line)) dynamicImporters.push(path)
      }
    }
    assert.deepEqual([...new Set(staticImporters)].sort(),
      ['src/components/episode/EpisodeShell.jsx', 'src/components/session/SessionRunner.jsx'],
      `only the two surfaces that play an episode may import its content: ${staticImporters.join(', ')}`)
    assert.deepEqual([...new Set(dynamicImporters)], ['src/learning/curriculum/episodeContent.js'],
      'the resolver is the only module allowed to import content dynamically')

    /* and the listing must be able to describe an episode without its content */
    const room = readFileSync('src/components/layout/ConversationRoom.jsx', 'utf8')
    assert.ok(/SKELETON_BY_ID/.test(room), 'the practice screen names the suggested episode from the skeleton')
    assert.ok(/episodesOfLevel\(PRE_A1\)/.test(room), 'and plans within one level')
    assert.ok(/lazyScreen\(/.test(room), 'and loads the player through the retryable boundary')

    /*
     * In the build: find the chunk that holds the practice listing by a string
     * only that screen has, and prove it does not pull the content chunk.
     */
    const LISTING_MARKER = 'Correct my next sentence and give me one tiny challenge.'
    const listing = files.find(f => readFileSync(join(DIST, f), 'utf8').includes(LISTING_MARKER))
    assert.ok(listing, 'the practice listing must be in some chunk')
    assert.notEqual(listing, entryName, 'and it must not be the entry')

    const contentChunk = files.find(f => /^preA1Content-/.test(f))
    assert.ok(contentChunk, 'the level content must have its own chunk')
    const listingSrc = readFileSync(join(DIST, listing), 'utf8')
    assert.ok(!listingSrc.includes(`from"./${contentChunk}"`) && !listingSrc.includes(`from "./${contentChunk}"`),
      `${listing} statically imports ${contentChunk}: opening the practice list downloads the level`)
    assert.ok(!listingSrc.includes(`import("./${contentChunk}")`),
      `${listing} imports the content itself; the player should`)
    assert.ok(!curriculumOnlyProse().some(text => listingSrc.includes(text)),
      `${listing} contains episode prose`)

    /* the players are where the static dependency belongs */
    const staticChunks = files.filter(f => {
      if (f === contentChunk) return false
      const src = readFileSync(join(DIST, f), 'utf8')
      return src.includes(`from"./${contentChunk}"`) || src.includes(`from "./${contentChunk}"`)
    })
    assert.ok(staticChunks.length > 0, 'something must actually load the content')
    for (const chunk of staticChunks) {
      assert.ok(/^(EpisodeShell|SessionRunner)-/.test(chunk),
        `${chunk} depends on the level content without being a player surface`)
    }
    console.log(`  listing ${listing} carries no content; ${staticChunks.join(', ')} do`)
    ok()
  }
}

console.log(`\ncheck-curriculum-loading — OK  (${groups} loading groups verified)`)
