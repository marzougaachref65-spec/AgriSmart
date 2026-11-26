import { ApiError } from '../utils/apiError.js'
import { DOMAINES_RAPPORT } from '../validators/rapportValidator.js'
import {
  getStatistiquesAnimaux,
  listerAnimaux,
} from './animalService.js'
import {
  getStatistiquesParcelles,
  listerParcelles,
} from './parcelleService.js'
import { getStatistiquesCycles, listerCycles } from './cycleService.js'
import { listerProduits } from './produitService.js'
import {
  calculerStockLedger,
  getIncoherences,
  listerMouvements,
} from './mouvementService.js'
import {
  determinerAlerte,
  getStatistiquesStocks,
} from './stockService.js'
import {
  getAlertes as getAlertesVeterinaires,
  getStatistiquesVeterinaires,
} from './veterinaireService.js'
import { getRapportSynthese as getSyntheseFinanciere } from './rapportFinancierService.js'
import {
  getStatistiquesEmployes,
  listerEmployes as listerEmployesSource,
} from './employeService.js'
import { getStatistiquesTaches, listerTaches } from './tacheService.js'
import { getStatistiquesNotifications } from './notificationService.js'

/**
 * Module Rapports : orchestration des services métier existants.
 * Aucun calcul métier n'est réécrit, aucune écriture MongoDB n'est effectuée.
 */

const LIMITE_DETAILS = 100

/** Champs internes jamais exposés par /api/rapports, y compris dans les exports JSON. */
const CHAMPS_INTERDITS = new Set([
  'salaire',
  'salaireLibelle',
  'periodiciteSalaire',
])

/** Tout champ de millimes est interne : seules les valeurs DT sont publiées. */
function estChampInterdit(cle) {
  return CHAMPS_INTERDITS.has(cle) || /millimes$/i.test(cle)
}

export function assainir(valeur) {
  if (Array.isArray(valeur)) return valeur.map(assainir)
  if (valeur && typeof valeur === 'object' && !(valeur instanceof Date)) {
    return Object.fromEntries(
      Object.entries(valeur)
        .filter(([cle]) => !estChampInterdit(cle))
        .map(([cle, enfant]) => [cle, assainir(enfant)])
    )
  }
  return valeur
}

function commeDate(valeur) {
  if (valeur === undefined || valeur === null || valeur === '') return null
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Période globale : fin = maintenant, début = 1er janvier de l'année courante. */
export function resoudrePeriodeRapport(debut, fin) {
  const dateFin = commeDate(fin) ?? new Date()
  const dateDebut =
    commeDate(debut) ?? new Date(new Date().getFullYear(), 0, 1)

  if (dateFin.getTime() < dateDebut.getTime()) {
    throw new ApiError(400, 'La date de fin doit être postérieure à la date de début')
  }

  return { debut: dateDebut, fin: dateFin }
}

function periodeFormatee(periode) {
  return {
    debut: periode.debut.toISOString(),
    fin: periode.fin.toISOString(),
  }
}

function tronquer(liste) {
  const elements = Array.isArray(liste) ? liste : []
  return {
    elements: elements.slice(0, LIMITE_DETAILS),
    total: elements.length,
    tronque: elements.length > LIMITE_DETAILS,
  }
}

function arrondir(valeur) {
  return Math.round((valeur ?? 0) * 100) / 100
}

function sourceDonnees(periodeAppliquee, precision = '') {
  return {
    origine: 'MongoDB — données réelles, calculées à la demande',
    periodeAppliquee,
    ...(precision ? { precision } : {}),
  }
}

async function construireAnimauxCultures(periode) {
  const [animaux, parcelles, cycles, listeAnimaux, listeParcelles, listeCycles] =
    await Promise.all([
      getStatistiquesAnimaux(),
      getStatistiquesParcelles(),
      getStatistiquesCycles(),
      listerAnimaux(),
      listerParcelles(),
      listerCycles(),
    ])

  const details = {
    animaux: tronquer(listeAnimaux),
    parcelles: tronquer(listeParcelles),
    cycles: tronquer(listeCycles),
  }

  return {
    periode: periodeFormatee(periode),
    source: sourceDonnees(
      false,
      "Les effectifs animaux, parcelles et cycles ne portent pas de date : ils reflètent l'état actuel de la base."
    ),
    indicateurs: { animaux, parcelles, cycles },
    details,
    limites: {
      detailsParTableau: LIMITE_DETAILS,
      detailsTronques: Object.values(details).some((tableau) => tableau.tronque),
    },
  }
}

/**
 * Les quantités sont lues exclusivement dans le grand livre des mouvements
 * confirmés. Les incohérences avec la projection sont signalées, jamais corrigées.
 */
async function construireStocks(periode) {
  const [produits, statistiquesMouvements, incoherences, mouvements] =
    await Promise.all([
      listerProduits(),
      getStatistiquesStocks({ debut: periode.debut, fin: periode.fin }),
      getIncoherences(),
      listerMouvements({ debut: periode.debut, fin: periode.fin }),
    ])

  const maintenant = new Date()
  const stocks = await Promise.all(
    produits.map(async (produit) => {
      const quantiteLedger = await calculerStockLedger(produit.id)
      const alerte = determinerAlerte(
        { ...produit, quantiteDisponible: quantiteLedger },
        maintenant
      )
      return {
        id: produit.id,
        name: produit.name ?? '',
        categorie: produit.categorie ?? '',
        unite: produit.unite ?? '',
        quantiteLedger,
        seuilMinimum: produit.seuilMinimum ?? 0,
        prixUnitaire: produit.prixUnitaire ?? 0,
        dateExpiration: produit.dateExpiration ?? null,
        alerte,
      }
    })
  )

  const valeurTotaleStockLedger = arrondir(
    stocks.reduce(
      (total, produit) => total + produit.quantiteLedger * produit.prixUnitaire,
      0
    )
  )

  const compteursAlertes = { rupture: 0, faible: 0, proche: 0, expire: 0 }
  for (const produit of stocks) {
    if (produit.alerte && produit.alerte in compteursAlertes) {
      compteursAlertes[produit.alerte] += 1
    }
  }

  const produitsDesynchronises = incoherences.produitsDesynchronises ?? []
  const detailsMouvements = tronquer(mouvements)

  return {
    periode: periodeFormatee(periode),
    source: sourceDonnees(
      true,
      'Quantités issues du grand livre (mouvements confirmés). Aucune correction de projection appliquée.'
    ),
    indicateurs: {
      totalProduits: stocks.length,
      valeurTotaleStockLedger,
      uniteValeur: 'DT (prix unitaire × quantité du grand livre)',
      produitsStockFaible: compteursAlertes.faible,
      produitsExpires: compteursAlertes.expire,
      nombreMouvements: statistiquesMouvements.nombreMouvements ?? 0,
      entrees: statistiquesMouvements.entrees ?? { nombre: 0, quantite: 0 },
      sorties: statistiquesMouvements.sorties ?? { nombre: 0, quantite: 0 },
      alertes: compteursAlertes,
      periodeMouvements: statistiquesMouvements.periode ?? periodeFormatee(periode),
    },
    incoherences: {
      nombreProduitsDesynchronises: produitsDesynchronises.length,
      produitsDesynchronises,
      nombreMouvementsEnAttente: incoherences.mouvementsEnAttente?.length ?? 0,
      lectureSeule: true,
    },
    details: {
      produits: tronquer(stocks),
      mouvements: detailsMouvements,
    },
    limites: {
      detailsParTableau: LIMITE_DETAILS,
      detailsTronques: detailsMouvements.tronque,
    },
  }
}

function construireVeterinaire(periode) {
  return Promise.all([
    getStatistiquesVeterinaires({ debut: periode.debut, fin: periode.fin }),
    getAlertesVeterinaires({}),
  ]).then(([statistiques, alertes]) => ({
    periode: periodeFormatee(periode),
    source: sourceDonnees(
      'partielle',
      'Seules les consultations sont filtrées par la période ; les autres compteurs reflètent la base actuelle.'
    ),
    indicateurs: statistiques,
    alertes: {
      rappelsEnRetard: alertes.rappelRetard?.count ?? 0,
      rappelsProches: alertes.rappelProche?.count ?? 0,
      traitementsEnCours: alertes.traitementEnCours?.count ?? 0,
      maladiesActives: alertes.maladieActive?.count ?? 0,
      delaiJours: alertes.delaiJours ?? null,
    },
    limites: { detailsParTableau: LIMITE_DETAILS, detailsTronques: false },
  }))
}

async function construireFinances(periode) {
  const synthese = await getSyntheseFinanciere({
    debut: periode.debut,
    fin: periode.fin,
  })

  return {
    periode: periodeFormatee(periode),
    source: sourceDonnees(
      true,
      'Montants affichés en DT (décimal de restitution). Les champs millimes sont masqués.'
    ),
    synthese,
    limites: {
      operationsSynthese: 1000,
      operationsExportCsv: 10000,
      note: 'La synthèse présente au maximum 1 000 opérations ; le détail complet est disponible via l’export CSV (10 000).',
    },
  }
}

async function construireEmployesTaches(periode, utilisateur) {
  const [employes, employesListe, tachesStats, taches, notifications] =
    await Promise.all([
      getStatistiquesEmployes(),
      listerEmployesSource({ limit: LIMITE_DETAILS }, utilisateur),
      getStatistiquesTaches(utilisateur),
      listerTaches(
        { debut: periode.debut, fin: periode.fin, limit: LIMITE_DETAILS },
        utilisateur
      ),
      getStatistiquesNotifications(utilisateur),
    ])

  /* Seules les colonnes non salariales sont exposées : les salaires restent
     confidentiels même pour le module Rapports réservé à l'encadrement. */
  const employesAbreges = (employesListe.items ?? []).map((employe) => ({
    id: employe.id,
    nom: employe.nom ?? '',
    prenoms: employe.prenoms ?? '',
    fonction: employe.fonction ?? '',
    statut: employe.statut ?? '',
    dateRecrutement: employe.dateRecrutement ?? null,
  }))

  return {
    periode: periodeFormatee(periode),
    source: sourceDonnees(
      'partielle',
      'Les effectifs sont globaux ; les tâches sont filtrées par échéance sur la période. Les filtres personnels sont conservés.'
    ),
    indicateurs: {
      employes,
      taches: tachesStats,
      notifications,
    },
    details: {
      employes: {
        elements: employesAbreges,
        total: employes.pagination?.total ?? employesAbreges.length,
        tronque: (employes.pagination?.total ?? 0) > employesAbreges.length,
      },
      taches: {
        elements: taches.items ?? [],
        total: taches.pagination?.total ?? 0,
        tronque: (taches.pagination?.total ?? 0) > (taches.items ?? []).length,
      },
    },
    limites: {
      detailsParTableau: LIMITE_DETAILS,
      detailsTronques:
        (employes.pagination?.total ?? 0) > employesAbreges.length ||
        (taches.pagination?.total ?? 0) > (taches.items ?? []).length,
    },
  }
}

const CONSTRUCTEURS = {
  'animaux-cultures': (periode) => construireAnimauxCultures(periode),
  stocks: (periode) => construireStocks(periode),
  veterinaire: (periode) => construireVeterinaire(periode),
  finances: (periode) => construireFinances(periode),
  'employes-taches': (periode, utilisateur) =>
    construireEmployesTaches(periode, utilisateur),
}

function messageErreur(erreur) {
  if (erreur instanceof ApiError) return erreur.message
  if (erreur instanceof Error) return erreur.message
  return 'Erreur inconnue lors du calcul du domaine'
}

/** Synthèse multi-domaines : un domaine en échec n'annule pas les autres. */
export async function getRapportSynthese(filtres = {}, utilisateur) {
  const periode = resoudrePeriodeRapport(filtres.debut, filtres.fin)
  const domaines = {}
  const erreurs = []

  const resultats = await Promise.allSettled(
    DOMAINES_RAPPORT.map(async (nom) => ({
      nom,
      donnees: await CONSTRUCTEURS[nom](periode, utilisateur),
    }))
  )

  resultats.forEach((resultat, index) => {
    const nom = DOMAINES_RAPPORT[index]
    if (resultat.status === 'fulfilled') {
      domaines[nom] = { statut: 'ok', donnees: resultat.value.donnees }
    } else {
      const message = messageErreur(resultat.reason)
      domaines[nom] = { statut: 'erreur', erreur: message }
      erreurs.push({ domaine: nom, message })
    }
  })

  return assainir({
    periode: periodeFormatee(periode),
    genereLe: new Date().toISOString(),
    source: 'MongoDB — données réelles, calculées à la demande',
    domaines,
    erreurs,
  })
}

/** Rapport d'un seul domaine (un onglet de l'interface). */
export async function getRapportDomaine(domaine, filtres = {}, utilisateur) {
  if (!DOMAINES_RAPPORT.includes(domaine)) {
    throw new ApiError(400, `Domaine de rapport inconnu : ${domaine}`)
  }

  const periode = resoudrePeriodeRapport(filtres.debut, filtres.fin)
  const donnees = await CONSTRUCTEURS[domaine](periode, utilisateur)
  return assainir(donnees)
}
