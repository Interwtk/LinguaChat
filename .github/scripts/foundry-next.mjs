#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'

const MANIFEST = new URL('../../.ai/foundry/tasks.json', import.meta.url)
const COMPLETED_DIR = new URL('../../.ai/foundry/completed/', import.meta.url)

export function loadManifest() {
  const parsed = JSON.parse(readFileSync(MANIFEST, 'utf8'))
  if (!Array.isArray(parsed.tasks)) throw new Error('foundry manifest has no tasks array')
  const ids = new Set()
  const branches = new Set()
  for (const task of parsed.tasks) {
    if (!task.id || !task.lane || !task.branch || !Array.isArray(task.dependsOn) || !Array.isArray(task.writeScopes)) {
      throw new Error(`invalid foundry task: ${JSON.stringify(task)}`)
    }
    if (ids.has(task.id)) throw new Error(`duplicate foundry task id: ${task.id}`)
    if (branches.has(task.branch)) throw new Error(`duplicate foundry branch: ${task.branch}`)
    ids.add(task.id); branches.add(task.branch)
  }
  for (const task of parsed.tasks) {
    for (const dep of task.dependsOn) if (!ids.has(dep)) throw new Error(`${task.id} depends on unknown ${dep}`)
  }
  return parsed
}

export function markerPath(id) {
  return new URL(`${id}.json`, COMPLETED_DIR)
}

export function completedSet(tasks) {
  return new Set(tasks.filter(t => existsSync(markerPath(t.id))).map(t => t.id))
}

export function readyTasks(tasks, done = completedSet(tasks)) {
  const pickedLanes = new Set()
  const ready = []
  for (const task of tasks) {
    if (done.has(task.id)) continue
    if (pickedLanes.has(task.lane)) continue
    if (task.dependsOn.some(dep => !done.has(dep))) continue
    ready.push(task)
    pickedLanes.add(task.lane)
  }
  return ready
}

const manifest = loadManifest()
const tasks = manifest.tasks
const done = completedSet(tasks)
const arg = (name) => {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : null
}
const taskId = arg('--task')
const branch = arg('--branch')

if (taskId) {
  const task = tasks.find(t => t.id === taskId)
  if (!task) process.exitCode = 2
  else {
    const waiting = task.dependsOn.filter(dep => !done.has(dep))
    console.log(JSON.stringify({ ...task, completed: done.has(task.id), waitingOn: waiting, ready: !done.has(task.id) && waiting.length === 0 }))
  }
} else if (branch) {
  const task = tasks.find(t => t.branch === branch)
  if (!task) process.exitCode = 2
  else console.log(JSON.stringify(task))
} else if (process.argv.includes('--all')) {
  console.log(JSON.stringify(readyTasks(tasks, done)))
} else if (process.argv.includes('--explain')) {
  for (const task of tasks) {
    const waiting = task.dependsOn.filter(dep => !done.has(dep))
    const status = done.has(task.id) ? 'DONE' : waiting.length ? `WAIT ${waiting.join(',')}` : 'READY'
    console.error(`${task.id.padEnd(14)} ${task.lane.padEnd(14)} ${status}`)
  }
  console.log(JSON.stringify(readyTasks(tasks, done)))
} else {
  const ready = readyTasks(tasks, done)
  if (ready[0]) console.log(ready[0].id)
}
