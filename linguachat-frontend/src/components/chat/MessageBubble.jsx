import { LinguaAvatar } from '../ui/LinguaAvatar'
import { TutorFeedback } from './TutorFeedback'
import { LearningAction } from './LearningAction'
import { useApp } from '../../context/AppContext'

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message }) {
  const { selectedMessage, selectMessage, submitMissionOption, isTyping, activeMissionDetails } = useApp()
  const isUser = message.role === 'user'
  const isSelected = selectedMessage?.id === message.id
  const isCurrentMissionStep = Boolean(
    activeMissionDetails?.step?.id &&
    message.missionStepId === activeMissionDetails.step.id
  )
  const hasFeedback = message.feedback &&
    (message.feedback.correction || message.feedback.why ||
     message.feedback.suggestion || message.feedback.translation ||
     message.feedback.learningAction || message.feedback.focus || message.feedback.wordToUse)

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-message-in">
        <div className="flex flex-col items-end gap-1">
          <div className="bubble-user">{message.text}</div>
          <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{formatTime(message.ts)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 mb-5 animate-message-in">
      <LinguaAvatar size={34} online className="mt-0.5" />
      <div className="flex flex-col gap-0.5" style={{ maxWidth: '85%' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--violet)', letterSpacing: '0.04em', marginBottom: 2 }}>
          Lingua
        </span>
        <div
          className={`bubble-lingua cursor-pointer transition-all duration-200 ${
            isSelected ? 'ring-2' : 'hover:ring-1'
          }`}
          style={{ '--tw-ring-color': 'var(--blue)', '--tw-ring-offset-shadow': 'none' }}
          onClick={() => hasFeedback && selectMessage(message)}
          title={hasFeedback ? 'Click to see notes' : ''}
        >
          {message.text}
        </div>

        {hasFeedback && <TutorFeedback feedback={message.feedback} />}
        <LearningAction action={message.feedback?.learningAction} />

        {Array.isArray(message.missionOptions) && message.missionOptions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.missionOptions.map(option => (
              <button
                key={option.id}
                type="button"
                disabled={isTyping || !isCurrentMissionStep}
                onClick={() => submitMissionOption(option)}
                className="rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:-translate-y-px active:scale-[0.98]"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--ink)',
                  opacity: isTyping || !isCurrentMissionStep ? 0.55 : 1,
                }}
              >
                {option.text}
              </button>
            ))}
          </div>
        )}

        <span style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>{formatTime(message.ts)}</span>
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4 animate-message-in">
      <LinguaAvatar size={34} online />
      <div className="flex flex-col gap-1">
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--violet)' }}>Lingua</span>
        <div className="bubble-lingua flex items-center gap-1.5 py-3">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  )
}
