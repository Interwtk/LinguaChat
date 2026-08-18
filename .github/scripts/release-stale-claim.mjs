/*
 * Release a claim whose agent is gone.
 *
 * A run can die holding its claim — max turns, a cancelled job, a runner fault.
 * The queue then says "somebody is working" for ever and the chain politely
 * refuses to start anything, so autonomy would last exactly until the first crash.
 *
 * The caller decides whether the claim is stale (no agent running, no open pull
 * request for its branch); this only performs the edit, and prints what it did.
 * Exit 0 and print nothing when there is nothing to release.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const path = process.env.TASKS_PATH || '.ai/TASKS.md'
const text = readFileSync(path, 'utf8')

const start = text.indexOf('## IN_PROGRESS')
const todoAt = text.indexOf('## TODO')
if (start === -1 || todoAt === -1) process.exit(0)

const block = text.slice(start, todoAt)
const taskAt = block.indexOf('\n- [')
if (taskAt === -1) process.exit(0)          // nothing claimed

const task = block.slice(taskAt).trim()
const id = (task.match(/^-\s+\[([^\]]+)\]/) || [])[1] || 'unknown'

/* The task keeps its id, its title and its history — only the lock is dropped. */
const released = task
  .replace(/^(\s+owner:\s*).*$/m, '$1unclaimed')
  .replace(/^(\s+branch:\s*).*$/m, '$1none')

const afterTodoHeading = text.indexOf('\n', todoAt) + 1
const rebuilt =
  text.slice(0, start) +
  '## IN_PROGRESS\n\n_(none — the queue is open)_\n\n' +
  text.slice(todoAt, afterTodoHeading) +
  '\n' + released + '\n\n' +
  text.slice(afterTodoHeading)

writeFileSync(path, rebuilt)
console.log(id)
