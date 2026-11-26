import mongoose from 'mongoose'
import Animal from '../models/Animal.js'
import DossierMedical from '../models/DossierMedical.js'
import EvenementVeterinaire from '../models/EvenementVeterinaire.js'
import RappelSoin from '../models/RappelSoin.js'
import { ApiError } from '../utils/apiError.js'
import { formaterAnimalRef, formaterRefs } from '../utils/refsVeterinaire.js'
import { getDossierParAnimal, verifierAnimalExiste } from './dossierService.js'
import { listerEvenementsParAnimal } from './evenementService.js'
import { listerOriginesRappelsVaccination } from './rappelService.js'

/** Horizon d'alerte validé : 30 jours, surchargeable via ?jours=. */
export const DELAI_ALERTE_RAPPEL_JOURS = 30

const JOUR_MS = 24 * 60 * 60 * 1000

function commeDate(valeur) {
  if (!valeur) return null
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

function verifierAnimalId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Identifiant d'animal invalide")
  }
}

function resoudrePeriodeStatistiques(debut, fin) {
  const dateFin = commeDate(fin) ?? new Date()
  const dateDebut =
    commeDate(debut) ?? new Date(dateFin.getTime() - DELAI_ALERTE_RAPPEL_JOURS * JOUR_MS)
  if (dateFin.getTime() < dateDebut.getTime()) {
    throw new ApiError(400, 'La date de fin doit être postérieure à la date de début')
  }
  return { debut: dateDebut, fin: dateFin }
}

function resoudrePeriodeCalendrier(debut, fin) {
  const dateDebut = commeDate(debut) ?? new Date()
  const dateFin = commeDate(fin) ?? new Date(dateDebut.getTime() + 30 * JOUR_MS)
  if (dateFin.getTime() < dateDebut.getTime()) {
    throw new ApiError(400, 'La date de fin doit être postérieure à la date de début')
  }
  return { debut: dateDebut, fin: dateFin }
}

function itemAlerte({
  id,
  source,
  sourceId,
  titre,
  type,
  date,
  animal,
  estRappel = false,
  estTraitementEnCours = false,
  estMaladieActive = false,
}) {
  return {
    id,
    source,
    sourceId,
    titre,
    type,
    date,
    animal,
    estRappel,
    estTraitementEnCours,
    estMaladieActive,
  }
}

/** Une seule catégorie par élément, avec priorité explicite. */
function determinerAlerte(element, maintenant, limite) {
  if (element.estRappel) {
    const date = commeDate(element.date)
    if (date && date.getTime() < maintenant.getTime()) return 'rappelRetard'
    if (date && date.getTime() <= limite.getTime()) return 'rappelProche'
  }
  if (element.estTraitementEnCours) return 'traitementEnCours'
  if (element.estMaladieActive) return 'maladieActive'
  return null
}

function arrondir(valeur) {
  return Math.round((valeur ?? 0) * 100) / 100
}

/** Historique sanitaire complet d'un animal réel. */
export async function getHistoriqueAnimal(animalId) {
  verifierAnimalId(animalId)
  await verifierAnimalExiste(animalId)

  const animal = await Animal.findById(animalId).select(
    'name espece race sexe statut dateNaissance'
  )

  let dossier = null
  try {
    dossier = await getDossierParAnimal(animalId)
  } catch (erreur) {
    if (erreur.statusCode !== 404) throw erreur
  }

  const [evenements, rappelsBruts] = await Promise.all([
    listerEvenementsParAnimal(animalId),
    RappelSoin.find({ animal: animalId })
      .populate('animal', 'name espece statut')
      .populate('createdBy', 'name role')
      .populate('evenementOrigine', 'type reference')
      .sort({ datePrevue: 1, createdAt: -1 }),
  ])

  const rappels = rappelsBruts.map((rappel) => formaterRefs(rappel.toJSON()))

  return {
    animal: {
      id: animal._id.toString(),
      name: animal.name,
      espece: animal.espece,
      race: animal.race ?? '',
      sexe: animal.sexe,
      statut: animal.statut,
      dateNaissance: animal.dateNaissance ?? null,
    },
    dossier,
    evenements,
    rappels,
    totaux: {
      evenements: evenements.length,
      vaccinations: evenements.filter((e) => e.type === 'Vaccination').length,
      maladies: evenements.filter((e) => e.type === 'Maladie').length,
      traitements: evenements.filter((e) => e.type === 'Traitement').length,
      consultations: evenements.filter((e) => e.type === 'Consultation').length,
      rappels: rappels.length,
    },
  }
}

/** Agenda des soins : rappels, événements, dates de rappel et fins de traitement. */
export async function getCalendrier({ debut, fin } = {}) {
  const periode = resoudrePeriodeCalendrier(debut, fin)
  const maintenant = new Date()
  const limite = new Date(maintenant.getTime() + DELAI_ALERTE_RAPPEL_JOURS * JOUR_MS)

  const [rappels, evenements, rappelsVaccination, traitements] = await Promise.all([
    RappelSoin.find({
      statut: { $ne: 'Annulé' },
      datePrevue: { $gte: periode.debut, $lte: periode.fin },
    })
      .populate('animal', 'name espece statut')
      .sort({ datePrevue: 1 }),
    EvenementVeterinaire.find({
      date: { $gte: periode.debut, $lte: periode.fin },
    })
      .populate('animal', 'name espece statut')
      .sort({ date: 1 }),
    EvenementVeterinaire.find({
      type: 'Vaccination',
      dateRappel: { $ne: null, $gte: periode.debut, $lte: periode.fin },
    })
      .populate('animal', 'name espece statut')
      .sort({ dateRappel: 1 }),
    EvenementVeterinaire.find({
      type: 'Traitement',
      statutTraitement: 'En cours',
      dateFin: { $ne: null, $gte: periode.debut, $lte: periode.fin },
    })
      .populate('animal', 'name espece statut')
      .sort({ dateFin: 1 }),
  ])

  const entrees = []

  for (const rappel of rappels) {
    entrees.push(
      itemAlerte({
        id: `rappel:${rappel.id}`,
        source: 'RappelSoin',
        sourceId: rappel._id.toString(),
        titre: rappel.titre || rappel.type,
        type: rappel.type,
        date: rappel.datePrevue,
        animal: formaterAnimalRef(rappel.animal),
        estRappel: rappel.statut === 'Planifié',
      })
    )
  }

  for (const evenement of evenements) {
    entrees.push(
      itemAlerte({
        id: `evenement:${evenement.id}`,
        source: 'EvenementVeterinaire',
        sourceId: evenement._id.toString(),
        titre: evenement.libelle || evenement.type,
        type: evenement.type,
        date: evenement.date,
        animal: formaterAnimalRef(evenement.animal),
      })
    )
  }

  const origines = await listerOriginesRappelsVaccination()
  for (const vaccination of rappelsVaccination) {
    if (origines.has(vaccination._id.toString())) continue
    entrees.push(
      itemAlerte({
        id: `rappelVaccin:${vaccination.id}`,
        source: 'EvenementVeterinaire',
        sourceId: vaccination._id.toString(),
        titre: `Rappel de vaccination — ${vaccination.vaccin}`,
        type: 'Rappel de vaccination',
        date: vaccination.dateRappel,
        animal: formaterAnimalRef(vaccination.animal),
        estRappel: true,
      })
    )
  }

  for (const traitement of traitements) {
    entrees.push(
      itemAlerte({
        id: `finTraitement:${traitement.id}`,
        source: 'EvenementVeterinaire',
        sourceId: traitement._id.toString(),
        titre: `Fin de traitement — ${traitement.medicament}`,
        type: 'Fin de traitement',
        date: traitement.dateFin,
        animal: formaterAnimalRef(traitement.animal),
        estTraitementEnCours: true,
      })
    )
  }

  return entrees
    .map((entree) => ({
      ...entree,
      alerte: determinerAlerte(entree, maintenant, limite),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

/** Alertes disjointes calculées sur les vraies données MongoDB. */
export async function getAlertes({ jours = DELAI_ALERTE_RAPPEL_JOURS } = {}) {
  const maintenant = new Date()
  const limite = new Date(maintenant.getTime() + jours * JOUR_MS)

  const [rappels, origines, vaccinations, traitements, maladies] = await Promise.all([
    RappelSoin.find({ statut: 'Planifié' })
      .populate('animal', 'name espece statut')
      .sort({ datePrevue: 1 }),
    listerOriginesRappelsVaccination(),
    EvenementVeterinaire.find({
      type: 'Vaccination',
      dateRappel: { $ne: null, $lte: limite },
    })
      .populate('animal', 'name espece statut')
      .sort({ dateRappel: 1 }),
    EvenementVeterinaire.find({
      type: 'Traitement',
      statutTraitement: 'En cours',
      $or: [{ dateFin: null }, { dateFin: { $gte: maintenant } }],
    })
      .populate('animal', 'name espece statut')
      .sort({ date: -1 }),
    EvenementVeterinaire.find({
      type: 'Maladie',
      statutMaladie: 'En cours',
    })
      .populate('animal', 'name espece statut')
      .sort({ date: -1 }),
  ])

  const elements = []

  for (const rappel of rappels) {
    elements.push(
      itemAlerte({
        id: `rappel:${rappel.id}`,
        source: 'RappelSoin',
        sourceId: rappel._id.toString(),
        titre: rappel.titre || rappel.type,
        type: rappel.type,
        date: rappel.datePrevue,
        animal: formaterAnimalRef(rappel.animal),
        estRappel: true,
      })
    )
  }

  for (const vaccination of vaccinations) {
    if (origines.has(vaccination._id.toString())) continue
    elements.push(
      itemAlerte({
        id: `rappelVaccin:${vaccination.id}`,
        source: 'EvenementVeterinaire',
        sourceId: vaccination._id.toString(),
        titre: `Rappel de vaccination — ${vaccination.vaccin}`,
        type: 'Rappel de vaccination',
        date: vaccination.dateRappel,
        animal: formaterAnimalRef(vaccination.animal),
        estRappel: true,
      })
    )
  }

  for (const traitement of traitements) {
    elements.push(
      itemAlerte({
        id: `traitement:${traitement.id}`,
        source: 'EvenementVeterinaire',
        sourceId: traitement._id.toString(),
        titre: `Traitement en cours — ${traitement.medicament}`,
        type: 'Traitement',
        date: traitement.dateFin ?? traitement.date,
        animal: formaterAnimalRef(traitement.animal),
        estTraitementEnCours: true,
      })
    )
  }

  for (const maladie of maladies) {
    elements.push(
      itemAlerte({
        id: `maladie:${maladie.id}`,
        source: 'EvenementVeterinaire',
        sourceId: maladie._id.toString(),
        titre: `Maladie active — ${maladie.nomMaladie}`,
        type: 'Maladie',
        date: maladie.date,
        animal: formaterAnimalRef(maladie.animal),
        estMaladieActive: true,
      })
    )
  }

  const avecAlerte = elements
    .map((element) => ({
      id: element.id,
      source: element.source,
      sourceId: element.sourceId,
      titre: element.titre,
      type: element.type,
      date: element.date,
      animal: element.animal,
      alerte: determinerAlerte(element, maintenant, limite),
    }))
    .filter((element) => element.alerte !== null)

  const groupe = (alerte) => ({
    alerte,
    count: avecAlerte.filter((element) => element.alerte === alerte).length,
    items: avecAlerte.filter((element) => element.alerte === alerte),
  })

  return {
    rappelRetard: groupe('rappelRetard'),
    rappelProche: groupe('rappelProche'),
    traitementEnCours: groupe('traitementEnCours'),
    maladieActive: groupe('maladieActive'),
    delaiJours: jours,
  }
}

/** Statistiques calculées exclusivement sur les données MongoDB réelles. */
export async function getStatistiquesVeterinaires({ debut, fin } = {}) {
  const periode = resoudrePeriodeStatistiques(debut, fin)
  const maintenant = new Date()
  const limite = new Date(
    maintenant.getTime() + DELAI_ALERTE_RAPPEL_JOURS * JOUR_MS
  )

  const [
    totalDossiers,
    totalEvenements,
    parType,
    rappelsPlanifies,
    rappelsEnRetard,
    traitementsEnCours,
    maladiesActives,
    vaccinationsAVenir,
    consultations,
  ] = await Promise.all([
    DossierMedical.countDocuments({}),
    EvenementVeterinaire.countDocuments({}),
    EvenementVeterinaire.aggregate([
      { $group: { _id: '$type', nombre: { $sum: 1 } } },
    ]),
    RappelSoin.countDocuments({ statut: 'Planifié' }),
    RappelSoin.countDocuments({
      statut: 'Planifié',
      datePrevue: { $lt: maintenant },
    }),
    EvenementVeterinaire.countDocuments({
      type: 'Traitement',
      statutTraitement: 'En cours',
    }),
    EvenementVeterinaire.countDocuments({
      type: 'Maladie',
      statutMaladie: 'En cours',
    }),
    EvenementVeterinaire.countDocuments({
      type: 'Vaccination',
      dateRappel: { $gte: maintenant, $lte: limite },
    }),
    EvenementVeterinaire.aggregate([
      {
        $match: {
          type: 'Consultation',
          date: { $gte: periode.debut, $lte: periode.fin },
        },
      },
      {
        $group: {
          _id: null,
          nombre: { $sum: 1 },
          coutTotal: { $sum: { $ifNull: ['$cout', 0] } },
        },
      },
    ]),
  ])

  const evenementsParType = {
    Vaccination: 0,
    Maladie: 0,
    Traitement: 0,
    Consultation: 0,
  }
  for (const ligne of parType) {
    if (ligne._id in evenementsParType) {
      evenementsParType[ligne._id] = ligne.nombre
    }
  }

  return {
    totalDossiers,
    totalEvenements,
    evenementsParType,
    rappelsPlanifies,
    rappelsEnRetard,
    traitementsEnCours,
    maladiesActives,
    vaccinationsAVenir,
    consultations: {
      nombre: consultations[0]?.nombre ?? 0,
      coutTotal: arrondir(consultations[0]?.coutTotal),
    },
    periode: {
      debut: periode.debut.toISOString(),
      fin: periode.fin.toISOString(),
    },
  }
}
