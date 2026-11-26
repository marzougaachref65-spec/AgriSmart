import mongoose from 'mongoose'

export const TYPES_EVENEMENT = [
  'Vaccination',
  'Maladie',
  'Traitement',
  'Consultation',
]
export const GRAVITES_MALADIE = ['Légère', 'Modérée', 'Grave']
export const STATUTS_MALADIE = ['En cours', 'Guérie', 'Chronique']
export const STATUTS_TRAITEMENT = ['En cours', 'Terminé', 'Interrompu']
export const NATURES_CONSULTATION = [
  'Consultation',
  'Intervention',
  'Chirurgie',
  'Contrôle',
]

const CHAMPS_REQUIS_PAR_TYPE = {
  Vaccination: ['vaccin'],
  Maladie: ['nomMaladie', 'gravite', 'statutMaladie'],
  Traitement: ['medicament', 'statutTraitement'],
  Consultation: ['nature', 'motif'],
}

const evenementVeterinaireSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'La référence ne peut pas dépasser 100 caractères'],
      unique: true,
      index: true,
    },
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
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: TYPES_EVENEMENT,
        message: 'Type d’événement vétérinaire invalide',
      },
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    libelle: {
      type: String,
      trim: true,
      maxlength: [150, 'Le libellé ne peut pas dépasser 150 caractères'],
      default: '',
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

    /* ---------- Vaccination ---------- */
    vaccin: { type: String, trim: true, maxlength: 150, default: '' },
    lot: { type: String, trim: true, maxlength: 100, default: '' },
    dateRappel: { type: Date, default: null },

    /* ---------- Maladie ---------- */
    nomMaladie: { type: String, trim: true, maxlength: 150, default: '' },
    diagnostic: { type: String, trim: true, maxlength: 2000, default: '' },
    gravite: {
      type: String,
      enum: { values: GRAVITES_MALADIE, message: 'Gravité invalide' },
      default: null,
    },
    dateDebut: { type: Date, default: null },
    dateFin: { type: Date, default: null },
    statutMaladie: {
      type: String,
      enum: { values: STATUTS_MALADIE, message: 'Statut de maladie invalide' },
      default: null,
    },

    /* ---------- Traitement ---------- */
    medicament: { type: String, trim: true, maxlength: 150, default: '' },
    posologie: { type: String, trim: true, maxlength: 500, default: '' },
    dose: { type: Number, min: [0, 'La dose ne peut pas être négative'], default: null },
    motif: { type: String, trim: true, maxlength: 500, default: '' },
    prescripteur: { type: String, trim: true, maxlength: 150, default: '' },
    statutTraitement: {
      type: String,
      enum: { values: STATUTS_TRAITEMENT, message: 'Statut de traitement invalide' },
      default: null,
    },

    /* ---------- Consultation / intervention ---------- */
    nature: {
      type: String,
      enum: { values: NATURES_CONSULTATION, message: 'Nature de consultation invalide' },
      default: null,
    },
    veterinaire: { type: String, trim: true, maxlength: 150, default: '' },
    cout: { type: Number, min: [0, 'Le coût ne peut pas être négatif'], default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

evenementVeterinaireSchema.index({ animal: 1, date: -1 })
evenementVeterinaireSchema.index({ type: 1, date: -1 })

/** Cohérence des champs propres à chaque type, même hors de la couche HTTP. */
evenementVeterinaireSchema.pre('validate', function () {
  const requis = CHAMPS_REQUIS_PAR_TYPE[this.type] ?? []
  for (const champ of requis) {
    const valeur = this[champ]
    if (valeur === undefined || valeur === null || valeur === '') {
      this.invalidate(
        champ,
        `Ce champ est requis pour un événement de type ${this.type}`
      )
    }
  }

  const debut = this.dateDebut instanceof Date ? this.dateDebut.getTime() : null
  const fin = this.dateFin instanceof Date ? this.dateFin.getTime() : null
  if (debut !== null && fin !== null && fin < debut) {
    this.invalidate('dateFin', 'La date de fin doit être postérieure à la date de début')
  }

  if (this.type === 'Vaccination' && this.dateRappel) {
    const dateEvenement = this.date instanceof Date ? this.date.getTime() : null
    if (dateEvenement !== null && this.dateRappel.getTime() < dateEvenement) {
      this.invalidate(
        'dateRappel',
        'La date de rappel ne peut pas précéder la date de vaccination'
      )
    }
  }
})

/**
 * Sortie API stable : `id` en chaîne, jamais `_id` ni `__v`.
 */
evenementVeterinaireSchema.methods.toJSON = function () {
  const { _id, ...reste } = this.toObject()
  return { id: _id.toString(), ...reste }
}

export default mongoose.model('EvenementVeterinaire', evenementVeterinaireSchema)
