import { RotateCcw, Search } from 'lucide-react'
import Button from '../common/Button'
import Input from '../common/Input'
import {
  MODULES_CIBLE,
  PRIORITES_TACHE,
  STATUTS_TACHE,
} from '../../utils/taches'

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

export default function FiltresTaches({
  recherche,
  onRecherche,
  statut,
  onStatut,
  priorite,
  onPriorite,
  employe,
  onEmploye,
  moduleCible,
  onModuleCible,
  debut,
  onDebut,
  fin,
  onFin,
  enRetard,
  onEnRetard,
  onReinitialiser,
  filtresActifs,
  employes,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Input
        label="Rechercher"
        icon={Search}
        placeholder="Titre, référence, description..."
        value={recherche}
        onChange={(e) => onRecherche(e.target.value)}
      />
      <SelectFiltre
        label="Statut"
        value={statut}
        onChange={(e) => onStatut(e.target.value)}
        options={STATUTS_TACHE}
        placeholder="Tous les statuts"
      />
      <SelectFiltre
        label="Priorité"
        value={priorite}
        onChange={(e) => onPriorite(e.target.value)}
        options={PRIORITES_TACHE}
        placeholder="Toutes les priorités"
      />
      <SelectFiltre
        label="Employé"
        value={employe}
        onChange={(e) => onEmploye(e.target.value)}
        options={employes.map((element) => ({
          value: element.id,
          label: `${element.nom} ${element.prenoms ?? ''}`.trim(),
        }))}
        placeholder="Tous les employés"
      />
      <SelectFiltre
        label="Module cible"
        value={moduleCible}
        onChange={(e) => onModuleCible(e.target.value)}
        options={MODULES_CIBLE}
        placeholder="Tous les modules"
      />
      <Input
        label="Échéance du"
        type="date"
        value={debut}
        onChange={(e) => onDebut(e.target.value)}
      />
      <Input
        label="Échéance au"
        type="date"
        value={fin}
        onChange={(e) => onFin(e.target.value)}
      />
      <SelectFiltre
        label="Retard"
        value={enRetard}
        onChange={(e) => onEnRetard(e.target.value)}
        options={[
          { value: 'true', label: 'En retard uniquement' },
          { value: 'false', label: 'Toutes les tâches' },
        ]}
        placeholder="Toutes les tâches"
      />
      <div className="flex items-end lg:col-span-4">
        <Button
          variante="outline"
          onClick={onReinitialiser}
          disabled={!filtresActifs}
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser les filtres
        </Button>
      </div>
    </div>
  )
}
