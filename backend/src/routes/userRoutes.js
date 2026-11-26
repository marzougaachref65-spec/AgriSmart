import { Router } from 'express'
import { createUserController } from '../controllers/userController.js'
import { createUserRules } from '../validators/userValidator.js'
import { validate } from '../middlewares/validate.js'
import { protect } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'

const router = Router()

// Seul un ADMIN peut créer des comptes MANAGER ou EMPLOYEE.
router.post(
  '/',
  protect,
  authorize('ADMIN'),
  createUserRules,
  validate,
  createUserController
)

export default router
