import './helpers/garde.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { authorize } from '../src/middlewares/authorize.js'
import { ApiError } from '../src/utils/apiError.js'

const encadrement = authorize('ADMIN', 'MANAGER')

function essayer(middleware, role) {
  let erreur
  middleware({ user: role ? { role } : undefined }, {}, (e) => {
    erreur = e
  })
  return erreur
}

test('ADMIN est autorisé par authorize(ADMIN, MANAGER)', () => {
  assert.equal(essayer(encadrement, 'ADMIN'), undefined)
})

test('MANAGER est autorisé par authorize(ADMIN, MANAGER)', () => {
  assert.equal(essayer(encadrement, 'MANAGER'), undefined)
})

test('EMPLOYEE reçoit une ApiError 403', () => {
  const erreur = essayer(encadrement, 'EMPLOYEE')
  assert.ok(erreur instanceof ApiError)
  assert.equal(erreur.statusCode, 403)
})

test('absence de rôle reçoit une ApiError 403', () => {
  assert.equal(essayer(encadrement, undefined)?.statusCode, 403)
})

test('ADMIN seul refuse MANAGER', () => {
  const adminSeul = authorize('ADMIN')
  assert.equal(essayer(adminSeul, 'ADMIN'), undefined)
  assert.equal(essayer(adminSeul, 'MANAGER')?.statusCode, 403)
})
