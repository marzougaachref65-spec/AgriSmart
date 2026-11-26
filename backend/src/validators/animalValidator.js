import { body, param, query } from 'express-validator'
import {
  ESPECES_ANIMAL,
  SEXES_ANIMAL,
  STATUTS_ANIMAL,
} from '../models/Animal.js'

const reglesAnimal = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage("Le nom ou numéro d'identification est requis")
    .isLength({ max: 100 })
    .withMessage('Le nom ne peut pas dépasser 100 caractères'),
  body('espece')
    .isIn(ESPECES_ANIMAL)
    .withMessage("L'espèce doit être Bovin, Ovin, Caprin, Volaille ou Autre"),
  body('race')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('La race ne peut pas dépasser 100 caractères'),
  body('sexe')
    .isIn(SEXES_ANIMAL)
    .withMessage('Le sexe doit être Mâle ou Femelle'),
  body('dateNaissance')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Date de naissance invalide')
    .toDate(),
  body('poids')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('Le poids doit être un nombre positif')
    .toFloat(),
  body('statut')
    .optional({ values: 'null' })
    .isIn(STATUTS_ANIMAL)
    .withMessage('Statut invalide'),
  body('dateAcquisition')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage("Date d'acquisition invalide")
    .toDate(),
  body('prixAcquisition')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif')
    .toFloat(),
  body('notes')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Les notes ne peuvent pas dépasser 2000 caractères'),
]

export const createAnimalRules = reglesAnimal
export const updateAnimalRules = reglesAnimal

export const idAnimalRules = [
  param('id').isMongoId().withMessage('Identifiant animal invalide'),
]

export const listAnimalsRules = [
  query('recherche')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La recherche ne peut pas dépasser 100 caractères'),
  query('espece')
    .optional()
    .isIn(ESPECES_ANIMAL)
    .withMessage('Espèce invalide'),
  query('statut')
    .optional()
    .isIn(STATUTS_ANIMAL)
    .withMessage('Statut invalide'),
]
