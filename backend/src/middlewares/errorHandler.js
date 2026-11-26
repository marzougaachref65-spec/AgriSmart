/**
 * Gestion centralisée des erreurs Express.
 * Les erreurs 4xx gardent leur message métier ; les erreurs 500 sont génériques
 * afin de ne jamais exposer de détails techniques (ni secrets, ni mot de passe).
 */
export function errorHandler(err, _req, res, _next) {
  let statut = err.statusCode
  let message = err.message

  if (err.type === 'entity.parse.failed') {
    statut = 400
    message = 'Corps de requête JSON invalide'
  } else if (err.code === 11000) {
    statut = 409
    message = 'Cette valeur est déjà utilisée'
  } else if (err.name === 'CastError') {
    statut = 400
    message = 'Identifiant invalide'
  } else if (err.name === 'ValidationError') {
    statut = 400
    message = Object.values(err.errors)
      .map((detail) => detail.message)
      .join(' | ')
  }

  if (!Number.isInteger(statut)) {
    statut = 500
    message = 'Erreur interne du serveur'
  }

  if (statut === 500) {
    console.error('[ERREUR]', err)
  }

  return res.status(statut).json({
    success: false,
    message: message ?? 'Une erreur est survenue',
    data: null,
  })
}
