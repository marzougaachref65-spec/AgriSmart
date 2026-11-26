import mongoose from 'mongoose'
import Parcelle from '../models/Parcelle.js'
import CycleCulture from '../models/CycleCulture.js'
import { ApiError } from '../utils/apiError.js'

/** Échappe les métacaractères regex pour une recherche utilisateur sans risque. */
function echapperRegex(valeur) {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function verifierIdentifiant(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Identifiant parcelle invalide')
  }
}

/**
 * Liste réelle depuis MongoDB, avec recherche et filtres optionnels.
 */
export async function listerParcelles({
  recherche = '',
  statut = '',
  typeSol = '',
} = {}) {
  const filtre = {}

  if (statut) filtre.statut = statut
  if (typeSol) filtre.typeSol = typeSol

  const terme = typeof recherche === 'string' ? recherche.trim() : ''
  if (terme) {
    const motif = echapperRegex(terme)
    filtre.$or = [
      { name: { $regex: motif, $options: 'i' } },
      { localisation: { $regex: motif, $options: 'i' } },
    ]
  }

  const parcelles = await Parcelle.find(filtre).sort({ createdAt: -1 })
  return parcelles.map((parcelle) => parcelle.toJSON())
}

export async function getParcelleById(id) {
  verifierIdentifiant(id)

  const parcelle = await Parcelle.findById(id)
  if (!parcelle) {
    throw new ApiError(404, 'Parcelle introuvable')
  }

  return parcelle.toJSON()
}

export async function createParcelle(donnees) {
  const parcelle = await Parcelle.create(donnees)
  return parcelle.toJSON()
}

export async function updateParcelle(id, donnees) {
  verifierIdentifiant(id)

  const parcelle = await Parcelle.findByIdAndUpdate(id, donnees, {
    new: true,
    runValidators: true,
  })

  if (!parcelle) {
    throw new ApiError(404, 'Parcelle introuvable')
  }

  return parcelle.toJSON()
}

/**
 * Refuse la suppression tant que des cycles sont associés à la parcelle.
 * Aucune suppression en cascade : décision métier validée.
 */
export async function deleteParcelle(id) {
  verifierIdentifiant(id)

  const nombreCycles = await CycleCulture.countDocuments({ parcelle: id })
  if (nombreCycles > 0) {
    throw new ApiError(
      409,
      `Impossible de supprimer cette parcelle : ${nombreCycles} cycle(s) de culture y sont associé(s). Supprimez d'abord ces cycles.`
    )
  }

  const parcelle = await Parcelle.findByIdAndDelete(id)
  if (!parcelle) {
    throw new ApiError(404, 'Parcelle introuvable')
  }

  return parcelle.toJSON()
}

/** Statistiques calculées sur les vraies données MongoDB. */
export async function getStatistiquesParcelles() {
  const [total, disponibles, cultivees, somme] = await Promise.all([
    Parcelle.countDocuments({}),
    Parcelle.countDocuments({ statut: 'Disponible' }),
    Parcelle.countDocuments({ statut: 'Cultivée' }),
    Parcelle.aggregate([
      { $group: { _id: null, total: { $sum: '$superficie' } } },
    ]),
  ])

  const superficieTotale = Math.round((somme[0]?.total ?? 0) * 100) / 100

  return { total, superficieTotale, disponibles, cultivees }
}
