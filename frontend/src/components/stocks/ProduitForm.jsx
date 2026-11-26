import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { CATEGORIES_PRODUIT, datePourChamp, optionnel } from '../../utils/stocks'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'

const formulaireVide = {
  name: '',
  categorie: 'Semences',
  unite: 'kg',
  prixUnitaire: '',
  fournisseur: '',
  seuilMinimum: '',
  dateExpiration: '',
  stockInitial: '',
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

export default function ProduitForm({
  ouvert,
  produit,
  onFermer,
  onSoumettre,
  envoi = false,
  erreur = '',
}) {
  const [formulaire, setFormulaire] = useState(formulaireVide)

  useEffect(() => {
    if (!ouvert) return

    setFormulaire(
      produit
        ? {
            name: produit.name ?? '',
            categorie: produit.categorie ?? 'Semences',
            unite: produit.unite ?? 'kg',
            prixUnitaire: produit.prixUnitaire ?? '',
            fournisseur: produit.fournisseur ?? '',
            seuilMinimum: produit.seuilMinimum ?? '',
            dateExpiration: datePourChamp(produit.dateExpiration),
            stockInitial: '',
          }
        : formulaireVide
    )
  }, [produit, ouvert])

  const modifier = (cle) => (evenement) =>
    setFormulaire((etat) => ({ ...etat, [cle]: evenement.target.value }))

  const soumettre = (evenement) => {
    evenement.preventDefault()

    const donnees = {
      name: formulaire.name.trim(),
      categorie: formulaire.categorie,
      unite: formulaire.unite.trim(),
      prixUnitaire: Number(formulaire.prixUnitaire || 0),
      fournisseur: optionnel(formulaire.fournisseur),
      seuilMinimum: Number(formulaire.seuilMinimum || 0),
      dateExpiration: optionnel(formulaire.dateExpiration),
    }

    if (!produit && formulaire.stockInitial !== '') {
      donnees.stockInitial = Number(formulaire.stockInitial)
    }

    onSoumettre(donnees)
  }

  return (
    <Modal
      ouvert={ouvert}
      titre={produit ? 'Modifier le produit' : 'Ajouter un produit'}
      sousTitre={
        produit
          ? 'La quantité disponible se modifie uniquement par un mouvement de stock'
          : 'Les champs marqués * sont obligatoires'
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
            label="Nom du produit *"
            value={formulaire.name}
            onChange={modifier('name')}
            placeholder="Ex. Engrais NPK 15-15-15"
            maxLength={100}
            required
          />

          <Select
            label="Catégorie *"
            value={formulaire.categorie}
            onChange={modifier('categorie')}
            options={CATEGORIES_PRODUIT}
            required
          />

          <Input
            label="Unité *"
            value={formulaire.unite}
            onChange={modifier('unite')}
            placeholder="Ex. kg, litre, sac, pièce"
            maxLength={30}
            required
          />

          <Input
            label="Prix unitaire *"
            type="number"
            min="0"
            step="0.01"
            value={formulaire.prixUnitaire}
            onChange={modifier('prixUnitaire')}
            placeholder="Ex. 2.50"
            required
          />

          <Input
            label="Seuil minimum *"
            type="number"
            min="0"
            step="0.01"
            value={formulaire.seuilMinimum}
            onChange={modifier('seuilMinimum')}
            placeholder="Ex. 10"
            required
          />

          <Input
            label="Date d'expiration"
            type="date"
            value={formulaire.dateExpiration}
            onChange={modifier('dateExpiration')}
          />

          <div className="sm:col-span-2">
            <Input
              label="Fournisseur"
              value={formulaire.fournisseur}
              onChange={modifier('fournisseur')}
              placeholder="Ex. Coopérative locale"
              maxLength={150}
            />
          </div>

          {!produit && (
            <div className="sm:col-span-2">
              <Input
                label="Stock initial (optionnel)"
                type="number"
                min="0"
                step="0.01"
                value={formulaire.stockInitial}
                onChange={modifier('stockInitial')}
                placeholder="Laisser vide pour démarrer à 0"
              />
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                Un stock initial est enregistré comme un véritable mouvement
                « Entrée / Approvisionnement » dans l’historique.
              </p>
            </div>
          )}
        </div>

        {produit && (
          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            Stock actuel : <strong>{produit.quantiteDisponible}</strong>{' '}
            {produit.unite}. Utilisez « Nouveau mouvement » pour l’ajuster.
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variante="outline" onClick={onFermer} disabled={envoi}>
            Annuler
          </Button>
          <Button type="submit" disabled={envoi}>
            {envoi
              ? 'Enregistrement...'
              : produit
                ? 'Enregistrer les modifications'
                : 'Ajouter le produit'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
