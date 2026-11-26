import { Bell, LogOut, Menu } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationsContext'
import { useAuth } from '../../hooks/useAuth'
import { LIBELLES_ROLES } from '../../utils/constants'
import { getPageTitle } from '../../utils/navigation'
import Badge from '../common/Badge'

function initialesDuNom(nom = '') {
  return nom
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0].toUpperCase())
    .join('')
}

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { statistiques } = useNotifications()
  const { pathname } = useLocation()
  const titre = getPageTitle(pathname)
  const initiales = initialesDuNom(user?.name) || 'AS'
  const nonLues = statistiques?.nonLues ?? 0

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Ouvrir le menu"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="hidden text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:block">
            Espace de gestion
          </p>
          <h2 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
            {titre}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to="/notifications"
          aria-label={`Notifications${nonLues > 0 ? `, ${nonLues} non lue(s)` : ''}`}
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          title={`${nonLues} notification(s) non lue(s)`}
        >
          <Bell className="h-5 w-5" />
          {nonLues > 0 && (
            <span
              data-testid="badge-notifications"
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white"
            >
              {nonLues > 99 ? '99+' : nonLues}
            </span>
          )}
        </Link>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        <div className="hidden text-right sm:block">
          <p className="max-w-48 truncate text-sm font-semibold text-slate-800">
            {user?.name}
          </p>
          <p className="max-w-48 truncate text-xs text-slate-500">
            {user?.email}
          </p>
        </div>

        <div
          title={user?.name}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white"
        >
          {initiales}
        </div>

        <Badge ton="brand" className="hidden md:inline-flex">
          {LIBELLES_ROLES[user?.role] ?? user?.role}
        </Badge>

        <button
          type="button"
          onClick={logout}
          aria-label="Déconnexion"
          title="Déconnexion"
          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
