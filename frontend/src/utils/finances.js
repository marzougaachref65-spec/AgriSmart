export const TYPES_OPERATION = ['Revenu', 'Depense']

export const MODES_PAIEMENT = ['Espèces', 'Virement', 'Chèque', 'Autre']

export const STATUTS_PAIEMENT = ['Non payé', 'Partiellement payé', 'Payé']

export const STATUTS_OPERATION = ['Actif', 'Annulé']

export const TYPES_CATEGORIE = ['Revenu', 'Depense', 'Les deux']

/** Catégories actives compatibles avec un type d'opération. */
export function categoriesPourType(categories, type) {
  return (categories ?? []).filter(
    (categorie) =>
      categorie.actif !== false &&
      (categorie.type === type || categorie.type === 'Les deux')
  )
}

/**
 * Type initial d'une nouvelle opération : on conserve `Depense` lorsqu'une
 * catégorie active est compatible, sinon on bascule sur le premier type qui
 * dispose réellement d'une catégorie active.
 */
export function typeInitialPourCategories(categories, typeParDefaut = 'Depense') {
  if (categoriesPourType(categories, typeParDefaut).length > 0) return typeParDefaut
  const alternatif = TYPES_OPERATION.find(
    (type) =>
      type !== typeParDefaut && categoriesPourType(categories, type).length > 0
  )
  return alternatif ?? typeParDefaut
}

export const MODULES_SOURCE = [
  'Animaux',
  'Stocks',
  'Cultures',
  'Veterinaire',
  'Autre',
]

export const DEVISES = ['TND']
export const SYMBOLE_DEVISE = 'DT'
export const LIBELLES_DEVISE = { TND: 'TND (DT)' }

export const LIBELLES_TYPE_OPERATION = {
  Revenu: 'Revenu',
  Depense: 'Dépense',
}

export const TONS_TYPE_OPERATION = {
  Revenu: 'success',
  Depense: 'danger',
}

export const LIBELLES_STATUT_PAIEMENT = {
  'Non payé': 'Non payé',
  'Partiellement payé': 'Partiellement payé',
  Payé: 'Payé',
}

export const TONS_STATUT_PAIEMENT = {
  'Non payé': 'danger',
  'Partiellement payé': 'warning',
  Payé: 'success',
}

export const LIBELLES_TYPE_CATEGORIE = {
  Revenu: 'Revenu',
  Depense: 'Dépense',
  'Les deux': 'Les deux',
}

export const TONS_TYPE_CATEGORIE = {
  Revenu: 'success',
  Depense: 'danger',
  'Les deux': 'brand',
}

export const COULEURS_CATEGORIE = [
  '#16a34a',
  '#65a30d',
  '#0d9488',
  '#2563eb',
  '#7c3aed',
  '#f97316',
  '#fbbf24',
  '#dc2626',
  '#db2777',
  '#0891b2',
]

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

/** Entier millimes → chaîne exacte à 3 décimales : 25750 → "25.750". */
export function millimesVersTexte(valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return null
  const nombre = Number(valeur)
  if (!Number.isFinite(nombre)) return null
  const entier = Math.trunc(nombre)
  const signe = entier < 0 ? '-' : ''
  const absolu = Math.abs(entier)
  return `${signe}${Math.floor(absolu / 1000)}.${String(absolu % 1000).padStart(3, '0')}`
}

/** Format unique d'affichage des montants financiers : "25.750 DT". */
export function formatMontantTND(valeurMillimes) {
  const texte = millimesVersTexte(valeurMillimes)
  return texte === null ? '—' : `${texte} ${SYMBOLE_DEVISE}`
}

/** Saisie TND "25.750" → 25750 millimes, sans passer par un flottant. */
export function saisieVersMillimes(valeur) {
  const texte = String(valeur ?? '').trim()
  if (!texte) return 0
  const negatif = texte.startsWith('-')
  const sansSigne = texte.replace(/^[+-]/, '')
  const correspondance = /^(\d+)(?:\.(\d{1,3}))?$/.exec(sansSigne)
  if (!correspondance) return Number.NaN
  const millimes =
    Number(correspondance[1]) * 1000 +
    Number((correspondance[2] ?? '').padEnd(3, '0'))
  return negatif ? -millimes : millimes
}

export function formatNombre(valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return '—'
  const nombre = Number(valeur)
  if (Number.isNaN(nombre)) return '—'
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nombre)
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

/** Libellé lisible d'une opération, quelle que soit son origine. */
export function libelleOperation(operation) {
  if (!operation) return '—'
  return operation.libelle || operation.reference || '—'
}
