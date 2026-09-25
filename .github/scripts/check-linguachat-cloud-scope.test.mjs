#!/usr/bin/env node
import assert from 'node:assert/strict'
import { isTrackedRelevant, validateEntry, validateRepository } from './check-linguachat-cloud-scope.mjs'

const auth = 'linguachat-frontend/src/auth/client.js'
const cloud = 'linguachat-frontend/src/cloud/preferences.js'
const allowedAuth = "import { createClient } from '@supabase/supabase-js'; createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)"
const allowedPreferences = 'const url = import.meta.env.VITE_SUPABASE_URL; const key = import.meta.env.VITE_SUPABASE_ANON_KEY'

assert.deepEqual(validateEntry(auth, allowedAuth), [])
assert.deepEqual(validateEntry(cloud, allowedPreferences), [])
assert.deepEqual(validateEntry('linguachat-frontend/package.json', JSON.stringify({
  dependencies: { react: '^18.3.1', '@supabase/supabase-js': '^2.0.0' },
})), [])
assert.deepEqual(validateEntry('linguachat-frontend/package-lock.json', '{"node_modules/@supabase/storage-js":{}}'), [])

const forbidden = [
  ['linguachat-frontend/src/App.jsx', allowedAuth, 'outside authorized'],
  ['linguachat-frontend/scripts/sync.mjs', allowedAuth, 'outside authorized'],
  ['linguachat-frontend/public/cloud.js', allowedAuth, 'outside authorized'],
  ['linguachat-frontend/cloud.js', allowedAuth, 'outside authorized'],
  [auth, 'const key = process.env.SUPABASE_SERVICE_ROLE_KEY', 'private/server'],
  [auth, 'const key = import.meta.env.VITE_SUPABASE_SECRET_KEY', 'private/server'],
  [auth, 'const key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY', 'private/server'],
  [auth, "const project = 'EvoLabs'", 'EvoLabs'],
  [auth, "const project = 'sg-evolabs-auth-testing'", 'EvoLabs'],
  ['linguachat-backend/auth.py', 'SUPABASE_URL = value', 'backend Supabase'],
  [cloud, 'const db = "postgresql://user:pass@example/db"', 'direct database URL'],
  [cloud, 'const db = "postgres://user:pass@example/db"', 'direct database URL'],
  [auth, "import { createClient } from '@supabase/supabase-js'; const data = client.storage.from('avatars')", 'Storage/Edge Functions'],
  [cloud, "import { createClient } from '@supabase/supabase-js'; client.functions.invoke('privileged')", 'Storage/Edge Functions'],
  [cloud, 'const extension = "pgvector"', 'Storage/Edge Functions'],
  [auth, "import { FunctionsClient } from '@supabase/functions-js'", 'Storage/Edge Functions'],
  ['supabase/config.toml', '', 'repository-level'],
  ['supabase/migrations/001_init.sql', 'create table profiles(id uuid);', 'repository-level'],
  ['supabase/functions/ping/index.ts', 'export default () => 1', 'repository-level'],
  ['.env.supabase', '', 'repository-level'],
  [auth, "createClient('https://other.supabase.co', 'anon')", 'createClient must use'],
  [auth, "createClient('https://other.supabase.co', 'anon')", 'hard-coded'],
  [auth, "createClient(import.meta.env.VITE_SUPABASE_URL, 'hard-coded-key')", 'createClient must use'],
  [auth, allowedAuth + "; createClient('https://other.supabase.co', 'anon')", 'createClient must use'],
  [auth, 'const key = import.meta.env.VITE_SUPABASE_PUBLIC_KEY', 'not an allowed'],
  [auth, "import { initializeApp } from 'firebase/app'", 'unapproved Firebase/Amplify'],
  [cloud, "import Amplify from 'aws-amplify'", 'unapproved Firebase/Amplify'],
  ['linguachat-frontend/package.json', JSON.stringify({ dependencies: { firebase: '^1.0.0' } }), 'unapproved cloud dependency'],
  ['linguachat-frontend/package.json', JSON.stringify({ dependencies: { 'aws-amplify': '^1.0.0' } }), 'unapproved cloud dependency'],
  ['linguachat-frontend/package.json', JSON.stringify({ dependencies: { '@supabase/storage-js': '^2.0.0' } }), 'unapproved cloud dependency'],
]

for (const [path, source, expected] of forbidden) {
  const problems = validateEntry(path, source)
  assert.ok(problems.some(x => x.includes(expected)), path + ' should be rejected for ' + expected + '\n' + problems.join('\n'))
}
for (const path of ['supabase/config.toml', 'supabase/migrations/001_init.sql', 'supabase/functions/ping/index.ts', 'linguachat-frontend/scripts/sync.mjs', 'linguachat-frontend/public/cloud.js']) {
  assert.ok(isTrackedRelevant(path), path + ' must be scanned by repository guard')
}
const repoProblems = validateRepository([
  { path: auth, text: allowedAuth },
  { path: cloud, text: allowedPreferences },
  { path: 'linguachat-backend/auth.py', text: 'SUPABASE_SERVICE_ROLE_KEY = value' },
  { path: 'supabase/config.toml', text: '' },
])
assert.ok(repoProblems.some(x => x.includes('private/server')))
assert.ok(repoProblems.some(x => x.includes('backend Supabase')))
assert.ok(repoProblems.some(x => x.includes('repository-level')))

console.log('check-linguachat-cloud-scope tests — ' + forbidden.length + ' negative cases and allowed client/package cases passed')
