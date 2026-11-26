import { useEffect, useState } from 'react'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'
import { TYPES_RAPPEL, datePourChamp } from '../../utils/veterinaire'

const formulaireVide = {
  animal: '',
  type: 'Rappel de vaccination',
  titre: '',
  datePrevue: datePourChamp(new Date(Date.now() + 7 * 86400000)),
  notes: '',
}

function Select({ label, value, onChange, options, placeholder, requis = false }) {
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
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const valeur = typeof option === 'string' ? option : option.value
          const libelle = typeof option === 'string' ? option : option.label
          return (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          )
        })}
      </select>
    </div>
  )
}

export default function RappelForm({
  ouvert,
  animaux,
  animalParDefaut = '',
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
      animal: animalParDefaut || animaux[0]?.id || '',
      datePrevue: datePourChamp(new Date(Date.now() + 7 * 86400000)),
    })
  }, [ouvert, animalParDefaut, animaux])

  const modifier = (cle) => (evenement) =>
    setFormulaire((etat) => ({ ...etat, [cle]: evenement.target.value }))

  const soumettre = (evenement) => {
    evenement.preventDefault()
    onSoumettre({
      animal: formulaire.animal,
      type: formulaire.type,
      titre: formulaire.titre,
      datePrevue: formulaire.datePrevue
        ? new Date(`${formulaire.datePrevue}T00:00:00`).toISOString()
        : undefined,
      notes: formulaire.notes,
    })
  }

  return (
    <Modal
      ouvert={ouvert}
      titre="Nouveau rappel de soin"
      sousTitre="Planifié par défaut — lié à un animal réel"
      onFermer={onFermer}
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

        <Select
          label="Animal"
          value={formulaire.animal}
          onChange={modifier('animal')}
          options={animaux.map((animal) => ({
            value: animal.id,
            label: `${animal.name} — ${animal.espece}`,
          }))}
          placeholder="Choisir un animal"
          requis
        />
        <Select
          label="Type de rappel"
          value={formulaire.type}
          onChange={modifier('type')}
          options={TYPES_RAPPEL.map((type) => ({ value: type, label: type }))}
          requis
        />
        <Input
          label="Titre"
          value={formulaire.titre}
          onChange={modifier('titre')}
          placeholder="Ex. Rappel vaccination rage"
          maxLength={150}
        />
        <Input
          label="Date prévue"
          type="date"
          value={formulaire.datePrevue}
          onChange={modifier('datePrevue')}
          required
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
          <textarea
            rows={3}
            value={formulaire.notes}
            onChange={modifier('notes')}
            maxLength={2000}
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variante="outline" onClick={onFermer} disabled={envoi}>
            Annuler
          </Button>
          <Button type="submit" disabled={envoi || !formulaire.animal}>
            {envoi ? 'Enregistrement...' : 'Créer le rappel'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
