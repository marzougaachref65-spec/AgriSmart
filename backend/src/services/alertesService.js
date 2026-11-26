import Employe from '../models/Employe.js'
import OperationFinanciere from '../models/OperationFinanciere.js'
import Tache from '../models/Tache.js'
import User from '../models/User.js'
import { ApiError } from '../utils/apiError.js'
import { formaterMillimesDT } from '../utils/refsFinancieres.js'
import { getAlertesStock } from './stockService.js'
import { getAlertes } from './veterinaireService.js'
import { creerNotifications, desactiverAlertes } from './notificationService.js'

/** Horizon d'alerte validé : 3 jours pour les tâches, 7 jours pour les finances. */
export const DELAI_RAPPEL_TACHE_JOURS = 3
export const DELAI_ECHEANCE_FINANCE_JOURS = 7

const JOUR_MS = 24 * 60 * 60 * 1000
const STATUTS_TERMINAUX = ['Terminée', 'Annulée']

function commeDate(valeur) {
  if (!valeur) return null
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

function dateCle(valeur) {
  const date = commeDate(valeur)
  if (!date) return 'sans-date'
  return date.toISOString().slice(0, 10)
}

function dateFr(valeur) {
  const date = commeDate(valeur)
  if (!date) return 'date non précisée'
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function identifiant(valeur) {
  if (!valeur) return null
  if (typeof valeur === 'object' && (valeur._id || valeur.id)) {
    return (valeur._id ?? valeur.id).toString()
  }
  return valeur.toString()
}

function idsUniques(valeurs) {
  return [...new Set(valeurs.map(identifiant).filter(Boolean))]
}

async function destinatairesEncadrement() {
  const comptes = await User.find({
    role: { $in: ['ADMIN', 'MANAGER'] },
    isActive: true,
  }).select('_id')
  return comptes.map((compte) => compte._id.toString())
}

async function comptesDesEmployes(employes) {
  const ids = idsUniques(employes)
  if (ids.length === 0) return []
  const fiches = await Employe.find({
    _id: { $in: ids },
    statut: 'Actif',
    utilisateur: { $ne: null },
  }).select('utilisateur')
  const comptes = await User.find({
    _id: { $in: fiches.map((fiche) => fiche.utilisateur) },
    role: 'EMPLOYEE',
    isActive: true,
  }).select('_id')
  return comptes.map((compte) => compte._id.toString())
}

async function destinatairesTache(tache) {
  return idsUniques([
    ...(await comptesDesEmployes(tache.employes ?? [])),
    ...(await destinatairesEncadrement()),
  ])
}

/* --------------------------- événements tâches -------------------------- */

/** Notification ponctuelle émise juste après la création d'une tâche réelle. */
export async function notifierCreationTache(tache) {
  const destinataires = await destinatairesTache(tache)
  if (destinataires.length === 0) return { creees: 0, ignorees: 0, destinataires: 0 }

  return creerNotifications({
    destinataires,
    type: 'TACHE_NOUVELLE',
    niveau: ['Urgente', 'Haute'].includes(tache.priorite)
      ? 'Avertissement'
      : 'Info',
    titre: `Nouvelle tâche — ${tache.reference}`,
    message: `La tâche « ${tache.titre} » a été créée. Échéance : ${dateFr(tache.dateEcheance)}.`,
    source: {
      module: 'Taches',
      referenceId: identifiant(tache),
      reference: tache.reference ?? '',
    },
    genre: 'evenement',
    cleUnicite: `TACHE_CREATION:${identifiant(tache)}`,
    dateEvenement: commeDate(tache.dateEcheance),
  })
}

/** Notification ponctuelle émise lors d'un changement réel d'affectation. */
export async function notifierAffectationTache(tache, ajoutes = [], retires = []) {
  if (ajoutes.length === 0 && retires.length === 0) {
    return { creees: 0, ignorees: 0, destinataires: 0 }
  }

  const employes = idsUniques([...ajoutes, ...retires])
  const destinataires = idsUniques([
    ...(await comptesDesEmployes(employes)),
    ...(await destinatairesEncadrement()),
  ])
  if (destinataires.length === 0) return { creees: 0, ignorees: 0, destinataires: 0 }

  const horodatage = (commeDate(tache.updatedAt) ?? new Date()).toISOString()
  return creerNotifications({
    destinataires,
    type: 'TACHE_AFFECTATION',
    niveau: 'Info',
    titre: `Affectation modifiée — ${tache.reference}`,
    message: `La tâche « ${tache.titre} » a été réaffectée : ${ajoutes.length} ajout(s), ${retires.length} retrait(s).`,
    source: {
      module: 'Taches',
      referenceId: identifiant(tache),
      reference: tache.reference ?? '',
    },
    genre: 'evenement',
    cleUnicite: `TACHE_AFFECTATION:${identifiant(tache)}:${horodatage}`,
    dateEvenement: commeDate(tache.dateEcheance),
  })
}

/* ----------------------------- collecteurs ------------------------------ */

async function collecterTaches(maintenant) {
  const limite = new Date(maintenant.getTime() + DELAI_RAPPEL_TACHE_JOURS * JOUR_MS)
  const taches = await Tache.find({
    statut: { $nin: STATUTS_TERMINAUX },
    dateEcheance: { $lte: limite },
  })
    .select('reference titre priorite statut dateEcheance employes')
    .sort({ dateEcheance: 1 })

  const cleesActives = []
  let creees = 0
  let ignorees = 0

  for (const tache of taches) {
    const echeance = commeDate(tache.dateEcheance)
    if (!echeance) continue

    const enRetard = echeance.getTime() < maintenant.getTime()
    const type = enRetard ? 'TACHE_RETARD' : 'TACHE_ECHEANCE_PROCHE'
    const niveau = enRetard ? 'Urgent' : 'Avertissement'
    /* Clé stable : identique tant que l'échéance et l'état ne changent pas. */
    const cle = `${type}:${identifiant(tache)}:${dateCle(echeance)}`
    cleesActives.push(cle)

    const destinataires = await destinatairesTache(tache)
    const resultat = await creerNotifications({
      destinataires,
      type,
      niveau,
      titre: enRetard
        ? `Tâche en retard — ${tache.reference}`
        : `Échéance proche — ${tache.reference}`,
      message: enRetard
        ? `La tâche « ${tache.titre} » a dépassé son échéance du ${dateFr(echeance)}.`
        : `La tâche « ${tache.titre} » arrive à échéance le ${dateFr(echeance)}.`,
      source: {
        module: 'Taches',
        referenceId: identifiant(tache),
        reference: tache.reference ?? '',
      },
      genre: 'etat',
      cleUnicite: cle,
      dateEvenement: echeance,
    })
    creees += resultat.creees
    ignorees += resultat.ignorees
  }

  const resolues = await desactiverAlertes('Taches', cleesActives)
  return { tachesExaminees: taches.length, creees, ignorees, resolues }
}

async function collecterVeterinaire(maintenant) {
  const alertes = await getAlertes({ jours: 30 })
  const destinataires = await destinatairesEncadrement()
  const cleesActives = []
  let creees = 0
  let ignorees = 0

  for (const groupe of ['rappelRetard', 'rappelProche', 'traitementEnCours', 'maladieActive']) {
    for (const element of alertes[groupe]?.items ?? []) {
      const reference = element.id ?? `${element.source}:${element.sourceId}`
      const cle = `VET:${reference}:${dateCle(element.date)}`
      cleesActives.push(cle)

      /* getAlertes() aplatit les indicateurs : la catégorie est portée par
         le groupe, et le type métier par element.type. */
      let type = 'SOIN'
      if (groupe === 'traitementEnCours') type = 'TRAITEMENT'
      else if (element.type === 'Rappel de vaccination') type = 'VACCINATION_RAPPEL'

      const niveau = groupe === 'rappelRetard' ? 'Urgent' : 'Avertissement'
      const animal = element.animal?.name
        ? ` pour ${element.animal.name}`
        : ''
      const titreGroupe =
        groupe === 'rappelRetard'
          ? 'Rappel en retard'
          : groupe === 'rappelProche'
            ? 'Rappel proche'
            : groupe === 'traitementEnCours'
              ? 'Traitement en cours'
              : 'Maladie active'
      const resultat = await creerNotifications({
        destinataires,
        type,
        niveau,
        titre: `${titreGroupe} — ${element.titre}`,
        message: `${element.titre}${animal}. Date : ${dateFr(element.date)}.`,
        source: {
          module: 'Veterinaire',
          referenceId: element.sourceId ?? null,
          reference: String(reference),
        },
        genre: 'etat',
        cleUnicite: cle,
        dateEvenement: commeDate(element.date),
      })
      creees += resultat.creees
      ignorees += resultat.ignorees
    }
  }

  const resolues = await desactiverAlertes('Veterinaire', cleesActives)
  return { elementsExamines: cleesActives.length, creees, ignorees, resolues }
}

async function collecterStock(maintenant) {
  const alertes = await getAlertesStock()
  const destinataires = await destinatairesEncadrement()
  const cleesActives = []
  let creees = 0
  let ignorees = 0

  const configurations = [
    ['rupture', 'STOCK_RUPTURE', 'Urgent'],
    ['faible', 'STOCK_FAIBLE', 'Avertissement'],
    ['expire', 'STOCK_EXPIRATION', 'Urgent'],
  ]

  for (const [etat, type, niveau] of configurations) {
    for (const produit of alertes[etat]?.produits ?? []) {
      const identifiantProduit = identifiant(produit)
      const cle = `STOCK:${identifiantProduit}:${etat}`
      cleesActives.push(cle)

      const quantite = Number(produit.quantiteDisponible ?? 0)
      const libelleEtat =
        etat === 'rupture'
          ? 'est en rupture de stock'
          : etat === 'expire'
            ? 'a dépassé sa date d’expiration'
            : `est sous son seuil minimum (${produit.seuilMinimum ?? 0} ${produit.unite ?? ''})`.trim()

      const resultat = await creerNotifications({
        destinataires,
        type,
        niveau,
        titre: `${type === 'STOCK_RUPTURE' ? 'Rupture' : type === 'STOCK_EXPIRATION' ? 'Expiration' : 'Stock faible'} — ${produit.name}`,
        message: `Le produit « ${produit.name} » ${libelleEtat}. Quantité : ${quantite} ${produit.unite ?? ''}.`,
        source: {
          module: 'Stocks',
          referenceId: identifiantProduit,
          reference: produit.name ?? '',
        },
        genre: 'etat',
        cleUnicite: cle,
        dateEvenement: commeDate(produit.dateExpiration),
      })
      creees += resultat.creees
      ignorees += resultat.ignorees
    }
  }

  const resolues = await desactiverAlertes('Stocks', cleesActives)
  return {
    produitsExamines: alertes.rupture.count + alertes.faible.count + alertes.expire.count,
    creees,
    ignorees,
    resolues,
  }
}

async function collecterFinances(maintenant) {
  const operations = await OperationFinanciere.find({
    statut: 'Actif',
    statutPaiement: { $ne: 'Payé' },
  })
    .select('reference libelle type montantMillimes dateEcheance statutPaiement')
    .sort({ dateEcheance: 1 })

  const destinataires = await destinatairesEncadrement()
  const cleesActives = []
  let creees = 0
  let ignorees = 0
  const limite = new Date(
    maintenant.getTime() + DELAI_ECHEANCE_FINANCE_JOURS * JOUR_MS
  )

  for (const operation of operations) {
    const echeance = commeDate(operation.dateEcheance)
    let etat = 'IMPAYEE'
    let type = 'FINANCE_IMPAYEE'
    let niveau = 'Avertissement'
    let precision = 'sans échéance précise'

    if (echeance && echeance.getTime() < maintenant.getTime()) {
      etat = 'ECHEANCE_DEPASSEE'
      type = 'FINANCE_ECHEANCE_DEPASSEE'
      niveau = 'Urgent'
      precision = `échéance dépassée du ${dateFr(echeance)}`
    } else if (echeance && echeance.getTime() <= limite.getTime()) {
      etat = 'ECHEANCE_PROCHE'
      type = 'FINANCE_ECHEANCE_PROCHE'
      precision = `échéance le ${dateFr(echeance)}`
    }

    const cle = `FIN:${identifiant(operation)}:${etat}`
    cleesActives.push(cle)
    const montant = formaterMillimesDT(operation.montantMillimes)

    const resultat = await creerNotifications({
      destinataires,
      type,
      niveau,
      titre: `${type === 'FINANCE_ECHEANCE_DEPASSEE' ? 'Échéance dépassée' : type === 'FINANCE_ECHEANCE_PROCHE' ? 'Échéance proche' : 'Impayé'} — ${operation.reference}`,
      message: `L’opération « ${operation.libelle} » (${operation.type}) d’un montant de ${montant} est impayée, ${precision}.`,
      source: {
        module: 'Finances',
        referenceId: identifiant(operation),
        reference: operation.reference ?? '',
      },
      genre: 'etat',
      cleUnicite: cle,
      dateEvenement: echeance,
      montantMillimes: operation.montantMillimes,
    })
    creees += resultat.creees
    ignorees += resultat.ignorees
  }

  const resolues = await desactiverAlertes('Finances', cleesActives)
  return {
    operationsExaminees: operations.length,
    creees,
    ignorees,
    resolues,
  }
}

/**
 * Génère toutes les alertes d'état. Une panne isolée est journalisée et
 * explicitement renvoyée dans `erreurs` : elle n'est jamais masquée.
 */
export async function genererToutesLesAlertes({ maintenant = new Date() } = {}) {
  const collecteurs = [
    ['Taches', collecterTaches],
    ['Veterinaire', collecterVeterinaire],
    ['Stocks', collecterStock],
    ['Finances', collecterFinances],
  ]

  const resultats = await Promise.allSettled(
    collecteurs.map(([, collecteur]) => collecteur(maintenant))
  )

  const rapport = {
    executeLe: maintenant.toISOString(),
    modules: {},
    erreurs: [],
  }

  for (let index = 0; index < resultats.length; index += 1) {
    const [nom] = collecteurs[index]
    const resultat = resultats[index]
    if (resultat.status === 'fulfilled') {
      rapport.modules[nom] = resultat.value
    } else {
      const erreur = resultat.reason
      const detail = {
        module: nom,
        message: erreur?.message ?? String(erreur),
      }
      rapport.erreurs.push(detail)
      console.error(
        `[NOTIFICATIONS] Erreur de génération (${nom}) : ${detail.message}`
      )
    }
  }

  if (rapport.erreurs.length === collecteurs.length) {
    throw new ApiError(500, 'Échec de la génération des alertes')
  }

  return rapport
}
