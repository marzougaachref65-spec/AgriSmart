import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import {
  calendrierRules,
  alertesRules,
  periodeRules,
  createRappelRules,
  updateRappelRules,
  idRappelRules,
  listRappelsRules,
  idAnimalParamRules,
} from '../validators/veterinaireValidator.js'
import {
  listerRappelsController,
  getRappelController,
  creerRappelController,
  modifierRappelController,
  supprimerRappelController,
  historiqueAnimalController,
  calendrierController,
  alertesController,
  statistiquesController,
} from '../controllers/veterinaireController.js'

const router = Router()
const acces = [protect, authorize('ADMIN', 'MANAGER')]

/* Routes statiques avant /rappels/:id. */
router.get(
  '/calendrier',
  ...acces,
  calendrierRules,
  validate,
  calendrierController
)
router.get('/alertes', ...acces, alertesRules, validate, alertesController)
router.get(
  '/statistiques',
  ...acces,
  periodeRules,
  validate,
  statistiquesController
)
router.get(
  '/animaux/:animalId/historique',
  ...acces,
  idAnimalParamRules,
  validate,
  historiqueAnimalController
)

router.get(
  '/rappels',
  ...acces,
  listRappelsRules,
  validate,
  listerRappelsController
)
router.get(
  '/rappels/:id',
  ...acces,
  idRappelRules,
  validate,
  getRappelController
)
router.post(
  '/rappels',
  ...acces,
  createRappelRules,
  validate,
  creerRappelController
)
router.put(
  '/rappels/:id',
  ...acces,
  updateRappelRules,
  idRappelRules,
  validate,
  modifierRappelController
)
router.delete(
  '/rappels/:id',
  ...acces,
  idRappelRules,
  validate,
  supprimerRappelController
)

export default router
