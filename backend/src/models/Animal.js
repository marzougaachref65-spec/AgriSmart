import mongoose from 'mongoose'

export const ESPECES_ANIMAL = ['Bovin', 'Ovin', 'Caprin', 'Volaille', 'Autre']
export const SEXES_ANIMAL = ['Mâle', 'Femelle']
export const STATUTS_ANIMAL = ['Actif', 'Malade', 'Vendu', 'Décédé']

const animalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom ou numéro d'identification est requis"],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    espece: {
      type: String,
      required: [true, "L'espèce est requise"],
      enum: {
        values: ESPECES_ANIMAL,
        message: 'Espèce invalide',
      },
    },
    race: {
      type: String,
      trim: true,
      maxlength: [100, 'La race ne peut pas dépasser 100 caractères'],
      default: '',
    },
    sexe: {
      type: String,
      required: [true, 'Le sexe est requis'],
      enum: {
        values: SEXES_ANIMAL,
        message: 'Sexe invalide',
      },
    },
    dateNaissance: {
      type: Date,
      default: null,
    },
    poids: {
      type: Number,
      min: [0, 'Le poids ne peut pas être négatif'],
      default: null,
    },
    statut: {
      type: String,
      required: true,
      enum: {
        values: STATUTS_ANIMAL,
        message: 'Statut invalide',
      },
      default: 'Actif',
    },
    dateAcquisition: {
      type: Date,
      default: null,
    },
    prixAcquisition: {
      type: Number,
      min: [0, 'Le prix ne peut pas être négatif'],
      default: null,
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

animalSchema.index({ name: 1 })

/**
 * Sortie API stable : `id` en chaîne, jamais `_id` ni `__v`.
 */
animalSchema.methods.toJSON = function () {
  const { _id, ...reste } = this.toObject()
  return { id: _id.toString(), ...reste }
}

export default mongoose.model('Animal', animalSchema)
