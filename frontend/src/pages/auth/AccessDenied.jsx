import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { buttonStyles } from '../../components/common/Button'
import { Card } from '../../components/common/Card'

export default function AccessDenied() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-slate-900">
          Accès non autorisé
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Votre rôle ne permet pas d'accéder à cette section. Les permissions
          sont vérifiées côté backend.
        </p>
        <Link to="/dashboard" className={`${buttonStyles()} mt-6 w-full`}>
          Retour au tableau de bord
        </Link>
      </Card>
    </div>
  )
}
