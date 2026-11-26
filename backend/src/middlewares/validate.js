import { validationResult } from 'express-validator'
import { ApiError } from '../utils/apiError.js'

/**
 * Renvoie une erreur 400 contenant tous les messages de validation.
 */
export function validate(req, _res, next) {
  const resultat = validationResult(req)

  if (resultat.isEmpty()) return next()

  const messages = resultat.array().map((erreur) => erreur.msg)
  return next(new ApiError(400, messages.join(' | ')))
}
