import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import {
  creerMouvement,
  listerMouvements,
  getMouvementById,
  getIncoherences,
  reconcilerMouvements,
} from '../services/mouvementService.js'

export const listerMouvementsController = asyncHandler(async (req, res) => {
  const mouvements = await listerMouvements(req.query)
  return sendSuccess(res, mouvements, 'Mouvements récupérés')
})

export const getMouvementController = asyncHandler(async (req, res) => {
  const mouvement = await getMouvementById(req.params.id)
  return sendSuccess(res, mouvement, 'Mouvement récupéré')
})

export const creerMouvementController = asyncHandler(async (req, res) => {
  const { mouvement, dejaExistant } = await creerMouvement(req.body, req.user)
  return sendSuccess(
    res,
    mouvement,
    dejaExistant
      ? 'Mouvement déjà enregistré (référence existante)'
      : 'Mouvement enregistré avec succès',
    dejaExistant ? 200 : 201
  )
})

export const getIncoherencesController = asyncHandler(async (_req, res) => {
  const rapport = await getIncoherences()
  return sendSuccess(res, rapport, 'Diagnostic de cohérence récupéré')
})

export const reconcilerController = asyncHandler(async (_req, res) => {
  const rapport = await reconcilerMouvements()
  return sendSuccess(res, rapport, 'Réconciliation terminée')
})
