import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import {
  createEvenementRules,
  idEvenementRules,
  listEvenementsRules,
} from '../validators/veterinaireValidator.js'
import {
  listerEvenementsController,
  getEvenementController,
  creerEvenementController,
} from '../controllers/evenementController.js'

const router = Router()
const acces = [protect, authorize('ADMIN', 'MANAGER')]

router.get(
  '/',
  ...acces,
  listEvenementsRules,
  validate,
  listerEvenementsController
)
router.get(
  '/:id',
  ...acces,
  idEvenementRules,
  validate,
  getEvenementController
)

/* L'historique sanitaire est immuable : aucun PUT ni DELETE. */
router.post(
  '/',
  ...acces,
  createEvenementRules,
  validate,
  creerEvenementController
)

export default router
