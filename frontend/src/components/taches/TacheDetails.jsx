import { Activity } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import Modal from '../common/Modal'
import {
  LIBELLES_MODULE_CIBLE,
  TONS_PRIORITE_TACHE,
  TONS_STATUT_TACHE,
  formatDate,
  formatDateHeure,
  libelleCible,
  nomEmploye,
} from '../../utils/taches'

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

export default function TacheDetails({ ouvert, tache, onFermer, onHistorique }) {
  if (!tache) return null

  return (
    <Modal
      ouvert={ouvert}
      titre="Détail de la tâche"
      sousTitre={tache.reference}
      onFermer={onFermer}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge ton={TONS_STATUT_TACHE[tache.statut] ?? 'neutral'}>
          {tache.statut}
        </Badge>
        <Badge ton={TONS_PRIORITE_TACHE[tache.priorite] ?? 'neutral'}>
          {tache.priorite}
        </Badge>
        {tache.enRetard && <Badge ton="danger">En retard</Badge>}
      </div>

      <div className="mt-4 space-y-1">
        <Ligne label="Titre">{tache.titre}</Ligne>
        <Ligne label="Description">{tache.description}</Ligne>
        <Ligne label="Date de début">{formatDate(tache.dateDebut)}</Ligne>
        <Ligne label="Date d'échéance">{formatDate(tache.dateEcheance)}</Ligne>
        <Ligne label="Date de réalisation">
          {formatDate(tache.dateRealisation)}
        </Ligne>
        <Ligne label="Employés affectés">
          {tache.employes?.length
            ? tache.employes.map(nomEmploye).join(', ')
            : 'Aucun'}
        </Ligne>
        <Ligne label="Module cible">
          {LIBELLES_MODULE_CIBLE[tache.cible?.module] ?? 'Autre'}
        </Ligne>
        <Ligne label="Cible">{libelleCible(tache)}</Ligne>
        <Ligne label="Motif d'annulation">{tache.motifAnnulation}</Ligne>
        <Ligne label="Créée le">{formatDateHeure(tache.createdAt)}</Ligne>
        <Ligne label="Responsable de la saisie">
          {tache.createdBy?.name ?? '—'}
        </Ligne>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => onHistorique(tache)}>
          <Activity className="h-4 w-4" />
          Voir l'historique
        </Button>
      </div>
    </Modal>
  )
}
