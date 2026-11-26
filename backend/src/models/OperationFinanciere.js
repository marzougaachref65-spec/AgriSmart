import mongoose from 'mongoose'
import { randomUUID } from 'node:crypto'

export const TYPES_OPERATION = ['Revenu', 'Depense']
export const MODES_PAIEMENT = ['Espèces', 'Virement', 'Chèque', 'Autre']
export const STATUTS_PAIEMENT = ['Non payé', 'Partiellement payé', 'Payé']
export const STATUTS_OPERATION = ['Actif', 'Annulé']
export const DEVISES = ['TND']
export const MODULES_SOURCE = [
  'Animaux',
  'Stocks',
  'Cultures',
  'Veterinaire',
  'Autre',
]
export const ACTIONS_JOURNAL = [
  'CREATION',
  'MODIFICATION',
  'PAIEMENT_AJOUTE',
  'ANNULATION',
]

const paiementSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      trim: true,
      required: true,
      default: () => `PAI_${randomUUID()}`,
      maxlength: [100, 'La référence ne peut pas dépasser 100 caractères'],
    },
    date: { type: Date, required: true, default: Date.now },
    mode: {
      type: String,
      required: true,
      enum: {
        values: MODES_PAIEMENT,
        message: 'Mode de paiement invalide',
      },
    },
    montantMillimes: {
      type: Number,
      required: [true, 'Le montant du paiement est requis'],
      min: [1, 'Le montant du paiement doit être au moins de 1 millime'],
      validate: {
        validator: Number.isInteger,
        message: 'Le montant du paiement doit être un entier en millimes',
      },
    },
    note: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'La note ne peut pas dépasser 500 caractères'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le responsable du paiement est requis'],
    },
  },
  { versionKey: false }
)

paiementSchema.methods.toJSON = function () {
  const { _id, ...reste } = this.toObject()
  return { id: _id.toString(), ...reste }
}

const journalSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: {
        values: ACTIONS_JOURNAL,
        message: 'Action de journal invalide',
      },
    },
    date: { type: Date, default: Date.now },
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "L'utilisateur est requis"],
    },
    detail: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Le détail ne peut pas dépasser 500 caractères'],
    },
  },
  { versionKey: false }
)

journalSchema.methods.toJSON = function () {
  const { _id, ...reste } = this.toObject()
  return { id: _id.toString(), ...reste }
}

const sourceSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      enum: {
        values: MODULES_SOURCE,
        message: 'Module source invalide',
      },
      default: null,
    },
    referenceId: { type: String, trim: true, default: null },
    libelle: {
      type: String,
      trim: true,
      default: '',
      maxlength: [150, 'Le libellé de la source ne peut pas dépasser 150 caractères'],
    },
  },
  { _id: false, versionKey: false }
)

const operationFinanciereSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: [true, 'La référence est requise'],
      trim: true,
      unique: true,
      index: true,
      maxlength: [100, 'La référence ne peut pas dépasser 100 caractères'],
    },
    type: {
      type: String,
      required: [true, 'Le type est requis'],
      enum: {
        values: TYPES_OPERATION,
        message: 'Type d’opération invalide',
      },
      index: true,
    },
    montantMillimes: {
      type: Number,
      required: [true, 'Le montant est requis'],
      min: [1, 'Le montant doit être au moins de 1 millime'],
      validate: {
        validator: Number.isInteger,
        message: 'Le montant doit être un entier en millimes',
      },
    },
    devise: {
      type: String,
      enum: { values: DEVISES, message: 'Devise invalide' },
      default: 'TND',
    },
    date: { type: Date, required: true, index: true },
    dateEcheance: { type: Date, default: null },
    categorie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CategorieFinanciere',
      required: [true, 'La catégorie est requise'],
      index: true,
    },
    libelle: {
      type: String,
      required: [true, 'Le libellé est requis'],
      trim: true,
      maxlength: [150, 'Le libellé ne peut pas dépasser 150 caractères'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères'],
    },
    source: { type: sourceSchema, default: null },
    paiements: { type: [paiementSchema], default: [] },
    montantPayeMillimes: {
      type: Number,
      default: 0,
      min: [0, 'Le montant payé ne peut pas être négatif'],
      validate: {
        validator: Number.isInteger,
        message: 'Le montant payé doit être un entier en millimes',
      },
    },
    statutPaiement: {
      type: String,
      enum: {
        values: STATUTS_PAIEMENT,
        message: 'Statut de paiement invalide',
      },
      default: 'Non payé',
    },
    statut: {
      type: String,
      enum: {
        values: STATUTS_OPERATION,
        message: 'Statut d’opération invalide',
      },
      default: 'Actif',
      index: true,
    },
    annuleLe: { type: Date, default: null },
    annulePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
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

operationFinanciereSchema.index({ date: -1 })
operationFinanciereSchema.index({ type: 1, date: -1 })
operationFinanciereSchema.index({ categorie: 1, date: -1 })
operationFinanciereSchema.index({ statutPaiement: 1 })

/* Une seule opération active par source/type. Les annulations restent possibles
   car le filtre partiel exclut explicitement les opérations non actives. */
operationFinanciereSchema.index(
  { 'source.module': 1, 'source.referenceId': 1, type: 1, statut: 1 },
  {
    unique: true,
    name: 'ux_source_active',
    partialFilterExpression: {
      statut: 'Actif',
      'source.module': { $type: 'string' },
      'source.referenceId': { $type: 'string' },
    },
  }
)

function enMillimes(valeur) {
  if (valeur === undefined || valeur === null) return 0
  const nombre = Number(valeur)
  return Number.isFinite(nombre) ? nombre : 0
}

function statutSelonPaiement(paye, montant) {
  if (paye <= 0) return 'Non payé'
  if (paye < montant) return 'Partiellement payé'
  return 'Payé'
}

operationFinanciereSchema.pre('validate', function () {
  const date = this.date instanceof Date ? this.date.getTime() : null
  const echeance =
    this.dateEcheance instanceof Date ? this.dateEcheance.getTime() : null

  if (date !== null && echeance !== null && echeance < date) {
    this.invalidate(
      'dateEcheance',
      'La date d’échéance ne peut pas précéder la date de l’opération'
    )
  }

  const montant = enMillimes(this.montantMillimes)
  const paye = enMillimes(this.montantPayeMillimes)
  if (paye > montant) {
    this.invalidate(
      'montantPayeMillimes',
      'Le montant payé ne peut pas dépasser le montant de l’opération'
    )
  }

  this.statutPaiement = statutSelonPaiement(paye, montant)
})

operationFinanciereSchema.methods.toJSON = function () {
  const { _id, montantMillimes, montantPayeMillimes, ...reste } =
    this.toObject()
  return {
    id: _id.toString(),
    ...reste,
    /* Valeurs décimales de restitution uniquement ; les calculs restent en millimes. */
    montant: enMillimes(montantMillimes) / 1000,
    montantPaye: enMillimes(montantPayeMillimes) / 1000,
  }
}

export default mongoose.model('OperationFinanciere', operationFinanciereSchema)
