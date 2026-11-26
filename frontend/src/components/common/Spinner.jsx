import { Loader2 } from 'lucide-react'

export default function Spinner({ label = 'Chargement...' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
      <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  )
}
