import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import { exportRules, rapportRules } from '../validators/rapportValidator.js'
import {
  domaineController,
  exportCsvController,
  exportJsonController,
  syntheseController,
} from '../controllers/rapportController.js'

const router = Router()

/* Module isolé : ADMIN et MANAGER uniquement, y compris pour les exports. */
const acces = [protect, authorize('ADMIN', 'MANAGER')]

/* Routes statiques avant toute route paramétrée. */
router.get('/synthese', ...acces, rapportRules, validate, syntheseController)

router.get(
  '/animaux-cultures',
  ...acces,
  rapportRules,
  validate,
  domaineController('animaux-cultures')
)
router.get(
  '/stocks',
  ...acces,
  rapportRules,
  validate,
  domaineController('stocks')
)
router.get(
  '/veterinaire',
  ...acces,
  rapportRules,
  validate,
  domaineController('veterinaire')
)
router.get(
  '/finances',
  ...acces,
  rapportRules,
  validate,
  domaineController('finances')
)
router.get(
  '/employes-taches',
  ...acces,
  rapportRules,
  validate,
  domaineController('employes-taches')
)

router.get('/export.csv', ...acces, exportRules, validate, exportCsvController)
router.get('/export.json', ...acces, exportRules, validate, exportJsonController)

export default router
