import Badge from '../common/Badge'
import { Card, CardBody, CardHeader } from '../common/Card'
import EtatVide from './EtatVide'

/**
 * Tableau détaillé réutilisable. `colonnes` : [{ cle, libelle, rendu?, alignement? }].
 */
export default function TableauRapport({
  titre,
  sousTitre,
  colonnes = [],
  donnees = [],
  tronque = false,
  total = 0,
  messageVide,
}) {
  const lignes = Array.isArray(donnees) ? donnees : []

  return (
    <Card>
      <CardHeader
        titre={titre}
        sousTitre={sousTitre}
        action={
          lignes.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge ton="neutral">
                {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
              </Badge>
              {tronque && (
                <Badge ton="warning">Limite d’affichage atteinte</Badge>
              )}
            </div>
          ) : null
        }
      />
      <CardBody className="p-0">
        {lignes.length === 0 ? (
          <div className="p-5">
            <EtatVide
              titre="Aucune ligne à afficher"
              message={
                messageVide ??
                'Aucun enregistrement ne correspond à cette sélection dans MongoDB.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {colonnes.map((colonne) => (
                    <th
                      key={colonne.cle}
                      scope="col"
                      className={`px-5 py-3 font-semibold ${
                        colonne.alignement === 'droite' ? 'text-right' : ''
                      }`}
                    >
                      {colonne.libelle}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lignes.map((ligne, index) => (
                  <tr key={ligne.id ?? index} className="hover:bg-slate-50/60">
                    {colonnes.map((colonne) => (
                      <td
                        key={colonne.cle}
                        className={`px-5 py-3 text-slate-700 ${
                          colonne.alignement === 'droite' ? 'text-right' : ''
                        }`}
                      >
                        {colonne.rendu
                          ? colonne.rendu(ligne, index)
                          : (ligne[colonne.cle] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {tronque && total > lignes.length && (
              <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                {lignes.length} lignes affichées sur {total}. L’export CSV contient
                le détail disponible.
              </p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
