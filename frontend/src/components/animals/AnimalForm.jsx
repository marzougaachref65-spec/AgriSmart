import { useEffect, useState } from 'react'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'
import { ESPECES, SEXES, STATUTS, optionnel } from '../../utils/animals'

const formulaireVide = {
  name: '',
  espece: 'Bovin',
  race: '',
  sexe: 'Femelle',
  dateNaissance: '',
  poids: '',
  statut: 'Actif',
  dateAcquisition: '',
  prixAcquisition: '',
  notes: '',
}

function datePourChamp(valeur) {
  if (!valeur) return ''
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function Select({ label, value, onChange, options, required = false }) {
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
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function AnimalForm({
  ouvert,
  animal,
  onFermer,
  onSoumettre,
  envoi = false,
  erreur = '',
}) {
  const [formulaire, setFormulaire] = useState(formulaireVide)

  useEffect(() => {
    if (!ouvert) return

    setFormulaire(
      animal
        ? {
            name: animal.name ?? '',
            espece: animal.espece ?? 'Bovin',
            race: animal.race ?? '',
            sexe: animal.sexe ?? 'Femelle',
            dateNaissance: datePourChamp(animal.dateNaissance),
            poids: animal.poids ?? '',
            statut: animal.statut ?? 'Actif',
            dateAcquisition: datePourChamp(animal.dateAcquisition),
            prixAcquisition: animal.prixAcquisition ?? '',
            notes: animal.notes ?? '',
          }
        : formulaireVide
    )
  }, [animal, ouvert])

  const modifier = (cle) => (evenement) =>
    setFormulaire((etat) => ({ ...etat, [cle]: evenement.target.value }))

  const soumettre = (evenement) => {
    evenement.preventDefault()

    onSoumettre({
      name: formulaire.name.trim(),
      espece: formulaire.espece,
      race: optionnel(formulaire.race),
      sexe: formulaire.sexe,
      dateNaissance: optionnel(formulaire.dateNaissance),
      poids: formulaire.poids === '' ? null : Number(formulaire.poids),
      statut: formulaire.statut,
      dateAcquisition: optionnel(formulaire.dateAcquisition),
      prixAcquisition:
        formulaire.prixAcquisition === ''
          ? null
          : Number(formulaire.prixAcquisition),
      notes: optionnel(formulaire.notes),
    })
  }

  return (
    <Modal
      ouvert={ouvert}
      titre={animal ? "Modifier l'animal" : 'Ajouter un animal'}
      sousTitre={animal ? `ID ${animal.id}` : 'Les champs marqués * sont obligatoires'}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nom ou numéro d'identification *"
            value={formulaire.name}
            onChange={modifier('name')}
            placeholder="Ex. Vache 1042"
            maxLength={100}
            required
          />

          <Select
            label="Espèce *"
            value={formulaire.espece}
            onChange={modifier('espece')}
            options={ESPECES}
            required
          />

          <Input
            label="Race"
            value={formulaire.race}
            onChange={modifier('race')}
            placeholder="Ex. Holstein"
            maxLength={100}
          />

          <Select
            label="Sexe *"
            value={formulaire.sexe}
            onChange={modifier('sexe')}
            options={SEXES}
            required
          />

          <Input
            label="Date de naissance"
            type="date"
            value={formulaire.dateNaissance}
            onChange={modifier('dateNaissance')}
          />

          <Input
            label="Poids (kg)"
            type="number"
            min="0"
            step="0.01"
            value={formulaire.poids}
            onChange={modifier('poids')}
            placeholder="Ex. 450"
          />

          <Select
            label="Statut"
            value={formulaire.statut}
            onChange={modifier('statut')}
            options={STATUTS}
          />

          <Input
            label="Date d'acquisition"
            type="date"
            value={formulaire.dateAcquisition}
            onChange={modifier('dateAcquisition')}
          />

          <Input
            label="Prix d'acquisition"
            type="number"
            min="0"
            step="0.01"
            value={formulaire.prixAcquisition}
            onChange={modifier('prixAcquisition')}
            placeholder="Ex. 1200"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Notes et observations
          </label>
          <textarea
            rows={3}
            value={formulaire.notes}
            onChange={modifier('notes')}
            maxLength={2000}
            placeholder="Observations, suivi, comportement..."
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variante="outline" onClick={onFermer} disabled={envoi}>
            Annuler
          </Button>
          <Button type="submit" disabled={envoi}>
            {envoi
              ? 'Enregistrement...'
              : animal
                ? 'Enregistrer les modifications'
                : "Ajouter l'animal"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
