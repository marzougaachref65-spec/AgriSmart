import './helpers/garde.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

function lancerGarde(changements) {
  return spawnSync(
    process.execPath,
    ['--input-type=module', '-e', "await import('./test/helpers/garde.mjs')"],
    {
      cwd: process.cwd(),
      env: { ...process.env, ...changements },
      encoding: 'utf8',
    }
  )
}

test('refuse NODE_ENV différent de test', () => {
  const resultat = lancerGarde({ NODE_ENV: 'development' })
  assert.notEqual(resultat.status, 0)
  assert.match(resultat.stderr, /NODE_ENV/)
})

test('refuse explicitement la base agrismart', () => {
  const resultat = lancerGarde({
    NODE_ENV: 'test',
    MONGO_URI: 'mongodb://127.0.0.1:27021/agrismart',
  })
  assert.notEqual(resultat.status, 0)
  assert.match(resultat.stderr, /agrismart/)
})

test('refuse une URI sans nom de base explicite', () => {
  const resultat = lancerGarde({
    NODE_ENV: 'test',
    MONGO_URI: 'mongodb://127.0.0.1:27021',
  })
  assert.notEqual(resultat.status, 0)
  assert.match(resultat.stderr, /nom de base de test explicite/)
})

test('accepte une base de test explicite', () => {
  const resultat = lancerGarde({
    NODE_ENV: 'test',
    MONGO_URI: 'mongodb://127.0.0.1:27021/agrismart_test',
  })
  assert.equal(resultat.status, 0)
})
