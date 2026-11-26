import mongoose from 'mongoose'
import Produit from '../models/Produit.js'
import MouvementStock from '../models/MouvementStock.js'
import { ApiError } from '../utils/apiError.js'
import { creerMouvementInterne } from './mouvementService.js'
import { avecAlerte } from './stockService.js'

function echapperRegex(valeur) {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function verifierIdentifiant(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Identifiant produit invalide')
  }
}

function nettoyerDonnees(donnees) {
  const {
    quantiteDisponible,
    stockInitial,
    verrou,
    verrouExpireLe,
    ...reste
  } = donnees ?? {}
  return reste
}

export async function listerProduits({
  recherche = '',
  categorie = '',
  alerte = '',
} = {}) {
  const filtre = {}
  if (categorie) filtre.categorie = categorie

  const maintenant = new Date()

  const terme = typeof recherche === 'string' ? recherche.trim() : ''
  if (terme) {
    const motif = echapperRegex(terme)
    filtre.$or = [
      { name: { $regex: motif, $options: 'i' } },
      { fournisseur: { $regex: motif, $options: 'i' } },
    ]
  }

  const produits = await Produit.find(filtre).sort({ createdAt: -1 })
  const avecAlertes = produits.map((produit) => avecAlerte(produit, maintenant))

  // Filtre applicatif pour garantir les mêmes priorités que /api/stocks/alertes.
  if (alerte) return avecAlertes.filter((produit) => produit.alerte === alerte)
  return avecAlertes
}

export async function getProduitById(id) {
  verifierIdentifiant(id)

  const produit = await Produit.findById(id)
  if (!produit) {
    throw new ApiError(404, 'Produit introuvable')
  }

  return avecAlerte(produit)
}

/**
 * Création à quantité 0. Un stock initial, lorsqu'il est fourni,
 * est enregistré comme un vrai mouvement ENTRÉE / Approvisionnement.
 */
export async function creerProduit(donnees, utilisateur) {
  const { stockInitial = 0 } = donnees ?? {}
  const attributs = nettoyerDonnees(donnees)

  const produit = await Produit.create({
    ...attributs,
    quantiteDisponible: 0,
  })

  if (Number(stockInitial) > 0) {
    await creerMouvementInterne(
      {
        produit: produit.id,
        type: 'Entrée',
        motif: 'Approvisionnement',
        quantite: Number(stockInitial),
        date: new Date(),
        notes: 'Stock initial à la création du produit',
      },
      utilisateur
    )
  }

  return getProduitById(produit.id)
}

export async function updateProduit(id, donnees) {
  verifierIdentifiant(id)

  const attributs = nettoyerDonnees(donnees)
  const produit = await Produit.findByIdAndUpdate(id, attributs, {
    new: true,
    runValidators: true,
  })

  if (!produit) {
    throw new ApiError(404, 'Produit introuvable')
  }

  return avecAlerte(produit)
}

/** Refus de suppression tant qu'un mouvement existe, pour préserver la traçabilité. */
export async function deleteProduit(id) {
  verifierIdentifiant(id)

  const nombreMouvements = await MouvementStock.countDocuments({ produit: id })
  if (nombreMouvements > 0) {
    throw new ApiError(
      409,
      `Impossible de supprimer ce produit : ${nombreMouvements} mouvement(s) de stock y sont associé(s). L'historique est immuable.`
    )
  }

  const produit = await Produit.findByIdAndDelete(id)
  if (!produit) {
    throw new ApiError(404, 'Produit introuvable')
  }

  return avecAlerte(produit)
}
