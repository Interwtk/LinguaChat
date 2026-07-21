/*
 * check-visual-structure — structural guardrails for the episode UI that would
 * otherwise silently regress. Reads source (not a running browser); the live
 * responsive/RTL audit is done separately in the browser. Exits 1 on failure.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const read = (p) => readFileSync(resolve(here, '..', p), 'utf8')
const shell = read('src/components/episode/EpisodeShell.jsx')

let n = 0
const has = (label, cond) => { assert.ok(cond, label); n++ }

// English target must be marked LTR even inside an RTL interface.
has('English target uses lang="en" dir="ltr"', /lang="en"\s+dir="ltr"/.test(shell))
// Screen-reader announcements exist for feedback.
has('has an aria-live region', /aria-live=/.test(shell))
// Remote evaluation exposes a busy state.
has('reviewing state uses aria-busy', /aria-busy=\{reviewing\}/.test(shell))
// Input and send are disabled while Lingua reviews (no double submit via UI).
has('input disabled while reviewing', /disabled=\{reviewing\}/.test(shell))
has('send disabled while reviewing', /disabled=\{!reply\.trim\(\)\s*\|\|\s*reviewing\}/.test(shell))
// Double-submit + late-response guard is wired.
has('uses the submission guard', /guardRef\.current\.begin\(\)/.test(shell))
has('ignores stale/late responses', /guardRef\.current\.isCurrent\(token\)/.test(shell))
has('invalidates guard on advance', /guardRef\.current\.invalidate\(\)/.test(shell))
// In-flight remote request is abortable and cancelled on unmount.
has('creates an AbortController', /new AbortController\(\)/.test(shell))
has('aborts on unmount', /useEffect\(\(\) =>\s*\(\)\s*=>\s*\{[\s\S]*abortRef\.current\?\.abort\(\)/.test(shell))
// The reviewing status is Lingua, never Chatto (Lingua evaluates).
const reviewingBlock = shell.slice(shell.indexOf('{reviewing && ('), shell.indexOf('{reviewing && (') + 400)
has('reviewing status shows Lingua, not Chatto', /LinguaAvatar/.test(reviewingBlock) && !/ChattoMascot/.test(reviewingBlock))
// Focus returns to the input on retry (keyboard / screen-reader friendly).
has('returns focus to the input on retry', /replyInputRef\.current\?\.focus\(\)/.test(shell))
// Single-step render (no duplicate interactive episode instances by design).
has('renders a single active step', /const step = ep\.steps\[stepIndex\]/.test(shell))
// Free-reply input carries an accessible label.
has('reply input has aria-label', /ref=\{replyInputRef\}[\s\S]{0,600}aria-label=/.test(shell))

/*
 * Exactly one layout shell may be MOUNTED. Rendering both and hiding one with
 * CSS keeps a second, stale copy of every stateful view alive; crossing the lg
 * breakpoint then swaps that stale copy in and it persists its outdated step
 * index over real progress (reproduced: progress 3 -> shown 0 -> saved 1).
 */
const app = read('src/App.jsx')
has('shells are conditionally mounted, not CSS-hidden', /\{isDesktop && \(/.test(app) && /\{!isDesktop && \(/.test(app))
has('uses the viewport hook', /useIsDesktop\(\)/.test(app))
// Mounting must be the SOLE authority: a leftover `hidden lg:*` on a shell would
// be a second source of truth and could blank the screen if the two disagreed.
has('no conflicting hidden/lg CSS on the mounted shells', !/className="hidden lg:flex"/.test(app) && !/className="lg:hidden flex flex-col"/.test(app))

const viewport = read('src/services/viewport.js')
has('viewport query matches Tailwind lg', /min-width:\s*1024px/.test(viewport))
// A missed `change` event must not strand the wrong shell — resize is also watched.
has('viewport also listens to resize', /addEventListener\('resize'/.test(viewport))
has('viewport re-reads the query on sync', /window\.matchMedia\(query\)\.matches/.test(viewport))

/*
 * Home must READ the session plan, never write it during render. Calling a
 * persisting planner in the render body is a setState-in-render (React warns,
 * and Home and the provider can disagree about today's plan).
 */
const today = read('src/components/today/TodayView.jsx')
has('Home previews the session without persisting', /previewSession\(\)/.test(today))
has('Home does not plan-and-save during render', !/planDailySession\(\)/.test(today))

// The duration picker is a real radiogroup, usable by keyboard and screen reader.
const picker = read('src/components/session/DurationPicker.jsx')
has('duration picker uses radiogroup semantics', /role="radiogroup"/.test(picker) && /role="radio"/.test(picker))
has('duration picker exposes aria-checked', /aria-checked=\{selected\}/.test(picker))
has('duration picker supports arrow keys', /ArrowRight|ArrowDown/.test(picker))
has('duration picker has comfortable tap targets', /minHeight:\s*\d\d/.test(picker))

// The session runner must reuse EpisodeShell — never a second episode engine.
const runner = read('src/components/session/SessionRunner.jsx')
has('session reuses EpisodeShell', /<EpisodeShell episodeId=/.test(runner))
has('session reuses the hybrid evaluator', /evaluateEpisodeResponse/.test(runner))
has('session practice guards double submit', /guardRef\.current\.begin\(\)/.test(runner))

// Global reduced-motion + focus-visible foundations live in the stylesheet.
const css = read('src/index.css')
has('honors prefers-reduced-motion', /prefers-reduced-motion/.test(css))
has('has focus-visible styling', /focus-visible/.test(css))

console.log(`check-visual-structure — OK  (${n} structural invariants verified)`)
