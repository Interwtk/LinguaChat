import { readSetupCheckpoint, persistPlacementResult, SETUP_STEPS } from '../auth/setupCheckpoint.js'
import { readVerifiedProfile } from '../auth/profileRestore.js'
import { commitOnboarding } from '../auth/onboardingCommit.js'
import { captureLearnerAccess, revokeLocalLease } from '../auth/localLease.js'
import { learnerStorage as localStorage } from '../auth/localLease.js'
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getBrowserAuthService } from '../auth/provider.js'
import { authCallbackError } from '../auth/callbackError.js'
import { CLOUD_PREFERENCES_RELEASED, connectPreferenceSync, schedulePreferenceSync } from '../cloud/runtime.js'
import { createPreferenceImport, recoverCurrentPreferenceImport } from '../cloud/preferenceImport.js'
import { activateLocalAccount } from '../auth/browserDataIsolation.js'
import { sendChatMessage } from '../services/api'
import {
  ensureLanguagePreferences,
  languagePreferencePersistence,
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
import { translate, loadLocale, isLocaleReady } from '../i18n/translations'
import { loadChatAppearance, saveChatAppearance } from '../services/chatAppearance'
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
  updateTutorPreferencesDurably,
} from '../services/tutorPreferences'
// the planner works from the shape of the level; the episode itself loads when it starts
import { playableLevelId, episodesOfLevel } from '../learning/curriculum/levels.js'
import { episodeRequest } from '../learning/curriculum/episodeContent.js'

/*
 * The episodes a session may draw on. The planner itself is level-agnostic — it
 * takes whatever list it is given — so the level lives here, at the call site.
 * `playableLevelId()` derives it from the curriculum registry rather than a
 * hardcoded level id, so this keeps agreeing with Home once a second level opens.
 */
const ARC = episodesOfLevel(playableLevelId())
import { loadLearnerModel, saveLearnerModel, recordItemSeen } from '../learning/engine/learnerModel.js'
import { markFactUsed, rotateFactUsage, selectLearnerFact } from '../learning/engine/learnerFacts.js'
import {
  loadMemoryContext, dismissTopic, recordTopicUse, recentTopicIds,
} from '../learning/engine/memoryContext.js'
import { selectTopic, providerTopicContext } from '../learning/engine/topicSelection.js'
import { asSubjectValue } from '../learning/engine/semanticContext.js'
import {
  loadSession, saveSession, getOrCreateSession, startSession,
  advanceBlock, completeSession, isDurationMode, SESSION_KEY, normalizeSession,
} from '../learning/engine/session.js'

const DURATION_PREF_KEY = 'lc2-session-duration'
// A small bonus for finishing the whole session — progress is the real reward,
// so this stays secondary and is granted exactly once per session.
const SESSION_BONUS_XP = 15

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

function storedOnboardingComplete() {
  try { return localStorage.getItem('lc2-onboarded') === 'true' } catch { return false }
}

function providerUser(user) {
  if (!user) return null
  const email = String(user.email || '')
  const name = String(user.user_metadata?.display_name || email.split('@')[0] || '').trim()
  return { id: user.id, name, email }
}

function currentAuthAction() {
  try { return new URL(window.location.href).searchParams.get('auth') } catch { return null }
}

function clearAuthCallback() {
  try {
    const url = new URL(window.location.href)
    for (const key of ['auth', 'code', 'error', 'error_code', 'error_description']) url.searchParams.delete(key)
    const hash = new URLSearchParams(url.hash.slice(1))
    if (hash.has('error') || hash.has('error_code')) url.hash = ''
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash)
  } catch {}
}

const RECOVERY_VERIFIED_KEY = 'lc2-auth-recovery-verified'
const RECOVERY_VERIFIED_MAX_AGE_MS = 5 * 60 * 1000

function clearVerifiedRecovery() {
  try { sessionStorage.removeItem(RECOVERY_VERIFIED_KEY) } catch {}
}

function rememberVerifiedRecovery(userId) {
  try {
    sessionStorage.setItem(RECOVERY_VERIFIED_KEY, JSON.stringify({
      userId: String(userId),
      verifiedAt: Date.now(),
    }))
  } catch {}
}

function consumeVerifiedRecovery(userId) {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(RECOVERY_VERIFIED_KEY) || 'null')
    sessionStorage.removeItem(RECOVERY_VERIFIED_KEY)
    return parsed?.userId === String(userId)
      && Number.isFinite(parsed?.verifiedAt)
      && Date.now() - parsed.verifiedAt >= 0
      && Date.now() - parsed.verifiedAt <= RECOVERY_VERIFIED_MAX_AGE_MS
  } catch {
    clearVerifiedRecovery()
    return false
  }
}

const createWelcomeMessage = (language) => ({
  id: 'welcome',
  role: 'lingua',
  text: translate(language, 'linguaWelcomeGreeting'),
  feedback: null,
  ts: Date.now(),
})

export function AppProvider({ children }) {
  const authCallbackErrorRef = useRef(authCallbackError(window.location.href))
  // Passive chat/progress effects must never acquire another account's lease
  // after React flushes state from a previous session.
  const passiveStorageAccessRef = useRef(captureLearnerAccess())
  // Auth/setup flow: null = main app, 'entry'/'login'/'signup'/'forgot'/'placement'/'tutor-personality'/'learning-prefs' = flow screens
  const [authStep, setAuthStep] = useState('entry')
  const preferenceImportBlockedRef = useRef(false)
  const [languagePreferences, setLanguagePreferences] = useState(() => {
    try {
      recoverCurrentPreferenceImport()
      return ensureLanguagePreferences()
    } catch {
      // Do not normalize partial keys or persist React defaults over a WAL.
      // Verified session activation retries recovery before private UI opens.
      preferenceImportBlockedRef.current = true
      return languagePreferencePersistence('en').preferences
    }
  })
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
  /*
   * HOW THE CHAT LOOKS. Its own store, on purpose: this is appearance, not
   * pedagogy, so it can never reach the learner model, the captured facts or the
   * interests. Sanitised on load, sanitised on save.
   */
  const [chatAppearance, setChatAppearanceState] = useState(loadChatAppearance)
  const setChatAppearance = useCallback((next) => {
    // The account that clicked owns the write and the later React update.
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    const saved = saveChatAppearance(next, { access })
    if (!saved || !access.valid()) return false
    setChatAppearanceState(previous => access.valid() ? saved : previous)
    return access.valid()
  }, [])
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    try { return localStorage.getItem('lc2-onboarded') === 'true' } catch { return false }
  })
  const [profile, setProfile] = useState(() => {
    try {
      const s = localStorage.getItem('lc2-profile')
      return s ? { ...DEFAULT_PROFILE, ...JSON.parse(s) } : DEFAULT_PROFILE
    } catch { return DEFAULT_PROFILE }
  })

  const authServiceRef = useRef(null)
  // Preserve a local-isolation failure across the compensating provider SIGNED_OUT event.
  // The flag is reset only when the learner explicitly starts another Auth operation or
  // when a provider session is safely activated.
  const authIsolationBlockedRef = useRef(false)
  const accountBoundRef = useRef(false)
  const profileRestoredRef = useRef(false)
  const [authProviderError, setAuthProviderError] = useState('')
  const [tutorPreferenceSaveFailed, setTutorPreferenceSaveFailed] = useState(false)

  const getAuthService = useCallback(() => {
    if (!authServiceRef.current) {
      authServiceRef.current = getBrowserAuthService()
      try { localStorage.removeItem('lc2-auth') } catch {}
    }
    return authServiceRef.current
  }, [])

  const applyProviderSession = useCallback((session, event = 'SESSION') => {
    if (!session?.user) {
      if (event === 'SIGNED_OUT') revokeLocalLease()
      preferenceSyncRef.current?.stop()
      // Invalid/expired auth callbacks must not survive into a later normal login.
      // Otherwise a stale ?auth=reset can incorrectly reopen the reset screen.
      clearVerifiedRecovery()
      if (authCallbackErrorRef.current) setAuthProviderError(authCallbackErrorRef.current)
      if (currentAuthAction()) clearAuthCallback()
      try {
        localStorage.removeItem('lc2-auth')
        localStorage.removeItem('lc2-user')
      } catch {}
      setAuthUser(null)
      setAuthStep('entry')
      return
    }
    authCallbackErrorRef.current = null

    if (event === 'PASSWORD_RECOVERY') rememberVerifiedRecovery(session.user.id)

    const isolation = activateLocalAccount(globalThis.localStorage, session.user.id, { deferRebind: accountBoundRef.current })
    if (isolation.blocked) {
      clearAuthCallback()
      authIsolationBlockedRef.current = true
      setAuthProviderError('storage_full')
      setAuthUser(null)
      setAuthStep('entry')
      // This SIGNED_OUT is compensatory. Its auth-state callback must not erase the
      // actionable storage error before the learner can read it.
      getAuthService().signOut().catch(() => {})
      return
    }
    // First sign-in may claim guest data without a reload. Rebind only then;
    // account switches/revoked tabs must retain the old, invalid lease.
    if (isolation.claimedGuestData && !isolation.reloadRequired)
      passiveStorageAccessRef.current = captureLearnerAccess()
    accountBoundRef.current = true
    authIsolationBlockedRef.current = false
    setAuthProviderError('')
    if (isolation.switched || isolation.reloadRequired) {
      window.location.reload()
      return
    }

    try {
      const importer = createPreferenceImport({ userId: session.user.id, access: captureLearnerAccess() })
      const recovered = importer.recover()
      if (recovered || preferenceImportBlockedRef.current) {
        const durable = recovered || importer.read()
        setTutorPreferencesState(durable.tutorPreferences)
        setLanguagePreferences(durable.languagePreferences)
      }
      preferenceImportBlockedRef.current = false
    } catch {
      preferenceImportBlockedRef.current = true
      setAuthProviderError('storage_full')
      setAuthStep('entry')
      return
    }

    let restoredProfile = null
    if (!profileRestoredRef.current) {
      try { restoredProfile = readVerifiedProfile(captureLearnerAccess()) }
      catch {
        setAuthProviderError('storage_full')
        setAuthStep('entry')
        return
      }
      profileRestoredRef.current = true
    }
    const user = providerUser(session.user)
    setAuthUser(user)
    setProfile(previous => ({
      ...previous,
      ...restoredProfile,
      name: user?.name || previous.name,
      email: user?.email || previous.email,
    }))
    try {
      localStorage.removeItem('lc2-auth')
      localStorage.setItem('lc2-user', JSON.stringify(user))
    } catch {}

    const action = currentAuthAction()
    const resumedVerifiedRecovery = action === 'reset' && event !== 'PASSWORD_RECOVERY'
      ? consumeVerifiedRecovery(session.user.id)
      : false
    if (event === 'PASSWORD_RECOVERY' || resumedVerifiedRecovery) {
      if (event === 'PASSWORD_RECOVERY') clearVerifiedRecovery()
      setAuthStep('reset')
      return
    }

    // auth=reset is untrusted routing state. The provider can preserve an existing
    // session when an expired/reused recovery callback fails, so never open the
    // reset form for that session unless PASSWORD_RECOVERY was actually verified.
    if (action === 'reset') {
      clearVerifiedRecovery()
      clearAuthCallback()
    }
    if (action === 'confirmed') clearAuthCallback()
    const onboarded = storedOnboardingComplete()
    setOnboardingCompleted(onboarded)
    const checkpoint = readSetupCheckpoint(localStorage)
    if (!onboarded && checkpoint.result) setProfile(previous => ({ ...previous, placementResult: checkpoint.result, level: checkpoint.result.level }))
    setAuthStep(onboarded ? null : checkpoint.step)
  }, [getAuthService])

  useEffect(() => {
    let alive = true
    let subscription = null
    let service
    let authEvents = 0

    try {
      service = getAuthService()
      const registration = service.onAuthStateChange((event, session) => {
        if (!alive) return
        authEvents += 1
        if (!authIsolationBlockedRef.current) setAuthProviderError('')
        applyProviderSession(session, event)
      })
      subscription = registration?.data?.subscription || registration?.subscription || null
    } catch (error) {
      setAuthProviderError(error?.message || 'Authentication is not configured.')
      setAuthStep('entry')
      return () => {}
    }

    const restorationRevision = authEvents
    service.getSession()
      .then((session) => {
        if (!alive || authEvents !== restorationRevision) return
        if (!authIsolationBlockedRef.current) setAuthProviderError('')
        applyProviderSession(session, 'INITIAL_SESSION')
      })
      .catch((error) => {
        if (!alive) return
        setAuthProviderError(authCallbackErrorRef.current || error?.message || 'Could not restore your session.')
        if (authCallbackErrorRef.current) clearAuthCallback()
        setAuthStep('entry')
      })

    return () => {
      alive = false
      subscription?.unsubscribe?.()
    }
  }, [getAuthService, applyProviderSession])
  useEffect(() => {
    // This passive setup checkpoint belongs to the original account lease.
    // A delayed React effect must not acquire B's lease after switching from A.
    if (!authUser?.id || !SETUP_STEPS.includes(authStep)) return
    const access = passiveStorageAccessRef.current
    if (!access.valid()) return
    try {
      if (access.setItem('lc2-onboarding-step', authStep) === false || !access.valid()) return
      if (access.getItem('lc2-onboarding-step') !== authStep || !access.valid()) return
    } catch {
      // A denied or revoked store cannot advance another account's checkpoint.
    }
  }, [authUser?.id, authStep])
  const [view, setView] = useState('today')
  const [sessionId, setSessionId] = useState(getOrCreateSessionId)
  const [messages, setMessages] = useState(() => loadStoredMessages(createWelcomeMessage(languagePreferences.interfaceLanguage.base)))
  const [localProgress, setLocalProgress] = useState(loadLocalProgress)
  const [activeMission, setActiveMission] = useState(loadActiveMission)
  const [completedMissions, setCompletedMissions] = useState(loadCompletedMissions)
  const [tutorPreferences, setTutorPreferencesState] = useState(() => preferenceImportBlockedRef.current
    ? { ...DEFAULT_TUTOR_PREFERENCES } : loadTutorPreferences())
  /*
   * Which conversation this is, for the purpose of choosing a subject. Bumped
   * when the learner asks for another topic, so the choice is re-derived without
   * anything else about the conversation resetting.
   */
  const [topicRound, setTopicRound] = useState(0)
  const [activeCompanion, setActiveCompanionState] = useState(loadActiveCompanion)
  const [textSize, setTextSizeState] = useState(loadTextSize)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [episodeActiveId, setEpisodeActiveId] = useState(null)
  // Why this episode was opened. Never the run mode itself — see startEpisode.
  const [episodeRunOptions, setEpisodeRunOptions] = useState({ source: 'practice', wantsOtherBranch: false })
  const [episodeArcVersion, setEpisodeArcVersion] = useState(0) // bumps when episode progress changes
  // Daily session: restored from storage on first render so a reload resumes.
  const [dailySession, setDailySession] = useState(() => loadSession(ARC))
  const [sessionActive, setSessionActive] = useState(false)
  const [preferredDuration, setPreferredDuration] = useState(() => {
    try {
      const stored = localStorage.getItem(DURATION_PREF_KEY)
      return isDurationMode(stored) ? stored : 'standard'
    } catch { return 'standard' }
  })
  const [missionFeedback, setMissionFeedback] = useState(null)
  const [missionCelebration, setMissionCelebration] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [connectionNotice, setConnectionNotice] = useState(null)
  const [memoryNotice, setMemoryNotice] = useState(null)
  const [mobileSheet, setMobileSheet] = useState(null) // 'journey' | 'notes' | null
  const messagesEndRef = useRef(null)
  const restoredMissionRef = useRef(false)
  // A delayed mission reply must not revive an abandoned/replaced mission.
  const missionGenerationRef = useRef(0)
  // A pending mission answer owns its HTTP turn until it settles. React's
  // typing state is not synchronous, so rapid submits must share one turn.
  const missionInFlightRef = useRef(null)
  // Clearing or resetting a conversation invalidates replies from earlier HTTP turns.
  // The account lease alone cannot distinguish two conversations of one account.
  const chatGenerationRef = useRef(0)
  // One free-chat request per conversation at a time. A stale request may finish
  // after Clear, but must never release the new conversation's in-flight lock.
  const chatInFlightRef = useRef(null)

  // The DOM follows the committed theme; persistence belongs to the
  // initiating account, never to an effect that can run after a lease switch.
  const darkModeRef = useRef(darkMode)
  useEffect(() => {
    const root = document.documentElement
    darkMode ? root.classList.add('dark') : root.classList.remove('dark')
  }, [darkMode])

  useEffect(() => {
    const root = document.documentElement
    root.lang = interfaceLanguageInfo.code
    root.dir = interfaceLanguageInfo.base === 'ar' ? 'rtl' : 'ltr'
    root.dataset.textSize = textSize
  }, [interfaceLanguageInfo, textSize])

  // Profile hydration is read-only. Guided onboarding commits explicitly and
  // updateProfile verifies its account-scoped write before publishing React
  // state. A passive effect could replay pre-auth defaults or stale A state
  // over a newer durable profile after a lease change.

  useEffect(() => {
    saveStoredMessages(messages, { access: passiveStorageAccessRef.current })
  }, [messages])

  useEffect(() => {
    saveLocalProgress(localProgress, { access: passiveStorageAccessRef.current })
  }, [localProgress])

  // Mission starts, advances, completions and resets already persist under
  // their originating account lease before updating React. Replaying mission
  // state in passive effects could resurrect a completed cursor or overwrite
  // a newer completion history from another tab.

  // Companion and text size are persisted by their lease-verified setters.
  // A delayed effect could replay A's state into B after an account switch.

  const persistThemeDark = useCallback((next) => {
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    const value = Boolean(next)
    try {
      const serialized = String(value)
      if (access.setItem('lc2-dark', serialized) === false
        || !access.valid() || access.getItem('lc2-dark') !== serialized
        || !access.valid()) return false
    } catch {
      return false
    }
    // Keep rapid consecutive toggles based on the last verified write. React
    // can flush this updater after a logout or an account switch.
    darkModeRef.current = value
    setDarkMode(previous => access.valid() ? value : previous)
    return access.valid()
  }, [])
  const toggleDark = useCallback(() => persistThemeDark(!darkModeRef.current), [persistThemeDark])
  const setThemeDark = useCallback((value) => persistThemeDark(value), [persistThemeDark])

  const nativeLanguage = nativeLanguageInfo.base
  const interfaceLanguage = interfaceLanguageInfo.base

  /*
   * Interface locales are fetched on demand. `localeVersion` simply forces a
   * re-render once a dictionary lands, so `t` re-resolves with real strings.
   * The native language is loaded too when it differs, because pedagogical help
   * is written in the learner's own language, not the interface one.
   */
  const [localeVersion, setLocaleVersion] = useState(0)
  useEffect(() => {
    let cancelled = false
    const wanted = [...new Set([interfaceLanguage, nativeLanguage])]
    if (wanted.every(isLocaleReady)) return undefined
    Promise.all(wanted.map(loadLocale)).then(() => {
      if (!cancelled) setLocaleVersion(v => v + 1)
    })
    return () => { cancelled = true }
  }, [interfaceLanguage, nativeLanguage])

  // localeVersion participates so every consumer re-renders when a locale lands
  const t = useCallback(
    (key, params) => translate(interfaceLanguageInfo.base, key, params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [interfaceLanguageInfo.base, localeVersion],
  )
  const interfaceReady = isLocaleReady(interfaceLanguage)

  /*
   * The one language updater. `persistNativeLanguage` writes both the native and
   * interface storage together (see services/language.js), so there is no
   * separate `updateInterfaceLanguage`: a supported product API cannot move
   * interface and native apart because there is only ever one value to set.
   */
  const updateNativeLanguage = useCallback((language) => {
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    const userLanguage = persistNativeLanguage(language, { access })
    if (!userLanguage || !access.valid()) return false
    // React can flush this updater after an account or tab lease was revoked.
    setLanguagePreferences(previous => access.valid() ? ({
      ...previous,
      nativeLanguage: userLanguage,
      interfaceLanguage: userLanguage,
    }) : previous)
    return access.valid()
  }, [])

  const preferenceSyncRef = useRef(null)
  useEffect(() => {
    if (!CLOUD_PREFERENCES_RELEASED || !authUser?.id || authStep !== null) return undefined
    let cancelled = false, controller = null
    const syncAccess = captureLearnerAccess()
    const importer = createPreferenceImport({ userId: authUser.id, access: syncAccess })
    connectPreferenceSync({
      store: {
        getItem: key => syncAccess.getItem(key),
        setItem: (key, value) => {
          if (!syncAccess.setItem(key, value)) throw new Error('Stale preference session')
        },
      },
      readOwner: () => {
        if (!syncAccess.valid()) return ''
        try { return decodeURIComponent(localStorage.getItem('lc2-auth-owner-id') || '') } catch { return '' }
      },
      readLocal: () => importer.read().fields,
      applyLocal: row => {
        const durable = importer.apply(row)
        // Pure state publication follows strict persistence. Equal results keep
        // their identity, so the dirty effect settles after one follow-up pass.
        setTutorPreferencesState(previous => JSON.stringify(previous) === JSON.stringify(durable.tutorPreferences)
          ? previous : durable.tutorPreferences)
        setLanguagePreferences(previous => JSON.stringify(previous) === JSON.stringify(durable.languagePreferences)
          ? previous : durable.languagePreferences)
      },
    }).then(sync => {
      if (cancelled) { sync.cancel(); return }
      controller = schedulePreferenceSync(sync, window)
      preferenceSyncRef.current = controller
    }).catch(() => { /* Local preferences remain usable; a later login retries initialization. */ })
    return () => { cancelled = true; controller?.stop(); preferenceSyncRef.current = null }
  }, [authUser?.id, authStep])
  useEffect(() => { preferenceSyncRef.current?.changed() }, [tutorPreferences, interfaceLanguage])

  const login = useCallback(async (email, password) => {
    authCallbackErrorRef.current = null
    clearVerifiedRecovery()
    authIsolationBlockedRef.current = false
    setAuthProviderError('')
    // The provider's onAuthStateChange listener is the single session authority.
    // Applying the returned session here as well can race an account-switch reload
    // and persist stale React state into the newly restored account snapshot.
    return getAuthService().signIn({ email, password })
  }, [getAuthService])

  const signup = useCallback(async (name, email, password) => {
    authCallbackErrorRef.current = null
    clearVerifiedRecovery()
    authIsolationBlockedRef.current = false
    setAuthProviderError('')
    // Do not mutate profile/session state from the promise result. If signup
    // creates a session, the provider listener applies it exactly once; if email
    // confirmation is pending, learner state remains unauthenticated until that
    // verified session event arrives.
    return getAuthService().signUp({
      name,
      email,
      password,
      language: interfaceLanguageInfo.base,
    })
  }, [getAuthService, interfaceLanguageInfo.base])

  const requestPasswordReset = useCallback(async (email) => {
    authCallbackErrorRef.current = null
    clearVerifiedRecovery()
    authIsolationBlockedRef.current = false
    setAuthProviderError('')
    return getAuthService().requestPasswordReset(email)
  }, [getAuthService])

  const resendConfirmation = useCallback(async (email) => {
    clearVerifiedRecovery()
    authIsolationBlockedRef.current = false
    setAuthProviderError('')
    return getAuthService().resendConfirmation(email)
  }, [getAuthService])

  const changePassword = useCallback(async (password) => {
    authIsolationBlockedRef.current = false
    setAuthProviderError('')
    const user = await getAuthService().changePassword(password)
    clearVerifiedRecovery()
    clearAuthCallback()
    const session = await getAuthService().getSession()
    applyProviderSession(session, 'USER_UPDATED')
    return user
  }, [getAuthService, applyProviderSession])

  const completePlacement = useCallback((result, access = captureLearnerAccess()) => {
    try {
      // The quiz captures its lease before delayed feedback. Never rebind an
      // old answer to a newly activated account at the moment of publication.
      persistPlacementResult(access, result)
      if (!access.valid()) throw new Error('Stale placement account')
    } catch {
      setAuthProviderError('storage_full')
      return false
    }
    // React may apply these queued updates after an account/lease switch.
    // Fence every publication, not only the durable write and profile update.
    setAuthProviderError(prev => access.valid() ? '' : prev)
    setProfile(prev => access.valid() ? { ...prev, level: result.level, placementResult: result } : prev)
    setAuthStep(prev => access.valid() ? 'level-reveal' : prev)
    return true
  }, [])

  const completeTutorPersonality = useCallback((personality) => {
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    // React may apply these updates after the learner lease is revoked.
    setProfile(prev => access.valid() ? { ...prev, tutorPersonality: personality } : prev)
    setAuthStep(prev => access.valid() ? 'learning-prefs' : prev)
    return access.valid()
  }, [])

  const completeLearningPrefs = useCallback((prefs) => {
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    setProfile(prev => access.valid() ? {
      ...prev,
      preferences: prefs,
      goal: prefs.goals?.[0] || 'Travel',
      dailyGoal: prefs.dailyGoal || 10,
    } : prev)
    // Final onboarding beat: guided AI personalization with Chatto.
    setAuthStep(prev => access.valid() ? 'personalize' : prev)
    return access.valid()
  }, [])

  // User finished the guided personalization step (tutor preferences are already
  // persisted live). Commit the onboarding marker LAST so partial Storage
  // failures cannot open Home or skip unfinished setup after a reload.
  const completePersonalization = useCallback(({ profileToCommit = profile, preferencesVerified = false, access = captureLearnerAccess() } = {}) => {
    // A failed preference edit must not be silently accepted by Save and Start.
    // The recommended path may override this only after its own durable save.
    if (tutorPreferenceSaveFailed && !preferencesVerified) return false
    try {
      // Persist before marking setup complete, under the originating lease.
      // Queued React updates may run after an account switch: fence each one.
      commitOnboarding(access, profileToCommit)
      if (!access.valid()) throw new Error('Stale onboarding account')
    } catch {
      setTutorPreferenceSaveFailed(prev => access.valid() ? true : prev)
      return false
    }
    setTutorPreferenceSaveFailed(prev => access.valid() ? false : prev)
    setOnboardingCompleted(prev => access.valid() ? true : prev)
    setView(prev => access.valid() ? 'today' : prev)
    setShowWelcome(prev => access.valid() ? true : prev)
    setAuthStep(prev => access.valid() ? null : prev)
    return true
  }, [profile, tutorPreferenceSaveFailed])

  // Recommended setup must keep the same lease across preference save,
  // onboarding commit and deferred React publications.
  const applyRecommendedSetup = useCallback(() => {
    const access = captureLearnerAccess()
    let durable
    try {
      if (!access.valid()) throw new Error('Stale recommended setup')
      durable = updateTutorPreferencesDurably(DEFAULT_TUTOR_PREFERENCES, { access })
      if (!access.valid()) throw new Error('Stale recommended setup')
    } catch {
      setTutorPreferenceSaveFailed(prev => access.valid() ? true : prev)
      return false
    }
    const recommendedProfile = {
      ...profile,
      tutorPersonality: profile.tutorPersonality || 'Gentle Guide',
      preferences: {
        goals: ['Travel'],
        dailyGoal: 10,
        correctionIntensity: 'Balanced',
        practiceVibe: 'Motivational',
      },
      goal: profile.goal || 'Travel',
      dailyGoal: 10,
    }
    if (!completePersonalization({ profileToCommit: recommendedProfile, preferencesVerified: true, access })) return false
    setTutorPreferencesState(prev => access.valid() ? durable : prev)
    setProfile(prev => access.valid() ? recommendedProfile : prev)
    return access.valid()
  }, [completePersonalization, profile])

  const dismissWelcome = useCallback(() => {
    // A welcome click belongs to the account that made it. A later React flush
    // must not close B's welcome or start B's tour after A has signed out.
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    try {
      if (access.setItem('lc2-welcome-seen', 'true') === false
        || !access.valid() || access.getItem('lc2-welcome-seen') !== 'true') return false
      // Only start Chatto's tour if this same account has not seen it.
      const needsTour = access.getItem('lc2-tutorial-seen') !== 'true'
      if (!access.valid()) return false
      setShowWelcome(prev => access.valid() ? false : prev)
      if (needsTour) setShowTutorial(prev => access.valid() ? true : prev)
      return access.valid()
    } catch {
      // A denied/failed write is not a completed welcome.
      return false
    }
  }, [])

  const dismissTutorial = useCallback(() => {
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    try {
      if (access.setItem('lc2-tutorial-seen', 'true') === false
        || !access.valid() || access.getItem('lc2-tutorial-seen') !== 'true') return false
      setShowTutorial(prev => access.valid() ? false : prev)
      return access.valid()
    } catch {
      return false
    }
  }, [])

  // ── LinguaLoop episodes ──
  /*
   * `options` says only where the learner came from and whether they asked to
   * take the other option. What KIND of run that is (first time, resuming,
   * practising again, review) is decided by the engine from the episode's own
   * state, so nothing in the UI can accidentally claim a first completion.
   */
  const startEpisode = useCallback((episodeId, options = {}) => {
    /*
     * Refuse rather than substitute. A missing id used to become
     * `first_greeting`, so a stale link or a wrong caller opened the first
     * greeting and looked deliberate. With more than one level in the registry
     * the same shrug would open the wrong level's episode, so the request is
     * checked against the level registry and the curriculum, and a refusal
     * leaves the learner where they were.
     */
    // Capture the initiating learner: a delayed episode navigation cannot land on B.
    const access = captureLearnerAccess()
    if (!access.valid()) return { ok: false, reason: 'stale_account' }
    const request = episodeRequest({ episodeId })
    if (!access.valid()) return { ok: false, reason: 'stale_account' }
    if (!request.ok) {
      if (import.meta.env?.DEV) console.warn('[startEpisode] refused', episodeId, request.reason)
      return request
    }
    const runOptions = {
      source: options.source || 'practice',
      wantsOtherBranch: Boolean(options.wantsOtherBranch),
    }
    // React can apply functional updaters after the click's account lease expires.
    setEpisodeRunOptions(previous => access.valid() ? runOptions : previous)
    setEpisodeActiveId(previous => access.valid() ? request.episodeId : previous)
    setView(previous => access.valid() ? 'practice' : previous)
    setMobileSheet(previous => access.valid() ? null : previous)
    return access.valid() ? request : { ok: false, reason: 'stale_account' }
  }, [])

  const exitEpisode = useCallback(() => {
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    setEpisodeActiveId(previous => access.valid() ? null : previous)
    return access.valid()
  }, [])

  const finishEpisode = useCallback(() => {
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    setEpisodeActiveId(previous => access.valid() ? null : previous)
    setEpisodeArcVersion(previous => access.valid() ? previous + 1 : previous)
    setView(previous => access.valid() ? 'today' : previous)
    return access.valid()
  }, [])

  // ── adaptive daily session ──
  // The plan itself lives in the session engine; the context only owns "which
  // session is on screen" and persists every transition immediately so a reload
  // or a breakpoint change resumes at the same block.
  /*
   * A PURE preview of today's session for Home to render. It must not persist
   * or setState: Home reads it during render, and writing state there would be
   * a setState-in-render (React warns, and the two components can disagree).
   * The plan is deterministic, so the preview always matches what `beginSession`
   * will actually store.
   */
  /*
   * What this conversation is about.
   *
   * Chosen from the interests the learner ticked, avoiding what they have heard
   * about recently and whatever they waved away today. Seeded by the chat session
   * and the round, so it survives a reload and a re-render and only moves when
   * something real moves it. Never null: with no interests, or none that fit, it
   * is the neutral everyday context.
   */
  const conversationTopic = useMemo(() => {
    const memory = loadMemoryContext()
    return selectTopic({
      explicitInterests: tutorPreferences?.interests || [],
      recentTopics: recentTopicIds(memory),
      dismissedTopics: memory.dismissedTopicIds,
      acceptedSemanticTypes: ['topic'],
      seed: `${sessionId}:${topicRound}`,
    })
  }, [tutorPreferences, sessionId, topicRound])

  /*
   * "Let's talk about something else."
   *
   * Puts today's topic aside and re-derives the next one. The interest itself is
   * untouched: it stays selected, it keeps its place in the catalogue, and
   * tomorrow it can come back — declining a subject this afternoon says nothing
   * about what somebody enjoys.
   */
  const useAnotherConversationTopic = useCallback(() => {
    // A queued topic rotation or a failed memory write must never become
    // another account's dismissal after an auth switch.
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    if (conversationTopic?.interestId && !dismissTopic(conversationTopic.interestId, { access })) return false
    if (!access.valid()) return false
    setTopicRound(round => access.valid() ? round + 1 : round)
    return access.valid()
  }, [conversationTopic])

  // What the planner needs to pin today's subject matter: the interests the
  // learner already chose, plus a stable key so the choice is reproducible.
  const sessionContext = useCallback(() => {
    const memory = loadMemoryContext()
    return {
      interests: tutorPreferences?.interests || [],
      learnerKey: (profile.name || 'guest').trim() || 'guest',
      // topics the learner waved away today are not used to build today's plan
      dismissedFactIds: memory.dismissedFactIds,
      dismissedTopics: memory.dismissedTopicIds,
      recentTopics: recentTopicIds(memory),
    }
  }, [tutorPreferences, profile.name])

  const previewSession = useCallback((durationMode) => {
    const mode = durationMode || preferredDuration
    return getOrCreateSession(loadLearnerModel(), ARC, { durationMode: mode, stored: dailySession ?? undefined, ...sessionContext() })
  }, [dailySession, preferredDuration, sessionContext])

  const chooseDuration = useCallback((mode) => {
    if (!isDurationMode(mode)) return false
    // Duration and its planned session belong to the learner who clicked.
    // Never adopt another account if Storage, planning or React runs later.
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    const replan = !dailySession || dailySession.status === 'planned'
    let next = null
    if (replan) {
      const model = loadLearnerModel()
      if (!access.valid()) return false
      next = getOrCreateSession(model, ARC, { durationMode: mode, stored: dailySession ?? undefined, ...sessionContext() })
      if (!next || !access.valid()) return false
    }
    // A denied, failed or conflicting write must not look saved in the UI.
    try {
      if (access.setItem(DURATION_PREF_KEY, mode) === false || !access.valid()
        || access.getItem(DURATION_PREF_KEY) !== mode || !access.valid()) return false
    } catch { return false }
    // A started session keeps its original plan. A planned session changes only
    // after its new plan has been durably written under the same account lease.
    if (replan && (!saveSession(next, { access }) || !access.valid())) return false
    setPreferredDuration(previous => access.valid() ? mode : previous)
    if (replan) setDailySession(previous => access.valid() ? next : previous)
    return access.valid()
  }, [dailySession, sessionContext])

  const beginSession = useCallback(() => {
    // The click owns the entire plan/start transaction. A revoked A lease must
    // not publish a session in B, even when React flushes its updater later.
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    const planned = dailySession && dailySession.status !== 'completed'
      ? dailySession
      : getOrCreateSession(loadLearnerModel(), ARC, { durationMode: preferredDuration, ...sessionContext() })
    if (!access.valid() || !planned) return false
    const next = startSession(planned)
    // Save first: a denied/full Storage write must not show a started session.
    if (!next || !access.valid() || !saveSession(next, { access }) || !access.valid()) return false
    /*
     * A remembered fact only counts as used when the session actually starts.
     * Keep the same lease through the fact's model read and save.
     */
    if (next.topic?.source === 'fact' && next.topic.factValue && planned.status === 'planned') {
      const model = loadLearnerModel()
      if (!access.valid()) return false
      const fact = { type: 'like', value: next.topic.factValue }
      markFactUsed(model, fact)
      rotateFactUsage(model, fact)
      if (!access.valid()) return false
      // A rejected or mismatched fact-usage write must not publish a started
      // session as though its learner memory had been persisted.
      if (saveLearnerModel(model, { verified: true }) !== true || !access.valid()) return false
    }
    setDailySession(previous => access.valid() ? next : previous)
    setSessionActive(previous => access.valid() ? true : previous)
    setView(previous => access.valid() ? 'practice' : previous)
    setMobileSheet(previous => access.valid() ? null : previous)
    return access.valid() ? next : false
  }, [dailySession, preferredDuration, sessionContext])

  const advanceSession = useCallback(() => {
    // A delayed React updater must never advance B's daily plan after A signs out.
    // Persist through the lease captured by the click, outside the updater:
    // React may replay state updaters and a failed write must not look completed.
    const access = captureLearnerAccess()
    if (!access.valid() || !dailySession) return false
    const next = advanceBlock(dailySession)
    if (!access.valid() || !saveSession(next, { access }) || !access.valid()) return false
    setEpisodeArcVersion(previous => access.valid() ? previous + 1 : previous)
    setDailySession(previous => access.valid() ? next : previous)
    return access.valid()
  }, [dailySession])

  const finishSession = useCallback(() => {
    // Keep the session's original account lease through the model, durable
    // completion and deferred React updates. A's bonus must not land on B.
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    if (dailySession) {
      // React can flush the previous render after a successful completion.
      // Read the durable session under the original lease, not stale React
      // state, so a second click cannot award the same bonus again.
      let storedSession
      try {
        const raw = access.getItem(SESSION_KEY)
        if (!access.valid() || raw === null) return false
        storedSession = normalizeSession(JSON.parse(raw), ARC)
      } catch { return false }
      if (!access.valid() || !storedSession || storedSession.id !== dailySession.id) return false
      const model = loadLearnerModel()
      if (!access.valid()) return false
      const { session, awarded } = completeSession(storedSession, model)
      if (!access.valid()) return false
      if (saveLearnerModel(model, { verified: true }) !== true || !access.valid()) return false
      if (!saveSession(session, { access }) || !access.valid()) return false
      setDailySession(previous => access.valid() ? session : previous)
      if (awarded) setLocalProgress(previous => access.valid()
        ? { ...previous, xp: (previous.xp || 0) + SESSION_BONUS_XP } : previous)
    }
    setSessionActive(previous => access.valid() ? false : previous)
    setEpisodeActiveId(previous => access.valid() ? null : previous)
    setEpisodeArcVersion(previous => access.valid() ? previous + 1 : previous)
    setView(previous => access.valid() ? 'today' : previous)
    return access.valid()
  }, [dailySession])

  const exitSession = useCallback(() => {
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    setSessionActive(previous => access.valid() ? false : previous)
    setEpisodeActiveId(previous => access.valid() ? null : previous)
    setView(previous => access.valid() ? 'today' : previous)
    return access.valid()
  }, [])

  /*
   * Feed the Memory Garden (deduped by vocab id) and award XP. The EpisodeShell
   * only calls this when the episode is not yet awarded, so XP is never doubled.
   *
   * Being granted an item means the learner has MET it — nothing more. Each
   * grant is recorded in the learner model at `seen`, which is what the Garden
   * now reads; anything further has to be earned by evidence. Items the learner
   * really produced are already further along and are not pushed back, because
   * `recordItemSeen` only ever raises a state.
   */
  /*
   * `grants` are the episode's Garden items already resolved to real vocabulary
   * by the screen that played it — the only caller, and one that has the
   * catalogue in hand because it just rendered those words. Passing them in
   * keeps every term and its eight translations out of the first chunk, which a
   * learner downloads long before any of this can happen.
   */
  const awardEpisode = useCallback((episode, { grants = [] } = {}) => {
    // An episode can finish while its originating account is being replaced.
    // Keep that original lease across the model read, award and queued React
    // updater: a late completion from A must never award XP or items to B.
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    const model = loadLearnerModel()
    if (!access.valid()) return false
    for (const grant of grants) {
      if (!access.valid()) return false
      recordItemSeen(model, grant.vocabId)
    }
    if (!access.valid()) return false
    if (saveLearnerModel(model, { verified: true }) !== true || !access.valid()) return false
    setLocalProgress(previous => {
      if (!access.valid()) return previous
      const existing = new Set((previous.learnedItems || []).map(i => i.vocabId).filter(Boolean))
      const additions = grants
        .filter(grant => !existing.has(grant.vocabId))
        .map(grant => ({ ...grant, lastSeenAt: Date.now() }))
      return {
        ...previous,
        learnedItems: [...additions, ...(previous.learnedItems || [])],
        xp: (previous.xp || 0) + (episode.xp || 0),
      }
    })
    return access.valid()
  }, [])

  const logout = useCallback(async () => {
    clearVerifiedRecovery()
    setAuthProviderError('')
    setTutorPreferenceSaveFailed(false)
    await getAuthService().signOut()
    applyProviderSession(null, 'SIGNED_OUT')
  }, [getAuthService, applyProviderSession])

  const completeOnboarding = useCallback((profileData) => {
    const access = captureLearnerAccess()
    const merged = { ...DEFAULT_PROFILE, ...profileData }
    try {
      // Legacy completion must retain its original lease through the durable
      // commit and all queued React updates, just like guided onboarding.
      commitOnboarding(access, merged)
      if (!access.valid()) throw new Error('Stale onboarding account')
    } catch {
      setTutorPreferenceSaveFailed(prev => access.valid() ? true : prev)
      return false
    }
    setTutorPreferenceSaveFailed(prev => access.valid() ? false : prev)
    setProfile(prev => access.valid() ? merged : prev)
    setOnboardingCompleted(prev => access.valid() ? true : prev)
    setView(prev => access.valid() ? 'today' : prev)
    return access.valid()
  }, [])

  const updateProfile = useCallback((updates) => {
    // An interactive edit must be durable before it can appear saved. A queued
    // React updater from A must not publish into B after an account switch.
    const access = captureLearnerAccess()
    if (!access.valid() || !updates || typeof updates !== 'object' || Array.isArray(updates)) return false
    try {
      // Merge against the latest account-scoped stored profile, not a possibly
      // stale render. Corrupt or denied reads fail closed instead of overwriting.
      const raw = access.getItem('lc2-profile')
      if (!access.valid()) return false
      const stored = raw === null ? profile : JSON.parse(raw)
      if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return false
      const next = { ...profile, ...stored, ...updates }
      const serialized = JSON.stringify(next)
      if (!access.valid() || access.setItem('lc2-profile', serialized) === false
        || !access.valid() || access.getItem('lc2-profile') !== serialized
        || !access.valid()) return false
      setProfile(previous => access.valid() ? next : previous)
      return access.valid()
    } catch {
      return false
    }
  }, [profile])

  const updateTutorPreferences = useCallback((updates) => {
    // Capture the account before the durable edit. React may apply queued
    // updates after a different account has become active, so a successful
    // storage transaction alone cannot authorize publishing its UI state.
    const access = captureLearnerAccess()
    try {
      const next = updateTutorPreferencesDurably(updates, { access })
      if (!access.valid()) throw new Error('Stale tutor preference edit')
      setTutorPreferencesState(prev => access.valid() ? next : prev)
      setTutorPreferenceSaveFailed(prev => access.valid() ? false : prev)
      return access.valid()
    } catch {
      // An error from A must not appear on B's preference screen either.
      setTutorPreferenceSaveFailed(prev => access.valid() ? true : prev)
      return false
    }
  }, [])

  const setActiveCompanion = useCallback((companion) => {
    // The sole tutor is Lingua, but the legacy setter must still respect the
    // originating account lease and refuse to publish an unverified write.
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    const saved = saveActiveCompanion(companion, { access })
    if (!saved || !access.valid()) return false
    setActiveCompanionState(previous => access.valid() ? saved : previous)
    return access.valid()
  }, [])

  const setTextSize = useCallback((size) => {
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    const saved = saveTextSize(size, { access })
    if (!saved || !access.valid()) return false
    setTextSizeState(previous => access.valid() ? saved : previous)
    return access.valid()
  }, [])

  const navigateTo = useCallback((destination) => {
    // A navigation queued by A must not move B's screen after logout or an
    // account/tab lease switch. React can flush these updates later.
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    setView(previous => access.valid() ? destination : previous)
    if (!access.valid()) return false
    setMobileSheet(previous => access.valid() ? null : previous)
    return access.valid()
  }, [])

  const appendLinguaMessages = useCallback((nextMessages, access = captureLearnerAccess()) => {
    const list = Array.isArray(nextMessages) ? nextMessages.filter(Boolean) : [nextMessages].filter(Boolean)
    if (!list.length || !access.valid()) return
    // React may flush these after a logout, account switch or mission cancellation.
    setMessages(previous => access.valid() ? [...previous, ...list] : previous)
    setSelectedMessage(previous => access.valid() ? list[list.length - 1] : previous)
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
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    const generation = ++missionGenerationRef.current
    const publication = { valid: () => access.valid() && missionGenerationRef.current === generation }
    const selectedMission = mission || getMissionForToday(profile.level, profile.goal)
    if (!publication.valid()) return false
    const active = createActiveMission(selectedMission, { access })
    if (!active || !publication.valid()) return false
    setActiveMission(previous => publication.valid() ? active : previous)
    setMissionFeedback(previous => publication.valid() ? null : previous)
    setMissionCelebration(previous => publication.valid() ? null : previous)
    appendLinguaMessages([
      createMissionIntroMessage(selectedMission),
      createMissionStepMessage(getActiveMissionDetails(active)),
    ], publication)
    setView(previous => publication.valid() ? 'practice' : previous)
    setMobileSheet(previous => publication.valid() ? null : previous)
    return publication.valid()
  }, [appendLinguaMessages, profile.goal, profile.level])

  const submitMissionStep = useCallback(async (value, displayText = null) => {
    const details = getActiveMissionDetails(activeMission)
    if (!details?.step) return
    // Capture BEFORE queuing the learner's answer or starting the HTTP request.
    const access = captureLearnerAccess()
    if (!access.valid()) return
    const pending = missionInFlightRef.current
    // A fast HTTP reply may settle before React publishes the next mission step.
    // Keep the accepted step locked until a different durable cursor is visible.
    if (pending?.generation === missionGenerationRef.current && pending.access.valid()
      && (!pending.committed || (pending.missionId === activeMission.missionId
        && pending.startedAt === activeMission.startedAt
        && pending.stepIndex === activeMission.currentStepIndex))) return
    const generation = ++missionGenerationRef.current
    const publication = { valid: () => access.valid() && missionGenerationRef.current === generation }
    const inFlight = {
      generation, access, missionId: activeMission.missionId,
      startedAt: activeMission.startedAt, stepIndex: activeMission.currentStepIndex,
      committed: false,
    }
    missionInFlightRef.current = inFlight
    try {
    const answerText = displayText || value
    setMessages(previous => publication.valid() ? [...previous, {
      id: `u${Date.now()}`,
      role: 'user',
      text: answerText,
      ts: Date.now(),
      missionId: details.mission.id,
      missionStepId: details.step.id,
    }] : previous)
    setIsTyping(previous => publication.valid() ? true : previous)

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
      if (!publication.valid()) return
    } catch {
      // The local mission evaluator remains available when the network fails.
    }

    if (!publication.valid()) return
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
      setMissionFeedback(previous => publication.valid() ? { passed: false, text: evaluation.feedback } : previous)
      setTimeout(() => {
        if (!publication.valid()) return
        setIsTyping(previous => publication.valid() ? false : previous)
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
        }, publication)
      }, 650)
      return
    }

    if (!publication.valid()) return
    const isFinalStep = activeMission.currentStepIndex + 1 >= details.mission.steps.length
    const advanced = advanceMission(activeMission, details.step, value, evaluation, { access, deferSave: isFinalStep })
    if (!advanced || !publication.valid()) {
      if (publication.valid()) {
        setIsTyping(previous => publication.valid() ? false : previous)
        setMissionFeedback(previous => publication.valid() ? {
          passed: false,
          text: 'No se pudo guardar el avance. Intenta de nuevo.',
        } : previous)
      }
      return
    }
    if (isFinalStep) {
      const completed = completeMission(advanced.activeMission, { access })
      if (!completed || !publication.valid()) {
        if (publication.valid()) {
          setIsTyping(previous => publication.valid() ? false : previous)
          setMissionFeedback(previous => publication.valid() ? {
            passed: false,
            text: 'No se pudo guardar la misión completada. Intenta de nuevo.',
          } : previous)
        }
        return
      }
      inFlight.committed = true
      setActiveMission(previous => publication.valid() ? null : previous)
      setCompletedMissions(previous => publication.valid() ? [completed, ...previous].slice(0, 50) : previous)
      setLocalProgress(previous => {
        if (!publication.valid()) return previous
        const withStep = recordMissionProgress(previous, {
          mission: details.mission,
          step: details.step,
          earnedXp: advanced.earnedThisStep,
          completed: false,
        })
        return recordMissionProgress(withStep, {
          mission: details.mission,
          step: details.step,
          earnedXp: Math.max(0, details.mission.rewardXp - completed.earnedXp),
          completed: true,
        })
      })
      setMissionCelebration(previous => publication.valid() ? {
        title: details.mission.title,
        xp: details.mission.rewardXp,
        message: 'Mision completada. Lingua guardo tu avance en este dispositivo.',
      } : previous)
      setMissionFeedback(previous => publication.valid() ? {
        passed: evaluation.passed,
        text: evaluation.feedback,
      } : previous)
      setTimeout(() => {
        if (!publication.valid()) return
        setIsTyping(previous => publication.valid() ? false : previous)
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
        ], publication)
      }, 650)
      return
    }

    inFlight.committed = true
    setLocalProgress(previous => publication.valid() ? recordMissionProgress(previous, {
      mission: details.mission,
      step: details.step,
      earnedXp: advanced.earnedThisStep,
      completed: false,
    }) : previous)
    setActiveMission(previous => publication.valid() ? advanced.activeMission : previous)
    setMissionFeedback(previous => publication.valid() ? {
      passed: evaluation.passed,
      text: evaluation.feedback,
    } : previous)
    setTimeout(() => {
      if (!publication.valid()) return
      setIsTyping(previous => publication.valid() ? false : previous)
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
      ], publication)
    }, 650)
    } finally {
      // An abandoned or replaced mission may have started another turn.
      // An older HTTP completion must never release that newer turn's lock.
      if (missionInFlightRef.current === inFlight && !inFlight.committed) missionInFlightRef.current = null
    }
  }, [activeCompanion, activeMission, appendLinguaMessages, interfaceLanguageInfo, messages, missionContextFromDetails, nativeLanguageInfo, profile, sessionId, targetLanguage, tutorPreferences])

  const submitMissionOption = useCallback((option) => {
    if (!option) return
    submitMissionStep(option.id, option.text)
  }, [submitMissionStep])

  const abandonMission = useCallback(() => {
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    const generation = ++missionGenerationRef.current
    const publication = { valid: () => access.valid() && missionGenerationRef.current === generation }
    if (!publication.valid() || saveActiveMission(null, { access }) !== true
      || !publication.valid()) return false
    setActiveMission(previous => publication.valid() ? null : previous)
    setMissionFeedback(previous => publication.valid() ? null : previous)
    setMissionCelebration(previous => publication.valid() ? null : previous)
    setIsTyping(previous => publication.valid() ? false : previous)
    appendLinguaMessages({
      id: `mission-exit-${Date.now()}`,
      role: 'lingua',
      text: 'Salimos de la mision. Seguimos en chat libre cuando quieras.',
      feedback: null,
      missionType: 'exit',
      ts: Date.now(),
    }, publication)
    return publication.valid()
  }, [appendLinguaMessages])

  const sendMessage = useCallback(async (text) => {
    // Keep the originating account lease through the request AND React's deferred flush.
    const chatAccess = captureLearnerAccess()
    const chatGeneration = chatGenerationRef.current
    const chatStillCurrent = () => chatAccess.valid() && chatGenerationRef.current === chatGeneration
    if (!chatStillCurrent() || !text.trim()) return

    const missionDetails = getActiveMissionDetails(activeMission)
    if (missionDetails?.step) {
      submitMissionStep(text.trim())
      return
    }

    // React's isTyping state is asynchronous. Two rapid submits otherwise send
    // duplicate HTTP turns and award practice XP twice before the next render.
    const pending = chatInFlightRef.current
    // React can publish the learner message while HTTP is still pending.
    // Unlock only when the actual reply (or fallback) has committed, not
    // merely when the message array changes or the request settles.
    if (pending?.generation === chatGeneration && pending.access.valid()
      && (!pending.committed || !messages.some(message => message.id === pending.replyId))) return
    const inFlight = { generation: chatGeneration, access: chatAccess, replyId: null, committed: false }
    chatInFlightRef.current = inFlight

    const userMsg = {
      id: `u${Date.now()}`,
      role: 'user',
      text: text.trim(),
      ts: Date.now(),
    }
    setMessages(prev => chatStillCurrent() ? [...prev, userMsg] : prev)
    setIsTyping(prev => chatStillCurrent() ? true : prev)
    setSelectedMessage(prev => chatStillCurrent() ? null : prev)

    try {
      const history = messages.slice(-8).map(m => ({
        role: m.role,
        text: m.text,
        correction: m.feedback?.correction || null,
      }))
      /*
       * Has the LEARNER said anything yet?
       *
       * Not "is the history empty": the screen opens with Lingua's welcome, so it
       * never is, and checking length meant the subject was never offered at all.
       * What matters is whether the conversation has a subject of the learner's —
       * before their first message it does not, and after it, it does.
       */
      const learnerHasSpoken = messages.some(m => m.role === 'user')
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
        // one short topic the learner mentioned before, if there is a suitable
        // one; nothing else about them travels with the message
        rememberedLike: selectLearnerFact(loadLearnerModel(), {
          accept: (f) => Boolean(asSubjectValue(f.value)),
          type: 'like', seed: sessionId, dismissedIds: loadMemoryContext().dismissedFactIds,
        })?.value || null,
        /*
         * The subject travels with the OPENING message and then stops. Once a
         * conversation exists, whatever the learner made it about is what it is
         * about: a suggestion that keeps arriving turn after turn is how a tutor
         * ends up saying "anyway, back to technology".
         */
        topicContext: learnerHasSpoken ? null : providerTopicContext(conversationTopic),
      })
      if (!chatStillCurrent()) return

      setConnectionNotice(prev => chatStillCurrent() ? response.connectionMessage : prev)
      setMemoryNotice(prev => chatStillCurrent() ? (response.correction
        ? 'Your recent corrections are saved on this device.'
        : "I'll remember what we practiced today.") : prev)
      setLocalProgress(previous => chatStillCurrent() ? recordPractice(previous, {
        userMessage: text.trim(),
        response,
      }) : previous)
      /*
       * Cooldown, not history: one id, so the next conversation prefers a
       * different one. No message, no reply and no prompt is recorded anywhere.
       */
      if (chatStillCurrent() && !learnerHasSpoken && conversationTopic?.interestId) {
        recordTopicUse(conversationTopic.interestId, { access: chatAccess })
      }

      const linguaMsg = {
        id: `l${Date.now()}`,
        role: 'lingua',
        text: response.reply,
        audioEligible: profile.style !== 'translation',
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
      inFlight.replyId = linguaMsg.id
      setMessages(prev => chatStillCurrent() ? [...prev, linguaMsg] : prev)
      setSelectedMessage(prev => chatStillCurrent() ? linguaMsg : prev)
    } catch {
      if (!chatStillCurrent()) return
      setConnectionNotice(prev => chatStillCurrent() ? 'Lingua had trouble connecting. You can keep exploring the demo.' : prev)
      const fallbackMsg = {
        id: `e${Date.now()}`,
        role: 'lingua',
        text: 'You can keep practicing with the demo while the connection recovers.',
        feedback: null,
        ts: Date.now(),
      }
      inFlight.replyId = fallbackMsg.id
      setMessages(prev => chatStillCurrent() ? [...prev, fallbackMsg] : prev)
    } finally {
      // An old reply cannot release a replacement request after Clear. A
      // settled current reply stays locked until React commits its messages;
      // otherwise another click could award the same free-chat turn twice.
      if (chatInFlightRef.current === inFlight) {
        if (chatStillCurrent() && inFlight.replyId) inFlight.committed = true
        else chatInFlightRef.current = null
      }
      setIsTyping(prev => chatStillCurrent() ? false : prev)
    }
  }, [activeCompanion, activeMission, conversationTopic, interfaceLanguageInfo, messages, nativeLanguageInfo, profile, sessionId, submitMissionStep, targetLanguage, tutorPreferences])

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
    const access = captureLearnerAccess()
    if (!access.valid() || !msg) return
    setSelectedMessage(prev => access.valid() ? (prev?.id === msg.id ? null : msg) : prev)
  }, [])

  const clearMessages = useCallback(() => {
    const access = captureLearnerAccess()
    if (!access.valid()) return false
    const welcome = createWelcomeMessage(interfaceLanguageInfo.base)
    // Persist with the originating account lease BEFORE publishing an empty
    // chat. Otherwise denied storage resurrects the old conversation on reload.
    if (!saveStoredMessages([welcome], { access }) || !access.valid()) return false
    ++chatGenerationRef.current
    chatInFlightRef.current = null
    setIsTyping(prev => access.valid() ? false : prev)
    setMessages(prev => access.valid() ? [welcome] : prev)
    setSelectedMessage(prev => access.valid() ? null : prev)
    return access.valid()
  }, [interfaceLanguageInfo.base])

  const resetLocalProgress = useCallback(() => {
    // A confirmation dialog and React's queued state updates can outlive the
    // account that requested the reset. Never clear B or publish A's reset to B.
    const access = captureLearnerAccess()
    if (!access.valid() || !window.confirm(t('resetProgressConfirm')) || !access.valid()) return
    const welcome = createWelcomeMessage(interfaceLanguageInfo.base)
    const emptyProgress = createEmptyProgress()
    // Destructive reset is not a best-effort UI action: every storage step
    // must be verified for the same account before React can display success.
    if (clearStoredProgress({ access }) === false || !access.valid()) return
    if (clearMissionStorage({ access }) === false || !access.valid()) return
    const nextSessionId = createSessionId({ access })
    if (!nextSessionId || !access.valid()) return
    if (saveStoredMessages([welcome], { access }) === false || !access.valid()) return
    if (saveLocalProgress(emptyProgress, { access }) === false || !access.valid()) return
    ++missionGenerationRef.current
    ++chatGenerationRef.current
    chatInFlightRef.current = null
    setSessionId(prev => access.valid() ? nextSessionId : prev)
    setMessages(prev => access.valid() ? [welcome] : prev)
    setLocalProgress(prev => access.valid() ? emptyProgress : prev)
    setSelectedMessage(prev => access.valid() ? null : prev)
    setIsTyping(prev => access.valid() ? false : prev)
    setConnectionNotice(prev => access.valid() ? null : prev)
    setMemoryNotice(prev => access.valid() ? null : prev)
    setActiveMission(prev => access.valid() ? null : prev)
    setCompletedMissions(prev => access.valid() ? [] : prev)
    setMissionFeedback(prev => access.valid() ? null : prev)
    setMissionCelebration(prev => access.valid() ? null : prev)
    setView(prev => access.valid() ? 'today' : prev)
  }, [t, interfaceLanguageInfo.base])

  const activeMissionDetails = getActiveMissionDetails(activeMission)

  return (
    <AppContext.Provider value={{
      authStep, setAuthStep,
      nativeLanguage, nativeLanguageInfo, interfaceReady,
      interfaceLanguage, interfaceLanguageInfo,
      targetLanguage,
      setNativeLanguage: updateNativeLanguage,
      updateNativeLanguage,
      t,
      authUser, authProviderError,
      login, signup, requestPasswordReset, resendConfirmation, changePassword,
      completePlacement, completeTutorPersonality, completeLearningPrefs,
      completePersonalization, applyRecommendedSetup,
      showWelcome, dismissWelcome,
      showTutorial, dismissTutorial,
      episodeActiveId, episodeRunOptions, episodeArcVersion, startEpisode, exitEpisode, awardEpisode, finishEpisode,
      dailySession, sessionActive, preferredDuration,
      previewSession, chooseDuration, beginSession, advanceSession, finishSession, exitSession,
      logout,
      darkMode, toggleDark, setThemeDark,
      onboardingCompleted, completeOnboarding,
      profile, updateProfile,
      tutorPreferences, updateTutorPreferences, tutorPreferenceSaveFailed,
      conversationTopic, useAnotherConversationTopic,
      activeCompanion, setActiveCompanion,
      textSize, setTextSize,
      view, navigateTo,
      activeMission, activeMissionDetails, completedMissions,
      missionFeedback, missionCelebration,
      startPracticeMission, submitMissionStep, submitMissionOption, abandonMission,
      messages, sendMessage, clearMessages, isTyping,
      sessionId, localProgress, resetLocalProgress,
      chatAppearance, setChatAppearance,
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
