import { body, param, query } from 'express-validator'
import {
  MODULES_CIBLE,
  PRIORITES_TACHE,
  STATUTS_TACHE,
} from '../models/Tache.js'

function commeDate(valeur) {
  if (!valeur) return null
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

function periodeCoherente(debut, echeance) {
  const dateDebut = commeDate(debut)
  const dateEcheance = commeDate(echeance)
  return (
    !dateDebut ||
    !dateEcheance ||
    dateEcheance.getTime() >= dateDebut.getTime()
  )
}

function motifRequisSiAnnulee(valeur, { req }) {
  const statut = req.body.statut
  if (statut === 'Annulée' && !String(valeur ?? '').trim()) {
    return Promise.reject(new Error('Le motif est requis pour annuler une tâche'))
  }
  return true
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
  body('reference')
    .not()
    .exists()
    .withMessage('La référence est générée automatiquement par le serveur'),
  body('dateRealisation')
    .not()
    .exists()
    .withMessage('La date de réalisation est gérée automatiquement par le serveur'),
  body('createdBy')
    .not()
    .exists()
    .withMessage('Le responsable est attribué automatiquement par le serveur'),
  body('journal')
    .not()
    .exists()
    .withMessage("L'historique est géré automatiquement par le serveur"),
]

const cibleRules = [
  body('cible.module')
    .optional({ values: 'null' })
    .isIn(MODULES_CIBLE)
    .withMessage('Module cible invalide'),
  body('cible.referenceId')
    .optional({ values: 'null' })
    .isMongoId()
    .withMessage('Référence de cible invalide'),
  body('cible.referenceId').custom((valeur, { req }) => {
    const module = req.body?.cible?.module
    if (module && module !== 'Autre' && !valeur) {
      return Promise.reject(
        new Error('La référence est requise pour la cible choisie')
      )
    }
    return true
  }),
]

export const createTacheRules = [
  body('titre')
    .trim()
    .notEmpty()
    .withMessage('Le titre est requis')
    .isLength({ max: 150 })
    .withMessage('Le titre ne peut pas dépasser 150 caractères'),
  body('description')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La description ne peut pas dépasser 2000 caractères'),
  body('priorite')
    .optional({ values: 'null' })
    .isIn(PRIORITES_TACHE)
    .withMessage('Priorité invalide'),
  body('statut')
    .optional({ values: 'null' })
    .isIn(STATUTS_TACHE)
    .withMessage('Statut de tâche invalide'),
  body('dateDebut')
    .isISO8601()
    .withMessage('La date de début doit être une date ISO valide')
    .toDate(),
  body('dateEcheance')
    .isISO8601()
    .withMessage("La date d'échéance doit être une date ISO valide")
    .toDate(),
  body('dateEcheance')
    .custom((valeur, { req }) =>
      periodeCoherente(req.body.dateDebut, valeur)
        ? true
        : Promise.reject(
            new Error("La date d'échéance ne peut pas précéder la date de début")
          )
    ),
  body('employes')
    .optional({ values: 'null' })
    .isArray()
    .withMessage('Les employés doivent être une liste'),
  body('employes.*').isMongoId().withMessage('Identifiant employé invalide'),
  ...cibleRules,
  body('motifAnnulation')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Le motif ne peut pas dépasser 500 caractères')
    .custom(motifRequisSiAnnulee),
  ...champsInterdits,
]

export const updateTacheRules = [
  body('titre')
    .optional({ values: 'null' })
    .trim()
    .notEmpty()
    .withMessage('Le titre ne peut pas être vide')
    .isLength({ max: 150 })
    .withMessage('Le titre ne peut pas dépasser 150 caractères'),
  body('description')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La description ne peut pas dépasser 2000 caractères'),
  body('priorite')
    .optional({ values: 'null' })
    .isIn(PRIORITES_TACHE)
    .withMessage('Priorité invalide'),
  body('statut')
    .optional({ values: 'null' })
    .isIn(STATUTS_TACHE)
    .withMessage('Statut de tâche invalide'),
  body('dateDebut')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('La date de début doit être une date ISO valide')
    .toDate(),
  body('dateEcheance')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage("La date d'échéance doit être une date ISO valide")
    .toDate(),
  ...cibleRules,
  body('employes')
    .optional({ values: 'null' })
    .isArray()
    .withMessage('Les employés doivent être une liste'),
  body('employes.*').isMongoId().withMessage('Identifiant employé invalide'),
  body('motifAnnulation')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Le motif ne peut pas dépasser 500 caractères')
    .custom(motifRequisSiAnnulee),
  ...champsInterdits,
]

export const changerStatutTacheRules = [
  body('statut')
    .isIn(STATUTS_TACHE)
    .withMessage('Statut de tâche invalide'),
  body('motifAnnulation')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Le motif ne peut pas dépasser 500 caractères')
    .custom(motifRequisSiAnnulee),
  ...champsInterdits,
]

export const annulerTacheRules = [
  body('motifAnnulation')
    .trim()
    .notEmpty()
    .withMessage('Le motif est requis pour annuler une tâche')
    .isLength({ max: 500 })
    .withMessage('Le motif ne peut pas dépasser 500 caractères'),
  ...champsInterdits,
]

export const idTacheRules = [
  param('id').isMongoId().withMessage('Identifiant tâche invalide'),
]

export const listTachesRules = [
  query('recherche')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La recherche ne peut pas dépasser 100 caractères'),
  query('statut')
    .optional()
    .isIn(STATUTS_TACHE)
    .withMessage('Statut de tâche invalide'),
  query('priorite')
    .optional()
    .isIn(PRIORITES_TACHE)
    .withMessage('Priorité invalide'),
  query('employe').optional().isMongoId().withMessage('Employé invalide'),
  query('module')
    .optional()
    .isIn(MODULES_CIBLE)
    .withMessage('Module cible invalide'),
  query('debut')
    .optional()
    .isISO8601()
    .withMessage('La date de début doit être une date ISO valide'),
  query('fin')
    .optional()
    .isISO8601()
    .withMessage('La date de fin doit être une date ISO valide'),
  query('enRetard')
    .optional()
    .isBoolean()
    .withMessage('Le filtre retard doit être vrai ou faux'),
  ...paginationRules,
]
