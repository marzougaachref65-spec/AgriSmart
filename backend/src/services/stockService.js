import Produit from '../models/Produit.js'
import MouvementStock from '../models/MouvementStock.js'
import { ApiError } from '../utils/apiError.js'

/** Fenêtre de proximité d'expiration : décision validée (30 jours). */
export const DELAI_ALERTE_EXPIRATION_JOURS = 30

const JOUR_MS = 24 * 60 * 60 * 1000

function commeDate(valeur) {
  if (!valeur) return null
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

function arrondir(valeur) {
  return Math.round((valeur ?? 0) * 100) / 100
}

/**
 * Ajoute l'alerte calculée à un produitAlready sérialisé.
 * Priorité : expiré > rupture > stock faible > proche expiration.
 */
export function determinerAlerte(produit, maintenant = new Date()) {
  const expiration = commeDate(produit.dateExpiration)
  const quantite = Number(produit.quantiteDisponible ?? 0)
  const seuil = Number(produit.seuilMinimum ?? 0)

  if (expiration && expiration.getTime() < maintenant.getTime()) return 'expire'
  if (quantite === 0) return 'rupture'
  if (seuil > 0 && quantite > 0 && quantite <= seuil) return 'faible'
  if (
    expiration &&
    expiration.getTime() >= maintenant.getTime() &&
    expiration.getTime() <= maintenant.getTime() + DELAI_ALERTE_EXPIRATION_JOURS * JOUR_MS
  ) {
    return 'proche'
  }
  return null
}

export function avecAlerte(produit, maintenant = new Date()) {
  const objet =
    produit && typeof produit.toJSON === 'function' ? produit.toJSON() : produit
  return { ...objet, alerte: determinerAlerte(objet, maintenant) }
}

function resoudrePeriode(debut, fin) {
  const dateFin = commeDate(fin) ?? new Date()
  const dateDebut =
    commeDate(debut) ?? new Date(dateFin.getTime() - 30 * JOUR_MS)

  if (dateFin.getTime() < dateDebut.getTime()) {
    throw new ApiError(400, 'La date de fin doit être postérieure à la date de début')
  }

  return { debut: dateDebut, fin: dateFin }
}

/** Statistiques calculées exclusivement sur les données MongoDB réelles. */
export async function getStatistiquesStocks({ debut, fin } = {}) {
  const periode = resoudrePeriode(debut, fin)

  const [
    totalProduits,
    produitsStockFaible,
    produitsExpires,
    nombreMouvements,
    sommeValeur,
    entrees,
    sorties,
  ] = await Promise.all([
    Produit.countDocuments({}),
    Produit.countDocuments({
      quantiteDisponible: { $gt: 0 },
      $expr: { $lte: ['$quantiteDisponible', '$seuilMinimum'] },
    }),
    Produit.countDocuments({ dateExpiration: { $lt: periode.fin } }),
    MouvementStock.countDocuments({ statut: { $ne: 'En attente' } }),
    Produit.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: { $multiply: ['$quantiteDisponible', '$prixUnitaire'] },
          },
        },
      },
    ]),
    MouvementStock.aggregate([
      {
        $match: {
          statut: 'Confirmé',
          type: 'Entrée',
          date: { $gte: periode.debut, $lte: periode.fin },
        },
      },
      {
        $group: {
          _id: null,
          nombre: { $sum: 1 },
          quantite: { $sum: '$quantite' },
        },
      },
    ]),
    MouvementStock.aggregate([
      {
        $match: {
          statut: 'Confirmé',
          type: 'Sortie',
          date: { $gte: periode.debut, $lte: periode.fin },
        },
      },
      {
        $group: {
          _id: null,
          nombre: { $sum: 1 },
          quantite: { $sum: '$quantite' },
        },
      },
    ]),
  ])

  return {
    totalProduits,
    valeurTotaleStock: arrondir(sommeValeur[0]?.total),
    produitsStockFaible,
    produitsExpires,
    nombreMouvements,
    periode: {
      debut: periode.debut.toISOString(),
      fin: periode.fin.toISOString(),
    },
    entrees: {
      nombre: entrees[0]?.nombre ?? 0,
      quantite: arrondir(entrees[0]?.quantite),
    },
    sorties: {
      nombre: sorties[0]?.nombre ?? 0,
      quantite: arrondir(sorties[0]?.quantite),
    },
  }
}

/** Alertes calculées à partir des vraies données MongoDB. */
export async function getAlertesStock() {
  const maintenant = new Date()
  const produits = (await Produit.find({}).sort({ name: 1 })).map((produit) =>
    avecAlerte(produit, maintenant)
  )

  const groupe = (alerte) => ({
    count: produits.filter((produit) => produit.alerte === alerte).length,
    produits: produits.filter((produit) => produit.alerte === alerte),
    alerte,
  })

  return {
    rupture: groupe('rupture'),
    faible: groupe('faible'),
    proche: groupe('proche'),
    expire: groupe('expire'),
    delaiExpirationJours: DELAI_ALERTE_EXPIRATION_JOURS,
  }
}
