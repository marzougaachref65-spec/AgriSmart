import mongoose from 'mongoose'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { ApiError } from '../utils/apiError.js'
import {
  estTypeFinancier,
  formaterNotification,
  LIBELLES_NIVEAUX_NOTIFICATION,
  LIBELLES_TYPES_NOTIFICATION,
  NIVEAUX_NOTIFICATION,
  TYPES_FINANCIERS,
  TYPES_NOTIFICATION,
} from '../utils/notifications.js'

function verifierIdentifiant(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Identifiant notification invalide')
  }
}

function commeDate(valeur) {
  if (!valeur) return null
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

function pagination({ page = 1, limit = 20 } = {}) {
  const numero = Number(page) > 0 ? Number(page) : 1
  const taille = Number(limit) > 0 ? Number(limit) : 20
  return { page: numero, limit: taille, skip: (numero - 1) * taille }
}

function echapperRegex(valeur) {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Filtre de propriété et de confidentialité appliqué à TOUTE lecture/écriture.
 * Un compte EMPLOYEE ne peut recevoir ni lister aucune notation financière.
 */
export function filtreUtilisateur(utilisateur) {
  if (!utilisateur?._id) {
    throw new ApiError(401, 'Authentification requise')
  }
  const conditions = [{ destinataire: utilisateur._id }]
  if (utilisateur.role === 'EMPLOYEE') {
    conditions.push({ type: { $nin: TYPES_FINANCIERS } })
  }
  return { $and: conditions }
}

function filtreVide(filtres) {
  const { page, limit } = pagination(filtres)
  return {
    items: [],
    pagination: { page, limit, total: 0, pages: 0 },
  }
}

/**
 * Création interne, idempotente. Le filtre `active: true` associé à l'index
 * partiel unique garantit qu'une même clé ne produit qu'UNE notification active.
 * Les doublons concurrents (code 11000) sont un cas nominal, pas une erreur.
 */
export async function creerNotifications({
  destinataires = [],
  type,
  niveau = 'Info',
  titre,
  message,
  source = null,
  genre = 'evenement',
  cleUnicite,
  dateEvenement = null,
  montantMillimes = null,
}) {
  if (!TYPES_NOTIFICATION.includes(type)) {
    throw new ApiError(400, 'Type de notification invalide')
  }
  if (!NIVEAUX_NOTIFICATION.includes(niveau)) {
    throw new ApiError(400, 'Niveau de notification invalide')
  }
  if (!String(cleUnicite ?? '').trim()) {
    throw new ApiError(400, 'La clé de notification est requise')
  }
  if (!String(titre ?? '').trim() || !String(message ?? '').trim()) {
    throw new ApiError(400, 'Le titre et le message sont requis')
  }

  let identifiants = [
    ...new Set(destinataires.map(String).filter((id) => mongoose.isValidObjectId(id))),
  ]

  /* Confidentialité financière : filtrage défensif, même si un appelant interne
     transmettait par erreur un compte EMPLOYEE. */
  if (estTypeFinancier(type) && identifiants.length > 0) {
    const autorises = await User.find({
      _id: { $in: identifiants },
      role: { $in: ['ADMIN', 'MANAGER'] },
      isActive: true,
    }).select('_id')
    identifiants = autorises.map((compte) => compte._id.toString())
  }

  if (identifiants.length === 0) return { creees: 0, ignorees: 0, destinataires: 0 }

  let creees = 0
  let ignorees = 0

  for (const destinataire of identifiants) {
    try {
      /* Mongoose (timestamps: true) injecte lui-même createdAt/updatedAt dans
         $setOnInsert : ne pas les redéclarer, sinon MongoDB signale un conflit
         de chemin 'updatedAt'. */
      const resultat = await Notification.updateOne(
        { destinataire, cleUnicite, active: true },
        {
          $setOnInsert: {
            destinataire,
            type,
            niveau,
            titre: String(titre).trim(),
            message: String(message).trim(),
            source: source ?? null,
            genre,
            cleUnicite,
            active: true,
            lue: false,
            dateLecture: null,
            dateEvenement,
            montantMillimes: estTypeFinancier(type) ? montantMillimes : null,
          },
        },
        { upsert: true }
      )
      if (resultat.upsertedCount > 0) creees += 1
      else ignorees += 1
    } catch (erreur) {
      if (erreur.code === 11000) {
        ignorees += 1
        continue
      }
      throw erreur
    }
  }

  return { creees, ignorees, destinataires: identifiants.length }
}

/**
 * Résout les alertes d'état dont la situation a disparu. Les documents sont
 * conservés (active: false) : aucune suppression de donnée.
 */
export async function desactiverAlertes(module, cleesActives = []) {
  const filtre = {
    'source.module': module,
    genre: 'etat',
    active: true,
  }
  if (cleesActives.length > 0) filtre.cleUnicite = { $nin: cleesActives }
  const resultat = await Notification.updateMany(filtre, { $set: { active: false } })
  return resultat.modifiedCount
}

export async function listerNotifications(filtres = {}, utilisateur) {
  const base = filtreUtilisateur(utilisateur)

  if (utilisateur.role === 'EMPLOYEE' && estTypeFinancier(filtres.type)) {
    return filtreVide(filtres)
  }

  const conditions = [...base.$and]

  if (filtres.lue === 'true' || filtres.lue === true) conditions.push({ lue: true })
  if (filtres.lue === 'false' || filtres.lue === false) conditions.push({ lue: false })
  if (filtres.actif === 'true' || filtres.actif === true) conditions.push({ active: true })
  if (filtres.actif === 'false' || filtres.actif === false) conditions.push({ active: false })
  if (filtres.type && TYPES_NOTIFICATION.includes(filtres.type)) {
    conditions.push({ type: filtres.type })
  }
  if (filtres.niveau && NIVEAUX_NOTIFICATION.includes(filtres.niveau)) {
    conditions.push({ niveau: filtres.niveau })
  }

  const terme = typeof filtres.recherche === 'string' ? filtres.recherche.trim() : ''
  if (terme) {
    const motif = echapperRegex(terme)
    conditions.push({
      $or: [
        { titre: { $regex: motif, $options: 'i' } },
        { message: { $regex: motif, $options: 'i' } },
        { 'source.reference': { $regex: motif, $options: 'i' } },
      ],
    })
  }

  const periode = {}
  const du = commeDate(filtres.du)
  const au = commeDate(filtres.au)
  if (du) periode.$gte = du
  if (au) periode.$lte = au
  if (Object.keys(periode).length > 0) conditions.push({ createdAt: periode })

  const filtre = { $and: conditions }
  const { page, limit, skip } = pagination(filtres)
  const [notifications, total] = await Promise.all([
    Notification.find(filtre)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filtre),
  ])

  return {
    items: notifications.map((notification) =>
      formaterNotification(notification, utilisateur)
    ),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

export async function getNotificationById(id, utilisateur) {
  verifierIdentifiant(id)
  const base = filtreUtilisateur(utilisateur)
  const notification = await Notification.findOne({ _id: id, ...base })
  if (!notification) throw new ApiError(404, 'Notification introuvable')
  return formaterNotification(notification, utilisateur)
}

export async function getStatistiquesNotifications(utilisateur) {
  const filtre = filtreUtilisateur(utilisateur)
  const lues = { ...filtre, lue: true }
  const nonLues = { ...filtre, lue: false }
  const urgentesNonLues = { ...filtre, lue: false, niveau: 'Urgent' }
  const actives = { ...filtre, active: true }

  const [total, nombreLues, nombreNonLues, nombreUrgentes, nombreActives, parTypeBrut, parNiveauBrut] =
    await Promise.all([
      Notification.countDocuments(filtre),
      Notification.countDocuments(lues),
      Notification.countDocuments(nonLues),
      Notification.countDocuments(urgentesNonLues),
      Notification.countDocuments(actives),
      Notification.aggregate([
        { $match: filtre },
        { $group: { _id: '$type', nombre: { $sum: 1 } } },
      ]),
      Notification.aggregate([
        { $match: filtre },
        { $group: { _id: '$niveau', nombre: { $sum: 1 } } },
      ]),
    ])

  const parType = Object.fromEntries(TYPES_NOTIFICATION.map((type) => [type, 0]))
  for (const ligne of parTypeBrut) {
    if (ligne._id in parType) parType[ligne._id] = ligne.nombre
  }

  const parNiveau = Object.fromEntries(
    NIVEAUX_NOTIFICATION.map((niveau) => [niveau, 0])
  )
  for (const ligne of parNiveauBrut) {
    if (ligne._id in parNiveau) parNiveau[ligne._id] = ligne.nombre
  }

  return {
    total,
    lues: nombreLues,
    nonLues: nombreNonLues,
    urgentesNonLues: nombreUrgentes,
    actives: nombreActives,
    parType,
    parNiveau,
    libellesTypes: LIBELLES_TYPES_NOTIFICATION,
    libellesNiveaux: LIBELLES_NIVEAUX_NOTIFICATION,
  }
}

export async function marquerLue(id, utilisateur, lue = true) {
  verifierIdentifiant(id)
  const base = filtreUtilisateur(utilisateur)
  const notification = await Notification.findOneAndUpdate(
    { _id: id, ...base },
    { $set: { lue: Boolean(lue), dateLecture: lue ? new Date() : null } },
    { new: true, runValidators: true }
  )
  if (!notification) throw new ApiError(404, 'Notification introuvable')
  return formaterNotification(notification, utilisateur)
}

export async function marquerToutesLues(utilisateur, lue = true) {
  const base = filtreUtilisateur(utilisateur)
  const resultat = await Notification.updateMany(base, {
    $set: { lue: Boolean(lue), dateLecture: lue ? new Date() : null },
  })
  return { modifiees: resultat.modifiedCount }
}

/** Utilisé par le planificateur : journalise explicitement toute panne partielle. */
export function journaliserErreurNotification(module, erreur) {
  console.error(
    `[NOTIFICATIONS] Échec sur le module ${module} : ${erreur?.message ?? erreur}`
  )
}
