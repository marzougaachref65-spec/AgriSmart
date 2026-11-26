import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { buttonStyles } from '../../components/common/Button'
import { Card } from '../../components/common/Card'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <p className="text-5xl font-bold text-brand-600">404</p>
        <h1 className="mt-3 text-xl font-bold text-slate-900">
          Page introuvable
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link to="/dashboard" className={`${buttonStyles()} mt-6 w-full`}>
          <Home className="h-4 w-4" />
          Retour à l'accueil
        </Link>
      </Card>
    </div>
  )
}
