import { genererToutesLesAlertes } from '../services/alertesService.js'

/** Pascal natif : aucune dépendance npm, aucun cron système. */
export const INTERVALLE_ALERTES_MS = 15 * 60 * 1000
const DELAI_DEMARRAGE_MS = 30 * 1000

let minuteur = null
let executionEnCours = null
let demarre = false

async function executer() {
  if (executionEnCours) {
    console.warn('[ALERTES] Passage ignoré : la génération précédente est encore active.')
    return executionEnCours
  }

  executionEnCours = (async () => {
    try {
      const rapport = await genererToutesLesAlertes()
      if (rapport.erreurs.length > 0) {
        console.error('[ALERTES] Erreurs partielles :', rapport.erreurs)
      } else {
        console.log('[ALERTES] Génération terminée :', rapport.modules)
      }
      return rapport
    } catch (erreur) {
      console.error('[ALERTES] Échec complet de la génération :', erreur)
      throw erreur
    } finally {
      executionEnCours = null
    }
  })()

  return executionEnCours
}

/** Exporté pour les tests et le déclenchement manuel de l'encadrement. */
export const executerPlanificateur = executer

export function demarrerPlanificateur() {
  if (demarre) return { executerMaintenant: executer }
  demarre = true

  /* L'erreur est déjà journalisée dans executer() ; ce catch évite seulement
     une rejection non gérée dans le timer, sans masquer le diagnostic. */
  const passage = () => {
    executer().catch(() => {})
  }

  minuteur = setTimeout(() => {
    if (!demarre) return
    passage()
    minuteur = setInterval(passage, INTERVALLE_ALERTES_MS)
  }, DELAI_DEMARRAGE_MS)

  console.log(
    `[ALERTES] Planificateur démarré (premier passage dans ${DELAI_DEMARRAGE_MS / 1000} s, puis toutes les ${INTERVALLE_ALERTES_MS / 60000} min).`
  )
  return { executerMaintenant: executer }
}

/**
 * Arrêt propre : aucun nouveau passage, puis attente de la génération en cours.
 * Le processus ne se termine donc jamais avec un traitement non maîtrisé.
 */
export async function arreterPlanificateur() {
  if (!demarre && !minuteur && !executionEnCours) return
  demarre = false

  if (minuteur) {
    clearTimeout(minuteur)
    clearInterval(minuteur)
    minuteur = null
  }

  if (executionEnCours) {
    console.log('[ALERTES] Arrêt demandé — attente de la génération en cours...')
    try {
      await executionEnCours
    } catch (erreur) {
      console.error('[ALERTES] Erreur survenue pendant l’arrêt :', erreur)
    }
  }

  console.log('[ALERTES] Planificateur arrêté proprement.')
}

export function planificateurActif() {
  return demarre
}
