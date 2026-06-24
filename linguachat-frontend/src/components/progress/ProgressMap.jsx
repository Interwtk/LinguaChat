import { JOURNEY_NODES, LEVEL_TO_NODE, MOCK_STATS } from '../../data/mockData'

export function ProgressMap({ level = 'B1' }) {
  const currentNodeId = LEVEL_TO_NODE[level] || 'travel'
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
                  background: done ? 'var(--green)' : current ? 'var(--blue)' : 'var(--border)',
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
                  ? 'var(--green)'
                  : current
                  ? 'var(--blue)'
                  : 'var(--bg-elevated)',
                border: ahead ? '2px solid var(--border)' : 'none',
                color: done || current ? '#fff' : 'var(--ink-muted)',
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
                color: current ? 'var(--ink)' : done ? 'var(--green)' : 'var(--ink-muted)',
                lineHeight: 1.3,
              }}>
                {node.label}
              </p>
              {node.levels && (
                <p style={{ fontSize: 11, color: 'var(--ink-muted)', opacity: 0.7 }}>{node.levels}</p>
              )}
              {current && (
                <span style={{
                  display: 'inline-block', marginTop: 3,
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'var(--blue)', background: 'rgba(59,130,196,0.1)',
                  padding: '1px 6px', borderRadius: 999,
                }}>
                  You are here
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
