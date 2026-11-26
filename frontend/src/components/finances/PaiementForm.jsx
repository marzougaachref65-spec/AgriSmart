import { useEffect, useState } from 'react'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'
import {
  MODES_PAIEMENT,
  datePourChamp,
  formatMontantTND,
  millimesVersTexte,
  optionnel,
  saisieVersMillimes,
} from '../../utils/finances'

const formulaireVide = {
  mode: 'Espèces',
  montant: '',
  note: '',
  date: datePourChamp(new Date()),
}

function Select({ label, value, onChange, options, requis = false }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}{requis && ' *'}
      </label>
      <select
        value={value}
        onChange={onChange}
        required={requis}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function PaiementForm({
  ouvert,
  operation,
  soldeRestant,
  onFermer,
  onSoumettre,
  envoi = false,
  erreur = '',
}) {
  const [formulaire, setFormulaire] = useState(formulaireVide)

  useEffect(() => {
    if (!ouvert) return
    setFormulaire({
      ...formulaireVide,
      date: datePourChamp(new Date()),
      montant: soldeRestant > 0 ? millimesVersTexte(soldeRestant) : '',
    })
  }, [ouvert, soldeRestant])

  const modifier = (cle) => (evenement) =>
    setFormulaire((etat) => ({ ...etat, [cle]: evenement.target.value }))

  const montantMillimes = saisieVersMillimes(formulaire.montant)
  const depassement =
    formulaire.montant !== '' &&
    Number.isFinite(montantMillimes) &&
    montantMillimes > Number(soldeRestant ?? 0)
  const invalide =
    !formulaire.montant ||
    !Number.isFinite(montantMillimes) ||
    montantMillimes <= 0 ||
    depassement ||
    !formulaire.date

  const soumettre = (evenement) => {
    evenement.preventDefault()
    if (invalide) return

    const donnees = {
      mode: formulaire.mode,
      /* Saisie TND transmise telle quelle : le backend convertit une seule fois. */
      montant: formulaire.montant,
      date: new Date(`${formulaire.date}T00:00:00`).toISOString(),
    }
    const note = optionnel(formulaire.note)
    if (note) donnees.note = note
    onSoumettre(donnees)
  }

  return (
    <Modal
      ouvert={ouvert}
      titre="Enregistrer un paiement"
      sousTitre={operation ? `${operation.reference} · ${operation.libelle}` : ''}
      onFermer={onFermer}
      largeur="max-w-xl"
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

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Solde restant : <strong>{formatMontantTND(soldeRestant)}</strong>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Mode de paiement"
            value={formulaire.mode}
            onChange={modifier('mode')}
            options={MODES_PAIEMENT}
            requis
          />
          <Input
            label="Montant payé (DT)"
            type="number"
            step="0.001"
            min="0.001"
            max={soldeRestant > 0 ? millimesVersTexte(soldeRestant) : undefined}
            value={formulaire.montant}
            onChange={modifier('montant')}
            placeholder="0.000"
            error={depassement ? 'Le montant dépasse le solde restant.' : ''}
            required
          />
        </div>

        <Input
          label="Date du paiement"
          type="date"
          value={formulaire.date}
          onChange={modifier('date')}
          required
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Note (facultative)
          </label>
          <textarea
            rows={3}
            value={formulaire.note}
            onChange={modifier('note')}
            maxLength={500}
            placeholder="Précision sur le règlement"
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variante="outline" onClick={onFermer} disabled={envoi}>
            Annuler
          </Button>
          <Button type="submit" disabled={envoi || invalide}>
            {envoi ? 'Enregistrement...' : 'Enregistrer le paiement'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
