import mongoose from 'mongoose'

/**
 * Journal d'audit embarqué, identique dans son principe à celui des
 * opérations financières (OperationFinanciere.js). Chaque action est
 * horodatée et attribuée à l'utilisateur connecté.
 */
export function creerJournalSchema(actions) {
  const journalSchema = new mongoose.Schema(
    {
      action: {
        type: String,
        required: true,
        enum: {
          values: actions,
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

  return journalSchema
}

/** Construit une entrée de journal prête à être `$push`-ée. */
export function entreeJournal(action, utilisateur, detail = '') {
  return {
    action,
    date: new Date(),
    utilisateur: utilisateur._id,
    detail: String(detail).slice(0, 500),
  }
}
