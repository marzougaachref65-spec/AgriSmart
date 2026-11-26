import { api } from './api'

/** Module Rapports : toutes les réponses JSON suivent { success, message, data }. */

export async function getSyntheseRapports(parametres = {}) {
  const reponse = await api.get('/rapports/synthese', { params: parametres })
  return reponse.data.data
}

export async function getRapportDomaine(domaine, parametres = {}) {
  const reponse = await api.get(`/rapports/${domaine}`, { params: parametres })
  return reponse.data.data
}

export async function getExportCsvRapport(domaine, parametres = {}) {
  const reponse = await api.get('/rapports/export.csv', {
    params: { domaine, ...parametres },
    responseType: 'blob',
  })
  return reponse.data
}

export async function getExportJsonRapport(domaine, parametres = {}) {
  const reponse = await api.get('/rapports/export.json', {
    params: { domaine, ...parametres },
    responseType: 'blob',
  })
  return reponse.data
}
