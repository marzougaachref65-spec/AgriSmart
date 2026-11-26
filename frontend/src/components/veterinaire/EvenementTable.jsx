import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { Activity, Loader2 } from 'lucide-react'
import Badge from '../common/Badge'
import { Card, CardBody, CardHeader } from '../common/Card'
import {
  LIBELLES_TYPE_EVENEMENT,
  TONS_TYPE_EVENEMENT,
  formatDate,
  libelleEvenement,
  nomAnimal,
} from '../../utils/veterinaire'

function Pagination({ pagination, onPage }) {
  if (!pagination) return null
  const { page, pages, total, limit } = pagination
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        {total === 0
          ? 'Aucun événement'
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

export default function EvenementTable({
  resultat,
  chargement,
  filtresActifs,
  onVoir,
  onPage,
}) {
  const evenements = resultat?.items ?? []

  return (
    <Card>
      <CardHeader
        titre={`Événements sanitaires (${resultat?.pagination?.total ?? 0})`}
        sousTitre="Historique immuable — ajout uniquement, aucune modification"
      />
      <CardBody className="p-0">
        {chargement ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement des événements...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Animal</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Événement</th>
                  <th className="px-5 py-3 font-semibold">Référence</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evenements.map((evenement) => (
                  <tr key={evenement.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(evenement.date)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {nomAnimal(evenement.animal)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge ton={TONS_TYPE_EVENEMENT[evenement.type] ?? 'brand'}>
                        {LIBELLES_TYPE_EVENEMENT[evenement.type] ?? evenement.type}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {libelleEvenement(evenement)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">
                      {evenement.reference?.slice(0, 12)}…
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        aria-label="Voir le détail de l'événement"
                        title="Voir le détail"
                        onClick={() => onVoir(evenement)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {evenements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-sm text-slate-500">
                      {chargement ? (
                        <span className="inline-flex items-center gap-2">
                          <Activity className="h-4 w-4" /> Chargement...
                        </span>
                      ) : filtresActifs ? (
                        'Aucun événement ne correspond aux filtres.'
                      ) : (
                        'Aucun événement sanitaire enregistré.'
                      )}
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
