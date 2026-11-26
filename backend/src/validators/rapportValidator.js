import { query } from 'express-validator'
import { periodeRules } from './financesValidator.js'

/** Domaines exposés par le module Rapports (un onglet = un domaine). */
export const DOMAINES_RAPPORT = [
  'animaux-cultures',
  'stocks',
  'veterinaire',
  'finances',
  'employes-taches',
]

/** La synthèse est exportable mais n'est pas un onglet autonome. */
export const DOMAINES_EXPORT = [...DOMAINES_RAPPORT, 'synthese']

export const rapportRules = [...periodeRules]

export const exportRules = [
  query('domaine')
    .notEmpty()
    .withMessage('Le domaine est requis')
    .isIn(DOMAINES_EXPORT)
    .withMessage(
      `Le domaine doit être l'un des suivants : ${DOMAINES_EXPORT.join(', ')}`
    ),
  ...periodeRules,
]
