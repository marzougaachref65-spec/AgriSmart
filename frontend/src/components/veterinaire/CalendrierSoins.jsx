import { CalendarDays, Clock3 } from 'lucide-react'
import Badge from '../common/Badge'
import { Card, CardBody, CardHeader } from '../common/Card'
import { formatDateHeure, nomAnimal } from '../../utils/veterinaire'

function grouperParJour(entrees) {
  const groupes = new Map()
  for (const entree of entrees) {
    const cle = formatDateHeure(entree.date).split(' ')[0]
    if (!groupes.has(cle)) groupes.set(cle, [])
    groupes.get(cle).push(entree)
  }
  return [...groupes.entries()]
}

const TONS_ALERTE = {
  rappelRetard: 'danger',
  rappelProche: 'warning',
}

export default function CalendrierSoins({ entrees, chargement, periode, onSelectionnerJour }) {
  const groupes = grouperParJour(entrees ?? [])

  return (
    <Card>
      <CardHeader
        titre="Calendrier des soins"
        sousTitre={`${periode?.debut ?? 'Aujourd’hui'} → ${periode?.fin ?? '30 jours'} · rappels, vaccinations et fins de traitement`}
      />
      <CardBody>
        {chargement ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Chargement du calendrier...
          </p>
        ) : groupes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-500">
            <CalendarDays className="h-8 w-8 text-slate-300" />
            <p className="text-sm">Aucun soin planifié sur cette période.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupes.map(([jour, elements]) => (
              <div key={jour}>
                <button
                  type="button"
                  onClick={() => onSelectionnerJour?.(jour)}
                  className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-brand-700"
                >
                  <CalendarDays className="h-4 w-4" /> {jour}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                    {elements.length}
                  </span>
                </button>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {elements.map((entree) => (
                    <div
                      key={entree.id}
                      className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-brand-200 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug text-slate-800">
                          {entree.titre}
                        </p>
                        {entree.alerte && (
                          <Badge ton={TONS_ALERTE[entree.alerte] ?? 'info'}>
                            {entree.alerte === 'rappelRetard' ? 'Retard' : 'Bientôt'}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        {nomAnimal(entree.animal)} · {entree.type}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock3 className="h-3 w-3" />
                        {formatDateHeure(entree.date)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
