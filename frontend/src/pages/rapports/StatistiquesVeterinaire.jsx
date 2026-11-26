import { AlertTriangle, HeartPulse, Syringe } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import Badge from '../../components/common/Badge'
import { Card, CardBody, CardHeader } from '../../components/common/Card'
import StatCard from '../../components/common/StatCard'
import EtatVide from '../../components/rapports/EtatVide'
import GraphiqueRapport from '../../components/rapports/GraphiqueRapport'
import {
  formatDate,
  formatNombre,
  formatValeurBrute,
  periodeAffichee,
} from '../../utils/rapports'

export default function StatistiquesVeterinaire({ rapport, chargement }) {
  if (chargement || !rapport) {
    return (
      <Card>
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          Calcul des statistiques vétérinaires...
        </div>
      </Card>
    )
  }

  const { indicateurs = {}, alertes = {}, source = {} } = rapport
  const parType = Object.entries(indicateurs.evenementsParType ?? {}).map(
    ([libelle, valeur]) => ({ libelle, valeur })
  )
  const toutVide =
    (indicateurs.totalDossiers ?? 0) === 0 &&
    (indicateurs.totalEvenements ?? 0) === 0 &&
    (indicateurs.rappelsPlanifies ?? 0) === 0

  const alertesActives = [
    ['Rappels en retard', alertes.rappelsEnRetard ?? 0, 'danger'],
    ['Rappels proches', alertes.rappelsProches ?? 0, 'warning'],
    ['Traitements en cours', alertes.traitementsEnCours ?? 0, 'info'],
    ['Maladies actives', alertes.maladiesActives ?? 0, 'warning'],
  ].filter(([, valeur]) => valeur > 0)

  const retard = indicateurs.rappelsEnRetard ?? 0
  const coutConsultations = indicateurs.consultations?.coutTotal ?? 0

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">Période :</span>{' '}
        {periodeAffichee(rapport)} — {source.precision ?? ''}
      </div>

      {toutVide && (
        <EtatVide
          titre="Aucune donnée vétérinaire enregistrée"
          message="Les collections dossiermedicals, evenementveterinaires et rappelsoins ne contiennent aucun document."
          icone={HeartPulse}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titre="Dossiers médicaux"
          valeur={formatNombre(indicateurs.totalDossiers ?? 0)}
          icone={HeartPulse}
          complement="État actuel"
        />
        <StatCard
          titre="Événements sanitaires"
          valeur={formatNombre(indicateurs.totalEvenements ?? 0)}
          icone={Syringe}
          complement="Tout type confondu"
        />
        <StatCard
          titre="Rappels planifiés"
          valeur={formatNombre(indicateurs.rappelsPlanifies ?? 0)}
          icone={AlertTriangle}
          complement={`${formatNombre(retard)} en retard`}
        />
        <StatCard
          titre="Consultations (période)"
          valeur={formatNombre(indicateurs.consultations?.nombre ?? 0)}
          icone={HeartPulse}
          complement={`Coût : ${formatValeurBrute(coutConsultations)}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GraphiqueRapport
          titre="Événements par type"
          sousTitre="Répartition réelle des événements enregistrés"
          type="pie"
          donnees={parType}
          formatterValeur={(valeur) => formatNombre(valeur)}
        />
        <Card>
          <CardHeader
            titre="Alertes vétérinaires"
            sousTitre={`Fenêtre d'alerte : ${alertes.delaiJours ?? '—'} jours`}
          />
          <CardBody className="space-y-3">
            {alertesActives.length === 0 ? (
              <EtatVide
                titre="Aucune alerte vétérinaire"
                message="Aucun rappel en retard, traitement en cours ni maladie active n'est enregistré."
              />
            ) : (
              alertesActives.map(([libelle, valeur, ton]) => (
                <div
                  key={libelle}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                >
                  <span className="text-sm text-slate-700">{libelle}</span>
                  <Badge ton={ton}>{formatNombre(valeur)}</Badge>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
