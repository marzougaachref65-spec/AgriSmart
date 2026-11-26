import mongoose from 'mongoose'
import CategorieFinanciere from '../models/CategorieFinanciere.js'
import OperationFinanciere from '../models/OperationFinanciere.js'
import { ApiError } from '../utils/apiError.js'
import { formaterCategorie } from '../utils/refsFinancieres.js'

function echapperRegex(valeur) {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function verifierIdentifiant(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Identifiant catégorie invalide')
  }
}

function convertirActif(valeur) {
  if (valeur === true || valeur === 'true' || valeur === 1 || valeur === '1') {
    return true
  }
  if (
    valeur === false ||
    valeur === 'false' ||
    valeur === 0 ||
    valeur === '0'
  ) {
    return false
  }
  return undefined
}

export async function listerCategories(filtres = {}) {
  const { type, recherche } = filtres
  const filtre = {}

  if (type) filtre.type = type

  const actif = convertirActif(filtres.actif)
  if (actif !== undefined) filtre.actif = actif

  const terme = typeof recherche === 'string' ? recherche.trim() : ''
  if (terme) {
    const motif = echapperRegex(terme)
    filtre.$or = [
      { code: { $regex: motif, $options: 'i' } },
      { libelle: { $regex: motif, $options: 'i' } },
    ]
  }

  const categories = await CategorieFinanciere.find(filtre).sort({ code: 1 })
  return categories.map((categorie) => formaterCategorie(categorie))
}

export async function getCategorieById(id) {
  verifierIdentifiant(id)

  const categorie = await CategorieFinanciere.findById(id)
  if (!categorie) {
    throw new ApiError(404, 'Catégorie financière introuvable')
  }

  return formaterCategorie(categorie)
}

export async function creerCategorie(donnees, utilisateur) {
  try {
    const categorie = await CategorieFinanciere.create({
      code: String(donnees.code).trim().toUpperCase(),
      libelle: donnees.libelle,
      type: donnees.type,
      description: donnees.description ?? '',
      couleur: donnees.couleur || '#16a34a',
      createdBy: utilisateur._id,
    })

    return formaterCategorie(categorie)
  } catch (erreur) {
    // Le handler global traduirait 11000 en « e-mail déjà utilisé ».
    if (erreur.code === 11000) {
      throw new ApiError(409, 'Ce code de catégorie existe déjà')
    }
    throw erreur
  }
}

export async function modifierCategorie(id, donnees) {
  verifierIdentifiant(id)

  const attributs = {}
  for (const champ of ['libelle', 'type', 'description', 'couleur']) {
    if (Object.prototype.hasOwnProperty.call(donnees ?? {}, champ)) {
      attributs[champ] = donnees[champ]
    }
  }

  const categorie = await CategorieFinanciere.findByIdAndUpdate(
    id,
    { $set: attributs },
    { new: true, runValidators: true }
  )
  if (!categorie) {
    throw new ApiError(404, 'Catégorie financière introuvable')
  }

  return formaterCategorie(categorie)
}

/** Désactivation logique : aucune suppression de catégorie. */
export async function desactiverCategorie(id) {
  verifierIdentifiant(id)

  const categorie = await CategorieFinanciere.findById(id)
  if (!categorie) {
    throw new ApiError(404, 'Catégorie financière introuvable')
  }
  if (!categorie.actif) return formaterCategorie(categorie)

  const nombreOperations = await OperationFinanciere.countDocuments({
    categorie: id,
    statut: 'Actif',
  })
  if (nombreOperations > 0) {
    throw new ApiError(
      409,
      'Cette catégorie est utilisée par des opérations actives'
    )
  }

  categorie.actif = false
  await categorie.save()

  return formaterCategorie(categorie)
}
