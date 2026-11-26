import { useEffect, useState } from 'react'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'

const formulaireVide = {
  animal: '',
  notesGenerales: '',
  allergies: '',
  antecedents: '',
  veterinaireReferent: '',
}

function ChampTexte({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        maxLength={2000}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  )
}

export default function DossierForm({
  ouvert,
  animaux,
  dossier,
  onFermer,
  onSoumettre,
  envoi = false,
  erreur = '',
}) {
  const [formulaire, setFormulaire] = useState(formulaireVide)

  useEffect(() => {
    if (!ouvert) return
    setFormulaire({
      animal: dossier?.animal?.id ?? animaux[0]?.id ?? '',
      notesGenerales: dossier?.notesGenerales ?? '',
      allergies: dossier?.allergies ?? '',
      antecedents: dossier?.antecedents ?? '',
      veterinaireReferent: dossier?.veterinaireReferent ?? '',
    })
  }, [ouvert, dossier, animaux])

  const modifier = (cle) => (evenement) =>
    setFormulaire((etat) => ({ ...etat, [cle]: evenement.target.value }))

  const soumettre = (evenement) => {
    evenement.preventDefault()
    onSoumettre({
      animal: formulaire.animal,
      notesGenerales: formulaire.notesGenerales,
      allergies: formulaire.allergies,
      antecedents: formulaire.antecedents,
      veterinaireReferent: formulaire.veterinaireReferent,
    })
  }

  return (
    <Modal
      ouvert={ouvert}
      titre={dossier ? 'Modifier le dossier médical' : 'Nouveau dossier médical'}
      sousTitre="Un seul dossier par animal — lié à un animal réel existant"
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

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Animal *
          </label>
          <select
            value={formulaire.animal}
            onChange={modifier('animal')}
            disabled={Boolean(dossier)}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value="">Choisir un animal</option>
            {animaux.map((animal) => (
              <option key={animal.id} value={animal.id}>
                {animal.name} — {animal.espece}
              </option>
            ))}
          </select>
        </div>

        <ChampTexte
          label="Notes générales"
          value={formulaire.notesGenerales}
          onChange={modifier('notesGenerales')}
          placeholder="État général, comportement, observations..."
        />
        <ChampTexte
          label="Allergies connues"
          value={formulaire.allergies}
          onChange={modifier('allergies')}
          placeholder="Ex. Pénicilline"
          rows={2}
        />
        <ChampTexte
          label="Antécédents"
          value={formulaire.antecedents}
          onChange={modifier('antecedents')}
          placeholder="Maladies ou interventions antérieures"
          rows={2}
        />

        <Input
          label="Vétérinaire référent"
          value={formulaire.veterinaireReferent}
          onChange={modifier('veterinaireReferent')}
          placeholder="Nom ou cabinet"
          maxLength={150}
        />

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variante="outline" onClick={onFermer} disabled={envoi}>
            Annuler
          </Button>
          <Button type="submit" disabled={envoi || !formulaire.animal}>
            {envoi ? 'Enregistrement...' : 'Enregistrer le dossier'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
