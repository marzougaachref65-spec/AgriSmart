import mongoose from 'mongoose'

export const STATUTS_CYCLE = ['Planifiée', 'En cours', 'Récoltée', 'Annulée']

const cycleCultureSchema = new mongoose.Schema(
  {
    parcelle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parcelle',
      required: [true, 'La parcelle associée est requise'],
      index: true,
    },
    typeCulture: {
      type: String,
      required: [true, 'Le type de culture est requis'],
      trim: true,
      maxlength: [100, 'Le type de culture ne peut pas dépasser 100 caractères'],
    },
    variete: {
      type: String,
      trim: true,
      maxlength: [100, 'La variété ne peut pas dépasser 100 caractères'],
      default: '',
    },
    dateSemis: {
      type: Date,
      required: [true, 'La date de semis est requise'],
    },
    datePrevueRecolte: {
      type: Date,
      required: [true, 'La date prévue de récolte est requise'],
    },
    dateRecolteReelle: {
      type: Date,
      default: null,
    },
    quantiteRecoltee: {
      type: Number,
      min: [0, 'La quantité récoltée ne peut pas être négative'],
      default: null,
    },
    statut: {
      type: String,
      required: true,
      enum: {
        values: STATUTS_CYCLE,
        message: 'Statut invalide',
      },
      default: 'Planifiée',
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

cycleCultureSchema.index({ parcelle: 1, createdAt: -1 })

/**
 * Sortie API stable : `id` en chaîne, jamais `_id` ni `__v`.
 */
cycleCultureSchema.methods.toJSON = function () {
  const { _id, ...reste } = this.toObject()
  return { id: _id.toString(), ...reste }
}

export default mongoose.model('CycleCulture', cycleCultureSchema)
