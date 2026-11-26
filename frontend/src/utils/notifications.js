/** Libellés français et helpers d'affichage du module Notifications. */

export const LIBELLES_TYPES = {
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

export const LIBELLES_NIVEAUX = {
  Info: 'Information',
  Avertissement: 'Avertissement',
  Urgent: 'Urgent',
}

export const TYPES_PAR_MODULE = {
  Taches: [
    'TACHE_NOUVELLE',
    'TACHE_AFFECTATION',
    'TACHE_ECHEANCE_PROCHE',
    'TACHE_RETARD',
  ],
  Veterinaire: ['VACCINATION_RAPPEL', 'TRAITEMENT', 'SOIN'],
  Stocks: ['STOCK_FAIBLE', 'STOCK_RUPTURE', 'STOCK_EXPIRATION'],
  Finances: [
    'FINANCE_IMPAYEE',
    'FINANCE_ECHEANCE_PROCHE',
    'FINANCE_ECHEANCE_DEPASSEE',
  ],
}

export const TYPES_FINANCIERS = TYPES_PAR_MODULE.Finances

export function libelleType(type) {
  return LIBELLES_TYPES[type] ?? type ?? 'Notification'
}

export function libelleNiveau(niveau) {
  return LIBELLES_NIVEAUX[niveau] ?? niveau ?? 'Information'
}

export function tonNiveau(niveau) {
  if (niveau === 'Urgent') return 'danger'
  if (niveau === 'Avertissement') return 'warning'
  return 'info'
}

export function formatDateFr(valeur) {
  if (!valeur) return '—'
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateHeureFr(valeur) {
  if (!valeur) return '—'
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Date YYYY-MM-DD attendue par les champs <input type="date">. */
export function datePourInput(valeur) {
  if (!valeur) return ''
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}
