#!/usr/bin/env node
import { execFileSync } from 'node:child_process'

export const CLEAN_CYCLE_JOB = 'qa-cycle — complete clean non-draft cycle'

function asJobs(entry) {
  if (!entry) return []
  if (Array.isArray(entry)) return entry
  if (Array.isArray(entry.jobs)) return entry.jobs
  return []
}

export function evaluateCycleHistory({ workflowRuns, jobsByRun, headSha, required = 2 }) {
  const runs = [...(workflowRuns || [])]
    .filter(run => run?.head_sha === headSha && run?.event === 'pull_request')
    .sort((a, b) => {
      const bt = Date.parse(b.run_started_at || b.created_at || 0) || 0
      const at = Date.parse(a.run_started_at || a.created_at || 0) || 0
      return bt - at || Number(b.id || 0) - Number(a.id || 0)
    })

  let clean = 0
  const considered = []

  for (const run of runs) {
    const jobs = asJobs(jobsByRun?.[String(run.id)] ?? jobsByRun?.[run.id])
    const sentinel = jobs.find(job => job?.name === CLEAN_CYCLE_JOB)

    // Runs created while a PR was Draft have this job skipped. They are deliberately
    // ignored: a Draft run is not evidence for the two-clean-cycle merge contract.
    // Runs created before this sentinel existed are also ignored and can never satisfy
    // the new gate retroactively.
    if (!sentinel || sentinel.conclusion === 'skipped') continue

    considered.push({
      runId: run.id,
      status: sentinel.status,
      conclusion: sentinel.conclusion,
    })

    // Consecutive means the newest eligible cycles must themselves be clean. A red,
    // cancelled or still-running eligible cycle breaks the streak immediately.
    if (sentinel.status !== 'completed') {
      return { ok: false, code: 'incomplete', clean, required, considered }
    }
    if (sentinel.conclusion !== 'success') {
      return { ok: false, code: 'not-clean', clean, required, considered }
    }

    clean += 1
    if (clean >= required) {
      return { ok: true, code: 'ready', clean, required, considered }
    }
  }

  return {
    ok: false,
    code: clean > 0 ? 'needs-more' : 'none',
    clean,
    required,
    considered,
  }
}

function argValue(name) {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : undefined
}

function ghJson(path) {
  return JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8' }))
}

async function main() {
  const repo = argValue('--repo') || process.env.GITHUB_REPOSITORY
  const headSha = argValue('--head')
  const required = Number(argValue('--required') || 2)

  if (!repo || !headSha || !Number.isInteger(required) || required < 1) {
    console.error('usage: check-two-clean-qa-cycles.mjs --repo owner/repo --head <sha> [--required 2]')
    process.exit(3)
  }

  const query = `/repos/${repo}/actions/workflows/qa.yml/runs?head_sha=${encodeURIComponent(headSha)}&event=pull_request&per_page=20`
  const runsPayload = ghJson(query)
  const workflowRuns = runsPayload.workflow_runs || []
  const jobsByRun = {}

  for (const run of workflowRuns) {
    jobsByRun[String(run.id)] = ghJson(`/repos/${repo}/actions/runs/${run.id}/jobs?per_page=100`)
  }

  const result = evaluateCycleHistory({ workflowRuns, jobsByRun, headSha, required })
  console.log(`clean QA cycles on ${headSha}: ${result.clean}/${required} (${result.code})`)

  if (result.ok) process.exit(0)
  if (result.code === 'needs-more') process.exit(2)
  process.exit(3)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error?.stack || String(error))
    process.exit(3)
  })
}
