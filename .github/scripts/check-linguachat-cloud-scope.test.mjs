#!/usr/bin/env node
import assert from 'node:assert/strict'
import { validateEntry, validateRepository } from './check-linguachat-cloud-scope.mjs'

const allowedAuth = "import { createClient } from '@supabase/supabase-js'; createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)"
const allowedPreferences = 'const url = import.meta.env.VITE_SUPABASE_URL; const key = import.meta.env.VITE_SUPABASE_ANON_KEY'

assert.deepEqual(validateEntry('linguachat-frontend/src/auth/client.js', allowedAuth), [])
assert.deepEqual(validateEntry('linguachat-frontend/src/cloud/preferences.js', allowedPreferences), [])

const forbidden = [
  ['linguachat-frontend/src/App.jsx', allowedAuth, 'outside authorized LinguaChat auth/cloud routes'],
  ['linguachat-frontend/src/auth/client.js', 'const key = process.env.SUPABASE_SERVICE_ROLE_KEY', 'private/server Supabase credential'],
  ['linguachat-frontend/src/auth/client.js', 'const key = import.meta.env.VITE_SUPABASE_SECRET_KEY', 'private/server Supabase credential'],
  ['linguachat-frontend/src/auth/client.js', 'const key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY', 'private/server Supabase credential'],
  ['linguachat-frontend/src/auth/client.js', "const project = 'EvoLabs'; const url = import.meta.env.VITE_SUPABASE_URL", 'EvoLabs project/reference is forbidden'],
  ['linguachat-frontend/src/auth/client.js', "const project = 'sg-evolabs-auth-testing'; const url = import.meta.env.VITE_SUPABASE_URL", 'EvoLabs project/reference is forbidden'],
  ['linguachat-backend/auth.py', 'SUPABASE_URL = value', 'backend Supabase access is not authorized'],
  ['linguachat-frontend/src/cloud/preferences.js', 'const db = "postgresql://user:pass@example/db"', 'private/server Supabase credential'],
]

for (const [path, text, expected] of forbidden) {
  const problems = validateEntry(path, text)
  assert.ok(problems.some(problem => problem.includes(expected)), `${path} should be rejected for: ${expected}\n${problems.join('\n')}`)
}

const repoProblems = validateRepository([
  { path: 'linguachat-frontend/src/auth/client.js', text: allowedAuth },
  { path: 'linguachat-frontend/src/cloud/preferences.js', text: allowedPreferences },
  { path: 'linguachat-backend/auth.py', text: 'SUPABASE_SERVICE_ROLE_KEY = value' },
])
assert.ok(repoProblems.some(problem => problem.includes('private/server Supabase credential')))
assert.ok(repoProblems.some(problem => problem.includes('backend Supabase access is not authorized')))

console.log('check-linguachat-cloud-scope tests — authorized public client accepted; private/EvoLabs/backend/out-of-scope cases rejected')
