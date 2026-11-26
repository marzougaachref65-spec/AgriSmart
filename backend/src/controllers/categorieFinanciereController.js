import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import {
  listerCategories,
  getCategorieById,
  creerCategorie,
  modifierCategorie,
  desactiverCategorie,
} from '../services/categorieFinanciereService.js'

export const listerCategoriesController = asyncHandler(async (req, res) => {
  const categories = await listerCategories(req.query)
  return sendSuccess(res, categories, 'Catégories financières récupérées')
})

export const getCategorieController = asyncHandler(async (req, res) => {
  const categorie = await getCategorieById(req.params.id)
  return sendSuccess(res, categorie, 'Catégorie financière récupérée')
})

export const creerCategorieController = asyncHandler(async (req, res) => {
  const categorie = await creerCategorie(req.body, req.user)
  return sendSuccess(
    res,
    categorie,
    'Catégorie financière créée avec succès',
    201
  )
})

export const modifierCategorieController = asyncHandler(async (req, res) => {
  const categorie = await modifierCategorie(req.params.id, req.body)
  return sendSuccess(
    res,
    categorie,
    'Catégorie financière mise à jour avec succès'
  )
})

export const desactiverCategorieController = asyncHandler(async (req, res) => {
  const categorie = await desactiverCategorie(req.params.id)
  return sendSuccess(
    res,
    categorie,
    'Catégorie financière désactivée avec succès'
  )
})
