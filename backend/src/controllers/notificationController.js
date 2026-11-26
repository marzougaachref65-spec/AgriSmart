import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import {
  getNotificationById,
  getStatistiquesNotifications,
  listerNotifications,
  marquerLue,
  marquerToutesLues,
} from '../services/notificationService.js'
import { executerPlanificateur } from '../jobs/planificateurAlertes.js'

export const listerNotificationsController = asyncHandler(async (req, res) => {
  const resultat = await listerNotifications(req.query, req.user)
  return sendSuccess(res, resultat, 'Notifications récupérées')
})

export const statistiquesNotificationsController = asyncHandler(async (req, res) => {
  const statistiques = await getStatistiquesNotifications(req.user)
  return sendSuccess(res, statistiques, 'Statistiques des notifications récupérées')
})

export const getNotificationController = asyncHandler(async (req, res) => {
  const notification = await getNotificationById(req.params.id, req.user)
  return sendSuccess(res, notification, 'Notification récupérée')
})

export const marquerLueController = asyncHandler(async (req, res) => {
  const notification = await marquerLue(
    req.params.id,
    req.user,
    req.body.lue ?? true
  )
  return sendSuccess(res, notification, 'Statut de lecture mis à jour')
})

export const marquerToutesLuesController = asyncHandler(async (req, res) => {
  const resultat = await marquerToutesLues(req.user, req.body.lue ?? true)
  return sendSuccess(res, resultat, 'Notifications marquées comme lues')
})

export const actualiserNotificationsController = asyncHandler(async (_req, res) => {
  const rapport = await executerPlanificateur()
  return sendSuccess(res, rapport, 'Alertes recalculées')
})
