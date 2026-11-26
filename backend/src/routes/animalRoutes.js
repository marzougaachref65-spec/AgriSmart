import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import {
  createAnimalRules,
  updateAnimalRules,
  idAnimalRules,
  listAnimalsRules,
} from '../validators/animalValidator.js'
import {
  listerAnimauxController,
  statistiquesAnimauxController,
  getAnimalController,
  createAnimalController,
  updateAnimalController,
  deleteAnimalController,
} from '../controllers/animalController.js'

const router = Router()

const peutEcrire = [protect, authorize('ADMIN', 'MANAGER')]

/* Lecture : tous les rôles authentifiés. La route /statistiques précède /:id. */
router.get('/', protect, listAnimalsRules, validate, listerAnimauxController)
router.get('/statistiques', protect, statistiquesAnimauxController)
router.get('/:id', protect, idAnimalRules, validate, getAnimalController)

/* Écriture : ADMIN et MANAGER uniquement. */
router.post('/', ...peutEcrire, createAnimalRules, validate, createAnimalController)
router.put(
  '/:id',
  ...peutEcrire,
  idAnimalRules,
  updateAnimalRules,
  validate,
  updateAnimalController
)
router.delete('/:id', ...peutEcrire, idAnimalRules, validate, deleteAnimalController)

export default router
