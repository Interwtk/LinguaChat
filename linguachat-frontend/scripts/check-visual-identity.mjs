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

/* ---- 4) one responsive app, and the design's four destinations ---- */
{
  const app = read('src/App.jsx')
  has('destinations are declared once', /const DESTINATIONS = \[/.test(app))
  has('the mobile bar maps over them', /DESTINATIONS\.map/.test(app))
  has('the desktop rail maps over them too', (app.match(/DESTINATIONS\.map/g) || []).length >= 2)
  has('there is no second app for mobile', !ALL.some(f => /MobileApp|DesktopApp/.test(f.path)))
  has('shells are still conditionally mounted', /\{isDesktop && \(/.test(app) && /\{!isDesktop && \(/.test(app))

  /*
   * THE FOUR ARE THE DESIGN'S FOUR: today, chats, words, you.
   *
   * SUPERSEDES a weaker assertion that only counted the destinations. The previous
   * shell had four of them too — but one was "practice", which took the place of
   * Chats and left the product without an inbox, and the design is explicit that
   * practice is where a conversation happens rather than a place in the bar.
   */
  const ids = [...app.matchAll(/id: '([a-z-]+)', labelKey/g)].map(m => m[1])
  assert.deepEqual(ids, ['today', 'chats', 'memory-garden', 'identity'],
    `primary navigation is ${ids.join(', ')}`)
  n++
  has('practice is NOT a primary destination', !ids.includes('practice'))
  has('pricing is NOT a primary destination', !ids.includes('pricing'))
  has('notes are NOT a primary destination', !ids.includes('notes'))
  /* a route reached from inside a destination still highlights that destination */
  has('routes map onto destinations', /const DESTINATION_OF = \{/.test(app))
  has('practice belongs to chats', /practice: 'chats'/.test(app))
  has('pricing belongs to you', /pricing: 'identity'/.test(app))

  /*
   * AND THE LEGACY RAIL IS GONE FROM THE SHELL. `JourneyRail` still exists and
   * still owns the path, but the shell must not render it as the app's navigation
   * — that is the mixture this sprint removed.
   */
  has('the shell does not import the progress rail', !/from '\.\/components\/layout\/JourneyRail'/.test(app))
  const rail = read('src/components/layout/JourneyRail.jsx')
  has('the rail no longer carries an explore menu', !/t\('explore'\)/.test(rail))
  has('the rail can be embedded in a screen instead', /embedded = false/.test(rail))
  has('and the path lives on the You screen',
    /JourneyRail/.test(read('src/components/identity/LanguageIdentity.jsx')))
}

/* ---- 5) the streak flame reads as FIRE, and keeps the design's motion ---- */
{
  const flame = read('src/components/ui/StreakFlame.jsx')

  /*
   * THIS GROUP HAS BEEN RESTATED ONCE, DELIBERATELY.
   *
   * It used to assert that the silhouette was the design's own: a square with
   * `border-radius: 50% 0 50% 50%` held at -45°. Rendered screenshots settled
   * that argument — that construction is the canonical way to draw a WATER DROP,
   * and beside the reference's own markup it produced the same droplet, so the
   * fault was the geometry, not the port. The intent of the asset is fire, and
   * the intent wins: the shape is now a flame outline standing upright.
   *
   * So these assertions guard two different things. The design's system — tiers,
   * sizes, palettes, layer counts, gradients, ember, cadences, easing, reduced
   * motion — is checked because it must not drift. The silhouette is checked
   * because it must not go back: no rest rotation near -45°, no square layers,
   * and a tip that leans instead of sitting on the centre line.
   */
  has('the tiers are the design\'s eight', /FLAME_TIERS/.test(flame)
    && ['candle', 'campfire', 'alcohol', 'natural_gas', 'propane', 'propane_o2', 'acetylene', 'oxyacetylene']
      .every(id => flame.includes(`'${id}'`)))
  has('the tiers are ordered hottest-first so the first match wins',
    flame.indexOf('min: 365') < flame.indexOf('min: 0'))

  /* the reference's container sizes, per tier */
  for (const size of ['[41, 42]', '[47, 50]', '[51, 56]', '[56, 62]', '[61, 68]', '[65, 74]', '[70, 80]', '[76, 88]']) {
    has(`the ${size} container comes from the reference`, flame.includes(size))
  }
  /* THE SILHOUETTE: a flame outline, upright, leaning, never a droplet again */
  has('the silhouette is a flame outline', /clipPath: FLAME_SHAPE\[layer\.anim\]/.test(flame)
    && /const FLAME_SHAPE = \{/.test(flame))
  for (const layer of ['flameA', 'flameB', 'flameC']) {
    has(`${layer} has its own outline`, new RegExp(`${layer}: 'polygon\\(`).test(flame))
  }
  /* the droplet construction is gone: no radius shape, no -45° rest angle */
  has('no layer is a rounded square any more', !flame.includes("'50% 0 50% 50%'"))
  has('nothing rests at -45 degrees', !/rotate\(-4[0-9]deg\)/.test(flame) && !/rotate\(-4[0-9]deg\)/.test(css))
  has('the flame pivots at its base', flame.includes("transformOrigin: '50% 100%'"))
  /* upright and taller than wide — a square layer is what made it read as a bulb */
  has('the layers are taller than they are wide',
    /HEIGHT_RATIO = \{ flameA: 1\.34, flameB: 1\.28, flameC: 1\.22 \}/.test(flame)
    && /height: px\(layer\.w \* HEIGHT_RATIO\[layer\.anim\]\)/.test(flame))
  /* the tip leans, and the inner layers step off the centre line */
  const tips = ['flameA', 'flameB', 'flameC'].map(name => {
    const path = new RegExp(`${name}: 'polygon\\((\\d+)% 0%`).exec(flame)
    return path ? Number(path[1]) : 50
  })
  has('every tip is off the centre line', tips.every(x => x !== 50))
  has('the tips do not all lean the same way', new Set(tips.map(x => x > 50)).size > 1)
  has('the inner layers are nudged off axis', /NUDGE = \{ flameA: 0, flameB: -1\.4, flameC: 1 \}/.test(flame))
  /* the reference's own gradient stops and inset highlight */
  has('the white-hot stop is kept', flame.includes('rgba(255,255,255,.96) 100%'))
  has('the sheen is the reference\'s radial gradient', /circle at 56% 30%/.test(flame))
  has('the inset highlight is kept', /inset 0 0 6px rgba\(255,255,255,\.18\)/.test(flame))
  /* the ember, which is what makes it read as fire rather than as an icon */
  has('there is an ember halo', /streak-flame-ember/.test(flame) && /blur\(\$\{px\(7\)\}\)/.test(flame))

  /* the three cadences, exactly as the reference declares them */
  has('flameA runs at 2.85s', flame.includes("flameA: '2.85s'"))
  has('flameB runs at 2.15s', flame.includes("flameB: '2.15s'"))
  has('flameC runs at 1.62s', flame.includes("flameC: '1.62s'"))
  has('with the reference\'s easing', flame.includes("cubic-bezier(.45,0,.55,1)"))
  has('and the ember at 4.95s', /ember 4\.95s ease-in-out infinite/.test(flame))

  /* the hotter families gain a third flame layer, as the reference does */
  has('the hot tiers have three flame layers', (flame.match(/flameC/g) || []).length >= 4)

  /* the keyframes are the reference's, in the stylesheet */
  for (const name of ['flameA', 'flameB', 'flameC', 'ember']) {
    has(`@keyframes ${name} exists`, new RegExp(`@keyframes ${name} \\{`).test(css))
  }
  /* the keyframes moved from morphing corners to swaying an outline */
  const frames = /@keyframes flameA \{[\s\S]*?\n\}/.exec(css)?.[0] || ''
  has('the keyframes no longer morph a border radius', !/border-radius/.test(frames))
  has('the flame sways from rest by a couple of degrees, not ten',
    [...frames.matchAll(/rotate\((-?[\d.]+)deg\)/g)].every(m => Math.abs(Number(m[1])) < 4))
  /*
   * HOW THE LAYERS BECOME ONE FLAME. The design screens them together, which is
   * right on a dark surface and erases the colour on a cream one — that is what
   * turned the streak into a pale droplet. Night keeps the design's blending;
   * day stacks the layers at graded opacity so the terracotta survives.
   */
  has('the layers integrate rather than sit on each other',
    /LAYER_OPACITY = \{ flameA: 0\.94, flameB: 0\.82, flameC: 0\.72 \}/.test(flame))
  has('night keeps the design\'s screen blending',
    /\.dark \.streak-flame-layer,\s*\n\.dark \.streak-flame-ember \{ mix-blend-mode: screen; \}/.test(css))
  has('a light page does not screen the colour away',
    !/\.streak-flame-layer \{[^}]*mix-blend-mode/.test(css))
  has('the flame stops for prefers-reduced-motion',
    /prefers-reduced-motion[\s\S]*\.streak-flame-layer, \.streak-flame-ember/.test(css))

  /* the number carries the meaning; the fire is decorative by default */
  has('the flame is decorative unless labelled',
    /aria-hidden=\{label \? undefined : 'true'\}/.test(flame))
  /* and nothing has gone back to an emoji or an icon font */
  const emoji = ALL.filter(f => /components\/(layout|today|chats)\//.test(f.path) && f.text.includes('\u{1F525}'))
  assert.deepEqual(emoji.map(f => f.path), [], 'a fire emoji is standing in for the flame again')
  n++
  has('the flame is not an svg icon', !/<svg[^>]*>[^]*?flame/i.test(flame))
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

/* ---- 7) Home has no extra action box, and the tools are real ---- */
{
  /*
   * "AT HAND" IS GONE. A four-tile grid of secondary actions sat between Lingua
   * and today's session; the design's Home (frame 2a) has no such block, and it
   * pushed the one action the screen exists for below the fold. It is not enough
   * to delete it — every route it offered has to still exist somewhere, so that
   * is what is asserted here.
   */
  const today = read('src/components/today/TodayView.jsx')
  has('Home has no separate quick-access box',
    !/QuickActionWindows/.test(today) && !/quickAccess/.test(today))
  has('the quick-access component is gone for good',
    !ALL.some(f => f.path.includes('QuickActionWindows')))
  has('and its styling left with it', !/\.quick-window|\.quick-action/.test(css))
  /* where the four actions went */
  has('the session is still one filled action on Home',
    /onClick=\{beginSession\} className="btn-primary/.test(today))
  has('free practice is still one tap from Home', /navigateTo\('practice'\)/.test(today))
  const chats = read('src/components/chats/ChatsView.jsx')
  has('the notes are still a row in Chats', /id: 'notes'/.test(chats))
  has('the archive is still a row in Chats', /navigateTo\('archive'\)/.test(chats))
  const app = read('src/App.jsx')
  has('the words are still a destination', /'memory-garden'/.test(app))

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
  /*
   * It decides which SURFACES are mounted, and in the restored shell that is all
   * three of them: the navigation (or the chat list), the context panel, and the
   * mobile bar. The earlier version of this assertion named `showRail`/`showNotes`,
   * which belonged to the shell this sprint replaced.
   */
  has('focus mode removes the left column', /\{!focusMode && !isCall && \(/.test(app))
  has('focus mode removes the context panel', /const panelKind = focusMode \? null :/.test(app))
  has('focus mode removes the mobile bar', /\{!focusMode && !isCall && <MobileNav \/>\}/.test(app))
  has('the way out is always drawn', /function FocusExitButton/.test(app) && /focusMode && <FocusExitButton/.test(app))
  /* and nothing of the old shell can survive it, because it is no longer rendered */
  has('there is no legacy rail left to leak into focus mode', !/JourneyRail/.test(app))
  /*
   * It changes what is on screen and NOTHING else: no route, no learner state, no
   * availability, no episode progress.
   */
  const focusBlock = app.slice(app.indexOf('function useFocusMode'), app.indexOf('function FocusExitButton'))
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


/* ---- 13) Chats is a real destination, built from real state ---- */
{
  const chats = read('src/components/chats/ChatsView.jsx')
  has('the inbox exists', /export function ChatsView/.test(chats))
  has('it has the design\'s title and search', /chatsTitle/.test(chats) && /chatsSearchPlaceholder/.test(chats))
  /* the four kinds of row the design puts in the inbox */
  for (const row of ['lingua', 'chatto', 'notes', 'archive']) {
    has(`the ${row} row exists`, new RegExp(`id: '${row}'`).test(chats) || new RegExp(`'${row}'`).test(chats))
  }
  has('an episode in progress appears as a thread', /episodeInProgress/.test(chats))
  has('the Lingua row opens the real conversation', /navigateTo\('practice'\)/.test(chats))
  /*
   * NOTHING IS INVENTED. Timestamps come from message timestamps, the unread count
   * is counted, the archive row appears only when there is an archive.
   */
  has('timestamps come from real messages', /lastMessage\?\.ts/.test(chats))
  has('unread is counted, not invented', /unreadFromLingua/.test(chats))
  has('the archive row is conditional', /archiveCount > 0 &&/.test(chats))
  /*
   * CHATTO IS NOT A TUTOR. Its row may lead to what it is talking about, never to a
   * free conversation with Chatto.
   */
  has('Chatto\'s row does not open a chat with Chatto', !/onOpenThread\('chatto'\)/.test(chats))
}

/* ---- 14) the desktop conversation: chat list instead of navigation ---- */
{
  const app = read('src/App.jsx')
  has('a conversation swaps the left column', /const inConversation = view === 'practice'/.test(app))
  has('the chat list becomes that column', /inConversation \? \(/.test(app) && /<ChatsView compact/.test(app))
  has('there is a way back to Home from it', /backToToday/.test(app))
  /* and never both at once */
  const desktopBlock = app.slice(app.indexOf('{isDesktop && ('), app.indexOf('{/* Mobile'))
  has('the sidebar and the list are alternatives, not a stack',
    /inConversation \? \([\s\S]*?\) : \([\s\S]*?<DesktopSidebar/.test(desktopBlock))
}

/* ---- 15) the context panel is per route, and pricing has none ---- */
{
  const panel = read('src/components/layout/ContextPanel.jsx')
  has('panels are declared per route', /export const CONTEXT_PANELS/.test(panel))
  has('there is a resolver', /export function contextPanelFor/.test(panel))
  /*
   * SUPERSEDES nothing — this is new, and it is the invariant the screenshots
   * asked for: the notes panel used to be global, including on the plans page.
   */
  has('Home has Lingua\'s context', /today: 'home'/.test(panel))
  has('a conversation has the episode\'s context', /practice: 'conversation'/.test(panel))
  has('words has the path', /'memory-garden': 'path'/.test(panel))
  has('pricing has NO context panel', /pricing: null/.test(panel))
  has('the profile has none either', /identity: null/.test(panel))
  has('and neither does a call', /call: null/.test(panel) && /video: null/.test(panel))
  /* the tutor notes are one panel among several, not the panel */
  has('the notes are only part of the conversation panel',
    /kind === 'conversation'/.test(panel) && /<TutorNotes \/>/.test(panel))
}

/* ---- 16) call and video: visible, real surfaces, honest about the media ---- */
{
  const room = read('src/components/layout/ConversationRoom.jsx')
  has('the call button is in the thread header', /aria-label=\{t\('voiceCall'\)\}/.test(room))
  has('the video button is too', /aria-label=\{t\('videoCall'\)\}/.test(room))
  has('they open real surfaces', /navigateTo\('call'\)/.test(room) && /navigateTo\('video'\)/.test(room))

  const call = read('src/components/call/CallSurface.jsx')
  has('the surface exists for both modes', /mode = 'voice'/.test(call) && /const isVideo = mode === 'video'/.test(call))
  has('it has a subtitle area, as the frame does', /liveSubtitles/.test(call))
  has('and a placeholder rather than a fake feed', /videoPlaceholder/.test(call))
  has('the way out is always drawn', (call.match(/backToChat/g) || []).length >= 2)
  /*
   * HONESTY. Every control that would need media is disabled AND says so in its
   * accessible name, and the surface states plainly that calling is not available.
   */
  has('controls are disabled', /disabled\s*\n\s*aria-disabled="true"/.test(call))
  has('the upcoming state is announced, not only shown', /aria-label=\{`\$\{label\} — \$\{t\('upcoming'\)\}`\}/.test(call))
  has('the surface says the feature is not ready', /callUpcomingBody/.test(call) && /videoUpcomingBody/.test(call))
  /* and no media API was smuggled in anywhere */
  const media = ALL.filter(f => /getUserMedia|RTCPeerConnection|SpeechRecognition|speechSynthesis|MediaRecorder/.test(f.text))
  assert.deepEqual(media.map(f => f.path), [], 'a media API appeared in a UI-only sprint')
  n++
}

/* ---- 17) chat appearance: real, persisted, and pedagogically inert ---- */
{
  const store = read('src/services/chatAppearance.js')
  const sheet = read('src/components/chat/ChatAppearanceSheet.jsx')
  has('appearance has its own store', /lc2-chat-appearance-v1/.test(store))
  has('it is sanitised on the way in and out', /export function sanitizeChatAppearance/.test(store))
  /* the design's four controls */
  has('backgrounds are the design\'s', /CHAT_BACKGROUNDS = \['paper', 'dots', 'chatto'\]/.test(store))
  has('bubble colours are the identity\'s', /CHAT_BUBBLES = \['terracotta', 'sage', 'ink'\]/.test(store))
  has('there are three text sizes', /CHAT_TEXT_SIZES = \['normal', 'large', 'huge'\]/.test(store))
  has('there is no arbitrary colour picker', !/type="color"/.test(sheet))
  /* it reaches the conversation through one pair of custom properties */
  has('the bubble reads the chosen colour', /background: var\(--chat-bubble, var\(--accent\)\)/.test(css))
  has('the text size reaches the bubbles', /font-size: var\(--chat-font-size/.test(css))
  /* the wallpaper stays under the design's ink ceiling and is never mirrored */
  has('the Chatto wallpaper is barely there', store.includes("'--chat-wallpaper-ink'] = '0.06'")
    || /chat-wallpaper-ink.{0,20}0\.06/.test(store))
  has('and never mirrored in RTL', /\[dir="rtl"\] \.chat-canvas::before/.test(css))
  /* the sheet is a real dialog with real radio groups */
  has('the sheet is a dialog', /role="dialog"/.test(sheet) && /aria-modal="true"/.test(sheet))
  has('the controls are radio groups', /role="radiogroup"/.test(sheet) && /role="radio"/.test(sheet))
  has('the switches are switches', /role="switch"/.test(sheet))
  has('it previews before saving', /previewStyle/.test(sheet))
  has('it opens from Lingua\'s name', /aria-haspopup="dialog"/.test(read('src/components/layout/ConversationRoom.jsx')))
  /*
   * AND IT IS NOT PEDAGOGY. Appearance must not be able to touch the learner
   * model, the captured facts or the interests.
   */
  /*
   * Comments are stripped first: both files EXPLAIN that they must not touch the
   * learner model, the facts or the interests, and the point is that the CODE does
   * not — not that the words never appear.
   */
  const strip = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  const appearanceCode = strip(store) + strip(sheet)
  for (const forbidden of ['learnerModel', 'learnerFacts', 'interests', 'MODEL_VERSION', 'recordItem', 'canDo']) {
    has(`appearance does not touch ${forbidden}`, !appearanceCode.includes(forbidden))
  }
}

console.log(`check-visual-identity — OK  (${n} identity invariants verified)`)
