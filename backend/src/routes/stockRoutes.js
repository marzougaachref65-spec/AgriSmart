import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { statistiquesRules } from '../validators/stockValidator.js'
import {
  statistiquesStocksController,
  alertesStocksController,
} from '../controllers/stockController.js'

const router = Router()

router.get(
  '/statistiques',
  protect,
  statistiquesRules,
  validate,
  statistiquesStocksController
)
router.get('/alertes', protect, alertesStocksController)

export default router
