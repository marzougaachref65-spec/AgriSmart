import './helpers/garde.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  echapperCsv,
  genererCsv,
  lignesVeterinaire,
} from '../src/services/exportRapportService.js'
import {
  assainir,
  resoudrePeriodeRapport,
} from '../src/services/rapportService.js'

test('échappement CSV : guillemets, point-virgule et saut de ligne', () => {
  assert.equal(echapperCsv('simple'), 'simple')
  assert.equal(echapperCsv('a;b'), '"a;b"')
  assert.equal(echapperCsv('a"b'), '"a""b"')
  assert.equal(echapperCsv('a\r\nb'), '"a\r\nb"')
  assert.equal(echapperCsv(undefined), '')
})

test('CSV : BOM UTF-8, séparateur ; et CRLF', () => {
  const csv = genererCsv([
    ['Section', 'Libellé'],
    ['Test', 'valeur'],
  ])
  assert.ok(csv.startsWith('\uFEFF'))
  assert.ok(csv.includes('\r\n'))
  assert.ok(csv.split('\r\n')[0].includes(';'))
  assert.doesNotMatch(csv, /millimes/i)
})

test('CSV vétérinaire lit les indicateurs réels du rapport', () => {
  const lignes = lignesVeterinaire({
    indicateurs: {
      totalDossiers: 1,
      totalEvenements: 2,
      evenementsParType: { Vaccination: 2 },
      rappelsPlanifies: 3,
    },
  })
  assert.ok(
    lignes.some((l) => l[1] === 'Dossiers médicaux' && l[2] === '1'),
    JSON.stringify(lignes)
  )
  assert.ok(
    lignes.some((l) => l[0] === 'Événements par type' && l[1] === 'Vaccination'),
    JSON.stringify(lignes)
  )
  assert.ok(
    lignes.some((l) => l[1] === 'Rappels planifiés' && l[2] === '3'),
    JSON.stringify(lignes)
  )
})

test('CSV vétérinaire sans indicateurs affiche des valeurs vides', () => {
  const lignes = lignesVeterinaire({})
  assert.ok(Array.isArray(lignes))
  assert.ok(lignes.length > 0)
  assert.ok(
    lignes.every((ligne) => ligne[2] === ''),
    JSON.stringify(lignes)
  )
})

test('assainissage récursif retire millimes et champs salariaux', () => {
  const sale = {
    montantMillimes: 25750,
    salaire: 35000,
    periodiciteSalaire: 'Mensuel',
    total: 1,
    imbrique: [{ salaireMillimes: 1, libelle: 'OK' }],
  }
  assert.deepEqual(assainir(sale), {
    total: 1,
    imbrique: [{ libelle: 'OK' }],
  })
})

test('période par défaut et période explicite cohérentes', () => {
  const implicite = resoudrePeriodeRapport()
  assert.ok(implicite.debut <= implicite.fin)

  const explicite = resoudrePeriodeRapport('2026-01-01', '2026-01-31')
  assert.equal(explicite.debut.getUTCFullYear(), 2026)
  assert.equal(explicite.fin.getUTCMonth(), 0)
})

test('période inversée refusée', () => {
  assert.throws(
    () => resoudrePeriodeRapport('2026-02-01', '2026-01-01'),
    /postérieure à la date de début/
  )
})
