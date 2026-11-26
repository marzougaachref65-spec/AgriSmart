import mongoose from 'mongoose'
import CycleCulture from '../models/CycleCulture.js'
import Parcelle from '../models/Parcelle.js'
import { ApiError } from '../utils/apiError.js'

/** Échappe les métacaractères regex pour une recherche utilisateur sans risque. */
function echapperRegex(valeur) {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function verifierIdentifiant(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Identifiant cycle invalide')
  }
}

/** La relation doit toujours pointer vers une parcelle réellement existante. */
async function verifierParcelleExiste(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Parcelle associée invalide')
  }

  const parcelle = await Parcelle.exists({ _id: id })
  if (!parcelle) {
    throw new ApiError(404, 'Parcelle associée introuvable')
  }
}

/**
 * DTO stable : `id`, `parcelleId` (chaîne) et `parcelle` ({ id, name, superficie })
 * lorsque le document est populated.
 */
function formaterCycle(cycle) {
  const objet = cycle.toJSON()
  const brut = objet.parcelle

  const estPeuple =
    brut &&
    typeof brut === 'object' &&
    'name' in brut &&
    Boolean(brut._id || brut.id)

  if (estPeuple) {
    const identifiant = (brut._id ?? brut.id).toString()
    return {
      ...objet,
      parcelleId: identifiant,
      parcelle: {
        id: identifiant,
        name: brut.name,
        superficie: brut.superficie ?? null,
      },
    }
  }

  return {
    ...objet,
    parcelleId: brut ? brut.toString() : null,
    parcelle: null,
  }
}

/**
 * Liste réelle depuis MongoDB, avec recherche et filtres optionnels.
 */
export async function listerCycles({
  recherche = '',
  parcelle = '',
  culture = '',
  statut = '',
} = {}) {
  const filtre = {}

  if (parcelle) filtre.parcelle = parcelle
  if (statut) filtre.statut = statut

  const termeRecherche = typeof recherche === 'string' ? recherche.trim() : ''
  const termeCulture = typeof culture === 'string' ? culture.trim() : ''

  if (termeRecherche) {
    const motif = echapperRegex(termeRecherche)
    filtre.$or = [
      { typeCulture: { $regex: motif, $options: 'i' } },
      { variete: { $regex: motif, $options: 'i' } },
    ]
  }
  if (termeCulture) {
    filtre.typeCulture = { $regex: echapperRegex(termeCulture), $options: 'i' }
  }

  const cycles = await CycleCulture.find(filtre)
    .populate('parcelle', 'name superficie')
    .sort({ createdAt: -1 })

  return cycles.map(formaterCycle)
}

export async function getCycleById(id) {
  verifierIdentifiant(id)

  const cycle = await CycleCulture.findById(id).populate(
    'parcelle',
    'name superficie'
  )
  if (!cycle) {
    throw new ApiError(404, 'Cycle de culture introuvable')
  }

  return formaterCycle(cycle)
}

export async function createCycle(donnees) {
  await verifierParcelleExiste(donnees.parcelle)

  const cycle = await CycleCulture.create(donnees)
  return getCycleById(cycle._id.toString())
}

export async function updateCycle(id, donnees) {
  verifierIdentifiant(id)

  if (donnees.parcelle) {
    await verifierParcelleExiste(donnees.parcelle)
  }

  const cycle = await CycleCulture.findByIdAndUpdate(id, donnees, {
    new: true,
    runValidators: true,
  })

  if (!cycle) {
    throw new ApiError(404, 'Cycle de culture introuvable')
  }

  return getCycleById(id)
}

export async function deleteCycle(id) {
  verifierIdentifiant(id)

  const cycle = await CycleCulture.findByIdAndDelete(id)
  if (!cycle) {
    throw new ApiError(404, 'Cycle de culture introuvable')
  }

  return formaterCycle(cycle)
}

/** Statistiques calculées sur les vraies données MongoDB. */
export async function getStatistiquesCycles() {
  const [enCours, recoltees, somme] = await Promise.all([
    CycleCulture.countDocuments({ statut: 'En cours' }),
    CycleCulture.countDocuments({ statut: 'Récoltée' }),
    CycleCulture.aggregate([
      { $group: { _id: null, total: { $sum: '$quantiteRecoltee' } } },
    ]),
  ])

  const quantiteTotaleRecoltee =
    Math.round((somme[0]?.total ?? 0) * 100) / 100

  return { enCours, recoltees, quantiteTotaleRecoltee }
}
