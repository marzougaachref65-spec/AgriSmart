import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  getStatistiquesNotifications,
  marquerNotificationLue as marquerLueApi,
  marquerToutesLues as marquerToutesLuesApi,
} from '../services/notificationService'

export const NotificationsContext = createContext(null)

/** Rafraîchissement du compteur, jamais de génération côté navigateur. */
const INTERVALLE_RAFRAICHISSEMENT_MS = 60 * 1000

const statistiquesVides = {
  total: 0,
  lues: 0,
  nonLues: 0,
  urgentesNonLues: 0,
  actives: 0,
  parType: {},
  parNiveau: {},
}

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [statistiques, setStatistiques] = useState(statistiquesVides)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  const rafraichir = useCallback(async () => {
    if (!isAuthenticated) {
      setStatistiques(statistiquesVides)
      return statistiquesVides
    }
    setChargement(true)
    setErreur('')
    try {
      const donnees = await getStatistiquesNotifications()
      setStatistiques(donnees)
      return donnees
    } catch (e) {
      const message =
        e.response?.data?.message ?? 'Impossible de charger les statistiques des notifications.'
      setErreur(message)
      console.error('[NOTIFICATIONS]', message)
      throw e
    } finally {
      setChargement(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      setStatistiques(statistiquesVides)
      setErreur('')
      return undefined
    }

    rafraichir().catch(() => {})
    const minuteur = setInterval(() => rafraichir().catch(() => {}), INTERVALLE_RAFRAICHISSEMENT_MS)
    return () => clearInterval(minuteur)
  }, [isAuthenticated, rafraichir])

  const marquerLue = useCallback(async (id, lue = true) => {
    const resultat = await marquerLueApi(id, lue)
    await rafraichir()
    return resultat
  }, [rafraichir])

  const marquerToutesLues = useCallback(async (lue = true) => {
    const resultat = await marquerToutesLuesApi(lue)
    await rafraichir()
    return resultat
  }, [rafraichir])

  const valeur = useMemo(
    () => ({
      statistiques,
      chargement,
      erreur,
      rafraichir,
      marquerLue,
      marquerToutesLues,
    }),
    [statistiques, chargement, erreur, rafraichir, marquerLue, marquerToutesLues]
  )

  return (
    <NotificationsContext.Provider value={valeur}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const contexte = useContext(NotificationsContext)
  if (!contexte) {
    throw new Error('useNotifications doit être utilisé dans un NotificationsProvider')
  }
  return contexte
}
