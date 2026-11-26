import { Inbox } from 'lucide-react'
import { Card } from '../common/Card'

/** État vide explicite : aucune donnée fictive n'est affichée à la place. */
export default function EtatVide({
  titre = 'Aucune donnée enregistrée',
  message = 'Les collections MongoDB concernées ne contiennent aucune donnée pour cette sélection.',
  icone: Icone = Inbox,
}) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icone className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-800">{titre}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
        {message}
      </p>
    </Card>
  )
}
