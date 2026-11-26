import { body } from 'express-validator'

export const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage("L'e-mail est requis")
    .isEmail()
    .withMessage('Adresse e-mail invalide')
    .normalizeEmail(),
  body('password')
    .isString()
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
]
