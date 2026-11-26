import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import {
  listerTaches,
  getStatistiquesTaches,
  listerTachesEnRetard,
  getTacheById,
  getHistoriqueTache,
  creerTache,
  modifierTache,
  changerStatutTache,
  annulerTache,
  supprimerTache,
} from '../services/tacheService.js'

export const listerTachesController = asyncHandler(async (req, res) => {
  const taches = await listerTaches(req.query, req.user)
  return sendSuccess(res, taches, 'Tâches récupérées')
})

export const statistiquesTachesController = asyncHandler(async (req, res) => {
  const statistiques = await getStatistiquesTaches(req.user)
  return sendSuccess(res, statistiques, 'Statistiques des tâches récupérées')
})

export const tachesEnRetardController = asyncHandler(async (req, res) => {
  const taches = await listerTachesEnRetard(req.user)
  return sendSuccess(res, taches, 'Tâches en retard récupérées')
})

export const getTacheController = asyncHandler(async (req, res) => {
  const tache = await getTacheById(req.params.id, req.user)
  return sendSuccess(res, tache, 'Tâche récupérée')
})

export const historiqueTacheController = asyncHandler(async (req, res) => {
  const historique = await getHistoriqueTache(req.params.id, req.user)
  return sendSuccess(res, historique, 'Historique de la tâche récupéré')
})

export const creerTacheController = asyncHandler(async (req, res) => {
  const tache = await creerTache(req.body, req.user)
  return sendSuccess(res, tache, 'Tâche créée avec succès', 201)
})

export const modifierTacheController = asyncHandler(async (req, res) => {
  const tache = await modifierTache(req.params.id, req.body, req.user)
  return sendSuccess(res, tache, 'Tâche mise à jour avec succès')
})

export const changerStatutTacheController = asyncHandler(async (req, res) => {
  const tache = await changerStatutTache(req.params.id, req.body, req.user)
  return sendSuccess(res, tache, 'Statut de la tâche mis à jour')
})

export const annulerTacheController = asyncHandler(async (req, res) => {
  const tache = await annulerTache(req.params.id, req.body, req.user)
  return sendSuccess(res, tache, 'Tâche annulée avec succès')
})

export const supprimerTacheController = asyncHandler(async (req, res) => {
  const tache = await supprimerTache(req.params.id)
  return sendSuccess(res, tache, 'Tâche supprimée avec succès')
})
