import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  HeartPulse,
  PawPrint,
  Sprout,
  Wallet,
} from 'lucide-react'
import { Loader2 } from 'lucide-react'
import Badge from '../../components/common/Badge'
import { Card, CardBody, CardHeader } from '../../components/common/Card'
import EtatVide from '../../components/rapports/EtatVide'
import GraphiqueRapport from '../../components/rapports/GraphiqueRapport'
import StatCard from '../../components/common/StatCard'
import {
  formatNombre,
  formatValeurBrute,
  periodeAffichee,
} from '../../utils/rapports'

function domaine(rapport, nom) {
  const entree = rapport?.domaines?.[nom]
  return entree?.statut === 'ok' ? entree.donnees : null
}

export default function StatistiquesSynthese({ rapport, chargement }) {
  if (chargement || !rapport) {
    return (
      <Card>
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          Calcul de la synthèse à partir de MongoDB...
        </div>
      </Card>
    )
  }

  const animauxCultures = domaine(rapport, 'animaux-cultures')
  const stocks = domaine(rapport, 'stocks')
  const veterinaire = domaine(rapport, 'veterinaire')
  const finances = domaine(rapport, 'finances')
  const ressources = domaine(rapport, 'employes-taches')

  const totaux = finances?.synthese?.tableauDeBord?.totaux ?? {}
  const alertesStock = stocks?.indicateurs?.alertes ?? {}
  const alertes = [
    {
      label: 'Produits en stock faible',
      valeur: alertesStock.faible ?? 0,
      ton: (alertesStock.faible ?? 0) > 0 ? 'warning' : 'success',
    },
    {
      label: 'Rappels vétérinaires en retard',
      valeur: veterinaire?.indicateurs?.rappelsEnRetard ?? 0,
      ton: (veterinaire?.indicateurs?.rappelsEnRetard ?? 0) > 0 ? 'danger' : 'success',
    },
    {
      label: 'Opérations impayées',
      valeur: totaux.impayees ?? 0,
      ton: (totaux.impayees ?? 0) > 0 ? 'warning' : 'success',
    },
    {
      label: 'Tâches en retard',
      valeur: ressources?.indicateurs?.taches?.enRetard ?? 0,
      ton: (ressources?.indicateurs?.taches?.enRetard ?? 0) > 0 ? 'warning' : 'success',
    },
  ]

  const repartition = Object.entries(
    animauxCultures?.indicateurs?.animaux ?? {}
  )
    .filter(([cle]) => ['males', 'femelles', 'malades'].includes(cle))
    .map(([cle, valeur]) => ({
      libelle: { males: 'Mâles', femelles: 'Femelles', malades: 'Malades' }[cle],
      valeur,
    }))

  const domainesEnErreur = Object.entries(rapport.domaines ?? {}).filter(
    ([, entree]) => entree.statut !== 'ok'
  )

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">Période :</span>{' '}
        {periodeAffichee(rapport)} — toutes les valeurs proviennent de MongoDB et
        sont calculées à la demande.
      </div>

      {domainesEnErreur.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Certains domaines n’ont pas pu être calculés :{' '}
          {domainesEnErreur.map(([nom]) => nom).join(', ')}.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titre="Animaux suivis"
          valeur={formatNombre(animauxCultures?.indicateurs?.animaux?.total ?? 0)}
          icone={PawPrint}
          complement="État actuel"
        />
        <StatCard
          titre="Parcelles"
          valeur={formatNombre(animauxCultures?.indicateurs?.parcelles?.total ?? 0)}
          icone={Sprout}
          complement={`${formatNombre(
            animauxCultures?.indicateurs?.parcelles?.superficieTotale ?? 0
          )} ha`}
        />
        <StatCard
          titre="Valeur du stock (grand livre)"
          valeur={formatValeurBrute(
            stocks?.indicateurs?.valeurTotaleStockLedger ?? 0
          )}
          icone={Boxes}
          complement="ADMIN / MANAGER"
        />
        <StatCard
          titre="Dépenses de la période"
          valeur={formatValeurBrute(totaux.depenses ?? 0)}
          icone={Wallet}
          complement={periodeAffichee(finances)}
        />
        <StatCard
          titre="Dossiers médicaux"
          valeur={formatNombre(veterinaire?.indicateurs?.totalDossiers ?? 0)}
          icone={HeartPulse}
          complement="État actuel"
        />
        <StatCard
          titre="Employés enregistrés"
          valeur={formatNombre(ressources?.indicateurs?.employes?.total ?? 0)}
          icone={ClipboardList}
          complement="Sans données salariales"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            titre="Alertes en cours"
            sousTitre="Compteurs calculés sur les données réelles"
          />
          <CardBody className="space-y-3">
            {alertes.every((alerte) => alerte.valeur === 0) ? (
              <EtatVide
                titre="Aucune alerte en cours"
                message="Aucune alerte n'est déclenchée sur les données actuellement enregistrées."
              />
            ) : (
              alertes.map((alerte) => (
                <div
                  key={alerte.label}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                >
                  <span className="text-sm text-slate-700">{alerte.label}</span>
                  <div className="flex items-center gap-2">
                    <Badge ton={alerte.ton}>{formatNombre(alerte.valeur)}</Badge>
                    {alerte.valeur > 0 && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <GraphiqueRapport
          titre="Répartition du cheptel"
          sousTitre="Effectif réel, sans donnée de démonstration"
          type="pie"
          donnees={repartition.filter((entree) => entree.valeur > 0)}
          cleLibelle="libelle"
          cleValeur="valeur"
          formatterValeur={(valeur) => formatNombre(valeur)}
        />
      </div>

      <Card>
        <CardHeader
          titre="Limites des données affichées"
          sousTitre="Pour éviter toute interprétation erronée"
        />
        <CardBody className="space-y-2 text-xs leading-relaxed text-slate-600">
          <p>
            • Les effectifs animaux, parcelles, cycles et employés décrivent l’état
            actuel de la base : ils ne sont pas filtrés par la période.
          </p>
          <p>
            • En vétérinaire, seules les consultations suivent la période ; les
            autres compteurs portent sur l’ensemble des données.
          </p>
          <p>
            • La synthèse financière est limitée à 1 000 opérations ; l’export CSV
            va jusqu’à 10 000 opérations.
          </p>
          <p>
            • Les quantités de stock proviennent exclusivement du grand livre des
            mouvements confirmés.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
