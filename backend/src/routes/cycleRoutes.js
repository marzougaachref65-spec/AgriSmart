import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import {
  createCycleRules,
  updateCycleRules,
  idCycleRules,
  listCyclesRules,
} from '../validators/cycleValidator.js'
import {
  listerCyclesController,
  statistiquesCyclesController,
  getCycleController,
  createCycleController,
  updateCycleController,
  deleteCycleController,
} from '../controllers/cycleController.js'

const router = Router()

const peutEcrire = [protect, authorize('ADMIN', 'MANAGER')]

/* Lecture : tous les rôles authentifiés. La route /statistiques précède /:id. */
router.get('/', protect, listCyclesRules, validate, listerCyclesController)
router.get('/statistiques', protect, statistiquesCyclesController)
router.get('/:id', protect, idCycleRules, validate, getCycleController)

/* Écriture : ADMIN et MANAGER uniquement. */
router.post('/', ...peutEcrire, createCycleRules, validate, createCycleController)
router.put(
  '/:id',
  ...peutEcrire,
  idCycleRules,
  updateCycleRules,
  validate,
  updateCycleController
)
router.delete('/:id', ...peutEcrire, idCycleRules, validate, deleteCycleController)

export default router
