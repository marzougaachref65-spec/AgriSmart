import mongoose from 'mongoose'

export const TYPES_RAPPEL = [
  'Rappel de vaccination',
  'Visite de contrôle',
  'Renouvellement de traitement',
  'Autre soin',
]
export const STATUTS_RAPPEL = ['Planifié', 'Effectué', 'Annulé']

const rappelSoinSchema = new mongoose.Schema(
  {
    animal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Animal',
      required: [true, "L'animal concerné est requis"],
      index: true,
    },
    dossier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DossierMedical',
      default: null,
    },
    titre: {
      type: String,
      trim: true,
      maxlength: [150, 'Le titre ne peut pas dépasser 150 caractères'],
      default: '',
    },
    type: {
      type: String,
      required: true,
      enum: { values: TYPES_RAPPEL, message: 'Type de rappel invalide' },
    },
    datePrevue: {
      type: Date,
      required: [true, 'La date prévue est requise'],
      index: true,
    },
    statut: {
      type: String,
      required: true,
      enum: { values: STATUTS_RAPPEL, message: 'Statut de rappel invalide' },
      default: 'Planifié',
    },
    dateRealisation: { type: Date, default: null },
    evenementOrigine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EvenementVeterinaire',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Les notes ne peuvent pas dépasser 2000 caractères'],
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le responsable de la saisie est requis'],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

rappelSoinSchema.index({ datePrevue: 1, statut: 1 })
rappelSoinSchema.index({ animal: 1, datePrevue: 1 })

rappelSoinSchema.pre('validate', function () {
  if (this.statut === 'Effectué' && !this.dateRealisation) {
    this.dateRealisation = new Date()
  }
  if (this.statut !== 'Effectué') this.dateRealisation = null
})

/**
 * Sortie API stable : `id` en chaîne, jamais `_id` ni `__v`.
 */
rappelSoinSchema.methods.toJSON = function () {
  const { _id, ...reste } = this.toObject()
  return { id: _id.toString(), ...reste }
}

export default mongoose.model('RappelSoin', rappelSoinSchema)
