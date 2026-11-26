import { Eye, Loader2, Pencil, Trash2 } from 'lucide-react'
import {
  TONS_CYCLE,
  formatDate,
  formatNombre,
} from '../../utils/cultures'
import Badge from '../common/Badge'
import { Card, CardBody, CardHeader } from '../common/Card'

export default function CycleTable({
  cycles,
  chargement,
  peutEcrire,
  filtresActifs,
  onVoir,
  onModifier,
  onSupprimer,
}) {
  return (
    <Card>
      <CardHeader
        titre={`Cycles de culture (${cycles.length})`}
        sousTitre="Cliquez sur l'œil pour consulter la fiche complète"
      />
      <CardBody className="p-0">
        {chargement ? (
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            Chargement des cycles...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Culture</th>
                  <th className="px-5 py-3 font-semibold">Parcelle</th>
                  <th className="px-5 py-3 font-semibold">Variété</th>
                  <th className="px-5 py-3 font-semibold">Semis</th>
                  <th className="px-5 py-3 font-semibold">Récolte prévue</th>
                  <th className="px-5 py-3 font-semibold">Récolté</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cycles.map((cycle) => (
                  <tr key={cycle.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">
                        {cycle.typeCulture}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        #{cycle.id.slice(-6)}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {cycle.parcelle?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {cycle.variete || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(cycle.dateSemis)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(cycle.datePrevueRecolte)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {cycle.quantiteRecoltee !== null
                        ? `${formatNombre(cycle.quantiteRecoltee)} kg`
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <Badge ton={TONS_CYCLE[cycle.statut] ?? 'neutral'}>
                        {cycle.statut}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Voir les détails"
                          aria-label={`Voir le cycle ${cycle.typeCulture}`}
                          onClick={() => onVoir(cycle)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {peutEcrire && (
                          <>
                            <button
                              type="button"
                              title="Modifier"
                              aria-label={`Modifier le cycle ${cycle.typeCulture}`}
                              onClick={() => onModifier(cycle)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Supprimer"
                              aria-label={`Supprimer le cycle ${cycle.typeCulture}`}
                              onClick={() => onSupprimer(cycle)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {cycles.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-14 text-center text-sm text-slate-500"
                    >
                      Aucun cycle trouvé.
                      {filtresActifs
                        ? ' Modifiez les filtres ou ajoutez un cycle.'
                        : ' Cliquez sur « Ajouter un cycle » pour commencer.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
