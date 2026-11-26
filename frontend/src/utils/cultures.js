export const STATUTS_PARCELLE = ['Disponible', 'Cultivée', 'En repos']
export const STATUTS_CYCLE = ['Planifiée', 'En cours', 'Récoltée', 'Annulée']

export const TONS_PARCELLE = {
  Disponible: 'success',
  Cultivée: 'info',
  'En repos': 'neutral',
}

export const TONS_CYCLE = {
  Planifiée: 'warning',
  'En cours': 'info',
  Récoltée: 'success',
  Annulée: 'neutral',
}

const formateurDate = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const formateurNombre = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatDate(valeur) {
  if (!valeur) return '—'
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) return '—'
  return formateurDate.format(date)
}

export function formatNombre(valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return '—'
  const nombre = Number(valeur)
  if (Number.isNaN(nombre)) return '—'
  return formateurNombre.format(nombre)
}

/** Transforme la valeur d'un champ texte vide en `null` pour l'API. */
export function optionnel(valeur) {
  if (valeur === null || valeur === undefined) return null
  const texte = String(valeur).trim()
  return texte === '' ? null : texte
}
