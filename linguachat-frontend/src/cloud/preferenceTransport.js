import { toCloudPreferenceFields, validCloudPreferenceFields } from '../services/cloudPreferenceMapping.js'
const COLUMNS = ['user_id', ...Object.keys(toCloudPreferenceFields()), 'updated_at'].join(',')

export function preferenceRevisionTime(revision) {
  const match = typeof revision === 'string' && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.exec(revision)
  const time = match ? Date.parse(revision) : NaN
  if (!Number.isFinite(time) || Number(match[2]) < 1 || Number(match[2]) > 12
    || Number(match[3]) < 1 || Number(match[3]) > new Date(Date.UTC(Number(match[1]), Number(match[2]), 0)).getUTCDate()
    || Number(match[4]) > 23 || Number(match[5]) > 59 || Number(match[6]) > 59) throw new Error('invalid_remote_revision')
  return time
}

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
    const verified = await user()
    if (typeof expected !== 'string' || !expected || !verified?.id || verified.id !== expected) throw new Error('account_changed')
  }
  return {
    user,
    async read(id, guard = () => {}) {
      await requireUser(id)
      guard()
      return result(await client.from('learner_preferences').select(COLUMNS).eq('user_id', id).maybeSingle())
    },
    async compareAndSet(id, revision, value, guard = () => {}) {
      await requireUser(id)
      guard()
      // Strict allowlist: caller-provided identity and unrelated state never pass.
      const payload = Object.fromEntries(Object.keys(toCloudPreferenceFields()).map(key => [key, value[key]]))
      if (!validCloudPreferenceFields(payload)) throw new Error('invalid_local_preferences')
      const previousTime = revision === null ? 0 : preferenceRevisionTime(revision)
      payload.updated_at = new Date(Math.max(Date.now(), previousTime + 1)).toISOString()
      preferenceRevisionTime(payload.updated_at)
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
