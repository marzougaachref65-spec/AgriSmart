import './helpers/garde.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { errorHandler } from '../src/middlewares/errorHandler.js'
import { ApiError } from '../src/utils/apiError.js'

function capturer() {
  const sortie = { statut: null, corps: null }
  const res = {
    status(code) {
      sortie.statut = code
      return this
    },
    json(corps) {
      sortie.corps = corps
      return this
    },
  }
  return { res, sortie }
}

test('doublon Mongo 11000 donne 409 avec un message générique correct', () => {
  const { res, sortie } = capturer()
  errorHandler({ code: 11000, keyValue: { email: 'a@b.c' } }, {}, res, () => {})
  assert.equal(sortie.statut, 409)
  assert.equal(sortie.corps.success, false)
  assert.equal(sortie.corps.message, 'Cette valeur est déjà utilisée')
  assert.doesNotMatch(sortie.corps.message, /e-mail/i)
})

test('ApiError 403 conserve son statut et son message métier', () => {
  const { res, sortie } = capturer()
  errorHandler(new ApiError(403, 'Permissions insuffisantes'), {}, res, () => {})
  assert.equal(sortie.statut, 403)
  assert.equal(sortie.corps.message, 'Permissions insuffisantes')
})

test('erreur 500 reste générique et ne divulgue aucun détail', () => {
  const { res, sortie } = capturer()
  errorHandler(new Error('secret interne'), {}, res, () => {})
  assert.equal(sortie.statut, 500)
  assert.equal(sortie.corps.message, 'Erreur interne du serveur')
  assert.doesNotMatch(JSON.stringify(sortie.corps), /secret interne/)
})

test('JSON invalide donne 400', () => {
  const { res, sortie } = capturer()
  errorHandler({ type: 'entity.parse.failed' }, {}, res, () => {})
  assert.equal(sortie.statut, 400)
  assert.match(sortie.corps.message, /JSON invalide/)
})
