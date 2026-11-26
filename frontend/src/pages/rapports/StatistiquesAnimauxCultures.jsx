import { Loader2, PawPrint, Sprout, Wheat } from 'lucide-react'
import Badge from '../../components/common/Badge'
import { Card } from '../../components/common/Card'
import StatCard from '../../components/common/StatCard'
import EtatVide from '../../components/rapports/EtatVide'
import GraphiqueRapport from '../../components/rapports/GraphiqueRapport'
import TableauRapport from '../../components/rapports/TableauRapport'
import { TONS_STATUT } from '../../utils/animals'
import { TONS_CYCLE, TONS_PARCELLE } from '../../utils/cultures'
import {
  formatDate,
  formatNombre,
  periodeAffichee,
} from '../../utils/rapports'

export default function StatistiquesAnimauxCultures({ rapport, chargement }) {
  if (chargement || !rapport) {
    return (
      <Card>
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          Calcul des statistiques animals et cultures...
        </div>
      </Card>
    )
  }

  const { indicateurs = {}, details = {}, source = {} } = rapport
  const animaux = indicateurs.animaux ?? {}
  const parcelles = indicateurs.parcelles ?? {}
  const cycles = indicateurs.cycles ?? {}
  const toutVide =
    (animaux.total ?? 0) === 0 &&
    (parcelles.total ?? 0) === 0 &&
    (cycles.enCours ?? 0) === 0 &&
    (cycles.recoltees ?? 0) === 0

  const animauxParSexe = [
    { libelle: 'Mâles', valeur: animaux.males ?? 0 },
    { libelle: 'Femelles', valeur: animaux.femelles ?? 0 },
  ].filter((entree) => entree.valeur > 0)

  const cyclesParStatut = [
    { libelle: 'En cours', valeur: cycles.enCours ?? 0 },
    { libelle: 'Récoltées', valeur: cycles.recoltees ?? 0 },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">Période :</span>{' '}
        {periodeAffichee(rapport)} — {source.precision ?? ''}
      </div>

      {toutVide && (
        <EtatVide
          titre="Aucune donnée animale ou culturale enregistrée"
          message="Les collections animals, parcelles et cyclecultures ne contiennent aucun document. Les chiffres ci-dessous sont donc à zéro et aucun graphique fictif n'est affiché."
          icone={Sprout}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titre="Animaux suivis"
          valeur={formatNombre(animaux.total ?? 0)}
          icone={PawPrint}
          complement={`${formatNombre(animaux.males ?? 0)} mâles · ${formatNombre(
            animaux.femelles ?? 0
          )} femelles`}
        />
        <StatCard
          titre="Animaux malades"
          valeur={formatNombre(animaux.malades ?? 0)}
          icone={PawPrint}
          complement="État actuel"
        />
        <StatCard
          titre="Parcelles"
          valeur={formatNombre(parcelles.total ?? 0)}
          icone={Sprout}
          complement={`${formatNombre(
            parcelles.superficieTotale ?? 0
          )} ha au total`}
        />
        <StatCard
          titre="Cycles"
          valeur={formatNombre((cycles.enCours ?? 0) + (cycles.recoltees ?? 0))}
          icone={Wheat}
          complement={`${formatNombre(
            cycles.quantiteTotaleRecoltee ?? 0
          )} kg récoltés`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GraphiqueRapport
          titre="Cheptel par sexe"
          sousTitre="Effectif réel enregistré dans MongoDB"
          type="pie"
          donnees={animauxParSexe}
          formatterValeur={(valeur) => formatNombre(valeur)}
        />
        <GraphiqueRapport
          titre="Cycles de culture"
          sousTitre="État des cycles enregistrés"
          donnees={cyclesParStatut}
          nomSerie="Cycles"
          formatterValeur={(valeur) => formatNombre(valeur)}
        />
      </div>

      <TableauRapport
        titre="Détail des animaux"
        sousTitre="Liste réelle, sans donnée de démonstration"
        colonnes={[
          { cle: 'name', libelle: 'Identification' },
          { cle: 'espece', libelle: 'Espèce' },
          { cle: 'race', libelle: 'Race' },
          { cle: 'sexe', libelle: 'Sexe' },
          {
            cle: 'statut',
            libelle: 'Statut',
            rendu: (ligne) => (
              <Badge ton={TONS_STATUT[ligne.statut] ?? 'neutral'}>
                {ligne.statut ?? '—'}
              </Badge>
            ),
          },
          {
            cle: 'dateNaissance',
            libelle: 'Naissance',
            rendu: (ligne) => formatDate(ligne.dateNaissance),
          },
        ]}
        donnees={details.animaux?.elements ?? []}
        tronque={details.animaux?.tronque}
        total={details.animaux?.total ?? 0}
      />

      <TableauRapport
        titre="Détail des parcelles"
        sousTitre="Superficies exprimées en hectares"
        colonnes={[
          { cle: 'name', libelle: 'Parcelle' },
          { cle: 'localisation', libelle: 'Localisation' },
          { cle: 'typeSol', libelle: 'Type de sol' },
          {
            cle: 'superficie',
            libelle: 'Superficie',
            alignement: 'droite',
            rendu: (ligne) => `${formatNombre(ligne.superficie ?? 0)} ha`,
          },
          {
            cle: 'statut',
            libelle: 'Statut',
            rendu: (ligne) => (
              <Badge ton={TONS_PARCELLE[ligne.statut] ?? 'neutral'}>
                {ligne.statut ?? '—'}
              </Badge>
            ),
          },
        ]}
        donnees={details.parcelles?.elements ?? []}
        tronque={details.parcelles?.tronque}
        total={details.parcelles?.total ?? 0}
      />

      <TableauRapport
        titre="Détail des cycles"
        sousTitre="Quantités récoltées exprimées en kilogrammes"
        colonnes={[
          {
            cle: 'typeCulture',
            libelle: 'Culture',
            rendu: (ligne) => ligne.typeCulture ?? ligne.variete ?? '—',
          },
          { cle: 'parcelle', libelle: 'Parcelle', rendu: (ligne) => ligne.parcelle?.name ?? '—' },
          {
            cle: 'statut',
            libelle: 'Statut',
            rendu: (ligne) => (
              <Badge ton={TONS_CYCLE[ligne.statut] ?? 'neutral'}>
                {ligne.statut ?? '—'}
              </Badge>
            ),
          },
          {
            cle: 'quantiteRecoltee',
            libelle: 'Récolté',
            alignement: 'droite',
            rendu: (ligne) => `${formatNombre(ligne.quantiteRecoltee ?? 0)} kg`,
          },
          {
            cle: 'dateSemis',
            libelle: 'Semis',
            rendu: (ligne) => formatDate(ligne.dateSemis),
          },
        ]}
        donnees={details.cycles?.elements ?? []}
        tronque={details.cycles?.tronque}
        total={details.cycles?.total ?? 0}
      />
    </div>
  )
}
