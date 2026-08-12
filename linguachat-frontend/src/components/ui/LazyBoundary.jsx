import { useCallback, useEffect, useState } from 'react'

/*
 * Loading boundaries for code-split screens.
 *
 * A lazy chunk can fail (flaky network, a deploy that replaced the file). React
 * would then unmount the tree and leave a blank page, which looks like data
 * loss. Instead we keep the app's background and layout, explain what happened
 * in the interface language, and offer a retry — progress lives in localStorage
 * and is never touched here.
 *
 * We deliberately do NOT use React.lazy + Suspense: React.lazy memoises the
 * rejected promise, so "try again" would re-render the same failure forever
 * even after the network recovered. Loading the module ourselves lets a retry
 * really re-run the import — and, when the browser has already cached the failed
 * module record, fall back to a single guarded reload.
 */

// Deliberately quiet: same background as the app, no mascot, no spinner that
// could read as an error. Honours reduced motion via the shared .animate-* rules.
export function ScreenFallback({ label }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex-1 flex items-center justify-center px-6 py-10"
      style={{ background: 'var(--bg)', minHeight: 180 }}
    >
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)' }}>{label}</span>
    </div>
  )
}

export function ScreenError({ errorLabel, retryLabel, onRetry }) {
  return (
    <div
      role="alert"
      className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-10 text-center"
      style={{ background: 'var(--bg)', minHeight: 180 }}
    >
      <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>{errorLabel}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98]"
        style={{ background: 'var(--accent)', minHeight: 44 }}
      >
        {retryLabel}
      </button>
    </div>
  )
}

/*
 * Wrap a dynamic import so the screen can be retried.
 *
 *   const Pricing = lazyScreen(() => import('...'), m => m.Pricing)
 *
 * `pick` selects the named export. The returned component takes the labels so
 * every message stays in the learner's interface language.
 */
// A browser caches a module that failed to load, so re-importing the same
// specifier returns the same rejection. Reloading rebuilds the module map — but
// only ever once, guarded here so a permanently missing chunk cannot loop.
const RELOAD_GUARD = 'lc2-chunk-reload'

/*
 * Was this a MODULE that failed to arrive, rather than the code inside it
 * throwing?
 *
 * It matters because the two need opposite retries. A module whose fetch failed
 * is recorded as failed in the browser's module map, so calling the same
 * `import()` again resolves to the same rejection WITHOUT touching the network:
 * measured against a real build with the arc's chunk deleted, the first press of
 * Retry produced zero requests and redrew the same error. Only a fresh document
 * can clear that entry. Anything else — a transient throw while resolving, a
 * module that loaded but was unhappy — is worth simply running again.
 *
 * Chrome, Firefox and Safari word this differently, hence the three shapes.
 */
const isModuleLoadFailure = (error) => {
  const message = String(error?.message || error || '')
  return /dynamically imported module/i.test(message)   // Chrome, Safari
    || /error loading dynamically imported module/i.test(message)
    || /Importing a module script failed/i.test(message) // Firefox
}

/*
 * The same boundary, for DATA rather than for a component.
 *
 * An episode's definition is fetched exactly like a screen — a dynamic import
 * that can fail — but it is data, so `lazyScreen` cannot carry it. This hook
 * keeps the two behaviours that were worth getting right in one place: the
 * per-effect `cancelled` flag (a component-lifetime ref breaks under StrictMode,
 * see above) and a retry that really re-runs the import.
 *
 * A REFUSAL IS NOT A FAILURE. The content resolver refuses a closed level or an
 * unknown id by design; retrying that forever would be dishonest. `classify`
 * decides, and a refusal is returned as `refused` with no retry offered.
 */
export function useLazyContent(load, deps, classify = () => null) {
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const key = JSON.stringify(deps)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    Promise.resolve()
      .then(() => load())
      .then((value) => {
        if (cancelled) return
        try { sessionStorage.removeItem(RELOAD_GUARD) } catch { /* private mode */ }
        setState({ status: 'ready', value })
      })
      .catch((error) => {
        if (cancelled) return
        const refusal = classify(error)
        if (refusal) { setState({ status: 'refused', reason: refusal }); return }
        if (import.meta.env?.DEV) console.error('[useLazyContent] load failed', error)
        setState({ status: 'failed', moduleMissing: isModuleLoadFailure(error) })
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  /*
   * RETRY HAS TO MATCH THE FAILURE, or it is a button that does nothing.
   *
   * When the CHUNK itself never arrived, running the same import again cannot
   * work — the browser has already recorded that module as failed and answers
   * from the module map without a request. So that case goes straight for the
   * only thing that can help: one fresh document. Every other failure gets a
   * plain re-run first, and the reload is held in reserve for the second press.
   *
   * The guard is what keeps this honest: the reload happens AT MOST ONCE per
   * session, so a chunk that is genuinely gone lands back on the same error
   * screen instead of reloading for ever.
   */
  const retry = useCallback(() => {
    if (state.moduleMissing || attempt >= 1) {
      try {
        if (!sessionStorage.getItem(RELOAD_GUARD)) {
          sessionStorage.setItem(RELOAD_GUARD, '1')
          window.location.reload()
          return
        }
      } catch { /* storage unavailable: fall through to a plain retry */ }
    }
    setAttempt(a => a + 1)
  }, [attempt, state.moduleMissing])

  return { ...state, retry }
}

export function lazyScreen(factory, pick = (m) => m.default) {
  return function LazyScreen({ loadingLabel, errorLabel, retryLabel, ...props }) {
    const [Loaded, setLoaded] = useState(null)
    const [failed, setFailed] = useState(false)
    const [attempt, setAttempt] = useState(0)

    /*
     * The per-effect `cancelled` flag is the only guard we need. A component-
     * lifetime "is mounted" ref would be wrong here: StrictMode mounts, cleans
     * up and remounts, so such a ref stays false after the first cleanup and
     * every later import result gets discarded — the screen then hangs on the
     * loading label forever. The same would happen on any real remount.
     */
    useEffect(() => {
      let cancelled = false
      setFailed(false)
      Promise.resolve()
        .then(() => factory(attempt))
        .then((mod) => {
          if (cancelled) return
          const Component = pick(mod)
          if (!Component) throw new Error('lazyScreen: module has no component export')
          // a good load clears the guard so a future failure may reload again
          try { sessionStorage.removeItem(RELOAD_GUARD) } catch { /* private mode */ }
          // store as a thunk so React does not call it as a state updater
          setLoaded(() => Component)
        })
        .catch((error) => {
          if (cancelled) return
          if (import.meta.env?.DEV) console.error('[lazyScreen] chunk failed to load', error)
          setFailed(true)
        })
      return () => { cancelled = true }
    }, [attempt])

    const retry = useCallback(() => {
      // First press: re-run the import — enough when the failure never reached
      // the module map. After that only a reload can clear the cached failure,
      // and we take it at most once per page life.
      if (attempt >= 1) {
        try {
          if (!sessionStorage.getItem(RELOAD_GUARD)) {
            sessionStorage.setItem(RELOAD_GUARD, '1')
            window.location.reload()
            return
          }
        } catch { /* storage unavailable: fall through to a plain retry */ }
      }
      setAttempt(a => a + 1)
    }, [attempt])

    if (failed) return <ScreenError errorLabel={errorLabel} retryLabel={retryLabel} onRetry={retry} />
    if (!Loaded) return <ScreenFallback label={loadingLabel} />
    return <Loaded {...props} />
  }
}

export default lazyScreen
