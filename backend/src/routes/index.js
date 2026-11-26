import { Router } from 'express'
import healthRoutes from './healthRoutes.js'
import authRoutes from './authRoutes.js'
import userRoutes from './userRoutes.js'
import animalRoutes from './animalRoutes.js'
import parcelleRoutes from './parcelleRoutes.js'
import cycleRoutes from './cycleRoutes.js'
import produitRoutes from './produitRoutes.js'
import mouvementRoutes from './mouvementRoutes.js'
import stockRoutes from './stockRoutes.js'
import dossierRoutes from './dossierRoutes.js'
import evenementRoutes from './evenementRoutes.js'
import veterinaireRoutes from './veterinaireRoutes.js'
import categorieFinanciereRoutes from './categorieFinanciereRoutes.js'
import operationFinanciereRoutes from './operationFinanciereRoutes.js'
import rapportFinancierRoutes from './rapportFinancierRoutes.js'
import employeRoutes from './employeRoutes.js'
import tacheRoutes from './tacheRoutes.js'
import notificationRoutes from './notificationRoutes.js'
import rapportRoutes from './rapportRoutes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/animals', animalRoutes)
router.use('/parcelles', parcelleRoutes)
router.use('/cycles', cycleRoutes)
router.use('/stocks/produits', produitRoutes)
router.use('/stocks/mouvements', mouvementRoutes)
router.use('/stocks', stockRoutes)
router.use('/veterinaire/dossiers', dossierRoutes)
router.use('/veterinaire/evenements', evenementRoutes)
router.use('/veterinaire', veterinaireRoutes)

router.use('/finances/categories', categorieFinanciereRoutes)
router.use('/finances/operations', operationFinanciereRoutes)
router.use('/finances', rapportFinancierRoutes)

router.use('/employes', employeRoutes)
router.use('/taches', tacheRoutes)
router.use('/notifications', notificationRoutes)

/* Phase 10 — module Rapports isolé, réservé à ADMIN et MANAGER. */
router.use('/rapports', rapportRoutes)

export default router
