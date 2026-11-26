import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import {
  listerProduits,
  getProduitById,
  creerProduit,
  updateProduit,
  deleteProduit,
} from '../services/produitService.js'

export const listerProduitsController = asyncHandler(async (req, res) => {
  const produits = await listerProduits(req.query)
  return sendSuccess(res, produits, 'Produits récupérés')
})

export const getProduitController = asyncHandler(async (req, res) => {
  const produit = await getProduitById(req.params.id)
  return sendSuccess(res, produit, 'Produit récupéré')
})

export const creerProduitController = asyncHandler(async (req, res) => {
  const produit = await creerProduit(req.body, req.user)
  return sendSuccess(res, produit, 'Produit créé avec succès', 201)
})

export const updateProduitController = asyncHandler(async (req, res) => {
  const produit = await updateProduit(req.params.id, req.body)
  return sendSuccess(res, produit, 'Produit mis à jour avec succès')
})

export const deleteProduitController = asyncHandler(async (req, res) => {
  const produit = await deleteProduit(req.params.id)
  return sendSuccess(res, produit, 'Produit supprimé avec succès')
})
