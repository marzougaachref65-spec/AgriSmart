import test from 'node:test'
import assert from 'node:assert/strict'
import { avecVite } from './helpers/ssr.mjs'

test('six onglets et deux formats uniquement', async () => {
  await avecVite(async (vite) => {
    const utils = await vite.ssrLoadModule('/src/utils/rapports.js')
    assert.deepEqual(utils.FORMATS_EXPORT, ['CSV', 'JSON'])
    assert.deepEqual(
      utils.ONGLETS_RAPPORT.map((onglet) => onglet.id),
      [
        'synthese',
        'animaux-cultures',
        'stocks',
        'veterinaire',
        'finances',
        'employes-taches',
      ]
    )
  })
})

test('période convertie en ISO avec bornes locales explicites', async () => {
  await avecVite(async (vite) => {
    const utils = await vite.ssrLoadModule('/src/utils/rapports.js')
    const parametres = utils.parametresPeriode({
      debut: '2026-01-01',
      fin: '2026-01-31',
    })
    const debut = new Date(parametres.debut)
    const fin = new Date(parametres.fin)
    assert.equal(debut.getHours(), 0)
    assert.equal(debut.getMinutes(), 0)
    assert.equal(fin.getHours(), 23)
    assert.equal(fin.getMinutes(), 59)
    assert.ok(fin > debut)
    assert.deepEqual(utils.parametresPeriode({}), {})
  })
})

test('nom de fichier d’export conforme et sans format simulé', async () => {
  await avecVite(async (vite) => {
    const utils = await vite.ssrLoadModule('/src/utils/rapports.js')
    const nom = utils.nomFichierExport('stocks', 'CSV', {
      debut: '2026-01-01',
      fin: '2026-01-31',
    })
    assert.match(nom, /^agrismart-rapport-stocks-\d{4}-\d{2}-\d{2}\.csv$/)
    assert.ok(!/pdf|xlsx|xls/i.test(nom))
  })
})

test('valeur brute de stock formatée sans millimes', async () => {
  await avecVite(async (vite) => {
    const utils = await vite.ssrLoadModule('/src/utils/rapports.js')
    assert.equal(utils.formatValeurBrute(50), '50,00 DT')
    assert.equal(utils.formatValeurBrute(null), '—')
  })
})

test('lecture d’une erreur Blob JSON ou texte', async () => {
  await avecVite(async (vite) => {
    const utils = await vite.ssrLoadModule('/src/utils/rapports.js')
    const json = new Blob([JSON.stringify({ message: 'Accès refusé' })], {
      type: 'application/json',
    })
    assert.equal(
      await utils.messageErreurRapport({ response: { data: json } }, 'repli'),
      'Accès refusé'
    )
    const texte = new Blob(['Erreur brute'], { type: 'text/plain' })
    assert.equal(
      await utils.messageErreurRapport({ response: { data: texte } }, 'repli'),
      'Erreur brute'
    )
    assert.equal(
      await utils.messageErreurRapport({}, 'repli'),
      'repli'
    )
  })
})
