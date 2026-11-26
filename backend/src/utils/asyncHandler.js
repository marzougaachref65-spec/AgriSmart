/**
 * Transmet les erreurs des contrôleurs asynchrones au middleware d'erreurs.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
