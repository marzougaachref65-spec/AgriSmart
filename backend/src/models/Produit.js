import mongoose from 'mongoose'

export const CATEGORIES_PRODUIT = [
  'Semences',
  'Engrais',
  'Aliments pour animaux',
  'Médicaments vétérinaires',
  'Matériel agricole',
  'Autres',
]

const produitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du produit est requis'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    categorie: {
      type: String,
      required: [true, 'La catégorie est requise'],
      enum: {
        values: CATEGORIES_PRODUIT,
        message: 'Catégorie invalide',
      },
    },
    quantiteDisponible: {
      type: Number,
      required: true,
      min: [0, 'La quantité disponible ne peut pas être négative'],
      default: 0,
    },
    unite: {
      type: String,
      required: [true, "L'unité est requise"],
      trim: true,
      maxlength: [30, "L'unité ne peut pas dépasser 30 caractères"],
      default: 'kg',
    },
    prixUnitaire: {
      type: Number,
      required: true,
      min: [0, 'Le prix unitaire ne peut pas être négatif'],
      default: 0,
    },
    fournisseur: {
      type: String,
      trim: true,
      maxlength: [150, 'Le fournisseur ne peut pas dépasser 150 caractères'],
      default: '',
    },
    seuilMinimum: {
      type: Number,
      required: true,
      min: [0, 'Le seuil minimum ne peut pas être négatif'],
      default: 0,
    },
    dateExpiration: {
      type: Date,
      default: null,
    },
    /* Verrou interne court, utilisé pour sérialiser les mouvements en standalone. */
    verrou: {
      type: Boolean,
      default: false,
    },
    verrouExpireLe: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

produitSchema.index({ name: 1 })
produitSchema.index({ categorie: 1 })
produitSchema.index({ dateExpiration: 1 })

/**
 * Sortie API stable : `id` en chaîne, jamais `_id` ni `__v`.
 */
produitSchema.methods.toJSON = function () {
  const { _id, verrou, verrouExpireLe, ...reste } = this.toObject()
  return { id: _id.toString(), ...reste }
}

export default mongoose.model('Produit', produitSchema)
