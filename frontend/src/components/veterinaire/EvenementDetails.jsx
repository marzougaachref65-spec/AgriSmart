import Badge from '../common/Badge'
import Modal from '../common/Modal'
import {
  formatDateHeure,
  formatMontant,
  formatNombre,
  libelleEvenement,
  nomAnimal,
} from '../../utils/veterinaire'
import { TONS_TYPE_EVENEMENT, LIBELLES_TYPE_EVENEMENT } from '../../utils/veterinaire'

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

export default function EvenementDetails({ ouvert, evenement, onFermer }) {
  if (!evenement) return null

  return (
    <Modal
      ouvert={ouvert}
      titre={libelleEvenement(evenement)}
      sousTitre={`${evenement.reference} · ${nomAnimal(evenement.animal)}`}
      onFermer={onFermer}
      largeur="max-w-4xl"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge ton={TONS_TYPE_EVENEMENT[evenement.type] ?? 'brand'}>
          {LIBELLES_TYPE_EVENEMENT[evenement.type] ?? evenement.type}
        </Badge>
        {evenement.type === 'Maladie' && evenement.statutMaladie && (
          <Badge ton={evenement.statutMaladie === 'En cours' ? 'danger' : 'success'}>
            {evenement.statutMaladie}
          </Badge>
        )}
        {evenement.type === 'Traitement' && evenement.statutTraitement && (
          <Badge ton={evenement.statutTraitement === 'En cours' ? 'warning' : 'neutral'}>
            {evenement.statutTraitement}
          </Badge>
        )}
      </div>

      <div className="mt-4 space-y-1">
        <Ligne label="Date de l'événement">{formatDateHeure(evenement.date)}</Ligne>
        <Ligne label="Animal">{nomAnimal(evenement.animal)}</Ligne>
        <Ligne label="Dossier">{evenement.dossier?.id ? 'Associé' : null}</Ligne>
        <Ligne label="Saisi par">{evenement.createdBy?.name}</Ligne>

        {evenement.type === 'Vaccination' && (
          <>
            <Ligne label="Vaccin">{evenement.vaccin}</Ligne>
            <Ligne label="Lot">{evenement.lot}</Ligne>
            <Ligne label="Date de rappel">{formatDateHeure(evenement.dateRappel)}</Ligne>
          </>
        )}

        {evenement.type === 'Maladie' && (
          <>
            <Ligne label="Maladie">{evenement.nomMaladie}</Ligne>
            <Ligne label="Gravité">{evenement.gravite}</Ligne>
            <Ligne label="Diagnostic">{evenement.diagnostic}</Ligne>
            <Ligne label="Début">{formatDateHeure(evenement.dateDebut)}</Ligne>
            <Ligne label="Fin">{formatDateHeure(evenement.dateFin)}</Ligne>
          </>
        )}

        {evenement.type === 'Traitement' && (
          <>
            <Ligne label="Médicament">{evenement.medicament}</Ligne>
            <Ligne label="Posologie">{evenement.posologie}</Ligne>
            <Ligne label="Dose">{formatNombre(evenement.dose)}</Ligne>
            <Ligne label="Motif">{evenement.motif}</Ligne>
            <Ligne label="Prescripteur">{evenement.prescripteur}</Ligne>
            <Ligne label="Début">{formatDateHeure(evenement.dateDebut)}</Ligne>
            <Ligne label="Fin">{formatDateHeure(evenement.dateFin)}</Ligne>
          </>
        )}

        {evenement.type === 'Consultation' && (
          <>
            <Ligne label="Nature">{evenement.nature}</Ligne>
            <Ligne label="Motif">{evenement.motif}</Ligne>
            <Ligne label="Vétérinaire">{evenement.veterinaire}</Ligne>
            <Ligne label="Coût">
              {evenement.cout !== null && evenement.cout !== undefined
                ? `${formatMontant(evenement.cout)} €`
                : null}
            </Ligne>
          </>
        )}

        <Ligne label="Notes">{evenement.notes}</Ligne>
      </div>

      <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        Cet événement fait partie de l'historique sanitaire immuable : il ne peut ni être modifié ni supprimé.
      </p>
    </Modal>
  )
}
