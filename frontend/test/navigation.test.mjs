import test from 'node:test'
import assert from 'node:assert/strict'
import {
  avecVite,
  rendreRouteProtegee,
} from './helpers/ssr.mjs'

test('menu Rapports visible pour ADMIN et MANAGER, absent pour EMPLOYEE', async () => {
  await avecVite(async (vite) => {
    const navigation = await vite.ssrLoadModule('/src/utils/navigation.js')
    const aRapports = (role) =>
      navigation
        .getNavigationPourRole(role)
        .some((groupe) => groupe.items.some((item) => item.to === '/rapports'))

    assert.equal(aRapports('ADMIN'), true)
    assert.equal(aRapports('MANAGER'), true)
    assert.equal(aRapports('EMPLOYEE'), false)
  })
})

test('rôles d’encadrement exactement ADMIN et MANAGER', async () => {
  await avecVite(async (vite) => {
    const constantes = await vite.ssrLoadModule('/src/utils/constants.js')
    assert.deepEqual(constantes.ROLES_ENCADREMENT, ['ADMIN', 'MANAGER'])
    assert.deepEqual(constantes.LIBELLES_ROLES.ADMIN, 'Administrateur')
  })
})

test('RoleBasedRoute laisse passer ADMIN/MANAGER et refuse EMPLOYEE', async () => {
  await avecVite(async (vite) => {
    for (const role of ['ADMIN', 'MANAGER']) {
      const html = await rendreRouteProtegee(vite, role)
      assert.ok(
        html.includes('PAGE_RAPPORTS_ATTEINTE'),
        `${role} n’atteint pas la route`
      )
    }
    const html = await rendreRouteProtegee(vite, 'EMPLOYEE')
    assert.ok(!html.includes('PAGE_RAPPORTS_ATTEINTE'))
    assert.ok(html.includes('Accès non autorisé'))
  })
})
