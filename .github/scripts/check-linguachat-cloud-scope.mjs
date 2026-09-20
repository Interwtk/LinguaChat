#!/usr/bin/env node
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const AUTHORIZED_SOURCE_PREFIXES = [
  'linguachat-frontend/src/auth/',
  'linguachat-frontend/src/cloud/',
]
const PUBLIC_ENV = new Set(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'])
const PRIVATE_TOKEN = /service[_-]?role|SUPABASE_SERVICE|SUPABASE_SECRET|secret[_-]?key|postgres(?:ql)?:\/\//i
const EVOLABS = /evolabs|sg-evolabs-auth-testing/i
const SUPABASE_TOKEN = /@supabase\/|createClient\(|supabase|postgrest|pgvector|SUPABASE_/i

export function validateEntry(path, text) {
  const problems = []
  if (!SUPABASE_TOKEN.test(text)) return problems

  if (EVOLABS.test(text)) problems.push(`${path}: EvoLabs project/reference is forbidden`)
  if (PRIVATE_TOKEN.test(text)) problems.push(`${path}: private/server Supabase credential or direct database URL is forbidden`)

  for (const match of text.matchAll(/\b(?:VITE_)?SUPABASE_[A-Z0-9_]+\b/g)) {
    if (!PUBLIC_ENV.has(match[0])) problems.push(`${path}: ${match[0]} is not an allowed public LinguaChat client variable`)
  }

  const sourceLike = path.startsWith('linguachat-frontend/src/')
  if (sourceLike && !AUTHORIZED_SOURCE_PREFIXES.some(prefix => path.startsWith(prefix))) {
    problems.push(`${path}: Supabase client code is outside authorized LinguaChat auth/cloud routes`)
  }
  if (path.startsWith('linguachat-backend/')) {
    problems.push(`${path}: backend Supabase access is not authorized by this contract`)
  }
  return problems
}

export function validateRepository(entries) {
  return entries.flatMap(({ path, text }) => validateEntry(path, text))
}

function selfTest() {
  assert.deepEqual(validateEntry('linguachat-frontend/src/auth/client.js', "import { createClient } from '@supabase/supabase-js'; createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)"), [])
  assert.deepEqual(validateEntry('linguachat-frontend/src/cloud/preferences.js', 'const url = import.meta.env.VITE_SUPABASE_URL'), [])
  assert.ok(validateEntry('linguachat-frontend/src/App.jsx', "import { createClient } from '@supabase/supabase-js'").some(x => x.includes('outside authorized')))
  assert.ok(validateEntry('linguachat-frontend/src/auth/client.js', 'const key = process.env.SUPABASE_SERVICE_ROLE_KEY').some(x => x.includes('private/server')))
  assert.ok(validateEntry('linguachat-frontend/src/auth/client.js', "const project = 'Evolabs Platform'; const url = import.meta.env.VITE_SUPABASE_URL").some(x => x.includes('EvoLabs')))
  assert.ok(validateEntry('linguachat-backend/auth.py', 'SUPABASE_URL = x').some(x => x.includes('backend Supabase')))
  console.log('check-linguachat-cloud-scope self-test — positive/negative fixtures OK')
}

function trackedEntries() {
  const paths = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  const relevant = paths.filter(path => /^(linguachat-frontend|linguachat-backend)\//.test(path) && !/(^|\/)(node_modules|dist)\//.test(path))
  return relevant.map(path => ({ path, text: readFileSync(path, 'utf8') }))
}

if (process.argv.includes('--self-test')) selfTest()
else {
  const problems = validateRepository(trackedEntries())
  if (problems.length) {
    console.error('LinguaChat cloud/Auth scope guard failed:\n' + problems.map(x => `- ${x}`).join('\n'))
    process.exit(1)
  }
  console.log('check-linguachat-cloud-scope — authorized public LinguaChat client scope only')
}
