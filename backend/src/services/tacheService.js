import mongoose from 'mongoose'
import Animal from '../models/Animal.js'
import CycleCulture from '../models/CycleCulture.js'
import Employe from '../models/Employe.js'
import Parcelle from '../models/Parcelle.js'
import Tache, { STATUTS_TACHE } from '../models/Tache.js'
import { ApiError } from '../utils/apiError.js'
import { formaterHistorique, formaterTache } from '../utils/refsRh.js'
import { entreeJournal } from '../models/journal.js'
import {
  notifierAffectationTache,
  notifierCreationTache,
} from './alertesService.js'

const MODELES_CIBLE = {
  Animaux: { modele: Animal, label: 'Animal' },
  Cultures: { modele: CycleCulture, label: 'Cycle de culture' },
  Parcelles: { modele: Parcelle, label: 'Parcelle' },
}

const STATUTS_TERMINAUX = ['Terminée', 'Annulée']

function echapperRegex(valeur) {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function verifierIdentifiant(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Identifiant tâche invalide')
  }
}

function commeDate(valeur) {
  if (!valeur) return null
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

function pagination({ page = 1, limit = 20 } = {}) {
  const numero = Number(page) > 0 ? Number(page) : 1
  const taille = Number(limit) > 0 ? Number(limit) : 20
  return { page: numero, limit: taille, skip: (numero - 1) * taille }
}

function idsEmployes(valeurs) {
  return [
    ...new Set(
      (valeurs ?? [])
        .map((valeur) => (valeur && valeur._id ? valeur._id : valeur))
        .filter(Boolean)
        .map(String)
    ),
  ]
}

/* Les notifications sont un effet de bord post-écriture : MongoDB standalone
   ne permet pas de transaction multi-documents. Toute panne est journalisée
   explicitement, sans faire échouer une tâche déjà enregistrée. */
async function notifierSansBloquer(promesse) {
  try {
    return await promesse
  } catch (erreur) {
    console.error('[NOTIFICATIONS] Émission impossible :', erreur)
    return null
  }
}

/* --------------------------- droits lecture --------------------------- */

async function employeIdPourUtilisateur(utilisateur) {
  if (utilisateur?.role !== 'EMPLOYEE') return null
  const employe = await Employe.findOne({ utilisateur: utilisateur._id }).select('_id')
  return employe ? employe._id.toString() : ''
}

async function restreindreAuxTachesVisibles(filtre, utilisateur) {
  const employeId = await employeIdPourUtilisateur(utilisateur)
  if (employeId === '') return ''
  if (employeId) filtre.employes = employeId
  return employeId
}

function verifierAcces(tache, employeId) {
  if (!employeId) return
  const affecte = (tache.employes ?? []).some((id) => id.toString() === employeId)
  if (!affecte) throw new ApiError(404, 'Tâche introuvable')
}

/* ------------------------- intégrité référentielle ---------------------- */

async function verifierEmployes(valeur) {
  if (valeur === undefined) return undefined
  const liste = Array.isArray(valeur) ? valeur : []
  const uniques = [...new Set(liste.map(String))]
  for (const id of uniques) {
    if (!mongoose.isValidObjectId(id)) {
      throw new ApiError(400, 'Identifiant employé invalide')
    }
  }
  if (uniques.length === 0) return []
  const employes = await Employe.find({ _id: { $in: uniques } }).select('_id statut nom')
  if (employes.length !== uniques.length) {
    throw new ApiError(400, 'Un ou plusieurs employés sont introuvables')
  }
  const inactifs = employes.filter((employe) => employe.statut !== 'Actif')
  if (inactifs.length > 0) {
    throw new ApiError(400, 'Un employé inactif ne peut pas être affecté à une tâche')
  }
  return employes.map((employe) => employe._id)
}

async function verifierCible(cible) {
  if (!cible || !cible.module || cible.module === 'Autre') {
    return { module: 'Autre', referenceId: null }
  }
  const definition = MODELES_CIBLE[cible.module]
  if (!definition) throw new ApiError(400, 'Module cible invalide')
  if (!cible.referenceId || !mongoose.isValidObjectId(String(cible.referenceId))) {
    throw new ApiError(400, 'La référence de la cible est requise et invalide')
  }
  const existe = await definition.modele.exists({ _id: cible.referenceId })
  if (!existe) {
    throw new ApiError(400, `Élément ${definition.label.toLowerCase()} introuvable`)
  }
  return { module: cible.module, referenceId: cible.referenceId }
}

async function enrichirCible(tache) {
  const formattee = formaterTache(tache)
  const cible = tache.cible ?? {}
  if (!cible.module || cible.module === 'Autre' || !cible.referenceId) {
    return { ...formattee, cible: { ...formattee.cible, libelle: '' } }
  }
  const definition = MODELES_CIBLE[cible.module]
  if (!definition) return formattee
  const element = await definition.modele
    .findById(cible.referenceId)
    .select('name typeCulture variete')
    .lean()
  let libelle = ''
  if (element) {
    if (cible.module === 'Cultures') {
      libelle = `${element.typeCulture ?? 'Culture'}${
        element.variete ? ` — ${element.variete}` : ''
      }`
    } else {
      libelle = element.name ?? ''
    }
  }
  return {
    ...formattee,
    cible: { ...formattee.cible, libelle, libelleModule: definition.label },
  }
}

const populateTache = (requete) =>
  requete
    .populate('employes', 'nom prenoms fonction statut')
    .populate('createdBy', 'name role')
    .populate('journal.utilisateur', 'name role')

/* --------------------------- vérifications dates ---------------------- */

function verifierCoherence(donnees, existante = null) {
  const debutBrut =
    donnees.dateDebut !== undefined
      ? donnees.dateDebut
      : (existante?.dateDebut ?? null)
  const echeanceBrut =
    donnees.dateEcheance !== undefined
      ? donnees.dateEcheance
      : (existante?.dateEcheance ?? null)
  const debut = commeDate(debutBrut)
  const echeance = commeDate(echeanceBrut)
  if (!debut) throw new ApiError(400, 'Date de début invalide')
  if (!echeance) throw new ApiError(400, "Date d'échéance invalide")
  if (echeance.getTime() < debut.getTime()) {
    throw new ApiError(400, "La date d'échéance ne peut pas précéder la date de début")
  }
  return { debut, echeance }
}

function reglesStatut(set, statut, motifAnnulation, existante) {
  if (!STATUTS_TACHE.includes(statut)) {
    throw new ApiError(400, 'Statut de tâche invalide')
  }
  if (statut === 'Annulée' && !String(motifAnnulation ?? '').trim()) {
    throw new ApiError(400, 'Le motif est requis pour annuler une tâche')
  }
  if (statut === 'Terminée' && existante?.statut !== 'Terminée') {
    set.dateRealisation = new Date()
  } else if (statut === 'Annulée') {
    set.dateRealisation = null
  } else if (existante && STATUTS_TERMINAUX.includes(existante.statut)) {
    set.dateRealisation = null
  }
  if (statut !== 'Annulée') set.motifAnnulation = ''
  else set.motifAnnulation = String(motifAnnulation).trim()
}

/* ------------------------------- lecture ------------------------------ */

export async function listerTaches(filtres = {}, utilisateur) {
  const filtre = {}
  const employeId = await restreindreAuxTachesVisibles(filtre, utilisateur)
  if (employeId === '') {
    const { page, limit } = pagination(filtres)
    return {
      items: [],
      pagination: { page, limit, total: 0, pages: 0 },
    }
  }

  const terme = typeof filtres.recherche === 'string' ? filtres.recherche.trim() : ''
  if (terme) {
    const motif = echapperRegex(terme)
    filtre.$or = [
      { titre: { $regex: motif, $options: 'i' } },
      { reference: { $regex: motif, $options: 'i' } },
      { description: { $regex: motif, $options: 'i' } },
      { motifAnnulation: { $regex: motif, $options: 'i' } },
    ]
  }
  if (filtres.statut) filtre.statut = filtres.statut
  if (filtres.priorite) filtre.priorite = filtres.priorite
  if (filtres.employe && mongoose.isValidObjectId(String(filtres.employe))) {
    filtre.employes = String(filtres.employe)
  }
  if (filtres.module) filtre['cible.module'] = filtres.module

  const periode = {}
  const debut = commeDate(filtres.debut)
  const fin = commeDate(filtres.fin)
  if (debut) periode.$gte = debut
  if (fin) periode.$lte = fin
  if (Object.keys(periode).length > 0) filtre.dateEcheance = periode

  if (filtres.enRetard === 'true' || filtres.enRetard === true) {
    filtre.dateEcheance = { ...(filtre.dateEcheance ?? {}), $lt: new Date() }
    filtre.$and = [{ statut: { $nin: STATUTS_TERMINAUX } }]
  }

  const { page, limit, skip } = pagination(filtres)
  const [taches, total] = await Promise.all([
    populateTache(Tache.find(filtre).sort({ dateEcheance: 1, createdAt: -1 }).skip(skip).limit(limit)),
    Tache.countDocuments(filtre),
  ])

  return {
    items: await Promise.all(taches.map(enrichirCible)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

export async function getStatistiquesTaches(utilisateur) {
  const filtre = {}
  const employeId = await restreindreAuxTachesVisibles(filtre, utilisateur)
  const base = employeId === '' ? { employes: new mongoose.Types.ObjectId() } : filtre

  const [total, enCours, aFaire, terminees, annulees, enRetard] = await Promise.all([
    Tache.countDocuments(base),
    Tache.countDocuments({ ...base, statut: 'En cours' }),
    Tache.countDocuments({ ...base, statut: 'À faire' }),
    Tache.countDocuments({ ...base, statut: 'Terminée' }),
    Tache.countDocuments({ ...base, statut: 'Annulée' }),
    Tache.countDocuments({
      ...base,
      dateEcheance: { $lt: new Date() },
      statut: { $nin: STATUTS_TERMINAUX },
    }),
  ])

  return {
    total,
    enCours,
    aFaire,
    terminees,
    annulees,
    enRetard,
    parStatut: {
      'À faire': aFaire,
      'En cours': enCours,
      Terminée: terminees,
      Annulée: annulees,
    },
  }
}

export async function listerTachesEnRetard(utilisateur) {
  return listerTaches({ enRetard: 'true', limit: 100 }, utilisateur)
}

export async function getTacheById(id, utilisateur) {
  verifierIdentifiant(id)
  const employeId = await employeIdPourUtilisateur(utilisateur)
  const tache = await populateTache(Tache.findById(id))
  if (!tache) throw new ApiError(404, 'Tâche introuvable')
  verifierAcces(tache, employeId === '' ? 'aucune' : employeId)
  return enrichirCible(tache)
}

export async function getHistoriqueTache(id, utilisateur) {
  verifierIdentifiant(id)
  const employeId = await employeIdPourUtilisateur(utilisateur)
  const tache = await Tache.findById(id).select('reference titre employes journal')
  if (!tache) throw new ApiError(404, 'Tâche introuvable')
  verifierAcces(tache, employeId === '' ? 'aucune' : employeId)
  return {
    tacheId: tache._id.toString(),
    reference: tache.reference,
    titre: tache.titre,
    journal: formaterHistorique(tache.journal),
  }
}

/* ------------------------------- écriture ----------------------------- */

export async function creerTache(donnees, utilisateur) {
  verifierCoherence(donnees)
  const employes = await verifierEmployes(donnees.employes ?? [])
  const cible = await verifierCible(donnees.cible)
  const statut = donnees.statut ?? 'À faire'

  const entrees = [entreeJournal('CREATION', utilisateur, 'Création de la tâche')]
  if (employes && employes.length > 0) {
    entrees.push(
      entreeJournal(
        'AFFECTATION_EMPLOYES',
        utilisateur,
        `${employes.length} employé(s) affecté(s)`
      )
    )
  }
  if (statut === 'Annulée') {
    entrees.push(entreeJournal('ANNULATION', utilisateur, 'Tâche annulée à la création'))
  }

  const set = {
    titre: donnees.titre,
    description: donnees.description ?? '',
    priorite: donnees.priorite ?? 'Moyenne',
    statut,
    dateDebut: donnees.dateDebut,
    dateEcheance: donnees.dateEcheance,
    employes: employes ?? [],
    cible,
    journal: entrees,
    createdBy: utilisateur._id,
  }
  reglesStatut(set, statut, donnees.motifAnnulation, null)

  let tache
  try {
    tache = await Tache.create(set)
  } catch (erreur) {
    if (erreur.code !== 11000) throw erreur
    throw new ApiError(409, 'Cette référence de tâche existe déjà')
  }
  const tacheComplete = await populateTache(Tache.findById(tache._id))
  await notifierSansBloquer(notifierCreationTache(tacheComplete))
  return enrichirCible(tacheComplete)
}

export async function modifierTache(id, donnees, utilisateur) {
  verifierIdentifiant(id)
  const existante = await Tache.findById(id)
  if (!existante) throw new ApiError(404, 'Tâche introuvable')

  verifierCoherence(donnees, existante)
  const set = {}
  for (const champ of ['titre', 'description', 'priorite', 'dateDebut', 'dateEcheance']) {
    if (donnees[champ] !== undefined) set[champ] = donnees[champ]
  }

  const entrees = []
  const employes = await verifierEmployes(donnees.employes)
  if (employes !== undefined) {
    set.employes = employes
    entrees.push(
      entreeJournal(
        'AFFECTATION_EMPLOYES',
        utilisateur,
        `${employes.length} employé(s) affecté(s)`
      )
    )
  }
  const employesAvant = idsEmployes(existante.employes)
  const employesApres = employes === undefined ? employesAvant : idsEmployes(employes)
  const ajoutes = employesApres.filter((id) => !employesAvant.includes(id))
  const retires = employesAvant.filter((id) => !employesApres.includes(id))

  if (donnees.cible !== undefined) {
    set.cible = await verifierCible(donnees.cible)
    entrees.push(entreeJournal('MODIFICATION', utilisateur, 'Cible mise à jour'))
  }

  const statut = donnees.statut ?? existante.statut
  const motif = donnees.motifAnnulation ?? existante.motifAnnulation
  if (donnees.statut !== undefined && statut !== existante.statut) {
    set.statut = statut
    entrees.push(
      entreeJournal(
        statut === 'Annulée' ? 'ANNULATION' : 'CHANGEMENT_STATUT',
        utilisateur,
        `Statut : ${existante.statut} → ${statut}`
      )
    )
  }
  reglesStatut(set, statut, motif, existante)

  if (entrees.length === 0) {
    entrees.push(entreeJournal('MODIFICATION', utilisateur, 'Tâche modifiée'))
  }

  const tache = await Tache.findByIdAndUpdate(
    id,
    { $set: set, $push: { journal: { $each: entrees } } },
    { new: true, runValidators: true }
  )
  if (!tache) throw new ApiError(404, 'Tâche introuvable')
  const tacheComplete = await populateTache(Tache.findById(tache._id))
  await notifierSansBloquer(
    notifierAffectationTache(tacheComplete, ajoutes, retires)
  )
  return enrichirCible(tacheComplete)
}

export async function changerStatutTache(id, donnees, utilisateur) {
  return modifierTache(id, {
    statut: donnees.statut,
    motifAnnulation: donnees.motifAnnulation,
  }, utilisateur)
}

export async function annulerTache(id, donnees, utilisateur) {
  return modifierTache(
    id,
    { statut: 'Annulée', motifAnnulation: donnees.motifAnnulation },
    utilisateur
  )
}

export async function supprimerTache(id) {
  verifierIdentifiant(id)
  const tache = await Tache.findByIdAndDelete(id)
  if (!tache) throw new ApiError(404, 'Tâche introuvable')
  return formaterTache(tache)
}
