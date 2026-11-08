/*
 * LinguaChat visual bench — DEVELOPMENT ONLY.
 *
 * Renders real product components with SYNTHETIC data so screens that sit
 * behind sign-in can be looked at in a browser (widths, themes, languages,
 * RTL) without any account. It is deliberately not a way into the app:
 *
 *   - it is its own Vite entry (bench/index.html) that the product never
 *     imports, so `vite build` cannot include it (checked on every build by
 *     check-bundle-boundaries);
 *   - this config refuses to build at all, and only serves on 127.0.0.1;
 *   - components get a fake `useApp()` with synthetic values; there is no auth
 *     service, no session, no token and no storage of real learner data. The
 *     product's guards (lease, account isolation, level gates) are untouched.
 *
 * Run:  npx vite --config bench/vite.bench.config.mjs
 * Then: http://127.0.0.1:5190/bench/?scene=tu&lang=ar&theme=dark
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const BENCH = dirname(fileURLToPath(import.meta.url))
const FAKE_CONTEXT = resolve(BENCH, 'fakeAppContext.jsx')

export default defineConfig(({ command }) => {
  if (command !== 'serve') throw new Error('The visual bench is development-only and is never built.')
  return {
    root: resolve(BENCH, '..'),
    plugins: [
      react(),
      {
        name: 'bench-synthetic-context',
        enforce: 'pre',
        resolveId(source, importer) {
          // Every product import of the app context gets the synthetic one.
          if (importer && !importer.includes('/bench/') && /(^|\/)context\/AppContext(\.jsx)?$/.test(source)) return FAKE_CONTEXT
          return null
        },
      },
    ],
    server: { host: '127.0.0.1', port: 5190, strictPort: true, open: false },
  }
})
