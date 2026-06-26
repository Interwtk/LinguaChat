/*
 * Moti Moments — the emotional beats where Chatto shows up to support the user.
 * Each moment maps to a Chatto mood + i18n keys. Copy lives in translations.js,
 * so nothing here is hardcoded in a single language.
 *
 * Keep this list small on purpose: Chatto should feel special, not spammy.
 */
export const MOTI_MOMENTS = {
  placementDone:   { mood: 'cheering',    variant: 'violet', titleKey: 'motiPlacementTitle',   messageKey: 'motiPlacementMessage' },
  personalize:     { mood: 'supportive',  variant: 'violet', titleKey: 'motiPersonalizeTitle', messageKey: 'motiPersonalizeMessage' },
  preferencesSaved:{ mood: 'celebrating', variant: 'green',  titleKey: 'motiSavedTitle',      messageKey: 'motiSavedMessage' },
  welcomeHome:     { mood: 'welcoming',   variant: 'violet', titleKey: 'welcomeTitle',        messageKey: 'welcomeMessage' },
  missionComplete: { mood: 'celebrating', variant: 'coral',  titleKey: 'motiMissionTitle',    messageKey: 'motiMissionMessage' },
  struggling:      { mood: 'supportive',  variant: 'green',  titleKey: 'motiStruggleTitle',   messageKey: 'motiStruggleMessage' },
}

export function getMotiMoment(id) {
  return MOTI_MOMENTS[id] || MOTI_MOMENTS.welcomeHome
}
