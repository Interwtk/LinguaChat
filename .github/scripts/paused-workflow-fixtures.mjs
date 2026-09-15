import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('../../', import.meta.url))
const activeDir = join(repoRoot, '.github', 'workflows')
const pausedDir = join(repoRoot, '.github', 'workflows-paused')
const manualMarker = join(repoRoot, 'MANUAL_CHATGPT_DEVELOPMENT.md')

export function materializePausedWorkflowFixtures() {
  if (!existsSync(manualMarker)) {
    throw new Error('paused-workflow fixtures require MANUAL_CHATGPT_DEVELOPMENT.md')
  }
  if (!existsSync(pausedDir)) {
    throw new Error('.github/workflows-paused is missing')
  }

  mkdirSync(activeDir, { recursive: true })
  const created = []
  for (const name of readdirSync(pausedDir)) {
    if (!/\.ya?ml$/i.test(name)) continue
    const source = join(pausedDir, name)
    const target = join(activeDir, name)
    if (existsSync(target)) continue
    copyFileSync(source, target)
    created.push(target)
  }

  return () => {
    for (const file of created) rmSync(file, { force: true })
  }
}

export async function runWithPausedWorkflowFixtures(moduleUrl) {
  const cleanup = materializePausedWorkflowFixtures()
  try {
    await import(moduleUrl)
  } finally {
    cleanup()
  }
}
