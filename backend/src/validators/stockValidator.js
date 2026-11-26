import { query } from 'express-validator'

function commeDate(valeur) {
  if (valeur instanceof Date) return valeur
  if (!valeur) return null
  const date = new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

export const statistiquesRules = [
  query('debut')
    .optional()
    .isISO8601()
    .withMessage('Date de début invalide')
    .toDate(),
  query('fin')
    .optional()
    .isISO8601()
    .withMessage('Date de fin invalide')
    .toDate()
    .custom((valeur, { req }) => {
      const debut = commeDate(req.query.debut)
      const fin = commeDate(valeur)
      if (debut && fin && fin.getTime() < debut.getTime()) {
        throw new Error('La date de fin doit être postérieure à la date de début')
      }
      return true
    }),
]
