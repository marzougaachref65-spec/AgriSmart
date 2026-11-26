import mongoose from 'mongoose'

export const STATUTS_PARCELLE = ['Disponible', 'Cultivée', 'En repos']

const parcelleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom de la parcelle est requis'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    superficie: {
      type: Number,
      required: [true, 'La superficie est requise'],
      min: [0.000001, 'La superficie doit être supérieure à 0'],
    },
    localisation: {
      type: String,
      trim: true,
      maxlength: [150, 'La localisation ne peut pas dépasser 150 caractères'],
      default: '',
    },
    typeSol: {
      type: String,
      trim: true,
      maxlength: [100, 'Le type de sol ne peut pas dépasser 100 caractères'],
      default: '',
    },
    systemeIrrigation: {
      type: String,
      trim: true,
      maxlength: [100, "Le système d'irrigation ne peut pas dépasser 100 caractères"],
      default: '',
    },
    statut: {
      type: String,
      required: true,
      enum: {
        values: STATUTS_PARCELLE,
        message: 'Statut invalide',
      },
      default: 'Disponible',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Les notes ne peuvent pas dépasser 2000 caractères'],
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

parcelleSchema.index({ name: 1 })

/**
 * Sortie API stable : `id` en chaîne, jamais `_id` ni `__v`.
 */
parcelleSchema.methods.toJSON = function () {
  const { _id, ...reste } = this.toObject()
  return { id: _id.toString(), ...reste }
}

export default mongoose.model('Parcelle', parcelleSchema)
