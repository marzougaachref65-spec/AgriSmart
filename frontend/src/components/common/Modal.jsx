import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Modale réutilisable : overlay cliquable, fermeture par Échap, scroll mobile.
 */
export default function Modal({
  ouvert,
  titre,
  sousTitre,
  onFermer,
  children,
  largeur = 'max-w-2xl',
}) {
  useEffect(() => {
    if (!ouvert) return undefined

    const surTouche = (evenement) => {
      if (evenement.key === 'Escape') onFermer()
    }

    document.addEventListener('keydown', surTouche)
    return () => document.removeEventListener('keydown', surTouche)
  }, [ouvert, onFermer])

  if (!ouvert) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Fermer la fenêtre"
        onClick={onFermer}
        className="absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className={`relative z-10 flex max-h-[92vh] w-full ${largeur} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">{titre}</h2>
            {sousTitre && (
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {sousTitre}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
