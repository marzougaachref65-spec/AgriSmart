import { Bell, ClipboardList, Users } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import Badge from '../../components/common/Badge'
import { Card } from '../../components/common/Card'
import StatCard from '../../components/common/StatCard'
import EtatVide from '../../components/rapports/EtatVide'
import GraphiqueRapport from '../../components/rapports/GraphiqueRapport'
import TableauRapport from '../../components/rapports/TableauRapport'
import {
  TONS_PRIORITE_TACHE,
  TONS_STATUT_TACHE,
  nomEmploye,
} from '../../utils/taches'
import {
  formatDate,
  formatNombre,
  periodeAffichee,
} from '../../utils/rapports'

export default function StatistiquesEmployesTaches({ rapport, chargement }) {
  if (chargement || !rapport) {
    return (
      <Card>
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          Calcul des statistiques des employés et tâches...
        </div>
      </Card>
    )
  }

  const { indicateurs = {}, details = {}, source = {}, limites = {} } = rapport
  const employes = indicateurs.employes ?? {}
  const taches = indicateurs.taches ?? {}
  const notifications = indicateurs.notifications ?? {}
  const employesDetails = details.employes?.elements ?? []
  const tachesDetails = details.taches?.elements ?? []

  const tachesParStatut = [
    { libelle: 'À faire', valeur: taches.aFaire ?? 0 },
    { libelle: 'En cours', valeur: taches.enCours ?? 0 },
    { libelle: 'Terminées', valeur: taches.terminees ?? 0 },
    { libelle: 'Annulées', valeur: taches.annulees ?? 0 },
  ]
  const notificationsParType = Object.entries(notifications.parType ?? {})
    .filter(([, nombre]) => nombre > 0)
    .map(([type, nombre]) => ({
      libelle: notifications.libellesTypes?.[type] ?? type,
      valeur: nombre,
    }))

  const toutVide =
    (employes.total ?? 0) === 0 &&
    (taches.total ?? 0) === 0 &&
    (notifications.total ?? 0) === 0

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">Période :</span>{' '}
        {periodeAffichee(rapport)} — {source.precision ?? ''}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        Les salaires et toute donnée salariale sont exclus de ce rapport. Les
        filtres personnels des tâches et notifications sont conservés.
      </div>

      {toutVide && (
        <EtatVide
          titre="Aucune donnée employé, tâche ou notification"
          message="Les collections employes, taches et notifications ne contiennent aucun document correspondant."
          icone={Users}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titre="Employés enregistrés"
          valeur={formatNombre(employes.total ?? 0)}
          icone={Users}
          complement={`${formatNombre(employes.actifs ?? 0)} actifs`}
        />
        <StatCard
          titre="Tâches (global)"
          valeur={formatNombre(taches.total ?? 0)}
          icone={ClipboardList}
          complement={`${formatNombre(taches.enRetard ?? 0)} en retard`}
        />
        <StatCard
          titre="Notifications"
          valeur={formatNombre(notifications.total ?? 0)}
          icone={Bell}
          complement={`${formatNombre(notifications.nonLues ?? 0)} non lue(s)`}
        />
        <StatCard
          titre="Tâches sur la période"
          valeur={formatNombre(details.taches?.total ?? 0)}
          icone={ClipboardList}
          complement="Filtrées par échéance"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GraphiqueRapport
          titre="Tâches par statut"
          sousTitre="État global des tâches accessibles"
          type="pie"
          donnees={tachesParStatut.filter((entree) => entree.valeur > 0)}
          formatterValeur={(valeur) => formatNombre(valeur)}
        />
        <GraphiqueRapport
          titre="Notifications par type"
          sousTitre="Types réellement présents dans MongoDB"
          type="pie"
          donnees={notificationsParType}
          formatterValeur={(valeur) => formatNombre(valeur)}
        />
      </div>

      <TableauRapport
        titre="Effectif (sans salaire)"
        sousTitre="Colonnes non salariales uniquement"
        colonnes={[
          {
            cle: 'nom',
            libelle: 'Nom complet',
            rendu: (ligne) =>
              `${ligne.prenoms ?? ''} ${ligne.nom ?? ''}`.trim() || '—',
          },
          { cle: 'fonction', libelle: 'Fonction' },
          {
            cle: 'statut',
            libelle: 'Statut',
            rendu: (ligne) => (
              <Badge ton={ligne.statut === 'Actif' ? 'success' : 'neutral'}>
                {ligne.statut ?? '—'}
              </Badge>
            ),
          },
          {
            cle: 'dateRecrutement',
            libelle: 'Recrutement',
            rendu: (ligne) => formatDate(ligne.dateRecrutement),
          },
        ]}
        donnees={employesDetails}
        tronque={details.employes?.tronque}
        total={details.employes?.total ?? 0}
        messageVide="Aucun employé enregistré."
      />

      <TableauRapport
        titre="Tâches sur la période"
        sousTitre="Échéance comprise dans la période sélectionnée"
        colonnes={[
          { cle: 'reference', libelle: 'Référence' },
          { cle: 'titre', libelle: 'Titre' },
          {
            cle: 'statut',
            libelle: 'Statut',
            rendu: (ligne) => (
              <Badge ton={TONS_STATUT_TACHE[ligne.statut] ?? 'neutral'}>
                {ligne.statut ?? '—'}
              </Badge>
            ),
          },
          {
            cle: 'priorite',
            libelle: 'Priorité',
            rendu: (ligne) => (
              <Badge ton={TONS_PRIORITE_TACHE[ligne.priorite] ?? 'neutral'}>
                {ligne.priorite ?? '—'}
              </Badge>
            ),
          },
          {
            cle: 'employes',
            libelle: 'Employés',
            rendu: (ligne) =>
              (ligne.employes ?? []).map(nomEmploye).join(', ') || '—',
          },
          {
            cle: 'dateEcheance',
            libelle: 'Échéance',
            rendu: (ligne) => formatDate(ligne.dateEcheance),
          },
          {
            cle: 'enRetard',
            libelle: 'Retard',
            rendu: (ligne) =>
              ligne.enRetard ? (
                <Badge ton="danger">En retard</Badge>
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
        ]}
        donnees={tachesDetails}
        tronque={details.taches?.tronque}
        total={details.taches?.total ?? 0}
        messageVide="Aucune tâche n'a d'échéance dans la période sélectionnée."
      />

      {(limites.detailsTronques ?? false) && (
        <p className="text-xs text-slate-500">
          Le détail est limité à {formatNombre(limites.detailsParTableau ?? 100)}{' '}
          lignes par tableau. Utilisez l’export CSV pour le détail complet
          disponible.
        </p>
      )}
    </div>
  )
}
