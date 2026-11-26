import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import {
  createEmployeRules,
  updateEmployeRules,
  desactiverEmployeRules,
  idEmployeRules,
  listEmployesRules,
  historiqueEmployesRules,
} from '../validators/employeValidator.js'
import {
  listerEmployesController,
  statistiquesEmployesController,
  comptesDisponiblesController,
  getEmployeController,
  historiqueEmployesController,
  historiqueEmployeController,
  creerEmployeController,
  modifierEmployeController,
  desactiverEmployeController,
  reactiverEmployeController,
} from '../controllers/employeController.js'

const router = Router()

/* Les informations employés, y compris salariales, sont réservées à
   l'encadrement. Aucune route n'est exposée aux comptes EMPLOYEE. */
const acces = [protect, authorize('ADMIN', 'MANAGER')]

/* Les routes statiques précèdent toujours /:id. */
router.get('/', ...acces, listEmployesRules, validate, listerEmployesController)
router.get(
  '/statistiques',
  ...acces,
  statistiquesEmployesController
)
router.get(
  '/comptes-disponibles',
  ...acces,
  comptesDisponiblesController
)
router.get(
  '/historique',
  ...acces,
  historiqueEmployesRules,
  validate,
  historiqueEmployesController
)
router.get('/:id/historique', ...acces, idEmployeRules, validate, historiqueEmployeController)
router.get('/:id', ...acces, idEmployeRules, validate, getEmployeController)

router.post('/', ...acces, createEmployeRules, validate, creerEmployeController)
router.put('/:id', ...acces, idEmployeRules, ...updateEmployeRules, validate, modifierEmployeController)
router.patch(
  '/:id/desactiver',
  ...acces,
  idEmployeRules,
  ...desactiverEmployeRules,
  validate,
  desactiverEmployeController
)
router.patch('/:id/reactiver', ...acces, idEmployeRules, validate, reactiverEmployeController)

export default router
