import { body, param, query } from 'express-validator'
import {
  NATURES_CONSULTATION,
  GRAVITES_MALADIE,
  STATUTS_MALADIE,
  STATUTS_TRAITEMENT,
  TYPES_EVENEMENT,
} from '../models/EvenementVeterinaire.js'
import {
  STATUTS_RAPPEL,
  TYPES_RAPPEL,
} from '../models/RappelSoin.js'

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

const periodeRules = [
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
      if (!periodeCoherente(req.query.debut, valeur)) {
        throw new Error('La date de fin doit être postérieure à la date de début')
      }
      return true
    }),
]

/* ---------------------------- Dossiers ---------------------------- */

const reglesDossier = [
  body('animal').isMongoId().withMessage("L'animal associé est invalide"),
  body('notesGenerales')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Les notes ne peuvent pas dépasser 2000 caractères'),
  body('allergies')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Les allergies ne peuvent pas dépasser 2000 caractères'),
  body('antecedents')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Les antécédents ne peuvent pas dépasser 2000 caractères'),
  body('veterinaireReferent')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Le vétérinaire référent ne peut pas dépasser 150 caractères'),
  body('createdBy')
    .not()
    .exists()
    .withMessage('Le responsable est attribué automatiquement par le serveur'),
]

export const createDossierRules = reglesDossier

export const updateDossierRules = [
  body('animal')
    .not()
    .exists()
    .withMessage("L'animal d'un dossier ne peut pas être modifié"),
  ...reglesDossier.slice(1),
]

export const idDossierRules = [
  param('id').isMongoId().withMessage('Identifiant dossier invalide'),
]

export const idAnimalParamRules = [
  param('animalId').isMongoId().withMessage('Identifiant animal invalide'),
]

export const listDossiersRules = [
  query('recherche')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La recherche ne peut pas dépasser 100 caractères'),
]

/* --------------------------- Événements --------------------------- */

export const createEvenementRules = [
  body('animal').isMongoId().withMessage("L'animal associé est invalide"),
  body('type')
    .isIn(TYPES_EVENEMENT)
    .withMessage('Le type doit être Vaccination, Maladie, Traitement ou Consultation'),
  body('date')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Date de l’événement invalide')
    .toDate(),
  body('libelle')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Le libellé ne peut pas dépasser 150 caractères'),
  body('notes')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Les notes ne peuvent pas dépasser 2000 caractères'),
  body('reference')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('La référence ne peut pas dépasser 100 caractères')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('La référence ne contient que lettres, chiffres, tirets et underscores'),

  /* Vaccination */
  body('vaccin')
    .if(body('type').equals('Vaccination'))
    .trim()
    .notEmpty()
    .withMessage('Le nom du vaccin est requis pour une vaccination')
    .isLength({ max: 150 })
    .withMessage('Le nom du vaccin ne peut pas dépasser 150 caractères'),
  body('lot')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le lot ne peut pas dépasser 100 caractères'),
  body('dateRappel')
    .if(body('type').equals('Vaccination'))
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Date de rappel invalide')
    .toDate()
    .custom((valeur, { req }) => {
      const date = commeDate(req.body.date)
      const rappel = commeDate(valeur)
      if (date && rappel && rappel.getTime() < date.getTime()) {
        throw new Error('La date de rappel ne peut pas précéder la date de vaccination')
      }
      return true
    }),

  /* Maladie */
  body('nomMaladie')
    .if(body('type').equals('Maladie'))
    .trim()
    .notEmpty()
    .withMessage('Le nom de la maladie est requis')
    .isLength({ max: 150 })
    .withMessage('Le nom de la maladie ne peut pas dépasser 150 caractères'),
  body('diagnostic')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Le diagnostic ne peut pas dépasser 2000 caractères'),
  body('gravite')
    .if(body('type').equals('Maladie'))
    .isIn(GRAVITES_MALADIE)
    .withMessage('Gravité invalide'),
  body('statutMaladie')
    .if(body('type').equals('Maladie'))
    .isIn(STATUTS_MALADIE)
    .withMessage('Statut de maladie invalide'),
  body('dateDebut')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Date de début invalide')
    .toDate(),
  body('dateFin')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Date de fin invalide')
    .toDate()
    .custom((valeur, { req }) => {
      const debut = commeDate(req.body.dateDebut)
      const fin = commeDate(valeur)
      if (debut && fin && fin.getTime() < debut.getTime()) {
        throw new Error('La date de fin doit être postérieure à la date de début')
      }
      return true
    }),

  /* Traitement */
  body('medicament')
    .if(body('type').equals('Traitement'))
    .trim()
    .notEmpty()
    .withMessage('Le médicament est requis pour un traitement')
    .isLength({ max: 150 })
    .withMessage('Le médicament ne peut pas dépasser 150 caractères'),
  body('posologie')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('La posologie ne peut pas dépasser 500 caractères'),
  body('dose')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('La dose doit être un nombre positif ou nul')
    .toFloat(),
  body('motif')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Le motif ne peut pas dépasser 500 caractères'),
  body('prescripteur')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Le prescripteur ne peut pas dépasser 150 caractères'),
  body('statutTraitement')
    .if(body('type').equals('Traitement'))
    .isIn(STATUTS_TRAITEMENT)
    .withMessage('Statut de traitement invalide'),

  /* Consultation / intervention */
  body('nature')
    .if(body('type').equals('Consultation'))
    .isIn(NATURES_CONSULTATION)
    .withMessage('Nature de consultation invalide'),
  body('veterinaire')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Le vétérinaire ne peut pas dépasser 150 caractères'),
  body('cout')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('Le coût doit être un nombre positif ou nul')
    .toFloat(),

  body('dossier')
    .not()
    .exists()
    .withMessage('Le dossier est déterminé automatiquement depuis l’animal'),
  body('createdBy')
    .not()
    .exists()
    .withMessage('Le responsable est attribué automatiquement par le serveur'),
]

export const idEvenementRules = [
  param('id').isMongoId().withMessage('Identifiant événement invalide'),
]

export const listEvenementsRules = [
  query('recherche')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La recherche ne peut pas dépasser 100 caractères'),
  query('animal').optional().isMongoId().withMessage('Animal invalide'),
  query('type').optional().isIn(TYPES_EVENEMENT).withMessage('Type invalide'),
  ...periodeRules,
  ...paginationRules,
]

/* ----------------------------- Rappels ---------------------------- */

export const createRappelRules = [
  body('animal').isMongoId().withMessage("L'animal associé est invalide"),
  body('type').isIn(TYPES_RAPPEL).withMessage('Type de rappel invalide'),
  body('titre')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Le titre ne peut pas dépasser 150 caractères'),
  body('datePrevue')
    .isISO8601()
    .withMessage('Date prévue invalide')
    .toDate(),
  body('notes')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Les notes ne peuvent pas dépasser 2000 caractères'),
  body('statut')
    .not()
    .exists()
    .withMessage('Un rappel est créé au statut Planifié'),
  body('dossier')
    .not()
    .exists()
    .withMessage('Le dossier est déterminé automatiquement depuis l’animal'),
  body('createdBy')
    .not()
    .exists()
    .withMessage('Le responsable est attribué automatiquement par le serveur'),
]

export const updateRappelRules = [
  body('datePrevue')
    .optional()
    .isISO8601()
    .withMessage('Date prévue invalide')
    .toDate(),
  body('statut')
    .optional()
    .isIn(STATUTS_RAPPEL)
    .withMessage('Statut de rappel invalide'),
  body('notes')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Les notes ne peuvent pas dépasser 2000 caractères'),
  body('animal')
    .not()
    .exists()
    .withMessage("L'animal d'un rappel ne peut pas être modifié"),
  body('dateRealisation')
    .not()
    .exists()
    .withMessage('La date de réalisation est enregistrée automatiquement'),
  body('createdBy')
    .not()
    .exists()
    .withMessage('Le responsable est attribué automatiquement par le serveur'),
]

export const idRappelRules = [
  param('id').isMongoId().withMessage('Identifiant rappel invalide'),
]

export const listRappelsRules = [
  query('recherche')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La recherche ne peut pas dépasser 100 caractères'),
  query('animal').optional().isMongoId().withMessage('Animal invalide'),
  query('statut').optional().isIn(STATUTS_RAPPEL).withMessage('Statut invalide'),
  query('type').optional().isIn(TYPES_RAPPEL).withMessage('Type de rappel invalide'),
  ...periodeRules,
  ...paginationRules,
]

/* ---------------------- Calendrier / alertes --------------------- */

export const calendrierRules = [...periodeRules]

export const alertesRules = [
  query('jours')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Le délai doit être un entier compris entre 1 et 365 jours')
    .toInt(),
]

export { periodeRules, paginationRules }
