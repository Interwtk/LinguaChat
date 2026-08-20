import { JOURNEY_NODES, COURSE_NODE_BY_LEVEL_ID } from '../../data/mockData'
import { useApp } from '../../context/AppContext'
import { PRE_A1 } from '../../learning/curriculum/levels.js'

const NODE_LABEL_KEYS = {
  start: 'journeyStart',
  basics: 'journeyBasics',
  travel: 'journeyTravel',
  confidence: 'journeyConfidence',
  fluency: 'journeyFluency',
}

/* `courseLevelId` is the actual playable curriculum level — never the learner's
 * raw CEFR placement, which can name a level this build cannot open yet. */
export function ProgressMap({ courseLevelId = PRE_A1 }) {
  const { t } = useApp()
  const currentNodeId = COURSE_NODE_BY_LEVEL_ID[courseLevelId] || 'start'
  const currentIdx = JOURNEY_NODES.findIndex(n => n.id === currentNodeId)

  return (
    <div className="flex flex-col" style={{ paddingLeft: 4 }}>
      {JOURNEY_NODES.map((node, i) => {
        const done    = i < currentIdx
        const current = i === currentIdx
        const ahead   = i > currentIdx
        const last    = i === JOURNEY_NODES.length - 1

        return (
          <div key={node.id} className="flex items-start gap-3 relative">
            {/* Connector line */}
            {!last && (
              <div
                className="absolute"
                style={{
                  left: 17,
                  top: 36,
                  width: 2,
                  height: 28,
                  background: done ? 'var(--positive)' : current ? 'var(--info)' : 'var(--border)',
                  borderRadius: 2,
                  transition: 'background 0.4s ease',
                }}
              />
            )}

            {/* Node circle */}
            <div
              className={`flex-shrink-0 flex items-center justify-center rounded-full select-none ${
                current ? 'journey-node-current' : ''
              }`}
              style={{
                width: 36,
                height: 36,
                fontSize: done ? 14 : 18,
                background: done
                  ? 'var(--positive)'
                  : current
                  ? 'var(--info)'
                  : 'var(--surface-soft)',
                border: ahead ? '2px solid var(--border)' : 'none',
                color: done || current ? '#fff' : 'var(--muted)',
                boxShadow: current
                  ? '0 0 0 4px rgba(59,130,196,0.15), 0 2px 8px rgba(59,130,196,0.2)'
                  : done
                  ? '0 2px 8px rgba(63,174,117,0.2)'
                  : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {done ? (
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10l5 5 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <span role="img">{node.emoji}</span>
              )}
            </div>

            {/* Label */}
            <div className="pt-1.5 pb-7">
              <p style={{
                fontSize: '0.8125rem',
                fontWeight: current ? 700 : done ? 600 : 500,
                color: current ? 'var(--ink)' : done ? 'var(--positive)' : 'var(--muted)',
                lineHeight: 1.3,
              }}>
                {NODE_LABEL_KEYS[node.id] ? t(NODE_LABEL_KEYS[node.id]) : node.label}
              </p>
              {node.levels && (
                <p style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.7 }}>{node.levels}</p>
              )}
              {current && (
                <span style={{
                  display: 'inline-block', marginTop: 3,
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'var(--info)', background: 'rgba(59,130,196,0.1)',
                  padding: '1px 6px', borderRadius: 999,
                }}>
                  {t('youAreHere')}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
