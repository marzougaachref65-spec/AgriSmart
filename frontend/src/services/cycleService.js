import { api } from './api'

/** Toutes les réponses suivent le format { success, message, data }. */
export async function listCycles(filtres = {}) {
  const reponse = await api.get('/cycles', { params: filtres })
  return reponse.data.data
}

export async function getCyclesStats() {
  const reponse = await api.get('/cycles/statistiques')
  return reponse.data.data
}

export async function getCycle(id) {
  const reponse = await api.get(`/cycles/${id}`)
  return reponse.data.data
}

export async function createCycle(donnees) {
  const reponse = await api.post('/cycles', donnees)
  return reponse.data.data
}

export async function updateCycle(id, donnees) {
  const reponse = await api.put(`/cycles/${id}`, donnees)
  return reponse.data.data
}

export async function deleteCycle(id) {
  const reponse = await api.delete(`/cycles/${id}`)
  return reponse.data.data
}
