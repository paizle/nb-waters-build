/**
 * Build and push flat dist/ to the `deployment` branch via a git worktree.
 * Keeps the main worktree on `main` so node_modules is never corrupted.
 *
 * Usage: npm run deploy [-- --push]
 *   --push   push to origin/deployment after commit (default: commit only)
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = join(ROOT, 'dist')
const WORKTREE = join(ROOT, '..', '.nb-waters-deploy-wt')
const DEPLOY_BRANCH = 'deployment'
const COMMIT_MSG = 'Preparing deployment.'
const shouldPush = process.argv.includes('--push')

function run(cmd, cwd = ROOT) {
  console.log(`> ${cmd}`)
  execSync(cmd, { cwd, stdio: 'inherit' })
}

function copyDistTo(targetDir) {
  if (!existsSync(DIST)) {
    console.error('dist/ not found — run npm run build first.')
    process.exit(1)
  }
  for (const name of readdirSync(DIST)) {
    const src = join(DIST, name)
    const dest = join(targetDir, name)
    cpSync(src, dest, { recursive: true, force: true })
  }
}

function cleanupWorktree() {
  if (!existsSync(WORKTREE)) return
  try {
    run(`git worktree remove "${WORKTREE}" --force`, ROOT)
  } catch {
    rmSync(WORKTREE, { recursive: true, force: true })
    try {
      run('git worktree prune', ROOT)
    } catch {
      /* ignore */
    }
  }
}

function main() {
  const branch = execSync('git branch --show-current', { cwd: ROOT, encoding: 'utf8' }).trim()
  if (branch !== 'main') {
    console.error(`Deploy must run from main (current: ${branch}).`)
    process.exit(1)
  }

  run('npm run build', ROOT)

  cleanupWorktree()
  mkdirSync(dirname(WORKTREE), { recursive: true })
  run(`git worktree add "${WORKTREE}" ${DEPLOY_BRANCH}`, ROOT)

  copyDistTo(WORKTREE)

  run('git add -A', WORKTREE)
  const status = execSync('git status --porcelain', { cwd: WORKTREE, encoding: 'utf8' }).trim()
  if (!status) {
    console.log('No deployment changes to commit.')
  } else {
    run(`git commit -m "${COMMIT_MSG}"`, WORKTREE)
    if (shouldPush) {
      run(`git push origin ${DEPLOY_BRANCH}`, WORKTREE)
    } else {
      console.log('Committed locally. Run with --push to publish to origin/deployment.')
    }
  }

  cleanupWorktree()
  console.log('Done.')
}

main()
