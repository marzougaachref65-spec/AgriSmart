import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import {
  idNotificationRules,
  listNotificationsRules,
  marquerLueRules,
} from '../validators/notificationValidator.js'
import {
  actualiserNotificationsController,
  getNotificationController,
  listerNotificationsController,
  marquerLueController,
  marquerToutesLuesController,
  statistiquesNotificationsController,
} from '../controllers/notificationController.js'

const router = Router()

/* Chaque utilisateur n'accède qu'à ses propres notifications : le service
   filtre systématiquement sur req.user, quel que soit le rôle. */
const lecture = [protect]

/* Le recalcul manuel est réservé à l'encadrement. */
const actualisation = [protect, authorize('ADMIN', 'MANAGER')]

/* Les routes statiques précèdent toujours /:id. */
router.get('/statistiques', ...lecture, statistiquesNotificationsController)
router.post('/actualiser', ...actualisation, actualiserNotificationsController)
router.patch(
  '/lire-toutes',
  ...lecture,
  ...marquerLueRules,
  validate,
  marquerToutesLuesController
)

router.get('/', ...lecture, listNotificationsRules, validate, listerNotificationsController)
router.get('/:id', ...lecture, idNotificationRules, validate, getNotificationController)
router.patch(
  '/:id/lue',
  ...lecture,
  idNotificationRules,
  ...marquerLueRules,
  validate,
  marquerLueController
)

export default router
