import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'
import { createUserByAdmin } from '../services/authService.js'

export const createUserController = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body
  const user = await createUserByAdmin(
    { name, email, password, role },
    req.user._id
  )

  return sendSuccess(res, { user }, 'Compte créé avec succès', 201)
})
