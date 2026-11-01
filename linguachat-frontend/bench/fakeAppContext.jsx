/*
 * The synthetic `useApp()` the visual bench gives every component (see
 * vite.bench.config.mjs). Development only; never imported by the product.
 *
 * Each scene wraps its components in <AppProvider value={…}> with the few
 * values it needs. Anything a component asks for that a scene did not set is
 * a no-op function (for actions such as setX/onX/navigateTo) or undefined —
 * nothing here signs in, stores or sends anything.
 */
import { createContext, useContext } from 'react'

const Ctx = createContext({})
const noop = () => {}
const ACTION = /^(set|on|toggle|start|begin|navigate|select|submit|abandon|use|update|save|reset|logout|login|signup|send|resend|change|request|complete|record|dismiss|clear|open|close|finish|retry|mark)/

export function AppProvider({ value, children }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useApp = () => {
  const value = useContext(Ctx)
  return new Proxy(value, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (typeof prop === 'string' && ACTION.test(prop)) return noop
      return undefined
    },
  })
}

export default AppProvider
