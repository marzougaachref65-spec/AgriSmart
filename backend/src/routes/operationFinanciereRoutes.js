import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import {
  createOperationRules,
  updateOperationRules,
  idOperationRules,
  listOperationsRules,
  createPaiementRules,
  annulerOperationRules,
} from '../validators/financesValidator.js'
import {
  listerOperationsController,
  getOperationController,
  creerOperationController,
  modifierOperationController,
  creerPaiementController,
  annulerOperationController,
  historiqueOperationController,
} from '../controllers/operationFinanciereController.js'

const router = Router()
const acces = [protect, authorize('ADMIN', 'MANAGER')]

/* Routes statiques avant /:id. */
router.get(
  '/',
  ...acces,
  listOperationsRules,
  validate,
  listerOperationsController
)
router.get(
  '/:id/historique',
  ...acces,
  idOperationRules,
  validate,
  historiqueOperationController
)
router.get(
  '/:id',
  ...acces,
  idOperationRules,
  validate,
  getOperationController
)
router.post(
  '/',
  ...acces,
  createOperationRules,
  validate,
  creerOperationController
)
router.post(
  '/:id/paiements',
  ...acces,
  idOperationRules,
  createPaiementRules,
  validate,
  creerPaiementController
)
router.post(
  '/:id/annuler',
  ...acces,
  idOperationRules,
  annulerOperationRules,
  validate,
  annulerOperationController
)
router.put(
  '/:id',
  ...acces,
  idOperationRules,
  updateOperationRules,
  validate,
  modifierOperationController
)

export default router
