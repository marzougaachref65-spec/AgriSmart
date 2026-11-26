import mongoose from 'mongoose'
import { randomUUID } from 'node:crypto'
import { creerJournalSchema } from './journal.js'

export const STATUTS_EMPLOYE = ['Actif', 'Inactif']
export const PERIODICITES_SALAIRE = ['Mensuel', 'Journalier', 'Horaire']
export const ACTIONS_JOURNAL_EMPLOYE = [
  'CREATION',
  'MODIFICATION',
  'CHANGEMENT_STATUT',
  'AFFECTATION_COMPTE',
]

const journalSchema = creerJournalSchema(ACTIONS_JOURNAL_EMPLOYE)

/**
 * Référence interne conservée uniquement pour la compatibilité des anciens
 * documents et de l'index unique `matricule_1` présent dans MongoDB.
 * Elle n'est plus affichée, ni saisie, ni exposée par l'API.
 */
function genererMatricule() {
  return `EMP-${new Date().getFullYear()}-${randomUUID().slice(0, 6).toUpperCase()}`
}

const employeSchema = new mongoose.Schema(
  {
    /* Champ interne : ne jamais retirer du schéma sans migrer l'index MongoDB. */
    matricule: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
      default: genererMatricule,
      maxlength: [50, 'Le matricule ne peut pas dépasser 50 caractères'],
    },
    nom: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    prenoms: {
      type: String,
      trim: true,
      default: '',
      maxlength: [150, 'Les prénoms ne peuvent pas dépasser 150 caractères'],
    },
    dateNaissance: { type: Date, default: null },
    cin: {
      type: String,
      trim: true,
      default: '',
      maxlength: [50, 'Le CIN ne peut pas dépasser 50 caractères'],
    },
    telephone: {
      type: String,
      trim: true,
      default: '',
      maxlength: [30, 'Le téléphone ne peut pas dépasser 30 caractères'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      maxlength: [150, "L'e-mail ne peut pas dépasser 150 caractères"],
    },
    adresse: {
      type: String,
      trim: true,
      default: '',
      maxlength: [250, "L'adresse ne peut pas dépasser 250 caractères"],
    },
    fonction: {
      type: String,
      required: [true, 'La fonction est requise'],
      trim: true,
      maxlength: [100, 'La fonction ne peut pas dépasser 100 caractères'],
    },
    specialite: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'La spécialité ne peut pas dépasser 100 caractères'],
    },
    salaireMillimes: {
      type: Number,
      required: [true, 'Le salaire est requis'],
      min: [0, 'Le salaire ne peut pas être négatif'],
      validate: {
        validator: Number.isInteger,
        message: 'Le salaire doit être un entier en millimes',
      },
    },
    periodiciteSalaire: {
      type: String,
      required: true,
      enum: {
        values: PERIODICITES_SALAIRE,
        message: 'Périodicité de salaire invalide',
      },
      default: 'Mensuel',
    },
    dateRecrutement: {
      type: Date,
      required: [true, 'La date de recrutement est requise'],
      index: true,
    },
    dateFin: { type: Date, default: null },
    statut: {
      type: String,
      required: true,
      enum: { values: STATUTS_EMPLOYE, message: 'Statut employé invalide' },
      default: 'Actif',
      index: true,
    },
    /* Lien 1:1 facultatif avec un compte de connexion (rôle EMPLOYEE). */
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Les notes ne peuvent pas dépasser 2000 caractères'],
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

employeSchema.index({ nom: 1, prenoms: 1 })
employeSchema.index({ fonction: 1, statut: 1 })
employeSchema.index(
  { utilisateur: 1 },
  {
    unique: true,
    name: 'ux_employe_utilisateur',
    partialFilterExpression: { utilisateur: { $type: 'objectId' } },
  }
)

employeSchema.pre('validate', function () {
  const recrutement = this.dateRecrutement?.getTime() ?? null
  const fin = this.dateFin?.getTime() ?? null
  if (recrutement !== null && fin !== null && fin < recrutement) {
    this.invalidate('dateFin', 'La date de fin ne peut pas précéder la date de recrutement')
  }
  if (this.statut === 'Actif' && this.dateFin) {
    this.invalidate('dateFin', "Un employé actif ne peut pas avoir de date de fin")
  }
})

/** Sortie API stable : `id` en chaîne, jamais `_id` ni `__v`. */
employeSchema.methods.toJSON = function () {
  const { _id, ...reste } = this.toObject()
  return { id: _id.toString(), ...reste }
}

export default mongoose.model('Employe', employeSchema)
