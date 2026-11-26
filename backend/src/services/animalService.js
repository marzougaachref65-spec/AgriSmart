import mongoose from 'mongoose'
import Animal from '../models/Animal.js'
import { ApiError } from '../utils/apiError.js'

/** Échappe les métacaractères regex pour une recherche utilisateur sans risque. */
function echapperRegex(valeur) {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function verifierIdentifiant(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Identifiant animal invalide')
  }
}

/**
 * Liste réelle depuis MongoDB, avec recherche et filtres optionnels.
 */
export async function listerAnimaux({
  recherche = '',
  espece = '',
  statut = '',
} = {}) {
  const filtre = {}

  if (espece) filtre.espece = espece
  if (statut) filtre.statut = statut

  const terme = typeof recherche === 'string' ? recherche.trim() : ''
  if (terme) {
    const motif = echapperRegex(terme)
    filtre.$or = [
      { name: { $regex: motif, $options: 'i' } },
      { race: { $regex: motif, $options: 'i' } },
    ]
  }

  const animaux = await Animal.find(filtre).sort({ createdAt: -1 })
  return animaux.map((animal) => animal.toJSON())
}

export async function getAnimalById(id) {
  verifierIdentifiant(id)

  const animal = await Animal.findById(id)
  if (!animal) {
    throw new ApiError(404, 'Animal introuvable')
  }

  return animal.toJSON()
}

export async function createAnimal(donnees) {
  const animal = await Animal.create(donnees)
  return animal.toJSON()
}

export async function updateAnimal(id, donnees) {
  verifierIdentifiant(id)

  const animal = await Animal.findByIdAndUpdate(id, donnees, {
    new: true,
    runValidators: true,
  })

  if (!animal) {
    throw new ApiError(404, 'Animal introuvable')
  }

  return animal.toJSON()
}

export async function deleteAnimal(id) {
  verifierIdentifiant(id)

  const animal = await Animal.findByIdAndDelete(id)
  if (!animal) {
    throw new ApiError(404, 'Animal introuvable')
  }

  return animal.toJSON()
}

/** Statistiques calculées sur les vraies données MongoDB. */
export async function getStatistiquesAnimaux() {
  const [total, males, femelles, malades] = await Promise.all([
    Animal.countDocuments({}),
    Animal.countDocuments({ sexe: 'Mâle' }),
    Animal.countDocuments({ sexe: 'Femelle' }),
    Animal.countDocuments({ statut: 'Malade' }),
  ])

  return { total, males, femelles, malades }
}
