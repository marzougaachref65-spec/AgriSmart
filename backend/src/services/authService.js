import User from '../models/User.js'
import { ApiError } from '../utils/apiError.js'
import { signToken } from '../utils/token.js'

/**
 * Authentification : identifiants génériques en cas d'échec
 * (aucune indication sur l'existence du compte).
 */
export async function login(email, motDePasse) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '+password'
  )

  if (!user || !user.isActive || !(await user.comparePassword(motDePasse))) {
    throw new ApiError(401, 'Identifiants invalides')
  }

  return {
    token: signToken(user),
    user: user.toJSON(),
  }
}

/**
 * Profil de l'utilisateur connecté.
 */
export async function getUserById(id) {
  const user = await User.findById(id)

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Compte introuvable ou désactivé')
  }

  return user.toJSON()
}

/**
 * Création d'un compte par un ADMIN. Les rôles sont contrôlés par le validator.
 */
export async function createUserByAdmin(
  { name, email, password, role },
  adminId
) {
  const user = await User.create({
    name,
    email,
    password,
    role,
    createdBy: adminId,
  })

  return user.toJSON()
}
