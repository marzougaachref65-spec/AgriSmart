import mongoose from 'mongoose'
import { randomUUID } from 'node:crypto'
import Animal from '../models/Animal.js'
import CycleCulture from '../models/CycleCulture.js'
import EvenementVeterinaire from '../models/EvenementVeterinaire.js'
import Produit from '../models/Produit.js'
import CategorieFinanciere from '../models/CategorieFinanciere.js'
import OperationFinanciere from '../models/OperationFinanciere.js'
import { ApiError } from '../utils/apiError.js'
import {
  formaterMillimesDT,
  formaterOperation,
  formaterUtilisateurRef,
} from '../utils/refsFinancieres.js'

const MODELES_SOURCE = {
  Animaux: Animal,
  Stocks: Produit,
  Cultures: CycleCulture,
  Veterinaire: EvenementVeterinaire,
}

const TYPES_COMPATIBLES = {
  Revenu: ['Revenu', 'Les deux'],
  Depense: ['Depense', 'Les deux'],
}

export function echapperRegex(valeur) {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Conversion exacte TND → millimes, sans passer par un nombre flottant. */
export function montantVersMillimes(valeur) {
  if (valeur === undefined || valeur === null || valeur === '') return 0
  const texte = String(valeur).trim()
  const negatif = texte.startsWith('-')
  const sansSigne = texte.replace(/^[+-]/, '')
  const correspondance = /^(\d+)(?:\.(\d{1,3}))?$/.exec(sansSigne)
  if (!correspondance) {
    throw new ApiError(
      400,
      'Le montant doit être exprimé en TND avec 3 décimales maximum'
    )
  }
  const millimes =
    Number(correspondance[1]) * 1000 +
    Number((correspondance[2] ?? '').padEnd(3, '0'))
  return negatif ? -millimes : millimes
}

function commeDate(valeur) {
  if (valeur === undefined || valeur === null || valeur === '') return null
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

function verifierIdentifiant(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Identifiant opération invalide')
  }
}

function statutSelonPaiement(paye, montant) {
  if (paye <= 0) return 'Non payé'
  if (paye < montant) return 'Partiellement payé'
  return 'Payé'
}

export async function verifierCategorie(categorieId, type) {
  if (!mongoose.isValidObjectId(categorieId)) {
    throw new ApiError(400, 'Catégorie invalide')
  }

  const categorie = await CategorieFinanciere.findById(categorieId)
  if (!categorie) {
    throw new ApiError(400, 'Catégorie introuvable')
  }
  if (!categorie.actif) {
    throw new ApiError(400, 'Cette catégorie est inactive')
  }
  if (!(TYPES_COMPATIBLES[type] ?? []).includes(categorie.type)) {
    throw new ApiError(
      400,
      `La catégorie ${categorie.code} n'est pas compatible avec une opération de type ${type}`
    )
  }

  return categorie
}

export async function verifierSource(source) {
  if (!source || !source.module || source.module === 'Autre') return

  const Modele = MODELES_SOURCE[source.module]
  if (!Modele) {
    throw new ApiError(400, 'Module source invalide')
  }
  if (!source.referenceId) {
    throw new ApiError(400, 'La référence de la source est requise')
  }
  if (!mongoose.isValidObjectId(source.referenceId)) {
    throw new ApiError(400, 'Référence de source invalide')
  }

  const existe = await Modele.exists({ _id: source.referenceId })
  if (!existe) {
    throw new ApiError(400, "L'élément source est introuvable")
  }
}

const populerOperation = (requete) =>
  requete
    .populate('categorie', 'code libelle type couleur')
    .populate('createdBy', 'name role')

export async function listerOperations(filtres = {}) {
  const filtre = {}

  /* Par défaut, seules les opérations actives sont listées. */
  filtre.statut =
    filtres.statut === undefined || filtres.statut === null || filtres.statut === ''
      ? 'Actif'
      : filtres.statut

  if (filtres.type) filtre.type = filtres.type
  if (filtres.categorie) filtre.categorie = filtres.categorie
  if (filtres.statutPaiement) filtre.statutPaiement = filtres.statutPaiement
  if (filtres.sourceModule) filtre['source.module'] = filtres.sourceModule
  if (filtres.modePaiement) filtre['paiements.mode'] = filtres.modePaiement

  const dateDebut = commeDate(filtres.debut)
  const dateFin = commeDate(filtres.fin)
  if (dateDebut || dateFin) {
    filtre.date = {}
    if (dateDebut) filtre.date.$gte = dateDebut
    if (dateFin) filtre.date.$lte = dateFin
  }

  const terme = typeof filtres.recherche === 'string' ? filtres.recherche.trim() : ''
  if (terme) {
    const motif = echapperRegex(terme)
    filtre.$or = [
      { libelle: { $regex: motif, $options: 'i' } },
      { description: { $regex: motif, $options: 'i' } },
      { reference: { $regex: motif, $options: 'i' } },
      { 'source.libelle': { $regex: motif, $options: 'i' } },
    ]
  }

  /* Express 5 recalcule req.query : les sanitizers ne survivent pas toujours. */
  const page = Math.max(Number(filtres.page) || 1, 1)
  const limit = Math.min(Math.max(Number(filtres.limit) || 20, 1), 100)
  const skip = (page - 1) * limit

  const [operations, total] = await Promise.all([
    populerOperation(
      OperationFinanciere.find(filtre)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ),
    OperationFinanciere.countDocuments(filtre),
  ])

  return {
    items: operations.map((operation) => formaterOperation(operation)),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

export async function getOperationById(id) {
  verifierIdentifiant(id)

  const operation = await populerOperation(OperationFinanciere.findById(id))
  if (!operation) {
    throw new ApiError(404, 'Opération financière introuvable')
  }

  return formaterOperation(operation)
}

export async function getHistoriqueOperation(id) {
  verifierIdentifiant(id)

  const operation = await OperationFinanciere.findById(id)
    .select('journal')
    .populate('journal.utilisateur', 'name role')
  if (!operation) {
    throw new ApiError(404, 'Opération financière introuvable')
  }

  return (operation.journal ?? []).map((entree) => {
    const objet = typeof entree.toObject === 'function' ? entree.toObject() : entree
    const { _id, utilisateur, ...reste } = objet
    return {
      ...reste,
      id: _id ? _id.toString() : objet.id,
      utilisateur: formaterUtilisateurRef(utilisateur),
    }
  })
}

export async function creerOperation(donnees, utilisateur) {
  await verifierCategorie(donnees.categorie, donnees.type)
  await verifierSource(donnees.source)

  const referenceFournie =
    typeof donnees.reference === 'string' && donnees.reference.trim()
      ? donnees.reference.trim()
      : null
  const reference =
    referenceFournie ??
    `FIN_${Date.now()}_${randomUUID().slice(0, 8).toUpperCase()}`

  if (referenceFournie) {
    const existante = await OperationFinanciere.findOne({ reference })
    if (existante) {
      return {
        ...(await getOperationById(existante._id.toString())),
        dejaExistant: true,
      }
    }
  }

  if (
    donnees.source?.module &&
    donnees.source?.referenceId &&
    donnees.source.module !== 'Autre'
  ) {
    const doublon = await OperationFinanciere.findOne({
      'source.module': donnees.source.module,
      'source.referenceId': donnees.source.referenceId,
      type: donnees.type,
      statut: 'Actif',
    })
    if (doublon) {
      throw new ApiError(
        409,
        'Une opération active existe déjà pour cette source et ce type'
      )
    }
  }

  const montantMillimes = montantVersMillimes(donnees.montant)
  const paiements = []
  let montantPayeMillimes = 0

  if (donnees.paiementInitial?.mode) {
    const millimes = montantVersMillimes(donnees.paiementInitial.montant)
    if (millimes <= 0) {
      throw new ApiError(400, 'Le montant du paiement doit être supérieur à 0')
    }
    if (millimes > montantMillimes) {
      throw new ApiError(
        400,
        'Le paiement initial ne peut pas dépasser le montant de l’opération'
      )
    }
    paiements.push({
      reference: `PAI_${randomUUID()}`,
      date: new Date(),
      mode: donnees.paiementInitial.mode,
      montantMillimes: millimes,
      note: donnees.paiementInitial.note ?? '',
      createdBy: utilisateur._id,
    })
    montantPayeMillimes = millimes
  }

  try {
    const operation = await OperationFinanciere.create({
      reference,
      type: donnees.type,
      montantMillimes,
      devise: donnees.devise ?? 'TND',
      date: donnees.date,
      dateEcheance: donnees.dateEcheance ?? null,
      categorie: donnees.categorie,
      libelle: donnees.libelle,
      description: donnees.description ?? '',
      source: donnees.source ?? null,
      paiements,
      montantPayeMillimes,
      statutPaiement: statutSelonPaiement(montantPayeMillimes, montantMillimes),
      statut: 'Actif',
      annuleLe: null,
      annulePar: null,
      motifAnnulation: '',
      journal: [
        {
          action: 'CREATION',
          date: new Date(),
          utilisateur: utilisateur._id,
          detail: `Opération ${donnees.type} créée`,
        },
        ...(paiements.length
          ? [
              {
                action: 'PAIEMENT_AJOUTE',
                date: new Date(),
                utilisateur: utilisateur._id,
                detail: `Paiement initial de ${formaterMillimesDT(montantPayeMillimes)} ajouté`,
              },
            ]
          : []),
      ],
      createdBy: utilisateur._id,
    })

    return await getOperationById(operation._id.toString())
  } catch (erreur) {
    // 11000 est géré ici : le handler global l'associerait au e-mail utilisateur.
    if (erreur.code !== 11000) throw erreur

    const pattern = erreur.keyPattern ?? {}
    if (Object.prototype.hasOwnProperty.call(pattern, 'reference')) {
      const existante = await OperationFinanciere.findOne({ reference })
      if (existante) {
        return {
          ...(await getOperationById(existante._id.toString())),
          dejaExistant: true,
        }
      }
    }
    throw new ApiError(
      409,
      'Une opération active existe déjà pour cette source et ce type'
    )
  }
}

export async function modifierOperation(id, donnees, utilisateur) {
  verifierIdentifiant(id)

  const champsImmuables = [
    'type',
    'montant',
    'reference',
    'date',
    'source',
    'paiements',
    'journal',
    'createdBy',
    'statutPaiement',
    'montantPayeMillimes',
    'statut',
    'annuleLe',
    'annulePar',
    'motifAnnulation',
  ]
  for (const champ of champsImmuables) {
    if (Object.prototype.hasOwnProperty.call(donnees ?? {}, champ)) {
      throw new ApiError(400, `Le champ ${champ} ne peut pas être modifié`)
    }
  }

  const operation = await OperationFinanciere.findById(id)
  if (!operation) {
    throw new ApiError(404, 'Opération financière introuvable')
  }

  if (Object.prototype.hasOwnProperty.call(donnees, 'categorie')) {
    await verifierCategorie(donnees.categorie, operation.type)
    operation.categorie = donnees.categorie
  }
  if (Object.prototype.hasOwnProperty.call(donnees, 'libelle')) {
    operation.libelle = donnees.libelle
  }
  if (Object.prototype.hasOwnProperty.call(donnees, 'description')) {
    operation.description = donnees.description ?? ''
  }
  if (Object.prototype.hasOwnProperty.call(donnees, 'dateEcheance')) {
    operation.dateEcheance = donnees.dateEcheance ?? null
  }

  operation.journal.push({
    action: 'MODIFICATION',
    date: new Date(),
    utilisateur: utilisateur._id,
    detail: 'Opération financière modifiée',
  })
  await operation.save()

  return getOperationById(id)
}

export async function ajouterPaiement(id, donnees, utilisateur) {
  verifierIdentifiant(id)

  const operation = await OperationFinanciere.findById(id)
  if (!operation) {
    throw new ApiError(404, 'Opération financière introuvable')
  }
  if (operation.statut !== 'Actif') {
    throw new ApiError(409, "L'opération est annulée")
  }

  const millimes = montantVersMillimes(donnees.montant)
  if (millimes <= 0) {
    throw new ApiError(400, 'Le montant du paiement doit être supérieur à 0')
  }
  if (operation.montantPayeMillimes + millimes > operation.montantMillimes) {
    throw new ApiError(409, 'Le montant du paiement dépasse le solde restant')
  }

  const paiement = {
    _id: new mongoose.Types.ObjectId(),
    reference: `PAI_${randomUUID()}`,
    date: donnees.date ?? new Date(),
    mode: donnees.mode,
    montantMillimes: millimes,
    note: donnees.note ?? '',
    createdBy: utilisateur._id,
  }
  const entreeJournal = {
    _id: new mongoose.Types.ObjectId(),
    action: 'PAIEMENT_AJOUTE',
    date: new Date(),
    utilisateur: utilisateur._id,
    detail: `Paiement de ${formaterMillimesDT(millimes)} ajouté`,
  }

  /* Mise à jour atomique en un seul document. Le filtre sur montantPayeMillimes
     empêche deux paiements concurrents de dépasser le montant de l'opération. */
  const miseAJour = await OperationFinanciere.findOneAndUpdate(
    {
      _id: id,
      statut: 'Actif',
      montantPayeMillimes: {
        $lte: operation.montantMillimes - millimes,
      },
    },
    [
      {
        $set: {
          montantPayeMillimes: {
            $add: [{ $ifNull: ['$montantPayeMillimes', 0] }, millimes],
          },
          updatedAt: new Date(),
        },
      },
      {
        $set: {
          statutPaiement: {
            $switch: {
              branches: [
                { case: { $lte: ['$montantPayeMillimes', 0] }, then: 'Non payé' },
                {
                  case: { $lt: ['$montantPayeMillimes', '$montantMillimes'] },
                  then: 'Partiellement payé',
                },
              ],
              default: 'Payé',
            },
          },
        },
      },
      {
        $set: {
          paiements: {
            $concatArrays: [{ $ifNull: ['$paiements', []] }, [paiement]],
          },
          journal: {
            $concatArrays: [{ $ifNull: ['$journal', []] }, [entreeJournal]],
          },
        },
      },
    ],
    { returnDocument: 'after', updatePipeline: true, runValidators: false }
  )

  if (!miseAJour) {
    throw new ApiError(409, 'Le montant du paiement dépasse le solde restant')
  }

  return getOperationById(id)
}

export async function annulerOperation(id, donnees, utilisateur) {
  verifierIdentifiant(id)

  const operation = await OperationFinanciere.findById(id)
  if (!operation) {
    throw new ApiError(404, 'Opération financière introuvable')
  }
  if (operation.statut === 'Annulé') {
    return getOperationById(id)
  }

  const motif = String(donnees.motif ?? '').trim()
  operation.statut = 'Annulé'
  operation.annuleLe = new Date()
  operation.annulePar = utilisateur._id
  operation.motifAnnulation = motif
  operation.journal.push({
    action: 'ANNULATION',
    date: new Date(),
    utilisateur: utilisateur._id,
    detail: `Opération annulée — motif : ${motif}`,
  })
  await operation.save()

  return getOperationById(id)
}
