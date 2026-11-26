import { formatMontantTND, millimesVersTexte } from './finances.js'

export const STATUTS_EMPLOYE = ['Actif', 'Inactif']
export const PERIODICITES_SALAIRE = ['Mensuel', 'Journalier', 'Horaire']

export const TONS_STATUT_EMPLOYE = {
  Actif: 'success',
  Inactif: 'neutral',
}

export const LIBELLES_PERIODICITE = {
  Mensuel: 'Mensuel',
  Journalier: 'Journalier',
  Horaire: 'Horaire',
}

export const LIBELLES_ACTION_EMPLOYE = {
  CREATION: 'Création de la fiche',
  MODIFICATION: 'Modification de la fiche',
  CHANGEMENT_STATUT: 'Changement de statut',
  AFFECTATION_COMPTE: 'Compte utilisateur associé',
}

const formateurDate = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const formateurDateHeure = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const formateurNombre = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatDate(valeur) {
  if (!valeur) return '—'
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) return '—'
  return formateurDate.format(date)
}

export function formatDateHeure(valeur) {
  if (!valeur) return '—'
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) return '—'
  return formateurDateHeure.format(date)
}

export function formatNombre(valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return '—'
  const nombre = Number(valeur)
  if (Number.isNaN(nombre)) return '—'
  return formateurNombre.format(nombre)
}

export { formatMontantTND }

/** Montant salarial lisible, avec sa périodicité. */
export function formatSalaire(employe) {
  if (!employe || employe.salaireMillimes === undefined) return '—'
  const texte = millimesVersTexte(employe.salaireMillimes)
  if (texte === null) return '—'
  const suffixes = {
    Mensuel: ' / mois',
    Journalier: ' / jour',
    Horaire: ' / heure',
  }
  return `${texte} DT${suffixes[employe.periodiciteSalaire] ?? ' / mois'}`
}

/** Transforme une valeur de champ vide en `null` pour l'API. */
export function optionnel(valeur) {
  if (valeur === null || valeur === undefined) return null
  const texte = String(valeur).trim()
  return texte === '' ? null : texte
}

/** Date ISO (YYYY-MM-DD) pour les champs `<input type="date">`. */
export function datePourChamp(valeur) {
  if (!valeur) return ''
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function nomComplet(employe) {
  if (!employe) return 'Employé supprimé'
  return `${employe.nom ?? ''} ${employe.prenoms ?? ''}`.trim() || '—'
}

export function libelleEmploye(employe) {
  if (!employe) return '—'
  return nomComplet(employe)
}
