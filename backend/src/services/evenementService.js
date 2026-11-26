import mongoose from 'mongoose'
import { randomUUID } from 'node:crypto'
import DossierMedical from '../models/DossierMedical.js'
import EvenementVeterinaire from '../models/EvenementVeterinaire.js'
import { ApiError } from '../utils/apiError.js'
import {
  formaterAnimalRef,
  formaterDossierRef,
  formaterUtilisateurRef,
} from '../utils/refsVeterinaire.js'
import { verifierAnimalExiste } from './dossierService.js'
import { creerRappelAutomatique } from './rappelService.js'

function echapperRegex(valeur) {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function verifierIdentifiant(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Identifiant événement invalide')
  }
}

function commeDate(valeur) {
  if (!valeur) return null
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

function formaterEvenement(evenement) {
  const objet = evenement.toJSON()
  return {
    ...objet,
    animal: formaterAnimalRef(objet.animal),
    dossier: formaterDossierRef(objet.dossier),
    createdBy: formaterUtilisateurRef(objet.createdBy),
  }
}

function pagination({ page = 1, limit = 20 } = {}) {
  /* Express 5 recalcule req.query à chaque accès : les sanitizers
     express-validator n'y survivent pas toujours. On convertit ici. */
  const numero = Number(page) > 0 ? Number(page) : 1
  const taille = Number(limit) > 0 ? Number(limit) : 20
  return { page: numero, limit: taille, skip: (numero - 1) * taille }
}

const populateEvenement = (requete) =>
  requete
    .populate('animal', 'name espece statut')
    .populate({
      path: 'dossier',
      populate: { path: 'animal', select: 'name espece statut' },
    })
    .populate('createdBy', 'name role')

export async function listerEvenements({
  recherche = '',
  animal = '',
  type = '',
  debut,
  fin,
  page,
  limit,
} = {}) {
  const filtre = {}
  if (animal) filtre.animal = animal
  if (type) filtre.type = type

  const dateDebut = commeDate(debut)
  const dateFin = commeDate(fin)
  if (dateDebut || dateFin) {
    filtre.date = {}
    if (dateDebut) filtre.date.$gte = dateDebut
    if (dateFin) filtre.date.$lte = dateFin
  }

  const terme = typeof recherche === 'string' ? recherche.trim() : ''
  if (terme) {
    const motif = echapperRegex(terme)
    filtre.$or = [
      { libelle: { $regex: motif, $options: 'i' } },
      { reference: { $regex: motif, $options: 'i' } },
      { vaccin: { $regex: motif, $options: 'i' } },
      { nomMaladie: { $regex: motif, $options: 'i' } },
      { medicament: { $regex: motif, $options: 'i' } },
      { diagnostic: { $regex: motif, $options: 'i' } },
      { notes: { $regex: motif, $options: 'i' } },
    ]
  }

  const { page: numero, limit: taille, skip } = pagination({ page, limit })
  const [evenements, total] = await Promise.all([
    populateEvenement(
      EvenementVeterinaire.find(filtre)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(taille)
    ),
    EvenementVeterinaire.countDocuments(filtre),
  ])

  return {
    items: evenements.map(formaterEvenement),
    pagination: {
      page: numero,
      limit: taille,
      total,
      pages: Math.ceil(total / taille),
    },
  }
}

export async function getEvenementById(id) {
  verifierIdentifiant(id)

  const evenement = await populateEvenement(EvenementVeterinaire.findById(id))
  if (!evenement) {
    throw new ApiError(404, 'Événement vétérinaire introuvable')
  }

  return formaterEvenement(evenement)
}

/** Création avec rattachement obligatoire à un animal réel et à son dossier. */
export async function creerEvenement(donnees, utilisateur) {
  await verifierAnimalExiste(donnees.animal)

  const dossier = await DossierMedical.findOne({ animal: donnees.animal }).select('_id')
  if (!dossier) {
    throw new ApiError(
      404,
      "Aucun dossier médical n'existe pour cet animal. Créez d'abord le dossier."
    )
  }

  const reference = donnees.reference?.trim() || randomUUID()

  let evenement
  try {
    evenement = await EvenementVeterinaire.create({
      reference,
      animal: donnees.animal,
      dossier: dossier._id,
      type: donnees.type,
      date: donnees.date ?? new Date(),
      libelle: donnees.libelle ?? '',
      notes: donnees.notes ?? '',
      createdBy: utilisateur._id,
      vaccin: donnees.vaccin ?? '',
      lot: donnees.lot ?? '',
      dateRappel: donnees.dateRappel ?? null,
      nomMaladie: donnees.nomMaladie ?? '',
      diagnostic: donnees.diagnostic ?? '',
      gravite: donnees.gravite ?? null,
      dateDebut: donnees.dateDebut ?? null,
      dateFin: donnees.dateFin ?? null,
      statutMaladie: donnees.statutMaladie ?? null,
      medicament: donnees.medicament ?? '',
      posologie: donnees.posologie ?? '',
      dose: donnees.dose ?? null,
      motif: donnees.motif ?? '',
      prescripteur: donnees.prescripteur ?? '',
      statutTraitement: donnees.statutTraitement ?? null,
      nature: donnees.nature ?? null,
      veterinaire: donnees.veterinaire ?? '',
      cout: donnees.cout ?? null,
    })
  } catch (erreur) {
    // 11000 est géré ici : le handler global l'associerait au e-mail utilisateur.
    if (erreur.code !== 11000) throw erreur

    const existant = await EvenementVeterinaire.findOne({ reference })
    if (!existant) throw erreur

    return {
      evenement: await getEvenementById(existant._id.toString()),
      dejaExistant: true,
    }
  }

  /* Le rappel est un complément : son échec ne remet pas en cause l'événement.
     Le calcul d'alertes retombe alors sur EvenementVeterinaire.dateRappel. */
  if (evenement.type === 'Vaccination' && evenement.dateRappel) {
    try {
      await creerRappelAutomatique(evenement, utilisateur)
    } catch (erreur) {
      console.error('[VETERINAIRE] Rappel automatique non créé :', erreur.message)
    }
  }

  return {
    evenement: await getEvenementById(evenement._id.toString()),
    dejaExistant: false,
  }
}

/** Événements d'un animal, utilisés par l'historique sanitaire. */
export async function listerEvenementsParAnimal(animalId) {
  const evenements = await populateEvenement(
    EvenementVeterinaire.find({ animal: animalId }).sort({ date: -1, createdAt: -1 })
  )
  return evenements.map(formaterEvenement)
}
