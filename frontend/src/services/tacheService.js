import { api } from './api'

/** Toutes les réponses suivent le format { success, message, data }. */

export async function listTaches(filtres = {}) {
  const reponse = await api.get('/taches', { params: filtres })
  return reponse.data.data
}

export async function getStatistiquesTaches() {
  const reponse = await api.get('/taches/statistiques')
  return reponse.data.data
}

export async function listTachesEnRetard() {
  const reponse = await api.get('/taches/en-retard')
  return reponse.data.data
}

export async function getTache(id) {
  const reponse = await api.get(`/taches/${id}`)
  return reponse.data.data
}

export async function getHistoriqueTache(id) {
  const reponse = await api.get(`/taches/${id}/historique`)
  return reponse.data.data
}

export async function createTache(donnees) {
  const reponse = await api.post('/taches', donnees)
  return reponse.data.data
}

export async function updateTache(id, donnees) {
  const reponse = await api.put(`/taches/${id}`, donnees)
  return reponse.data.data
}

export async function changerStatutTache(id, donnees) {
  const reponse = await api.patch(`/taches/${id}/statut`, donnees)
  return reponse.data.data
}

export async function annulerTache(id, donnees) {
  const reponse = await api.post(`/taches/${id}/annuler`, donnees)
  return reponse.data.data
}

export async function deleteTache(id) {
  const reponse = await api.delete(`/taches/${id}`)
  return reponse.data.data
}
