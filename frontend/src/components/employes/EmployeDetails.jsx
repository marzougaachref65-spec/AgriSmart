import { Activity } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import Modal from '../common/Modal'
import {
  TONS_STATUT_EMPLOYE,
  formatDate,
  formatDateHeure,
  formatSalaire,
  nomComplet,
} from '../../utils/employes'

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

export default function EmployeDetails({
  ouvert,
  employe,
  peutVoirSalaire,
  onFermer,
  onHistorique,
}) {
  if (!employe) return null

  return (
    <Modal
      ouvert={ouvert}
      titre="Fiche employé"
      sousTitre={employe.fonction || 'Fiche du personnel'}
      onFermer={onFermer}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge ton={TONS_STATUT_EMPLOYE[employe.statut] ?? 'neutral'}>
          {employe.statut}
        </Badge>
        {employe.utilisateur && (
          <Badge ton="info">Compte : {employe.utilisateur.name || 'associé'}</Badge>
        )}
      </div>

      <div className="mt-4 space-y-1">
        <Ligne label="Nom complet">{nomComplet(employe)}</Ligne>
        <Ligne label="Fonction">{employe.fonction}</Ligne>
        <Ligne label="Spécialité">{employe.specialite}</Ligne>
        <Ligne label="CIN">{employe.cin}</Ligne>
        <Ligne label="Téléphone">{employe.telephone}</Ligne>
        <Ligne label="E-mail personnel">{employe.email}</Ligne>
        <Ligne label="Date de naissance">{formatDate(employe.dateNaissance)}</Ligne>
        <Ligne label="Date de recrutement">
          {formatDate(employe.dateRecrutement)}
        </Ligne>
        <Ligne label="Date de fin">{formatDate(employe.dateFin)}</Ligne>
        {peutVoirSalaire && (
          <Ligne label="Salaire">{formatSalaire(employe)}</Ligne>
        )}
        <Ligne label="Adresse">{employe.adresse}</Ligne>
        <Ligne label="Notes">{employe.notes}</Ligne>
        <Ligne label="Créé le">{formatDateHeure(employe.createdAt)}</Ligne>
        <Ligne label="Responsable de la saisie">
          {employe.createdBy?.name ?? '—'}
        </Ligne>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => onHistorique(employe)}>
          <Activity className="h-4 w-4" />
          Voir l'historique
        </Button>
      </div>
    </Modal>
  )
}
