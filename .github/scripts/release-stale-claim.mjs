/*
 * Release a claim whose agent is gone.
 *
 * A run can die holding its claim — max turns, a cancelled job, a runner fault.
 * The queue then says "somebody is working" for ever and the chain politely
 * refuses to start anything, so autonomy would last exactly until the first crash.
 *
 * The caller decides whether the claim is stale (no agent running, no open pull
 * request for its branch); this performs the edit and prints what it did.
 * It also self-heals the specific coordination corruption where the ## TODO
 * heading was accidentally removed and queued tasks leaked into IN_PROGRESS.
 * Exit 0 and print nothing when there is nothing to release.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const path = process.env.TASKS_PATH || '.ai/TASKS.md'
const text = readFileSync(path, 'utf8')

const start = text.indexOf('## IN_PROGRESS')
if (start === -1) process.exit(0)

const todoAt = text.indexOf('## TODO', start)
const blockedAt = text.indexOf('## BLOCKED', start)
const doneAt = text.indexOf('## DONE', start)
const sectionEnds = [todoAt, blockedAt, doneAt, text.length].filter(i => i > start)
const inProgressEnd = Math.min(...sectionEnds)
const block = text.slice(start, inProgressEnd)
const taskMatches = [...block.matchAll(/\n- \[/g)]
if (taskMatches.length === 0) process.exit(0) // nothing claimed

const firstTaskAt = taskMatches[0].index + 1
const secondTaskAt = taskMatches[1]?.index == null ? block.length : taskMatches[1].index + 1
const task = block.slice(firstTaskAt, secondTaskAt).trim()
const leakedQueued = taskMatches.length > 1 ? block.slice(secondTaskAt).trim() : ''
const id = (task.match(/^-\s+\[([^\]]+)\]/) || [])[1] || 'unknown'

/* The task keeps its id, its title and its history — only the lock is dropped. */
const released = task
  .replace(/^(\s+owner:\s*).*$/m, '$1unclaimed')
  .replace(/^(\s+branch:\s*).*$/m, '$1none')

let todoHeading = '## TODO — ordered; take the first unclaimed one you are allowed to do'
let existingTodo = ''
let suffixStart = inProgressEnd

if (todoAt !== -1 && todoAt === inProgressEnd) {
  const headingEndRaw = text.indexOf('\n', todoAt)
  const headingEnd = headingEndRaw === -1 ? text.length : headingEndRaw + 1
  todoHeading = text.slice(todoAt, headingEnd).trimEnd()

  const nextBlocked = text.indexOf('## BLOCKED', headingEnd)
  const nextDone = text.indexOf('## DONE', headingEnd)
  const todoEnds = [nextBlocked, nextDone, text.length].filter(i => i >= headingEnd)
  suffixStart = Math.min(...todoEnds)
  existingTodo = text.slice(headingEnd, suffixStart).trim()
}

const queuedParts = [released, leakedQueued, existingTodo].filter(Boolean)
const suffix = text.slice(suffixStart).replace(/^\s+/, '')
const rebuilt =
  text.slice(0, start) +
  '## IN_PROGRESS\n\n_(none — the queue is open)_\n\n' +
  todoHeading + '\n\n' +
  queuedParts.join('\n\n') + '\n\n' +
  suffix

writeFileSync(path, rebuilt)
console.log(id)
