import { COULEURS_CATEGORIE, formatDate, formatDateHeure, formatMontantTND, formatNombre } from './finances.js'

/** Helpers partagés du module Rapports : formatage fr-FR, périodes et exports. */

export const ONGLETS_RAPPORT = [
  { id: 'synthese', label: 'Synthèse' },
  { id: 'animaux-cultures', label: 'Animaux & cultures' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'veterinaire', label: 'Vétérinaire' },
  { id: 'finances', label: 'Finances' },
  { id: 'employes-taches', label: 'Employés & tâches' },
]

export const FORMATS_EXPORT = ['CSV', 'JSON']

export { formatDate, formatDateHeure, formatMontantTND, formatNombre }

/**
 * Valeur monétaire stockée en Number (stock, consultations) — jamais des millimes.
 * Formatage dédié, sans conversion implicite vers le format millimes.
 */
const formateurMontantBrut = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatValeurBrute(valeur, devise = 'DT') {
  if (valeur === null || valeur === undefined || valeur === '') return '—'
  const nombre = Number(valeur)
  if (!Number.isFinite(nombre)) return '—'
  return `${formateurMontantBrut.format(nombre)} ${devise}`
}

export function datePourChamp(valeur) {
  if (!valeur) return ''
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

export function debutAnnee() {
  return `${new Date().getFullYear()}-01-01`
}

export function aujourdHui() {
  return datePourChamp(new Date())
}

export function joursAvant(nombre) {
  const date = new Date()
  date.setDate(date.getDate() - nombre)
  return datePourChamp(date)
}

export const PERIODES_RAPIDES = [
  { id: '7j', label: '7 jours', debut: () => joursAvant(6) },
  { id: '30j', label: '30 jours', debut: () => joursAvant(29) },
  { id: 'annee', label: 'Année en cours', debut: debutAnnee },
  { id: 'tout', label: 'Depuis le début', debut: () => '2020-01-01' },
]

/** Conversion en ISO envoyée à l'API : bornes locales explicites. */
export function parametresPeriode(periode) {
  const parametres = {}
  if (periode?.debut) {
    parametres.debut = new Date(`${periode.debut}T00:00:00`).toISOString()
  }
  if (periode?.fin) {
    parametres.fin = new Date(`${periode.fin}T23:59:59.999`).toISOString()
  }
  return parametres
}

export function formaterPeriode(periode) {
  if (!periode?.debut || !periode?.fin) return 'Période non définie'
  return `du ${formatDate(periode.debut)} au ${formatDate(periode.fin)}`
}

export function periodeAffichee(rapport) {
  if (!rapport?.periode) return ''
  return formaterPeriode({
    debut: rapport.periode.debut,
    fin: rapport.periode.fin,
  })
}

export function precisionPeriode(source) {
  if (!source) return ''
  return source.precision ?? ''
}

export const LIBELLES_PERIODE_APPLIQUEE = {
  true: 'Période appliquée',
  false: 'État actuel (sans période)',
  partielle: 'Période partielle',
}

export const styleInfobulle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  fontSize: 12,
}

export { COULEURS_CATEGORIE as COULEURS_GRAPHIQUE }

export function couleurGraphique(index) {
  return COULEURS_CATEGORIE[index % COULEURS_CATEGORIE.length]
}

export function nomFichierExport(domaine, format, periode) {
  const date = datePourChamp(new Date()) || 'export'
  return `agrismart-rapport-${domaine}-${date}.${format.toLowerCase()}`
}

/** Lecture robuste d'une erreur renvoyée en Blob (CSV/JSON). */
export async function messageErreurRapport(erreur, fallback) {
  const donnees = erreur?.response?.data
  if (donnees instanceof Blob) {
    try {
      const texte = await donnees.text()
      try {
        const analyse = JSON.parse(texte)
        if (analyse?.message) return analyse.message
      } catch {
        // Le corps n'est pas du JSON : on garde le texte brut.
      }
      return texte.trim() || fallback
    } catch {
      return fallback
    }
  }
  return donnees?.message ?? fallback
}

export function telechargerContenu(contenu, nomFichier, typeMime) {
  const fichier =
    contenu instanceof Blob ? contenu : new Blob([contenu], { type: typeMime })
  const url = URL.createObjectURL(fichier)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nomFichier
  document.body.appendChild(lien)
  lien.click()
  document.body.removeChild(lien)
  URL.revokeObjectURL(url)
}
