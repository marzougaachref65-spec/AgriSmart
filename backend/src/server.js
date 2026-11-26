import mongoose from 'mongoose'
import app from './app.js'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import {
  arreterPlanificateur,
  demarrerPlanificateur,
} from './jobs/planificateurAlertes.js'

let arretEnCours = false

async function demarrer() {
  try {
    await connectDB()
    console.log('MongoDB connectée : base "agrismart"')

    const serveur = app.listen(env.port, () => {
      console.log(`Backend AgriSmart démarré sur http://localhost:${env.port}`)
    })

    demarrerPlanificateur()

    async function arreter(signal) {
      if (arretEnCours) return
      arretEnCours = true
      console.log(`Arrêt ${signal} demandé.`)

      serveur.close(async () => {
        try {
          await arreterPlanificateur()
          await mongoose.disconnect()
          console.log('Arrêt terminé.')
          process.exit(0)
        } catch (erreur) {
          console.error('Erreur pendant l’arrêt :', erreur)
          process.exit(1)
        }
      })
    }

    process.on('SIGTERM', () => arreter('SIGTERM'))
    process.on('SIGINT', () => arreter('SIGINT'))
  } catch (erreur) {
    console.error('Démarrage impossible :', erreur.message)
    process.exit(1)
  }
}

demarrer()
