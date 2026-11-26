import { body, param, query } from 'express-validator'
import { TYPES_CATEGORIE } from '../models/CategorieFinanciere.js'
import {
  TYPES_OPERATION,
  MODES_PAIEMENT,
  STATUTS_PAIEMENT,
  STATUTS_OPERATION,
  DEVISES,
  MODULES_SOURCE,
} from '../models/OperationFinanciere.js'

function commeDate(valeur) {
  if (valeur === undefined || valeur === null || valeur === '') return null
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

function periodeCoherente(debut, fin) {
  const dateDebut = commeDate(debut)
  const dateFin = commeDate(fin)
  return !dateDebut || !dateFin || dateFin.getTime() >= dateDebut.getTime()
}

function troisDecimalesMax(valeur) {
  if (valeur === undefined || valeur === null || valeur === '') return true
  return /^\d+(\.\d{1,3})?$/.test(String(valeur))
}

function refuser(champ, message) {
  return body(champ).not().exists().withMessage(message)
}

export const periodeRules = [
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
      /* Express 5 recalcule req.query : la comparaison doit être null-safe
         et accepter aussi bien une Date qu'une chaîne ISO. */
      if (!periodeCoherente(req.query.debut, valeur)) {
        throw new Error('La date de fin doit être postérieure à la date de début')
      }
      return true
    }),
]

export const paginationRules = [
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

/* ---------------------------- Catégories ---------------------------- */

const reglesCategorie = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Le code de la catégorie est requis')
    .isLength({ max: 100 })
    .withMessage('Le code ne peut pas dépasser 100 caractères')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Le code ne contient que des lettres, chiffres, tirets et underscores'),
  body('libelle')
    .trim()
    .notEmpty()
    .withMessage('Le libellé de la catégorie est requis')
    .isLength({ max: 150 })
    .withMessage('Le libellé ne peut pas dépasser 150 caractères'),
  body('type')
    .isIn(TYPES_CATEGORIE)
    .withMessage('Le type doit être Revenu, Depense ou Les deux'),
  body('description')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La description ne peut pas dépasser 2000 caractères'),
  body('couleur')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 20 })
    .withMessage('La couleur ne peut pas dépasser 20 caractères'),
  refuser(
    'createdBy',
    'Le responsable est attribué automatiquement par le serveur'
  ),
]

export const createCategorieRules = reglesCategorie

export const updateCategorieRules = [
  refuser('code', "Le code d'une catégorie ne peut pas être modifié"),
  ...reglesCategorie.slice(1),
]

export const idCategorieRules = [
  param('id').isMongoId().withMessage('Identifiant catégorie invalide'),
]

export const listCategoriesRules = [
  query('type')
    .optional()
    .isIn(TYPES_CATEGORIE)
    .withMessage('Type de catégorie invalide'),
  query('actif')
    .optional()
    .isBoolean()
    .withMessage("Le filtre actif doit être 'true' ou 'false'"),
  query('recherche')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La recherche ne peut pas dépasser 100 caractères'),
]

/* ---------------------------- Opérations ---------------------------- */

const champsCalculesOperation = [
  ['montantMillimes', 'Le montant en millimes est calculé automatiquement'],
  ['paiements', 'Les paiements sont ajoutés via la route dédiée'],
  ['statutPaiement', 'Le statut de paiement est calculé automatiquement'],
  ['montantPaye', 'Le montant payé est calculé automatiquement'],
  ['montantPayeMillimes', 'Le montant payé est calculé automatiquement'],
  ['statut', 'Le statut est attribué automatiquement'],
  ['annuleLe', "La date d'annulation est enregistrée automatiquement"],
  ['annulePar', "L'auteur de l'annulation est enregistré automatiquement"],
  ['motifAnnulation', 'Le motif est fourni lors de l’annulation'],
  ['journal', 'Le journal est géré automatiquement'],
  ['createdBy', 'Le responsable est attribué automatiquement par le serveur'],
].map(([champ, message]) => refuser(champ, message))

export const createOperationRules = [
  body('type')
    .isIn(TYPES_OPERATION)
    .withMessage('Le type doit être Revenu ou Depense'),
  body('montant')
    .isFloat({ gt: 0 })
    .withMessage('Le montant doit être un nombre supérieur à 0')
    .custom(troisDecimalesMax)
    .withMessage('Le montant ne peut pas avoir plus de 3 décimales'),
  body('devise')
    .optional({ values: 'null' })
    .isIn(DEVISES)
    .withMessage('Devise invalide'),
  body('date')
    .isISO8601()
    .withMessage("Date de l'opération invalide")
    .toDate(),
  body('dateEcheance')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage("Date d'échéance invalide")
    .toDate()
    .custom((valeur, { req }) => {
      const date = commeDate(req.body.date)
      const echeance = commeDate(valeur)
      if (date && echeance && echeance.getTime() < date.getTime()) {
        throw new Error(
          "La date d'échéance ne peut pas précéder la date de l'opération"
        )
      }
      return true
    }),
  body('categorie').isMongoId().withMessage('Catégorie invalide'),
  body('libelle')
    .trim()
    .notEmpty()
    .withMessage('Le libellé est requis')
    .isLength({ max: 150 })
    .withMessage('Le libellé ne peut pas dépasser 150 caractères'),
  body('description')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La description ne peut pas dépasser 2000 caractères'),
  body('reference')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('La référence ne peut pas dépasser 100 caractères')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('La référence ne contient que lettres, chiffres, tirets et underscores'),
  body('source')
    .optional({ values: 'null' })
    .isObject()
    .withMessage('La source doit être un objet'),
  body('source.module')
    .if(body('source').isObject())
    .isIn(MODULES_SOURCE)
    .withMessage('Module source invalide'),
  body('source.referenceId')
    .optional({ values: 'null' })
    .isString()
    .withMessage('La référence source doit être une chaîne')
    .trim()
    .isLength({ max: 100 })
    .withMessage('La référence source ne peut pas dépasser 100 caractères'),
  body('source.libelle')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Le libellé de la source ne peut pas dépasser 150 caractères'),
  body('paiementInitial')
    .optional({ values: 'null' })
    .isObject()
    .withMessage('Le paiement initial doit être un objet'),
  body('paiementInitial.mode')
    .if(body('paiementInitial').isObject())
    .isIn(MODES_PAIEMENT)
    .withMessage('Mode de paiement invalide'),
  body('paiementInitial.montant')
    .if(body('paiementInitial').isObject())
    .isFloat({ gt: 0 })
    .withMessage('Le montant du paiement doit être supérieur à 0')
    .custom(troisDecimalesMax)
    .withMessage('Le montant ne peut pas avoir plus de 3 décimales'),
  body('paiementInitial.note')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('La note ne peut pas dépasser 500 caractères'),
  ...champsCalculesOperation,
]

const champsImmuablesOperation = [
  ['type', 'Le type ne peut pas être modifié'],
  ['montant', 'Le montant ne peut pas être modifié'],
  ['reference', 'La référence ne peut pas être modifiée'],
  ['date', "La date de l'opération ne peut pas être modifiée"],
  ['source', 'La source ne peut pas être modifiée'],
  ['paiements', 'Les paiements sont ajoutés via la route dédiée'],
  ['journal', 'Le journal est géré automatiquement'],
  ['createdBy', 'Le responsable est attribué automatiquement par le serveur'],
  ['statutPaiement', 'Le statut de paiement est calculé automatiquement'],
  ['montantPayeMillimes', 'Le montant payé est calculé automatiquement'],
  ['statut', 'Le statut est géré via la route dédiée'],
  ['annuleLe', "La date d'annulation est enregistrée automatiquement"],
  ['annulePar', "L'auteur de l'annulation est enregistré automatiquement"],
  ['motifAnnulation', 'Le motif est fourni lors de l’annulation'],
].map(([champ, message]) => refuser(champ, message))

export const updateOperationRules = [
  ...champsImmuablesOperation,
  body('libelle')
    .optional({ values: 'null' })
    .trim()
    .notEmpty()
    .withMessage('Le libellé est requis')
    .isLength({ max: 150 })
    .withMessage('Le libellé ne peut pas dépasser 150 caractères'),
  body('description')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La description ne peut pas dépasser 2000 caractères'),
  body('dateEcheance')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage("Date d'échéance invalide")
    .toDate(),
  body('categorie').optional().isMongoId().withMessage('Catégorie invalide'),
]

export const idOperationRules = [
  param('id').isMongoId().withMessage('Identifiant opération invalide'),
]

export const listOperationsRules = [
  query('recherche')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La recherche ne peut pas dépasser 100 caractères'),
  query('type')
    .optional()
    .isIn(TYPES_OPERATION)
    .withMessage('Type invalide'),
  query('categorie').optional().isMongoId().withMessage('Catégorie invalide'),
  query('statutPaiement')
    .optional()
    .isIn(STATUTS_PAIEMENT)
    .withMessage('Statut de paiement invalide'),
  query('statut')
    .optional()
    .isIn(STATUTS_OPERATION)
    .withMessage('Statut invalide'),
  query('modePaiement')
    .optional()
    .isIn(MODES_PAIEMENT)
    .withMessage('Mode de paiement invalide'),
  query('sourceModule')
    .optional()
    .isIn(MODULES_SOURCE)
    .withMessage('Module source invalide'),
  ...periodeRules,
  ...paginationRules,
]

export const createPaiementRules = [
  body('mode')
    .isIn(MODES_PAIEMENT)
    .withMessage('Mode de paiement invalide'),
  body('montant')
    .isFloat({ gt: 0 })
    .withMessage('Le montant doit être supérieur à 0')
    .custom(troisDecimalesMax)
    .withMessage('Le montant ne peut pas avoir plus de 3 décimales'),
  body('note')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('La note ne peut pas dépasser 500 caractères'),
  body('date')
    .optional({ values: 'null' })
    .isISO8601()
    .withMessage('Date du paiement invalide')
    .toDate(),
  refuser('reference', 'La référence du paiement est générée automatiquement'),
  refuser('montantMillimes', 'Le montant en millimes est calculé automatiquement'),
  refuser('createdBy', 'Le responsable est attribué automatiquement par le serveur'),
  refuser('statut', 'Le statut est géré automatiquement'),
]

export const annulerOperationRules = [
  body('motif')
    .trim()
    .notEmpty()
    .withMessage('Le motif d’annulation est requis')
    .isLength({ max: 500 })
    .withMessage('Le motif ne peut pas dépasser 500 caractères'),
]
