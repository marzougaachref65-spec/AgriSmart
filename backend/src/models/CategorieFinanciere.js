import mongoose from 'mongoose'

export const TYPES_CATEGORIE = ['Revenu', 'Depense', 'Les deux']

const categorieFinanciereSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Le code de la catégorie est requis'],
      trim: true,
      uppercase: true,
      maxlength: [100, 'Le code ne peut pas dépasser 100 caractères'],
      unique: true,
      index: true,
    },
    libelle: {
      type: String,
      required: [true, 'Le libellé de la catégorie est requis'],
      trim: true,
      maxlength: [150, 'Le libellé ne peut pas dépasser 150 caractères'],
    },
    type: {
      type: String,
      required: [true, 'Le type de catégorie est requis'],
      enum: {
        values: TYPES_CATEGORIE,
        message: 'Type de catégorie invalide',
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères'],
    },
    couleur: {
      type: String,
      trim: true,
      default: '#16a34a',
      maxlength: [20, 'La couleur ne peut pas dépasser 20 caractères'],
    },
    actif: { type: Boolean, default: true, index: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le responsable de la saisie est requis'],
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
)

categorieFinanciereSchema.pre('validate', function () {
  if (typeof this.code === 'string' && this.code.trim()) {
    this.code = this.code.trim().toUpperCase()
  }
  if (typeof this.couleur !== 'string' || !this.couleur.trim()) {
    this.couleur = '#16a34a'
  }
})

categorieFinanciereSchema.methods.toJSON = function () {
  const { _id, ...reste } = this.toObject()
  return { id: _id.toString(), ...reste }
}

export default mongoose.model('CategorieFinanciere', categorieFinanciereSchema)
