import Input from '../common/Input'
import { LIBELLES_NIVEAUX, LIBELLES_TYPES } from '../../utils/notifications'

export default function FiltresNotifications({
  recherche,
  onRecherche,
  type,
  onType,
  niveau,
  onNiveau,
  du,
  onDu,
  au,
  onAu,
  actif,
  onActif,
  types = LIBELLES_TYPES,
}) {
  return (
    <div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-2 xl:grid-cols-3">
      <Input
        label="Rechercher"
        type="search"
        placeholder="Titre, message ou référence"
        value={recherche}
        onChange={(e) => onRecherche(e.target.value)}
      />

      <div>
        <label htmlFor="filtre-type" className="mb-1.5 block text-sm font-medium text-slate-700">
          Type
        </label>
        <select
          id="filtre-type"
          value={type}
          onChange={(e) => onType(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Tous les types</option>
          {Object.entries(types).map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>{libelle}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filtre-niveau" className="mb-1.5 block text-sm font-medium text-slate-700">
          Niveau
        </label>
        <select
          id="filtre-niveau"
          value={niveau}
          onChange={(e) => onNiveau(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Tous les niveaux</option>
          {Object.entries(LIBELLES_NIVEAUX).map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>{libelle}</option>
          ))}
        </select>
      </div>

      <Input
        label="Du"
        type="date"
        value={du}
        onChange={(e) => onDu(e.target.value)}
      />
      <Input
        label="Au"
        type="date"
        value={au}
        onChange={(e) => onAu(e.target.value)}
      />

      <div>
        <label htmlFor="filtre-actif" className="mb-1.5 block text-sm font-medium text-slate-700">
          État de l'alerte
        </label>
        <select
          id="filtre-actif"
          value={actif}
          onChange={(e) => onActif(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Toutes</option>
          <option value="true">Alertes en cours</option>
          <option value="false">Alertes résolues</option>
        </select>
      </div>
    </div>
  )
}
