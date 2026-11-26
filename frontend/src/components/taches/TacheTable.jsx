import {
  AlertTriangle,
  Ban,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react'
import Badge from '../common/Badge'
import { Card, CardBody, CardHeader } from '../common/Card'
import {
  TONS_PRIORITE_TACHE,
  TONS_STATUT_TACHE,
  formatDate,
  joursRetard,
  libelleCible,
  nomEmploye,
} from '../../utils/taches'

function Pagination({ pagination, onPage }) {
  if (!pagination) return null
  const { page, pages, total, limit } = pagination
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        {total === 0
          ? 'Aucune tâche'
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

export default function TacheTable({
  resultat,
  chargement,
  filtresActifs,
  peutEcrire,
  onVoir,
  onModifier,
  onChangerStatut,
  onAnnuler,
  onSupprimer,
  onPage,
}) {
  const taches = resultat?.items ?? []

  return (
    <Card>
      <CardHeader
        titre={`Tâches agricoles (${resultat?.pagination?.total ?? 0})`}
        sousTitre="Planning, affectations et suivi des interventions"
      />
      <CardBody className="p-0">
        {chargement ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement des tâches...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Référence</th>
                  <th className="px-5 py-3 font-semibold">Tâche</th>
                  <th className="px-5 py-3 font-semibold">Priorité</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Échéance</th>
                  <th className="px-5 py-3 font-semibold">Employés</th>
                  <th className="px-5 py-3 font-semibold">Cible</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taches.map((tache) => (
                  <tr key={tache.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">
                      {tache.reference?.slice(0, 12)}…
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-800">
                        {tache.titre}
                      </span>
                      {tache.enRetard && (
                        <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          En retard de {joursRetard(tache)} jour(s)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge ton={TONS_PRIORITE_TACHE[tache.priorite] ?? 'neutral'}>
                        {tache.priorite}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge ton={TONS_STATUT_TACHE[tache.statut] ?? 'neutral'}>
                        {tache.statut}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(tache.dateEcheance)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {tache.employes?.length
                        ? tache.employes.map(nomEmploye).join(', ')
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {libelleCible(tache)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Voir le détail"
                          aria-label={`Voir le détail de ${tache.titre}`}
                          onClick={() => onVoir(tache)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {peutEcrire && (
                          <>
                            <button
                              type="button"
                              title="Modifier la tâche"
                              aria-label={`Modifier ${tache.titre}`}
                              onClick={() => onModifier(tache)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Changer le statut"
                              aria-label={`Changer le statut de ${tache.titre}`}
                              onClick={() => onChangerStatut(tache)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                            >
                              <ClipboardList className="h-4 w-4" />
                            </button>
                            {tache.statut !== 'Annulée' && (
                              <button
                                type="button"
                                title="Annuler la tâche"
                                aria-label={`Annuler ${tache.titre}`}
                                onClick={() => onAnnuler(tache)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              title="Supprimer la tâche"
                              aria-label={`Supprimer ${tache.titre}`}
                              onClick={() => onSupprimer(tache)}
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

                {taches.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center text-sm text-slate-500">
                      <ClipboardList className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                      {filtresActifs
                        ? 'Aucune tâche ne correspond aux filtres.'
                        : 'Aucune tâche agricole enregistrée.'}
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
