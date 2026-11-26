import { ArrowDownRight, ArrowUpRight, Loader2, Scale, Wallet } from 'lucide-react'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import Badge from '../common/Badge'
import Button from '../common/Button'
import { Card, CardBody, CardHeader } from '../common/Card'
import StatCard from '../common/StatCard'
import {
  COULEURS_CATEGORIE,
  TONS_STATUT_PAIEMENT,
  formatDate,
  formatMontantTND,
  formatNombre,
  libelleOperation,
} from '../../utils/finances'

const styleInfobulle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  fontSize: 12,
}

export default function DashboardFinancier({
  tableau,
  statistiques,
  chargement,
  onVoirOperations,
}) {
  const totaux = tableau?.totaux ?? {}
  const operationsRecententes = tableau?.operationsRecentes ?? []
  const repartition = (statistiques?.parCategorie ?? [])
    .filter((entree) => entree.type === 'Depense' && Number(entree.montantMillimes) > 0)
    .map((entree, index) => ({
      nom: entree.libelle ?? entree.code ?? 'Catégorie',
      valeur: Number(entree.montantMillimes),
      couleur: entree.couleur ?? COULEURS_CATEGORIE[index % COULEURS_CATEGORIE.length],
    }))

  if (chargement) {
    return (
      <Card>
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          Chargement des données financières...
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titre="Revenus (période)"
          valeur={formatMontantTND(totaux.revenusMillimes)}
          icone={ArrowUpRight}
        />
        <StatCard
          titre="Dépenses (période)"
          valeur={formatMontantTND(totaux.depensesMillimes)}
          icone={ArrowDownRight}
        />
        <StatCard
          titre="Bénéfice (période)"
          valeur={formatMontantTND(totaux.beneficeMillimes)}
          icone={Scale}
          complement="Revenus − dépenses"
        />
        <StatCard
          titre="Solde"
          valeur={formatMontantTND(totaux.soldeMillimes)}
          icone={Wallet}
          complement={`${formatNombre(totaux.operations)} opération(s)`}
        />
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <span className="font-semibold">Impayés :</span>{' '}
        {formatNombre(totaux.impayees)} opération(s) —{' '}
        {formatMontantTND(totaux.impayeesMontantMillimes)} en attente de règlement.
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            titre="Dépenses par catégorie"
            sousTitre="Répartition réelle sur la période sélectionnée"
          />
          <CardBody>
            {repartition.length === 0 ? (
              <p className="flex h-64 items-center justify-center text-center text-sm text-slate-500">
                Aucune dépense enregistrée sur la période.
              </p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={repartition}
                      dataKey="valeur"
                      nameKey="nom"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {repartition.map((entree) => (
                        <Cell key={entree.nom} fill={entree.couleur} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={styleInfobulle}
                      formatter={(valeur) => formatMontantTND(valeur)}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            titre="Opérations récentes"
            sousTitre="Dernières écritures financières enregistrées"
            action={
              onVoirOperations ? (
                <Button variante="ghost" taille="sm" onClick={onVoirOperations}>
                  Tout voir
                </Button>
              ) : null
            }
          />
          <CardBody className="p-0">
            {operationsRecententes.length === 0 ? (
              <p className="px-5 py-16 text-center text-sm text-slate-500">
                Aucune opération enregistrée sur la période.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {operationsRecententes.map((operation) => (
                  <div
                    key={operation.id}
                    className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {libelleOperation(operation)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatDate(operation.date)} ·{' '}
                        {operation.categorie?.libelle ?? 'Catégorie inconnue'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge ton={TONS_STATUT_PAIEMENT[operation.statutPaiement] ?? 'neutral'}>
                        {operation.statutPaiement}
                      </Badge>
                      <span
                        className={`text-sm font-semibold ${
                          operation.type === 'Revenu'
                            ? 'text-emerald-700'
                            : 'text-slate-800'
                        }`}
                      >
                        {formatMontantTND(operation.montantMillimes)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          titre="Évolution mensuelle"
          sousTitre="Revenus, dépenses et bénéfice par mois"
        />
        <CardBody className="p-0">
          {(statistiques?.evolutionMensuelle ?? []).length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Aucune évolution mensuelle disponible sur la période.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Mois</th>
                    <th className="px-5 py-3 text-right font-semibold">Revenus</th>
                    <th className="px-5 py-3 text-right font-semibold">Dépenses</th>
                    <th className="px-5 py-3 text-right font-semibold">Bénéfice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statistiques.evolutionMensuelle.map((entree) => (
                    <tr key={entree.mois}>
                      <td className="px-5 py-3 font-medium text-slate-800">{entree.mois}</td>
                      <td className="px-5 py-3 text-right text-emerald-700">
                        {formatMontantTND(entree.revenusMillimes)}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-700">
                        {formatMontantTND(entree.depensesMillimes)}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-800">
                        {formatMontantTND(entree.beneficeMillimes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
