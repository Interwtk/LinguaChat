/*
 * StreakFlame — the design's fire, with a silhouette that actually reads as fire.
 *
 * WHY THIS FILE STOPPED BEING A VERBATIM PORT.
 *
 * Everything here came out of the design's own markup: the eight tiers, their
 * container sizes, the per-layer widths and `bottom` offsets, both gradients, the
 * inset highlight, the ember halo, the layer count per tier, the three durations
 * and their easing. One thing did not survive contact with a rendered screenshot:
 * the SHAPE. The reference drew each layer as a square with `border-radius:
 * 50% 0 50% 50%` turned -45°, which is three rounded corners and one sharp one,
 * pointing up — a perfectly symmetrical bulb with a cone on top. That is the
 * canonical way to draw a WATER DROP, and at 47×50 on a cream page that is
 * exactly what it read as. Rendering the reference's own markup beside ours
 * produced the same droplet, so this was the geometry's doing, not the port's.
 *
 * The intent behind the asset is fire. So the silhouette is now a flame outline —
 * a `clip-path` with a leaning tip, one concave flank, a narrower waist and a wide
 * rounded base — and the layers stand upright instead of resting at -45°.
 *
 * EVERYTHING ELSE IS THE DESIGN'S, UNCHANGED: the layer system (ember → A → B →
 * C), the per-tier palettes, the two-part gradient with its white-hot stop, the
 * blurred ember, the three cadences (2.85 / 2.15 / 1.62 s, ember 4.95 s), the
 * easing, the soft blur that fuses the layers, the reduced-motion stop, and the
 * evolution from a candle to an oxy-acetylene torch as the streak grows.
 *
 * It is a visual reward only — the learner model owns the count, this draws it.
 */

/*
 * THE SILHOUETTE, in three related outlines.
 *
 * Percentages, so one path serves every tier and every scale. Read clockwise from
 * the tip. Three things make each of them fire rather than a droplet or a leaf:
 * the tip sits off-centre and leans, the right flank dips inward before it swells
 * (the small "s" a real flame has), and the base is much wider than the waist.
 * Nothing is mirror-symmetrical.
 */
const FLAME_SHAPE = {
  /* the body */
  flameA: 'polygon(64% 0%, 66% 7%, 66% 15%, 67% 24%, 69% 33%, 72% 42%, 77% 52%, 81% 62%, 82% 72%, 79% 82%, 73% 91%, 63% 98%, 52% 100%, 41% 99%, 31% 93%, 23% 85%, 18% 74%, 17% 63%, 20% 52%, 25% 43%, 31% 35%, 38% 26%, 46% 17%, 55% 8%)',
  /* the inner flame: leans less, sits lower, and never lines up with the body */
  flameB: 'polygon(56% 0%, 60% 9%, 61% 19%, 63% 29%, 67% 40%, 70% 52%, 71% 65%, 67% 78%, 58% 92%, 48% 98%, 38% 92%, 30% 80%, 27% 66%, 29% 53%, 34% 42%, 40% 31%, 47% 19%)',
  /* the core: a slim tongue leaning the other way, only on the hot tiers */
  flameC: 'polygon(46% 0%, 52% 12%, 56% 28%, 60% 45%, 61% 62%, 56% 80%, 48% 96%, 40% 82%, 36% 64%, 37% 46%, 40% 28%, 42% 13%)',
}

/*
 * A flame is taller than it is wide — the reference's squares were part of why it
 * looked like a bulb. The widths stay exactly as the design sets them per tier;
 * the height is derived, and the inner layers are proportionally shorter so the
 * body shows above them, the way the cones of a real flame sit low.
 */
const HEIGHT_RATIO = { flameA: 1.34, flameB: 1.28, flameC: 1.22 }

/* Nothing is centred on the same axis: the inner layers step off it, in px at scale 1. */
const NUDGE = { flameA: 0, flameB: -1.4, flameC: 1 }

/* The layers are stacked, not screened, on a light page — so the inner ones let
 * the body through instead of sitting on it like three separate stickers. */
const LAYER_OPACITY = { flameA: 0.94, flameB: 0.82, flameC: 0.72 }

/*
 * One entry per tier, hottest first so the first match wins. `size` is the
 * container; `ember` is the halo; `body` is A → B → (C) with the width and
 * `bottom` the design uses at that tier, and its two gradient colours.
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

/* The design's three cadences, verbatim. */
const DURATION = { flameA: '2.85s', flameB: '2.15s', flameC: '1.62s' }
const EASING = 'cubic-bezier(.45,0,.55,1)'

/*
 * The design's highlight and inset glow, kept. The gradient runs down the flame,
 * so the white-hot stop lands at the BASE and the colour at the tip — which is
 * where the heat is in real fire, and which the -45° rotation used to scramble.
 */
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
            marginInlineStart: px(NUDGE[layer.anim] || 0),
            width: px(layer.w),
            height: px(layer.w * HEIGHT_RATIO[layer.anim]),
            /* the silhouette: a leaning flame outline, standing up */
            clipPath: FLAME_SHAPE[layer.anim],
            opacity: LAYER_OPACITY[layer.anim],
            /* it sways from where it is anchored — the bottom, like real fire */
            transformOrigin: '50% 100%',
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
