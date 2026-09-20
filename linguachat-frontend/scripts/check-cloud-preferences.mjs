import assert from 'node:assert/strict'
import { toCloudPreferenceFields, fromCloudPreferenceFields } from '../src/services/cloudPreferenceMapping.js'

const original = {
  goal: 'work', correction_style: 'gentle', tone: 'calm', pace: 'slow_clear',
  explanation_depth: 'detailed', interests: ['music', 'music', 'travel', 'not_a_real_interest'],
  learner_style: 'adult',
}
const row = toCloudPreferenceFields(original, {
  user_language: 'ar', english_variant: 'uk', conversation_register: 'formal',
})
assert.equal(row.learning_goal, 'work')
assert.equal(row.user_language, 'ar')
assert.equal(row.target_language, 'en')
assert.equal(row.english_variant, 'uk')
assert.equal(row.conversation_register, 'formal')
assert.deepEqual(row.interests, ['music', 'travel'])
assert.equal(row.tone, 'calm')
assert.equal(row.correction_style, 'gentle')
assert.equal(row.pace, 'slow_clear')
assert.equal(row.explanation_depth, 'detailed')
assert.equal('learner_style' in row, false, 'age claims do not belong in self-editable preference payload')
assert.equal('billing_country' in row, false, 'client preferences must not set billing country')
assert.equal('user_id' in row, false, 'identity must come from a verified session')

const bad = toCloudPreferenceFields({ goal: 'prompt-injection', tone: '<script>', interests: ['unknown'] }, {
  user_language: '../../secret', english_variant: 'invalid', conversation_register: 'invalid',
})
assert.equal(bad.learning_goal, 'daily_conversation')
assert.equal(bad.tone, 'friendly')
assert.equal(bad.user_language, 'es')
assert.equal(bad.english_variant, 'adaptive')
assert.equal(bad.conversation_register, 'adaptive')
assert.deepEqual(bad.interests, [])

const local = { ...original, unrelated_local_setting: 'keep me' }
const restored = fromCloudPreferenceFields(row, local)
assert.equal(restored.goal, 'work')
assert.equal(restored.unrelated_local_setting, 'keep me')
assert.deepEqual(restored.interests, ['music', 'travel'])
assert.deepEqual(fromCloudPreferenceFields(null, local), local)
assert.deepEqual(fromCloudPreferenceFields([], local), local)

// Missing and malformed remote fields must not reset a learner's local choices.
const partial = fromCloudPreferenceFields({ tone: 'professional' }, local)
assert.equal(partial.tone, 'professional')
assert.equal(partial.goal, 'work')
assert.equal(partial.pace, 'slow_clear')
assert.deepEqual(partial.interests, local.interests)
const invalid = fromCloudPreferenceFields({
  learning_goal: 'invented', correction_style: null, tone: '<script>',
  pace: 'unknown', explanation_depth: {}, interests: 'music',
  learner_style: 'child', user_id: 'other-person', billing_country: 'US',
}, local)
assert.deepEqual(invalid, local)

// Explicit no-interests is a genuine learner choice; never substitute defaults.
const noneSelected = fromCloudPreferenceFields({ interests: [] }, local)
assert.deepEqual(noneSelected.interests, [])
assert.equal(noneSelected.goal, 'work')
assert.deepEqual(local.interests, original.interests, 'the mapping does not mutate the local profile')
console.log('cloud preference mapping: all assertions passed')
