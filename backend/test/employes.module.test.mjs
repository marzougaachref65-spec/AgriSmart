import './helpers/garde.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { validationResult } from 'express-validator'
import Employe from '../src/models/Employe.js'
import employeRoutes from '../src/routes/employeRoutes.js'
import {
  formaterEmploye,
  formaterEmployeRef,
} from '../src/utils/refsRh.js'
import {
  createEmployeRules,
  updateEmployeRules,
} from '../src/validators/employeValidator.js'
import {
  modifierEmploye,
  reactiverEmploye,
  desactiverEmploye,
  getHistoriqueEmployes,
} from '../src/services/employeService.js'

const idEmploye = '6b01ba7bd8186b95f820580f'
const utilisateur = { _id: '6b017abf92e878a2faa6ed5d', role: 'ADMIN' }

function requeteFictive(body = {}, query = {}, params = {}) {
  return { body, query, params, cookies: {}, headers: {} }
}

async function erreurs(regles, requete) {
  for (const regle of regles) await regle.run(requete)
  return validationResult(requete).array()
}

function employeBase(surcharge = {}) {
  return {
    _id: idEmploye,
    nom: 'Ben Ali',
    prenoms: 'Mohamed',
    fonction: 'Ouvrier agricole',
    statut: 'Actif',
    matricule: 'EMP-2026-6732DC',
    salaireMillimes: 35000,
    periodiciteSalaire: 'Mensuel',
    dateRecrutement: new Date('2026-11-21T00:00:00.000Z'),
    dateNaissance: null,
    dateFin: null,
    cin: '',
    telephone: '',
    email: '',
    adresse: '',
    specialite: '',
    notes: '',
    utilisateur: null,
    createdBy: null,
    journal: [],
    ...surcharge,
  }
}

test('le DTO employé n’expose jamais le matricule interne', () => {
  const sortie = formaterEmploye(employeBase(), utilisateur, true)
  assert.equal(Object.hasOwn(sortie, 'matricule'), false)
  assert.equal(sortie.id, idEmploye)
  assert.equal(sortie.salaireMillimes, 35000)
})

test('la référence publique d’un employé n’expose pas le matricule', () => {
  const sortie = formaterEmployeRef({
    _id: idEmploye,
    matricule: 'EMP-2026-6732DC',
    nom: 'Ben Ali',
    prenoms: 'Mohamed',
  })
  assert.equal(Object.hasOwn(sortie, 'matricule'), false)
  assert.equal(sortie.nom, 'Ben Ali')
})

test('le matricule n’est plus une validation de création ni de modification', async () => {
  const base = {
    nom: 'Test',
    fonction: 'Agronome',
    salaire: '25.750',
    dateRecrutement: '2026-11-20T00:00:00.000Z',
    periodiciteSalaire: 'Mensuel',
  }
  const erreursCreation = await erreurs(
    createEmployeRules,
    requeteFictive({ ...base, matricule: 'EMP-000000' })
  )
  const erreursModification = await erreurs(
    updateEmployeRules,
    requeteFictive({ matricule: 'EMP-000000' })
  )
  assert.equal(
    [...erreursCreation, ...erreursModification].some(
      (erreur) => erreur.path === 'matricule'
    ),
    false
  )
})

test('une modification sans changement réel n’écrit ni document ni journal', async () => {
  const existant = employeBase()
  const findById = Employe.findById
  const findByIdAndUpdate = Employe.findByIdAndUpdate
  Employe.findById = async () => existant
  Employe.findByIdAndUpdate = async () => {
    throw new Error('Écriture inattendue')
  }
  try {
    const sortie = await modifierEmploye(
      idEmploye,
      {
        nom: 'Ben Ali',
        prenoms: 'Mohamed',
        fonction: 'Ouvrier agricole',
        salaire: '35.000',
        periodiciteSalaire: 'Mensuel',
      },
      utilisateur
    )
    assert.equal(sortie.statut, 'Actif')
    assert.equal(sortie.journal.length, 0)
  } finally {
    Employe.findById = findById
    Employe.findByIdAndUpdate = findByIdAndUpdate
  }
})

test('la réactivation est idempotente quand l’employé est déjà actif', async () => {
  const findById = Employe.findById
  const findByIdAndUpdate = Employe.findByIdAndUpdate
  Employe.findById = async () => employeBase()
  Employe.findByIdAndUpdate = async () => {
    throw new Error('Écriture inattendue')
  }
  try {
    const sortie = await reactiverEmploye(idEmploye, utilisateur)
    assert.equal(sortie.statut, 'Actif')
  } finally {
    Employe.findById = findById
    Employe.findByIdAndUpdate = findByIdAndUpdate
  }
})

test('la désactivation est idempotente quand l’employé est déjà inactif', async () => {
  const findById = Employe.findById
  const findByIdAndUpdate = Employe.findByIdAndUpdate
  Employe.findById = async () => employeBase({ statut: 'Inactif' })
  Employe.findByIdAndUpdate = async () => {
    throw new Error('Écriture inattendue')
  }
  try {
    const sortie = await desactiverEmploye(idEmploye, utilisateur)
    assert.equal(sortie.statut, 'Inactif')
  } finally {
    Employe.findById = findById
    Employe.findByIdAndUpdate = findByIdAndUpdate
  }
})

test('la réactivation efface la date de fin et ajoute une seule entrée de journal', async () => {
  const findById = Employe.findById
  const findByIdAndUpdate = Employe.findByIdAndUpdate
  let miseAJour
  Employe.findById = async () =>
    employeBase({ statut: 'Inactif', dateFin: new Date('2026-11-20T00:00:00.000Z') })
  Employe.findByIdAndUpdate = async (id, modification) => {
    miseAJour = modification
    return employeBase()
  }
  try {
    await reactiverEmploye(idEmploye, utilisateur)
    assert.equal(miseAJour.$set.statut, 'Actif')
    assert.equal(miseAJour.$set.dateFin, null)
    const entrees = miseAJour.$push.journal.$each
    assert.equal(entrees.length, 1)
    assert.equal(entrees[0].action, 'CHANGEMENT_STATUT')
    assert.match(entrees[0].detail, /Réactivation/)
  } finally {
    Employe.findById = findById
    Employe.findByIdAndUpdate = findByIdAndUpdate
  }
})

test('l’historique global applique les filtres employé, action et période', async () => {
  const find = Employe.find
  const dateCreation = new Date('2026-11-21T10:00:00.000Z')
  const dateModification = new Date('2026-11-23T10:00:00.000Z')
  const employeAvecJournal = {
    ...employeBase(),
    journal: [
      {
        _id: 'entree-1',
        action: 'CREATION',
        date: dateCreation,
        detail: 'Création de la fiche employé',
        utilisateur: utilisateur._id,
      },
      {
        _id: 'entree-2',
        action: 'MODIFICATION',
        date: dateModification,
        detail: 'Fiche employé modifiée',
        utilisateur: utilisateur._id,
      },
    ],
  }
  const chaine = (documents) => ({
    select() {
      return this
    },
    populate() {
      return this
    },
    sort() {
      return this
    },
    then(resolve, reject) {
      return Promise.resolve(documents).then(resolve, reject)
    },
  })
  let appels = 0
  Employe.find = () => {
    appels += 1
    /* 1er appel = employés avec journal, 2e = liste des options. */
    return chaine(appels % 2 === 1 ? [employeAvecJournal] : [employeBase()])
  }
  try {
    const tout = await getHistoriqueEmployes({})
    assert.equal(tout.total, 2)
    assert.equal(tout.employes.length, 1)
    assert.equal(Object.hasOwn(tout.items[0], 'matricule'), false)

    const parAction = await getHistoriqueEmployes({ action: 'CREATION' })
    assert.equal(parAction.total, 1)
    assert.equal(parAction.items[0].action, 'CREATION')

    const parPeriode = await getHistoriqueEmployes({
      debut: '2026-11-23',
      fin: '2026-11-23',
    })
    assert.equal(parPeriode.total, 1)
    assert.equal(parPeriode.items[0].action, 'MODIFICATION')

    const sansResultat = await getHistoriqueEmployes({ action: 'AFFECTATION_COMPTE' })
    assert.equal(sansResultat.total, 0)
  } finally {
    Employe.find = find
  }
})

test('les deux nouvelles routes employés sont bien enregistrées', () => {
  const chemins = employeRoutes.stack
    .filter((couche) => couche.route)
    .map((couche) => ({
      chemin: couche.route.path,
      methodes: Object.keys(couche.route.methods),
    }))
  assert.ok(
    chemins.some(
      (route) => route.chemin === '/historique' && route.methodes.includes('get')
    )
  )
  assert.ok(
    chemins.some(
      (route) =>
        route.chemin === '/:id/reactiver' && route.methodes.includes('patch')
    )
  )
})
