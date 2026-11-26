import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import {
  createDossierRules,
  updateDossierRules,
  idDossierRules,
  idAnimalParamRules,
  listDossiersRules,
} from '../validators/veterinaireValidator.js'
import {
  listerDossiersController,
  getDossierController,
  getDossierAnimalController,
  creerDossierController,
  modifierDossierController,
  supprimerDossierController,
} from '../controllers/dossierController.js'

const router = Router()
const acces = [protect, authorize('ADMIN', 'MANAGER')]

/* Les routes statiques précèdent /:id. */
router.get('/', ...acces, listDossiersRules, validate, listerDossiersController)
router.get(
  '/animal/:animalId',
  ...acces,
  idAnimalParamRules,
  validate,
  getDossierAnimalController
)
router.get('/:id', ...acces, idDossierRules, validate, getDossierController)

router.post(
  '/',
  ...acces,
  createDossierRules,
  validate,
  creerDossierController
)
router.put(
  '/:id',
  ...acces,
  updateDossierRules,
  idDossierRules,
  validate,
  modifierDossierController
)
router.delete(
  '/:id',
  ...acces,
  idDossierRules,
  validate,
  supprimerDossierController
)

export default router
