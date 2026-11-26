import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card } from './Card'

export default function StatCard({
  titre,
  valeur,
  icone: Icone,
  tendance,
  positive = true,
  complement,
}) {
  const TendanceIcone = positive ? ArrowUpRight : ArrowDownRight

  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{titre}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {valeur}
          </p>
        </div>
        {Icone && (
          <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
            <Icone className="h-5 w-5" />
          </div>
        )}
      </div>

      {(tendance || complement) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {tendance && (
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                positive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              <TendanceIcone className="h-3.5 w-3.5" />
              {tendance}
            </span>
          )}
          {complement && (
            <span className="text-slate-400">{complement}</span>
          )}
        </div>
      )}
    </Card>
  )
}
