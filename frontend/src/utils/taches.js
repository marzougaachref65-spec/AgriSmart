export const STATUTS_TACHE = ['À faire', 'En cours', 'Terminée', 'Annulée']
export const PRIORITES_TACHE = ['Basse', 'Moyenne', 'Haute', 'Urgente']
export const MODULES_CIBLE = ['Animaux', 'Cultures', 'Parcelles', 'Autre']

export const TONS_STATUT_TACHE = {
  'À faire': 'info',
  'En cours': 'warning',
  Terminée: 'success',
  Annulée: 'neutral',
}

export const TONS_PRIORITE_TACHE = {
  Basse: 'neutral',
  Moyenne: 'brand',
  Haute: 'warning',
  Urgente: 'danger',
}

export const LIBELLES_MODULE_CIBLE = {
  Animaux: 'Animal',
  Cultures: 'Cycle de culture',
  Parcelles: 'Parcelle',
  Autre: 'Autre',
}

export const LIBELLES_ACTION_TACHE = {
  CREATION: 'Création de la tâche',
  MODIFICATION: 'Modification de la tâche',
  CHANGEMENT_STATUT: 'Changement de statut',
  AFFECTATION_EMPLOYES: 'Affectation des employés',
  ANNULATION: 'Annulation de la tâche',
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

export function nomEmploye(employe) {
  if (!employe) return 'Employé supprimé'
  return `${employe.nom ?? ''} ${employe.prenoms ?? ''}`.trim() || '—'
}

export function libelleCible(tache) {
  const cible = tache?.cible
  if (!cible || cible.module === 'Autre') return '—'
  return cible.libelle || cible.referenceId || LIBELLES_MODULE_CIBLE[cible.module] || '—'
}

/** Nombre de jours de retard, ou 0 si la tâche n'est pas en retard. */
export function joursRetard(tache) {
  if (!tache?.enRetard || !tache.dateEcheance) return 0
  const echeance = new Date(tache.dateEcheance).getTime()
  if (Number.isNaN(echeance)) return 0
  return Math.max(1, Math.ceil((Date.now() - echeance) / 86400000))
}
