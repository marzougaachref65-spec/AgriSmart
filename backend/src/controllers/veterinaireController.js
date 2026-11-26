import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import {
  listerRappels,
  getRappelById,
  creerRappel,
  modifierRappel,
  supprimerRappel,
} from '../services/rappelService.js'
import {
  getHistoriqueAnimal,
  getCalendrier,
  getAlertes,
  getStatistiquesVeterinaires,
} from '../services/veterinaireService.js'

export const listerRappelsController = asyncHandler(async (req, res) => {
  const rappels = await listerRappels(req.query)
  return sendSuccess(res, rappels, 'Rappels de soins récupérés')
})

export const getRappelController = asyncHandler(async (req, res) => {
  const rappel = await getRappelById(req.params.id)
  return sendSuccess(res, rappel, 'Rappel de soin récupéré')
})

export const creerRappelController = asyncHandler(async (req, res) => {
  const rappel = await creerRappel(req.body, req.user)
  return sendSuccess(res, rappel, 'Rappel de soin créé avec succès', 201)
})

export const modifierRappelController = asyncHandler(async (req, res) => {
  const rappel = await modifierRappel(req.params.id, req.body)
  return sendSuccess(res, rappel, 'Rappel de soin mis à jour avec succès')
})

export const supprimerRappelController = asyncHandler(async (req, res) => {
  const rappel = await supprimerRappel(req.params.id)
  return sendSuccess(res, rappel, 'Rappel de soin supprimé avec succès')
})

export const historiqueAnimalController = asyncHandler(async (req, res) => {
  const historique = await getHistoriqueAnimal(req.params.animalId)
  return sendSuccess(res, historique, 'Historique sanitaire récupéré')
})

export const calendrierController = asyncHandler(async (req, res) => {
  const calendrier = await getCalendrier(req.query)
  return sendSuccess(res, calendrier, 'Calendrier des soins récupéré')
})

export const alertesController = asyncHandler(async (req, res) => {
  const alertes = await getAlertes(req.query)
  return sendSuccess(res, alertes, 'Alertes vétérinaires récupérées')
})

export const statistiquesController = asyncHandler(async (req, res) => {
  const statistiques = await getStatistiquesVeterinaires(req.query)
  return sendSuccess(res, statistiques, 'Statistiques vétérinaires récupérées')
})
