import Badge from '../common/Badge'
import Modal from '../common/Modal'
import {
  formatDateHeure,
  formatNombre,
  TONS_STATUT_MOUVEMENT,
  TONS_TYPE_MOUVEMENT,
} from '../../utils/stocks'

function Ligne({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="break-words text-sm text-slate-800">{children}</span>
    </div>
  )
}

export default function MouvementDetails({ ouvert, mouvement, onFermer }) {
  if (!mouvement) return null

  return (
    <Modal
      ouvert={ouvert}
      titre={`Mouvement ${mouvement.type}`}
      sousTitre={`Référence ${mouvement.reference}`}
      onFermer={onFermer}
    >
      <div className="space-y-1">
        <Ligne label="Produit">
          {mouvement.produit?.name ?? '—'} ({mouvement.produit?.unite ?? '—'})
        </Ligne>
        <Ligne label="Type">
          <Badge ton={TONS_TYPE_MOUVEMENT[mouvement.type] ?? 'neutral'}>
            {mouvement.type}
          </Badge>
        </Ligne>
        <Ligne label="Motif">{mouvement.motif}</Ligne>
        <Ligne label="Quantité">
          {formatNombre(mouvement.quantite)} {mouvement.produit?.unite ?? ''}
        </Ligne>
        <Ligne label="Date">{formatDateHeure(mouvement.date)}</Ligne>
        <Ligne label="Statut">
          <Badge ton={TONS_STATUT_MOUVEMENT[mouvement.statut] ?? 'neutral'}>
            {mouvement.statut}
          </Badge>
        </Ligne>
        <Ligne label="Responsable">
          {mouvement.utilisateur?.name ?? '—'}{' '}
          {mouvement.utilisateur?.role ? `(${mouvement.utilisateur.role})` : ''}
        </Ligne>
        <Ligne label="Quantité avant">
          {formatNombre(mouvement.quantiteAvant)}
        </Ligne>
        <Ligne label="Quantité après">
          {formatNombre(mouvement.quantiteApres)}
        </Ligne>
        {mouvement.motifAnnulation && (
          <Ligne label="Motif d'annulation">{mouvement.motifAnnulation}</Ligne>
        )}
        <Ligne label="Parcelle">{mouvement.parcelle?.name ?? '—'}</Ligne>
        <Ligne label="Cycle de culture">
          {mouvement.cycleCulture?.typeCulture ?? '—'}
        </Ligne>
        <Ligne label="Animal">{mouvement.animal?.name ?? '—'}</Ligne>
        <Ligne label="Notes">{mouvement.notes || '—'}</Ligne>
        <Ligne label="Enregistré le">
          {formatDateHeure(mouvement.createdAt)}
        </Ligne>
      </div>

      <p className="mt-5 text-xs text-slate-400">
        Ce mouvement fait partie de l’historique immuable : il ne peut être ni
        modifié ni supprimé.
      </p>
    </Modal>
  )
}
