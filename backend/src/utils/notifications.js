/** Constantes et formatage uniforme des notifications internes AgriSmart. */
import { formaterMillimesDT } from './refsFinancieres.js'

export const TYPES_NOTIFICATION = [
  'TACHE_NOUVELLE',
  'TACHE_AFFECTATION',
  'TACHE_ECHEANCE_PROCHE',
  'TACHE_RETARD',
  'VACCINATION_RAPPEL',
  'TRAITEMENT',
  'SOIN',
  'STOCK_FAIBLE',
  'STOCK_RUPTURE',
  'STOCK_EXPIRATION',
  'FINANCE_IMPAYEE',
  'FINANCE_ECHEANCE_PROCHE',
  'FINANCE_ECHEANCE_DEPASSEE',
]

/** Types strictement réservés à ADMIN / MANAGER. */
export const TYPES_FINANCIERS = [
  'FINANCE_IMPAYEE',
  'FINANCE_ECHEANCE_PROCHE',
  'FINANCE_ECHEANCE_DEPASSEE',
]

export const NIVEAUX_NOTIFICATION = ['Info', 'Avertissement', 'Urgent']
export const MODULES_NOTIFICATION = [
  'Taches',
  'Veterinaire',
  'Stocks',
  'Finances',
  'Systeme',
]
export const GENRES_NOTIFICATION = ['evenement', 'etat']

export const LIBELLES_TYPES_NOTIFICATION = {
  TACHE_NOUVELLE: 'Nouvelle tâche',
  TACHE_AFFECTATION: "Changement d'affectation",
  TACHE_ECHEANCE_PROCHE: 'Échéance proche',
  TACHE_RETARD: 'Tâche en retard',
  VACCINATION_RAPPEL: 'Rappel de vaccination',
  TRAITEMENT: 'Traitement en cours',
  SOIN: 'Soin à venir',
  STOCK_FAIBLE: 'Stock faible',
  STOCK_RUPTURE: 'Rupture de stock',
  STOCK_EXPIRATION: 'Expiration de produit',
  FINANCE_IMPAYEE: 'Opération impayée',
  FINANCE_ECHEANCE_PROCHE: 'Échéance financière proche',
  FINANCE_ECHEANCE_DEPASSEE: 'Échéance financière dépassée',
}

export const LIBELLES_NIVEAUX_NOTIFICATION = {
  Info: 'Information',
  Avertissement: 'Avertissement',
  Urgent: 'Urgent',
}

export const TONS_NOTIFICATION = {
  Info: 'info',
  Avertissement: 'warning',
  Urgent: 'danger',
}

export function estTypeFinancier(type) {
  return TYPES_FINANCIERS.includes(type)
}

function enObjet(brut) {
  if (!brut) return null
  return brut && typeof brut.toJSON === 'function' && !Array.isArray(brut)
    ? brut.toJSON()
    : brut
}

/**
 * Sortie API stable d'une notification. Les montants financiers ne sont
 * exposés qu'à ADMIN / MANAGER, y compris si un document incohérent existe.
 */
export function formaterNotification(brut, utilisateur = null) {
  const source = enObjet(brut)
  if (!source) return null

  const { _id, __v, montantMillimes, ...reste } = source
  const type = reste.type ?? ''
  const financier = estTypeFinancier(type)
  const peutVoirMontant =
    financier && ['ADMIN', 'MANAGER'].includes(utilisateur?.role)

  const sortie = {
    ...reste,
    id: _id ? _id.toString() : reste.id,
    libelleType: LIBELLES_TYPES_NOTIFICATION[type] ?? type,
    libelleNiveau: LIBELLES_NIVEAUX_NOTIFICATION[reste.niveau] ?? reste.niveau,
    ton: TONS_NOTIFICATION[reste.niveau] ?? 'neutral',
  }

  if (financier && !peutVoirMontant) {
    /* Défense en profondeur : même une donnée financière injectée en base
       ne doit jamais être restituée à un compte EMPLOYEE. */
    sortie.titre = 'Notification financière'
    sortie.message = 'Cette notification est réservée à l’encadrement.'
    sortie.source = null
    sortie.dateEvenement = null
  }

  if (peutVoirMontant && Number.isFinite(Number(montantMillimes))) {
    sortie.montantMillimes = Number(montantMillimes)
    sortie.montant = formaterMillimesDT(montantMillimes)
  }

  return sortie
}
