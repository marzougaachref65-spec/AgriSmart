import mongoose from 'mongoose'
import {
  GENRES_NOTIFICATION,
  MODULES_NOTIFICATION,
  NIVEAUX_NOTIFICATION,
  TYPES_NOTIFICATION,
} from '../utils/notifications.js'

const sourceSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      enum: {
        values: MODULES_NOTIFICATION,
        message: 'Module de notification invalide',
      },
      default: 'Systeme',
    },
    referenceId: { type: String, trim: true, default: null },
    reference: { type: String, trim: true, default: '' },
  },
  { _id: false, versionKey: false }
)

const notificationSchema = new mongoose.Schema(
  {
    destinataire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le destinataire est requis'],
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: { values: TYPES_NOTIFICATION, message: 'Type de notification invalide' },
      index: true,
    },
    niveau: {
      type: String,
      required: true,
      enum: {
        values: NIVEAUX_NOTIFICATION,
        message: 'Niveau de notification invalide',
      },
      default: 'Info',
      index: true,
    },
    titre: {
      type: String,
      required: true,
      trim: true,
      maxlength: [150, 'Le titre ne peut pas dépasser 150 caractères'],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Le message ne peut pas dépasser 500 caractères'],
    },
    source: { type: sourceSchema, default: null },
    genre: {
      type: String,
      required: true,
      enum: {
        values: GENRES_NOTIFICATION,
        message: 'Genre de notification invalide',
      },
      default: 'evenement',
    },
    /* Clé stable : une situation identique ne crée qu'une seule notification active. */
    cleUnicite: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'La clé ne peut pas dépasser 200 caractères'],
    },
    active: { type: Boolean, default: true },
    lue: { type: Boolean, default: false, index: true },
    dateLecture: { type: Date, default: null },
    dateEvenement: { type: Date, default: null },
    /* Uniquement renseigné pour les notifications financières de l'encadrement. */
    montantMillimes: { type: Number, default: null },
  },
  { timestamps: true, versionKey: false }
)

notificationSchema.index({ destinataire: 1, lue: 1, createdAt: -1 })
notificationSchema.index({ 'source.module': 1, 'source.referenceId': 1 })
notificationSchema.index(
  { destinataire: 1, cleUnicite: 1 },
  {
    unique: true,
    name: 'ux_notification_active',
    partialFilterExpression: { active: true },
  }
)

notificationSchema.methods.toJSON = function () {
  const { _id, ...reste } = this.toObject()
  return { id: _id.toString(), ...reste }
}

export default mongoose.model('Notification', notificationSchema)
