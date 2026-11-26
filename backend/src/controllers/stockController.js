import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { getStatistiquesStocks, getAlertesStock } from '../services/stockService.js'

export const statistiquesStocksController = asyncHandler(async (req, res) => {
  const statistiques = await getStatistiquesStocks(req.query)
  return sendSuccess(res, statistiques, 'Statistiques des stocks récupérées')
})

export const alertesStocksController = asyncHandler(async (_req, res) => {
  const alertes = await getAlertesStock()
  return sendSuccess(res, alertes, 'Alertes des stocks récupérées')
})
