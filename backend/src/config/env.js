import dotenv from 'dotenv'

dotenv.config()

const variablesRequises = ['PORT', 'MONGO_URI', 'JWT_SECRET', 'CORS_ORIGIN']
const manquantes = variablesRequises.filter((cle) => !process.env[cle])

if (manquantes.length > 0) {
  throw new Error(
    `Variables d'environnement manquantes : ${manquantes.join(', ')}`
  )
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN,
}
