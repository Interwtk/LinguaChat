/*
 * PracticeToolbar — four things to ask Lingua, one tap away.
 *
 * These are NOT new capabilities and NOT a second assistant. Each button fills
 * the input with a real prompt and hands it to the conversation flow that already
 * exists, so the learner can see what was asked and edit it before sending. The
 * full quick-prompt panel is still there behind the toolbar for the rest.
 *
 * Four is the limit on purpose: a row of tools that scrolls is a row nobody reads.
 * Role play opens the guided situations when the screen offers them: those are the
 * conversations the tutor can really follow.
 */
export function PracticeToolbar({ t, onUsePrompt, onOpenScenarios }) {
  const actions = [
    { id: 'correct', label: t('correctMe'), prompt: 'Correct my next sentence and give me one tiny challenge.' },
    { id: 'explain', label: t('explainSimple'), prompt: 'Explain the next correction in very simple words.' },
    { id: 'roleplay', label: onOpenScenarios ? t('scenarioChip') : t('roleplay'), prompt: 'Start a short cafe roleplay with me.' },
    { id: 'question', label: t('askMeQuestion'), prompt: 'Ask me one question for my level.' },
  ]

  return (
    <div className="practice-toolbar" role="group" aria-label={t('practiceTools')}>
      {actions.map(action => (
        <button key={action.id} type="button" className="tool-chip"
          onClick={() => (action.id === 'roleplay' && onOpenScenarios ? onOpenScenarios() : onUsePrompt(action.prompt))}>
          {action.label}
        </button>
      ))}
    </div>
  )
}

export default PracticeToolbar
