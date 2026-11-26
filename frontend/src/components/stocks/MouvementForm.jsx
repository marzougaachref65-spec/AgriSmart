import { useEffect, useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import { listAnimals } from '../../services/animalService'
import { listCycles } from '../../services/cycleService'
import { listParcelles } from '../../services/parcelleService'
import {
  MOTIFS_ENTREE,
  MOTIFS_SORTIE,
  TYPES_MOUVEMENT,
  datePourChamp,
  optionnel,
} from '../../utils/stocks'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'

const formulaireVide = {
  produit: '',
  type: 'Entrée',
  motif: MOTIFS_ENTREE[0],
  quantite: '',
  date: datePourChamp(new Date()),
  reference: '',
  parcelle: '',
  cycleCulture: '',
  animal: '',
  notes: '',
}

function Select({ label, value, onChange, options, placeholder, required = false }) {
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

export default function MouvementForm({
  ouvert,
  produits,
  produitInitial,
  onFermer,
  onSoumettre,
  envoi = false,
  erreur = '',
}) {
  const [formulaire, setFormulaire] = useState(formulaireVide)
  const [contexte, setContexte] = useState({
    parcelles: [],
    cycles: [],
    animaux: [],
  })

  useEffect(() => {
    if (!ouvert) return

    setFormulaire({
      ...formulaireVide,
      produit: produitInitial?.id ?? produits[0]?.id ?? '',
      date: datePourChamp(new Date()),
    })

    Promise.allSettled([
      listParcelles(),
      listCycles(),
      listAnimals(),
    ]).then(([parcelles, cycles, animaux]) => {
      setContexte({
        parcelles: parcelles.status === 'fulfilled' ? parcelles.value : [],
        cycles: cycles.status === 'fulfilled' ? cycles.value : [],
        animaux: animaux.status === 'fulfilled' ? animaux.value : [],
      })
    })
  }, [ouvert, produitInitial, produits])

  const motifs = formulaire.type === 'Entrée' ? MOTIFS_ENTREE : MOTIFS_SORTIE

  const produitsOptions = useMemo(
    () =>
      produits.map((produit) => ({
        value: produit.id,
        label: `${produit.name} — ${produit.quantiteDisponible} ${produit.unite}`,
      })),
    [produits]
  )

  const cyclesOptions = useMemo(() => {
    const cycles = formulaire.parcelle
      ? contexte.cycles.filter((cycle) => {
          const parcelle = cycle.parcelle?._id ?? cycle.parcelle?.id ?? cycle.parcelle
          return parcelle === formulaire.parcelle
        })
      : contexte.cycles

    return cycles.map((cycle) => ({
      value: cycle.id,
      label: `${cycle.typeCulture}${
        cycle.parcelle?.name ? ` — ${cycle.parcelle.name}` : ''
      }`,
    }))
  }, [contexte.cycles, formulaire.parcelle])

  const modifier = (cle) => (evenement) =>
    setFormulaire((etat) => ({ ...etat, [cle]: evenement.target.value }))

  const changerType = (evenement) => {
    const type = evenement.target.value
    setFormulaire((etat) => ({
      ...etat,
      type,
      motif: type === 'Entrée' ? MOTIFS_ENTREE[0] : MOTIFS_SORTIE[0],
    }))
  }

  const produitSelectionne = produits.find((p) => p.id === formulaire.produit)

  const soumettre = (evenement) => {
    evenement.preventDefault()

    const donnees = {
      produit: formulaire.produit,
      type: formulaire.type,
      motif: formulaire.motif,
      quantite: Number(formulaire.quantite),
      reference: optionnel(formulaire.reference),
      parcelle: optionnel(formulaire.parcelle),
      cycleCulture: optionnel(formulaire.cycleCulture),
      animal: optionnel(formulaire.animal),
      notes: optionnel(formulaire.notes),
    }

    if (formulaire.date) donnees.date = new Date(formulaire.date).toISOString()

    onSoumettre(donnees)
  }

  return (
    <Modal
      ouvert={ouvert}
      titre="Nouveau mouvement de stock"
      sousTitre="Chaque mouvement est tracé et modifie le stock disponible"
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
          <div className="sm:col-span-2">
            <Select
              label="Produit *"
              value={formulaire.produit}
              onChange={modifier('produit')}
              options={produitsOptions}
              placeholder="Choisir un produit"
              required
            />
          </div>

          <Select
            label="Type de mouvement *"
            value={formulaire.type}
            onChange={changerType}
            options={TYPES_MOUVEMENT}
            required
          />

          <Select
            label="Motif *"
            value={formulaire.motif}
            onChange={modifier('motif')}
            options={motifs}
            required
          />

          <Input
            label="Quantité *"
            type="number"
            min="0.000001"
            step="0.01"
            value={formulaire.quantite}
            onChange={modifier('quantite')}
            placeholder="Ex. 25"
            required
          />

          <Input
            label="Date du mouvement"
            type="date"
            value={formulaire.date}
            onChange={modifier('date')}
          />

          <Input
            label="Référence (optionnelle)"
            value={formulaire.reference}
            onChange={modifier('reference')}
            placeholder="Générée automatiquement si vide"
            maxLength={100}
          />

          <Input
            label="Stock actuel du produit"
            value={
              produitSelectionne
                ? `${produitSelectionne.quantiteDisponible} ${produitSelectionne.unite} disponibles`
                : ''
            }
            disabled
            readOnly
          />
        </div>

        <details className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Lier le mouvement à une parcelle, un cycle ou un animal (optionnel)
          </summary>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Parcelle"
              value={formulaire.parcelle}
              onChange={(e) =>
                setFormulaire((etat) => ({
                  ...etat,
                  parcelle: e.target.value,
                  cycleCulture: '',
                }))
              }
              options={contexte.parcelles.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
              placeholder="Aucune"
            />
            <Select
              label="Cycle de culture"
              value={formulaire.cycleCulture}
              onChange={modifier('cycleCulture')}
              options={cyclesOptions}
              placeholder="Aucun"
            />
            <Select
              label="Animal"
              value={formulaire.animal}
              onChange={modifier('animal')}
              options={contexte.animaux.map((a) => ({
                value: a.id,
                label: a.name,
              }))}
              placeholder="Aucun"
            />
          </div>
        </details>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            rows={3}
            value={formulaire.notes}
            onChange={modifier('notes')}
            maxLength={2000}
            placeholder="Précisions sur l'origine ou l'utilisation"
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-xs text-brand-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Le responsable est enregistré automatiquement depuis votre session.
          L’historique des mouvements est immuable (aucune modification ni
          suppression).
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variante="outline" onClick={onFermer} disabled={envoi}>
            Annuler
          </Button>
          <Button type="submit" disabled={envoi || !formulaire.produit}>
            {envoi ? 'Enregistrement...' : 'Enregistrer le mouvement'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
