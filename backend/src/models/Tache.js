import mongoose from 'mongoose'
import { randomUUID } from 'node:crypto'
import { creerJournalSchema } from './journal.js'

export const STATUTS_TACHE = ['À faire', 'En cours', 'Terminée', 'Annulée']
export const PRIORITES_TACHE = ['Basse', 'Moyenne', 'Haute', 'Urgente']
export const MODULES_CIBLE = ['Animaux', 'Cultures', 'Parcelles', 'Autre']
export const ACTIONS_JOURNAL_TACHE = [
  'CREATION',
  'MODIFICATION',
  'CHANGEMENT_STATUT',
  'AFFECTATION_EMPLOYES',
  'ANNULATION',
]

const journalSchema = creerJournalSchema(ACTIONS_JOURNAL_TACHE)

const cibleSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      enum: { values: MODULES_CIBLE, message: 'Module cible invalide' },
      default: 'Autre',
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { versionKey: false }
)

cibleSchema.methods.toJSON = function () {
  const { _id, ...reste } = this.toObject()
  return { id: _id.toString(), ...reste }
}

const tacheSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      default: () => `TAC_${randomUUID()}`,
      maxlength: [100, 'La référence ne peut pas dépasser 100 caractères'],
    },
    titre: {
      type: String,
      required: [true, 'Le titre est requis'],
      trim: true,
      maxlength: [150, 'Le titre ne peut pas dépasser 150 caractères'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères'],
    },
    priorite: {
      type: String,
      required: true,
      enum: { values: PRIORITES_TACHE, message: 'Priorité invalide' },
      default: 'Moyenne',
      index: true,
    },
    statut: {
      type: String,
      required: true,
      enum: { values: STATUTS_TACHE, message: 'Statut de tâche invalide' },
      default: 'À faire',
      index: true,
    },
    dateDebut: {
      type: Date,
      required: [true, 'La date de début est requise'],
      index: true,
    },
    dateEcheance: {
      type: Date,
      required: [true, "La date d'échéance est requise"],
      index: true,
    },
    dateRealisation: { type: Date, default: null },
    employes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employe',
        },
      ],
      default: [],
      index: true,
    },
    cible: { type: cibleSchema, default: () => ({ module: 'Autre', referenceId: null }) },
    motifAnnulation: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Le motif ne peut pas dépasser 500 caractères'],
    },
    journal: { type: [journalSchema], default: [] },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le responsable de la saisie est requis'],
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
)

tacheSchema.index({ statut: 1, dateEcheance: 1 })
tacheSchema.index({ priorite: 1, statut: 1 })
tacheSchema.index({ 'cible.module': 1, 'cible.referenceId': 1 })
tacheSchema.index({ employes: 1, statut: 1 })

tacheSchema.pre('validate', function () {
  const debut = this.dateDebut?.getTime() ?? null
  const echeance = this.dateEcheance?.getTime() ?? null
  if (debut !== null && echeance !== null && echeance < debut) {
    this.invalidate('dateEcheance', "La date d'échéance ne peut pas précéder la date de début")
  }
  if (this.statut === 'Annulée' && !String(this.motifAnnulation ?? '').trim()) {
    this.invalidate('motifAnnulation', 'Le motif est requis pour annuler une tâche')
  }
})

/** Sortie API stable : `id` en chaîne, jamais `_id` ni `__v`. */
tacheSchema.methods.toJSON = function () {
  const { _id, ...reste } = this.toObject()
  return { id: _id.toString(), ...reste }
}

export default mongoose.model('Tache', tacheSchema)
