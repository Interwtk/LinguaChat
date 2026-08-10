/*
 * check-visual-identity — the identity of the product, as invariants.
 *
 * The visual migration replaced a look, and a look can be undone one careless
 * inline style at a time. This file holds the decisions that were deliberate, so
 * undoing them has to be deliberate too. Reads source; the live audit at 390 and
 * 1440, in light and night, is done in a browser.
 *
 * It is a SEPARATE file from `check:visual-structure`, which guards behaviour —
 * guards, aria, one mounted shell, reduced motion. That file survived the
 * migration untouched precisely because it never described the old paint.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const read = (p) => readFileSync(resolve(root, p), 'utf8')

let n = 0
const has = (label, cond) => { assert.ok(cond, label); n++ }

/* every source file under src/, so a rule cannot be dodged by adding a file */
function sourceFiles(dir = resolve(root, 'src'), out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) sourceFiles(full, out)
    else if (/\.(jsx?|css)$/.test(name)) out.push(full)
  }
  return out
}
const FILES = sourceFiles()
const ALL = FILES.map(f => ({ path: f.slice(resolve(root, 'src').length + 1).replace(/\\/g, '/'), text: readFileSync(f, 'utf8') }))
const css = read('src/index.css')
const tailwind = read('tailwind.config.js')
const html = read('index.html')

/* ---- 1) the palette exists, semantically, in both themes ---- */
{
  /*
   * Surfaces ask for a MEANING (`--surface`, `--accent`, `--positive`), never for
   * a hue. That is what lets one set of classes serve day and night, and what
   * stops "the orange one" from spreading into places that are not actions.
   */
  const TOKENS = ['--bg', '--surface', '--surface-soft', '--surface-sunk', '--ink', '--text',
    '--muted', '--border', '--accent', '--accent-soft', '--positive', '--positive-soft']
  const light = css.slice(css.indexOf(':root {'), css.indexOf('.dark {'))
  const night = css.slice(css.indexOf('.dark {'))
  for (const token of TOKENS) {
    has(`${token} is defined for the day theme`, new RegExp(`${token}:`).test(light))
    has(`${token} is defined for the night theme`, new RegExp(`${token}:`).test(night))
  }
  /* night is designed, not inverted: its surfaces step UP and cast no shadow */
  has('night drops the shadows and lifts with surface instead', /--shadow-sm: none/.test(night))
  has('night holds the accent back rather than reusing the day value',
    /--accent:\s*#D98A66/.test(night))
}

/* ---- 2) no AI-product signals anywhere in the source ---- */
{
  /*
   * The look this replaced announced its own technology: purple, blue-to-violet
   * gradients on every button, glow rings, glass panels. None of it taught
   * anybody English.
   */
  const purple = ALL.filter(f => /#7C5CFF|#A996FF|124,\s*92,\s*255|rgb\(124/i.test(f.text))
  assert.deepEqual(purple.map(f => f.path), [], 'purple is back in the palette')
  n++

  const gradientButtons = ALL.filter(f =>
    /linear-gradient\([^)]*var\(--(violet|blue|coral|yellow)\)/.test(f.text))
  assert.deepEqual(gradientButtons.map(f => f.path), [], 'two-colour gradient fills are back')
  n++

  /* `--violet` may still be READ as a legacy alias, but it must not be purple */
  const violetDef = /--violet:\s*var\(--accent\)/.test(css)
  has('the legacy --violet alias resolves to the accent, not to a purple', violetDef)

  const glass = ALL.filter(f => /backdrop-filter|backdropFilter/.test(f.text))
  assert.deepEqual(glass.map(f => f.path), [], 'glassmorphism is back')
  n++
}

/* ---- 3) typography: two families, and headings really use one of them ---- */
{
  has('the two families are loaded once, in the document head',
    /Bricolage\+Grotesque/.test(html) && /Figtree/.test(html))
  has('body text is Figtree', /font-family:\s*Figtree/.test(css))
  has('headings are Bricolage', /'Bricolage Grotesque'/.test(css))
  has('Tailwind knows both families', /Figtree/.test(tailwind) && /Bricolage Grotesque/.test(tailwind))
  has('there is a display class for headings that are not h1-h3', /\.font-display/.test(css))
  /* the previous family is gone from the document and from the config */
  has('Plus Jakarta Sans is no longer loaded', !/Plus\+Jakarta|Plus Jakarta/.test(html + tailwind + css))
}

/* ---- 4) one responsive app, not two ---- */
{
  /*
   * The mobile and desktop layouts render the SAME destinations from ONE list.
   * Two hand-maintained navigations is how a phone and a laptop drift into
   * different products.
   */
  const app = read('src/App.jsx')
  has('destinations are declared once', /const DESTINATIONS = \[/.test(app))
  has('the mobile bar maps over them', /DESTINATIONS\.map/.test(app))
  has('the desktop rail maps over them too',
    (app.match(/DESTINATIONS\.map/g) || []).length >= 2)
  has('there is no second app for mobile',
    !ALL.some(f => /MobileApp|DesktopApp/.test(f.path)))
  /* still exactly one mounted shell — the behaviour check owns the detail */
  has('shells are still conditionally mounted', /\{isDesktop && \(/.test(app) && /\{!isDesktop && \(/.test(app))
}

/* ---- 5) the streak is the flame, and the flame is slow ---- */
{
  const flame = read('src/components/ui/StreakFlame.jsx')
  has('the flame has the designed tiers', /FLAME_TIERS/.test(flame) && /candle/.test(flame) && /oxyacetylene/.test(flame))
  has('a longer streak reads as a different fire', /min: 365/.test(flame) && /min: 7/.test(flame))
  has('the tiers are ordered hottest-first so the first match wins',
    flame.indexOf('min: 365') < flame.indexOf('min: 0'))
  has('the number carries the meaning, the fire is decorative by default',
    /aria-hidden=\{label \? undefined : 'true'\}/.test(flame))

  /* motion: slow, layered, and stoppable */
  const durations = [...css.matchAll(/animation:\s*flame\w+\s+([\d.]+)s/g)].map(m => Number(m[1]))
  has('every flame layer animates', durations.length >= 3)
  has('no flame layer is faster than three seconds', durations.every(d => d >= 3))
  has('the layers run on different rhythms so they blend rather than stack',
    new Set(durations).size >= 3)
  has('the flame stops for prefers-reduced-motion',
    /prefers-reduced-motion[\s\S]*\.streak-flame i/.test(css))
  /* and the emoji it replaced is gone from the surfaces that show a streak */
  const emoji = ALL.filter(f => /components\/(layout|today)\//.test(f.path) && f.text.includes('🔥'))
  assert.deepEqual(emoji.map(f => f.path), [], 'a fire emoji is standing in for the flame again')
  n++
}

/* ---- 6) being corrected looks the same everywhere, and never like a warning ---- */
{
  has('there is one correction surface', /\.correction-card/.test(css))
  has('it quotes the learner and shows the natural version',
    /\.correction-quote/.test(css) && /\.correction-natural/.test(css))
  const users = ALL.filter(f => /correction-card/.test(f.text) && f.path.endsWith('.jsx')).map(f => f.path)
  has('the conversation uses it', users.includes('components/chat/TutorFeedback.jsx'))
  has('the episode uses the same one', users.includes('components/episode/EpisodeShell.jsx'))
  has('the notes panel uses it too', users.includes('components/layout/TutorNotes.jsx'))
  /* a correction quotes what the learner wrote, rather than inventing a strike-through */
  const bubble = read('src/components/chat/MessageBubble.jsx')
  has('the learner\'s own line is threaded into the correction', /previousUserText/.test(bubble))
}

/* ---- 7) quick actions and tools are real, labelled, and reachable ---- */
{
  const quick = read('src/components/today/QuickActionWindows.jsx')
  has('quick actions call real product functions',
    /beginSession/.test(quick) && /navigateTo\('memory-garden'\)/.test(quick))
  has('no quick action is a dead tile', !/onClick=\{\(\) => \{\}\}/.test(quick))
  has('every quick action carries a visible label', /<strong>\{action\.label\}<\/strong>/.test(quick))

  const toolbar = read('src/components/chat/PracticeToolbar.jsx')
  has('the practice tools prefill the existing conversation flow', /onUsePrompt\(action\.prompt\)/.test(toolbar))
  has('the tools are a labelled group', /aria-label=\{t\('practiceTools'\)\}/.test(toolbar))
  const room = read('src/components/layout/ConversationRoom.jsx')
  has('the toolbar sits with the composer', /<PracticeToolbar t=\{t\} onUsePrompt=\{usePrompt\} \/>/.test(room))
  /*
   * NO CONTROL FOR A FEATURE THAT DOES NOT EXIST. A permanently disabled
   * microphone with an English tooltip was an affordance for voice, which is not
   * implemented; it is gone until it is.
   */
  has('there is no disabled microphone pretending voice exists',
    !/Voice input - coming soon/.test(room))
  has('and no voice provider was smuggled in',
    !ALL.some(f => /SpeechRecognition|speechSynthesis|webkitSpeechRecognition/.test(f.text)))
}

/* ---- 8) focus mode hides panels and nothing else ---- */
{
  const app = read('src/App.jsx')
  has('focus mode is one piece of local state', /const FOCUS_MODE_KEY = 'lc2-focus-mode'/.test(app))
  has('it survives a reload', /localStorage\.setItem\(FOCUS_MODE_KEY/.test(app))
  has('it decides which panels are mounted', /const showRail = !focusMode/.test(app) && /const showNotes = !focusMode/.test(app))
  has('the way out is always drawn', /function FocusExitButton/.test(app) && /focusMode && <FocusExitButton/.test(app))
  /*
   * It changes what is on screen and NOTHING else: no route, no learner state, no
   * availability, no episode progress.
   */
  const focusBlock = app.slice(app.indexOf('function useFocusMode'), app.indexOf('/* The way out of focus mode'))
  for (const word of ['navigateTo', 'startEpisode', 'loadLearnerModel', 'beginSession']) {
    has(`focus mode does not touch ${word}`, !focusBlock.includes(word))
  }
}

/* ---- 9) no example data in a surface that claims to be about the learner ---- */
{
  /*
   * "12 days", "76 words" and an invented mistake were in the mockups as
   * illustrations. A screen that shows them to somebody who has done neither is
   * lying to them.
   */
  const liveSurfaces = ALL.filter(f => /^components\/(today|layout|memory|identity|progress)\//.test(f.path))
  const withMocks = liveSurfaces.filter(f => /MOCK_STATS|LAST_MISTAKES|WORDS_LEARNED|DEMO_GARDEN/.test(f.text))
  assert.deepEqual(withMocks.map(f => f.path), [], 'example data is back in a live surface')
  n++
  const garden = read('src/components/memory/MemoryGarden.jsx')
  has('an empty garden says it is empty', /noWordsYet/.test(garden))
  const today = read('src/components/today/TodayView.jsx')
  has('the streak on Home is the learner\'s own', /localProgress\?\.streak/.test(today))
  has('the words on Home are counted from the learner model', /languageItems \|\| \{\}\)\.length/.test(today))
}

/* ---- 10) the learning states survive the redesign ---- */
{
  const garden = read('src/components/memory/MemoryGarden.jsx')
  for (const state of ['can_use', 'practicing']) {
    has(`the garden still knows the ${state} state`, garden.includes(state))
  }
  has('the garden reads the learner model, not a copy of it', /loadLearnerModel/.test(garden))
  has('word tiles are legible rather than scattered', !/wordRotation/.test(garden))
}

/* ---- 11) RTL flips the chrome and never the language being learned ---- */
{
  has('RTL is handled in the stylesheet', /\[dir="rtl"\]/.test(css))
  has('the bubbles mirror their corners', /\[dir="rtl"\] \.bubble-user/.test(css))
  has('Chatto is never mirrored', /\[dir="rtl"\] \.chatto-image/.test(css) && /transform: none/.test(css))
  const room = read('src/components/layout/ConversationRoom.jsx')
  has('the learner types English left-to-right whatever the interface does',
    /lang="en"\s*\n\s*dir="ltr"/.test(room) || /lang="en" dir="ltr"/.test(room))
  /* logical properties, so a mirrored layout does not need a second set of rules */
  has('panels use logical edges', /borderInlineStart|borderInlineEnd/.test(read('src/App.jsx')))
}

/* ---- 12) accessibility floor ---- */
{
  has('keyboard focus is visible', /focus-visible/.test(css))
  has('the focus ring is drawn in the accent, on top of the surface',
    /box-shadow: 0 0 0 2px var\(--surface\), 0 0 0 4px var\(--accent\)/.test(css))
  has('reduced motion is honoured', /prefers-reduced-motion/.test(css))
  has('the primary action is a comfortable target', /\.btn-primary[\s\S]*min-height: 48px/.test(css))
  has('a tool chip is a comfortable target', /\.tool-chip[\s\S]*min-height: 38px/.test(css))
  has('larger type is a setting, not a zoom', /html\[data-text-size="large"\]/.test(css))

  /* the theme control is named in the interface language, not in English */
  const toggle = read('src/components/ui/ThemeToggle.jsx')
  has('the theme control is labelled through i18n', /t\('switchToLight'\)/.test(toggle) && /t\('switchToDark'\)/.test(toggle))
  has('and it reports its state', /aria-pressed=\{darkMode\}/.test(toggle))

  /* the navigations say where you are */
  const app = read('src/App.jsx')
  has('navigation marks the current destination', (app.match(/aria-current=/g) || []).length >= 2)
  has('both navigations are named', (app.match(/aria-label=\{t\('mainNavigation'\)\}/g) || []).length >= 2)
}

console.log(`check-visual-identity — OK  (${n} identity invariants verified)`)
