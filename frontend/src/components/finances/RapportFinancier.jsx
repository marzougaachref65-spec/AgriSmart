import { Download, Loader2 } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import { Card, CardBody, CardHeader } from '../common/Card'
import {
  formatDate,
  formatDateHeure,
  formatMontantTND,
  formatNombre,
} from '../../utils/finances'

export default function RapportFinancier({
  rapport,
  statistiques,
  chargement,
  periode,
  onTelechargerCsv,
}) {
  if (chargement) {
    return (
      <Card>
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          Génération de la synthèse financière...
        </div>
      </Card>
    )
  }

  const tableau = rapport?.tableauDeBord ?? {}
  const totaux = tableau.totaux ?? {}
  const stats = statistiques ?? rapport?.statistiques ?? {}
  const operations = rapport?.operations ?? []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          titre="Synthèse financière"
          sousTitre={`Période du ${formatDate(periode?.debut)} au ${formatDate(periode?.fin)}`}
          action={
            <Badge ton="brand">
              Généré le {formatDateHeure(rapport?.genereLe)}
            </Badge>
          }
        />
        <CardBody>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ['Revenus', totaux.revenusMillimes],
              ['Dépenses', totaux.depensesMillimes],
              ['Bénéfice', totaux.beneficeMillimes],
              ['Solde', totaux.soldeMillimes],
              ['Opérations', totaux.operations],
              ['Impayées', totaux.impayees],
            ].map(([label, valeur]) => (
              <div key={label} className="rounded-xl bg-slate-50 px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-base font-bold text-slate-800">
                  {label === 'Opérations' || label === 'Impayées'
                    ? formatNombre(valeur)
                    : formatMontantTND(valeur)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={onTelechargerCsv}>
              <Download className="h-4 w-4" />
              Télécharger le CSV
            </Button>
            <span className="self-center text-xs text-slate-500">
              Formats disponibles : CSV et JSON uniquement
            </span>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            titre="Répartition par type"
            sousTitre="Nombre et montant des opérations"
          />
          <CardBody className="p-0">
            {(stats.parType ?? []).length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-500">
                Aucune donnée disponible.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.parType.map((entree) => (
                  <div
                    key={entree.type}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <span className="text-sm text-slate-700">{entree.type}</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {formatNombre(entree.nombre)} · {formatMontantTND(entree.montantMillimes)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            titre="Paiements par mode"
            sousTitre="Règlements enregistrés sur la période"
          />
          <CardBody className="p-0">
            {(stats.paiementsParMode ?? []).length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-500">
                Aucun paiement enregistré sur la période.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.paiementsParMode.map((entree) => (
                  <div
                    key={entree.mode}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <span className="text-sm text-slate-700">{entree.mode}</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {formatNombre(entree.nombre)} · {formatMontantTND(entree.montantMillimes)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          titre={`Opérations incluses (${operations.length})`}
          sousTitre={`Impayés : ${formatNombre(stats.impayes?.count ?? totaux.impayees)} · ${formatMontantTND(
            stats.impayes?.montantMillimes ?? totaux.impayeesMontantMillimes
          )}`}
        />
        <CardBody>
          <p className="text-sm leading-relaxed text-slate-600">
            La synthèse couvre {formatNombre(totaux.operations)} opération(s) sur la
            période sélectionnée. Le fichier CSV contient le détail complet des
            écritures. Les seuls formats proposés sont CSV et JSON ; aucun PDF ni
            Excel n’est simulé.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
