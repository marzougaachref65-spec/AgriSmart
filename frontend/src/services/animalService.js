import { api } from './api'

/** Toutes les réponses suivent le format { success, message, data }. */
export async function listAnimals(filtres = {}) {
  const reponse = await api.get('/animals', { params: filtres })
  return reponse.data.data
}

export async function getAnimalStats() {
  const reponse = await api.get('/animals/statistiques')
  return reponse.data.data
}

export async function getAnimal(id) {
  const reponse = await api.get(`/animals/${id}`)
  return reponse.data.data
}

export async function createAnimal(donnees) {
  const reponse = await api.post('/animals', donnees)
  return reponse.data.data
}

export async function updateAnimal(id, donnees) {
  const reponse = await api.put(`/animals/${id}`, donnees)
  return reponse.data.data
}

export async function deleteAnimal(id) {
  const reponse = await api.delete(`/animals/${id}`)
  return reponse.data.data
}
