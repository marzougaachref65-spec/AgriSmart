import { api } from './api'

/** Toutes les réponses suivent le format { success, message, data }. */

/* ----------------------------- Dossiers ---------------------------- */

export async function listDossiers(filtres = {}) {
  const reponse = await api.get('/veterinaire/dossiers', { params: filtres })
  return reponse.data.data
}

export async function getDossier(id) {
  const reponse = await api.get(`/veterinaire/dossiers/${id}`)
  return reponse.data.data
}

export async function getDossierParAnimal(animalId) {
  const reponse = await api.get(`/veterinaire/dossiers/animal/${animalId}`)
  return reponse.data.data
}

export async function createDossier(donnees) {
  const reponse = await api.post('/veterinaire/dossiers', donnees)
  return reponse.data.data
}

export async function updateDossier(id, donnees) {
  const reponse = await api.put(`/veterinaire/dossiers/${id}`, donnees)
  return reponse.data.data
}

export async function deleteDossier(id) {
  const reponse = await api.delete(`/veterinaire/dossiers/${id}`)
  return reponse.data.data
}

/* ---------------------------- Événements --------------------------- */

export async function listEvenements(filtres = {}) {
  const reponse = await api.get('/veterinaire/evenements', { params: filtres })
  return reponse.data.data
}

export async function getEvenement(id) {
  const reponse = await api.get(`/veterinaire/evenements/${id}`)
  return reponse.data.data
}

export async function createEvenement(donnees) {
  const reponse = await api.post('/veterinaire/evenements', donnees)
  return reponse.data.data
}

/* ------------------------------ Rappels ---------------------------- */

export async function listRappels(filtres = {}) {
  const reponse = await api.get('/veterinaire/rappels', { params: filtres })
  return reponse.data.data
}

export async function getRappel(id) {
  const reponse = await api.get(`/veterinaire/rappels/${id}`)
  return reponse.data.data
}

export async function createRappel(donnees) {
  const reponse = await api.post('/veterinaire/rappels', donnees)
  return reponse.data.data
}

export async function updateRappel(id, donnees) {
  const reponse = await api.put(`/veterinaire/rappels/${id}`, donnees)
  return reponse.data.data
}

export async function deleteRappel(id) {
  const reponse = await api.delete(`/veterinaire/rappels/${id}`)
  return reponse.data.data
}

/* ---------------------- Historique, agenda, alertes ---------------- */

export async function getHistoriqueAnimal(animalId) {
  const reponse = await api.get(`/veterinaire/animaux/${animalId}/historique`)
  return reponse.data.data
}

export async function getCalendrierSoins(parametres = {}) {
  const reponse = await api.get('/veterinaire/calendrier', { params: parametres })
  return reponse.data.data
}

export async function getAlertesVeterinaires(parametres = {}) {
  const reponse = await api.get('/veterinaire/alertes', { params: parametres })
  return reponse.data.data
}

export async function getStatistiquesVeterinaires(parametres = {}) {
  const reponse = await api.get('/veterinaire/statistiques', { params: parametres })
  return reponse.data.data
}
