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
assert.deepEqual(fromCloudPreferenceFields(null, local), local)
console.log('cloud preference mapping: 23 assertions passed')
