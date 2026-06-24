/* Abstract geometric avatar for Lingua. Not a photo, not a generic icon. */
export function LinguaAvatar({ size = 36, online = true, className = '' }) {
  const id = `lg-${size}`
  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--violet)" />
            <stop offset="100%" stopColor="var(--blue)" />
          </linearGradient>
          <radialGradient id={`${id}-shine`} cx="35%" cy="28%" r="55%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <clipPath id={`${id}-clip`}>
            <circle cx="20" cy="20" r="20" />
          </clipPath>
        </defs>
        {/* Base */}
        <circle cx="20" cy="20" r="20" fill={`url(#${id}-grad)`} />
        {/* Geometric accent shapes */}
        <ellipse cx="12" cy="26" rx="6" ry="4" fill="rgba(255,255,255,0.08)" transform="rotate(-20 12 26)" />
        <ellipse cx="28" cy="14" rx="5" ry="3" fill="rgba(255,255,255,0.06)" transform="rotate(15 28 14)" />
        {/* L letterform */}
        <text
          x="50%"
          y="53%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={size * 0.52}
          fontWeight="700"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
          letterSpacing="-0.5"
        >
          L
        </text>
        {/* Shine */}
        <circle cx="20" cy="20" r="20" fill={`url(#${id}-shine)`} />
      </svg>
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            background: 'var(--green)',
            borderColor: 'var(--bg-main)',
          }}
        />
      )}
    </div>
  )
}
