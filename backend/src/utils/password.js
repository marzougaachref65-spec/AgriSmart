const reglesMotDePasse = [
  {
    test: ( valeur ) => valeur.length >= 12,
    message: 'au moins 12 caractères',
  },
  {
    test: ( valeur ) => /[a-z]/.test( valeur ),
    message: 'une minuscule',
  },
  {
    test: ( valeur ) => /[A-Z]/.test( valeur ),
    message: 'une majuscule',
  },
  {
    test: ( valeur ) => /\d/.test( valeur ),
    message: 'un chiffre',
  },
  {
    test: ( valeur ) => /[^A-Za-z0-9]/.test( valeur ),
    message: 'un caractère spécial',
  },
]

/**
 * Validation partagée entre l'API et le script de création du premier ADMIN.
 * Retourne `null` si le mot de passe est valide, sinon un message en français.
 */
export function validerMotDePasse(motDePasse) {
  if (typeof motDePasse !== 'string') {
    return 'Le mot de passe doit être une chaîne de caractères'
  }

  const manquants = reglesMotDePasse
    .filter((regle) => !regle.test(motDePasse))
    .map((regle) => regle.message)

  if (manquants.length === 0) return null

  return `Le mot de passe doit contenir : ${manquants.join(', ')}`
}

/**
 * Validation d'adresse e-mail partagée.
 */
export function validerEmail(email) {
  if (
    typeof email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return 'Adresse e-mail invalide'
  }

  return null
}
