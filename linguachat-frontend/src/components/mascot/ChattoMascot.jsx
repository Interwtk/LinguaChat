import { useState } from 'react'
import chattoOfficial from '../../assets/chatto/chatto-official.png'
import chattoWelcome from '../../assets/chatto/chatto-welcome.png'
import chattoCelebrate from '../../assets/chatto/chatto-celebrate.png'
import chattoThinking from '../../assets/chatto/chatto-thinking.png'
import chattoSupportive from '../../assets/chatto/chatto-supportive.png'
import chattoCalm from '../../assets/chatto/chatto-calm.png'

/*
 * ChattoMascot - LinguaChat's official mascot.
 * The PNG assets in src/assets/chatto are the primary visuals.
 * The original SVG stays here as a fallback if an image cannot load.
 *
 * Props:
 *   mood       'happy' | 'calm' | 'cheering' | 'thinking' | 'supportive' | 'celebrating' | 'welcoming'
 *   size       'small' | 'medium' | 'large' | number (px, the mascot square) - default 'medium' (96)
 *   message    optional short caption rendered under the mascot
 *   animated   boolean - default true (still respects prefers-reduced-motion)
 *   variant    optional gradient accent for fallback/glow: 'violet' (default) | 'coral' | 'green'
 *   decorative boolean - when true, hides the image from assistive tech
 */

const SIZES = { small: 64, medium: 96, large: 128 }

const MOODS = {
  happy:       { eyes: 'open', mouth: 'smile',    cheeks: true,  sparkle: false, halo: false, anim: 'float', asset: chattoOfficial },
  calm:        { eyes: 'soft', mouth: 'gentle',   cheeks: false, sparkle: false, halo: false, anim: 'float', asset: chattoCalm },
  cheering:    { eyes: 'open', mouth: 'open',     cheeks: true,  sparkle: true,  halo: true,  anim: 'glow',  asset: chattoCelebrate },
  thinking:    { eyes: 'up',   mouth: 'small',    cheeks: false, sparkle: false, halo: false, anim: 'float', asset: chattoThinking },
  supportive:  { eyes: 'soft', mouth: 'warm',     cheeks: false, sparkle: false, halo: false, anim: 'float', asset: chattoSupportive },
  celebrating: { eyes: 'arc',  mouth: 'open',     cheeks: true,  sparkle: true,  halo: true,  anim: 'bounce', asset: chattoCelebrate },
  welcoming:   { eyes: 'open', mouth: 'warm',     cheeks: true,  sparkle: true,  halo: true,  anim: 'float', asset: chattoWelcome },
}

const ACCENTS = {
  violet: ['var(--violet)', 'var(--blue)'],
  coral:  ['var(--coral)', 'var(--yellow)'],
  green:  ['var(--green)', 'var(--blue)'],
}

function Mouth({ kind }) {
  const stroke = { stroke: 'rgba(255,255,255,0.92)', strokeWidth: 4, strokeLinecap: 'round', fill: 'none' }
  switch (kind) {
    case 'open':
      return <path d="M40 60 Q50 74 60 60 Q50 66 40 60 Z" fill="rgba(255,255,255,0.92)" stroke="none" />
    case 'gentle':
      return <path d="M42 62 Q50 68 58 62" {...stroke} />
    case 'small':
      return <circle cx="50" cy="63" r="3.4" fill="rgba(255,255,255,0.92)" />
    case 'warm':
      return <path d="M41 61 Q50 71 59 61" {...stroke} />
    case 'smile':
    default:
      return <path d="M41 60 Q50 72 59 60" {...stroke} />
  }
}

function Eye({ cx, kind }) {
  if (kind === 'arc') {
    return <path d={`M${cx - 8} 46 Q${cx} 38 ${cx + 8} 46`} stroke="rgba(255,255,255,0.95)" strokeWidth="4" strokeLinecap="round" fill="none" />
  }
  const ry = kind === 'soft' ? 6 : 9
  const pupilDy = kind === 'up' ? -2.5 : 0
  return (
    <g>
      <ellipse cx={cx} cy="44" rx="7" ry={ry} fill="#FFFDF8" />
      <circle cx={cx} cy={44 + pupilDy} r="3.6" fill="#1F2933" />
      <circle cx={cx + 1.4} cy={42.6 + pupilDy} r="1.2" fill="#FFFFFF" />
    </g>
  )
}

function ChattoFallbackSvg({ mood, px, animated, variant }) {
  const config = MOODS[mood] || MOODS.happy
  const [from, to] = ACCENTS[variant] || ACCENTS.violet
  const gid = `chatto-grad-${variant}`
  const hid = `chatto-halo-${variant}`
  const eyesClass = animated ? 'chatto-eyes' : ''

  return (
    <svg viewBox="0 0 100 100" width={px} height={px} fill="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <radialGradient id={hid} cx="50%" cy="46%" r="50%">
          <stop offset="0%" stopColor={from} stopOpacity="0.5" />
          <stop offset="70%" stopColor={from} stopOpacity="0.12" />
          <stop offset="100%" stopColor={from} stopOpacity="0" />
        </radialGradient>
      </defs>

      {config.halo && (
        <circle
          className={animated ? 'chatto-halo' : ''}
          cx="50" cy="44" r="46"
          fill={`url(#${hid})`}
          opacity={animated ? undefined : 0.5}
        />
      )}

      <ellipse cx="50" cy="92" rx="26" ry="5" fill="rgba(31,41,51,0.12)" />
      <path
        d="M50 8
           C26 8 12 22 12 42
           C12 60 24 72 42 75
           L34 90
           L52 74
           C72 72 88 60 88 42
           C88 22 74 8 50 8 Z"
        fill={`url(#${gid})`}
      />
      <ellipse cx="42" cy="26" rx="20" ry="11" fill="rgba(255,255,255,0.18)" />
      <g className={eyesClass} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <Eye cx={38} kind={config.eyes} />
        <Eye cx={62} kind={config.eyes} />
      </g>
      {config.cheeks && (
        <g opacity="0.55">
          <circle cx="30" cy="56" r="5" fill="rgba(255,255,255,0.35)" />
          <circle cx="70" cy="56" r="5" fill="rgba(255,255,255,0.35)" />
        </g>
      )}
      <Mouth kind={config.mouth} />
      {config.sparkle && (
        <g className={animated ? 'chatto-sparkle' : ''}>
          <path d="M82 20 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2 Z" fill="var(--yellow)" />
        </g>
      )}
    </svg>
  )
}

export function ChattoMascot({
  mood = 'happy',
  size = 'medium',
  message = null,
  animated = true,
  variant = 'violet',
  decorative = false,
}) {
  const config = MOODS[mood] || MOODS.happy
  const px = typeof size === 'number' ? size : (SIZES[size] || SIZES.medium)
  const floatClass = animated ? `chatto-${config.anim}` : ''
  const moodClass = `chatto-${mood}`
  const [useFallback, setUseFallback] = useState(false)

  return (
    <div className="chatto-official flex flex-col items-center" style={{ userSelect: 'none' }}>
      <div
        className={`${floatClass} ${moodClass}`}
        style={{ width: px, height: px, lineHeight: 0 }}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : `Chatto, LinguaChat mascot (${mood})`}
        aria-hidden={decorative ? 'true' : undefined}
      >
        {useFallback ? (
          <ChattoFallbackSvg mood={mood} px={px} animated={animated} variant={variant} />
        ) : (
          <img
            className="chatto-image"
            src={config.asset}
            alt={decorative ? '' : `Chatto, LinguaChat mascot (${mood})`}
            width={px}
            height={px}
            draggable="false"
            onError={() => setUseFallback(true)}
          />
        )}
      </div>

      {message && (
        <div
          className="rounded-2xl px-4 py-2.5 mt-3 text-center"
          style={{
            background: 'var(--bg-paper)',
            border: '1px solid var(--border)',
            maxWidth: 280,
          }}
        >
          <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.45 }}>{message}</p>
        </div>
      )}
    </div>
  )
}

export default ChattoMascot
