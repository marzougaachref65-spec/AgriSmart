import mongoose from 'mongoose'
import Animal from '../models/Animal.js'
import DossierMedical from '../models/DossierMedical.js'
import EvenementVeterinaire from '../models/EvenementVeterinaire.js'
import RappelSoin from '../models/RappelSoin.js'
import { ApiError } from '../utils/apiError.js'
import {
  formaterAnimalRef,
  formaterUtilisateurRef,
} from '../utils/refsVeterinaire.js'

function echapperRegex(valeur) {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function verifierIdentifiant(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Identifiant dossier invalide')
  }
}

export async function verifierAnimalExiste(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Identifiant d'animal invalide")
  }
  if (!(await Animal.exists({ _id: id }))) {
    throw new ApiError(404, 'Animal introuvable')
  }
}

function formaterDossier(dossier) {
  const objet = dossier.toJSON()
  return {
    ...objet,
    animal: formaterAnimalRef(objet.animal),
    createdBy: formaterUtilisateurRef(objet.createdBy),
  }
}

const populateDossier = [
  { path: 'animal', select: 'name espece statut' },
  { path: 'createdBy', select: 'name role' },
]

export async function listerDossiers({ recherche = '' } = {}) {
  const filtrePopule = {}
  const terme = typeof recherche === 'string' ? recherche.trim() : ''
  if (terme) {
    filtrePopule.match = { name: { $regex: echapperRegex(terme), $options: 'i' } }
  }

  const dossiers = await DossierMedical.find({})
    .populate({ path: 'animal', select: 'name espece statut', ...filtrePopule })
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 })

  return dossiers
    .filter((dossier) => (terme ? Boolean(dossier.animal) : true))
    .map(formaterDossier)
}

export async function getDossierById(id) {
  verifierIdentifiant(id)

  const dossier = await DossierMedical.findById(id)
    .populate(populateDossier)
  if (!dossier) {
    throw new ApiError(404, 'Dossier médical introuvable')
  }

  return formaterDossier(dossier)
}

export async function getDossierParAnimal(animalId) {
  if (!mongoose.isValidObjectId(animalId)) {
    throw new ApiError(400, "Identifiant d'animal invalide")
  }

  const dossier = await DossierMedical.findOne({ animal: animalId })
    .populate(populateDossier)
  if (!dossier) {
    throw new ApiError(404, "Aucun dossier médical n'existe pour cet animal")
  }

  return formaterDossier(dossier)
}

export async function creerDossier(donnees, utilisateur) {
  await verifierAnimalExiste(donnees.animal)

  try {
    const dossier = await DossierMedical.create({
      animal: donnees.animal,
      notesGenerales: donnees.notesGenerales ?? '',
      allergies: donnees.allergies ?? '',
      antecedents: donnees.antecedents ?? '',
      veterinaireReferent: donnees.veterinaireReferent ?? '',
      createdBy: utilisateur._id,
    })
    return await getDossierById(dossier._id.toString())
  } catch (erreur) {
    // Le handler global traduirait 11000 en « e-mail déjà utilisé ».
    if (erreur.code === 11000) {
      throw new ApiError(
        409,
        'Un dossier médical existe déjà pour cet animal'
      )
    }
    throw erreur
  }
}

export async function modifierDossier(id, donnees) {
  verifierIdentifiant(id)

  const dossier = await DossierMedical.findByIdAndUpdate(
    id,
    {
      $set: {
        notesGenerales: donnees.notesGenerales ?? '',
        allergies: donnees.allergies ?? '',
        antecedents: donnees.antecedents ?? '',
        veterinaireReferent: donnees.veterinaireReferent ?? '',
      },
    },
    { new: true, runValidators: true }
  )

  if (!dossier) {
    throw new ApiError(404, 'Dossier médical introuvable')
  }

  return formaterDossier(
    await DossierMedical.findById(id)
      .populate(populateDossier)
  )
}

export async function supprimerDossier(id) {
  verifierIdentifiant(id)

  const [evenements, rappels] = await Promise.all([
    EvenementVeterinaire.countDocuments({ dossier: id }),
    RappelSoin.countDocuments({ dossier: id }),
  ])

  if (evenements > 0 || rappels > 0) {
    throw new ApiError(
      409,
      `Impossible de supprimer ce dossier : ${evenements} événement(s) et ${rappels} rappel(s) y sont associés. L'historique sanitaire est conservé.`
    )
  }

  const dossier = await DossierMedical.findByIdAndDelete(id)
  if (!dossier) {
    throw new ApiError(404, 'Dossier médical introuvable')
  }

  return formaterDossier(dossier)
}
