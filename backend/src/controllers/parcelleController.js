import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import {
  listerParcelles,
  getParcelleById,
  createParcelle,
  updateParcelle,
  deleteParcelle,
  getStatistiquesParcelles,
} from '../services/parcelleService.js'

export const listerParcellesController = asyncHandler(async (req, res) => {
  const parcelles = await listerParcelles(req.query)
  return sendSuccess(res, parcelles, 'Parcelles récupérées')
})

export const statistiquesParcellesController = asyncHandler(async (_req, res) => {
  const statistiques = await getStatistiquesParcelles()
  return sendSuccess(res, statistiques, 'Statistiques des parcelles récupérées')
})

export const getParcelleController = asyncHandler(async (req, res) => {
  const parcelle = await getParcelleById(req.params.id)
  return sendSuccess(res, parcelle, 'Parcelle récupérée')
})

export const createParcelleController = asyncHandler(async (req, res) => {
  const parcelle = await createParcelle(req.body)
  return sendSuccess(res, parcelle, 'Parcelle créée avec succès', 201)
})

export const updateParcelleController = asyncHandler(async (req, res) => {
  const parcelle = await updateParcelle(req.params.id, req.body)
  return sendSuccess(res, parcelle, 'Parcelle mise à jour avec succès')
})

export const deleteParcelleController = asyncHandler(async (req, res) => {
  const parcelle = await deleteParcelle(req.params.id)
  return sendSuccess(res, parcelle, 'Parcelle supprimée avec succès')
})
