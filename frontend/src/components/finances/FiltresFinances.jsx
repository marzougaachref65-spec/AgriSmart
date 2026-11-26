import { Download, Loader2, RotateCcw, Search } from 'lucide-react'
import Button from '../common/Button'
import Input from '../common/Input'
import {
  LIBELLES_STATUT_PAIEMENT,
  LIBELLES_TYPE_OPERATION,
  MODES_PAIEMENT,
  MODULES_SOURCE,
  TYPES_OPERATION,
} from '../../utils/finances'

function SelectFiltre({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">{placeholder}</option>
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

export default function FiltresFinances({
  valeurs,
  onChange,
  categories,
  onReset,
  onExport,
  filtresActifs,
  chargement = false,
}) {
  const optionsCategories = (categories ?? []).map((categorie) => ({
    value: categorie.id,
    label: categorie.libelle,
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Rechercher"
          icon={Search}
          placeholder="Libellé, référence, description..."
          value={valeurs.recherche}
          onChange={(evenement) => onChange('recherche', evenement.target.value)}
        />
        <SelectFiltre
          label="Type"
          value={valeurs.type}
          onChange={(evenement) => onChange('type', evenement.target.value)}
          options={TYPES_OPERATION.map((type) => ({
            value: type,
            label: LIBELLES_TYPE_OPERATION[type],
          }))}
          placeholder="Tous les types"
        />
        <SelectFiltre
          label="Catégorie"
          value={valeurs.categorie}
          onChange={(evenement) => onChange('categorie', evenement.target.value)}
          options={optionsCategories}
          placeholder="Toutes les catégories"
        />
        <SelectFiltre
          label="Statut de paiement"
          value={valeurs.statutPaiement}
          onChange={(evenement) =>
            onChange('statutPaiement', evenement.target.value)
          }
          options={Object.keys(LIBELLES_STATUT_PAIEMENT).map((statut) => ({
            value: statut,
            label: LIBELLES_STATUT_PAIEMENT[statut],
          }))}
          placeholder="Tous les statuts"
        />
        <SelectFiltre
          label="Mode de paiement"
          value={valeurs.modePaiement}
          onChange={(evenement) =>
            onChange('modePaiement', evenement.target.value)
          }
          options={MODES_PAIEMENT}
          placeholder="Tous les modes"
        />
        <SelectFiltre
          label="Module source"
          value={valeurs.sourceModule}
          onChange={(evenement) => onChange('sourceModule', evenement.target.value)}
          options={MODULES_SOURCE}
          placeholder="Toutes les sources"
        />
        <Input
          label="Depuis"
          type="date"
          value={valeurs.debut}
          onChange={(evenement) => onChange('debut', evenement.target.value)}
        />
        <Input
          label="Jusqu'au"
          type="date"
          value={valeurs.fin}
          onChange={(evenement) => onChange('fin', evenement.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variante="outline"
          taille="sm"
          onClick={onReset}
          disabled={!filtresActifs}
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser les filtres
        </Button>
        {onExport && (
          <Button variante="ghost" taille="sm" onClick={onExport}>
            <Download className="h-4 w-4" />
            Exporter les opérations en CSV
          </Button>
        )}
        {chargement && (
          <span
            role="status"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600" />
            Actualisation des données...
          </span>
        )}
      </div>
    </div>
  )
}
