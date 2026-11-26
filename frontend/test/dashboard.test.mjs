import test from 'node:test'
import assert from 'node:assert/strict'
import { avecVite, decoderHtml, rendrePage } from './helpers/ssr.mjs'

const CHEMIN_DASHBOARD = '/src/pages/dashboard/Dashboard.jsx'
const ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE']

const VALEURS_FICTIVES = [
  '248',
  '+4,2 %',
  'Rendement (démo)',
  'Objectif (démo)',
  'Vaches',
  'Moutons',
  'Chèvres',
  '12 juin 2026',
  'Vaccination – Lot ovins A',
  'Effectifs fictifs',
  'Évolution des rendements',
  'Activités récentes (démo)',
  'Données de démonstration',
  'Phase 2',
]

async function htmlPourRole(vite, role) {
  return decoderHtml(await rendrePage(vite, CHEMIN_DASHBOARD, role))
}

test('le Dashboard n’affiche aucune donnée fictive', async () => {
  await avecVite(async (vite) => {
    for (const role of ROLES) {
      const html = await htmlPourRole(vite, role)
      for (const valeur of VALEURS_FICTIVES) {
        assert.ok(
          !html.includes(valeur),
          `${role} : la valeur fictive "${valeur}" est encore affichée`
        )
      }
      assert.ok(html.includes('Données réelles — MongoDB'), `${role} : origine réelle absente`)
      assert.ok(
        html.includes('Période des indicateurs financiers et des mouvements'),
        `${role} : période absente`
      )
      assert.ok(
        html.includes('état actuel de la base, sans période'),
        `${role} : précision sur les effectifs absente`
      )
      assert.ok(!html.toLowerCase().includes('salaire'), `${role} : salaire exposé`)
    }
  })
})

test('les données financières du Dashboard sont réservées à ADMIN et MANAGER', async () => {
  await avecVite(async (vite) => {
    for (const role of ['ADMIN', 'MANAGER']) {
      const html = await htmlPourRole(vite, role)
      assert.ok(html.includes('Finances — données réelles'), `${role} : section finances absente`)
      assert.ok(html.includes('Tâches en cours'), `${role} : libellé tâches global absent`)
      assert.ok(
        html.includes('Chargement des données financières...'),
        `${role} : chargement financier absent`
      )
    }

    const htmlEmploye = await htmlPourRole(vite, 'EMPLOYEE')
    assert.ok(!htmlEmploye.includes('Finances — données réelles'))
    assert.ok(!htmlEmploye.includes('Revenus (période)'))
    assert.ok(!htmlEmploye.includes('Dépenses (période)'))
    assert.ok(!htmlEmploye.includes('Bénéfice (période)'))
    assert.ok(!htmlEmploye.includes('Évolution des dépenses mensuelles'))
    assert.ok(!htmlEmploye.includes('25.750 DT'))
    assert.ok(
      htmlEmploye.includes("Évolution financière réservée à l'encadrement"),
      'EMPLOYEE : message de restriction financière absent'
    )
    assert.ok(htmlEmploye.includes('Mes tâches en cours'))
  })
})

test('la version 1.0.0 reste affichée sur le Dashboard', async () => {
  await avecVite(async (vite) => {
    for (const role of ROLES) {
      const html = await htmlPourRole(vite, role)
      assert.ok(html.includes('Version 1.0.0'), `${role} : version absente`)
    }
  })
})
