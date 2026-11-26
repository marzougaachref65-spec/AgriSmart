import { getRapportCsv as getCsvFinancier } from './rapportFinancierService.js'
import { getRapportDomaine, getRapportSynthese } from './rapportService.js'

/**
 * Export du module Rapports : CSV réel (BOM UTF-8, ';', CRLF) et JSON structuré.
 * Aucun PDF ni Excel simulé : seuls ces deux formats sont disponibles.
 */

const EN_TETES = ['Section', 'Libellé', 'Valeur', 'Statut', 'Date', 'Détail']

/** Guillemets doublés et encapsulation des champs contenant ';', '"' ou un saut de ligne. */
export function echapperCsv(valeur) {
  const texte = valeur === undefined || valeur === null ? '' : String(valeur)
  const avecGuillemets = texte.replace(/"/g, '""')
  return /[;"\r\n]/.test(avecGuillemets) ? `"${avecGuillemets}"` : avecGuillemets
}

export function genererCsv(lignes) {
  const tableaux = [EN_TETES, ...lignes]
  return `\uFEFF${tableaux.map((ligne) => ligne.map(echapperCsv).join(';')).join('\r\n')}`
}

function ligne(section, libelle, valeur = '', statut = '', date = '', detail = '') {
  return [section, libelle, valeur, statut, date, detail]
}

function texte(valeur) {
  if (valeur === undefined || valeur === null || valeur === '') return ''
  return String(valeur)
}

function dateCourte(valeur) {
  if (!valeur) return ''
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

function lignesAnimauxCultures(donnees) {
  const lignes = []
  const { details = {} } = donnees

  for (const animal of details.animaux?.elements ?? []) {
    lignes.push(
      ligne(
        'Animaux',
        animal.name ?? '',
        `${animal.espece ?? ''} ${animal.race ?? ''}`.trim(),
        animal.statut ?? '',
        dateCourte(animal.dateAcquisition),
        animal.sexe ?? ''
      )
    )
  }
  for (const parcelle of details.parcelles?.elements ?? []) {
    lignes.push(
      ligne(
        'Parcelles',
        parcelle.name ?? '',
        `${parcelle.superficie ?? ''} ha`,
        parcelle.statut ?? '',
        '',
        `${parcelle.localisation ?? ''} ${parcelle.typeSol ?? ''}`.trim()
      )
    )
  }
  for (const cycle of details.cycles?.elements ?? []) {
    lignes.push(
      ligne(
        'Cycles',
        cycle.typeCulture ?? cycle.variete ?? '',
        `${cycle.quantiteRecoltee ?? 0} kg récoltés`,
        cycle.statut ?? '',
        dateCourte(cycle.dateSemis),
        cycle.parcelle?.name ?? ''
      )
    )
  }

  if (lignes.length === 0) {
    lignes.push(ligne('Animaux & cultures', 'Aucune donnée enregistrée'))
  }
  return lignes
}

function lignesStocks(donnees) {
  const lignes = []
  for (const produit of donnees.details?.produits?.elements ?? []) {
    lignes.push(
      ligne(
        'Stocks (grand livre)',
        produit.name ?? '',
        `${produit.quantiteLedger ?? 0} ${produit.unite ?? ''}`.trim(),
        produit.alerte ?? 'aucune',
        dateCourte(produit.dateExpiration),
        `Prix unitaire ${texte(produit.prixUnitaire)} — seuil ${texte(produit.seuilMinimum)}`
      )
    )
  }
  const incoherences = donnees.incoherences ?? {}
  for (const produit of incoherences.produitsDesynchronises ?? []) {
    lignes.push(
      ligne(
        'Incohérences (lecture seule)',
        produit.name ?? '',
        `projetée ${texte(produit.stockProduit)} / grand livre ${texte(produit.stockLedger)}`,
        'à signaler',
        '',
        'Aucune correction appliquée'
      )
    )
  }
  if (lignes.length === 0) {
    lignes.push(ligne('Stocks', 'Aucun produit enregistré'))
  }
  return lignes
}

export function lignesVeterinaire(donnees) {
  const stats = donnees.indicateurs ?? donnees.statistiques ?? {}
  const lignes = []
  for (const [type, nombre] of Object.entries(stats.evenementsParType ?? {})) {
    lignes.push(ligne('Événements par type', type, texte(nombre)))
  }
  const indicateurs = [
    ['Dossiers médicaux', stats.totalDossiers],
    ['Événements sanitaires', stats.totalEvenements],
    ['Rappels planifiés', stats.rappelsPlanifies],
    ['Rappels en retard', stats.rappelsEnRetard],
    ['Traitements en cours', stats.traitementsEnCours],
    ['Maladies actives', stats.maladiesActives],
    ['Vaccinations à venir', stats.vaccinationsAVenir],
    ['Consultations (période)', stats.consultations?.nombre],
    ['Coût consultations (DT, valeur brute)', stats.consultations?.coutTotal],
  ]
  for (const [libelle, valeur] of indicateurs) {
    lignes.push(ligne('Indicateurs', libelle, texte(valeur)))
  }
  return lignes
}

function lignesEmployesTaches(donnees) {
  const lignes = []
  for (const employe of donnees.details?.employes?.elements ?? []) {
    lignes.push(
      ligne(
        'Employés',
        [employe.prenoms, employe.nom].filter(Boolean).join(' '),
        '',
        employe.statut ?? '',
        '',
        employe.fonction ?? ''
      )
    )
  }
  for (const tache of donnees.details?.taches?.elements ?? []) {
    lignes.push(
      ligne(
        'Tâches',
        tache.titre ?? tache.reference ?? '',
        tache.reference ?? '',
        tache.statut ?? '',
        dateCourte(tache.dateEcheance),
        `${tache.priorite ?? ''} ${tache.enRetard ? '— en retard' : ''}`.trim()
      )
    )
  }
  if (lignes.length === 0) {
    lignes.push(ligne('Employés & tâches', 'Aucune donnée enregistrée'))
  }
  return lignes
}

const CONSTRUCTEURS_LIGNES = {
  'animaux-cultures': lignesAnimauxCultures,
  stocks: lignesStocks,
  veterinaire: lignesVeterinaire,
  'employes-taches': lignesEmployesTaches,
}

/** Construit le CSV d'un domaine. Les finances réutilisent l'export existant. */
export async function getCsvRapport(domaine, periode, utilisateur) {
  if (domaine === 'finances') {
    return getCsvFinancier({ debut: periode.debut, fin: periode.fin })
  }

  const donnees =
    domaine === 'synthese'
      ? await getRapportSynthese({ debut: periode.debut, fin: periode.fin }, utilisateur)
      : await getRapportDomaine(domaine, { debut: periode.debut, fin: periode.fin }, utilisateur)

  if (domaine === 'synthese') {
    const lignes = []
    for (const [nom, domaineRapport] of Object.entries(donnees.domaines ?? {})) {
      if (domaineRapport.statut !== 'ok') continue
      const constructeur = CONSTRUCTEURS_LIGNES[nom]
      if (constructeur) lignes.push(...constructeur(domaineRapport.donnees))
    }
    /* Le domaine financier garde son export dédié, non fusionné ici. */
    if (lignes.length === 0) lignes.push(ligne('Synthèse', 'Aucune donnée disponible'))
    return genererCsv(lignes)
  }

  const constructeur = CONSTRUCTEURS_LIGNES[domaine]
  return genererCsv(constructeur ? constructeur(donnees) : [])
}

/** Export JSON : le rapport exactement tel qu'affiché, sans champs internes. */
export async function getJsonRapport(domaine, periode, utilisateur) {
  if (domaine === 'synthese') {
    return getRapportSynthese({ debut: periode.debut, fin: periode.fin }, utilisateur)
  }
  return getRapportDomaine(domaine, { debut: periode.debut, fin: periode.fin }, utilisateur)
}
