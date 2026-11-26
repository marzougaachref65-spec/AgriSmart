import { Ban, Loader2, Wallet } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import Modal from '../common/Modal'
import {
  LIBELLES_STATUT_PAIEMENT,
  LIBELLES_TYPE_OPERATION,
  TONS_STATUT_PAIEMENT,
  TONS_TYPE_OPERATION,
  formatDate,
  formatDateHeure,
  formatMontantTND,
  formatNombre,
  saisieVersMillimes,
} from '../../utils/finances'

function Ligne({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="whitespace-pre-wrap break-words text-sm text-slate-800">
        {children || '—'}
      </span>
    </div>
  )
}

function nomUtilisateur(utilisateur) {
  if (!utilisateur) return '—'
  if (typeof utilisateur === 'string') return utilisateur
  return utilisateur.name || utilisateur.email || '—'
}

function soldeRestant(operation) {
  if (!operation) return 0
  if (
    operation.montantMillimes !== undefined &&
    operation.montantPayeMillimes !== undefined
  ) {
    return Math.max(
      0,
      Number(operation.montantMillimes) - Number(operation.montantPayeMillimes)
    )
  }
  return Math.max(
    0,
    saisieVersMillimes(String(operation.montant ?? 0)) -
      saisieVersMillimes(String(operation.montantPaye ?? 0))
  )
}

export default function OperationDetails({
  ouvert,
  operation,
  historique,
  chargementHistorique = false,
  onFermer,
  onPayer,
  onAnnuler,
}) {
  if (!operation) return null

  const annulee = operation.statut === 'Annulé'
  const payee = operation.statutPaiement === 'Payé'
  const paiements = operation.paiements ?? []
  const entreesHistorique = Array.isArray(historique) ? historique : []

  return (
    <Modal
      ouvert={ouvert}
      titre={operation.libelle}
      sousTitre={`${operation.reference} · ${formatDate(operation.date)}`}
      onFermer={onFermer}
      largeur="max-w-4xl"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge ton={TONS_TYPE_OPERATION[operation.type] ?? 'neutral'}>
          {LIBELLES_TYPE_OPERATION[operation.type] ?? operation.type}
        </Badge>
        <Badge ton={TONS_STATUT_PAIEMENT[operation.statutPaiement] ?? 'neutral'}>
          {LIBELLES_STATUT_PAIEMENT[operation.statutPaiement] ?? operation.statutPaiement}
        </Badge>
        {annulee && <Badge ton="neutral">Annulé</Badge>}
      </div>

      <div className="mt-4 space-y-1">
        <Ligne label="Montant">{formatMontantTND(operation.montantMillimes)}</Ligne>
        <Ligne label="Devise">{operation.devise} (DT)</Ligne>
        <Ligne label="Date">{formatDate(operation.date)}</Ligne>
        <Ligne label="Échéance">{formatDate(operation.dateEcheance)}</Ligne>
        <Ligne label="Catégorie">
          {operation.categorie
            ? `${operation.categorie.libelle} (${operation.categorie.code})`
            : null}
        </Ligne>
        <Ligne label="Montant payé">{formatMontantTND(operation.montantPayeMillimes)}</Ligne>
        <Ligne label="Solde restant">{formatMontantTND(soldeRestant(operation))}</Ligne>
        <Ligne label="Journal">{operation.journal ?? '—'}</Ligne>
        <Ligne label="Source">
          {operation.source
            ? `${operation.source.module}${
                operation.source.referenceId ? ` · ${operation.source.referenceId}` : ''
              }${operation.source.libelle ? ` — ${operation.source.libelle}` : ''}`
            : null}
        </Ligne>
        <Ligne label="Description">{operation.description}</Ligne>
        <Ligne label="Créé par">{nomUtilisateur(operation.createdBy)}</Ligne>
        <Ligne label="Créé le">{formatDateHeure(operation.createdAt)}</Ligne>
        <Ligne label="Modifié le">{formatDateHeure(operation.updatedAt)}</Ligne>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-slate-800">
          Paiements ({formatNombre(paiements.length)})
        </p>
        {paiements.length === 0 ? (
          <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Aucun paiement enregistré.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Référence</th>
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Mode</th>
                  <th className="px-3 py-2 text-right font-semibold">Montant</th>
                  <th className="px-3 py-2 font-semibold">Note</th>
                  <th className="px-3 py-2 font-semibold">Saisi par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paiements.map((paiement) => (
                  <tr key={paiement.reference}>
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">
                      {paiement.reference}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {formatDateHeure(paiement.date)}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{paiement.mode}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-800">
                      {formatMontantTND(paiement.montantMillimes)}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{paiement.note || '—'}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {nomUtilisateur(paiement.createdBy)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-slate-800">Journal d'audit</p>
        {chargementHistorique ? (
          <p className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement de l'historique...
          </p>
        ) : entreesHistorique.length === 0 ? (
          <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Aucune entrée d'historique.
          </p>
        ) : (
          <div className="space-y-2">
            {entreesHistorique.map((entree, index) => (
              <div
                key={`${entree.action}-${entree.date}-${index}`}
                className="rounded-xl border border-slate-200 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800">
                    {entree.action}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDateHeure(entree.date)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {nomUtilisateur(entree.utilisateur)}
                </p>
                {entree.detail && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                    {typeof entree.detail === 'string'
                      ? entree.detail
                      : JSON.stringify(entree.detail)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
        <Button variante="outline" onClick={onFermer}>
          Fermer
        </Button>
        <Button
          variante="secondary"
          disabled={payee || annulee}
          onClick={() => onPayer(operation)}
        >
          <Wallet className="h-4 w-4" />
          Payer
        </Button>
        <Button
          variante="danger"
          disabled={annulee}
          onClick={() => onAnnuler(operation)}
        >
          <Ban className="h-4 w-4" />
          Annuler l'opération
        </Button>
      </div>
    </Modal>
  )
}
