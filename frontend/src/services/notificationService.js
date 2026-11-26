import { api } from './api'

/** Toutes les réponses suivent le format { success, message, data }. */

export async function listNotifications(filtres = {}) {
  const reponse = await api.get('/notifications', { params: filtres })
  return reponse.data.data
}

export async function getStatistiquesNotifications() {
  const reponse = await api.get('/notifications/statistiques')
  return reponse.data.data
}

export async function getNotification(id) {
  const reponse = await api.get(`/notifications/${id}`)
  return reponse.data.data
}

export async function marquerNotificationLue(id, lue = true) {
  const reponse = await api.patch(`/notifications/${id}/lue`, { lue })
  return reponse.data.data
}

export async function marquerToutesLues(lue = true) {
  const reponse = await api.patch('/notifications/lire-toutes', { lue })
  return reponse.data.data
}

/** Réservé à l'encadrement : relance idempotente du générateur côté serveur. */
export async function actualiserNotifications() {
  const reponse = await api.post('/notifications/actualiser', {})
  return reponse.data.data
}
