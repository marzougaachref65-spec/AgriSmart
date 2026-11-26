export const CATEGORIES_PRODUIT = [
  'Semences',
  'Engrais',
  'Aliments pour animaux',
  'Médicaments vétérinaires',
  'Matériel agricole',
  'Autres',
]

export const MOTIFS_ENTREE = ['Achat', 'Réception', 'Approvisionnement', 'Autre']
export const MOTIFS_SORTIE = [
  'Consommation',
  'Utilisation agricole',
  'Perte',
  'Autre',
]

export const TYPES_MOUVEMENT = ['Entrée', 'Sortie']
export const STATUTS_MOUVEMENT = ['En attente', 'Confirmé', 'Annulé']

export const ALERTES = ['rupture', 'faible', 'proche', 'expire']

export const LIBELLES_ALERTE = {
  rupture: 'Rupture de stock',
  faible: 'Stock faible',
  proche: 'Expiration proche',
  expire: 'Expiré',
}

export const TONS_ALERTE = {
  rupture: 'danger',
  faible: 'warning',
  proche: 'info',
  expire: 'danger',
}

export const TONS_TYPE_MOUVEMENT = {
  Entrée: 'success',
  Sortie: 'warning',
}

export const TONS_STATUT_MOUVEMENT = {
  Confirmé: 'success',
  'En attente': 'warning',
  Annulé: 'danger',
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
  maximumFractionDigits: 2,
})

const formateurMontant = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
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

export function formatMontant(valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return '—'
  const nombre = Number(valeur)
  if (Number.isNaN(nombre)) return '—'
  return formateurMontant.format(nombre)
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
