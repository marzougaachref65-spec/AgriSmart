import {
  AlertTriangle,
  BellRing,
  Check,
  CheckCircle2,
  Clock3,
  Info,
} from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import {
  formatDateHeureFr,
  libelleNiveau,
  libelleType,
  tonNiveau,
} from '../../utils/notifications'

const ICONES = {
  Urgent: AlertTriangle,
  Avertissement: Clock3,
  Info: Info,
}

export default function NotificationTable({
  notifications,
  surMarquerLue,
  enCours,
}) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
        <BellRing className="h-8 w-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-600">
          Aucune notification pour ces critères
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-slate-100" role="list">
      {notifications.map((notification) => {
        const Icone = ICONES[notification.niveau] ?? Info
        return (
          <li
            key={notification.id}
            data-notification-id={notification.id}
            className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between ${
              notification.lue ? 'bg-white' : 'bg-sky-50/40'
            }`}
          >
            <div className="flex min-w-0 gap-3">
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  notification.niveau === 'Urgent'
                    ? 'bg-red-50 text-red-600'
                    : notification.niveau === 'Avertissement'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-sky-50 text-sky-600'
                }`}
              >
                <Icone className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {notification.titre}
                  </p>
                  {!notification.lue && (
                    <span className="inline-flex h-2 w-2 rounded-full bg-brand-500" aria-label="Non lue" />
                  )}
                  {notification.active === false && (
                    <Badge ton="neutral">Résolue</Badge>
                  )}
                </div>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  {libelleType(notification.type)}
                  {notification.source?.reference
                    ? ` · ${notification.source.reference}`
                    : ''}
                </p>

                <p className="mt-1.5 text-sm text-slate-600">{notification.message}</p>

                {notification.montant != null && (
                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    Montant : {notification.montant}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge ton={tonNiveau(notification.niveau)}>
                    {libelleNiveau(notification.niveau)}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {formatDateHeureFr(notification.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {!notification.lue && (
              <Button
                variante="outline"
                taille="sm"
                disabled={enCours === notification.id}
                onClick={() => surMarquerLue(notification.id)}
                aria-label={`Marquer « ${notification.titre} » comme lu`}
              >
                {enCours === notification.id ? (
                  <CheckCircle2 className="h-4 w-4 animate-pulse" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Marquer comme lu
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
