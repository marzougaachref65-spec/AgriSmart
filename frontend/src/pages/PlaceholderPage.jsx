import { Link } from 'react-router-dom'
import { ArrowLeft, Construction } from 'lucide-react'
import Badge from '../components/common/Badge'
import { buttonStyles } from '../components/common/Button'
import { Card } from '../components/common/Card'
import PageHeader from '../components/common/PageHeader'

/**
 * Page générique pour réserver un module sans inventer de fonctionnalité.
 */
export default function PlaceholderPage({ titre, description, icone: Icone, phase }) {
  return (
    <>
      <PageHeader titre={titre} sousTitre={description} />

      <Card className="p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          {Icone ? <Icone className="h-7 w-7" /> : <Construction className="h-7 w-7" />}
        </div>

        <div className="mt-5 flex justify-center">
          <Badge ton="brand">Module prévu — phase {phase}</Badge>
        </div>

        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Ce module sera développé ultérieurement
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
          La structure de l'application est prête à l'accueillir. Aucune
          fonctionnalité ni donnée n'est disponible pour le moment.
        </p>

        <Link to="/dashboard" className={`${buttonStyles('outline')} mt-7`}>
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Link>
      </Card>
    </>
  )
}
