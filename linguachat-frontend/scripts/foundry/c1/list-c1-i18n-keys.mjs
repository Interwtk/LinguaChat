/*
 * list-c1-i18n-keys — the mechanically-generated i18n key manifest
 * LC-INT-001 needs to populate every locale file with. Walks every authored
 * C1 episode and every vocabulary item, collecting every `*Key`-suffixed
 * field and every vocabulary `glossKey`, deduplicated and sorted. Generated
 * from the actual content rather than hand-maintained, so it cannot drift
 * the way a separately-authored manifest file could.
 *
 * Usage: `node scripts/foundry/c1/list-c1-i18n-keys.mjs` from
 * `linguachat-frontend/` — prints one key per line to stdout. Not itself a
 * pass/fail check (no locale files exist yet to check against; i18n/** is
 * out of this task's write scope).
 */
import { ALL_EPISODES } from './check-c1-arc-content.mjs'
import { C1_VOCABULARY } from '../../../src/learning/levels/c1/c1Vocabulary.js'

const keys = new Set()

const collectFromObject = (obj) => {
  if (!obj || typeof obj !== 'object') return
  for (const [field, value] of Object.entries(obj)) {
    if (typeof value === 'string' && /Key$/.test(field)) keys.add(value)
    if (Array.isArray(value)) value.forEach(collectFromObject)
    else if (value && typeof value === 'object') collectFromObject(value)
  }
}

for (const ep of ALL_EPISODES) collectFromObject(ep)
for (const vocab of C1_VOCABULARY) keys.add(vocab.glossKey)

const sorted = [...keys].sort()
if (import.meta.url === `file://${process.argv[1]}`) {
  sorted.forEach((k) => console.log(k))
  console.error(`\n${sorted.length} unique i18n keys referenced by C1 content.`)
}

export const C1_I18N_KEYS = sorted
