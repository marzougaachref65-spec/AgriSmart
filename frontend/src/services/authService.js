import { api, TOKEN_KEY } from './api'

/**
 * Se connecte. Le backend renvoie { token, user } dans `data`.
 */
export async function login(identifiants) {
  const reponse = await api.post('/auth/login', identifiants)
  return reponse.data.data
}

/**
 * Récupère le profil associé au token stocké.
 */
export async function getMe() {
  const reponse = await api.get('/auth/me')
  return reponse.data.data
}

/**
 * Suppression locale du token (le JWT n'a pas de session côté serveur).
 */
export function logoutLocal() {
  localStorage.removeItem(TOKEN_KEY)
}
