import { Ban, ChevronLeft, ChevronRight, Eye, Loader2, Wallet } from 'lucide-react'
import Badge from '../common/Badge'
import { Card, CardBody, CardHeader } from '../common/Card'
import {
  LIBELLES_STATUT_PAIEMENT,
  LIBELLES_TYPE_OPERATION,
  TONS_STATUT_PAIEMENT,
  TONS_TYPE_OPERATION,
  formatDate,
  formatMontantTND,
} from '../../utils/finances'

function Pagination({ pagination, onPage }) {
  if (!pagination) return null
  const { page, pages, total, limit } = pagination

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        {total === 0
          ? 'Aucune opération'
          : `Affichage ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} sur ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Page précédente"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium text-slate-600">
          Page {page} / {Math.max(pages, 1)}
        </span>
        <button
          type="button"
          aria-label="Page suivante"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function OperationTable({
  resultat,
  chargement,
  filtresActifs,
  onVoir,
  onPayer,
  onAnnuler,
  onPage,
}) {
  const operations = resultat?.items ?? []

  return (
    <Card>
      <CardHeader
        titre={`Opérations (${resultat?.pagination?.total ?? 0})`}
        sousTitre="Montants en DT (TND) — paiements et annulations tracés dans le journal"
      />
      <CardBody className="p-0">
        {chargement ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
            Chargement des opérations...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Libellé / référence</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Catégorie</th>
                  <th className="px-5 py-3 text-right font-semibold">Montant</th>
                  <th className="px-5 py-3 font-semibold">Paiement</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {operations.map((operation) => {
                  const annulee = operation.statut === 'Annulé'
                  const payee = operation.statutPaiement === 'Payé'

                  return (
                    <tr key={operation.id} className="hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        {formatDate(operation.date)}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">
                          {operation.libelle}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-slate-400">
                          {operation.reference}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <Badge ton={TONS_TYPE_OPERATION[operation.type] ?? 'neutral'}>
                          {LIBELLES_TYPE_OPERATION[operation.type] ?? operation.type}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {operation.categorie?.libelle ?? '—'}
                      </td>
                      <td
                        className={`whitespace-nowrap px-5 py-3 text-right font-semibold ${
                          operation.type === 'Revenu'
                            ? 'text-emerald-700'
                            : 'text-slate-800'
                        }`}
                      >
                        {formatMontantTND(operation.montantMillimes)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            ton={TONS_STATUT_PAIEMENT[operation.statutPaiement] ?? 'neutral'}
                          >
                            {LIBELLES_STATUT_PAIEMENT[operation.statutPaiement] ??
                              operation.statutPaiement}
                          </Badge>
                          {annulee && <Badge ton="neutral">Annulé</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            aria-label="Voir le détail de l'opération"
                            title="Voir le détail"
                            onClick={() => onVoir(operation)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Enregistrer un paiement"
                            title="Payer"
                            disabled={payee || annulee}
                            onClick={() => onPayer(operation)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                          >
                            <Wallet className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Annuler l'opération"
                            title="Annuler"
                            disabled={annulee}
                            onClick={() => onAnnuler(operation)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {operations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center text-sm text-slate-500">
                      {filtresActifs
                        ? 'Aucune opération ne correspond aux filtres.'
                        : 'Aucune opération financière enregistrée.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
      {!chargement && <Pagination pagination={resultat?.pagination} onPage={onPage} />}
    </Card>
  )
}
