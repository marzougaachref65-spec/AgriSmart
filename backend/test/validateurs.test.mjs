import './helpers/garde.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { validationResult } from 'express-validator'
import { updateEmployeRules } from '../src/validators/employeValidator.js'
import { createProduitRules } from '../src/validators/produitValidator.js'
import {
  DOMAINES_EXPORT,
  DOMAINES_RAPPORT,
  exportRules,
} from '../src/validators/rapportValidator.js'

async function valider(regles, req) {
  const contexte = { body: {}, params: {}, query: {}, ...req }
  for (const regle of regles) {
    await regle.run(contexte)
  }
  return validationResult(contexte)
}

test('téléphone employé : 30 caractères acceptés en modification', async () => {
  const resultat = await valider(updateEmployeRules, {
    body: { telephone: '1'.repeat(30) },
  })
  assert.equal(resultat.isEmpty(), true, JSON.stringify(resultat.array()))
})

test('téléphone employé : 31 caractères refusés en modification', async () => {
  const resultat = await valider(updateEmployeRules, {
    body: { telephone: '1'.repeat(31) },
  })
  assert.equal(resultat.isEmpty(), false)
  assert.ok(
    resultat.array().some((e) => /trop long/i.test(e.msg)),
    JSON.stringify(resultat.array())
  )
})

test('quantiteDisponible reste interdite à la création produit', async () => {
  const resultat = await valider(createProduitRules, {
    body: { nom: 'Test', quantiteDisponible: 5 },
  })
  assert.equal(resultat.isEmpty(), false)
  assert.ok(
    resultat.array().some((e) => e.path === 'quantiteDisponible'),
    JSON.stringify(resultat.array())
  )
})

test('domaine de rapport invalide refusé', async () => {
  const resultat = await valider(exportRules, {
    query: { domaine: 'inconnu' },
  })
  assert.equal(resultat.isEmpty(), false)
})

test('domaine synthese accepté pour export', async () => {
  const resultat = await valider(exportRules, {
    query: { domaine: 'synthese' },
  })
  assert.equal(resultat.isEmpty(), true, JSON.stringify(resultat.array()))
})

test('période inversée refusée', async () => {
  const resultat = await valider(exportRules, {
    query: {
      domaine: 'stocks',
      debut: '2026-12-01',
      fin: '2026-01-01',
    },
  })
  assert.equal(resultat.isEmpty(), false)
})

test('les cinq domaines et la synthèse sont les seuls domaines exportables', () => {
  assert.deepEqual(DOMAINES_RAPPORT, [
    'animaux-cultures',
    'stocks',
    'veterinaire',
    'finances',
    'employes-taches',
  ])
  assert.equal(DOMAINES_EXPORT.length, 6)
  assert.ok(DOMAINES_EXPORT.includes('synthese'))
})
