import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { login, getUserById } from '../services/authService.js'

export const loginController = asyncHandler(async (req, res) => {
  const resultat = await login(req.body.email, req.body.password)
  return sendSuccess(res, resultat, 'Connexion réussie')
})

export const meController = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user._id)
  return sendSuccess(res, user, 'Profil récupéré')
})
