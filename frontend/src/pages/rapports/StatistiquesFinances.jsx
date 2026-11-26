import { AlertTriangle, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import Badge from '../../components/common/Badge'
import { Card, CardBody, CardHeader } from '../../components/common/Card'
import StatCard from '../../components/common/StatCard'
import EtatVide from '../../components/rapports/EtatVide'
import GraphiqueRapport from '../../components/rapports/GraphiqueRapport'
import TableauRapport from '../../components/rapports/TableauRapport'
import {
  TONS_STATUT_PAIEMENT,
  TONS_TYPE_OPERATION,
  LIBELLES_TYPE_OPERATION,
} from '../../utils/finances'
import {
  formatDate,
  formatNombre,
  formatValeurBrute,
  periodeAffichee,
} from '../../utils/rapports'

export default function StatistiquesFinances({ rapport, chargement }) {
  if (chargement || !rapport) {
    return (
      <Card>
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          Calcul de la synthèse financière...
        </div>
      </Card>
    )
  }

  const { synthese = {}, limites = {}, source = {} } = rapport
  const tableau = synthese.tableauDeBord ?? {}
  const totaux = tableau.totaux ?? {}
  const statistiques = synthese.statistiques ?? {}
  const operations = synthese.operations ?? []
  const operationsRecentes = tableau.operationsRecentes ?? []

  const parType = (statistiques.parType ?? []).map((entree) => ({
    libelle: LIBELLES_TYPE_OPERATION[entree.type] ?? entree.type,
    valeur: entree.montant ?? 0,
  }))
  const evolution = (statistiques.evolutionMensuelle ?? []).map((entree) => ({
    libelle: entree.mois,
    valeur: entree.benefice ?? 0,
  }))
  const aDesDonnees = (totaux.operations ?? 0) > 0 || operations.length > 0

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">Période :</span>{' '}
        {periodeAffichee(rapport)} — {source.precision ?? ''}
      </div>

      <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-xs text-brand-800">
        Montants exprimés en DT. Les champs techniques en millimes ne sont pas
        exposés par le module Rapports. Données strictement réservées aux
        administrateurs et gestionnaires.
      </div>

      {!aDesDonnees && (
        <EtatVide
          titre="Aucune opération financière sur la période"
          message="Aucune opération active n'est enregistrée dans MongoDB pour cette période."
          icone={Wallet}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titre="Revenus"
          valeur={formatValeurBrute(totaux.revenus ?? 0)}
          icone={TrendingUp}
          complement={`${formatNombre(totaux.revenusCount ?? 0)} opération(s)`}
        />
        <StatCard
          titre="Dépenses"
          valeur={formatValeurBrute(totaux.depenses ?? 0)}
          icone={TrendingDown}
          complement={`${formatNombre(totaux.depenseCount ?? 0)} opération(s)`}
        />
        <StatCard
          titre="Résultat"
          valeur={formatValeurBrute(totaux.benefice ?? 0)}
          icone={Wallet}
          complement="Revenus moins dépenses"
        />
        <StatCard
          titre="Impayés"
          valeur={formatValeurBrute(totaux.impayeesMontant ?? 0)}
          icone={AlertTriangle}
          complement={`${formatNombre(totaux.impayees ?? 0)} opération(s)`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GraphiqueRapport
          titre="Revenus et dépenses"
          sousTitre="Montants en DT sur la période"
          type="pie"
          donnees={parType.filter((entree) => entree.valeur > 0)}
          formatterValeur={(valeur) => formatValeurBrute(valeur)}
        />
        <GraphiqueRapport
          titre="Évolution mensuelle du résultat"
          sousTitre="Montants en DT"
          donnees={evolution}
          nomSerie="Résultat (DT)"
          formatterValeur={(valeur) => formatValeurBrute(valeur)}
        />
      </div>

      <TableauRapport
        titre="Opérations de la période"
        sousTitre="Détail réel, sans champs millimes"
        colonnes={[
          { cle: 'reference', libelle: 'Référence' },
          {
            cle: 'date',
            libelle: 'Date',
            rendu: (ligne) => formatDate(ligne.date),
          },
          { cle: 'libelle', libelle: 'Libellé' },
          {
            cle: 'type',
            libelle: 'Type',
            rendu: (ligne) => (
              <Badge ton={TONS_TYPE_OPERATION[ligne.type] ?? 'neutral'}>
                {LIBELLES_TYPE_OPERATION[ligne.type] ?? ligne.type}
              </Badge>
            ),
          },
          { cle: 'categorie', libelle: 'Catégorie', rendu: (ligne) => ligne.categorie?.libelle ?? '—' },
          {
            cle: 'montant',
            libelle: 'Montant',
            alignement: 'droite',
            rendu: (ligne) => formatValeurBrute(ligne.montant),
          },
          {
            cle: 'statutPaiement',
            libelle: 'Paiement',
            rendu: (ligne) => (
              <Badge ton={TONS_STATUT_PAIEMENT[ligne.statutPaiement] ?? 'neutral'}>
                {ligne.statutPaiement ?? '—'}
              </Badge>
            ),
          },
        ]}
        donnees={operations}
        messageVide="Aucune opération ne correspond à la période."
      />

      <Card>
        <CardHeader
          titre="Limites de la synthèse financière"
          sousTitre="Affichées pour éviter toute lecture partielle"
        />
        <CardBody>
          <p className="text-xs leading-relaxed text-slate-600">
            La synthèse prend en compte au maximum{' '}
            {formatNombre(limites.operationsSynthese ?? 1000)} opérations. L’export
            CSV contient jusqu’à {formatNombre(limites.operationsExportCsv ?? 10000)}{' '}
            opérations. {limites.note ?? ''}
          </p>
          {(operationsRecentes.length > 0 || operations.length === 0) && (
            <p className="mt-2 text-xs text-slate-500">
              {operations.length} opération(s) détaillée(s) dans cette synthèse.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
