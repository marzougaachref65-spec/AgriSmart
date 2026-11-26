import { Activity, Eye, Loader2, Pencil, Power, RotateCcw, Users } from 'lucide-react'
import Badge from '../common/Badge'
import { Card, CardBody, CardHeader } from '../common/Card'
import {
  TONS_STATUT_EMPLOYE,
  formatDate,
  formatSalaire,
  nomComplet,
} from '../../utils/employes'

export default function EmployeTable({
  employes,
  chargement,
  filtresActifs,
  peutEcrire,
  peutVoirSalaire,
  inactifs = false,
  onVoir,
  onModifier,
  onDesactiver,
  onReactiver,
  onHistorique,
}) {
  return (
    <Card>
      <CardHeader
        titre={`${inactifs ? 'Employés inactifs' : 'Employés actifs'} (${employes.length})`}
        sousTitre={
          inactifs
            ? 'Anciens employés conservés avec leur fiche et leur historique'
            : "Fiches du personnel — la désactivation conserve tout l'historique"
        }
      />
      <CardBody className="p-0">
        {chargement ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement des employés...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Employé</th>
                  <th className="px-5 py-3 font-semibold">Fonction</th>
                  {peutVoirSalaire && (
                    <th className="px-5 py-3 font-semibold">Salaire</th>
                  )}
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Recrutement</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employes.map((employe) => (
                  <tr key={employe.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {nomComplet(employe)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {employe.fonction}
                      {employe.specialite && (
                        <span className="block text-xs text-slate-400">
                          {employe.specialite}
                        </span>
                      )}
                    </td>
                    {peutVoirSalaire && (
                      <td className="px-5 py-3 font-medium text-slate-700">
                        {formatSalaire(employe)}
                      </td>
                    )}
                    <td className="px-5 py-3">
                      <Badge ton={TONS_STATUT_EMPLOYE[employe.statut] ?? 'neutral'}>
                        {employe.statut}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(employe.dateRecrutement)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Voir la fiche"
                          aria-label={`Voir la fiche de ${nomComplet(employe)}`}
                          onClick={() => onVoir(employe)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Voir l'historique"
                          aria-label={`Historique de ${nomComplet(employe)}`}
                          onClick={() => onHistorique(employe)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                        >
                          <Activity className="h-4 w-4" />
                        </button>
                        {peutEcrire && (
                          <>
                            <button
                              type="button"
                              title="Modifier la fiche"
                              aria-label={`Modifier la fiche de ${nomComplet(employe)}`}
                              onClick={() => onModifier(employe)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {employe.statut === 'Actif' ? (
                              <button
                                type="button"
                                title="Désactiver l'employé"
                                aria-label={`Désactiver ${nomComplet(employe)}`}
                                onClick={() => onDesactiver(employe)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                              >
                                <Power className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Réactiver l'employé"
                                aria-label={`Réactiver ${nomComplet(employe)}`}
                                onClick={() => onReactiver(employe)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {employes.length === 0 && (
                  <tr>
                    <td
                      colSpan={peutVoirSalaire ? 6 : 5}
                      className="px-5 py-14 text-center text-sm text-slate-500"
                    >
                      <Users className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                      {filtresActifs
                        ? 'Aucun employé ne correspond à la recherche.'
                        : inactifs
                          ? 'Aucun employé inactif.'
                          : 'Aucun employé enregistré.'}
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
