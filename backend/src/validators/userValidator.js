import { body } from 'express-validator'
import { validerMotDePasse } from '../utils/password.js'

export const createUserRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ max: 100 })
    .withMessage('Le nom ne peut pas dépasser 100 caractères'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage("L'e-mail est requis")
    .isEmail()
    .withMessage('Adresse e-mail invalide')
    .normalizeEmail(),
  body('password').custom((valeur) => {
    const erreur = validerMotDePasse(valeur)
    if (erreur) throw new Error(erreur)
    return true
  }),
  body('role')
    .isIn(['MANAGER', 'EMPLOYEE'])
    .withMessage("Le rôle doit être MANAGER ou EMPLOYEE"),
]
