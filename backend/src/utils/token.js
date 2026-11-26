import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

/**
 * Signe un JWT. Le secret n'est jamais renvoyé au client.
 */
export function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  )
}

/**
 * Vérifie un JWT. Les erreurs sont traitées par le middleware `protect`.
 */
export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret)
}
