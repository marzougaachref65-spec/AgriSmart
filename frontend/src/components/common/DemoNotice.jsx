import { Info } from 'lucide-react'

/**
 * Avertissement visible : toutes les valeurs du dashboard sont fictives.
 */
export default function DemoNotice({ className = '', texte }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      {texte ? (
        <p>{texte}</p>
      ) : (
        <p>
          <strong>Données de démonstration.</strong> Les chiffres et graphiques
          affichés sont fictifs. Ils ne proviennent pas de votre base MongoDB et
          ne reflètent aucune donnée réelle de l'exploitation.
        </p>
      )}
    </div>
  )
}
