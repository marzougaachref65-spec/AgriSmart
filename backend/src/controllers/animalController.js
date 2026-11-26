import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import {
  listerAnimaux,
  getAnimalById,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  getStatistiquesAnimaux,
} from '../services/animalService.js'

export const listerAnimauxController = asyncHandler(async (req, res) => {
  const animaux = await listerAnimaux(req.query)
  return sendSuccess(res, animaux, 'Animaux récupérés')
})

export const statistiquesAnimauxController = asyncHandler(async (_req, res) => {
  const statistiques = await getStatistiquesAnimaux()
  return sendSuccess(res, statistiques, 'Statistiques récupérées')
})

export const getAnimalController = asyncHandler(async (req, res) => {
  const animal = await getAnimalById(req.params.id)
  return sendSuccess(res, animal, 'Animal récupéré')
})

export const createAnimalController = asyncHandler(async (req, res) => {
  const animal = await createAnimal(req.body)
  return sendSuccess(res, animal, 'Animal créé avec succès', 201)
})

export const updateAnimalController = asyncHandler(async (req, res) => {
  const animal = await updateAnimal(req.params.id, req.body)
  return sendSuccess(res, animal, 'Animal mis à jour avec succès')
})

export const deleteAnimalController = asyncHandler(async (req, res) => {
  const animal = await deleteAnimal(req.params.id)
  return sendSuccess(res, animal, 'Animal supprimé avec succès')
})
