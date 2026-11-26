import { body, param, query } from 'express-validator'
import {
  MOTIFS_ENTREE,
  MOTIFS_MOUVEMENT,
  MOTIFS_SORTIE,
  STATUTS_MOUVEMENT,
  TYPES_MOUVEMENT,
} from '../models/MouvementStock.js'

const motifsParType = {
  Entrée: MOTIFS_ENTREE,
  Sortie: MOTIFS_SORTIE,
}

export const createMouvementRules = [
  body('produit')
    .isMongoId()
    .withMessage('Le produit concerné est invalide'),
  body('type')
    .isIn(TYPES_MOUVEMENT)
    .withMessage('Le type doit être Entrée ou Sortie'),
  body('motif')
    .isIn(MOTIFS_MOUVEMENT)
    .withMessage('Motif invalide')
    .custom((valeur, { req }) => {
      const liste = motifsParType[req.body.type]
      if (liste && !liste.includes(valeur)) {
        throw new Error(
          `Le motif « ${valeur} » n’est pas valide pour une ${req.body.type}`
        )
      }
      return true
    }),
  body('quantite')
    .isFloat({ gt: 0 })
    .withMessage('La quantité doit être un nombre supérieur à 0')
    .toFloat(),
  body('date')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Date du mouvement invalide')
    .toDate(),
  body('utilisateur')
    .not()
    .exists()
    .withMessage(
      'L’utilisateur responsable est attribué automatiquement par le serveur'
    ),
  body('reference')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('La référence ne peut pas dépasser 100 caractères')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('La référence ne contient que lettres, chiffres, tirets et underscores'),
  body('parcelle')
    .optional({ values: 'null' })
    .isMongoId()
    .withMessage('Parcelle invalide'),
  body('cycleCulture')
    .optional({ values: 'null' })
    .isMongoId()
    .withMessage('Cycle de culture invalide'),
  body('animal')
    .optional({ values: 'null' })
    .isMongoId()
    .withMessage('Animal invalide'),
  body('notes')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Les notes ne peuvent pas dépasser 2000 caractères'),
]

export const idMouvementRules = [
  param('id').isMongoId().withMessage('Identifiant mouvement invalide'),
]

function commeDate(valeur) {
  if (valeur instanceof Date) return valeur
  if (!valeur) return null
  const date = new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

export const listMouvementsRules = [
  query('recherche')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La recherche ne peut pas dépasser 100 caractères'),
  query('produit').optional().isMongoId().withMessage('Produit invalide'),
  query('type').optional().isIn(TYPES_MOUVEMENT).withMessage('Type invalide'),
  query('motif')
    .optional()
    .isIn(MOTIFS_MOUVEMENT)
    .withMessage('Motif invalide'),
  query('statut')
    .optional()
    .isIn(STATUTS_MOUVEMENT)
    .withMessage('Statut invalide'),
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
