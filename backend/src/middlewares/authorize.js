import { ApiError } from '../utils/apiError.js'

/**
 * Vérifie le rôle côté backend. À placer après `protect`.
 */
export function authorize(...rolesAutorises) {
  return (req, _res, next) => {
    if (!req.user || !rolesAutorises.includes(req.user.role)) {
      return next(
        new ApiError(403, 'Accès refusé : permissions insuffisantes')
      )
    }

    return next()
  }
}
