import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

export const ROLES_UTILISATEUR = ['ADMIN', 'MANAGER', 'EMPLOYEE']

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    email: {
      type: String,
      required: [true, "L'e-mail est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Adresse e-mail invalide',
      ],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      select: false,
      minlength: [12, 'Le mot de passe doit contenir au moins 12 caractères'],
    },
    role: {
      type: String,
      required: true,
      enum: {
        values: ROLES_UTILISATEUR,
        message: 'Rôle invalide',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

/**
 * Hachage automatique avec bcryptjs, uniquement lorsque le mot de passe change.
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

/**
 * Comparaison sécurisée du mot de passe fourni lors du login.
 */
userSchema.methods.comparePassword = function (candidat) {
  return bcrypt.compare(candidat, this.password)
}

/**
 * Le mot de passe ne quitte jamais le modèle, même en cas de sérialisation.
 */
userSchema.methods.toJSON = function () {
  const objet = this.toObject()
  delete objet.password
  return objet
}

export default mongoose.model('User', userSchema)
