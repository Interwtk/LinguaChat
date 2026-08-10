/*
 * StreakFlame — the streak, as fire rather than as a number on a badge.
 *
 * The days live INSIDE the flame: how long the learner has kept going decides
 * which family of fire is burning, from a candle on day one to an oxy-acetylene
 * flame after a year. That scale is the design's, and it is a visual reward with
 * no effect on progress: the learner model owns the count, this only draws it.
 *
 * Motion is deliberately slow. Three blurred layers on different rhythms plus a
 * very soft halo (see `.streak-flame*` in index.css) so the silhouette breathes
 * instead of flickering, and `prefers-reduced-motion` stops all of it.
 *
 * A streak never drops to zero from a single missed day — that is the learner
 * model's rule, not this component's; here a smaller number simply draws a
 * smaller fire.
 */

/*
 * The tiers, hottest first, so the first match wins. Names are the design's own
 * vocabulary; only the colours reach the DOM.
 */
export const FLAME_TIERS = [
  { id: 'oxyacetylene', min: 365, outer: '#1B3FE0', inner: '#7FB2FF', core: '#EAF1FF' },
  { id: 'acetylene',    min: 200, outer: '#D6C27D', inner: '#FFF2C5', core: '#FFFFFF' },
  { id: 'propane_o2',   min: 100, outer: '#2449B8', inner: '#6D9BEC', core: '#EAF1FF' },
  { id: 'propane',      min: 60,  outer: '#2A5FD0', inner: '#7AA4EC', core: '#17347F' },
  { id: 'natural_gas',  min: 28,  outer: '#3F7FD6', inner: '#9BC6F2', core: '#E6F1FB' },
  { id: 'alcohol',      min: 14,  outer: '#8FB4DC', inner: '#D6E7F7', core: '#F4FAFF' },
  { id: 'campfire',     min: 7,   outer: '#C86B4A', inner: '#EFA24A', core: '#FFD98A' },
  { id: 'candle',       min: 0,   outer: '#E8952B', inner: '#FFD98A', core: '#FFF2C5' },
]

export function flameTierFor(days) {
  const count = Number(days) || 0
  return FLAME_TIERS.find(tier => count >= tier.min) || FLAME_TIERS[FLAME_TIERS.length - 1]
}

/**
 * @param days   the learner's current streak, from the learner model
 * @param size   rendered width in px; height follows at 1.16×
 * @param label  accessible text. Given one, the flame is an image with meaning;
 *               without one it is decorative and the number beside it carries it,
 *               so a screen reader never hears the streak twice.
 */
export function StreakFlame({ days = 0, size = 34, label, className = '' }) {
  const tier = flameTierFor(days)
  const style = {
    '--flame-size': `${size}px`,
    '--flame-outer': tier.outer,
    '--flame-inner': tier.inner,
    '--flame-core': tier.core,
  }

  return (
    <span
      className={`streak-flame ${className}`.trim()}
      style={style}
      data-tier={tier.id}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : 'true'}
    >
      <i className="streak-flame-glow" />
      <i className="streak-flame-layer streak-flame-outer" />
      <i className="streak-flame-layer streak-flame-inner" />
      {/* the hottest families gain a bright core; below that it would be noise */}
      {Number(days) >= 60 && <i className="streak-flame-layer streak-flame-core" />}
    </span>
  )
}

export default StreakFlame
