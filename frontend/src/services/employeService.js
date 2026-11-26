import { api } from './api'

/** Toutes les réponses suivent le format { success, message, data }. */

export async function listEmployes(filtres = {}) {
  const reponse = await api.get('/employes', { params: filtres })
  return reponse.data.data
}

export async function getStatistiquesEmployes() {
  const reponse = await api.get('/employes/statistiques')
  return reponse.data.data
}

export async function listComptesDisponibles() {
  const reponse = await api.get('/employes/comptes-disponibles')
  return reponse.data.data
}

export async function getEmploye(id) {
  const reponse = await api.get(`/employes/${id}`)
  return reponse.data.data
}

export async function getHistoriqueEmploye(id) {
  const reponse = await api.get(`/employes/${id}/historique`)
  return reponse.data.data
}

export async function getHistoriqueEmployes(filtres = {}) {
  const reponse = await api.get('/employes/historique', { params: filtres })
  return reponse.data.data
}

export async function createEmploye(donnees) {
  const reponse = await api.post('/employes', donnees)
  return reponse.data.data
}

export async function updateEmploye(id, donnees) {
  const reponse = await api.put(`/employes/${id}`, donnees)
  return reponse.data.data
}

export async function desactiverEmploye(id, donnees = {}) {
  const reponse = await api.patch(`/employes/${id}/desactiver`, donnees)
  return reponse.data.data
}

export async function reactiverEmploye(id) {
  const reponse = await api.patch(`/employes/${id}/reactiver`)
  return reponse.data.data
}
