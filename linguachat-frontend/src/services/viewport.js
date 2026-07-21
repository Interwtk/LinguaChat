/*
 * viewport — which layout shell is live.
 *
 * The desktop and mobile shells must never be MOUNTED at the same time. Hiding
 * one with CSS still mounts its whole tree, which means two independent copies
 * of stateful views (notably EpisodeShell). Crossing the breakpoint then swaps a
 * stale copy into view, and that copy persists its own outdated step index over
 * real progress. Mounting exactly one shell removes that class of bug entirely,
 * and also halves the rendered DOM.
 *
 * DESKTOP_QUERY mirrors Tailwind's default `lg` breakpoint (1024px) used by the
 * `hidden lg:flex` / `lg:hidden` classes, so CSS and mounting agree.
 */
import { useEffect, useState } from 'react'

export const DESKTOP_QUERY = '(min-width: 1024px)'

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    try { return window.matchMedia(query).matches } catch { return false }
  })

  useEffect(() => {
    let mql
    try { mql = window.matchMedia(query) } catch { return undefined }
    // Re-read the query rather than trusting the event payload, and listen to
    // `resize` as well: some environments (devtools/emulated viewports, older
    // engines) change the match without emitting a `change` event, which would
    // otherwise leave the wrong shell mounted — i.e. a blank screen.
    const sync = () => setMatches(window.matchMedia(query).matches)
    sync()
    if (mql.addEventListener) mql.addEventListener('change', sync)
    else mql.addListener(sync)
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', sync)
      else mql.removeListener(sync)
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
    }
  }, [query])

  return matches
}

export function useIsDesktop() {
  return useMediaQuery(DESKTOP_QUERY)
}
