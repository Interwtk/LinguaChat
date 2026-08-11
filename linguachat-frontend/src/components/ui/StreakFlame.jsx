/*
 * StreakFlame — the reference implementation, ported rather than reinterpreted.
 *
 * Every number in this file was read out of the design's own markup
 * (`2.dc.html` / `3.dc.html`): container sizes, layer sizes, `bottom` offsets,
 * the `50% 0 50% 50%` radius, the -45° rotation with a `50% 62%` origin, both
 * gradients, the inset highlight, the ember halo, the layer count per tier, and
 * the three durations with their easing. The keyframes live in index.css under
 * the same names (flameA / flameB / flameC / ember) with the same steps.
 *
 * An earlier attempt redrew this from a description and produced a tilted
 * droplet: same rotation, wrong shape, wrong stack, wrong blend. The difference
 * is not decoration — `mix-blend-mode: screen`, the white-hot gradient stop and
 * the blurred ember are what make it read as fire instead of as an icon. So this
 * file copies; it does not improve.
 *
 * The tiers are the design's: how long the streak is decides which family of fire
 * burns, from a candle to an oxy-acetylene torch. It is a visual reward only —
 * the learner model owns the count, this draws it.
 */

/*
 * One entry per tier, hottest first so the first match wins. `size` is the
 * container; `layers` are ember → A → B → (C), each with the width and `bottom`
 * the reference uses at that tier. Heights equal widths for the flame layers.
 */
export const FLAME_TIERS = [
  {
    id: 'oxyacetylene', min: 365, size: [76, 88],
    ember: { w: 72, bottom: 0, color: '#2B60FF' },
    body: [
      { anim: 'flameA', w: 58, bottom: 4, from: '#1B3FE0', to: '#7FB2FF' },
      { anim: 'flameB', w: 37, bottom: 5, from: '#7FB2FF', to: '#EAF1FF' },
      { anim: 'flameC', w: 19, bottom: 6, from: '#EAF1FF', to: '#EAF1FF' },
    ],
  },
  {
    id: 'acetylene', min: 200, size: [70, 80],
    ember: { w: 66, bottom: 0, color: '#EFD98F' },
    body: [
      { anim: 'flameA', w: 52, bottom: 4, from: '#EFD98F', to: '#FFF8DC' },
      { anim: 'flameB', w: 33, bottom: 5, from: '#FFF8DC', to: '#FFFFFF' },
      { anim: 'flameC', w: 17, bottom: 6, from: '#FFFFFF', to: '#FFFFFF' },
    ],
  },
  {
    id: 'propane_o2', min: 100, size: [65, 74],
    ember: { w: 61, bottom: 0, color: '#1E45C8' },
    body: [
      { anim: 'flameA', w: 48, bottom: 4, from: '#1E45C8', to: '#5183F5' },
      { anim: 'flameB', w: 30, bottom: 5, from: '#5183F5', to: '#0D2280' },
      { anim: 'flameC', w: 16, bottom: 6, from: '#0D2280', to: '#0D2280' },
    ],
  },
  {
    id: 'propane', min: 60, size: [61, 68],
    ember: { w: 57, bottom: 0, color: '#2A5FD0' },
    body: [
      { anim: 'flameA', w: 43, bottom: 4, from: '#2A5FD0', to: '#6D9BEC' },
      { anim: 'flameB', w: 28, bottom: 5, from: '#6D9BEC', to: '#12307F' },
      { anim: 'flameC', w: 14, bottom: 6, from: '#12307F', to: '#12307F' },
    ],
  },
  {
    id: 'natural_gas', min: 28, size: [56, 62],
    ember: { w: 52, bottom: 0, color: '#3F7FD6' },
    body: [
      { anim: 'flameA', w: 39, bottom: 4, from: '#3F7FD6', to: '#9BC6F2' },
      { anim: 'flameB', w: 25, bottom: 5, from: '#9BC6F2', to: '#9BC6F2' },
    ],
  },
  {
    id: 'alcohol', min: 14, size: [51, 56],
    ember: { w: 47, bottom: 0, color: '#8FB4DC' },
    body: [
      { anim: 'flameA', w: 35, bottom: 4, from: '#8FB4DC', to: '#D6E7F7' },
      { anim: 'flameB', w: 22, bottom: 5, from: '#D6E7F7', to: '#D6E7F7' },
    ],
  },
  {
    id: 'campfire', min: 7, size: [47, 50],
    ember: { w: 43, bottom: 0, color: '#C86B4A' },
    body: [
      { anim: 'flameA', w: 30, bottom: 4, from: '#C86B4A', to: '#EFA24A' },
      { anim: 'flameB', w: 19, bottom: 5, from: '#EFA24A', to: '#EFA24A' },
    ],
  },
  {
    id: 'candle', min: 0, size: [41, 42],
    ember: { w: 37, bottom: 0, color: '#E8952B' },
    body: [
      { anim: 'flameA', w: 24, bottom: 4, from: '#E8952B', to: '#FFD98A' },
      { anim: 'flameB', w: 16, bottom: 5, from: '#FFD98A', to: '#FFD98A' },
    ],
  },
]

/* The reference's three cadences, verbatim. */
const DURATION = { flameA: '2.85s', flameB: '2.15s', flameC: '1.62s' }
const EASING = 'cubic-bezier(.45,0,.55,1)'

/* The highlight is the same on every layer of every tier. */
const SHEEN = 'radial-gradient(circle at 56% 30%, rgba(255,255,255,.52) 0%, rgba(255,255,255,.18) 18%, rgba(255,255,255,0) 42%)'
const GLOW = '0 0 1px rgba(255,255,255,.32), 0 0 10px rgba(255,255,255,.1), inset 0 0 6px rgba(255,255,255,.18)'

export function flameTierFor(days) {
  const count = Number(days) || 0
  return FLAME_TIERS.find(tier => count >= tier.min) || FLAME_TIERS[FLAME_TIERS.length - 1]
}

/**
 * @param days   the learner's streak, from the learner model
 * @param scale  1 renders the tier at the size the design draws it; a smaller
 *               number shrinks the whole thing proportionally for tight places
 *               like a list row. The geometry is never re-proportioned.
 * @param label  accessible text. With one, the flame is an image with meaning;
 *               without one it is decorative because the number beside it says
 *               the same thing, and a screen reader should not hear it twice.
 */
export function StreakFlame({ days = 0, scale = 1, label, className = '' }) {
  const tier = flameTierFor(days)
  const [w, h] = tier.size
  const px = (value) => `${Math.round(value * scale * 100) / 100}px`

  return (
    <span
      className={`streak-flame ${className}`.trim()}
      data-tier={tier.id}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : 'true'}
      style={{
        position: 'relative',
        width: px(w),
        height: px(h),
        flexShrink: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      {/* the ember: a wide, soft, slow halo under the fire */}
      <span
        className="streak-flame-ember"
        style={{
          position: 'absolute',
          bottom: px(tier.ember.bottom),
          width: px(tier.ember.w),
          height: px(tier.ember.w),
          borderRadius: '50%',
          background: tier.ember.color,
          opacity: 0.2,
          filter: `blur(${px(7)})`,
          animation: `ember 4.95s ease-in-out infinite`,
        }}
      />
      {tier.body.map(layer => (
        <span
          key={layer.anim}
          className={`streak-flame-layer streak-flame-${layer.anim}`}
          style={{
            position: 'absolute',
            bottom: px(layer.bottom),
            width: px(layer.w),
            height: px(layer.w),
            /* the silhouette: a rounded body with one sharp corner, turned up */
            borderRadius: '50% 0 50% 50%',
            transform: 'rotate(-45deg)',
            transformOrigin: '50% 62%',
            background: `${SHEEN}, linear-gradient(165deg, ${layer.from} 0%, ${layer.to} 68%, rgba(255,255,255,.96) 100%)`,
            boxShadow: GLOW,
            animation: `${layer.anim} ${DURATION[layer.anim]} ${EASING} infinite`,
          }}
        />
      ))}
    </span>
  )
}

export default StreakFlame
