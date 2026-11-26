import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import {
  getTableauDeBord,
  getStatistiquesFinancieres,
  getRapportSynthese,
  getRapportCsv,
} from '../services/rapportFinancierService.js'

export const tableauDeBordController = asyncHandler(async (req, res) => {
  const tableau = await getTableauDeBord(req.query)
  return sendSuccess(res, tableau, 'Tableau de bord financier récupéré')
})

export const statistiquesFinancieresController = asyncHandler(async (req, res) => {
  const statistiques = await getStatistiquesFinancieres(req.query)
  return sendSuccess(res, statistiques, 'Statistiques financières récupérées')
})

export const rapportSyntheseController = asyncHandler(async (req, res) => {
  const rapport = await getRapportSynthese(req.query)
  return sendSuccess(res, rapport, 'Rapport de synthèse généré')
})

export const rapportCsvController = asyncHandler(async (req, res) => {
  const csv = await getRapportCsv(req.query)
  res.set('Content-Type', 'text/csv; charset=utf-8')
  res.set(
    'Content-Disposition',
    'attachment; filename="agrismart-operations.csv"'
  )
  return res.status(200).send(csv)
})
