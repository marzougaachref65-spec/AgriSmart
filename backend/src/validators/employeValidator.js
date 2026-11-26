import { body, param, query } from 'express-validator'
import {
  ACTIONS_JOURNAL_EMPLOYE,
  PERIODICITES_SALAIRE,
  STATUTS_EMPLOYE,
} from '../models/Employe.js'

function commeDate(valeur) {
  if (!valeur) return null
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

function periodeCoherente(debut, fin) {
  const dateDebut = commeDate(debut)
  const dateFin = commeDate(fin)
  return !dateDebut || !dateFin || dateFin.getTime() >= dateDebut.getTime()
}

const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier supérieur ou égal à 1')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être un entier compris entre 1 et 100')
    .toInt(),
]

const champsInterdits = [
  body('salaireMillimes')
    .not()
    .exists()
    .withMessage('Le salaire est saisi en TND et converti par le serveur'),
  body('createdBy')
    .not()
    .exists()
    .withMessage('Le responsable est attribué automatiquement par le serveur'),
  body('journal')
    .not()
    .exists()
    .withMessage("L'historique est géré automatiquement par le serveur"),
]

const identiteRules = [
  body('nom')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ max: 100 })
    .withMessage('Le nom ne peut pas dépasser 100 caractères'),
  body('prenoms')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Les prénoms ne peuvent pas dépasser 150 caractères'),
  body('dateNaissance')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('La date de naissance doit être une date ISO valide')
    .toDate(),
  body('cin')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Le CIN ne peut pas dépasser 50 caractères'),
  body('telephone')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 30 })
    .withMessage('Le téléphone ne peut pas dépasser 30 caractères'),
  body('email')
    .optional({ values: 'null' })
    .trim()
    .isEmail()
    .withMessage('Adresse e-mail invalide')
    .normalizeEmail(),
  body('adresse')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 250 })
    .withMessage("L'adresse ne peut pas dépasser 250 caractères"),
  body('fonction')
    .trim()
    .notEmpty()
    .withMessage('La fonction est requise')
    .isLength({ max: 100 })
    .withMessage('La fonction ne peut pas dépasser 100 caractères'),
  body('specialite')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('La spécialité ne peut pas dépasser 100 caractères'),
]

const salaireRules = [
  body('salaire')
    .isFloat({ min: 0 })
    .withMessage('Le salaire doit être un nombre positif ou nul')
    .toFloat(),
  body('periodiciteSalaire')
    .optional({ values: 'null' })
    .isIn(PERIODICITES_SALAIRE)
    .withMessage('Périodicité de salaire invalide'),
]

const dateRules = [
  body('dateRecrutement')
    .isISO8601()
    .withMessage('La date de recrutement doit être une date ISO valide')
    .toDate(),
  body('dateFin')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('La date de fin doit être une date ISO valide')
    .toDate(),
  body('dateFin').custom((valeur, { req }) =>
    periodeCoherente(req.body.dateRecrutement, valeur)
      ? true
      : Promise.reject(
          new Error('La date de fin ne peut pas précéder la date de recrutement')
        )
  ),
]

const compteRules = [
  body('utilisateur')
    .optional({ values: 'null' })
    .isMongoId()
    .withMessage('Compte utilisateur invalide'),
]

export const createEmployeRules = [
  ...identiteRules,
  ...salaireRules,
  ...dateRules,
  ...compteRules,
  body('statut')
    .optional({ values: 'null' })
    .isIn(STATUTS_EMPLOYE)
    .withMessage('Statut employé invalide'),
  body('notes')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Les notes ne peuvent pas dépasser 2000 caractères'),
  ...champsInterdits,
]

const champsTexteOptionnels = [
  'prenoms',
  'cin',
  'telephone',
  'specialite',
].map((champ) =>
  body(champ)
    .optional({ values: 'null' })
    .trim()
    .isLength({
      max: champ === 'telephone' ? 30 : champ === 'cin' ? 50 : 150,
    })
    .withMessage(`Le champ ${champ} est trop long`)
)

export const updateEmployeRules = [
  body('nom')
    .optional({ values: 'null' })
    .trim()
    .notEmpty()
    .withMessage('Le nom ne peut pas être vide')
    .isLength({ max: 100 })
    .withMessage('Le nom ne peut pas dépasser 100 caractères'),
  ...champsTexteOptionnels,
  body('dateNaissance')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('La date de naissance doit être une date ISO valide')
    .toDate(),
  body('email')
    .optional({ values: 'null' })
    .trim()
    .isEmail()
    .withMessage('Adresse e-mail invalide')
    .normalizeEmail(),
  body('adresse')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 250 })
    .withMessage("L'adresse ne peut pas dépasser 250 caractères"),
  body('fonction')
    .optional({ values: 'null' })
    .trim()
    .notEmpty()
    .withMessage('La fonction ne peut pas être vide')
    .isLength({ max: 100 })
    .withMessage('La fonction ne peut pas dépasser 100 caractères'),
  body('salaire')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('Le salaire doit être un nombre positif ou nul')
    .toFloat(),
  body('periodiciteSalaire')
    .optional({ values: 'null' })
    .isIn(PERIODICITES_SALAIRE)
    .withMessage('Périodicité de salaire invalide'),
  body('dateRecrutement')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('La date de recrutement doit être une date ISO valide')
    .toDate(),
  body('dateFin')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('La date de fin doit être une date ISO valide')
    .toDate(),
  body('dateFin').custom((valeur, { req }) =>
    periodeCoherente(req.body.dateRecrutement, valeur)
      ? true
      : Promise.reject(
          new Error('La date de fin ne peut pas précéder la date de recrutement')
        )
  ),
  ...compteRules,
  body('statut')
    .optional({ values: 'null' })
    .isIn(STATUTS_EMPLOYE)
    .withMessage('Statut employé invalide'),
  body('notes')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Les notes ne peuvent pas dépasser 2000 caractères'),
  ...champsInterdits,
]

export const desactiverEmployeRules = [
  body('dateFin')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('La date de fin doit être une date ISO valide')
    .toDate(),
]

export const idEmployeRules = [
  param('id').isMongoId().withMessage('Identifiant employé invalide'),
]

export const listEmployesRules = [
  query('recherche')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La recherche ne peut pas dépasser 100 caractères'),
  query('statut')
    .optional()
    .isIn(STATUTS_EMPLOYE)
    .withMessage('Statut employé invalide'),
  query('fonction')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La fonction ne peut pas dépasser 100 caractères'),
  ...paginationRules,
]

export const historiqueEmployesRules = [
  query('employe')
    .optional()
    .isMongoId()
    .withMessage('Identifiant employé invalide'),
  query('action')
    .optional()
    .isIn(ACTIONS_JOURNAL_EMPLOYE)
    .withMessage('Type d’action invalide'),
  query('debut')
    .optional()
    .isISO8601()
    .withMessage('La date de début doit être une date ISO valide'),
  query('fin')
    .optional()
    .isISO8601()
    .withMessage('La date de fin doit être une date ISO valide'),
  query('debut')
    .optional()
    .custom((valeur, { req }) =>
      !valeur || !req.query.fin || new Date(valeur) <= new Date(req.query.fin)
    )
    .withMessage('La date de début ne peut pas être postérieure à la date de fin'),
]

export const nombreEmployesRules = []
