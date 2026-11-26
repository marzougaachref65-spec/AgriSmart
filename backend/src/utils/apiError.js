/**
 * Erreur applicative avec un code HTTP maîtrisé.
 */
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
    this.name = 'ApiError'
  }
}
