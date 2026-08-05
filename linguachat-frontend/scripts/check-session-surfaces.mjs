/*
 * check-session-surfaces — the closing question, the session renderers, and
 * the two failure modes that must never leave a learner stranded.
 *
 * Three separate promises are protected here:
 *   1. the question at the end names what the session actually WAS;
 *   2. every format the planner can choose has a real activity behind it;
 *   3. a chunk that fails to load — a screen or a locale — degrades into
 *      something usable, never a blank page, raw keys, or a reload loop.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve as resolvePath } from 'node:path'
import { selectRepresentativeFormat, BLOCK_CANDIDATES, formatSupportsObjective } from '../src/learning/engine/formatChoice.js'
import { ACTIVITY_FORMATS } from '../src/learning/engine/learnerModel.js'

const here = dirname(fileURLToPath(import.meta.url))
const read = (p) => readFileSync(resolvePath(here, '..', p), 'utf8')
const runner = read('src/components/session/SessionRunner.jsx')
const feedback = read('src/components/episode/FormatFeedback.jsx')
const i18n = read('src/i18n/translations.js')

let n = 0
const ok = () => { n++ }
const block = (type, format, source = 'planner') => ({ id: `${type}:${format}`, type, format, source })

/* ---------- 1. the closing question ---------- */

// 1) it is NOT simply the first block
{
  const blocks = [block('review', 'fill_blank'), block('extra_practice', 'roleplay', 'preference')]
  const chosen = selectRepresentativeFormat({
    blocks, completedFormats: ['fill_blank', 'roleplay'], adaptedFormats: ['roleplay'], seed: 's',
  })
  assert.equal(chosen, 'roleplay', 'a ten-minute conversation represents the session; the opening review does not')
  ok()
}

// 2) a format the learner never finished is never asked about
{
  const blocks = [block('review', 'fill_blank'), block('extra_practice', 'roleplay')]
  const chosen = selectRepresentativeFormat({ blocks, completedFormats: ['fill_blank'], seed: 's' })
  assert.equal(chosen, 'fill_blank', 'the abandoned roleplay is not a fair thing to ask about')
  ok()
}

// 3) a one-line recall is too slight to deserve its own question
{
  const onlyRecall = selectRepresentativeFormat({ blocks: [block('recall', 'recall')], completedFormats: ['recall'], seed: 's' })
  assert.equal(onlyRecall, null, 'rather than ask about a three-word recall, ask nothing')
  const withMore = selectRepresentativeFormat({
    blocks: [block('recall', 'recall'), block('review', 'word_order')],
    completedFormats: ['recall', 'word_order'], seed: 's',
  })
  assert.equal(withMore, 'word_order')
  ok()
}

// 4) an activity chosen FOR the learner is the interesting one to ask about
{
  const blocks = [block('review', 'word_order'), block('targeted_retry', 'fill_blank', 'preference')]
  const chosen = selectRepresentativeFormat({
    blocks, completedFormats: ['word_order', 'fill_blank'], adaptedFormats: ['fill_blank'], seed: 's',
  })
  assert.equal(chosen, 'fill_blank')
  ok()
}

// 5) nothing finished → no question at all
{
  assert.equal(selectRepresentativeFormat({ blocks: [block('review', 'choice')], completedFormats: [], seed: 's' }), null)
  assert.equal(selectRepresentativeFormat({}), null)
  assert.equal(selectRepresentativeFormat({ blocks: [{ id: 'x', type: 'session_completion' }], completedFormats: [] }), null)
  ok()
}

// 6) a tie is broken by the seed, so the same session always asks the same thing
{
  const blocks = [block('review', 'word_order'), block('targeted_retry', 'fill_blank')]
  const args = { blocks, completedFormats: ['word_order', 'fill_blank'], seed: 'stable' }
  const runs = new Set(Array.from({ length: 15 }, () => selectRepresentativeFormat({ ...args })))
  assert.equal(runs.size, 1)
  ok()
}

// 7) the question names the activity, and every format has a name in English
{
  assert.match(feedback, /feedbackQuestionFor/, 'the question must name the activity')
  assert.match(feedback, /formatName_\$\{format\}/, 'the name comes from the format itself')
  for (const format of ACTIVITY_FORMATS) {
    assert.ok(new RegExp(`^\\s*formatName_${format}:`, 'm').test(i18n), `formatName_${format} is missing`)
  }
  // the signal must be applied to that same format, not a generic one
  assert.match(feedback, /recordActivitySignalOnce\(model, id, format,/)
  ok()
}

/* ---------- 2. the session renderers ---------- */

// 8) every format the planner can pick has an activity behind it
{
  const rendered = ['word_order', 'guided_reply', 'fill_blank', 'choice', 'recall', 'free_reply', 'roleplay', 'mini_story']
  for (const candidates of Object.values(BLOCK_CANDIDATES)) {
    for (const format of candidates) {
      assert.ok(rendered.includes(format), `${format} can be planned but has no renderer`)
    }
  }
  // and each renderer really exists in the runner
  assert.match(runner, /isBuildFormat/, 'word order / guided reply')
  assert.match(runner, /format === 'fill_blank'/, 'gap fill')
  assert.match(runner, /format === 'choice'/, 'choose the answer')
  assert.match(runner, /isOpenFormat/, 'free text')
  ok()
}

/*
 * 9) each block gets its OWN activity component.
 *    Without a key React reuses one instance for every block: the previous
 *    correction stayed on screen and the "already finished" guard stayed set,
 *    which left the session stuck on its second practice block.
 */
{
  assert.match(runner, /<PracticeTurn key=\{block\.id\}/, 'the practice turn must be keyed by block')
  ok()
}

// 10) choosing is a real radio group, and never colour alone
{
  assert.match(runner, /role="radiogroup"/)
  assert.match(runner, /role="radio" aria-checked=/)
  assert.match(runner, /isChosen \? '●' : '○'/, 'the selected option carries a symbol, not just a colour')
  ok()
}

// 11) a correction says what actually went wrong
{
  assert.match(runner, /sessionChoiceRetry/)
  assert.match(runner, /sessionGapRetry/)
  for (const key of ['sessionChoiceRetry', 'sessionGapRetry', 'sessionBuildInstruction', 'sessionGapInstruction', 'sessionChoiceInstruction']) {
    assert.ok(new RegExp(`^\\s*${key}:`, 'm').test(i18n), `${key} is missing from the base locale`)
  }
  ok()
}

// 12) an answer with the words on screen never counts as independent evidence
{
  /*
   * A closed activity shows the answer, so it is assisted by definition — and
   * it now also declares WHAT it proves. Recognising a sentence is evidence of
   * understanding, never of production, so the evidence kind travels with the
   * attempt instead of being inferred from the support level.
   */
  /*
   * The assertion moved from one item to the block's items: a recall or a
   * consolidation block names a can-do rather than an item, and recorded
   * nothing at all until this sprint. What must stay true is that a closed
   * activity is never independent, whatever it records against.
   */
  assert.match(runner, /recordItemAttempt\(modelRef\.current, id, \{ correct, independent: false, evidenceKind: evidence \}\)/,
    'a closed activity shows the answer, so it is assisted by definition')
  assert.match(runner, /const evidence = evidenceKindForStep\(/,
    'a closed activity must say what kind of evidence it produced')
  assert.match(runner, /const practisedItems = useMemo\(/,
    'a block must record the language it practised, not only an explicit item id')
  ok()
}

/* ---------- 3. failing chunks ---------- */

// 13) a screen that fails to load keeps the learner's state and offers a retry
{
  const boundary = read('src/components/ui/LazyBoundary.jsx')
  const app = read('src/App.jsx')
  // the boundary renders injected labels; the labels themselves are localized
  // where the screens are mounted
  assert.match(boundary, /ScreenError errorLabel=\{errorLabel\} retryLabel=\{retryLabel\}/, 'a failure is explained, not blank')
  assert.match(boundary, /onRetry=\{retry\}/, 'and it can be retried')
  assert.match(app, /errorLabel: t\('screenLoadFailed'\)/, 'the failure text is localized')
  assert.match(app, /retryLabel: t\('screenLoadRetry'\)/)
  assert.match(app, /loadingLabel: t\('screenLoading'\)/)
  assert.match(boundary, /sessionStorage/, 'the one automatic reload is guarded so it cannot loop')
  assert.ok(!/localStorage\.(clear|removeItem)/.test(boundary), 'a failed chunk must never touch saved progress')
  for (const key of ['screenLoading', 'screenLoadFailed', 'screenLoadRetry']) {
    assert.ok(new RegExp(`^\\s*${key}:`, 'm').test(i18n), `${key} is missing`)
  }
  ok()
}

// 14) a locale that fails to load falls back to English, never to raw keys
{
  const translations = read('src/i18n/translations.js')
  assert.match(translations, /\.catch\(\(\) => base\)/, 'a failed locale chunk resolves to English')
  assert.match(translations, /dictionaries\[code\]\?\.\[key\] \|\| base\[key\] \|\| key/, 'and lookup falls through to English')
  // it must be retryable: a failure is not cached as if it had succeeded
  assert.match(translations, /\.finally\(\(\) => inFlight\.delete\(code\)\)/)
  assert.ok(!/dictionaries\[code\] = base/.test(translations), 'a failure must not be remembered as a loaded dictionary')
  ok()
}

/*
 * 15) direction comes from the locale the learner CHOSE, not from the
 *     dictionary that happens to have loaded. Otherwise an Arabic learner
 *     whose chunk is slow or failing would be reading a left-to-right page.
 */
{
  const app = read('src/context/AppContext.jsx')
  assert.match(app, /root\.dir = interfaceLanguageInfo\.base === 'ar' \? 'rtl' : 'ltr'/,
    'RTL must not depend on the dictionary having loaded')
  ok()
}

/* ---- help is what the learner pressed, not what they happened to write ---- */
{
  const runner = readFileSync(new URL('../src/components/session/SessionRunner.jsx', import.meta.url), 'utf8')
  const shell = readFileSync(new URL('../src/components/episode/EpisodeShell.jsx', import.meta.url), 'utf8')

  /*
   * The runner used to decide this by comparing the reply with the model answer.
   * A learner who produced exactly the right sentence out of their own head was
   * recorded as helped — and on a recall or consolidation block, which shows no
   * suggestion at all, that reading is impossible: it silently threw away the one
   * piece of unaided evidence the block existed to collect, left the item short of
   * `can_use`, and kept its review coming back the next day for ever.
   */
  for (const [name, src] of [['the session runner', runner], ['the episode shell', shell]]) {
    assert.ok(!/fromSuggestion:\s*reply === modelAnswer/.test(src),
      `${name} must not infer help from the wording of the answer`)
    assert.ok(/setUsedSuggestion\(true\)/.test(src), `${name} must record the press itself`)
    /*
     * And a correction counts too. A wrong answer is answered by spelling the
     * sentence out — support arriving, as it should — but retyping what was just
     * displayed is not production from memory, and two of those used to be enough
     * to move a language item to `can_use`.
     */
    assert.ok(/const answerWasShown = \(\) => usedSuggestion \|\|/.test(src),
      `${name} must treat an answer shown by a correction as help too`)
    assert.ok(/fromSuggestion:\s*answerWasShown\(\)/.test(src), `${name} must submit what it observed`)
    assert.ok(!/fromSuggestion: usedSuggestion[,)\s]/.test(src),
      `${name} must not look only at the suggestion button`)
  }
  ok()
}

console.log(`check-session-surfaces — OK  (${n} surface groups verified)`)
