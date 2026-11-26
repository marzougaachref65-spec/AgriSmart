/**
 * Point d'entrée npm test.
 * - Refuse un NODE_ENV explicitement différent de "test".
 * - Force une base de test explicite, jamais "agrismart".
 * - Lance exclusivement le test runner natif node:test.
 */
import { spawnSync } from 'node:child_process'

if (process.env.NODE_ENV && process.env.NODE_ENV !== 'test') {
  console.error(
    'REFUS SÉCURITÉ : NODE_ENV="' +
      process.env.NODE_ENV +
      '" ; les tests exigent NODE_ENV="test".'
  )
  process.exit(1)
}
process.env.NODE_ENV = 'test'

const uri = process.env.MONGO_URI ?? ''
const sansProtocole = uri.replace(/^mongodb(?:\+srv)?:\/\//, '')
const segments = sansProtocole.split('?')[0].split('/').filter(Boolean)
const base = segments.length > 1 ? segments[segments.length - 1] : ''
if (base.toLowerCase() === 'agrismart') {
  console.error(
    'REFUS SÉCURITÉ : MONGO_URI cible la base réelle "agrismart". Tests interrompus.'
  )
  process.exit(1)
}

process.env.MONGO_URI ??= 'mongodb://127.0.0.1:27021/agrismart_test'
process.env.JWT_SECRET ??= 'secret-de-test-uniquement'
process.env.CORS_ORIGIN ??= 'http://localhost:5173'
process.env.PORT ??= '5001'

const resultat = spawnSync(process.execPath, ['--test', 'test'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
})

process.exit(resultat.status ?? 1)
