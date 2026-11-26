import test from 'node:test'
import assert from 'node:assert/strict'
import { avecVite, decoderHtml, rendrePage } from './helpers/ssr.mjs'

const REFUS = 'réservés aux administrateurs et gestionnaires'
const ONGLETS = [
  'Synthèse',
  'Animaux & cultures',
  'Stocks',
  'Vétérinaire',
  'Finances',
  'Employés & tâches',
]

test('ADMIN et MANAGER voient les six onglets et les exports', async () => {
  await avecVite(async (vite) => {
    for (const role of ['ADMIN', 'MANAGER']) {
      const html = decoderHtml(
        await rendrePage(vite, '/src/pages/rapports/Rapports.jsx', role)
      )
      assert.ok(!html.includes(REFUS), `${role} refuse la page`)
      for (const onglet of ONGLETS) {
        assert.ok(html.includes(onglet), `${role} : onglet ${onglet} absent`)
      }
      assert.ok(html.includes('Exporter CSV'), `${role} : bouton CSV absent`)
      assert.ok(html.includes('Exporter JSON'), `${role} : bouton JSON absent`)
      assert.ok(
        html.toLowerCase().includes('lecture seule'),
        `${role} : mention lecture seule absente`
      )
      assert.doesNotMatch(html, />PDF</, `${role} : bouton PDF présent`)
      assert.doesNotMatch(html, />Excel</, `${role} : bouton Excel présent`)
    }
  })
})

test('EMPLOYEE est refusé sans onglets ni export', async () => {
  await avecVite(async (vite) => {
    const html = decoderHtml(
      await rendrePage(vite, '/src/pages/rapports/Rapports.jsx', 'EMPLOYEE')
    )
    assert.ok(html.includes(REFUS))
    assert.ok(!html.includes('Exporter CSV'))
    assert.ok(!html.includes('Exporter JSON'))
    for (const onglet of ONGLETS) {
      assert.ok(!html.includes(onglet), `onglet ${onglet} exposé à EMPLOYEE`)
    }
  })
})

test('régression hasRole(...ROLES_ENCADREMENT) couverte pour ADMIN', async () => {
  await avecVite(async (vite) => {
    const html = decoderHtml(
      await rendrePage(vite, '/src/pages/rapports/Rapports.jsx', 'ADMIN')
    )
    assert.ok(
      !html.includes(REFUS),
      'l’appel non variadique hasRole(ROLES_ENCADREMENT) est réapparu'
    )
  })
})
