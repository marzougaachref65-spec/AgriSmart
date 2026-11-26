import { CalendarDays, RefreshCw, RotateCcw } from 'lucide-react'
import Button from '../common/Button'
import Input from '../common/Input'
import {
  PERIODES_RAPIDES,
  aujourdHui,
  debutAnnee,
} from '../../utils/rapports'

export default function FiltrePeriode({
  periode,
  onPeriodeChange,
  onActualiser,
  chargement = false,
}) {
  const appliquerRapide = (rapide) => {
    onPeriodeChange({ debut: rapide.debut(), fin: aujourdHui(), rapide: rapide.id })
  }

  const reinitialiser = () => {
    onPeriodeChange({ debut: debutAnnee(), fin: aujourdHui(), rapide: 'annee' })
  }

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <CalendarDays className="h-4 w-4 text-brand-600" />
          Période du rapport
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODES_RAPIDES.map((rapide) => (
            <Button
              key={rapide.id}
              variante={periode.rapide === rapide.id ? 'primary' : 'outline'}
              taille="sm"
              onClick={() => appliquerRapide(rapide)}
              disabled={chargement}
            >
              {rapide.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Depuis"
          type="date"
          value={periode.debut}
          max={periode.fin || undefined}
          onChange={(evenement) =>
            onPeriodeChange({ ...periode, debut: evenement.target.value, rapide: '' })
          }
        />
        <Input
          label="Jusqu'au"
          type="date"
          value={periode.fin}
          min={periode.debut || undefined}
          onChange={(evenement) =>
            onPeriodeChange({ ...periode, fin: evenement.target.value, rapide: '' })
          }
        />
        <div className="flex items-end gap-2 lg:col-span-2">
          <Button
            variante="secondary"
            taille="sm"
            onClick={reinitialiser}
            disabled={chargement}
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
          <Button
            variante="outline"
            taille="sm"
            onClick={onActualiser}
            disabled={chargement}
          >
            <RefreshCw className={`h-4 w-4 ${chargement ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>
    </div>
  )
}
