import Badge from '../common/Badge'
import Button from '../common/Button'
import Modal from '../common/Modal'
import {
  TONS_STATUT,
  formatDate,
  formatNombre,
} from '../../utils/animals'

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

export default function AnimalDetails({ ouvert, animal, onFermer }) {
  if (!animal) return null

  return (
    <Modal
      ouvert={ouvert}
      titre={animal.name}
      sousTitre={`Fiche détaillée — ID ${animal.id}`}
      onFermer={onFermer}
    >
      <dl>
        <Ligne libelle="Espèce" valeur={animal.espece} />
        <Ligne libelle="Race" valeur={animal.race || 'Non renseignée'} />
        <Ligne libelle="Sexe" valeur={animal.sexe} />
        <Ligne libelle="Date de naissance" valeur={formatDate(animal.dateNaissance)} />
        <Ligne
          libelle="Poids"
          valeur={animal.poids !== null ? `${formatNombre(animal.poids)} kg` : '—'}
        />
        <Ligne
          libelle="Statut"
          valeur={
            <Badge ton={TONS_STATUT[animal.statut] ?? 'neutral'}>
              {animal.statut}
            </Badge>
          }
        />
        <Ligne libelle="Date d'acquisition" valeur={formatDate(animal.dateAcquisition)} />
        <Ligne
          libelle="Prix d'acquisition"
          valeur={formatNombre(animal.prixAcquisition)}
        />
        <Ligne libelle="Notes" valeur={animal.notes || 'Aucune note'} />
        <Ligne libelle="Créé le" valeur={formatDate(animal.createdAt)} />
        <Ligne libelle="Modifié le" valeur={formatDate(animal.updatedAt)} />
      </dl>

      <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
        <Button variante="outline" onClick={onFermer}>
          Fermer
        </Button>
      </div>
    </Modal>
  )
}
