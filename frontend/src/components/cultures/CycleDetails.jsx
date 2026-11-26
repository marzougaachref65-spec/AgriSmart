import {
  TONS_CYCLE,
  formatDate,
  formatNombre,
} from '../../utils/cultures'
import Badge from '../common/Badge'
import Button from '../common/Button'
import Modal from '../common/Modal'

function Ligne({ libelle, valeur }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-2.5 last:border-0 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
        {libelle}
      </dt>
      <dd className="break-words text-sm text-slate-800">{valeur ?? '—'}</dd>
    </div>
  )
}

export default function CycleDetails({ ouvert, cycle, onFermer }) {
  if (!cycle) return null

  return (
    <Modal
      ouvert={ouvert}
      titre={cycle.typeCulture}
      sousTitre={`Fiche détaillée — ID ${cycle.id}`}
      onFermer={onFermer}
    >
      <dl>
        <Ligne
          libelle="Parcelle"
          valeur={cycle.parcelle?.name ?? 'Parcelle supprimée'}
        />
        <Ligne libelle="Variété" valeur={cycle.variete || 'Non renseignée'} />
        <Ligne libelle="Date de semis" valeur={formatDate(cycle.dateSemis)} />
        <Ligne
          libelle="Récolte prévue"
          valeur={formatDate(cycle.datePrevueRecolte)}
        />
        <Ligne
          libelle="Récolte réelle"
          valeur={formatDate(cycle.dateRecolteReelle)}
        />
        <Ligne
          libelle="Quantité récoltée"
          valeur={
            cycle.quantiteRecoltee !== null
              ? `${formatNombre(cycle.quantiteRecoltee)} kg`
              : '—'
          }
        />
        <Ligne
          libelle="Statut"
          valeur={
            <Badge ton={TONS_CYCLE[cycle.statut] ?? 'neutral'}>
              {cycle.statut}
            </Badge>
          }
        />
        <Ligne libelle="Notes" valeur={cycle.notes || 'Aucune note'} />
        <Ligne libelle="Créé le" valeur={formatDate(cycle.createdAt)} />
        <Ligne libelle="Modifié le" valeur={formatDate(cycle.updatedAt)} />
      </dl>

      <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
        <Button variante="outline" onClick={onFermer}>
          Fermer
        </Button>
      </div>
    </Modal>
  )
}
