import { spawnSync } from 'node:child_process'

process.env.NODE_ENV ??= 'test'

const resultat = spawnSync(
  process.execPath,
  ['--test', '--test-concurrency=1', 'test'],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  }
)

process.exit(resultat.status ?? 1)
