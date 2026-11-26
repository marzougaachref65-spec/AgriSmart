import { Eye, Loader2, Pencil, PowerOff } from 'lucide-react'
import Badge from '../common/Badge'
import { Card, CardBody, CardHeader } from '../common/Card'
import { LIBELLES_TYPE_CATEGORIE, TONS_TYPE_CATEGORIE } from '../../utils/finances'

export default function CategorieTable({
  categories,
  chargement,
  filtresActifs,
  onVoir,
  onModifier,
  onDesactiver,
}) {
  const elements = categories ?? []

  return (
    <Card>
      <CardHeader
        titre={`Catégories (${elements.length})`}
        sousTitre="Référentiel utilisé par les opérations — la désactivation est logique"
      />
      <CardBody className="p-0">
        {chargement ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
            Chargement des catégories...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">Libellé</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Couleur</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {elements.map((categorie) => (
                  <tr key={categorie.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">
                      {categorie.code}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{categorie.libelle}</p>
                      {categorie.description && (
                        <p className="mt-0.5 max-w-md truncate text-xs text-slate-400">
                          {categorie.description}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge ton={TONS_TYPE_CATEGORIE[categorie.type] ?? 'neutral'}>
                        {LIBELLES_TYPE_CATEGORIE[categorie.type] ?? categorie.type}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-2 text-slate-600">
                        <span
                          className="h-4 w-4 rounded border border-slate-200"
                          style={{ backgroundColor: categorie.couleur ?? '#94a3b8' }}
                        />
                        <span className="font-mono text-xs">
                          {categorie.couleur ?? '—'}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge ton={categorie.actif === false ? 'neutral' : 'success'}>
                        {categorie.actif === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Voir la catégorie ${categorie.libelle}`}
                          title="Voir le détail"
                          onClick={() => onVoir(categorie)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Modifier la catégorie ${categorie.libelle}`}
                          title="Modifier"
                          onClick={() => onModifier(categorie)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Désactiver la catégorie ${categorie.libelle}`}
                          title="Désactiver"
                          disabled={categorie.actif === false}
                          onClick={() => onDesactiver(categorie)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                        >
                          <PowerOff className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {elements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-sm text-slate-500">
                      {filtresActifs
                        ? 'Aucune catégorie ne correspond aux filtres.'
                        : 'Aucune catégorie enregistrée.'}
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
