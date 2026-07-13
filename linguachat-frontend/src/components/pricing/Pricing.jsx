import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ChattoMascot } from '../mascot/ChattoMascot'
import {
  PLANS,
  REGIONS,
  REGION_ORDER,
  DEFAULT_REGION,
  PREMIUM_PRICING,
  formatPrice,
} from '../../services/pricing'

function PriceLabel({ plan, region, t }) {
  if (plan.price.type === 'free') {
    return (
      <div className="flex items-baseline gap-1.5">
        <span style={{ fontWeight: 900, fontSize: '1.75rem', color: 'var(--ink)' }}>{t('planFree')}</span>
      </div>
    )
  }
  const amount = PREMIUM_PRICING[region]
  const formatted = formatPrice(region, amount)
  if (!formatted) {
    return (
      <span style={{ fontWeight: 800, fontSize: '1.1875rem', color: 'var(--violet)' }}>{t('planComingSoon')}</span>
    )
  }
  return (
    <div className="flex items-baseline gap-1">
      <span style={{ fontWeight: 900, fontSize: '1.75rem', color: 'var(--ink)' }}>{formatted}</span>
      <span style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', fontWeight: 600 }}>{t('planPerMonth')}</span>
    </div>
  )
}

function PlanCard({ plan, region, t, onChoose }) {
  const highlighted = plan.highlighted
  const isPremium = plan.id === 'premium'
  const premiumUndecided = isPremium && PREMIUM_PRICING[region] == null
  return (
    <div
      className="card-lift rounded-3xl p-6 flex flex-col"
      style={{
        background: 'var(--bg-paper)',
        border: `1.5px solid ${highlighted ? 'var(--violet)' : 'var(--border)'}`,
        boxShadow: highlighted ? '0 0 0 3px var(--violet-soft), 0 16px 40px -20px rgba(124,92,255,0.5)' : 'none',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--ink)' }}>{t(plan.nameKey)}</h2>
        {highlighted && (
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', background: 'var(--violet)', padding: '3px 9px', borderRadius: 999 }}>
            {t('planPopular')}
          </span>
        )}
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5, marginBottom: 14 }}>{t(plan.taglineKey)}</p>

      <div style={{ marginBottom: 18 }}>
        <PriceLabel plan={plan} region={region} t={t} />
      </div>

      <ul className="flex flex-col gap-2.5 mb-6" style={{ flex: 1 }}>
        {plan.featureKeys.map(key => (
          <li key={key} className="flex items-start gap-2.5">
            <span style={{
              flexShrink: 0, marginTop: 2, width: 18, height: 18, borderRadius: '50%',
              background: highlighted ? 'var(--violet-soft)' : 'var(--green-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke={highlighted ? 'var(--violet)' : 'var(--green)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.45 }}>{t(key)}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onChoose}
        disabled={premiumUndecided}
        className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:-translate-y-px active:scale-[0.98]"
        style={
          highlighted
            ? { background: 'linear-gradient(135deg, var(--violet), var(--blue))', color: '#fff', border: 'none', opacity: premiumUndecided ? 0.6 : 1, cursor: premiumUndecided ? 'not-allowed' : 'pointer' }
            : { background: 'var(--bg-elevated)', color: 'var(--ink)', border: '1.5px solid var(--border)' }
        }
      >
        {premiumUndecided ? t('planComingSoon') : t(plan.ctaKey)}
      </button>
    </div>
  )
}

export function Pricing() {
  const { t, navigateTo } = useApp()
  const [region, setRegion] = useState(DEFAULT_REGION)

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8" style={{ background: 'var(--bg-main)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8 animate-fade-up">
          <ChattoMascot mood="happy" size="small" variant="violet" decorative />
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--violet)', marginTop: 12, marginBottom: 8 }}>
            {t('pricingEyebrow')}
          </p>
          <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: 'var(--ink)', lineHeight: 1.15, marginBottom: 10 }}>
            {t('pricingTitle')}
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', lineHeight: 1.6, maxWidth: 460 }}>
            {t('pricingSubtitle')}
          </p>
        </div>

        {/* Region selector (structure ready for regional pricing) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6 animate-fade-up" style={{ animationDelay: '0.04s' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)', marginRight: 4 }}>{t('pricingRegion')}:</span>
          {REGION_ORDER.map(code => {
            const selected = region === code
            return (
              <button
                key={code}
                type="button"
                aria-pressed={selected}
                onClick={() => setRegion(code)}
                className="rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.98]"
                style={{
                  background: selected ? 'var(--violet-soft)' : 'var(--bg-elevated)',
                  border: `1.5px solid ${selected ? 'var(--violet)' : 'var(--border)'}`,
                  color: selected ? 'var(--violet)' : 'var(--ink-muted)',
                }}
              >
                {t(REGIONS[code].labelKey)}
              </button>
            )
          })}
        </div>

        {/* Plans */}
        <div className="grid gap-4 animate-fade-up" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', animationDelay: '0.08s' }}>
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              region={region}
              t={t}
              onChoose={() => plan.id === 'basic' ? navigateTo('today') : undefined}
            />
          ))}
        </div>

        {/* Honest note: pricing is not decided yet */}
        <div className="rounded-2xl p-4 mt-6 flex items-start gap-3 animate-fade-up" style={{ animationDelay: '0.12s', background: 'var(--yellow-soft)', border: '1px solid var(--yellow)' }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
          <p style={{ fontSize: '0.8125rem', color: 'var(--ink)', lineHeight: 1.55 }}>{t('pricingPendingNote')}</p>
        </div>

        <div className="flex justify-center mt-6 animate-fade-up" style={{ animationDelay: '0.16s' }}>
          <button
            type="button"
            onClick={() => navigateTo('today')}
            className="px-5 py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
            style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--border)', color: 'var(--ink)' }}
          >
            {t('backToToday')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Pricing
