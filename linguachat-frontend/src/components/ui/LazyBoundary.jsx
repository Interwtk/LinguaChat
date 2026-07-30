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
      style={{ background: 'var(--bg-main)', minHeight: 180 }}
    >
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-muted)' }}>{label}</span>
    </div>
  )
}

function ScreenError({ errorLabel, retryLabel, onRetry }) {
  return (
    <div
      role="alert"
      className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-10 text-center"
      style={{ background: 'var(--bg-main)', minHeight: 180 }}
    >
      <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>{errorLabel}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98]"
        style={{ background: 'var(--violet)', minHeight: 44 }}
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
