import mongoose from 'mongoose'
import { randomUUID } from 'node:crypto'
import MouvementStock from '../models/MouvementStock.js'
import Produit from '../models/Produit.js'
import Parcelle from '../models/Parcelle.js'
import CycleCulture from '../models/CycleCulture.js'
import Animal from '../models/Animal.js'
import { ApiError } from '../utils/apiError.js'

/** Un mouvement resté en attente plus de 5 minutes est candidat à la réconciliation. */
export const DELAI_RECONCILIATION_MS = 5 * 60 * 1000

function echapperRegex(valeur) {
  return valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function verifierIdentifiant(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Identifiant mouvement invalide')
  }
}

function commeDate(valeur) {
  if (!valeur) return null
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

function arrondir(valeur) {
  return Math.round((valeur ?? 0) * 100) / 100
}

/** Durée de vie d'un verrou abandonné lors d'un crash serveur. */
const DUREE_VERROU_MS = 30 * 1000

/**
 * Sérialise les mouvements d'un même produit sans transaction MongoDB.
 * Le verrou expire automatiquement si le processus meurt avant sa libération.
 */
async function avecVerrou(produitId, callback, tentatives = 5) {
  for (let essai = 0; essai < tentatives; essai += 1) {
    const maintenant = new Date()
    const verrou = await Produit.findOneAndUpdate(
      {
        _id: produitId,
        $or: [
          { verrou: false },
          { verrouExpireLe: null },
          { verrouExpireLe: { $lt: maintenant } },
        ],
      },
      {
        $set: {
          verrou: true,
          verrouExpireLe: new Date(maintenant.getTime() + DUREE_VERROU_MS),
        },
      },
      { new: true }
    )

    if (verrou) {
      try {
        return await callback()
      } finally {
        await Produit.findByIdAndUpdate(produitId, {
          $set: { verrou: false, verrouExpireLe: null },
        })
      }
    }

    await new Promise((resoudre) => setTimeout(resoudre, 20))
  }

  throw new ApiError(
    409,
    'Une autre opération est en cours sur ce produit. Réessayez.'
  )
}

function variation(mouvement) {
  return mouvement.type === 'Entrée' ? mouvement.quantite : -mouvement.quantite
}

/** Vérifie que chaque référence optionnelle pointe vers une donnée réellement existante. */
async function verifierContexte(donnees) {
  if (donnees.parcelle) {
    if (!mongoose.isValidObjectId(donnees.parcelle)) {
      throw new ApiError(400, 'Parcelle associée invalide')
    }
    if (!(await Parcelle.exists({ _id: donnees.parcelle }))) {
      throw new ApiError(404, 'Parcelle associée introuvable')
    }
  }

  if (donnees.cycleCulture) {
    if (!mongoose.isValidObjectId(donnees.cycleCulture)) {
      throw new ApiError(400, 'Cycle de culture associé invalide')
    }
    const cycle = await CycleCulture.findById(donnees.cycleCulture).select('parcelle')
    if (!cycle) {
      throw new ApiError(404, 'Cycle de culture associé introuvable')
    }
    if (
      donnees.parcelle &&
      cycle.parcelle.toString() !== donnees.parcelle.toString()
    ) {
      throw new ApiError(
        400,
        'La parcelle associée ne correspond pas à celle du cycle de culture'
      )
    }
  }

  if (donnees.animal) {
    if (!mongoose.isValidObjectId(donnees.animal)) {
      throw new ApiError(400, 'Animal associé invalide')
    }
    if (!(await Animal.exists({ _id: donnees.animal }))) {
      throw new ApiError(404, 'Animal associé introuvable')
    }
  }
}

function extraireReference(valeur, champs = []) {
  if (!valeur) return null
  if (typeof valeur !== 'object') return { id: valeur.toString() }

  const brut = valeur._id ?? valeur.id
  const resultat = { id: brut ? brut.toString() : null }
  for (const cle of champs) {
    if (valeur[cle] !== undefined) resultat[cle] = valeur[cle]
  }
  return resultat
}

/** DTO stable avec identifiants chaîne et lectures populate. */
function formaterMouvement(mouvement) {
  const objet = mouvement.toJSON()

  return {
    ...objet,
    produitId: extraireReference(objet.produit)?.id ?? null,
    produit: extraireReference(objet.produit, ['name', 'unite', 'categorie']),
    utilisateurId: extraireReference(objet.utilisateur)?.id ?? null,
    utilisateur: extraireReference(objet.utilisateur, ['name', 'role']),
    parcelleId: extraireReference(objet.parcelle)?.id ?? null,
    parcelle: extraireReference(objet.parcelle, ['name']),
    cycleCultureId: extraireReference(objet.cycleCulture)?.id ?? null,
    cycleCulture: extraireReference(objet.cycleCulture, ['typeCulture']),
    animalId: extraireReference(objet.animal)?.id ?? null,
    animal: extraireReference(objet.animal, ['name']),
  }
}

function peupler(requete) {
  return requete
    .populate('produit', 'name unite categorie')
    .populate('utilisateur', 'name role')
    .populate('parcelle', 'name')
    .populate('cycleCulture', 'typeCulture')
    .populate('animal', 'name')
}

async function mouvementFormatParId(id) {
  const mouvement = await peupler(MouvementStock.findById(id))
  return formaterMouvement(mouvement)
}

/**
 * Stock autoritatif : somme des mouvements CONFIRMÉS uniquement.
 * Le champ `Produit.quantiteDisponible` n'est qu'une projection de cette valeur.
 */
export async function calculerStockLedger(produitId) {
  const identifiant = produitId?._id ?? produitId
  const resultat = await MouvementStock.aggregate([
    {
      $match: {
        produit: new mongoose.Types.ObjectId(identifiant.toString()),
        statut: 'Confirmé',
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $cond: [
              { $eq: ['$type', 'Entrée'] },
              '$quantite',
              { $multiply: [-1, '$quantite'] },
            ],
          },
        },
      },
    },
  ])

  return arrondir(resultat[0]?.total)
}

/** Resynchronise la projection produit depuis le grand livre. */
export async function synchroniserProjection(produitId) {
  return avecVerrou(produitId, async () => {
    const stock = await calculerStockLedger(produitId)
    await Produit.findByIdAndUpdate(
      produitId,
      { $set: { quantiteDisponible: stock } },
      { runValidators: true }
    )
    return stock
  })
}

async function annulerMouvement(mouvement, motif) {
  await MouvementStock.findByIdAndUpdate(mouvement._id, {
    $set: { statut: 'Annulé', motifAnnulation: motif },
  })
}

/**
 * Applique la projection de façon atomique puis confirme le mouvement.
 * `$set` absolu (jamais `$inc`) : un retry ou un crash ne peut pas doubler le stock.
 */
async function appliquerMouvement(mouvement) {
  const produitId = mouvement.produit?._id ?? mouvement.produit

  return avecVerrou(produitId, async () => {
    const stockLedger = await calculerStockLedger(produitId)
    const delta = variation(mouvement)
    const attendu = arrondir(stockLedger + delta)

    if (delta < 0 && stockLedger < mouvement.quantite) {
      const motif = `Stock insuffisant : ${stockLedger} disponible(s), ${mouvement.quantite} demandé(s)`
      await annulerMouvement(mouvement, motif)
      throw new ApiError(
        409,
        `Stock insuffisant pour « ${mouvement.motif} » : ${stockLedger} disponible(s), ${mouvement.quantite} demandé(s).`
      )
    }

    const produit = await Produit.findById(produitId)

    // Crash entre la projection et la confirmation : on confirme sans réappliquer.
    if (produit.quantiteDisponible === attendu) {
      await MouvementStock.findByIdAndUpdate(mouvement._id, {
        $set: {
          statut: 'Confirmé',
          quantiteAvant: stockLedger,
          quantiteApres: attendu,
          motifAnnulation: null,
        },
      })
      return mouvementFormatParId(mouvement._id)
    }

    // Projection divergente : on la realigne sur le grand livre avant d'appliquer.
    if (produit.quantiteDisponible !== stockLedger) {
      await Produit.findByIdAndUpdate(
        produitId,
        { $set: { quantiteDisponible: stockLedger } },
        { runValidators: true }
      )
    }

    // `$set` absolu sous verrou : jamais de `$inc`, donc jamais de double application.
    const projection = await Produit.findOneAndUpdate(
      { _id: produitId, quantiteDisponible: stockLedger },
      { $set: { quantiteDisponible: attendu } },
      { new: true, runValidators: true }
    )

    if (!projection) {
      throw new ApiError(
        409,
        'La projection du stock a changé pendant le mouvement. Réessayez.'
      )
    }

    await MouvementStock.findByIdAndUpdate(mouvement._id, {
      $set: {
        statut: 'Confirmé',
        quantiteAvant: stockLedger,
        quantiteApres: attendu,
        motifAnnulation: null,
      },
    })

    return mouvementFormatParId(mouvement._id)
  })
}

/**
 * Crée un mouvement de façon idempotente.
 * `dejaExistant` permet au contrôleur de répondre 200 au lieu de 201 sur un retry.
 */
export async function creerMouvement(donnees, utilisateur) {
  const produit = await Produit.findById(donnees.produit)
  if (!produit) {
    throw new ApiError(404, 'Produit introuvable')
  }

  await verifierContexte(donnees)

  const reference = donnees.reference?.trim() || randomUUID()
  const projectionInitiale = produit.quantiteDisponible
  const deltaInitial = donnees.type === 'Entrée' ? donnees.quantite : -donnees.quantite

  let mouvement

  try {
    mouvement = await MouvementStock.create({
      produit: produit._id,
      type: donnees.type,
      motif: donnees.motif,
      quantite: donnees.quantite,
      date: donnees.date ?? new Date(),
      utilisateur: utilisateur._id,
      reference,
      statut: 'En attente',
      quantiteAvant: projectionInitiale,
      quantiteApres: arrondir(projectionInitiale + deltaInitial),
      parcelle: donnees.parcelle ?? null,
      cycleCulture: donnees.cycleCulture ?? null,
      animal: donnees.animal ?? null,
      notes: donnees.notes ?? '',
      motifAnnulation: null,
    })
  } catch (erreur) {
    // 11000 est géré ici : le handler global l'associerait au e-mail utilisateur.
    if (erreur.code !== 11000) throw erreur

    const existant = await MouvementStock.findOne({ reference })
    if (!existant) throw erreur

    if (existant.statut === 'Confirmé') {
      await synchroniserProjection(existant.produit)
      return {
        mouvement: await mouvementFormatParId(existant._id),
        dejaExistant: true,
      }
    }

    if (existant.statut === 'Annulé') {
      throw new ApiError(
        409,
        `Ce mouvement a déjà été annulé : ${existant.motifAnnulation ?? 'raison inconnue'}`
      )
    }

    // Retry après crash : le mouvement attendait encore application.
    mouvement = existant
  }

  return {
    mouvement: await appliquerMouvement(mouvement),
    dejaExistant: false,
  }
}

/** Variante utilisée par la création de produit pour le stock initial. */
export async function creerMouvementInterne(donnees, utilisateur) {
  const resultat = await creerMouvement(donnees, utilisateur)
  return resultat.mouvement
}

export async function listerMouvements({
  recherche = '',
  produit = '',
  type = '',
  motif = '',
  statut = '',
  debut,
  fin,
} = {}) {
  const filtre = {}

  if (statut) {
    filtre.statut = statut
  } else {
    // L'historique affiché exclut les mouvements transitoires en attente.
    filtre.statut = { $ne: 'En attente' }
  }
  if (produit) filtre.produit = produit
  if (type) filtre.type = type
  if (motif) filtre.motif = motif

  const dateDebut = commeDate(debut)
  const dateFin = commeDate(fin)
  if (dateDebut || dateFin) {
    filtre.date = {}
    if (dateDebut) filtre.date.$gte = dateDebut
    if (dateFin) filtre.date.$lte = dateFin
  }

  const terme = typeof recherche === 'string' ? recherche.trim() : ''
  if (terme) {
    const motifRegex = echapperRegex(terme)
    const conditions = [
      { motif: { $regex: motifRegex, $options: 'i' } },
      { notes: { $regex: motifRegex, $options: 'i' } },
      { reference: { $regex: motifRegex, $options: 'i' } },
    ]
    const produits = await Produit.find({
      name: { $regex: motifRegex, $options: 'i' },
    }).select('_id')
    if (produits.length > 0) {
      conditions.push({ produit: { $in: produits.map((p) => p._id) } })
    }
    filtre.$or = conditions
  }

  const mouvements = await peupler(
    MouvementStock.find(filtre).sort({ date: -1, createdAt: -1 })
  )

  return mouvements.map(formaterMouvement)
}

export async function getMouvementById(id) {
  verifierIdentifiant(id)

  const mouvement = await peupler(MouvementStock.findById(id))
  if (!mouvement) {
    throw new ApiError(404, 'Mouvement de stock introuvable')
  }

  return formaterMouvement(mouvement)
}

/** Diagnostics lisibles pour les mouvements bloqués et les projections divergentes. */
export async function getIncoherences() {
  const seuil = new Date(Date.now() - DELAI_RECONCILIATION_MS)
  const enAttente = await peupler(
    MouvementStock.find({
      statut: 'En attente',
      createdAt: { $lte: seuil },
    }).sort({ createdAt: 1 })
  )

  const mouvementsEnAttente = []
  for (const mouvement of enAttente) {
    const produitId = mouvement.produit?._id ?? mouvement.produit
    const stockLedger = await calculerStockLedger(produitId)
    const attendu = arrondir(stockLedger + variation(mouvement))
    const produit = await Produit.findById(produitId)

    mouvementsEnAttente.push({
      ...formaterMouvement(mouvement),
      diagnostic: {
        stockLedger,
        stockProduit: produit?.quantiteDisponible ?? null,
        quantiteAttendueApresApplication: attendu,
        etat:
          produit?.quantiteDisponible === attendu
            ? 'confirmable'
            : produit?.quantiteDisponible === stockLedger
              ? 'appliquable'
              : 'divergent',
      },
    })
  }

  const produits = await Produit.find({})
  const produitsDesynchronises = []
  for (const produit of produits) {
    const stockLedger = await calculerStockLedger(produit._id)
    if (produit.quantiteDisponible !== stockLedger) {
      produitsDesynchronises.push({
        id: produit.id,
        name: produit.name,
        stockProduit: produit.quantiteDisponible,
        stockLedger,
      })
    }
  }

  return { mouvementsEnAttente, produitsDesynchronises }
}

/**
 * Réconciliation déterministe après crash.
 * - projection == attendu  -> le mouvement avait déjà été appliqué : on confirme.
 * - projection == ledger    -> on applique puis on confirme (ou on annule si stock insuffisant).
 * - sinon                   -> on laisse le mouvement en attente et on le signale.
 */
export async function reconcilerMouvements() {
  const seuil = new Date(Date.now() - DELAI_RECONCILIATION_MS)
  const enAttente = await MouvementStock.find({
    statut: 'En attente',
    createdAt: { $lte: seuil },
  }).sort({ createdAt: 1 })

  const rapport = { confirmes: 0, annules: 0, divergents: [] }

  for (const mouvement of enAttente) {
    const produitId = mouvement.produit?._id ?? mouvement.produit
    const produit = await Produit.findById(produitId)
    if (!produit) {
      await annulerMouvement(mouvement, 'Produit introuvable')
      rapport.annules += 1
      continue
    }

    const stockLedger = await calculerStockLedger(produitId)
    const attendu = arrondir(stockLedger + variation(mouvement))

    if (produit.quantiteDisponible === attendu) {
      await MouvementStock.findByIdAndUpdate(mouvement._id, {
        $set: {
          statut: 'Confirmé',
          quantiteAvant: stockLedger,
          quantiteApres: attendu,
          motifAnnulation: null,
        },
      })
      rapport.confirmes += 1
      continue
    }

    if (produit.quantiteDisponible === stockLedger) {
      if (variation(mouvement) < 0 && stockLedger < mouvement.quantite) {
        await annulerMouvement(mouvement, 'Stock insuffisant lors de la réconciliation')
        rapport.annules += 1
        continue
      }

      await Produit.findByIdAndUpdate(
        produitId,
        { $set: { quantiteDisponible: attendu } },
        { runValidators: true }
      )
      await MouvementStock.findByIdAndUpdate(mouvement._id, {
        $set: {
          statut: 'Confirmé',
          quantiteAvant: stockLedger,
          quantiteApres: attendu,
          motifAnnulation: null,
        },
      })
      rapport.confirmes += 1
      continue
    }

    rapport.divergents.push({
      id: mouvement.id,
      reference: mouvement.reference,
      stockLedger,
      stockProduit: produit.quantiteDisponible,
      quantiteAttendueApresApplication: attendu,
    })
  }

  // Dernière passe : toute projection est alignée sur le grand livre.
  const produits = await Produit.find({})
  for (const produit of produits) {
    const stockLedger = await calculerStockLedger(produit._id)
    if (produit.quantiteDisponible !== stockLedger) {
      await Produit.findByIdAndUpdate(
        produit._id,
        { $set: { quantiteDisponible: stockLedger } },
        { runValidators: true }
      )
    }
  }

  return rapport
}
