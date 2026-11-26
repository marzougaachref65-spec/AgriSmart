import mongoose from 'mongoose'

const MAX_NOTES = 2000

const dossierMedicalSchema = new mongoose.Schema(
  {
    animal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Animal',
      required: [true, "L'animal concerné est requis"],
      unique: true,
      index: true,
    },
    notesGenerales: {
      type: String,
      trim: true,
      maxlength: [MAX_NOTES, `Les notes ne peuvent pas dépasser ${MAX_NOTES} caractères`],
      default: '',
    },
    allergies: {
      type: String,
      trim: true,
      maxlength: [MAX_NOTES, `Les allergies ne peuvent pas dépasser ${MAX_NOTES} caractères`],
      default: '',
    },
    antecedents: {
      type: String,
      trim: true,
      maxlength: [MAX_NOTES, `Les antécédents ne peuvent pas dépasser ${MAX_NOTES} caractères`],
      default: '',
    },
    veterinaireReferent: {
      type: String,
      trim: true,
      maxlength: [150, 'Le vétérinaire référent ne peut pas dépasser 150 caractères'],
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le responsable de la création est requis'],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

dossierMedicalSchema.index({ createdAt: -1 })

/**
 * Sortie API stable : `id` en chaîne, jamais `_id` ni `__v`.
 */
dossierMedicalSchema.methods.toJSON = function () {
  const { _id, ...reste } = this.toObject()
  return { id: _id.toString(), ...reste }
}

export default mongoose.model('DossierMedical', dossierMedicalSchema)
