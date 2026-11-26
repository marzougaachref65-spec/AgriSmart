import { api } from './api'

/** Toutes les réponses suivent le format { success, message, data }. */

/* ----------------------------- Catégories ---------------------------- */

export async function listCategories(filtres = {}) {
  const reponse = await api.get('/finances/categories', { params: filtres })
  return reponse.data.data
}

export async function getCategorie(id) {
  const reponse = await api.get(`/finances/categories/${id}`)
  return reponse.data.data
}

export async function createCategorie(donnees) {
  const reponse = await api.post('/finances/categories', donnees)
  return reponse.data.data
}

export async function updateCategorie(id, donnees) {
  const reponse = await api.put(`/finances/categories/${id}`, donnees)
  return reponse.data.data
}

export async function desactiverCategorie(id) {
  const reponse = await api.delete(`/finances/categories/${id}`)
  return reponse.data.data
}

/* ----------------------------- Opérations ---------------------------- */

export async function listOperations(filtres = {}) {
  const reponse = await api.get('/finances/operations', { params: filtres })
  return reponse.data.data
}

export async function getOperation(id) {
  const reponse = await api.get(`/finances/operations/${id}`)
  return reponse.data.data
}

export async function createOperation(donnees) {
  const reponse = await api.post('/finances/operations', donnees)
  return reponse.data.data
}

export async function updateOperation(id, donnees) {
  const reponse = await api.put(`/finances/operations/${id}`, donnees)
  return reponse.data.data
}

export async function creerPaiement(id, donnees) {
  const reponse = await api.post(`/finances/operations/${id}/paiements`, donnees)
  return reponse.data.data
}

export async function annulerOperation(id, motif) {
  const reponse = await api.post(`/finances/operations/${id}/annuler`, { motif })
  return reponse.data.data
}

export async function getHistoriqueOperation(id) {
  const reponse = await api.get(`/finances/operations/${id}/historique`)
  return reponse.data.data
}

/* ----------------- Tableaux de bord et statistiques ------------------ */

export async function getTableauDeBord(parametres = {}) {
  const reponse = await api.get('/finances/tableau-de-bord', {
    params: parametres,
  })
  return reponse.data.data
}

export async function getStatistiquesFinancieres(parametres = {}) {
  const reponse = await api.get('/finances/statistiques', {
    params: parametres,
  })
  return reponse.data.data
}

/* -------------------------------- Rapports --------------------------- */

export async function getRapportSynthese(parametres = {}) {
  const reponse = await api.get('/finances/rapports/synthese', {
    params: parametres,
  })
  return reponse.data.data
}

export async function getRapportCsv(parametres = {}) {
  const reponse = await api.get('/finances/rapports/operations.csv', {
    params: parametres,
    responseType: 'blob',
  })
  return reponse.data
}
