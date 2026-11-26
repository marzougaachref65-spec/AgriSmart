import { useEffect, useState } from 'react'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'
import {
  COULEURS_CATEGORIE,
  LIBELLES_TYPE_CATEGORIE,
  TYPES_CATEGORIE,
  optionnel,
} from '../../utils/finances'

const formulaireVide = {
  code: '',
  libelle: '',
  type: 'Depense',
  couleur: COULEURS_CATEGORIE[0],
  description: '',
}

function Select({ label, value, onChange, options, requis = false, disabled = false }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}{requis && ' *'}
      </label>
      <select
        value={value}
        onChange={onChange}
        required={requis}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {LIBELLES_TYPE_CATEGORIE[option] ?? option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function CategorieForm({
  ouvert,
  categorie,
  onFermer,
  onSoumettre,
  envoi = false,
  erreur = '',
}) {
  const [formulaire, setFormulaire] = useState(formulaireVide)

  useEffect(() => {
    if (!ouvert) return
    setFormulaire({
      code: categorie?.code ?? '',
      libelle: categorie?.libelle ?? '',
      type: categorie?.type ?? 'Depense',
      couleur: categorie?.couleur ?? COULEURS_CATEGORIE[0],
      description: categorie?.description ?? '',
    })
  }, [ouvert, categorie])

  const modifier = (cle) => (evenement) =>
    setFormulaire((etat) => ({ ...etat, [cle]: evenement.target.value }))

  const soumettre = (evenement) => {
    evenement.preventDefault()

    const commun = {
      libelle: formulaire.libelle,
      type: formulaire.type,
      description: optionnel(formulaire.description),
      couleur: optionnel(formulaire.couleur),
    }

    if (categorie) {
      onSoumettre({ ...commun, actif: categorie.actif ?? true })
      return
    }

    onSoumettre({ code: formulaire.code, ...commun })
  }

  return (
    <Modal
      ouvert={ouvert}
      titre={categorie ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      sousTitre="Les catégories structurent les opérations financières réelles"
      onFermer={onFermer}
      largeur="max-w-2xl"
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Code"
            value={formulaire.code}
            onChange={modifier('code')}
            placeholder="Ex. ALIMENTATION"
            maxLength={50}
            disabled={Boolean(categorie)}
            required
          />
          <Select
            label="Type"
            value={formulaire.type}
            onChange={modifier('type')}
            options={TYPES_CATEGORIE}
            requis
          />
        </div>

        <Input
          label="Libellé"
          value={formulaire.libelle}
          onChange={modifier('libelle')}
          placeholder="Ex. Alimentation du bétail"
          maxLength={150}
          required
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Couleur
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="color"
              aria-label="Choisir une couleur"
              value={/^#[0-9a-fA-F]{6}$/.test(formulaire.couleur)
                ? formulaire.couleur
                : COULEURS_CATEGORIE[0]}
              onChange={modifier('couleur')}
              className="h-11 w-16 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
            />
            <Input
              value={formulaire.couleur}
              onChange={modifier('couleur')}
              placeholder="#16a34a"
              maxLength={7}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            rows={3}
            value={formulaire.description}
            onChange={modifier('description')}
            maxLength={500}
            placeholder="Précisions facultatives sur cette catégorie"
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variante="outline" onClick={onFermer} disabled={envoi}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={envoi || !formulaire.libelle.trim() || (!categorie && !formulaire.code.trim())}
          >
            {envoi ? 'Enregistrement...' : 'Enregistrer la catégorie'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
