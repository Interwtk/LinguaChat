/*
 * Which task may an agent start right now?
 *
 * The queue lives in .ai/TASKS.md as prose, because humans have to read it too.
 * This is the one parser for it, shared by the workflow that decides whether a run
 * is worth starting and by the orchestrator that chains one task to the next — two
 * copies of these rules would drift apart within a week.
 *
 * A task is claimable when ALL of this holds:
 *   · it sits under TODO (not IN_PROGRESS, not BLOCKED, not DONE);
 *   · its owner is literally `unclaimed`;
 *   · every id in its `blocked-on:` line is already under DONE.
 *
 * Output: the id on stdout, or nothing at all. Exit 0 either way — "no work" is a
 * normal answer, not a failure, and a scheduled run that finds nothing must cost
 * nothing and go green.
 *
 *   node .github/scripts/next-task.mjs            → the next claimable id
 *   node .github/scripts/next-task.mjs --json     → { id, title, blockedOn, reason }
 *   node .github/scripts/next-task.mjs --explain  → every task and why it is not next
 */
import { readFileSync } from 'node:fs'

/* The queue's location, overridable so the rules can be tested against fixtures. */
const TASKS = process.env.TASKS_PATH || new URL('../../.ai/TASKS.md', import.meta.url)

const SECTION = /^##\s+(IN_PROGRESS|TODO|BLOCKED|DONE)\b/
const TASK = /^-\s+\[([A-Z]+-[A-Z0-9]+-[0-9a-z]+)\]\s*(.*)$/

export function parseQueue(markdown) {
  const tasks = []
  let section = null
  let current = null
  for (const raw of markdown.split('\n')) {
    const line = raw.replace(/\r$/, '')
    const heading = line.match(SECTION)
    if (heading) { section = heading[1]; current = null; continue }
    if (!section) continue

    const task = line.match(TASK)
    if (task) {
      current = { id: task[1], title: task[2].trim(), section, owner: null, blockedOn: [] }
      tasks.push(current)
      continue
    }
    if (!current) continue

    const owner = line.match(/^\s+owner:\s*(.+?)\s*$/)
    if (owner) { current.owner = owner[1]; continue }
    const blocked = line.match(/^\s+blocked-on:\s*(.+?)\s*$/)
    if (blocked) {
      current.blockedOn = blocked[1].split(',').map(s => s.trim()).filter(s => /^[A-Z]+-[A-Z0-9]+-[0-9a-z]+$/.test(s))
    }
  }
  return tasks
}

export function selectNext(tasks) {
  const done = new Set(tasks.filter(t => t.section === 'DONE').map(t => t.id))
  /*
   * ONE AGENT AT A TIME, and the queue itself is the lock: anything already in
   * IN_PROGRESS means somebody is working, so nothing new may start. This is what
   * stops a chain from fanning out into parallel agents.
   */
  const busy = tasks.filter(t => t.section === 'IN_PROGRESS')
  if (busy.length) return { id: null, reason: `busy: ${busy.map(t => t.id).join(', ')} is IN_PROGRESS` }

  for (const task of tasks) {
    if (task.section !== 'TODO') continue
    if (task.owner !== 'unclaimed') continue
    const waiting = task.blockedOn.filter(dep => !done.has(dep))
    if (waiting.length) continue
    return { id: task.id, title: task.title, blockedOn: task.blockedOn, reason: 'claimable' }
  }
  return { id: null, reason: 'no unclaimed TODO task has all of its dependencies DONE' }
}

const markdown = readFileSync(TASKS, 'utf8')
const tasks = parseQueue(markdown)
const picked = selectNext(tasks)

if (process.argv.includes('--explain')) {
  const done = new Set(tasks.filter(t => t.section === 'DONE').map(t => t.id))
  for (const t of tasks) {
    const waiting = t.blockedOn.filter(d => !done.has(d))
    const why = t.section !== 'TODO' ? t.section
      : t.owner !== 'unclaimed' ? `claimed by ${t.owner}`
        : waiting.length ? `waiting on ${waiting.join(', ')}`
          : 'CLAIMABLE'
    console.error(`${t.id.padEnd(16)} ${why}`)
  }
  console.error(`\n-> ${picked.id || '(nothing)'} — ${picked.reason}`)
}

if (process.argv.includes('--json')) console.log(JSON.stringify(picked))
else if (picked.id) console.log(picked.id)
