import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  loginController,
  meController,
} from '../controllers/authController.js'
import { loginRules } from '../validators/authValidator.js'
import { validate } from '../middlewares/validate.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

/**
 * Limite les tentatives de connexion pour freiner les attaques par force brute.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, réessayez plus tard',
    data: null,
  },
})

// Aucune route publique d'inscription : seul le login est exposé ici.
router.post('/login', loginLimiter, loginRules, validate, loginController)
router.get('/me', protect, meController)

export default router
