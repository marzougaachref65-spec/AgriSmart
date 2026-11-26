import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import {
  listerEmployes,
  getStatistiquesEmployes,
  getComptesDisponibles,
  getEmployeById,
  getHistoriqueEmploye,
  getHistoriqueEmployes,
  creerEmploye,
  modifierEmploye,
  desactiverEmploye,
  reactiverEmploye,
} from '../services/employeService.js'

export const listerEmployesController = asyncHandler(async (req, res) => {
  const employes = await listerEmployes(req.query, req.user)
  return sendSuccess(res, employes, 'Employés récupérés')
})

export const statistiquesEmployesController = asyncHandler(async (req, res) => {
  const statistiques = await getStatistiquesEmployes()
  return sendSuccess(res, statistiques, 'Statistiques des employés récupérées')
})

export const comptesDisponiblesController = asyncHandler(async (req, res) => {
  const comptes = await getComptesDisponibles()
  return sendSuccess(res, comptes, 'Comptes employés disponibles récupérés')
})

export const getEmployeController = asyncHandler(async (req, res) => {
  const employe = await getEmployeById(req.params.id, req.user)
  return sendSuccess(res, employe, 'Employé récupéré')
})

export const historiqueEmployesController = asyncHandler(async (req, res) => {
  const historique = await getHistoriqueEmployes(req.query)
  return sendSuccess(res, historique, 'Historique des employés récupéré')
})

export const historiqueEmployeController = asyncHandler(async (req, res) => {
  const historique = await getHistoriqueEmploye(req.params.id)
  return sendSuccess(res, historique, 'Historique de l’employé récupéré')
})

export const creerEmployeController = asyncHandler(async (req, res) => {
  const employe = await creerEmploye(req.body, req.user)
  return sendSuccess(res, employe, 'Employé créé avec succès', 201)
})

export const modifierEmployeController = asyncHandler(async (req, res) => {
  const employe = await modifierEmploye(req.params.id, req.body, req.user)
  return sendSuccess(res, employe, 'Employé mis à jour avec succès')
})

export const desactiverEmployeController = asyncHandler(async (req, res) => {
  const employe = await desactiverEmploye(req.params.id, req.user, req.body)
  return sendSuccess(res, employe, 'Employé désactivé avec succès')
})

export const reactiverEmployeController = asyncHandler(async (req, res) => {
  const employe = await reactiverEmploye(req.params.id, req.user)
  return sendSuccess(res, employe, 'Employé réactivé avec succès')
})
