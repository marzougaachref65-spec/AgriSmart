import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Loader2,
  Trash2,
} from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import { Card, CardBody, CardHeader } from '../common/Card'
import {
  TONS_STATUT_RAPPEL,
  formatDate,
  formatDateHeure,
  nomAnimal,
} from '../../utils/veterinaire'

function Pagination({ pagination, onPage }) {
  if (!pagination) return null
  const { page, pages, total, limit } = pagination
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        {total === 0
          ? 'Aucun rappel'
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

export default function RappelTable({
  resultat,
  chargement,
  filtresActifs,
  onEffectuer,
  onSupprimer,
  onPage,
}) {
  const rappels = resultat?.items ?? []

  return (
    <Card>
      <CardHeader
        titre={`Rappels de soins (${resultat?.pagination?.total ?? 0})`}
        sousTitre="Générés automatiquement depuis les vaccinations ou planifiés manuellement"
      />
      <CardBody className="p-0">
        {chargement ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement des rappels...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date prévue</th>
                  <th className="px-5 py-3 font-semibold">Animal</th>
                  <th className="px-5 py-3 font-semibold">Titre</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rappels.map((rappel) => {
                  const enRetard =
                    rappel.statut === 'Planifié' &&
                    new Date(rappel.datePrevue).getTime() < Date.now()
                  return (
                    <tr key={rappel.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 text-slate-600">
                        {formatDate(rappel.datePrevue)}
                        {enRetard && (
                          <span className="ml-2 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            En retard
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {nomAnimal(rappel.animal)}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {rappel.titre || '—'}
                        {rappel.dateRealisation && (
                          <span className="block text-[11px] text-slate-400">
                            Effectué le {formatDateHeure(rappel.dateRealisation)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{rappel.type}</td>
                      <td className="px-5 py-3">
                        <Badge ton={TONS_STATUT_RAPPEL[rappel.statut] ?? 'neutral'}>
                          {rappel.statut}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          {rappel.statut === 'Planifié' && (
                            <Button
                              variante="ghost"
                              taille="sm"
                              onClick={() => onEffectuer(rappel)}
                              title="Marquer comme effectué"
                            >
                              <CircleCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variante="ghost"
                            taille="sm"
                            onClick={() => onSupprimer(rappel)}
                            title="Supprimer le rappel"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {rappels.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-sm text-slate-500">
                      {filtresActifs
                        ? 'Aucun rappel ne correspond aux filtres.'
                        : 'Aucun rappel de soin planifié.'}
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
