import { toCloudPreferenceFields } from '../services/cloudPreferenceMapping.js'
const COLUMNS = ['user_id', ...Object.keys(toCloudPreferenceFields()), 'updated_at'].join(',')

// Existing public learner_preferences table only. RLS remains mandatory and
// needs separate hosted A/B/anonymous proof before rollout.
export function createPreferenceTransport(client) {
  const result = response => {
    if (response.error) throw response.error
    return response.data
  }
  async function user() {
    return result(await client.auth.getUser())?.user ?? null
  }
  async function requireUser(expected) {
    if ((await user())?.id !== expected) throw new Error('account_changed')
  }
  return {
    user,
    async read(id) {
      await requireUser(id)
      return result(await client.from('learner_preferences').select(COLUMNS).eq('user_id', id).maybeSingle())
    },
    async compareAndSet(id, revision, value) {
      await requireUser(id)
      // Strict allowlist: caller-provided identity and unrelated state never pass.
      const payload = Object.fromEntries(Object.keys(toCloudPreferenceFields()).map(key => [key, value[key]]))
      const previousTime = revision === null ? 0 : Date.parse(revision)
      if (!Number.isFinite(previousTime)) throw new Error('invalid_remote_revision')
      payload.updated_at = new Date(Math.max(Date.now(), previousTime + 1)).toISOString()
      let response
      if (revision === null) {
        response = await client.from('learner_preferences').insert({ ...payload, user_id: id }).select(COLUMNS).maybeSingle()
        if (response.error?.code === '23505') return null
      } else {
        response = await client.from('learner_preferences').update(payload).eq('user_id', id).eq('updated_at', revision).select(COLUMNS).maybeSingle()
      }
      return result(response)
    },
  }
}
