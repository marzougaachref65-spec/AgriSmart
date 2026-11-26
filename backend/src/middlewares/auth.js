import mongoose from 'mongoose'
import User from '../models/User.js'
import { verifyToken } from '../utils/token.js'
import { ApiError } from '../utils/apiError.js'

/**
 * Protège une route : exige un JWT Bearer valide et un compte actif.
 */
export async function protect(req, _res, next) {
  try {
    const enTete = req.headers.authorization ?? ''
    const [schema, token] = enTete.split(' ')

    if (schema !== 'Bearer' || !token) {
      throw new ApiError(401, 'Authentification requise')
    }

    const payload = verifyToken(token)

    if (!mongoose.isValidObjectId(payload.id)) {
      throw new ApiError(401, 'Token invalide')
    }

    const user = await User.findById(payload.id)

    if (!user || !user.isActive) {
      throw new ApiError(401, 'Compte introuvable ou désactivé')
    }

    req.user = user
    return next()
  } catch (erreur) {
    if (
      erreur.name === 'JsonWebTokenError' ||
      erreur.name === 'TokenExpiredError'
    ) {
      return next(new ApiError(401, 'Token invalide ou expiré'))
    }

    return next(erreur)
  }
}
