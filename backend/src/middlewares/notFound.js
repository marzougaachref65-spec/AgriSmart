/**
 * Gestion des routes inexistantes.
 */
export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.method} ${req.originalUrl}`,
    data: null,
  })
}
