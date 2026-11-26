import './helpers/garde.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'

const dossierRoutes = new URL('../src/routes/', import.meta.url)

test('tous les montages de modules sont présents', async () => {
  const index = await readFile(new URL('index.js', dossierRoutes), 'utf8')
  const montages = [
    'health',
    'auth',
    'users',
    'animals',
    'parcelles',
    'cycles',
    'stocks/produits',
    'stocks/mouvements',
    'stocks',
    'veterinaire/dossiers',
    'veterinaire/evenements',
    'veterinaire',
    'finances/categories',
    'finances/operations',
    'finances',
    'employes',
    'taches',
    'notifications',
    'rapports',
  ]
  for (const montage of montages) {
    assert.ok(
      index.includes(`router.use('/${montage}'`),
      `Montage manquant : /${montage}`
    )
  }
})

test('les 19 routeurs fonctionnels exposent 102 routes', async () => {
  const fichiers = (await readdir(dossierRoutes)).filter(
    (nom) => nom.endsWith('Routes.js') && nom !== 'index.js'
  )
  assert.equal(fichiers.length, 19)

  let total = 0
  for (const nom of fichiers) {
    const contenu = await readFile(new URL(nom, dossierRoutes), 'utf8')
    total += (
      contenu.match(/router\.(?:get|post|put|patch|delete)\(/g) ?? []
    ).length
  }
  assert.equal(total, 102, `Nombre de routes relevé : ${total}`)
})

test('le module Rapports reste réservé à ADMIN et MANAGER', async () => {
  const rapport = await readFile(
    new URL('rapportRoutes.js', dossierRoutes),
    'utf8'
  )
  assert.ok(rapport.includes("authorize('ADMIN', 'MANAGER')"))
  assert.doesNotMatch(rapport, /authorize\([^)]*EMPLOYEE/)
  assert.ok(rapport.includes("router.get('/export.csv'"))
  assert.ok(rapport.includes("router.get('/export.json'"))
})

test("les gardes frontend et backend n'ont pas été affaiblies", async () => {
  const route = await readFile(
    new URL('../../frontend/src/routes/RoleBasedRoute.jsx', import.meta.url),
    'utf8'
  )
  const page = await readFile(
    new URL('../../frontend/src/pages/rapports/Rapports.jsx', import.meta.url),
    'utf8'
  )
  assert.ok(route.includes('roles.includes(user.role)'))
  assert.ok(page.includes('hasRole(...ROLES_ENCADREMENT)'))
})
