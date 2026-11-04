#!/usr/bin/env node
/*
 * secret-scan — credential-shaped strings in every tracked file.
 *
 * A broken scanner reports zero, and in phase 3 it did. So every run first
 * proves itself on planted samples and fails if it misses one, and it reports
 * its real coverage: files read, files skipped and why.
 *
 * Limits, printed on every run: zero hits means none of these PATTERNS matched
 * in the current tree. It says nothing about a secret with another shape, an
 * untracked file, or git history (a scan of history is `--history`).
 *
 * Exit: 0 clean · 1 hits · 2 the scanner itself failed.
 */
import { execFileSync, spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export const PATTERNS = [
  ['openai-style key', /\bsk-[A-Za-z0-9_-]{20,}/],
  ['two-part JWT', /\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}/],
  ['private key block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['service role assignment', /service_role\w*\s*[=:]\s*['"]?[A-Za-z0-9._-]{20,}/i],
  ['webhook secret', /\bwhsec_[A-Za-z0-9+/=]{20,}/],
  ['processor key', /\b(?:polar|pdl|paddle)_(?:live|sk|pat|oat)_[A-Za-z0-9]{16,}/i],
  ['github token', /\bgh[pousr]_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{30,}/],
  ['aws key id', /\bAKIA[0-9A-Z]{16}\b/],
  ['filled secret variable', /^\s*(?:LINGUACHAT_PASS_SIGNING_KEY|OPENAI_API_KEY|[A-Z_]*SECRET[A-Z_]*)\s*=\s*['"]?(?!sk-your)[A-Za-z0-9+/_-]{16,}/m],
]

const hit = (text) => PATTERNS.filter(([, re]) => re.test(text)).map(([name]) => name)

// assembled at run time so this file does not match itself
const planted = [
  ['sk', '-', 'a'.repeat(24)], ['eyJ', 'a'.repeat(16), '.eyJ', 'b'.repeat(16)], ['-----BEGIN RSA PRIVATE', ' KEY-----'],
  ['service_', 'role = ', 'x'.repeat(24)], ['whsec_', 'A'.repeat(24)], ['polar_', 'live_', 'a'.repeat(20)],
  ['ghp_', 'a'.repeat(36)], ['AKIA', 'ABCDEFGHIJKLMNOP'], ['OPENAI_API_', 'KEY=', 'a'.repeat(30)],
].map(parts => parts.join(''))

function selfTest() {
  const missed = planted.filter(sample => !hit(sample).length)
  const quiet = ['VITE_SUPABASE_ANON_KEY=', 'sk-short', 'service_role is not allowed here', 'OPENAI_API_KEY=<your key>'].filter(line => hit(line).length)
  return { ok: !missed.length && !quiet.length, planted: planted.length, missed: missed.length, falseAlarms: quiet.length }
}

async function main() {
  const proof = selfTest()
  if (!proof.ok) {
    console.error(`secret-scan: SCANNER FAILED its self-test (${JSON.stringify(proof)})`)
    return 2
  }
  const history = process.argv.includes('--history')
  let files, skipped = 0, binary = 0, read = 0
  const hits = []
  try {
    files = execFileSync('git', ['ls-files', '-z'], { cwd: repo, maxBuffer: 1 << 28 }).toString('utf8').split('\0').filter(Boolean)
  } catch (error) {
    console.error(`secret-scan: cannot list files: ${error.message}`)
    return 2
  }
  for (const file of files) {
    if (file === 'scripts/secret-scan.mjs') { skipped++; continue } // its own pattern list
    let data
    try { data = readFileSync(join(repo, file)) } catch { skipped++; continue } // deleted in the work tree
    if (data.includes(0)) { binary++; continue }
    read++
    const text = data.toString('utf8')
    for (const name of hit(text)) hits.push(`${file}: ${name}`)
  }
  let historyNote = 'history not scanned (use --history)'
  if (history) {
    const log = spawn('git', ['log', '--all', '-p', '--no-color', '--', '.', ':(exclude)scripts/secret-scan.mjs', ':(exclude)*package-lock.json'], { cwd: repo, stdio: ['ignore', 'pipe', 'ignore'] })
    const found = new Set()
    let lines = 0
    for await (const line of createInterface({ input: log.stdout })) {
      lines++
      if (line.startsWith('+')) for (const name of hit(line.slice(1))) found.add(name)
    }
    for (const name of found) hits.push(`git history: ${name}`)
    historyNote = `history scanned (${lines} diff lines, added lines only)`
  }
  for (const line of hits) console.log(`HIT ${line}`)
  console.log(`secret-scan: self-test ${proof.planted}/${proof.planted} planted samples found · tracked ${files.length} · read ${read} · binary skipped ${binary} · other skipped ${skipped} · ${historyNote} · patterns ${PATTERNS.length} · hits ${hits.length}`)
  console.log('secret-scan: zero hits means these patterns did not match; it does not prove there are no secrets')
  return hits.length ? 1 : 0
}

process.exitCode = await main()
