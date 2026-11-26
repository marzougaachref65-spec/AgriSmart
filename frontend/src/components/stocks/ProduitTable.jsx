import { ArrowDownToLine, Eye, Pencil, Trash2 } from 'lucide-react'
import Badge from '../common/Badge'
import { Card, CardBody, CardHeader } from '../common/Card'
import {
  formatDate,
  formatNombre,
  LIBELLES_ALERTE,
  TONS_ALERTE,
} from '../../utils/stocks'

export default function ProduitTable({
  produits,
  chargement,
  peutEcrire,
  filtresActifs,
  onVoir,
  onModifier,
  onSupprimer,
  onMouvement,
}) {
  return (
    <Card>
      <CardHeader
        titre={`Produits (${produits.length})`}
        sousTitre="La quantité est mise à jour uniquement par les mouvements de stock"
      />
      <CardBody className="p-0">
        {chargement ? null : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Produit</th>
                  <th className="px-5 py-3 font-semibold">Catégorie</th>
                  <th className="px-5 py-3 font-semibold">Stock disponible</th>
                  <th className="px-5 py-3 font-semibold">Seuil</th>
                  <th className="px-5 py-3 font-semibold">Prix unitaire</th>
                  <th className="px-5 py-3 font-semibold">Expiration</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {produits.map((produit) => (
                  <tr key={produit.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{produit.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {produit.fournisseur || 'Fournisseur non renseigné'}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{produit.categorie}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {formatNombre(produit.quantiteDisponible)} {produit.unite}
                        </span>
                        {produit.alerte && (
                          <Badge ton={TONS_ALERTE[produit.alerte] ?? 'neutral'}>
                            {LIBELLES_ALERTE[produit.alerte] ?? produit.alerte}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatNombre(produit.seuilMinimum)} {produit.unite}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatNombre(produit.prixUnitaire)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(produit.dateExpiration)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Voir les détails"
                          aria-label={`Voir ${produit.name}`}
                          onClick={() => onVoir(produit)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {peutEcrire && (
                          <>
                            <button
                              type="button"
                              title="Enregistrer un mouvement"
                              aria-label={`Mouvement de stock pour ${produit.name}`}
                              onClick={() => onMouvement(produit)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-700"
                            >
                              <ArrowDownToLine className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Modifier"
                              aria-label={`Modifier ${produit.name}`}
                              onClick={() => onModifier(produit)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Supprimer"
                              aria-label={`Supprimer ${produit.name}`}
                              onClick={() => onSupprimer(produit)}
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

                {produits.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-14 text-center text-sm text-slate-500"
                    >
                      Aucun produit trouvé.
                      {filtresActifs
                        ? ' Modifiez les filtres pour élargir la recherche.'
                        : ' Ajoutez un produit pour commencer.'}
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
