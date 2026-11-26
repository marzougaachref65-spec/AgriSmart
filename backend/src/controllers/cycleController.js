import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import {
  listerCycles,
  getCycleById,
  createCycle,
  updateCycle,
  deleteCycle,
  getStatistiquesCycles,
} from '../services/cycleService.js'

export const listerCyclesController = asyncHandler(async (req, res) => {
  const cycles = await listerCycles(req.query)
  return sendSuccess(res, cycles, 'Cycles de culture récupérés')
})

export const statistiquesCyclesController = asyncHandler(async (_req, res) => {
  const statistiques = await getStatistiquesCycles()
  return sendSuccess(res, statistiques, 'Statistiques des cycles récupérées')
})

export const getCycleController = asyncHandler(async (req, res) => {
  const cycle = await getCycleById(req.params.id)
  return sendSuccess(res, cycle, 'Cycle de culture récupéré')
})

export const createCycleController = asyncHandler(async (req, res) => {
  const cycle = await createCycle(req.body)
  return sendSuccess(res, cycle, 'Cycle de culture créé avec succès', 201)
})

export const updateCycleController = asyncHandler(async (req, res) => {
  const cycle = await updateCycle(req.params.id, req.body)
  return sendSuccess(res, cycle, 'Cycle de culture mis à jour avec succès')
})

export const deleteCycleController = asyncHandler(async (req, res) => {
  const cycle = await deleteCycle(req.params.id)
  return sendSuccess(res, cycle, 'Cycle de culture supprimé avec succès')
})
