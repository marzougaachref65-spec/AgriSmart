import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import {
  createCategorieRules,
  updateCategorieRules,
  idCategorieRules,
  listCategoriesRules,
} from '../validators/financesValidator.js'
import {
  listerCategoriesController,
  getCategorieController,
  creerCategorieController,
  modifierCategorieController,
  desactiverCategorieController,
} from '../controllers/categorieFinanciereController.js'

const router = Router()
const acces = [protect, authorize('ADMIN', 'MANAGER')]

router.get(
  '/',
  ...acces,
  listCategoriesRules,
  validate,
  listerCategoriesController
)
router.get(
  '/:id',
  ...acces,
  idCategorieRules,
  validate,
  getCategorieController
)
router.post(
  '/',
  ...acces,
  createCategorieRules,
  validate,
  creerCategorieController
)
router.put(
  '/:id',
  ...acces,
  idCategorieRules,
  updateCategorieRules,
  validate,
  modifierCategorieController
)
router.delete(
  '/:id',
  ...acces,
  idCategorieRules,
  validate,
  desactiverCategorieController
)

export default router
