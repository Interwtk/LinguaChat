import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { SEED_VOCAB_BY_ID } from '../../data/vocabulary'
import { getLocalizedMeaning } from '../../services/learningContent'

// Demo garden: stable vocab ids + demo mastery. The visible meaning (`trans`)
// is resolved to the learner's native language, never hardcoded Spanish.
const DEMO_GARDEN = [
  { id: 'happy', mastery: 0.92, days: 12 }, { id: 'because', mastery: 0.78, days: 11 },
  { id: 'question', mastery: 0.85, days: 10 }, { id: 'travel', mastery: 0.70, days: 9 },
  { id: 'water', mastery: 0.60, days: 8 }, { id: 'morning', mastery: 0.42, days: 7 },
  { id: 'yesterday', mastery: 0.50, days: 6 }, { id: 'work', mastery: 0.65, days: 5 },
  { id: 'like', mastery: 0.72, days: 4 }, { id: 'need', mastery: 0.48, days: 3 },
  { id: 'easy', mastery: 0.38, days: 2 }, { id: 'today', mastery: 0.72, days: 1 },
]

const FILTERS = ['All', 'Mastered', 'Learning', 'New']

function masteryLevel(m) {
  if (m >= 0.75) return 'mastered'
  if (m >= 0.45) return 'learning'
  return 'new'
}

function masteryColor(m) {
  if (m >= 0.75) return { bg: 'var(--green-soft)', border: 'var(--green)', text: 'var(--green)' }
  if (m >= 0.45) return { bg: 'var(--yellow-soft)', border: 'var(--yellow)', text: 'var(--yellow)' }
  return { bg: 'var(--blue-soft)', border: 'var(--blue)', text: 'var(--blue)' }
}

function wordRotation(word) {
  const code = word.charCodeAt(0) + word.charCodeAt(word.length - 1)
  return ((code % 5) - 2) * 0.8
}

export function MemoryGarden() {
  const { localProgress, t, nativeLanguageInfo, interfaceLanguageInfo } = useApp()
  const [filter, setFilter] = useState('All')
  const [expanded, setExpanded] = useState(null)
  const meaningOf = (item) => getLocalizedMeaning(item?.meaning, nativeLanguageInfo, interfaceLanguageInfo)
  const hasRealItems = localProgress.learnedItems.length > 0
  const gardenWords = hasRealItems
    ? localProgress.learnedItems.map(item => {
        // A real item may carry a vocab id (localized) or a legacy `trans` label.
        const vocab = item.vocabId ? SEED_VOCAB_BY_ID[item.vocabId] : null
        return {
          ...item,
          word: vocab?.term || item.word,
          emoji: vocab?.emoji || item.emoji || '·',
          example: vocab?.example || item.example || '',
          trans: vocab ? meaningOf(vocab) : (item.trans || ''),
          days: Math.max(0, Math.floor((Date.now() - (item.lastSeenAt || Date.now())) / 86400000)),
        }
      })
    : DEMO_GARDEN.map(d => {
        const vocab = SEED_VOCAB_BY_ID[d.id]
        return {
          word: vocab.term, emoji: vocab.emoji, example: vocab.example,
          trans: meaningOf(vocab), mastery: d.mastery, days: d.days,
        }
      })

  const filtered = gardenWords.filter(w => {
    if (filter === 'All') return true
    if (filter === 'Mastered') return masteryLevel(w.mastery) === 'mastered'
    if (filter === 'Learning') return masteryLevel(w.mastery) === 'learning'
    if (filter === 'New') return masteryLevel(w.mastery) === 'new'
    return true
  })

  const mastered = gardenWords.filter(w => masteryLevel(w.mastery) === 'mastered').length

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8" style={{ background: 'var(--bg-main)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="mb-6 animate-fade-up">
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 6 }}>
            {t('wordsToday')}
          </p>
          <div className="flex items-end justify-between">
            <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', color: 'var(--ink)', lineHeight: 1.1 }}>
              {t('memoryGarden')}
            </h1>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--green)' }}>{mastered}</p>
                <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{t('mastered')}</p>
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--ink)' }}>{gardenWords.length}</p>
                <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{t('totalWords')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 animate-fade-up" style={{ animationDelay: '0.04s' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-2xl text-sm font-semibold transition-all"
              style={{
                background: filter === f ? 'var(--ink)' : 'var(--bg-paper)',
                color: filter === f ? 'var(--bg-main)' : 'var(--ink-muted)',
                border: `1.5px solid ${filter === f ? 'var(--ink)' : 'var(--border)'}`,
              }}>
              {f === 'All' ? t('all') : f === 'Mastered' ? t('mastered') : f === 'Learning' ? t('learning') : t('new')}
            </button>
          ))}
        </div>

        <div className="animate-fade-up" style={{
          animationDelay: '0.08s',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
        }}>
          {filtered.map(w => {
            const colors = masteryColor(w.mastery)
            const rot = wordRotation(w.word)
            const isExpanded = expanded === w.word
            const isLarge = w.mastery >= 0.80

            return (
              <button
                key={w.word}
                type="button"
                onClick={() => setExpanded(isExpanded ? null : w.word)}
                className="rounded-2xl cursor-pointer transition-all text-left"
                style={{
                  padding: isLarge ? '16px 14px' : '12px 12px',
                  background: colors.bg,
                  border: `1.5px solid ${isExpanded ? colors.border : colors.border + '88'}`,
                  transform: isExpanded ? 'scale(1.02) rotate(0deg)' : `rotate(${rot}deg)`,
                  boxShadow: isExpanded ? `0 8px 24px ${colors.border}33` : 'none',
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
                <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 500 }}>
                  {w.trans}
                </p>

                {isExpanded && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${colors.border}44` }}>
                    <p lang="en" dir="ltr" style={{ fontSize: '0.8125rem', color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 6 }}>
                      "{w.example}"
                    </p>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 10, fontWeight: 700, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {masteryLevel(w.mastery)}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>
                        {w.days}d
                      </span>
                    </div>
                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${w.mastery * 100}%`, height: '100%', borderRadius: 999, background: colors.border }} />
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
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{t('practiceToFillGarden')}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-8 animate-fade-up" style={{ animationDelay: '0.12s' }}>
          {[
            { label: t('addedThisWeek'), value: hasRealItems ? gardenWords.filter(item => item.days <= 7).length : 4, color: 'var(--violet)' },
            { label: t('mastered'), value: mastered, color: 'var(--green)' },
            { label: t('stillLearning'), value: gardenWords.length - mastered, color: 'var(--yellow)' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
              <p style={{ fontWeight: 800, fontSize: '1.375rem', color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
