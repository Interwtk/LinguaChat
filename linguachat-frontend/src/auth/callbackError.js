// URL state can request an error notice; it never establishes authentication
// or recovery authority. Do not reflect provider/user-controlled descriptions.
export function authCallbackError(href) {
  try {
    const url = new URL(href)
    if (!['confirmed', 'reset'].includes(url.searchParams.get('auth'))) return null
    const hash = new URLSearchParams(url.hash.slice(1))
    return [url.searchParams, hash].some(p => p.has('error') || p.has('error_code'))
      ? 'callback_error' : null
  } catch { return null }
}
