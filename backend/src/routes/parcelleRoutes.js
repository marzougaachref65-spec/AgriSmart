import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import {
  createParcelleRules,
  updateParcelleRules,
  idParcelleRules,
  listParcellesRules,
} from '../validators/parcelleValidator.js'
import {
  listerParcellesController,
  statistiquesParcellesController,
  getParcelleController,
  createParcelleController,
  updateParcelleController,
  deleteParcelleController,
} from '../controllers/parcelleController.js'

const router = Router()

const peutEcrire = [protect, authorize('ADMIN', 'MANAGER')]

/* Lecture : tous les rôles authentifiés. La route /statistiques précède /:id. */
router.get(
  '/',
  protect,
  listParcellesRules,
  validate,
  listerParcellesController
)
router.get('/statistiques', protect, statistiquesParcellesController)
router.get('/:id', protect, idParcelleRules, validate, getParcelleController)

/* Écriture : ADMIN et MANAGER uniquement. */
router.post(
  '/',
  ...peutEcrire,
  createParcelleRules,
  validate,
  createParcelleController
)
router.put(
  '/:id',
  ...peutEcrire,
  idParcelleRules,
  updateParcelleRules,
  validate,
  updateParcelleController
)
router.delete(
  '/:id',
  ...peutEcrire,
  idParcelleRules,
  validate,
  deleteParcelleController
)

export default router
