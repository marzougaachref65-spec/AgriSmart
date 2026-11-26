import { Activity } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import Modal from '../common/Modal'
import { formatDate, nomAnimal } from '../../utils/veterinaire'

function Ligne({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="whitespace-pre-wrap break-words text-sm text-slate-800">
        {children || '—'}
      </span>
    </div>
  )
}

export default function DossierDetails({ ouvert, dossier, onFermer, onHistorique }) {
  if (!dossier) return null

  return (
    <Modal
      ouvert={ouvert}
      titre="Dossier médical"
      sousTitre={nomAnimal(dossier.animal)}
      onFermer={onFermer}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge ton="brand">{dossier.animal?.espece ?? 'Animal'}</Badge>
        {dossier.animal?.statut && <Badge>{dossier.animal.statut}</Badge>}
      </div>

      <div className="mt-4 space-y-1">
        <Ligne label="Animal">{nomAnimal(dossier.animal)}</Ligne>
        <Ligne label="Vétérinaire référent">
          {dossier.veterinaireReferent}
        </Ligne>
        <Ligne label="Notes générales">{dossier.notesGenerales}</Ligne>
        <Ligne label="Allergies connues">{dossier.allergies}</Ligne>
        <Ligne label="Antécédents">{dossier.antecedents}</Ligne>
        <Ligne label="Créé le">{formatDate(dossier.createdAt)}</Ligne>
        <Ligne label="Responsable">
          {dossier.createdBy?.name ?? '—'}
        </Ligne>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => onHistorique(dossier.animal?.id)}>
          <Activity className="h-4 w-4" />
          Voir l'historique sanitaire
        </Button>
      </div>
    </Modal>
  )
}
