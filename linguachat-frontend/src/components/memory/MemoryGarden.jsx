import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { SEED_VOCAB_BY_ID } from '../../data/vocabulary'
import { getLocalizedMeaning } from '../../services/learningContent'
import { loadLearnerModel, LEARNING_STATE_RANK } from '../../learning/engine/learnerModel.js'
import { selectLearnerFact } from '../../learning/engine/learnerFacts.js'
import { asSubjectValue } from '../../learning/engine/semanticContext.js'

// Demo garden: stable vocab ids + demo mastery. The visible meaning (`trans`)
// is resolved to the learner's native language, never hardcoded Spanish.

const FILTERS = ['All', 'CanUse', 'Practicing', 'Seen']

/*
 * The Garden used to show every item at a flat mastery of 0.5, so a sentence
 * the learner had produced unaided looked exactly like a word they had once
 * heard someone else say. It now reads the learner model's four learning
 * states and groups them into the three the learner needs to tell apart:
 *
 *   seen + understood  →  met it
 *   practicing         →  working on it
 *   can_use            →  can use it
 *
 * `seen` and `understood` share a group on purpose. The difference between
 * having met a word and having recognised it matters to the review engine and
 * not to the person reading the screen.
 */
const GROUPS = { Seen: 'Seen', Practicing: 'Practicing', CanUse: 'CanUse' }

function groupForState(state) {
  if (state === 'can_use') return GROUPS.CanUse
  if (state === 'practicing') return GROUPS.Practicing
  return GROUPS.Seen
}

const GROUP_LABEL_KEY = { Seen: 'gardenStateSeen', Practicing: 'gardenStatePracticing', CanUse: 'gardenStateCanUse' }

function groupColor(group) {
  if (group === GROUPS.CanUse) return { bg: 'var(--positive-soft)', border: 'var(--positive)', text: 'var(--positive)' }
  if (group === GROUPS.Practicing) return { bg: 'var(--accent-soft)', border: 'var(--accent-tint)', text: 'var(--accent-tint)' }
  return { bg: 'var(--info-soft)', border: 'var(--info)', text: 'var(--info)' }
}

/* How full the little progress bar looks, from the state rather than a number. */
const groupProgress = (group) => (group === GROUPS.CanUse ? 1 : group === GROUPS.Practicing ? 0.6 : 0.25)

export function MemoryGarden() {
  const { localProgress, t, nativeLanguageInfo, interfaceLanguageInfo } = useApp()
  const [filter, setFilter] = useState('All')
  const [expanded, setExpanded] = useState(null)
  const meaningOf = (item) => getLocalizedMeaning(item?.meaning, nativeLanguageInfo, interfaceLanguageInfo)
  const hasRealItems = localProgress.learnedItems.length > 0
  // the learner model is the authority on how far each item has come
  const learnerModel = loadLearnerModel()
  const gardenWords = hasRealItems
    ? localProgress.learnedItems.map(item => {
        // A real item may carry a vocab id (localized) or a legacy `trans` label.
        const vocab = item.vocabId ? SEED_VOCAB_BY_ID[item.vocabId] : null
        const state = item.vocabId ? learnerModel.languageItems?.[item.vocabId]?.learningState : null
        return {
          ...item,
          word: vocab?.term || item.word,
          emoji: vocab?.emoji || item.emoji || '·',
          example: vocab?.example || item.example || '',
          trans: vocab ? meaningOf(vocab) : (item.trans || ''),
          group: groupForState(state),
          days: Math.max(0, Math.floor((Date.now() - (item.lastSeenAt || Date.now())) / 86400000)),
        }
      })
    /*
     * NO BORROWED WORDS. This used to fall back to a demo garden, so a learner
     * with nothing saved yet was shown twelve words as if they were theirs. An
     * empty garden is a real state and says so below.
     */
    : []

  const filtered = gardenWords.filter(w => (filter === 'All' ? true : w.group === filter))
  const usable = gardenWords.filter(w => w.group === GROUPS.CanUse).length

  /*
   * For the handful of words where it genuinely helps, a second example built
   * from something the learner told Lingua. It is additional, short, and only
   * appears when the word actually fits the sentence — a saved phrase must
   * never be replaced by a personalised one.
   */
  const fact = selectLearnerFact(loadLearnerModel(), { type: 'like', seed: 'garden', allowRecent: true, accept: (f) => Boolean(asSubjectValue(f.value)) })
  const PERSONAL_EXAMPLE = fact ? {
    like: `I like ${fact.value}.`,
    need: `I need ${fact.value}.`,
    today: `I like ${fact.value} today.`,
  } : {}
  const personalExampleFor = (word) => PERSONAL_EXAMPLE[String(word || '').toLowerCase()] || null

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="mb-5 animate-fade-up">
          <h1 className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(1.5rem, 5vw, 1.95rem)', color: 'var(--ink)', lineHeight: 1.1 }}>
            {t('yourWordsTitle')}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: 5 }}>
            {t('yourWordsSubtitle', { count: gardenWords.length })}
          </p>
          {gardenWords.length > 0 && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--positive-deep)', fontWeight: 600, marginTop: 4 }}>
              {usable} · {t('gardenStateCanUse')}
            </p>
          )}
        </div>

        <div className="flex gap-2 mb-6 animate-fade-up" style={{ animationDelay: '0.04s' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="tool-chip"
              aria-pressed={filter === f}
              style={filter === f
                ? { background: 'var(--accent-soft)', color: 'var(--accent-strong)', borderColor: 'var(--accent-tint)' }
                : undefined}>
              {f === 'All' ? t('all') : t(GROUP_LABEL_KEY[f])}
            </button>
          ))}
        </div>

        {gardenWords.length === 0 && (
          <div className="mini-window animate-fade-up" style={{ animationDelay: '0.08s' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5 }}>{t('noWordsYet')}</p>
          </div>
        )}

        <div className="animate-fade-up" style={{
          animationDelay: '0.08s',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
        }}>
          {filtered.map(w => {
            const colors = groupColor(w.group)
            const isExpanded = expanded === w.word
            const isLarge = w.group === GROUPS.CanUse

            return (
              <button
                key={w.word}
                type="button"
                onClick={() => setExpanded(isExpanded ? null : w.word)}
                className="rounded-2xl cursor-pointer transition-all text-left"
                /*
                 * A word is a card, not a sticker. The tiles used to be rotated by a
                 * hash of the word, which looked playful at 12 and unreadable at 60;
                 * the state is carried by fill and border instead.
                 */
                style={{
                  padding: isLarge ? '15px 14px' : '12px 12px',
                  background: colors.bg,
                  border: `1px solid ${isExpanded ? colors.border : 'var(--border)'}`,
                  boxShadow: isExpanded ? 'var(--shadow-sm)' : 'none',
                  userSelect: 'none',
                }}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <span style={{ fontSize: isLarge ? 20 : 16 }}>{w.emoji}</span>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: colors.border, marginTop: 3 }} />
                </div>
                <p lang="en" dir="ltr" style={{ fontWeight: 800, fontSize: isLarge ? '1rem' : '0.9375rem', color: 'var(--ink)', lineHeight: 1.2, marginBottom: 3 }}>
                  {w.word}
                </p>
                <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>
                  {w.trans}
                </p>

                {isExpanded && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${colors.border}44` }}>
                    <p lang="en" dir="ltr" style={{ fontSize: '0.8125rem', color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 6 }}>
                      "{w.example}"
                    </p>
                    {/* A second example in the learner's own subject matter,
                        beside the real one — never instead of it. */}
                    {personalExampleFor(w.word) && (
                      <p lang="en" dir="ltr" style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 6 }}>
                        {personalExampleFor(w.word)}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 10, fontWeight: 700, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {t(GROUP_LABEL_KEY[w.group])}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                        {w.days}d
                      </span>
                    </div>
                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${groupProgress(w.group) * 100}%`, height: '100%', borderRadius: 999, background: colors.border }} />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', marginBottom: 6 }}>{t('noWords')}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{t('practiceToFillGarden')}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-8 animate-fade-up" style={{ animationDelay: '0.12s' }}>
          {[
            { label: t('addedThisWeek'), value: hasRealItems ? gardenWords.filter(item => item.days <= 7).length : 4, color: 'var(--accent)' },
            { label: t('gardenStateCanUse'), value: usable, color: 'var(--positive)' },
            { label: t('gardenStatePracticing'), value: gardenWords.filter(w => w.group === GROUPS.Practicing).length, color: 'var(--accent-tint)' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p style={{ fontWeight: 800, fontSize: '1.375rem', color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
