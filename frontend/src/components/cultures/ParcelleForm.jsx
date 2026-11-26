import { useEffect, useState } from 'react'
import { STATUTS_PARCELLE, optionnel } from '../../utils/cultures'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'

const formulaireVide = {
  name: '',
  superficie: '',
  localisation: '',
  typeSol: '',
  systemeIrrigation: '',
  statut: 'Disponible',
  notes: '',
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

export default function ParcelleForm({
  ouvert,
  parcelle,
  onFermer,
  onSoumettre,
  envoi = false,
  erreur = '',
}) {
  const [formulaire, setFormulaire] = useState(formulaireVide)

  useEffect(() => {
    if (!ouvert) return

    setFormulaire(
      parcelle
        ? {
            name: parcelle.name ?? '',
            superficie: parcelle.superficie ?? '',
            localisation: parcelle.localisation ?? '',
            typeSol: parcelle.typeSol ?? '',
            systemeIrrigation: parcelle.systemeIrrigation ?? '',
            statut: parcelle.statut ?? 'Disponible',
            notes: parcelle.notes ?? '',
          }
        : formulaireVide
    )
  }, [parcelle, ouvert])

  const modifier = (cle) => (evenement) =>
    setFormulaire((etat) => ({ ...etat, [cle]: evenement.target.value }))

  const soumettre = (evenement) => {
    evenement.preventDefault()

    onSoumettre({
      name: formulaire.name.trim(),
      superficie:
        formulaire.superficie === ''
          ? null
          : Number(formulaire.superficie),
      localisation: optionnel(formulaire.localisation),
      typeSol: optionnel(formulaire.typeSol),
      systemeIrrigation: optionnel(formulaire.systemeIrrigation),
      statut: formulaire.statut,
      notes: optionnel(formulaire.notes),
    })
  }

  return (
    <Modal
      ouvert={ouvert}
      titre={parcelle ? 'Modifier la parcelle' : 'Ajouter une parcelle'}
      sousTitre={
        parcelle ? `ID ${parcelle.id}` : 'Les champs marqués * sont obligatoires'
      }
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
            label="Nom de la parcelle *"
            value={formulaire.name}
            onChange={modifier('name')}
            placeholder="Ex. Parcelle Nord-3"
            maxLength={100}
            required
          />

          <Input
            label="Superficie (hectares) *"
            type="number"
            min="0.01"
            step="0.01"
            value={formulaire.superficie}
            onChange={modifier('superficie')}
            placeholder="Ex. 12.5"
            required
          />

          <Input
            label="Localisation"
            value={formulaire.localisation}
            onChange={modifier('localisation')}
            placeholder="Ex. Secteur nord"
            maxLength={150}
          />

          <Input
            label="Type de sol"
            value={formulaire.typeSol}
            onChange={modifier('typeSol')}
            placeholder="Ex. Argileux"
            maxLength={100}
          />

          <Input
            label="Système d'irrigation"
            value={formulaire.systemeIrrigation}
            onChange={modifier('systemeIrrigation')}
            placeholder="Ex. Goutte-à-goutte"
            maxLength={100}
          />

          <Select
            label="Statut"
            value={formulaire.statut}
            onChange={modifier('statut')}
            options={STATUTS_PARCELLE}
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
            placeholder="Observations, état du sol, accès..."
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
              : parcelle
                ? 'Enregistrer les modifications'
                : 'Ajouter la parcelle'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
