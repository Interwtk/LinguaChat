import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { sendChatMessage } from '../services/api'
import {
  ensureLanguagePreferences,
  setInterfaceLanguage as persistInterfaceLanguage,
  setNativeLanguage as persistNativeLanguage,
} from '../services/language'
import {
  clearStoredProgress,
  createEmptyProgress,
  createSessionId,
  getOrCreateSessionId,
  loadLocalProgress,
  loadStoredMessages,
  recordPractice,
  recordMissionProgress,
  saveLocalProgress,
  saveStoredMessages,
} from '../services/localProgress'
import { translate } from '../i18n/translations'
import {
  advanceMission,
  completeMission,
  createMissionCompleteMessage,
  createMissionFeedbackMessage,
  createMissionIntroMessage,
  createMissionStepMessage,
  evaluateMissionStep,
  getActiveMissionDetails,
  getMissionForToday,
  loadActiveMission,
  loadCompletedMissions,
  saveCompletedMissions,
  saveActiveMission,
  startMission as createActiveMission,
  clearMissionStorage,
} from '../services/missions'
import {
  DEFAULT_TUTOR_PREFERENCES,
  loadActiveCompanion,
  loadTextSize,
  loadTutorPreferences,
  saveActiveCompanion,
  saveTextSize,
  saveTutorPreferences,
} from '../services/tutorPreferences'

const AppContext = createContext(null)

const DEFAULT_PROFILE = {
  name: '',
  email: '',
  goal: '',
  style: 'Friendly',
  level: 'B1',
  dailyGoal: 10,
  tutorPersonality: 'Gentle Guide',
  preferences: null,
  placementResult: null,
  moodColor: 'violet',
}

function checkAuth() {
  try {
    return (
      localStorage.getItem('lc2-auth') === 'true' ||
      localStorage.getItem('lc2-onboarded') === 'true'
    )
  } catch { return false }
}

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'lingua',
  text: "Hi! I'm Lingua, your English companion. Ready to practice? You can write anything in English, ask for a word in Spanish, or just say hello. Mistakes are welcome here.",
  feedback: null,
  ts: Date.now(),
}

export function AppProvider({ children }) {
  // Auth/setup flow: null = main app, 'entry'/'login'/'signup'/'forgot'/'placement'/'tutor-personality'/'learning-prefs' = flow screens
  const [authStep, setAuthStep] = useState(() => {
    if (checkAuth()) return null
    return 'entry'
  })
  const [languagePreferences, setLanguagePreferences] = useState(ensureLanguagePreferences)
  const nativeLanguageInfo = languagePreferences.nativeLanguage
  const interfaceLanguageInfo = languagePreferences.interfaceLanguage
  const targetLanguage = languagePreferences.targetLanguage

  const [authUser, setAuthUser] = useState(() => {
    try {
      const s = localStorage.getItem('lc2-user')
      return s ? JSON.parse(s) : null
    } catch { return null }
  })

  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('lc2-dark') === 'true' } catch { return false }
  })
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    try { return localStorage.getItem('lc2-onboarded') === 'true' } catch { return false }
  })
  const [profile, setProfile] = useState(() => {
    try {
      const s = localStorage.getItem('lc2-profile')
      return s ? { ...DEFAULT_PROFILE, ...JSON.parse(s) } : DEFAULT_PROFILE
    } catch { return DEFAULT_PROFILE }
  })
  const [view, setView] = useState('today')
  const [sessionId, setSessionId] = useState(getOrCreateSessionId)
  const [messages, setMessages] = useState(() => loadStoredMessages(WELCOME_MESSAGE))
  const [localProgress, setLocalProgress] = useState(loadLocalProgress)
  const [activeMission, setActiveMission] = useState(loadActiveMission)
  const [completedMissions, setCompletedMissions] = useState(loadCompletedMissions)
  const [tutorPreferences, setTutorPreferencesState] = useState(loadTutorPreferences)
  const [activeCompanion, setActiveCompanionState] = useState(loadActiveCompanion)
  const [textSize, setTextSizeState] = useState(loadTextSize)
  const [showWelcome, setShowWelcome] = useState(false)
  const [missionFeedback, setMissionFeedback] = useState(null)
  const [missionCelebration, setMissionCelebration] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [connectionNotice, setConnectionNotice] = useState(null)
  const [memoryNotice, setMemoryNotice] = useState(null)
  const [mobileSheet, setMobileSheet] = useState(null) // 'journey' | 'notes' | null
  const messagesEndRef = useRef(null)
  const restoredMissionRef = useRef(false)

  useEffect(() => {
    const root = document.documentElement
    darkMode ? root.classList.add('dark') : root.classList.remove('dark')
    try { localStorage.setItem('lc2-dark', darkMode) } catch {}
  }, [darkMode])

  useEffect(() => {
    const root = document.documentElement
    root.lang = interfaceLanguageInfo.code
    root.dir = interfaceLanguageInfo.base === 'ar' ? 'rtl' : 'ltr'
    root.dataset.textSize = textSize
  }, [interfaceLanguageInfo, textSize])

  useEffect(() => {
    try { localStorage.setItem('lc2-profile', JSON.stringify(profile)) } catch {}
  }, [profile])

  useEffect(() => {
    saveStoredMessages(messages)
  }, [messages])

  useEffect(() => {
    saveLocalProgress(localProgress)
  }, [localProgress])

  useEffect(() => {
    saveActiveMission(activeMission)
  }, [activeMission])

  useEffect(() => {
    saveCompletedMissions(completedMissions)
  }, [completedMissions])

  useEffect(() => {
    saveTutorPreferences(tutorPreferences)
  }, [tutorPreferences])

  useEffect(() => {
    saveActiveCompanion(activeCompanion)
  }, [activeCompanion])

  useEffect(() => {
    saveTextSize(textSize)
  }, [textSize])

  const toggleDark = useCallback(() => setDarkMode(d => !d), [])
  const setThemeDark = useCallback((value) => setDarkMode(Boolean(value)), [])

  const nativeLanguage = nativeLanguageInfo.base
  const interfaceLanguage = interfaceLanguageInfo.base
  const t = useCallback((key, params) => translate(interfaceLanguageInfo.base, key, params), [interfaceLanguageInfo.base])

  const updateNativeLanguage = useCallback((language) => {
    const native = persistNativeLanguage(language)
    const nextInterface = persistInterfaceLanguage(native)
    setLanguagePreferences(previous => ({
      ...previous,
      nativeLanguage: native,
      interfaceLanguage: nextInterface,
    }))
  }, [])

  const updateInterfaceLanguage = useCallback((language) => {
    const nextInterface = persistInterfaceLanguage(language)
    setLanguagePreferences(previous => ({
      ...previous,
      interfaceLanguage: nextInterface,
    }))
  }, [])

  const loginMock = useCallback((email) => {
    let user = null
    try {
      const stored = localStorage.getItem('lc2-user')
      if (stored) user = JSON.parse(stored)
    } catch {}
    if (!user) user = { name: email.split('@')[0], email }
    setAuthUser(user)
    setProfile(prev => ({ ...prev, name: user.name, email: user.email }))
    localStorage.setItem('lc2-user', JSON.stringify(user))
    localStorage.setItem('lc2-auth', 'true')
    localStorage.setItem('lc2-onboarded', 'true')
    setOnboardingCompleted(true)
    setAuthStep(null)
  }, [])

  const signupMock = useCallback((name, email) => {
    const user = { name, email }
    setAuthUser(user)
    setProfile(prev => ({ ...prev, name, email }))
    localStorage.setItem('lc2-user', JSON.stringify(user))
    setAuthStep('placement')
  }, [])

  const completePlacement = useCallback((result) => {
    setProfile(prev => ({ ...prev, level: result.level, placementResult: result }))
    localStorage.setItem('lc2-placement', JSON.stringify(result))
    localStorage.setItem('lc2-placement-result', JSON.stringify(result))
    setAuthStep('level-reveal')
  }, [])

  const completeTutorPersonality = useCallback((personality) => {
    setProfile(prev => ({ ...prev, tutorPersonality: personality }))
    setAuthStep('learning-prefs')
  }, [])

  const completeLearningPrefs = useCallback((prefs) => {
    setProfile(prev => ({
      ...prev,
      preferences: prefs,
      goal: prefs.goals?.[0] || 'Travel',
      dailyGoal: prefs.dailyGoal || 10,
    }))
    // Final onboarding beat: guided AI personalization with Chatto.
    setAuthStep('personalize')
  }, [])

  // User finished the guided personalization step (tutor preferences are already
  // persisted live). Mark onboarding complete and arm Chatto's Home welcome once.
  const completePersonalization = useCallback(() => {
    try {
      localStorage.setItem('lc2-auth', 'true')
      localStorage.setItem('lc2-onboarded', 'true')
      localStorage.setItem('lc2-personalization-completed', 'true')
      localStorage.setItem('lc2-welcome-seen', 'false')
    } catch {}
    setOnboardingCompleted(true)
    setView('today')
    setShowWelcome(true)
    setAuthStep(null)
  }, [])

  // Recommended path: skip the guided questions and start Lingua with a
  // balanced, friendly setup. Mirrors the defaults the manual flow produces.
  const applyRecommendedSetup = useCallback(() => {
    setProfile(prev => ({
      ...prev,
      tutorPersonality: prev.tutorPersonality || 'Gentle Guide',
      preferences: {
        goals: ['Travel'],
        dailyGoal: 10,
        correctionIntensity: 'Balanced',
        practiceVibe: 'Motivational',
      },
      goal: prev.goal || 'Travel',
      dailyGoal: 10,
    }))
    setTutorPreferencesState(saveTutorPreferences(DEFAULT_TUTOR_PREFERENCES))
    completePersonalization()
  }, [completePersonalization])

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false)
    try { localStorage.setItem('lc2-welcome-seen', 'true') } catch {}
  }, [])

  const logoutMock = useCallback(() => {
    localStorage.removeItem('lc2-auth')
    localStorage.removeItem('lc2-user')
    setAuthUser(null)
    setAuthStep('entry')
  }, [])

  const completeOnboarding = useCallback((profileData) => {
    const merged = { ...DEFAULT_PROFILE, ...profileData }
    setProfile(merged)
    setOnboardingCompleted(true)
    try { localStorage.setItem('lc2-onboarded', 'true') } catch {}
    setView('today')
  }, [])

  const updateProfile = useCallback((updates) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }, [])

  const updateTutorPreferences = useCallback((updates) => {
    setTutorPreferencesState(previous => saveTutorPreferences({
      ...previous,
      ...updates,
      interests: updates?.interests || previous.interests,
    }))
  }, [])

  const setActiveCompanion = useCallback((companion) => {
    setActiveCompanionState(saveActiveCompanion(companion))
  }, [])

  const setTextSize = useCallback((size) => {
    setTextSizeState(saveTextSize(size))
  }, [])

  const navigateTo = useCallback((destination) => {
    setView(destination)
    setMobileSheet(null)
  }, [])

  const appendLinguaMessages = useCallback((nextMessages) => {
    const list = Array.isArray(nextMessages) ? nextMessages.filter(Boolean) : [nextMessages].filter(Boolean)
    if (!list.length) return
    setMessages(previous => [...previous, ...list])
    setSelectedMessage(list[list.length - 1])
  }, [])

  const missionContextFromDetails = useCallback((details) => {
    if (!details?.mission || !details?.step) return null
    return {
      mission_id: details.mission.id,
      mission_title: details.mission.title,
      step_id: details.step.id,
      step_type: details.step.type,
      target_skill: details.mission.targetSkill,
      instruction: details.step.instruction,
      prompt: details.step.prompt,
      expected_pattern: details.step.expectedPattern || null,
      options: details.step.options || null,
    }
  }, [])

  const startPracticeMission = useCallback((mission = null) => {
    const selectedMission = mission || getMissionForToday(profile.level, profile.goal)
    const active = createActiveMission(selectedMission)
    setActiveMission(active)
    setMissionFeedback(null)
    setMissionCelebration(null)
    appendLinguaMessages([
      createMissionIntroMessage(selectedMission),
      createMissionStepMessage(getActiveMissionDetails(active)),
    ])
    setView('practice')
    setMobileSheet(null)
  }, [appendLinguaMessages, profile.goal, profile.level])

  const submitMissionStep = useCallback(async (value, displayText = null) => {
    const details = getActiveMissionDetails(activeMission)
    if (!details?.step) return
    const answerText = displayText || value
    setMessages(previous => [...previous, {
      id: `u${Date.now()}`,
      role: 'user',
      text: answerText,
      ts: Date.now(),
      missionId: details.mission.id,
      missionStepId: details.step.id,
    }])
    setIsTyping(true)

    let response = null
    let evaluation = null
    try {
      const history = messages.slice(-8).map(m => ({
        role: m.role,
        text: m.text,
        correction: m.feedback?.correction || null,
      }))
      response = await sendChatMessage({
        message: answerText,
        level: profile.level,
        mode: profile.style,
        history,
        sessionId,
        nativeLanguage: nativeLanguageInfo,
        interfaceLanguage: interfaceLanguageInfo,
        targetLanguage,
        preferences: {
          goal: profile.goal,
          style: profile.style,
          tutor_personality: profile.tutorPersonality,
          native_language: nativeLanguageInfo,
          interface_language: interfaceLanguageInfo,
          target_language: targetLanguage,
          topics: profile.preferences?.goals || [],
        },
        tutorPreferences,
        activeCompanion,
        missionContext: missionContextFromDetails(details),
      })
    } catch {}

    if (response?.mission_feedback) {
      evaluation = {
        passed: Boolean(response.mission_feedback.should_advance),
        feedback: response.mission_feedback.feedback,
        correction: response.mission_feedback.corrected_answer || response.correction || null,
        explanation: response.explanation || response.mission_feedback.hint || null,
        nextSuggestion: response.suggestion || response.mission_feedback.hint || null,
      }
    } else {
      evaluation = evaluateMissionStep(details.step, value)
    }

    if (!evaluation.passed) {
      setMissionFeedback({ passed: false, text: evaluation.feedback })
      setTimeout(() => {
        setIsTyping(false)
        appendLinguaMessages({
          id: `mission-feedback-${details.step.id}-${Date.now()}`,
          role: 'lingua',
          text: response?.reply || evaluation.feedback,
          feedback: {
            correction: evaluation.correction || null,
            why: evaluation.explanation || null,
            suggestion: evaluation.nextSuggestion || 'Try this same step once more.',
            focus: details.mission.targetSkill,
          },
          missionId: details.mission.id,
          missionStepId: details.step.id,
          missionType: 'feedback',
          ts: Date.now(),
        })
      }, 650)
      return
    }

    const advanced = advanceMission(activeMission, details.step, value, evaluation)
    setLocalProgress(previous => recordMissionProgress(previous, {
      mission: details.mission,
      step: details.step,
      earnedXp: advanced.earnedThisStep,
      completed: false,
    }))

    if (advanced.activeMission.currentStepIndex >= details.mission.steps.length) {
      const completed = completeMission(advanced.activeMission)
      setActiveMission(null)
      setCompletedMissions(previous => [completed, ...previous].slice(0, 50))
      setLocalProgress(previous => recordMissionProgress(previous, {
        mission: details.mission,
        step: details.step,
        earnedXp: Math.max(0, details.mission.rewardXp - completed.earnedXp),
        completed: true,
      }))
      setMissionCelebration({
        title: details.mission.title,
        xp: details.mission.rewardXp,
        message: 'Mision completada. Lingua guardo tu avance en este dispositivo.',
      })
      setMissionFeedback({
        passed: evaluation.passed,
        text: evaluation.feedback,
      })
      setTimeout(() => {
        setIsTyping(false)
        appendLinguaMessages([
          response
            ? {
                id: `mission-feedback-${details.step.id}-${Date.now()}`,
                role: 'lingua',
                text: `${response.reply} +${advanced.earnedThisStep} XP.`,
                feedback: {
                  correction: response.correction || evaluation.correction || null,
                  why: response.explanation || evaluation.explanation || null,
                  suggestion: response.suggestion || evaluation.nextSuggestion || null,
                  learningAction: response.learning_action || null,
                  focus: response.focus || details.mission.targetSkill,
                  wordToUse: response.word_to_use || null,
                },
                missionId: details.mission.id,
                missionStepId: details.step.id,
                missionType: 'feedback',
                ts: Date.now(),
              }
            : createMissionFeedbackMessage(details.mission, details.step, evaluation, advanced.earnedThisStep),
          createMissionCompleteMessage(details.mission, completed),
        ])
      }, 650)
      return
    }

    setActiveMission(advanced.activeMission)
    setMissionFeedback({
      passed: evaluation.passed,
      text: evaluation.feedback,
    })
    setTimeout(() => {
      setIsTyping(false)
      appendLinguaMessages([
        response
          ? {
              id: `mission-feedback-${details.step.id}-${Date.now()}`,
              role: 'lingua',
              text: `${response.reply} +${advanced.earnedThisStep} XP.`,
              feedback: {
                correction: response.correction || evaluation.correction || null,
                why: response.explanation || evaluation.explanation || null,
                suggestion: response.suggestion || evaluation.nextSuggestion || null,
                learningAction: response.learning_action || null,
                focus: response.focus || details.mission.targetSkill,
                wordToUse: response.word_to_use || null,
              },
              missionId: details.mission.id,
              missionStepId: details.step.id,
              missionType: 'feedback',
              ts: Date.now(),
            }
          : createMissionFeedbackMessage(details.mission, details.step, evaluation, advanced.earnedThisStep),
        createMissionStepMessage(getActiveMissionDetails(advanced.activeMission)),
      ])
    }, 650)
  }, [activeCompanion, activeMission, appendLinguaMessages, interfaceLanguageInfo, messages, missionContextFromDetails, nativeLanguageInfo, profile, sessionId, targetLanguage, tutorPreferences])

  const submitMissionOption = useCallback((option) => {
    if (!option) return
    submitMissionStep(option.id, option.text)
  }, [submitMissionStep])

  const abandonMission = useCallback(() => {
    saveActiveMission(null)
    setActiveMission(null)
    setMissionFeedback(null)
    setMissionCelebration(null)
    appendLinguaMessages({
      id: `mission-exit-${Date.now()}`,
      role: 'lingua',
      text: 'Salimos de la mision. Seguimos en chat libre cuando quieras.',
      feedback: null,
      missionType: 'exit',
      ts: Date.now(),
    })
  }, [appendLinguaMessages])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return

    const missionDetails = getActiveMissionDetails(activeMission)
    if (missionDetails?.step) {
      submitMissionStep(text.trim())
      return
    }

    const userMsg = {
      id: `u${Date.now()}`,
      role: 'user',
      text: text.trim(),
      ts: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)
    setSelectedMessage(null)

    try {
      const history = messages.slice(-8).map(m => ({
        role: m.role,
        text: m.text,
        correction: m.feedback?.correction || null,
      }))
      const response = await sendChatMessage({
        message: text.trim(),
        level: profile.level,
        mode: profile.style,
        history,
        sessionId,
        nativeLanguage: nativeLanguageInfo,
        interfaceLanguage: interfaceLanguageInfo,
        targetLanguage,
        preferences: {
          goal: profile.goal,
          style: profile.style,
          tutor_personality: profile.tutorPersonality,
          native_language: nativeLanguageInfo,
          interface_language: interfaceLanguageInfo,
          target_language: targetLanguage,
          detected_level: profile.placementResult?.detectedLevel || profile.level,
          correction_style: profile.placementResult?.recommendedCorrectionStyle || profile.preferences?.correctionIntensity,
          topics: profile.preferences?.goals || [],
        },
        tutorPreferences,
        activeCompanion,
      })

      setConnectionNotice(response.connectionMessage)
      setMemoryNotice(response.correction
        ? 'Your recent corrections are saved on this device.'
        : "I'll remember what we practiced today.")
      setLocalProgress(previous => recordPractice(previous, {
        userMessage: text.trim(),
        response,
      }))

      const linguaMsg = {
        id: `l${Date.now()}`,
        role: 'lingua',
        text: response.reply,
        feedback: {
          correction:  response.correction  || null,
          why:         response.explanation || null,
          suggestion:  response.suggestion  || null,
          learningAction: response.learning_action || null,
          focus: response.focus || null,
          wordToUse: response.word_to_use || null,
          translation: null,
        },
        ts: Date.now(),
      }
      setMessages(prev => [...prev, linguaMsg])
      setSelectedMessage(linguaMsg)
    } catch {
      setConnectionNotice('Lingua had trouble connecting. You can keep exploring the demo.')
      setMessages(prev => [...prev, {
        id: `e${Date.now()}`,
        role: 'lingua',
        text: 'You can keep practicing with the demo while the connection recovers.',
        feedback: null,
        ts: Date.now(),
      }])
    } finally {
      setIsTyping(false)
    }
  }, [activeCompanion, activeMission, interfaceLanguageInfo, messages, nativeLanguageInfo, profile, sessionId, submitMissionStep, targetLanguage, tutorPreferences])

  useEffect(() => {
    if (restoredMissionRef.current) return
    const details = getActiveMissionDetails(activeMission)
    if (!details?.step) return
    restoredMissionRef.current = true
    const hasCurrentStep = messages.some(message =>
      message.missionId === details.mission.id && message.missionStepId === details.step.id && message.missionType === 'step'
    )
    if (!hasCurrentStep) {
      appendLinguaMessages([
        createMissionIntroMessage(details.mission, true),
        createMissionStepMessage(details),
      ])
    }
  }, [activeMission, appendLinguaMessages, messages])

  const selectMessage = useCallback((msg) => {
    setSelectedMessage(prev => prev?.id === msg.id ? null : msg)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([WELCOME_MESSAGE])
    setSelectedMessage(null)
  }, [])

  const resetLocalProgress = useCallback(() => {
    if (!window.confirm('Reset local chat history and progress on this device?')) return
    clearStoredProgress()
    setSessionId(createSessionId())
    setMessages([WELCOME_MESSAGE])
    setLocalProgress(createEmptyProgress())
    setSelectedMessage(null)
    setConnectionNotice(null)
    setMemoryNotice(null)
    clearMissionStorage()
    setActiveMission(null)
    setCompletedMissions([])
    setMissionFeedback(null)
    setMissionCelebration(null)
    setView('today')
  }, [])

  const activeMissionDetails = getActiveMissionDetails(activeMission)

  return (
    <AppContext.Provider value={{
      authStep, setAuthStep,
      nativeLanguage, nativeLanguageInfo,
      interfaceLanguage, interfaceLanguageInfo,
      targetLanguage,
      setNativeLanguage: updateNativeLanguage,
      updateNativeLanguage,
      updateInterfaceLanguage,
      t,
      authUser,
      loginMock, signupMock,
      completePlacement, completeTutorPersonality, completeLearningPrefs,
      completePersonalization, applyRecommendedSetup,
      showWelcome, dismissWelcome,
      logoutMock,
      darkMode, toggleDark, setThemeDark,
      onboardingCompleted, completeOnboarding,
      profile, updateProfile,
      tutorPreferences, updateTutorPreferences,
      activeCompanion, setActiveCompanion,
      textSize, setTextSize,
      view, navigateTo,
      activeMission, activeMissionDetails, completedMissions,
      missionFeedback, missionCelebration,
      startPracticeMission, submitMissionStep, submitMissionOption, abandonMission,
      messages, sendMessage, clearMessages, isTyping,
      sessionId, localProgress, resetLocalProgress,
      connectionNotice, memoryNotice,
      selectedMessage, selectMessage,
      mobileSheet, setMobileSheet,
      messagesEndRef,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
