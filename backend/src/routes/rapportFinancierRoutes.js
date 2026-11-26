import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import { periodeRules } from '../validators/financesValidator.js'
import {
  tableauDeBordController,
  statistiquesFinancieresController,
  rapportSyntheseController,
  rapportCsvController,
} from '../controllers/rapportFinancierController.js'

const router = Router()
const acces = [protect, authorize('ADMIN', 'MANAGER')]

/* Routes statiques avant toute route paramétrée. */
router.get(
  '/tableau-de-bord',
  ...acces,
  periodeRules,
  validate,
  tableauDeBordController
)
router.get(
  '/statistiques',
  ...acces,
  periodeRules,
  validate,
  statistiquesFinancieresController
)
router.get(
  '/rapports/synthese',
  ...acces,
  periodeRules,
  validate,
  rapportSyntheseController
)
router.get(
  '/rapports/operations.csv',
  ...acces,
  periodeRules,
  validate,
  rapportCsvController
)

export default router
