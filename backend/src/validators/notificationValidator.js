import { body, param, query } from 'express-validator'
import {
  NIVEAUX_NOTIFICATION,
  TYPES_NOTIFICATION,
} from '../utils/notifications.js'

export const idNotificationRules = [
  param('id')
    .isMongoId()
    .withMessage('Identifiant notification invalide'),
]

export const listNotificationsRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier supérieur ou égal à 1')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être comprise entre 1 et 100')
    .toInt(),
  query('lue')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Le filtre de lecture doit être true ou false'),
  query('actif')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Le filtre actif doit être true ou false'),
  query('type')
    .optional()
    .isIn(TYPES_NOTIFICATION)
    .withMessage('Type de notification invalide'),
  query('niveau')
    .optional()
    .isIn(NIVEAUX_NOTIFICATION)
    .withMessage('Niveau de notification invalide'),
  query('recherche')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 150 })
    .withMessage('La recherche ne peut pas dépasser 150 caractères'),
  query('du')
    .optional()
    .isISO8601()
    .withMessage('La date de début doit être valide'),
  query('au')
    .optional()
    .isISO8601()
    .withMessage('La date de fin doit être valide'),
]

export const marquerLueRules = [
  body('lue')
    .optional()
    .isBoolean()
    .withMessage('Le statut de lecture doit être un booléen')
    .toBoolean(),
]
