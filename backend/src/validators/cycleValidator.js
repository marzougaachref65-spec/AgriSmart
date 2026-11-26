import { body, param, query } from 'express-validator'
import { STATUTS_CYCLE } from '../models/CycleCulture.js'

/** Normalise une valeur ISO ou un Date déjà sanitizer en objet Date. */
function commeDate(valeur) {
  if (valeur instanceof Date) return valeur
  if (!valeur) return null
  const date = new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

function estRenseigne(valeur) {
  return valeur !== null && valeur !== undefined && valeur !== ''
}

const reglesCycle = [
  body('parcelle')
    .isMongoId()
    .withMessage('La parcelle associée est invalide'),
  body('typeCulture')
    .trim()
    .notEmpty()
    .withMessage('Le type de culture est requis')
    .isLength({ max: 100 })
    .withMessage('Le type de culture ne peut pas dépasser 100 caractères'),
  body('variete')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('La variété ne peut pas dépasser 100 caractères'),
  body('dateSemis')
    .isISO8601()
    .withMessage('Date de semis invalide')
    .toDate(),
  body('datePrevueRecolte')
    .isISO8601()
    .withMessage('Date prévue de récolte invalide')
    .toDate()
    .custom((valeur, { req }) => {
      const semis = commeDate(req.body.dateSemis)
      const prevue = commeDate(valeur)
      if (
        semis &&
        prevue &&
        prevue.getTime() < semis.getTime()
      ) {
        throw new Error(
          'La date prévue de récolte doit être postérieure ou égale à la date de semis'
        )
      }
      return true
    }),
  body('dateRecolteReelle')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Date réelle de récolte invalide')
    .toDate()
    .custom((valeur, { req }) => {
      const semis = commeDate(req.body.dateSemis)
      const reelle = commeDate(valeur)
      if (semis && reelle && reelle.getTime() < semis.getTime()) {
        throw new Error(
          'La date réelle de récolte doit être postérieure ou égale à la date de semis'
        )
      }
      return true
    }),
  body('quantiteRecoltee')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('La quantité récoltée doit être un nombre positif ou nul')
    .toFloat(),
  body('statut')
    .isIn(STATUTS_CYCLE)
    .withMessage('Statut invalide')
    .custom((valeur, { req }) => {
      const aDateRecolte = estRenseigne(req.body.dateRecolteReelle)
      const aQuantite = estRenseigne(req.body.quantiteRecoltee)

      if (valeur === 'Récoltée') {
        if (!aDateRecolte) {
          throw new Error(
            'Une date de récolte réelle est requise pour un cycle récolté'
          )
        }
        if (!aQuantite) {
          throw new Error(
            'Une quantité récoltée est requise pour un cycle récolté'
          )
        }
        return true
      }

      if (aDateRecolte || aQuantite) {
        throw new Error(
          'La date et la quantité de récolte ne sont autorisées que pour un cycle récolté'
        )
      }
      return true
    }),
  body('notes')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Les notes ne peuvent pas dépasser 2000 caractères'),
]

export const createCycleRules = reglesCycle
export const updateCycleRules = reglesCycle

export const idCycleRules = [
  param('id').isMongoId().withMessage('Identifiant cycle invalide'),
]

export const listCyclesRules = [
  query('recherche')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La recherche ne peut pas dépasser 100 caractères'),
  query('parcelle')
    .optional()
    .isMongoId()
    .withMessage('Parcelle invalide'),
  query('culture')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La culture ne peut pas dépasser 100 caractères'),
  query('statut')
    .optional()
    .isIn(STATUTS_CYCLE)
    .withMessage('Statut invalide'),
]
