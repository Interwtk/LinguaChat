import { useApp } from '../../context/AppContext'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { FREE_PLAN, PREMIUM_PLAN, LATER } from '../../services/pricing'

/*
 * Plans, honestly: everything that exists is free during the beta, Premium is
 * not for sale, and what is being built is listed as NOT available. No price,
 * no region selector and no button that looks like it buys something.
 */
function Check() {
  return (
    <span aria-hidden="true" style={{
      flexShrink: 0, marginTop: 2, width: 18, height: 18, borderRadius: '50%', background: 'var(--positive-soft)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        <path d="M2 6l3 3 5-5" stroke="var(--positive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export function Pricing() {
  const { t, navigateTo } = useApp()

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div className="flex flex-col items-center text-center mb-8 animate-fade-up">
          <ChattoMascot mood="supportive" size="small" variant="green" decorative />
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)', marginTop: 12, marginBottom: 8 }}>
            {t('pricingEyebrow')}
          </p>
          <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: 'var(--ink)', lineHeight: 1.15, marginBottom: 10 }}>
            {t('pricingHonestTitle')}
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', lineHeight: 1.6, maxWidth: 480 }}>
            {t('pricingHonestSubtitle')}
          </p>
        </div>

        <div className="grid gap-4 animate-fade-up" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', animationDelay: '0.06s' }}>
          <section className="rounded-3xl p-6 flex flex-col" aria-labelledby="plan-free"
            style={{ background: 'var(--surface)', border: '1px solid var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)' }}>
            <h2 id="plan-free" style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--ink)', marginBottom: 4 }}>{t(FREE_PLAN.nameKey)}</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 }}>{t(FREE_PLAN.taglineKey)}</p>
            <p style={{ fontWeight: 900, fontSize: '1.75rem', color: 'var(--ink)', marginBottom: 16 }}>{t('planFree')}</p>
            <ul className="flex flex-col gap-2.5 mb-6" style={{ flex: 1 }}>
              {FREE_PLAN.features.map(feature => (
                <li key={feature.key} className="flex items-start gap-2.5">
                  <Check />
                  <span style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.45 }}>{t(feature.key)}</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => navigateTo('today')} className="w-full py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
              style={{ background: 'var(--accent)', color: '#fff', border: 'none', minHeight: 44 }}>
              {t(FREE_PLAN.ctaKey)}
            </button>
          </section>

          <section className="rounded-3xl p-6 flex flex-col" aria-labelledby="plan-premium"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 id="plan-premium" style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--ink)' }}>{t(PREMIUM_PLAN.nameKey)}</h2>
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', background: 'var(--surface-soft)', border: '1px solid var(--border)', padding: '3px 9px', borderRadius: 999 }}>
                {t('planNotAvailable')}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.5, marginBottom: 10, fontWeight: 700 }}>{t(PREMIUM_PLAN.taglineKey)}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.55 }}>{t(PREMIUM_PLAN.bodyKey)}</p>
          </section>
        </div>

        <section aria-labelledby="plans-later" className="rounded-2xl p-4 mt-6 animate-fade-up" style={{ animationDelay: '0.1s', background: 'var(--surface-soft)', border: '1px solid var(--border)' }}>
          <h2 id="plans-later" style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>{t('planLaterTitle')}</h2>
          <ul className="flex flex-col gap-1.5">
            {LATER.map(key => (
              <li key={key} style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5 }}>· {t(key)}</li>
            ))}
          </ul>
        </section>

        <p className="mt-4 animate-fade-up" style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.55, textAlign: 'center' }}>{t('pricingHonestNote')}</p>

        <div className="flex justify-center mt-6">
          <button type="button" onClick={() => navigateTo('today')} className="px-5 py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}>
            {t('backToToday')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Pricing
