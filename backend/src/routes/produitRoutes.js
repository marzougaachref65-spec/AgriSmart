import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import {
  createProduitRules,
  updateProduitRules,
  idProduitRules,
  listProduitsRules,
} from '../validators/produitValidator.js'
import {
  listerProduitsController,
  getProduitController,
  creerProduitController,
  updateProduitController,
  deleteProduitController,
} from '../controllers/produitController.js'

const router = Router()
const peutEcrire = [protect, authorize('ADMIN', 'MANAGER')]

/* Lecture : tous les rôles authentifiés. */
router.get('/', protect, listProduitsRules, validate, listerProduitsController)
router.get('/:id', protect, idProduitRules, validate, getProduitController)

/* Écriture : ADMIN et MANAGER uniquement. */
router.post(
  '/',
  ...peutEcrire,
  createProduitRules,
  validate,
  creerProduitController
)
router.put(
  '/:id',
  ...peutEcrire,
  idProduitRules,
  updateProduitRules,
  validate,
  updateProduitController
)
router.delete(
  '/:id',
  ...peutEcrire,
  idProduitRules,
  validate,
  deleteProduitController
)

export default router
