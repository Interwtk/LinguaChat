#!/usr/bin/env node
/*
 * check-public-key — the browser accepts either public Supabase key form and
 * refuses a secret one, whatever variable it was put in. No network.
 */
import assert from 'node:assert/strict'
import { readPublicAuthConfig } from './client.js'

let passed = 0
const check = (name, run) => { run(); passed++; console.log('  ok  ' + name) }
const jwt = (role) => `h.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.s`
const config = (key) => readPublicAuthConfig({ VITE_SUPABASE_URL: 'https://auth.example.test', VITE_SUPABASE_ANON_KEY: key })

check('a legacy anon key is accepted', () => assert.equal(config(jwt('anon')).anonKey, jwt('anon')))
check('a publishable key is accepted in the same variable', () => assert.equal(config('sb_publishable_example').anonKey, 'sb_publishable_example'))
check('a secret key is refused', () => assert.throws(() => config('sb_secret_example'), /secret key/))
check('a service role JWT is refused', () => assert.throws(() => config(jwt(['service', 'role'].join('_'))), /secret key/))
check('an authenticated user token is not a project key', () => assert.throws(() => config(jwt('authenticated')), /secret key/))
console.log(`check-public-key: ${passed} passed, 0 failed`)
