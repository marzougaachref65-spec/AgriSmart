import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import {
  listerEvenements,
  getEvenementById,
  creerEvenement,
} from '../services/evenementService.js'

export const listerEvenementsController = asyncHandler(async (req, res) => {
  const evenements = await listerEvenements(req.query)
  return sendSuccess(res, evenements, 'Événements vétérinaires récupérés')
})

export const getEvenementController = asyncHandler(async (req, res) => {
  const evenement = await getEvenementById(req.params.id)
  return sendSuccess(res, evenement, 'Événement vétérinaire récupéré')
})

export const creerEvenementController = asyncHandler(async (req, res) => {
  const resultat = await creerEvenement(req.body, req.user)
  return sendSuccess(
    res,
    resultat,
    resultat.dejaExistant
      ? 'Événement déjà enregistré avec cette référence'
      : 'Événement vétérinaire enregistré avec succès',
    resultat.dejaExistant ? 200 : 201
  )
})
