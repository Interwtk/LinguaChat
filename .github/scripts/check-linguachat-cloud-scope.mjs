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
const SUPABASE_TOKEN = /@supabase\/|createClient\s*\(|supabase|postgrest|pgvector|SUPABASE_/i
const CLIENT_RUNTIME = /@supabase\/|createClient\s*\(|(?:import\.meta\.env|process\.env)\.(?:VITE_)?SUPABASE_|\bpostgrest\b|\bpgvector\b/i
const FORBIDDEN_API = /(?:\.\s*(?:storage|functions|realtime)\b|\[\s*['\"](?:storage|functions|realtime)['\"]\s*\]|\bpgvector\b|@supabase\/(?:storage-js|functions-js|realtime-js)\b)/i
const OTHER_IMPORT = /(?:from\s*['"]|import\s*['"]|require\s*\(\s*['"])(?:@?firebase(?:\/|-)|firebase['"]|(?:aws-)?amplify(?:\/|['"]))/i
const APPROVED_CREATE_CLIENT = /\bcreateClient\s*\(\s*import\.meta\.env\.VITE_SUPABASE_URL\s*,\s*import\.meta\.env\.VITE_SUPABASE_ANON_KEY\s*(?:,|\))/m
const PROJECT_LITERAL = /https?:\/\/[^\s'"\x60]+\.supabase\.co\b/i
const SOURCE_EXT = /\.(?:[cm]?[jt]sx?|py|json|toml|sql|html|ya?ml|env|txt)$/i

function isRootCloudResource(path) {
  return path === 'supabase' || path.startsWith('supabase/') ||
    path === '.env.supabase' || path.startsWith('.env.supabase.')
}

function isForbiddenPackage(name) {
  return /firebase|amplify/i.test(name) ||
    (name.startsWith('@supabase/') && name !== '@supabase/supabase-js') ||
    name === 'supabase' || name === 'postgrest'
}

export function isTrackedRelevant(path) {
  if (isRootCloudResource(path)) return true
  if (!/^(linguachat-frontend|linguachat-backend)\//.test(path)) return false
  if (/(^|\/)(node_modules|dist)\//.test(path)) return false
  return SOURCE_EXT.test(path) || /(?:^|\/)package(?:-lock)?\.json$/.test(path)
}

export function validateEntry(path, text) {
  const problems = []
  if (isRootCloudResource(path)) {
    problems.push(path + ': repository-level Supabase resources are forbidden')
  }

  if (path.endsWith('/package.json')) {
    let pkg
    try { pkg = JSON.parse(text) }
    catch { return problems.concat(path + ': invalid package.json') }
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies }
    for (const name of Object.keys(deps)) {
      if (isForbiddenPackage(name)) {
        problems.push(path + ': unapproved cloud dependency ' + name)
      }
    }
  }

  // Lockfiles record transitives (including packages required by the approved SDK).
  // Direct dependency policy belongs to package.json, not package-lock.json.
  if (path.endsWith('/package-lock.json')) return problems

  // These bans must run even without a Supabase token. A bare direct-Postgres
  // URL or EvoLabs identifier was previously hidden behind an early return.
  if (EVOLABS.test(text)) problems.push(path + ': EvoLabs project/reference is forbidden')
  if (PRIVATE_TOKEN.test(text)) problems.push(path + ': private/server Supabase credential or direct database URL is forbidden')
  if (OTHER_IMPORT.test(text)) problems.push(path + ': unapproved Firebase/Amplify client is forbidden')
  if (path.endsWith('/package.json')) return problems

  const sourceLike = path.startsWith('linguachat-frontend/src/')
  const frontend = path.startsWith('linguachat-frontend/')
  const approved = AUTHORIZED_SOURCE_PREFIXES.some(prefix => path.startsWith(prefix))
  const cloudUse = SUPABASE_TOKEN.test(text) || FORBIDDEN_API.test(text)
  const executableCloudUse = CLIENT_RUNTIME.test(text)
  if (!cloudUse) return problems

  for (const match of text.matchAll(/\b(?:VITE_)?SUPABASE_[A-Z0-9_]+\b/g)) {
    if (!PUBLIC_ENV.has(match[0])) {
      problems.push(path + ': ' + match[0] + ' is not an allowed public LinguaChat client variable')
    }
  }

  if (frontend && !approved && (sourceLike || executableCloudUse)) {
    problems.push(path + ': Supabase client code is outside authorized LinguaChat auth/cloud routes')
  }
  if (path.startsWith('linguachat-backend/')) {
    problems.push(path + ': backend Supabase access is not authorized by this contract')
  }
  if (FORBIDDEN_API.test(text) && approved) {
    problems.push(path + ': Supabase Storage/Edge Functions/realtime/pgvector API is forbidden')
  }
  if (approved && PROJECT_LITERAL.test(text)) {
    problems.push(path + ': hard-coded Supabase project URL is forbidden')
  }
  const calls = [...text.matchAll(/\bcreateClient\s*\(/g)].length
  const approvedCalls = [...text.matchAll(new RegExp(APPROVED_CREATE_CLIENT.source, 'gm'))].length
  if (approved && calls !== approvedCalls) {
    problems.push(path + ': createClient must use public VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY directly')
  }
  return problems
}

export function validateRepository(entries) {
  return entries.flatMap(({ path, text }) => validateEntry(path, text))
}

function selfTest() {
  const allowed = "import { createClient } from '@supabase/supabase-js'; createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)"
  assert.deepEqual(validateEntry('linguachat-frontend/src/auth/client.js', allowed), [])
  assert.deepEqual(validateEntry('linguachat-frontend/src/cloud/preferences.js', 'const url = import.meta.env.VITE_SUPABASE_URL'), [])
  assert.ok(validateEntry('linguachat-frontend/src/App.jsx', allowed).some(x => x.includes('outside authorized')))
  assert.ok(validateEntry('linguachat-frontend/src/auth/client.js', 'const key = process.env.SUPABASE_SERVICE_ROLE_KEY').some(x => x.includes('private/server')))
  assert.ok(validateEntry('linguachat-frontend/src/auth/client.js', "const project = 'Evolabs Platform'").some(x => x.includes('EvoLabs')))
  assert.ok(validateEntry('linguachat-backend/auth.py', 'SUPABASE_URL = x').some(x => x.includes('backend Supabase')))
  assert.ok(validateEntry('linguachat-frontend/src/cloud/preferences.js', 'const db = "postgresql://u:p@h/db"').some(x => x.includes('direct database URL')))
  assert.ok(isTrackedRelevant('supabase/config.toml'))
  console.log('check-linguachat-cloud-scope self-test — positive/negative fixtures OK')
}

function trackedEntries() {
  const paths = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  return paths.filter(isTrackedRelevant).map(path => ({
    path, text: isRootCloudResource(path) ? '' : readFileSync(path, 'utf8'),
  }))
}

if (process.argv.includes('--self-test')) selfTest()
else {
  const problems = validateRepository(trackedEntries())
  if (problems.length) {
    console.error('LinguaChat cloud/Auth scope guard failed:\n' + problems.map(x => '- ' + x).join('\n'))
    process.exit(1)
  }
  console.log('check-linguachat-cloud-scope — authorized public LinguaChat client scope only')
}
