import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import {
  createMouvementRules,
  idMouvementRules,
  listMouvementsRules,
} from '../validators/mouvementValidator.js'
import {
  listerMouvementsController,
  getMouvementController,
  creerMouvementController,
  getIncoherencesController,
  reconcilerController,
} from '../controllers/mouvementController.js'

const router = Router()
const peutEcrire = [protect, authorize('ADMIN', 'MANAGER')]

/* Lecture : tous les rôles authentifiés. Les routes statiques précèdent /:id. */
router.get(
  '/',
  protect,
  listMouvementsRules,
  validate,
  listerMouvementsController
)
router.get(
  '/incoherences',
  protect,
  authorize('ADMIN', 'MANAGER'),
  getIncoherencesController
)
router.get('/:id', protect, idMouvementRules, validate, getMouvementController)

/* Écriture : ADMIN et MANAGER uniquement. */
router.post(
  '/',
  ...peutEcrire,
  createMouvementRules,
  validate,
  creerMouvementController
)
router.post('/reconcilier', ...peutEcrire, reconcilerController)

export default router
