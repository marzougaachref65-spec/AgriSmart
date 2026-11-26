import { body, param, query } from 'express-validator'
import { STATUTS_PARCELLE } from '../models/Parcelle.js'

const reglesParcelle = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage("Le nom de la parcelle est requis")
    .isLength({ max: 100 })
    .withMessage('Le nom ne peut pas dépasser 100 caractères'),
  body('superficie')
    .isFloat({ gt: 0 })
    .withMessage('La superficie doit être un nombre supérieur à 0')
    .toFloat(),
  body('localisation')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 150 })
    .withMessage('La localisation ne peut pas dépasser 150 caractères'),
  body('typeSol')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le type de sol ne peut pas dépasser 100 caractères'),
  body('systemeIrrigation')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Le système d'irrigation ne peut pas dépasser 100 caractères"),
  body('statut')
    .optional({ values: 'null' })
    .isIn(STATUTS_PARCELLE)
    .withMessage('Statut invalide'),
  body('notes')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Les notes ne peuvent pas dépasser 2000 caractères'),
]

export const createParcelleRules = reglesParcelle
export const updateParcelleRules = reglesParcelle

export const idParcelleRules = [
  param('id').isMongoId().withMessage('Identifiant parcelle invalide'),
]

export const listParcellesRules = [
  query('recherche')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La recherche ne peut pas dépasser 100 caractères'),
  query('statut')
    .optional()
    .isIn(STATUTS_PARCELLE)
    .withMessage('Statut invalide'),
  query('typeSol')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le type de sol ne peut pas dépasser 100 caractères'),
]
