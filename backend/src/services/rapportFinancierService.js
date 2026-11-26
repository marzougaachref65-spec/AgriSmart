import CategorieFinanciere from '../models/CategorieFinanciere.js'
import OperationFinanciere from '../models/OperationFinanciere.js'
import { ApiError } from '../utils/apiError.js'
import {
  formaterOperation,
  millimesVersTexte,
  millimesVersTnd,
} from '../utils/refsFinancieres.js'

function commeDate(valeur) {
  if (valeur === undefined || valeur === null || valeur === '') return null
  const date = valeur instanceof Date ? valeur : new Date(valeur)
  return Number.isNaN(date.getTime()) ? null : date
}

export function resoudrePeriode(debut, fin) {
  const dateFin = commeDate(fin) ?? new Date()
  const dateDebut =
    commeDate(debut) ?? new Date(new Date().getFullYear(), 0, 1)

  if (dateFin.getTime() < dateDebut.getTime()) {
    throw new ApiError(400, 'La date de fin doit être postérieure à la date de début')
  }

  return { debut: dateDebut, fin: dateFin }
}

function periodeFormatee(periode) {
  return {
    debut: periode.debut.toISOString(),
    fin: periode.fin.toISOString(),
  }
}

function filtrePeriode(periode) {
  return {
    statut: 'Actif',
    date: { $gte: periode.debut, $lte: periode.fin },
  }
}

function enTnd(millimes) {
  return millimesVersTnd(millimes)
}

const populerRapport = (requete) =>
  requete
    .populate('categorie', 'code libelle type couleur')
    .populate('createdBy', 'name role')

export async function getTableauDeBord(filtres = {}) {
  const periode = resoudrePeriode(filtres.debut, filtres.fin)
  const filtre = filtrePeriode(periode)

  const [totaux, recentes] = await Promise.all([
    OperationFinanciere.aggregate([
      { $match: filtre },
      {
        $group: {
          _id: null,
          totalRevenusMillimes: {
            $sum: { $cond: [{ $eq: ['$type', 'Revenu'] }, '$montantMillimes', 0] },
          },
          totalDepensesMillimes: {
            $sum: { $cond: [{ $eq: ['$type', 'Depense'] }, '$montantMillimes', 0] },
          },
          operationCount: { $sum: 1 },
          revenuCount: {
            $sum: { $cond: [{ $eq: ['$type', 'Revenu'] }, 1, 0] },
          },
          depenseCount: {
            $sum: { $cond: [{ $eq: ['$type', 'Depense'] }, 1, 0] },
          },
          impayeesCount: {
            $sum: { $cond: [{ $ne: ['$statutPaiement', 'Payé'] }, 1, 0] },
          },
          impayeesMontantMillimes: {
            $sum: {
              $cond: [
                { $ne: ['$statutPaiement', 'Payé'] },
                '$montantMillimes',
                0,
              ],
            },
          },
        },
      },
    ]),
    populerRapport(
      OperationFinanciere.find(filtre)
        .sort({ date: -1, createdAt: -1 })
        .limit(5)
    ),
  ])

  const t = totaux[0] ?? {}
  const totalRevenusMillimes = t.totalRevenusMillimes ?? 0
  const totalDepensesMillimes = t.totalDepensesMillimes ?? 0
  const beneficeMillimes = totalRevenusMillimes - totalDepensesMillimes
  const impayeesMontantMillimes = t.impayeesMontantMillimes ?? 0

  return {
    periode: periodeFormatee(periode),
    totaux: {
      /* Valeurs entières utilisées par l'interface pour éviter tout calcul flottant. */
      revenusMillimes: totalRevenusMillimes,
      depensesMillimes: totalDepensesMillimes,
      beneficeMillimes,
      soldeMillimes: beneficeMillimes,
      impayeesMontantMillimes,
      /* Valeurs décimales conservées pour les consommateurs API existants. */
      revenus: enTnd(totalRevenusMillimes),
      depenses: enTnd(totalDepensesMillimes),
      benefice: enTnd(beneficeMillimes),
      solde: enTnd(beneficeMillimes),
      impayeesMontant: enTnd(impayeesMontantMillimes),
      operations: t.operationCount ?? 0,
      impayees: t.impayeesCount ?? 0,
    },
    totalRevenusMillimes,
    totalDepensesMillimes,
    beneficeMillimes,
    soldeMillimes: beneficeMillimes,
    operationCount: t.operationCount ?? 0,
    revenuCount: t.revenuCount ?? 0,
    depenseCount: t.depenseCount ?? 0,
    impayeesCount: t.impayeesCount ?? 0,
    impayeesMontantMillimes,
    totalRevenus: enTnd(totalRevenusMillimes),
    totalDepenses: enTnd(totalDepensesMillimes),
    benefice: enTnd(beneficeMillimes),
    solde: enTnd(beneficeMillimes),
    impayeesMontant: enTnd(impayeesMontantMillimes),
    operationsRecentes: recentes.map((operation) => formaterOperation(operation)),
  }
}

export async function getStatistiquesFinancieres(filtres = {}) {
  const periode = resoudrePeriode(filtres.debut, filtres.fin)
  const filtre = filtrePeriode(periode)

  const [parTypeBrut, parCategorieBrut, evolutionBrut, impayesBrut, modesBrut] =
    await Promise.all([
      OperationFinanciere.aggregate([
        { $match: filtre },
        {
          $group: {
            _id: '$type',
            nombre: { $sum: 1 },
            montantMillimes: { $sum: '$montantMillimes' },
          },
        },
      ]),
      OperationFinanciere.aggregate([
        { $match: filtre },
        {
          $group: {
            _id: '$categorie',
            nombre: { $sum: 1 },
            montantMillimes: { $sum: '$montantMillimes' },
          },
        },
        {
          $lookup: {
            from: CategorieFinanciere.collection.collectionName,
            localField: '_id',
            foreignField: '_id',
            as: 'categorie',
          },
        },
        {
          $unwind: { path: '$categorie', preserveNullAndEmptyArrays: true },
        },
        { $sort: { montantMillimes: -1 } },
      ]),
      OperationFinanciere.aggregate([
        { $match: filtre },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            revenusMillimes: {
              $sum: {
                $cond: [
                  { $eq: ['$type', 'Revenu'] },
                  '$montantMillimes',
                  0,
                ],
              },
            },
            depensesMillimes: {
              $sum: {
                $cond: [
                  { $eq: ['$type', 'Depense'] },
                  '$montantMillimes',
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            mois: '$_id',
            revenusMillimes: 1,
            depensesMillimes: 1,
            beneficeMillimes: {
              $subtract: ['$revenusMillimes', '$depensesMillimes'],
            },
          },
        },
      ]),
      OperationFinanciere.aggregate([
        { $match: { ...filtre, statutPaiement: { $ne: 'Payé' } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            montantMillimes: { $sum: '$montantMillimes' },
          },
        },
      ]),
      OperationFinanciere.aggregate([
        { $match: { ...filtre, 'paiements.0': { $exists: true } } },
        { $unwind: '$paiements' },
        {
          $group: {
            _id: '$paiements.mode',
            nombre: { $sum: 1 },
            montantMillimes: { $sum: '$paiements.montantMillimes' },
          },
        },
        { $sort: { montantMillimes: -1 } },
      ]),
    ])

  const totauxParType = new Map(
    parTypeBrut.map((ligne) => [
      ligne._id,
      { nombre: ligne.nombre ?? 0, montantMillimes: ligne.montantMillimes ?? 0 },
    ])
  )
  const parType = ['Revenu', 'Depense'].map((type) => {
    const valeurs = totauxParType.get(type) ?? {
      nombre: 0,
      montantMillimes: 0,
    }
    return {
      type,
      nombre: valeurs.nombre,
      montantMillimes: valeurs.montantMillimes,
      montant: enTnd(valeurs.montantMillimes),
    }
  })

  const parCategorie = parCategorieBrut
    .map((ligne) => {
      const categorie = ligne.categorie ?? {}
      return {
        categorieId: ligne._id?.toString() ?? null,
        code: categorie.code ?? '',
        libelle: categorie.libelle ?? '',
        type: categorie.type ?? null,
        nombre: ligne.nombre ?? 0,
        montantMillimes: ligne.montantMillimes ?? 0,
        montant: enTnd(ligne.montantMillimes),
      }
    })
    .sort((a, b) => b.montantMillimes - a.montantMillimes)

  const evolutionMensuelle = evolutionBrut.map((ligne) => ({
    mois: ligne.mois,
    revenusMillimes: ligne.revenusMillimes ?? 0,
    depensesMillimes: ligne.depensesMillimes ?? 0,
    beneficeMillimes: ligne.beneficeMillimes ?? 0,
    revenus: enTnd(ligne.revenusMillimes),
    depenses: enTnd(ligne.depensesMillimes),
    benefice: enTnd(ligne.beneficeMillimes),
  }))

  const impayes = {
    count: impayesBrut[0]?.count ?? 0,
    montantMillimes: impayesBrut[0]?.montantMillimes ?? 0,
    montant: enTnd(impayesBrut[0]?.montantMillimes),
  }

  const paiementsParMode = modesBrut.map((ligne) => ({
    mode: ligne._id,
    nombre: ligne.nombre ?? 0,
    montantMillimes: ligne.montantMillimes ?? 0,
    montant: enTnd(ligne.montantMillimes),
  }))

  return {
    periode: periodeFormatee(periode),
    parType,
    parCategorie,
    evolutionMensuelle,
    impayes,
    paiementsParMode,
  }
}

export async function getRapportSynthese(filtres = {}) {
  const periode = resoudrePeriode(filtres.debut, filtres.fin)

  const [tableauDeBord, statistiques, operations] = await Promise.all([
    getTableauDeBord({ debut: periode.debut, fin: periode.fin }),
    getStatistiquesFinancieres({ debut: periode.debut, fin: periode.fin }),
    populerRapport(
      OperationFinanciere.find(filtrePeriode(periode))
        .sort({ date: -1, createdAt: -1 })
        .limit(1000)
    ),
  ])

  return {
    periode: periodeFormatee(periode),
    tableauDeBord,
    statistiques,
    operations: operations.map((operation) => formaterOperation(operation)),
    genereLe: new Date().toISOString(),
  }
}

const EN_TETES_CSV = [
  'Date',
  'Type',
  'Libellé',
  'Catégorie',
  'Montant (DT)',
  'Mode de paiement',
  'Statut paiement',
  'Statut',
  'Référence',
  'Description',
]

function formatMontantCsv(millimes) {
  return millimesVersTexte(millimes) ?? ''
}

function formaterDateCsv(valeur) {
  const date = commeDate(valeur)
  return date ? date.toISOString().slice(0, 10) : ''
}

/** Guillemets doublés et champs contenant un ';' encapsulés. */
function echapperCsv(valeur) {
  const texte =
    valeur === undefined || valeur === null ? '' : String(valeur)
  const avecGuillemets = texte.replace(/"/g, '""')
  return /[;"\r\n]/.test(avecGuillemets)
    ? `"${avecGuillemets}"`
    : avecGuillemets
}

export async function getRapportCsv(filtres = {}) {
  const periode = resoudrePeriode(filtres.debut, filtres.fin)
  const operations = await populerRapport(
    OperationFinanciere.find(filtrePeriode(periode))
      .sort({ date: -1, createdAt: -1 })
      .limit(10000)
  )

  const lignes = [EN_TETES_CSV.join(';')]

  for (const operation of operations) {
    const objet = formaterOperation(operation)
    const modes = Array.isArray(objet.paiements)
      ? objet.paiements.map((paiement) => paiement.mode).filter(Boolean)
      : []

    lignes.push(
      [
        formaterDateCsv(objet.date),
        objet.type ?? '',
        objet.libelle ?? '',
        objet.categorie?.libelle ?? '',
        formatMontantCsv(objet.montantMillimes),
        modes.join(', '),
        objet.statutPaiement ?? '',
        objet.statut ?? '',
        objet.reference ?? '',
        objet.description ?? '',
      ]
        .map(echapperCsv)
        .join(';')
    )
  }

  return `\uFEFF${lignes.join('\r\n')}`
}
