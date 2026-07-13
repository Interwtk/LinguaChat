/*
 * Episode definitions for the LinguaLoop methodology.
 *
 * Metadata + which language items the episode teaches (fed to the Memory Garden
 * on completion). The step-by-step flow lives in EpisodePlayer; localized system
 * text uses i18n keys (interface language) and native support uses vocabulary
 * meanings. Target English is stored literally and never translated.
 */
export const FIRST_EPISODE = {
  id: 'first_greeting',
  canDoId: 'introduce_self',
  level: 'Pre-A1',
  titleKey: 'ep1Title',
  goalKey: 'ep1Goal',
  canDoNameKey: 'ep1CanDoName',
  durationKey: 'ep1Duration',
  xp: 40,
  // Vocabulary ids taught here — added to the Memory Garden at the end.
  items: ['hi', 'hello', 'im', 'whats_your_name'],
  target: {
    model: 'Hi, I’m Lingua.',
    linguaAsk: 'Hi! I’m Lingua. What’s your name?',
    variation: 'Hello! I’m Alex.',
  },
}

export const EPISODES = [FIRST_EPISODE]
export const getEpisode = (id) => EPISODES.find(e => e.id === id) || null
