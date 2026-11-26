import { Leaf, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { getNavigationPourRole } from '../../utils/navigation'

export default function Sidebar({ role, open, onClose }) {
  const groupes = getNavigationPourRole(role ?? '')

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-900">
                AgriSmart
              </p>
              <p className="text-[11px] text-slate-400">Gestion agricole</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {groupes.map((groupe) => (
            <div key={groupe.section}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {groupe.section}
              </p>
              <div className="space-y-1">
                {groupe.items.map((item) => {
                  const Icone = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        [
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                          isActive
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        ].join(' ')
                      }
                    >
                      <Icone className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.phase && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                          P{item.phase}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 px-5 py-4">
          <p className="text-xs font-semibold text-slate-700">AgriSmart v1.0.0</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Phase 10 — Rapports et statistiques
          </p>
        </div>
      </aside>
    </>
  )
}
