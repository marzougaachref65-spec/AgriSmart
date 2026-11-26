import { Activity, Eye, Pencil, Trash2 } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../common/Card'
import { formatDate, nomAnimal } from '../../utils/veterinaire'

export default function DossierTable({
  dossiers,
  chargement,
  filtresActifs,
  onVoir,
  onModifier,
  onSupprimer,
  onHistorique,
}) {
  return (
    <Card>
      <CardHeader
        titre={`Dossiers médicaux (${dossiers.length})`}
        sousTitre="Un dossier par animal, conserve tout son historique sanitaire"
      />
      <CardBody className="p-0">
        {chargement ? null : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Animal</th>
                  <th className="px-5 py-3 font-semibold">Espèce</th>
                  <th className="px-5 py-3 font-semibold">Vétérinaire référent</th>
                  <th className="px-5 py-3 font-semibold">Créé le</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dossiers.map((dossier) => (
                  <tr key={dossier.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {nomAnimal(dossier.animal)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {dossier.animal?.espece ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {dossier.veterinaireReferent || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(dossier.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Voir le dossier"
                          aria-label="Voir le dossier médical"
                          onClick={() => onVoir(dossier)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Voir l'historique sanitaire"
                          aria-label="Voir l'historique sanitaire"
                          onClick={() => onHistorique(dossier.animal?.id)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                        >
                          <Activity className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Modifier le dossier"
                          aria-label="Modifier le dossier médical"
                          onClick={() => onModifier(dossier)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Supprimer le dossier"
                          aria-label="Supprimer le dossier médical"
                          onClick={() => onSupprimer(dossier)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {dossiers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-14 text-center text-sm text-slate-500"
                    >
                      Aucun dossier médical trouvé.
                      {filtresActifs
                        ? ' Modifiez les filtres pour élargir la recherche.'
                        : ' Créez un dossier pour un animal existant.'}
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
