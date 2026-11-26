import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import {
  listerDossiers,
  getDossierById,
  getDossierParAnimal,
  creerDossier,
  modifierDossier,
  supprimerDossier,
} from '../services/dossierService.js'

export const listerDossiersController = asyncHandler(async (req, res) => {
  const dossiers = await listerDossiers(req.query)
  return sendSuccess(res, dossiers, 'Dossiers médicaux récupérés')
})

export const getDossierController = asyncHandler(async (req, res) => {
  const dossier = await getDossierById(req.params.id)
  return sendSuccess(res, dossier, 'Dossier médical récupéré')
})

export const getDossierAnimalController = asyncHandler(async (req, res) => {
  const dossier = await getDossierParAnimal(req.params.animalId)
  return sendSuccess(res, dossier, 'Dossier médical de l’animal récupéré')
})

export const creerDossierController = asyncHandler(async (req, res) => {
  const dossier = await creerDossier(req.body, req.user)
  return sendSuccess(res, dossier, 'Dossier médical créé avec succès', 201)
})

export const modifierDossierController = asyncHandler(async (req, res) => {
  const dossier = await modifierDossier(req.params.id, req.body)
  return sendSuccess(res, dossier, 'Dossier médical mis à jour avec succès')
})

export const supprimerDossierController = asyncHandler(async (req, res) => {
  const dossier = await supprimerDossier(req.params.id)
  return sendSuccess(res, dossier, 'Dossier médical supprimé avec succès')
})
