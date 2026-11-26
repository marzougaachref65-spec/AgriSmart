import { api } from './api'

/** Toutes les réponses suivent le format { success, message, data }. */

/* ---------- Produits ---------- */

export async function listProduits(filtres = {}) {
  const reponse = await api.get('/stocks/produits', { params: filtres })
  return reponse.data.data
}

export async function getProduit(id) {
  const reponse = await api.get(`/stocks/produits/${id}`)
  return reponse.data.data
}

export async function createProduit(donnees) {
  const reponse = await api.post('/stocks/produits', donnees)
  return reponse.data.data
}

export async function updateProduit(id, donnees) {
  const reponse = await api.put(`/stocks/produits/${id}`, donnees)
  return reponse.data.data
}

export async function deleteProduit(id) {
  const reponse = await api.delete(`/stocks/produits/${id}`)
  return reponse.data.data
}

/* ---------- Mouvements ---------- */

export async function listMouvements(filtres = {}) {
  const reponse = await api.get('/stocks/mouvements', { params: filtres })
  return reponse.data.data
}

export async function getMouvement(id) {
  const reponse = await api.get(`/stocks/mouvements/${id}`)
  return reponse.data.data
}

export async function createMouvement(donnees) {
  const reponse = await api.post('/stocks/mouvements', donnees)
  return reponse.data.data
}

/* ---------- Statistiques et alertes ---------- */

export async function getStatistiquesStocks(parametres = {}) {
  const reponse = await api.get('/stocks/statistiques', { params: parametres })
  return reponse.data.data
}

export async function getAlertesStocks() {
  const reponse = await api.get('/stocks/alertes')
  return reponse.data.data
}
