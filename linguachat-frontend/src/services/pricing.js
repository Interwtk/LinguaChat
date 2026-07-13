/*
 * Pricing configuration — single source of truth for the plans UI.
 *
 * IMPORTANT: no paid amount has been decided for LinguaChat yet. Premium is
 * therefore shown as "coming soon" and the data below is structured for regional
 * pricing without inventing numbers. When the commercial decision is made, fill
 * PREMIUM_PRICING[region] with real amounts — the UI switches from "coming soon"
 * to a formatted price automatically. Do not hardcode prices in components.
 */

// Feature rows reference i18n keys so the comparison stays localized.
export const PLANS = [
  {
    id: 'basic',
    nameKey: 'planBasicName',
    taglineKey: 'planBasicTagline',
    price: { type: 'free' },
    featureKeys: [
      'planFeatChatDaily',
      'planFeatCorrections',
      'planFeatPlacement',
      'planFeatMissions',
      'planFeatProgress',
    ],
    ctaKey: 'planBasicCta',
    highlighted: false,
  },
  {
    id: 'premium',
    nameKey: 'planPremiumName',
    taglineKey: 'planPremiumTagline',
    price: { type: 'coming_soon' },
    featureKeys: [
      'planFeatEverythingBasic',
      'planFeatUnlimited',
      'planFeatDeeperFeedback',
      'planFeatVoiceSoon',
      'planFeatPriority',
    ],
    ctaKey: 'planPremiumCta',
    highlighted: true,
  },
]

// Regional scaffolding. Amounts stay null until a price is decided; a null amount
// renders as "coming soon". `locale` drives Intl currency formatting.
export const REGIONS = {
  US: { labelKey: 'regionUS', currency: 'USD', locale: 'en-US' },
  CL: { labelKey: 'regionCL', currency: 'CLP', locale: 'es-CL' },
  MX: { labelKey: 'regionMX', currency: 'MXN', locale: 'es-MX' },
  ES: { labelKey: 'regionES', currency: 'EUR', locale: 'es-ES' },
  BR: { labelKey: 'regionBR', currency: 'BRL', locale: 'pt-BR' },
}

export const REGION_ORDER = ['US', 'CL', 'MX', 'ES', 'BR']
export const DEFAULT_REGION = 'US'

// premium monthly amount per region — all null (undecided) on purpose.
export const PREMIUM_PRICING = { US: null, CL: null, MX: null, ES: null, BR: null }

export function formatPrice(region, amount) {
  if (amount == null) return null
  const config = REGIONS[region] || REGIONS[DEFAULT_REGION]
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount} ${config.currency}`
  }
}
