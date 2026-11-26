export const TYPES_EVENEMENT = [
  'Vaccination',
  'Maladie',
  'Traitement',
  'Consultation',
]

export const NATURES_CONSULTATION = [
  'Consultation',
  'Intervention',
  'Chirurgie',
  'Contrôle',
]

export const GRAVITES_MALADIE = ['Légère', 'Modérée', 'Grave']
export const STATUTS_MALADIE = ['En cours', 'Guérie', 'Chronique']
export const STATUTS_TRAITEMENT = ['En cours', 'Terminé', 'Interrompu']

export const TYPES_RAPPEL = [
  'Rappel de vaccination',
  'Visite de contrôle',
  'Renouvellement de traitement',
  'Autre soin',
]
export const STATUTS_RAPPEL = ['Planifié', 'Effectué', 'Annulé']

export const ALERTES_VETERINAIRES = [
  'rappelRetard',
  'rappelProche',
  'traitementEnCours',
  'maladieActive',
]

export const LIBELLES_TYPE_EVENEMENT = {
  Vaccination: 'Vaccination',
  Maladie: 'Maladie / diagnostic',
  Traitement: 'Traitement',
  Consultation: 'Consultation / intervention',
}

export const TONS_TYPE_EVENEMENT = {
  Vaccination: 'success',
  Maladie: 'danger',
  Traitement: 'warning',
  Consultation: 'info',
}

export const TONS_STATUT_RAPPEL = {
  Planifié: 'warning',
  Effectué: 'success',
  Annulé: 'neutral',
}

export const LIBELLES_ALERTE_VETERINAIRE = {
  rappelRetard: 'Rappels en retard',
  rappelProche: 'Rappels à venir',
  traitementEnCours: 'Traitements en cours',
  maladieActive: 'Maladies actives',
}

export const TONS_ALERTE_VETERINAIRE = {
  rappelRetard: 'danger',
  rappelProche: 'warning',
  traitementEnCours: 'info',
  maladieActive: 'danger',
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

/** Libellé lisible d'un événement, quelle que soit son type. */
export function libelleEvenement(evenement) {
  if (!evenement) return '—'
  if (evenement.libelle) return evenement.libelle

  switch (evenement.type) {
    case 'Vaccination':
      return `Vaccination ${evenement.vaccin ?? ''}`.trim()
    case 'Maladie':
      return evenement.nomMaladie || 'Maladie'
    case 'Traitement':
      return `Traitement ${evenement.medicament ?? ''}`.trim()
    case 'Consultation':
      return `${evenement.nature ?? 'Consultation'} — ${evenement.motif ?? ''}`.trim()
    default:
      return evenement.type
  }
}

/** Nom d'affichage d'un animal peuplé, avec repli si la donn't est supprimée. */
export function nomAnimal(animal) {
  return animal?.name || 'Animal supprimé'
}
