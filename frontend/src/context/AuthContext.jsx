import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getMe, login as loginApi, logoutLocal } from '../services/authService'
import { TOKEN_KEY } from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))

  /* Hydrate le profil depuis /auth/me au chargement si un token existe. */
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return undefined
    }

    let actif = true

    getMe()
      .then((profil) => {
        if (actif) setUser(profil)
      })
      .catch(() => {
        if (actif) {
          logoutLocal()
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (actif) setLoading(false)
      })

    return () => {
      actif = false
    }
  }, [token])

  const login = useCallback(async (identifiants) => {
    const donnees = await loginApi(identifiants)
    localStorage.setItem(TOKEN_KEY, donnees.token)
    setToken(donnees.token)
    setUser(donnees.user)
    return donnees.user
  }, [])

  const logout = useCallback(() => {
    logoutLocal()
    setToken(null)
    setUser(null)
  }, [])

  /* L'intercepteur Axios émet cet événement sur une réponse 401. */
  useEffect(() => {
    const surDeconnexion = () => logout()
    window.addEventListener('auth:logout', surDeconnexion)
    return () => window.removeEventListener('auth:logout', surDeconnexion)
  }, [logout])

  const hasRole = useCallback(
    (...roles) => Boolean(user && roles.includes(user.role)),
    [user]
  )

  const valeur = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      hasRole,
    }),
    [token, user, loading, login, logout, hasRole]
  )

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>
}
