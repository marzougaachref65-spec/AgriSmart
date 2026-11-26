import mongoose from 'mongoose'
import Employe from '../models/Employe.js'
import User from '../models/User.js'
import { ApiError } from '../utils/apiError.js'
import { formaterEmploye, formaterHistorique } from '../utils/refsRh.js'
import { montantVersMillimes } from './operationFinanciereService.js'
import { entreeJournal } from '../models/journal.js'

function echapperRegex(valeur) {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function verifierIdentifiant(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Identifiant employé invalide')
  }
}

function commeDate(valeur) {
  if (!valeur) return null
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

function pagination({ page = 1, limit = 20 } = {}) {
  /* Express 5 recalcule req.query : on reconvertit les sanitizers ici. */
  const numero = Number(page) > 0 ? Number(page) : 1
  const taille = Number(limit) > 0 ? Number(limit) : 20
  return { page: numero, limit: taille, skip: (numero - 1) * taille }
}

async function verifierCompte(utilisateurId) {
  if (!utilisateurId) return null
  const identifiant = String(utilisateurId)
  if (!mongoose.isValidObjectId(identifiant)) {
    throw new ApiError(400, 'Compte utilisateur invalide')
  }
  const compte = await User.findById(identifiant)
  if (!compte || !compte.isActive) {
    throw new ApiError(400, 'Compte utilisateur introuvable ou désactivé')
  }
  return compte._id
}

function formulaireSalaire(donnees, existant = null) {
  if (donnees.salaire === undefined || donnees.salaire === null || donnees.salaire === '') {
    if (existant) return { salaireMillimes: existant.salaireMillimes }
    throw new ApiError(400, 'Le salaire est requis')
  }
  const salaireMillimes = montantVersMillimes(donnees.salaire)
  if (!Number.isFinite(salaireMillimes) || salaireMillimes < 0) {
    throw new ApiError(400, 'Le salaire doit être positif ou nul')
  }
  return { salaireMillimes }
}

function champsModifiables(donnees, existant) {
  const champs = [
    'nom',
    'prenoms',
    'dateNaissance',
    'cin',
    'telephone',
    'email',
    'adresse',
    'fonction',
    'specialite',
    'periodiciteSalaire',
    'dateRecrutement',
    'notes',
  ]
  const set = {}
  for (const champ of champs) {
    if (donnees[champ] !== undefined) set[champ] = donnees[champ]
  }
  Object.assign(set, formulaireSalaire(donnees, existant))
  return set
}

function verifierDates(set, existant) {
  const recrutement =
    set.dateRecrutement !== undefined
      ? commeDate(set.dateRecrutement)
      : (existant?.dateRecrutement ?? null)
  const fin =
    set.dateFin !== undefined ? commeDate(set.dateFin) : (existant?.dateFin ?? null)
  if (recrutement && fin && fin.getTime() < recrutement.getTime()) {
    throw new ApiError(
      400,
      'La date de fin ne peut pas précéder la date de recrutement'
    )
  }
}

/** Évite d'écrire une entrée « MODIFICATION » quand rien n'a réellement changé. */
function sansChangement(set, existant) {
  for (const [champ, valeur] of Object.entries(set)) {
    const actuel = existant[champ]
    if (valeur === null || actuel === null || valeur === undefined || actuel === undefined) {
      if ((valeur ?? null) !== (actuel ?? null)) return false
      continue
    }
    if (valeur instanceof Date || actuel instanceof Date) {
      const demande = new Date(valeur).getTime()
      const enregistre = new Date(actuel).getTime()
      if (demande !== enregistre) return false
    } else if (typeof valeur === 'object') {
      if (String(valeur) !== String(actuel)) return false
    } else if (valeur !== actuel) {
      return false
    }
  }
  return true
}

export async function listerEmployes(filtres = {}, utilisateur) {
  const filtre = {}
  const terme = typeof filtres.recherche === 'string' ? filtres.recherche.trim() : ''
  if (terme) {
    const motif = echapperRegex(terme)
    filtre.$or = [
      { nom: { $regex: motif, $options: 'i' } },
      { prenoms: { $regex: motif, $options: 'i' } },
      { fonction: { $regex: motif, $options: 'i' } },
      { cin: { $regex: motif, $options: 'i' } },
      { telephone: { $regex: motif, $options: 'i' } },
    ]
  }
  if (filtres.statut) filtre.statut = filtres.statut
  if (filtres.fonction) filtre.fonction = filtres.fonction

  const { page, limit, skip } = pagination(filtres)
  const [employes, total] = await Promise.all([
    Employe.find(filtre).sort({ statut: 1, nom: 1, createdAt: -1 }).skip(skip).limit(limit),
    Employe.countDocuments(filtre),
  ])

  return {
    items: employes.map((employe) => formaterEmploye(employe, utilisateur, true)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

/** Comptes EMPLOYEE actifs encore non associés à une fiche employé. */
export async function getComptesDisponibles() {
  const associes = await Employe.find({ utilisateur: { $ne: null } }).select(
    'utilisateur'
  )
  const ids = new Set(associes.map((employe) => employe.utilisateur?.toString()))
  const comptes = await User.find({ role: 'EMPLOYEE', isActive: true })
    .select('name email')
    .sort({ name: 1 })
  return comptes
    .filter((compte) => !ids.has(compte._id.toString()))
    .map((compte) => ({
      id: compte._id.toString(),
      name: compte.name,
      email: compte.email,
    }))
}

export async function getStatistiquesEmployes() {
  const [total, actifs, inactifs] = await Promise.all([
    Employe.countDocuments({}),
    Employe.countDocuments({ statut: 'Actif' }),
    Employe.countDocuments({ statut: 'Inactif' }),
  ])
  return { total, actifs, inactifs }
}

export async function getEmployeById(id, utilisateur) {
  verifierIdentifiant(id)
  const employe = await Employe.findById(id)
  if (!employe) throw new ApiError(404, 'Employé introuvable')
  return formaterEmploye(employe, utilisateur, true)
}

export async function getHistoriqueEmploye(id) {
  verifierIdentifiant(id)
  const employe = await Employe.findById(id).select('journal')
  if (!employe) throw new ApiError(404, 'Employé introuvable')
  return {
    employeId: employe._id.toString(),
    journal: formaterHistorique(employe.journal),
  }
}

export async function creerEmploye(donnees, utilisateur) {
  const compteId = await verifierCompte(donnees.utilisateur)
  const { salaireMillimes } = formulaireSalaire(donnees)
  const dateRecrutement = commeDate(donnees.dateRecrutement)
  if (!dateRecrutement) throw new ApiError(400, 'Date de recrutement invalide')
  const dateNaissance = commeDate(donnees.dateNaissance)
  const dateFin = commeDate(donnees.dateFin)

  const entrees = [entreeJournal('CREATION', utilisateur, 'Création de la fiche employé')]
  if (compteId) {
    entrees.push(
      entreeJournal('AFFECTATION_COMPTE', utilisateur, 'Compte utilisateur associé')
    )
  }

  let employe
  try {
    employe = await Employe.create({
      nom: donnees.nom,
      prenoms: donnees.prenoms ?? '',
      dateNaissance,
      cin: donnees.cin ?? '',
      telephone: donnees.telephone ?? '',
      email: donnees.email ?? '',
      adresse: donnees.adresse ?? '',
      fonction: donnees.fonction,
      specialite: donnees.specialite ?? '',
      salaireMillimes,
      periodiciteSalaire: donnees.periodiciteSalaire ?? 'Mensuel',
      dateRecrutement,
      dateFin,
      statut: donnees.statut ?? 'Actif',
      utilisateur: compteId,
      notes: donnees.notes ?? '',
      journal: entrees,
      createdBy: utilisateur._id,
    })
  } catch (erreur) {
    if (erreur.code !== 11000) throw erreur
    throw new ApiError(
      409,
      String(erreur.message).includes('utilisateur')
        ? 'Ce compte utilisateur est déjà associé à un employé'
        : 'Une fiche employé existe déjà avec ces informations'
    )
  }

  return formaterEmploye(employe, utilisateur, true)
}

export async function modifierEmploye(id, donnees, utilisateur) {
  verifierIdentifiant(id)
  const existant = await Employe.findById(id)
  if (!existant) throw new ApiError(404, 'Employé introuvable')

  const set = champsModifiables(donnees, existant)
  if (donnees.dateNaissance !== undefined) {
    set.dateNaissance = commeDate(donnees.dateNaissance)
  }
  if (donnees.dateRecrutement !== undefined) {
    set.dateRecrutement = commeDate(donnees.dateRecrutement)
    if (!set.dateRecrutement) throw new ApiError(400, 'Date de recrutement invalide')
  }

  const entrees = []
  const compteId = await verifierCompte(donnees.utilisateur)
  if (donnees.utilisateur !== undefined) {
    set.utilisateur = compteId
    const compteActuel = existant.utilisateur ? existant.utilisateur.toString() : null
    const compteDemande = compteId ? compteId.toString() : null
    if (compteActuel !== compteDemande) {
      entrees.push(
        entreeJournal(
          'AFFECTATION_COMPTE',
          utilisateur,
          compteId ? 'Compte utilisateur associé' : 'Compte utilisateur retiré'
        )
      )
    }
  }

  const statut = donnees.statut ?? existant.statut
  if (donnees.statut !== undefined && donnees.statut !== existant.statut) {
    set.statut = statut
    if (statut === 'Inactif') {
      set.dateFin = donnees.dateFin ? commeDate(donnees.dateFin) : new Date()
      if (!set.dateFin) throw new ApiError(400, 'Date de fin invalide')
    } else {
      set.dateFin = null
    }
    entrees.push(
      entreeJournal(
        'CHANGEMENT_STATUT',
        utilisateur,
        `Statut : ${existant.statut} → ${statut}`
      )
    )
  } else if (donnees.dateFin !== undefined) {
    set.dateFin = commeDate(donnees.dateFin)
  }

  verifierDates(set, existant)
  if (entrees.length === 0 && sansChangement(set, existant)) {
    /* Aucune donnée utile modifiée : on n'écrit ni document ni entrée de journal. */
    return formaterEmploye(existant, utilisateur, true)
  }
  if (entrees.length === 0) {
    entrees.push(entreeJournal('MODIFICATION', utilisateur, 'Fiche employé modifiée'))
  }

  let employe
  try {
    employe = await Employe.findByIdAndUpdate(
      id,
      { $set: set, $push: { journal: { $each: entrees } } },
      { new: true, runValidators: true }
    )
  } catch (erreur) {
    if (erreur.code !== 11000) throw erreur
    throw new ApiError(409, 'Ce compte utilisateur est déjà associé à un employé')
  }
  if (!employe) throw new ApiError(404, 'Employé introuvable')
  return formaterEmploye(employe, utilisateur, true)
}

/** Désactivation logique : aucune donnée n'est supprimée. */
export async function desactiverEmploye(id, utilisateur, donnees = {}) {
  verifierIdentifiant(id)
  const existant = await Employe.findById(id)
  if (!existant) throw new ApiError(404, 'Employé introuvable')
  if (existant.statut === 'Inactif') {
    return formaterEmploye(existant, utilisateur, true)
  }

  const dateFin = donnees.dateFin ? commeDate(donnees.dateFin) : new Date()
  if (!dateFin) throw new ApiError(400, 'Date de fin invalide')
  verifierDates({ dateFin }, existant)

  const employe = await Employe.findByIdAndUpdate(
    id,
    {
      $set: { statut: 'Inactif', dateFin },
      $push: {
        journal: {
          $each: [
            entreeJournal(
              'CHANGEMENT_STATUT',
              utilisateur,
              `Désactivation logique — ${dateFin.toISOString().slice(0, 10)}`
            ),
          ],
        },
      },
    },
    { new: true, runValidators: true }
  )

  return formaterEmploye(employe, utilisateur, true)
}

/** Réactivation logique, idempotente : aucune donnée n'est supprimée. */
export async function reactiverEmploye(id, utilisateur) {
  verifierIdentifiant(id)
  const existant = await Employe.findById(id)
  if (!existant) throw new ApiError(404, 'Employé introuvable')
  if (existant.statut === 'Actif') return formaterEmploye(existant, utilisateur, true)

  const employe = await Employe.findByIdAndUpdate(
    id,
    {
      $set: { statut: 'Actif', dateFin: null },
      $push: {
        journal: {
          $each: [
            entreeJournal(
              'CHANGEMENT_STATUT',
              utilisateur,
              `Réactivation de l'employé — ${new Date().toISOString().slice(0, 10)}`
            ),
          ],
        },
      },
    },
    { new: true, runValidators: true }
  )

  return formaterEmploye(employe, utilisateur, true)
}

/** Historique global filtrable par employé, type d'action et période. */
export async function getHistoriqueEmployes(filtres = {}) {
  if (filtres.employe && !mongoose.isValidObjectId(filtres.employe)) {
    throw new ApiError(400, 'Identifiant employé invalide')
  }
  const debut = commeDate(filtres.debut)
  const fin = commeDate(filtres.fin)
  if (filtres.debut && !debut) throw new ApiError(400, 'Date de début invalide')
  if (filtres.fin && !fin) throw new ApiError(400, 'Date de fin invalide')

  /* Une date seule (AAAA-MM-JJ) couvre la journée UTC complète ; un ISO
     complet est utilisé tel quel (le frontend envoie les bornes locales). */
  const borne = (valeur, finDeJournee) => {
    if (!valeur) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(valeur))) {
      return Date.parse(
        `${valeur}T${finDeJournee ? '23:59:59.999' : '00:00:00.000'}Z`
      )
    }
    return new Date(valeur).getTime()
  }
  const debutMs = borne(filtres.debut, false)
  const finMs = borne(filtres.fin, true)

  const filtreEmploye = filtres.employe ? { _id: filtres.employe } : {}
  const employes = await Employe.find(filtreEmploye)
    .select('nom prenoms statut journal')
    .populate('journal.utilisateur', 'name role')
    .sort({ nom: 1, prenoms: 1 })

  const items = []
  for (const employe of employes) {
    for (const entree of formaterHistorique(employe.journal)) {
      const dateMs = new Date(entree.date).getTime()
      if (filtres.action && entree.action !== filtres.action) continue
      if (debutMs !== null && dateMs < debutMs) continue
      if (finMs !== null && dateMs > finMs) continue
      items.push({
        id: entree.id,
        employeId: employe._id.toString(),
        employe: {
          id: employe._id.toString(),
          nom: employe.nom ?? '',
          prenoms: employe.prenoms ?? '',
          statut: employe.statut ?? null,
        },
        action: entree.action,
        detail: entree.detail ?? '',
        date: entree.date,
        utilisateur: entree.utilisateur,
      })
    }
  }
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const options = await Employe.find({})
    .select('nom prenoms statut')
    .sort({ nom: 1, prenoms: 1 })

  return {
    items,
    total: items.length,
    employes: options.map((employe) => ({
      id: employe._id.toString(),
      nom: employe.nom ?? '',
      prenoms: employe.prenoms ?? '',
      statut: employe.statut ?? null,
    })),
  }
}
