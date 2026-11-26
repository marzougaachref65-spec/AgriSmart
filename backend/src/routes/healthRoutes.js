import { Router } from 'express'
import mongoose from 'mongoose'
import { sendSuccess } from '../utils/apiResponse.js'

const router = Router()

const etatsConnexion = [
  'disconnected',
  'connected',
  'connecting',
  'disconnecting',
]

/**
 * Route de vérification technique (aucune donnée métier).
 */
router.get('/', (_req, res) => {
  return sendSuccess(res, {
    service: 'agrismart-backend',
    database: etatsConnexion[mongoose.connection.readyState] ?? 'unknown',
    uptimeSecondes: Math.floor(process.uptime()),
  })
})

export default router
