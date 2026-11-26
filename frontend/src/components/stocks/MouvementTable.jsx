import { Eye } from 'lucide-react'
import Badge from '../common/Badge'
import { Card, CardBody, CardHeader } from '../common/Card'
import {
  formatDateHeure,
  formatNombre,
  TONS_STATUT_MOUVEMENT,
  TONS_TYPE_MOUVEMENT,
} from '../../utils/stocks'

export default function MouvementTable({ mouvements, chargement, filtresActifs, onVoir }) {
  return (
    <Card>
      <CardHeader
        titre={`Mouvements (${mouvements.length})`}
        sousTitre="Historique immuable des entrées et sorties de stock"
      />
      <CardBody className="p-0">
        {chargement ? null : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Produit</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Motif</th>
                  <th className="px-5 py-3 font-semibold">Quantité</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Responsable</th>
                  <th className="px-5 py-3 text-right font-semibold">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mouvements.map((mouvement) => (
                  <tr key={mouvement.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 text-slate-600">
                      {formatDateHeure(mouvement.date)}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">
                        {mouvement.produit?.name ?? 'Produit supprimé'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {mouvement.reference.slice(0, 18)}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge ton={TONS_TYPE_MOUVEMENT[mouvement.type] ?? 'neutral'}>
                        {mouvement.type}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{mouvement.motif}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800">
                      {mouvement.type === 'Entrée' ? '+' : '−'}
                      {formatNombre(mouvement.quantite)} {mouvement.produit?.unite ?? ''}
                    </td>
                    <td className="px-5 py-3">
                      <Badge ton={TONS_STATUT_MOUVEMENT[mouvement.statut] ?? 'neutral'}>
                        {mouvement.statut}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {mouvement.utilisateur?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        title="Voir les détails"
                        aria-label="Voir les détails du mouvement"
                        onClick={() => onVoir(mouvement)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {mouvements.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-14 text-center text-sm text-slate-500"
                    >
                      Aucun mouvement trouvé.
                      {filtresActifs
                        ? ' Modifiez les filtres pour élargir la recherche.'
                        : ' Enregistrez une entrée ou une sortie pour alimenter l’historique.'}
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
