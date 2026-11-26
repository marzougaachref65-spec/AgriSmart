import mongoose from 'mongoose'

export const TYPES_MOUVEMENT = ['Entrée', 'Sortie']
export const MOTIFS_ENTREE = ['Achat', 'Réception', 'Approvisionnement', 'Autre']
export const MOTIFS_SORTIE = [
  'Consommation',
  'Utilisation agricole',
  'Perte',
  'Autre',
]
export const MOTIFS_MOUVEMENT = [...new Set([...MOTIFS_ENTREE, ...MOTIFS_SORTIE])]
export const STATUTS_MOUVEMENT = ['En attente', 'Confirmé', 'Annulé']

const mouvementStockSchema = new mongoose.Schema(
  {
    produit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Produit',
      required: [true, 'Le produit concerné est requis'],
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: TYPES_MOUVEMENT,
        message: 'Type de mouvement invalide',
      },
    },
    motif: {
      type: String,
      required: true,
      enum: {
        values: MOTIFS_MOUVEMENT,
        message: 'Motif invalide',
      },
    },
    quantite: {
      type: Number,
      required: [true, 'La quantité est requise'],
      min: [0.000001, 'La quantité doit être supérieure à 0'],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "L'utilisateur responsable est requis"],
      index: true,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'La référence ne peut pas dépasser 100 caractères'],
      unique: true,
      index: true,
    },
    statut: {
      type: String,
      required: true,
      enum: {
        values: STATUTS_MOUVEMENT,
        message: 'Statut invalide',
      },
      default: 'En attente',
    },
    quantiteAvant: {
      type: Number,
      default: null,
    },
    quantiteApres: {
      type: Number,
      default: null,
    },
    motifAnnulation: {
      type: String,
      trim: true,
      maxlength: [200, 'Le motif d’annulation ne peut pas dépasser 200 caractères'],
      default: null,
    },
    parcelle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parcelle',
      default: null,
    },
    cycleCulture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CycleCulture',
      default: null,
    },
    animal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Animal',
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

mouvementStockSchema.index({ produit: 1, date: -1 })
mouvementStockSchema.index({ type: 1, date: -1 })
mouvementStockSchema.index({ statut: 1, createdAt: 1 })

/**
 * Sortie API stable : `id` en chaîne, jamais `_id` ni `__v`.
 */
mouvementStockSchema.methods.toJSON = function () {
  const { _id, ...reste } = this.toObject()
  return { id: _id.toString(), ...reste }
}

export default mongoose.model('MouvementStock', mouvementStockSchema)
