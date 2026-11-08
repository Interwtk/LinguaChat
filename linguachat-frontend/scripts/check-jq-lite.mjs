#!/usr/bin/env node
/*
 * check-jq-lite — the local jq subset gives jq's answers for every filter our
 * GitHub scripts use, and refuses what it does not implement.
 */
import assert from 'node:assert/strict'
import { jqLite as jq } from './tools/jq-lite.mjs'

let passed = 0
const eq = (filter, input, want, vars) => { assert.deepEqual(jq(filter, input, vars), want, filter); passed++ }
eq('length', [1, 2], [2])
eq('.[0].number // empty', [{ number: 7 }], [7])
eq('.[0].number // empty', [], [])
eq('.head.sha // ""', {}, [''])
eq('.draft', { draft: false }, [false])
eq('.files[].path', { files: [{ path: 'a' }, { path: 'b' }] }, ['a', 'b'])
eq('.comments[].body', { comments: [] }, [])
eq('[.[] | select(.status == "in_progress" or .status == "queued")] | length', [{ status: 'queued' }, { status: 'done' }], [1])
eq('[.[] | select(.isDraft == true)][0].number // empty', [{ isDraft: false, number: 1 }, { isDraft: true, number: 2 }], [2])
eq('.[] | select(.headRefName | startswith("foundry/")) | [.number,.headRefName,.isDraft] | @tsv', [{ number: 3, headRefName: 'foundry/x', isDraft: true }, { number: 4, headRefName: 'y', isDraft: false }], ['3\tfoundry/x\ttrue'])
eq('[.[] | select(.type == "result")] | .[0] // "no result record in execution log"', [], ['no result record in execution log'])
eq('[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)] | length', { data: { repository: { pullRequest: { reviewThreads: { nodes: [{ isResolved: false }, { isResolved: true }] } } } } }, [1])
eq('(.number == $n) and (((.state // "") | ascii_downcase) == "open") and (.isDraft == false)', { number: 5, state: 'OPEN', isDraft: false }, [true], { n: 5 })
eq('(.number == $n) and (.isDraft == false)', { number: 5, isDraft: true }, [false], { n: 5 })
eq('.a // "x"', { a: false }, ['x'])
assert.throws(() => jq('map(.a)', []), /unsupported/); passed++
assert.throws(() => jq('.a | test("x")', {}), /unsupported/); passed++
console.log(`check-jq-lite: ${passed} passed, 0 failed`)
