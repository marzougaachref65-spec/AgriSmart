import { api } from './api'

/** Toutes les réponses suivent le format { success, message, data }. */
export async function listParcelles(filtres = {}) {
  const reponse = await api.get('/parcelles', { params: filtres })
  return reponse.data.data
}

export async function getParcellesStats() {
  const reponse = await api.get('/parcelles/statistiques')
  return reponse.data.data
}

export async function getParcelle(id) {
  const reponse = await api.get(`/parcelles/${id}`)
  return reponse.data.data
}

export async function createParcelle(donnees) {
  const reponse = await api.post('/parcelles', donnees)
  return reponse.data.data
}

export async function updateParcelle(id, donnees) {
  const reponse = await api.put(`/parcelles/${id}`, donnees)
  return reponse.data.data
}

export async function deleteParcelle(id) {
  const reponse = await api.delete(`/parcelles/${id}`)
  return reponse.data.data
}
