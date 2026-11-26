import {
  TONS_PARCELLE,
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

export default function ParcelleDetails({ ouvert, parcelle, onFermer }) {
  if (!parcelle) return null

  return (
    <Modal
      ouvert={ouvert}
      titre={parcelle.name}
      sousTitre={`Fiche détaillée — ID ${parcelle.id}`}
      onFermer={onFermer}
    >
      <dl>
        <Ligne
          libelle="Superficie"
          valeur={`${formatNombre(parcelle.superficie)} ha`}
        />
        <Ligne libelle="Localisation" valeur={parcelle.localisation || 'Non renseignée'} />
        <Ligne libelle="Type de sol" valeur={parcelle.typeSol || 'Non renseigné'} />
        <Ligne
          libelle="Système d'irrigation"
          valeur={parcelle.systemeIrrigation || 'Non renseigné'}
        />
        <Ligne
          libelle="Statut"
          valeur={
            <Badge ton={TONS_PARCELLE[parcelle.statut] ?? 'neutral'}>
              {parcelle.statut}
            </Badge>
          }
        />
        <Ligne libelle="Notes" valeur={parcelle.notes || 'Aucune note'} />
        <Ligne libelle="Créée le" valeur={formatDate(parcelle.createdAt)} />
        <Ligne libelle="Modifiée le" valeur={formatDate(parcelle.updatedAt)} />
      </dl>

      <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
        <Button variante="outline" onClick={onFermer}>
          Fermer
        </Button>
      </div>
    </Modal>
  )
}
