import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import {
  getRapportDomaine,
  getRapportSynthese,
  resoudrePeriodeRapport,
} from '../services/rapportService.js'
import {
  getCsvRapport,
  getJsonRapport,
} from '../services/exportRapportService.js'

export const syntheseController = asyncHandler(async (req, res) => {
  const rapport = await getRapportSynthese(req.query, req.user)
  return sendSuccess(res, rapport, 'Synthèse des rapports générée')
})

/** Fabrique un contrôleur par onglet, sans dupliquer la logique de réponse. */
export function domaineController(domaine) {
  return asyncHandler(async (req, res) => {
    const rapport = await getRapportDomaine(domaine, req.query, req.user)
    return sendSuccess(res, rapport, `Rapport ${domaine} généré`)
  })
}

export const exportCsvController = asyncHandler(async (req, res) => {
  const periode = resoudrePeriodeRapport(req.query.debut, req.query.fin)
  const domaine = req.query.domaine
  const csv = await getCsvRapport(domaine, periode, req.user)

  res.set('Content-Type', 'text/csv; charset=utf-8')
  res.set(
    'Content-Disposition',
    `attachment; filename="agrismart-rapport-${domaine}.csv"`
  )
  return res.status(200).send(csv)
})

export const exportJsonController = asyncHandler(async (req, res) => {
  const periode = resoudrePeriodeRapport(req.query.debut, req.query.fin)
  const domaine = req.query.domaine
  const donnees = await getJsonRapport(domaine, periode, req.user)

  res.set(
    'Content-Disposition',
    `attachment; filename="agrismart-rapport-${domaine}.json"`
  )
  return sendSuccess(res, donnees, 'Export JSON généré')
})
