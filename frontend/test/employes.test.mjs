import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFile } from 'node:fs/promises'
import { avecVite, rendrePage } from './helpers/ssr.mjs'

const employeActif = {
  id: '6b01ba7bd8186b95f820580f',
  nom: 'Ben Ali',
  prenoms: 'Mohamed',
  fonction: 'Ouvrier agricole',
  statut: 'Actif',
  matricule: 'EMP-2026-6732DC',
  salaireMillimes: 35000,
  periodiciteSalaire: 'Mensuel',
  dateRecrutement: '2026-11-21T00:00:00.000Z',
}

const employeInactif = { ...employeActif, statut: 'Inactif' }

async function rendreComposant(vite, chemin, props) {
  const module = await vite.ssrLoadModule(chemin)
  return renderToStaticMarkup(React.createElement(module.default, props))
}

test('la page propose « Ajouter un employé » et un onglet « Inactifs » (ADMIN)', async () => {
  await avecVite(async (vite) => {
    const html = await rendrePage(vite, '/src/pages/employes/Employes.jsx', 'ADMIN')
    assert.match(html, /Ajouter un employé/)
    assert.match(html, /Inactifs/)
    assert.match(html, /Historique/)
    assert.doesNotMatch(html, /Nouvel employé/)
    assert.doesNotMatch(html, /Matricule/i)
  })
})

test('un compte EMPLOYEE ne voit pas le bouton d’ajout', async () => {
  await avecVite(async (vite) => {
    const html = await rendrePage(vite, '/src/pages/employes/Employes.jsx', 'EMPLOYEE')
    assert.doesNotMatch(html, /Ajouter un employé/)
    assert.match(html, /réservé aux administrateurs et gestionnaires/)
  })
})

test('le formulaire d’ajout est titré et ne contient aucun champ matricule', async () => {
  await avecVite(async (vite) => {
    const html = await rendreComposant(
      vite,
      '/src/components/employes/EmployeForm.jsx',
      {
        ouvert: true,
        employe: null,
        comptes: [],
        onFermer: () => {},
        onSoumettre: () => {},
      }
    )
    assert.match(html, /Ajouter un employé/)
    assert.match(html, /Ajouter l&#x27;employé|AJOUTER L&#x27;EMPLOYÉ|Ajouter l’employé/)
    assert.doesNotMatch(html, /Matricule/i)
  })
})

test('le tableau affiche la réactivation pour un employé inactif, sans matricule', async () => {
  await avecVite(async (vite) => {
    const html = await rendreComposant(
      vite,
      '/src/components/employes/EmployeTable.jsx',
      {
        employes: [employeInactif],
        chargement: false,
        filtresActifs: false,
        peutEcrire: true,
        peutVoirSalaire: true,
        inactifs: true,
        onVoir: () => {},
        onModifier: () => {},
        onDesactiver: () => {},
        onReactiver: () => {},
        onHistorique: () => {},
      }
    )
    assert.match(html, /Employés inactifs/)
    assert.match(html, /Réactiver Ben Ali Mohamed/)
    assert.doesNotMatch(html, /Désactiver Ben Ali Mohamed/)
    assert.doesNotMatch(html, /Matricule/i)
  })
})

test('la fiche employé n’affiche plus le matricule', async () => {
  await avecVite(async (vite) => {
    const html = await rendreComposant(
      vite,
      '/src/components/employes/EmployeDetails.jsx',
      {
        ouvert: true,
        employe: employeActif,
        peutVoirSalaire: true,
        onFermer: () => {},
        onHistorique: () => {},
      }
    )
    assert.match(html, /Fiche employé/)
    assert.doesNotMatch(html, /Matricule/i)
  })
})

test('le service expose la réactivation et l’historique global', async () => {
  await avecVite(async (vite) => {
    const service = await vite.ssrLoadModule('/src/services/employeService.js')
    assert.equal(typeof service.reactiverEmploye, 'function')
    assert.equal(typeof service.getHistoriqueEmployes, 'function')
  })
})

test('les utilitaires de nom ignorent le matricule', async () => {
  await avecVite(async (vite) => {
    const utils = await vite.ssrLoadModule('/src/utils/employes.js')
    assert.equal(utils.nomComplet({ matricule: 'EMP-1' }), '—')
    assert.equal(utils.libelleEmploye({ matricule: 'EMP-1' }), '—')
    assert.equal(utils.nomComplet(employeActif), 'Ben Ali Mohamed')
  })
})

test('le rapport employés n’expose plus la colonne Matricule', async () => {
  const chemin = new URL(
    '../src/pages/rapports/StatistiquesEmployesTaches.jsx',
    import.meta.url
  )
  const source = await readFile(chemin, 'utf8')
  assert.doesNotMatch(source, /matricule/i)
})

test('l’historique affiche le tableau et les trois filtres demandés', async () => {
  const chemin = new URL(
    '../src/pages/employes/Employes.jsx',
    import.meta.url
  )
  const source = await readFile(chemin, 'utf8')
  for (const attendu of [
    'Employé',
    'Action',
    'Description',
    'Date et heure',
    'Auteur',
    "Type d'action",
    "Réactiver l'employé",
    "Désactiver l'employé",
  ]) {
    assert.ok(source.includes(attendu), `Élément absent : ${attendu}`)
  }
})
