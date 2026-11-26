import mongoose from 'mongoose'
import { env } from './env.js'

/**
 * Établit la connexion Mongoose à la base MongoDB `agrismart`.
 */
export async function connectDB() {
  mongoose.set('strictQuery', true)

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  })

  return mongoose.connection
}
