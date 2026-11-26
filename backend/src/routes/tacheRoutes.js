import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import {
  createTacheRules,
  updateTacheRules,
  changerStatutTacheRules,
  annulerTacheRules,
  idTacheRules,
  listTachesRules,
} from '../validators/tacheValidator.js'
import {
  listerTachesController,
  statistiquesTachesController,
  tachesEnRetardController,
  getTacheController,
  historiqueTacheController,
  creerTacheController,
  modifierTacheController,
  changerStatutTacheController,
  annulerTacheController,
  supprimerTacheController,
} from '../controllers/tacheController.js'

const router = Router()

/* Lecture : tous les rôles authentifiés. Le service restreint automatiquement
   les comptes EMPLOYEE à leurs propres affectations. */
const lecture = [protect]
/* Écriture : réservée à l'encadrement. */
const ecriture = [protect, authorize('ADMIN', 'MANAGER')]

/* Les routes statiques précèdent toujours /:id. */
router.get('/', ...lecture, listTachesRules, validate, listerTachesController)
router.get('/statistiques', ...lecture, statistiquesTachesController)
router.get('/en-retard', ...lecture, tachesEnRetardController)
router.get('/:id/historique', ...lecture, idTacheRules, validate, historiqueTacheController)
router.get('/:id', ...lecture, idTacheRules, validate, getTacheController)

router.post('/', ...ecriture, createTacheRules, validate, creerTacheController)
router.put('/:id', ...ecriture, idTacheRules, ...updateTacheRules, validate, modifierTacheController)
router.patch(
  '/:id/statut',
  ...ecriture,
  idTacheRules,
  ...changerStatutTacheRules,
  validate,
  changerStatutTacheController
)
router.post(
  '/:id/annuler',
  ...ecriture,
  idTacheRules,
  ...annulerTacheRules,
  validate,
  annulerTacheController
)
router.delete('/:id', ...ecriture, idTacheRules, validate, supprimerTacheController)

export default router
