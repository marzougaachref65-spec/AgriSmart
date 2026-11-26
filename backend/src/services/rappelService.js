import mongoose from 'mongoose'
import DossierMedical from '../models/DossierMedical.js'
import RappelSoin from '../models/RappelSoin.js'
import { ApiError } from '../utils/apiError.js'
import { formaterRefs } from '../utils/refsVeterinaire.js'
import { verifierAnimalExiste } from './dossierService.js'

function echapperRegex(valeur) {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function verifierIdentifiant(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Identifiant rappel invalide')
  }
}

function commeDate(valeur) {
  if (!valeur) return null
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

function formaterRappel(rappel) {
  return formaterRefs(rappel.toJSON())
}

function pagination({ page = 1, limit = 20 } = {}) {
  const numero = Number(page) > 0 ? Number(page) : 1
  const taille = Number(limit) > 0 ? Number(limit) : 20
  return { page: numero, limit: taille, skip: (numero - 1) * taille }
}

async function resoudreDossier(animalId) {
  const dossier = await DossierMedical.findOne({ animal: animalId }).select('_id')
  if (!dossier) {
    throw new ApiError(
      404,
      "Aucun dossier médical n'existe pour cet animal. Créez d'abord le dossier."
    )
  }
  return dossier._id
}

async function creerRappelInterne(donnees, utilisateur, automatique = false) {
  await verifierAnimalExiste(donnees.animal)
  const dossier = await resoudreDossier(donnees.animal)

  const rappel = await RappelSoin.create({
    animal: donnees.animal,
    dossier,
    titre: donnees.titre ?? '',
    type: donnees.type,
    datePrevue: donnees.datePrevue,
    statut: 'Planifié',
    dateRealisation: null,
    evenementOrigine: automatique ? (donnees.evenementOrigine ?? null) : null,
    notes: donnees.notes ?? '',
    createdBy: utilisateur._id,
  })

  return formaterRappel(
    await RappelSoin.findById(rappel._id)
      .populate('animal', 'name espece statut')
      .populate('createdBy', 'name role')
      .populate('evenementOrigine', 'type reference')
  )
}

export async function creerRappel(donnees, utilisateur) {
  return creerRappelInterne(donnees, utilisateur)
}

/** Rappel de vaccination généré lors de l'enregistrement d'une vaccination. */
export async function creerRappelAutomatique(evenement, utilisateur) {
  if (!evenement.dateRappel) return null

  return creerRappelInterne(
    {
      animal: evenement.animal.toString(),
      titre: `Rappel de vaccination — ${evenement.vaccin}`,
      type: 'Rappel de vaccination',
      datePrevue: evenement.dateRappel,
      evenementOrigine: evenement._id.toString(),
      notes: `Généré automatiquement depuis la vaccination ${evenement.reference}`,
    },
    utilisateur,
    true
  )
}

export async function listerRappels({
  recherche = '',
  animal = '',
  statut = '',
  type = '',
  debut,
  fin,
  page,
  limit,
} = {}) {
  const filtre = {}
  if (animal) filtre.animal = animal
  if (statut) filtre.statut = statut
  if (type) filtre.type = type

  const dateDebut = commeDate(debut)
  const dateFin = commeDate(fin)
  if (dateDebut || dateFin) {
    filtre.datePrevue = {}
    if (dateDebut) filtre.datePrevue.$gte = dateDebut
    if (dateFin) filtre.datePrevue.$lte = dateFin
  }

  const terme = typeof recherche === 'string' ? recherche.trim() : ''
  if (terme) {
    const motif = echapperRegex(terme)
    filtre.$or = [
      { titre: { $regex: motif, $options: 'i' } },
      { notes: { $regex: motif, $options: 'i' } },
    ]
  }

  const { page: numero, limit: taille, skip } = pagination({ page, limit })
  const [rappels, total] = await Promise.all([
    RappelSoin.find(filtre)
      .populate('animal', 'name espece statut')
      .populate('createdBy', 'name role')
      .populate('evenementOrigine', 'type reference')
      .sort({ datePrevue: 1, createdAt: -1 })
      .skip(skip)
      .limit(taille),
    RappelSoin.countDocuments(filtre),
  ])

  return {
    items: rappels.map(formaterRappel),
    pagination: {
      page: numero,
      limit: taille,
      total,
      pages: Math.ceil(total / taille),
    },
  }
}

export async function getRappelById(id) {
  verifierIdentifiant(id)

  const rappel = await RappelSoin.findById(id)
    .populate('animal', 'name espece statut')
    .populate('createdBy', 'name role')
    .populate('evenementOrigine', 'type reference')

  if (!rappel) {
    throw new ApiError(404, 'Rappel introuvable')
  }

  return formaterRappel(rappel)
}

export async function modifierRappel(id, donnees) {
  verifierIdentifiant(id)

  const attributes = {}
  if (donnees.datePrevue !== undefined) attributes.datePrevue = donnees.datePrevue
  if (donnees.statut !== undefined) attributes.statut = donnees.statut
  if (donnees.notes !== undefined) attributes.notes = donnees.notes ?? ''
  attributes.dateRealisation =
    donnees.statut === 'Effectué' ? new Date() : null

  const rappel = await RappelSoin.findByIdAndUpdate(
    id,
    { $set: attributes },
    { new: true, runValidators: true }
  )

  if (!rappel) {
    throw new ApiError(404, 'Rappel introuvable')
  }

  return getRappelById(id)
}

export async function supprimerRappel(id) {
  verifierIdentifiant(id)

  const rappel = await RappelSoin.findByIdAndDelete(id)
  if (!rappel) {
    throw new ApiError(404, 'Rappel introuvable')
  }

  return formaterRappel(rappel)
}

/** Utilisé par le calcul d'alertes : rappels déjà générés pour une vaccination. */
export async function listerOriginesRappelsVaccination() {
  const rappels = await RappelSoin.find({
    type: 'Rappel de vaccination',
    evenementOrigine: { $ne: null },
  })
    .select('evenementOrigine')
    .lean()

  return new Set(
    rappels
      .map((rappel) => rappel.evenementOrigine?.toString())
      .filter(Boolean)
  )
}
