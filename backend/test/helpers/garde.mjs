/**
 * Garde absolue : aucun test ne peut s'exécuter contre la base réelle.
 * Ce module est importé en premier par chaque fichier de test.
 */

function nomBase(uri) {
  if (typeof uri !== 'string' || uri.trim() === '') return ''
  const sansProtocole = uri.replace(/^mongodb(?:\+srv)?:\/\//, '')
  const sansOptions = sansProtocole.split('?')[0]
  const segments = sansOptions.split('/').filter(Boolean)
  return segments.length > 1 ? segments[segments.length - 1] : ''
}

export function verifierEnvironnementTest() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      'REFUS SÉCURITÉ : NODE_ENV doit être exactement "test" pour exécuter les tests.'
    )
  }

  const base = nomBase(process.env.MONGO_URI ?? '')
  if (base.toLowerCase() === 'agrismart') {
    throw new Error(
      'REFUS SÉCURITÉ : la base cible est "agrismart". Aucun test ne doit écrire dans la base réelle.'
    )
  }
  if (!/^[A-Za-z0-9_-]+$/.test(base)) {
    throw new Error(
      'REFUS SÉCURITÉ : MONGO_URI doit contenir un nom de base de test explicite (ex. agrismart_test).'
    )
  }
  return base
}

verifierEnvironnementTest()
