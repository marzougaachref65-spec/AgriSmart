import { useEffect, useState } from 'react'
import {
  STATUTS_CYCLE,
  formatNombre,
  optionnel,
} from '../../utils/cultures'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'

const formulaireVide = {
  parcelle: '',
  typeCulture: '',
  variete: '',
  dateSemis: '',
  datePrevueRecolte: '',
  dateRecolteReelle: '',
  quantiteRecoltee: '',
  statut: 'Planifiée',
  notes: '',
}

function datePourChamp(valeur) {
  if (!valeur) return ''
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function Select({ label, value, onChange, options, required = false, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {children ??
          options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
      </select>
    </div>
  )
}

export default function CycleForm({
  ouvert,
  cycle,
  parcelles,
  onFermer,
  onSoumettre,
  envoi = false,
  erreur = '',
}) {
  const [formulaire, setFormulaire] = useState(formulaireVide)

  useEffect(() => {
    if (!ouvert) return

    setFormulaire(
      cycle
        ? {
            parcelle: cycle.parcelleId ?? '',
            typeCulture: cycle.typeCulture ?? '',
            variete: cycle.variete ?? '',
            dateSemis: datePourChamp(cycle.dateSemis),
            datePrevueRecolte: datePourChamp(cycle.datePrevueRecolte),
            dateRecolteReelle: datePourChamp(cycle.dateRecolteReelle),
            quantiteRecoltee: cycle.quantiteRecoltee ?? '',
            statut: cycle.statut ?? 'Planifiée',
            notes: cycle.notes ?? '',
          }
        : { ...formulaireVide, parcelle: parcelles[0]?.id ?? '' }
    )
  }, [cycle, ouvert, parcelles])

  const modifier = (cle) => (evenement) => {
    const valeur = evenement.target.value
    setFormulaire((etat) => {
      if (cle === 'statut' && valeur !== 'Récoltée') {
        return {
          ...etat,
          statut: valeur,
          dateRecolteReelle: '',
          quantiteRecoltee: '',
        }
      }
      return { ...etat, [cle]: valeur }
    })
  }

  const estRecolte = formulaire.statut === 'Récoltée'

  const soumettre = (evenement) => {
    evenement.preventDefault()

    onSoumettre({
      parcelle: formulaire.parcelle,
      typeCulture: formulaire.typeCulture.trim(),
      variete: optionnel(formulaire.variete),
      dateSemis: formulaire.dateSemis,
      datePrevueRecolte: formulaire.datePrevueRecolte,
      dateRecolteReelle: estRecolte
        ? formulaire.dateRecolteReelle
        : null,
      quantiteRecoltee:
        estRecolte && formulaire.quantiteRecoltee !== ''
          ? Number(formulaire.quantiteRecoltee)
          : null,
      statut: formulaire.statut,
      notes: optionnel(formulaire.notes),
    })
  }

  return (
    <Modal
      ouvert={ouvert}
      titre={cycle ? 'Modifier le cycle de culture' : 'Ajouter un cycle de culture'}
      sousTitre={
        cycle
          ? `ID ${cycle.id}`
          : 'Les champs marqués * sont obligatoires'
      }
      onFermer={onFermer}
      largeur="max-w-3xl"
    >
      <form onSubmit={soumettre} className="space-y-4">
        {erreur && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {erreur}
          </div>
        )}

        {parcelles.length === 0 && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            Créez d’abord une parcelle : un cycle de culture doit être associé à
            une parcelle existante.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Parcelle associée *"
            value={formulaire.parcelle}
            onChange={modifier('parcelle')}
            required
          >
            <option value="" disabled>
              Sélectionnez une parcelle
            </option>
            {parcelles.map((parcelle) => (
              <option key={parcelle.id} value={parcelle.id}>
                {parcelle.name} — {formatNombre(parcelle.superficie)} ha
              </option>
            ))}
          </Select>

          <Select
            label="Statut"
            value={formulaire.statut}
            onChange={modifier('statut')}
            options={STATUTS_CYCLE}
          />

          <Input
            label="Type de culture *"
            value={formulaire.typeCulture}
            onChange={modifier('typeCulture')}
            placeholder="Ex. Blé, Maïs, Luzerne..."
            maxLength={100}
            required
          />

          <Input
            label="Variété"
            value={formulaire.variete}
            onChange={modifier('variete')}
            placeholder="Ex. Tendresse"
            maxLength={100}
          />

          <Input
            label="Date de semis *"
            type="date"
            value={formulaire.dateSemis}
            onChange={modifier('dateSemis')}
            required
          />

          <Input
            label="Date prévue de récolte *"
            type="date"
            value={formulaire.datePrevueRecolte}
            onChange={modifier('datePrevueRecolte')}
            required
          />

          <Input
            label={
              estRecolte
                ? 'Date réelle de récolte *'
                : 'Date réelle de récolte (cycle récolté uniquement)'
            }
            type="date"
            value={formulaire.dateRecolteReelle}
            onChange={modifier('dateRecolteReelle')}
            disabled={!estRecolte}
            required={estRecolte}
          />

          <Input
            label={
              estRecolte
                ? 'Quantité récoltée (kg) *'
                : 'Quantité récoltée (cycle récolté uniquement)'
            }
            type="number"
            min="0"
            step="0.01"
            value={formulaire.quantiteRecoltee}
            onChange={modifier('quantiteRecoltee')}
            placeholder="Ex. 4500"
            disabled={!estRecolte}
            required={estRecolte}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            rows={3}
            value={formulaire.notes}
            onChange={modifier('notes')}
            maxLength={2000}
            placeholder="Observations, suivi, rendement..."
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variante="outline" onClick={onFermer} disabled={envoi}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={envoi || parcelles.length === 0}
          >
            {envoi
              ? 'Enregistrement...'
              : cycle
                ? 'Enregistrer les modifications'
                : 'Ajouter le cycle'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
