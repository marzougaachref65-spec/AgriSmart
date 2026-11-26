import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import {
  listerOperations,
  getOperationById,
  getHistoriqueOperation,
  creerOperation,
  modifierOperation,
  ajouterPaiement,
  annulerOperation,
} from '../services/operationFinanciereService.js'

export const listerOperationsController = asyncHandler(async (req, res) => {
  const operations = await listerOperations(req.query)
  return sendSuccess(res, operations, 'Opérations financières récupérées')
})

export const getOperationController = asyncHandler(async (req, res) => {
  const operation = await getOperationById(req.params.id)
  return sendSuccess(res, operation, 'Opération financière récupérée')
})

export const creerOperationController = asyncHandler(async (req, res) => {
  const operation = await creerOperation(req.body, req.user)
  return sendSuccess(
    res,
    operation,
    operation.dejaExistant
      ? 'Opération financière déjà enregistrée'
      : 'Opération financière créée avec succès',
    operation.dejaExistant ? 200 : 201
  )
})

export const modifierOperationController = asyncHandler(async (req, res) => {
  const operation = await modifierOperation(req.params.id, req.body, req.user)
  return sendSuccess(
    res,
    operation,
    'Opération financière mise à jour avec succès'
  )
})

export const creerPaiementController = asyncHandler(async (req, res) => {
  const operation = await ajouterPaiement(req.params.id, req.body, req.user)
  return sendSuccess(res, operation, 'Paiement ajouté avec succès', 201)
})

export const annulerOperationController = asyncHandler(async (req, res) => {
  const operation = await annulerOperation(req.params.id, req.body, req.user)
  return sendSuccess(res, operation, 'Opération financière annulée')
})

export const historiqueOperationController = asyncHandler(async (req, res) => {
  const historique = await getHistoriqueOperation(req.params.id)
  return sendSuccess(res, historique, 'Historique de l’opération récupéré')
})
