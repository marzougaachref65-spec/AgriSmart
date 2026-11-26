import { body, param, query } from 'express-validator'
import { CATEGORIES_PRODUIT } from '../models/Produit.js'

const reglesCommunes = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom du produit est requis')
    .isLength({ max: 100 })
    .withMessage('Le nom ne peut pas dépasser 100 caractères'),
  body('categorie')
    .isIn(CATEGORIES_PRODUIT)
    .withMessage('Catégorie invalide'),
  body('unite')
    .trim()
    .notEmpty()
    .withMessage("L'unité est requise")
    .isLength({ max: 30 })
    .withMessage("L'unité ne peut pas dépasser 30 caractères"),
  body('prixUnitaire')
    .isFloat({ min: 0 })
    .withMessage('Le prix unitaire doit être un nombre positif ou nul')
    .toFloat(),
  body('fournisseur')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Le fournisseur ne peut pas dépasser 150 caractères'),
  body('seuilMinimum')
    .isFloat({ min: 0 })
    .withMessage('Le seuil minimum doit être un nombre positif ou nul')
    .toFloat(),
  body('dateExpiration')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Date d’expiration invalide')
    .toDate(),
  body('quantiteDisponible')
    .not()
    .exists()
    .withMessage(
      'La quantité ne peut pas être modifiée directement ; utilisez un mouvement de stock'
    ),
]

export const createProduitRules = [
  ...reglesCommunes,
  body('stockInitial')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('Le stock initial doit être un nombre positif ou nul')
    .toFloat(),
]

export const updateProduitRules = [
  ...reglesCommunes,
  body('stockInitial')
    .not()
    .exists()
    .withMessage(
      'Le stock initial ne peut être fourni qu’à la création ; utilisez un mouvement de stock'
    ),
]

export const idProduitRules = [
  param('id').isMongoId().withMessage('Identifiant produit invalide'),
]

export const listProduitsRules = [
  query('recherche')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La recherche ne peut pas dépasser 100 caractères'),
  query('categorie')
    .optional()
    .isIn(CATEGORIES_PRODUIT)
    .withMessage('Catégorie invalide'),
  query('alerte')
    .optional()
    .isIn(['rupture', 'faible', 'proche', 'expire'])
    .withMessage('Type d’alerte invalide'),
]
