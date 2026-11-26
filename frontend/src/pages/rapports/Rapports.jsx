import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Download,
  FileJson,
  RefreshCw,
} from 'lucide-react'
import Button, { buttonStyles } from '../../components/common/Button'
import { Card, CardBody } from '../../components/common/Card'
import PageHeader from '../../components/common/PageHeader'
import FiltrePeriode from '../../components/rapports/FiltrePeriode'
import { useAuth } from '../../hooks/useAuth'
import {
  getExportCsvRapport,
  getExportJsonRapport,
  getRapportDomaine,
  getSyntheseRapports,
} from '../../services/rapportService'
import { ROLES_ENCADREMENT } from '../../utils/constants'
import {
  FORMATS_EXPORT,
  ONGLETS_RAPPORT,
  aujourdHui,
  debutAnnee,
  messageErreurRapport,
  nomFichierExport,
  parametresPeriode,
  telechargerContenu,
} from '../../utils/rapports'
import StatistiquesSynthese from './StatistiquesSynthese'
import StatistiquesAnimauxCultures from './StatistiquesAnimauxCultures'
import StatistiquesFinances from './StatistiquesFinances'
import StatistiquesStocks from './StatistiquesStocks'
import StatistiquesVeterinaire from './StatistiquesVeterinaire'
import StatistiquesEmployesTaches from './StatistiquesEmployesTaches'

const COMPOSANTS = {
  synthese: StatistiquesSynthese,
  'animaux-cultures': StatistiquesAnimauxCultures,
  stocks: StatistiquesStocks,
  veterinaire: StatistiquesVeterinaire,
  finances: StatistiquesFinances,
  'employes-taches': StatistiquesEmployesTaches,
}

function periodeInitiale() {
  return { debut: debutAnnee(), fin: aujourdHui(), rapide: 'annee' }
}

export default function Rapports() {
  const { hasRole } = useAuth()
  const [onglet, setOnglet] = useState('synthese')
  const [periode, setPeriode] = useState(periodeInitiale)
  const [rapports, setRapports] = useState({})
  const [chargement, setChargement] = useState(false)
  const [exportEnCours, setExportEnCours] = useState(false)
  const [erreur, setErreur] = useState('')
  const [notification, setNotification] = useState(null)
  const [version, setVersion] = useState(0)

  const peutConsulter = hasRole(...ROLES_ENCADREMENT)
  const parametres = parametresPeriode(periode)
  const cleRapport = `${onglet}:${parametres.debut ?? ''}:${parametres.fin ?? ''}:${version}`

  const charger = useCallback(async () => {
    if (!peutConsulter) return

    if (periode.debut && periode.fin && periode.debut > periode.fin) {
      setErreur('La date de début doit être antérieure à la date de fin.')
      return
    }

    setChargement(true)
    setErreur('')
    try {
      const donnees =
        onglet === 'synthese'
          ? await getSyntheseRapports(parametres)
          : await getRapportDomaine(onglet, parametres)
      setRapports((precedents) => ({ ...precedents, [onglet]: donnees }))
    } catch (e) {
      const message =
        e?.response?.status === 403
          ? 'Accès refusé : les rapports sont réservés aux administrateurs et gestionnaires.'
          : (e?.response?.data?.message ?? 'Impossible de générer le rapport.')
      setErreur(message)
    } finally {
      setChargement(false)
    }
  }, [onglet, parametres.debut, parametres.fin, peutConsulter, version]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    charger()
  }, [cleRapport]) // eslint-disable-line react-hooks/exhaustive-deps

  const actualiser = () => setVersion((valeur) => valeur + 1)

  const exporter = async (format) => {
    setExportEnCours(true)
    setErreur('')
    setNotification(null)
    try {
      const contenu =
        format === 'CSV'
          ? await getExportCsvRapport(onglet, parametres)
          : await getExportJsonRapport(onglet, parametres)
      const typeMime =
        format === 'CSV' ? 'text/csv;charset=utf-8' : 'application/json'
      telechargerContenu(
        contenu,
        nomFichierExport(onglet, format, periode),
        typeMime
      )
      setNotification({
        ton: 'success',
        message: `Export ${format} téléchargé : données réelles de la période sélectionnée.`,
      })
    } catch (e) {
      const message = await messageErreurRapport(
        e,
        `Impossible de générer l'export ${format}.`
      )
      setErreur(message)
    } finally {
      setExportEnCours(false)
    }
  }

  if (!peutConsulter) {
    return (
      <Card>
        <CardBody className="p-8 text-center text-sm text-slate-600">
          Les rapports et statistiques sont réservés aux administrateurs et
          gestionnaires.
        </CardBody>
      </Card>
    )
  }

  const Composant = COMPOSANTS[onglet] ?? StatistiquesSynthese
  const rapport = rapports[onglet]

  return (
    <div>
      <PageHeader
        titre="Rapports & statistiques"
        sousTitre="Analyses calculées à la demande sur les données MongoDB réelles — lecture seule"
        actions={
          <div className="flex flex-wrap gap-2">
            {FORMATS_EXPORT.map((format) => (
              <Button
                key={format}
                variante={format === 'CSV' ? 'primary' : 'outline'}
                taille="sm"
                onClick={() => exporter(format)}
                disabled={exportEnCours || chargement}
              >
                {format === 'CSV' ? (
                  <Download className="h-4 w-4" />
                ) : (
                  <FileJson className="h-4 w-4" />
                )}
                Exporter {format}
              </Button>
            ))}
          </div>
        }
      />

      <FiltrePeriode
        periode={periode}
        onPeriodeChange={setPeriode}
        onActualiser={actualiser}
        chargement={chargement}
      />

      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
        {ONGLETS_RAPPORT.map((entree) => (
          <button
            key={entree.id}
            type="button"
            role="tab"
            aria-selected={onglet === entree.id}
            onClick={() => {
              setOnglet(entree.id)
              setErreur('')
              setNotification(null)
            }}
            className={`rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
              onglet === entree.id
                ? 'border-b-2 border-brand-600 text-brand-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {entree.label}
          </button>
        ))}
      </div>

      {notification && (
        <div
          role="status"
          className={`mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            notification.ton === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          {notification.message}
        </div>
      )}

      {erreur && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {erreur}
          </span>
          <button
            type="button"
            onClick={actualiser}
            className={buttonStyles('outline', 'sm')}
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
        </div>
      )}

      <Composant rapport={rapport} chargement={chargement} />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs leading-relaxed text-slate-500">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <BarChart3 className="h-4 w-4 text-brand-600" />
          Formats disponibles
        </div>
        <p className="mt-1">
          Seuls les exports CSV (BOM UTF-8, séparateur « ; », CRLF) et JSON sont
          disponibles. Aucun PDF ni Excel n’est généré : aucun faux fichier de
          ce type n’est proposé.
        </p>
        <p className="mt-1">
          Les montants financiers et les salaires restent confidentiels ; les
          valeurs du stock proviennent exclusivement du grand livre des
          mouvements confirmés.
        </p>
      </div>
    </div>
  )
}
