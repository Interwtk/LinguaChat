/*
 * Plans — what LinguaChat honestly offers, and what it does not yet.
 *
 * Nothing is for sale during the beta. The free plan lists only features that
 * exist and work today; each one names the capability that backs it (`proof`),
 * and `scripts/check-honest-plans.mjs` fails the build when a listed feature
 * has no such capability in the code. Premium carries NO feature list: it will
 * list only what already works on the day it launches, and never safety,
 * privacy controls or the core lessons.
 *
 * The "later" list is shown under an explicit "not available now" heading, so
 * a learner can see what is being built without reading it as a promise.
 *
 * When a paid plan exists, its price, billing period, renewal and how to
 * cancel are shown before payment (docs/business/monetization-plan.md); the
 * structure for that is added then, not invented now.
 */
export const FREE_PLAN = {
  id: 'free',
  nameKey: 'planFreeName',
  taglineKey: 'planFreeTagline',
  features: [
    { key: 'planFeatLessons', proof: 'lessons' },
    { key: 'planFeatCorrections', proof: 'corrections' },
    { key: 'planFeatReviews', proof: 'reviews' },
    { key: 'planFeatPracticeChat', proof: 'practiceChat' },
    { key: 'planFeatSessions', proof: 'missions' },
    { key: 'planFeatProgress', proof: 'progress' },
    { key: 'planFeatDataControl', proof: 'dataControl' },
  ],
  ctaKey: 'planFreeCta',
}

export const PREMIUM_PLAN = {
  id: 'premium',
  nameKey: 'planPremiumName',
  taglineKey: 'planPremiumNotYetTagline',
  bodyKey: 'planPremiumNotYetBody',
  available: false,
}

/* Being built — shown only under the "not available now" heading. */
export const LATER = ['planLaterLevels', 'planLaterVoice', 'planLaterAi']
