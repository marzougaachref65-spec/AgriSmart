import { Eye, Loader2, Pencil, Trash2 } from 'lucide-react'
import {
  TONS_PARCELLE,
  formatNombre,
} from '../../utils/cultures'
import Badge from '../common/Badge'
import { Card, CardBody, CardHeader } from '../common/Card'

export default function ParcelleTable({
  parcelles,
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
        titre={`Parcelles (${parcelles.length})`}
        sousTitre="Cliquez sur l'œil pour consulter la fiche complète"
      />
      <CardBody className="p-0">
        {chargement ? (
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            Chargement des parcelles...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Parcelle</th>
                  <th className="px-5 py-3 font-semibold">Superficie</th>
                  <th className="px-5 py-3 font-semibold">Localisation</th>
                  <th className="px-5 py-3 font-semibold">Type de sol</th>
                  <th className="px-5 py-3 font-semibold">Irrigation</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parcelles.map((parcelle) => (
                  <tr key={parcelle.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{parcelle.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        #{parcelle.id.slice(-6)}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatNombre(parcelle.superficie)} ha
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {parcelle.localisation || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {parcelle.typeSol || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {parcelle.systemeIrrigation || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <Badge ton={TONS_PARCELLE[parcelle.statut] ?? 'neutral'}>
                        {parcelle.statut}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Voir les détails"
                          aria-label={`Voir ${parcelle.name}`}
                          onClick={() => onVoir(parcelle)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {peutEcrire && (
                          <>
                            <button
                              type="button"
                              title="Modifier"
                              aria-label={`Modifier ${parcelle.name}`}
                              onClick={() => onModifier(parcelle)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Supprimer"
                              aria-label={`Supprimer ${parcelle.name}`}
                              onClick={() => onSupprimer(parcelle)}
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

                {parcelles.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-14 text-center text-sm text-slate-500"
                    >
                      Aucune parcelle trouvée.
                      {filtresActifs
                        ? ' Modifiez les filtres ou ajoutez une parcelle.'
                        : ' Cliquez sur « Ajouter une parcelle » pour commencer.'}
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
