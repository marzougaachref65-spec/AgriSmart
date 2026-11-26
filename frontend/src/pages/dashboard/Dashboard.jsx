import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  Loader2,
  PawPrint,
  Sprout,
  Wallet,
} from 'lucide-react'
import Badge from '../../components/common/Badge'
import { Card, CardBody, CardHeader } from '../../components/common/Card'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import EtatVide from '../../components/rapports/EtatVide'
import GraphiqueRapport from '../../components/rapports/GraphiqueRapport'
import { useAuth } from '../../hooks/useAuth'
import { getAnimalStats, listAnimals } from '../../services/animalService'
import { getParcellesStats } from '../../services/parcelleService'
import { getAlertesStocks, listMouvements } from '../../services/stockService'
import { getStatistiquesTaches, listTaches } from '../../services/tacheService'
import { listNotifications } from '../../services/notificationService'
import {
  getStatistiquesFinancieres,
  getTableauDeBord,
} from '../../services/financeService'
import { ESPECES } from '../../utils/animals'
import { ALERTES, LIBELLES_ALERTE, TONS_TYPE_MOUVEMENT } from '../../utils/stocks'
import { TONS_STATUT_TACHE } from '../../utils/taches'
import { libelleNiveau, tonNiveau } from '../../utils/notifications'
import {
  formatMontantTND,
  libelleOperation,
  TONS_STATUT_PAIEMENT,
} from '../../utils/finances'
import {
  aujourdHui,
  debutAnnee,
  formaterPeriode,
  formatDate,
  parametresPeriode,
} from '../../utils/rapports'

/** Valeur lisible sans jamais transformer une absence de donnée en chiffre. */
function valeurAffichee(valeur, chargement) {
  if (chargement) return '—'
  if (valeur === null || valeur === undefined) return '—'
  return String(valeur)
}

function MessageCarte({ chargement = false, children }) {
  return (
    <Card className="p-5">
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500">
        {chargement && <Loader2 className="h-5 w-5 animate-spin text-brand-600" />}
        <span>{children}</span>
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { hasRole } = useAuth()
  const peutVoirFinances = hasRole('ADMIN', 'MANAGER')

  const periode = useMemo(() => ({ debut: debutAnnee(), fin: aujourdHui() }), [])
  const parametres = useMemo(() => parametresPeriode(periode), [periode])

  const [donnees, setDonnees] = useState({})
  const [chargement, setChargement] = useState(true)
  const [erreurs, setErreurs] = useState({})

  useEffect(() => {
    let actif = true
    setChargement(true)
    setErreurs({})

    const appels = [
      ['animaux', getAnimalStats()],
      ['animauxListe', listAnimals()],
      ['parcelles', getParcellesStats()],
      ['alertes', getAlertesStocks()],
      ['taches', getStatistiquesTaches()],
      ['tachesRecentes', listTaches({ limit: 5 })],
      ['notifications', listNotifications({ limit: 5 })],
      ['mouvements', listMouvements({ limit: 5 })],
    ]

    if (peutVoirFinances) {
      appels.push(
        ['finances', getStatistiquesFinancieres(parametres)],
        ['operations', getTableauDeBord(parametres)]
      )
    }

    Promise.allSettled(appels.map((appel) => appel[1])).then((resultats) => {
      if (!actif) return
      const prochainesDonnees = {}
      const prochainesErreurs = {}

      resultats.forEach((resultat, index) => {
        const cle = appels[index][0]
        if (resultat.status === 'fulfilled') {
          prochainesDonnees[cle] = resultat.value
        } else {
          prochainesErreurs[cle] = true
        }
      })

      setDonnees(prochainesDonnees)
      setErreurs(prochainesErreurs)
      setChargement(false)
    })

    return () => {
      actif = false
    }
  }, [peutVoirFinances, parametres])

  const statsAnimaux = donnees.animaux ?? {}
  const animaux = Array.isArray(donnees.animauxListe) ? donnees.animauxListe : []
  const statsParcelles = donnees.parcelles ?? {}
  const alertes = donnees.alertes ?? {}
  const statsTaches = donnees.taches ?? {}
  const tachesRecentes = Array.isArray(donnees.tachesRecentes?.items)
    ? donnees.tachesRecentes.items
    : []
  const notifications = Array.isArray(donnees.notifications?.items)
    ? donnees.notifications.items
    : []
  const mouvements = Array.isArray(donnees.mouvements) ? donnees.mouvements : []
  const finances = donnees.finances ?? null
  const operationsRecentes = Array.isArray(donnees.operations?.operationsRecentes)
    ? donnees.operations.operationsRecentes
    : []

  const alertesActives = ALERTES.map((cle) => ({
    cle,
    count: Number(alertes[cle]?.count ?? 0),
  })).filter((alerte) => alerte.count > 0)
  const totalAlertes = alertesActives.reduce(
    (total, alerte) => total + alerte.count,
    0
  )
  const complementAlertes = alertesActives
    .map(
      (alerte) =>
        `${alerte.count} ${LIBELLES_ALERTE[alerte.cle].toLowerCase()}`
    )
    .join(', ')

  const totauxFinanciers = finances?.totaux ?? {}
  const montantParType = (type) =>
    (finances?.parType ?? []).find((entree) => entree.type === type)
      ?.montantMillimes
  const revenusFinanciers =
    montantParType('Revenu') ?? totauxFinanciers.revenusMillimes
  const depensesFinancieres =
    montantParType('Depense') ?? totauxFinanciers.depensesMillimes
  const beneficeFinancier =
    totauxFinanciers.beneficeMillimes ??
    (revenusFinanciers !== undefined && depensesFinancieres !== undefined
      ? Number(revenusFinanciers) - Number(depensesFinancieres)
      : undefined)
  const periodeFinanciere = formaterPeriode(finances?.periode ?? periode)

  const evolutionDonnees = Array.isArray(finances?.evolutionMensuelle)
    ? finances.evolutionMensuelle.map((entree) => ({
        libelle: entree.mois,
        valeur: Number(entree.depensesMillimes ?? 0),
      }))
    : []
  const depensesParCategorie = Array.isArray(finances?.parCategorie)
    ? finances.parCategorie
        .filter(
          (entree) =>
            entree.type === 'Depense' && Number(entree.montantMillimes) > 0
        )
        .map((entree) => ({
          libelle: entree.libelle ?? entree.code ?? 'Catégorie',
          valeur: Number(entree.montantMillimes),
        }))
    : []
  const cheptelParEspece = ESPECES.map((espece) => ({
    libelle: espece,
    valeur: animaux.filter((animal) => animal.espece === espece).length,
  }))

  const activites = useMemo(() => {
    const lignes = []

    tachesRecentes.forEach((tache) => {
      const date = tache.dateEcheance ?? tache.createdAt
      if (!date) return
      lignes.push({
        id: `tache-${tache.id}`,
        titre: tache.titre ?? tache.reference ?? 'Tâche',
        categorie: 'Tâches',
        date,
        statut: tache.statut ?? '—',
        ton: TONS_STATUT_TACHE[tache.statut] ?? 'neutral',
      })
    })

    notifications.forEach((notification) => {
      const date = notification.dateEvenement ?? notification.createdAt
      if (!date) return
      lignes.push({
        id: `notification-${notification.id}`,
        titre: notification.titre ?? notification.libelleType ?? 'Notification',
        categorie: 'Notifications',
        date,
        statut: notification.libelleNiveau ?? libelleNiveau(notification.niveau),
        ton: tonNiveau(notification.niveau),
      })
    })

    mouvements.forEach((mouvement) => {
      const date = mouvement.date ?? mouvement.createdAt
      if (!date) return
      lignes.push({
        id: `mouvement-${mouvement.id}`,
        titre: `${mouvement.type ?? 'Mouvement'} — ${
          mouvement.produit?.name ?? 'Produit'
        }`,
        categorie: 'Stocks',
        date,
        statut: mouvement.statut ?? mouvement.type ?? '—',
        ton: TONS_TYPE_MOUVEMENT[mouvement.type] ?? 'neutral',
      })
    })

    if (peutVoirFinances) {
      operationsRecentes.forEach((operation) => {
        const date = operation.date ?? operation.createdAt
        if (!date) return
        lignes.push({
          id: `finance-${operation.id}`,
          titre: libelleOperation(operation),
          categorie: 'Finances',
          date,
          statut: operation.statutPaiement ?? operation.type ?? '—',
          ton: TONS_STATUT_PAIEMENT[operation.statutPaiement] ?? 'neutral',
        })
      })
    }

    return lignes
      .filter((ligne) => !Number.isNaN(new Date(ligne.date).getTime()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)
  }, [
    tachesRecentes,
    notifications,
    mouvements,
    operationsRecentes,
    peutVoirFinances,
  ])

  return (
    <>
      <PageHeader
        titre="Tableau de bord"
        sousTitre="Vue d'ensemble des données réelles enregistrées dans MongoDB"
        actions={<Badge ton="brand">Version 1.0.0</Badge>}
      />

      <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="font-semibold text-slate-700">
          Données réelles — MongoDB
        </span>
        <span>
          Période des indicateurs financiers et des mouvements :{' '}
          {formaterPeriode(periode)}
        </span>
        <span>Les effectifs reflètent l'état actuel de la base, sans période.</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titre="Animaux suivis"
          valeur={valeurAffichee(statsAnimaux.total, chargement)}
          icone={PawPrint}
          complement={
            chargement
              ? 'Chargement...'
              : erreurs.animaux
                ? 'Données indisponibles'
                : 'État actuel de la base'
          }
        />
        <StatCard
          titre="Parcelles cultivées"
          valeur={valeurAffichee(statsParcelles.cultivees, chargement)}
          icone={Sprout}
          complement={
            chargement
              ? 'Chargement...'
              : erreurs.parcelles
                ? 'Données indisponibles'
                : 'État actuel — sans période'
          }
        />
        <StatCard
          titre="Stocks à surveiller"
          valeur={
            chargement || erreurs.alertes
              ? '—'
              : String(totalAlertes)
          }
          icone={Boxes}
          positive={totalAlertes === 0}
          complement={
            chargement
              ? 'Chargement...'
              : erreurs.alertes
                ? 'Données indisponibles'
                : totalAlertes > 0
                  ? complementAlertes
                  : 'Aucune alerte active'
          }
        />
        <StatCard
          titre={peutVoirFinances ? 'Tâches en cours' : 'Mes tâches en cours'}
          valeur={valeurAffichee(statsTaches.enCours, chargement)}
          icone={ClipboardList}
          complement={
            chargement
              ? 'Chargement...'
              : erreurs.taches
                ? 'Données indisponibles'
                : `${valeurAffichee(statsTaches.enRetard, false)} en retard`
          }
        />
      </div>

      {peutVoirFinances && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Finances — données réelles · {periodeFinanciere}
          </p>
          {chargement ? (
            <MessageCarte chargement>
              Chargement des données financières...
            </MessageCarte>
          ) : erreurs.finances ? (
            <MessageCarte>
              Statistiques financières indisponibles pour le moment.
            </MessageCarte>
          ) : revenusFinanciers === undefined && depensesFinancieres === undefined ? (
            <MessageCarte>
              Aucune donnée financière disponible sur cette période.
            </MessageCarte>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                titre="Revenus (période)"
                valeur={formatMontantTND(revenusFinanciers)}
                icone={ArrowUpRight}
              />
              <StatCard
                titre="Dépenses (période)"
                valeur={formatMontantTND(depensesFinancieres)}
                icone={ArrowDownRight}
              />
              <StatCard
                titre="Bénéfice (période)"
                valeur={formatMontantTND(beneficeFinancier)}
                icone={Wallet}
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!peutVoirFinances ? (
            <MessageCarte>
              Évolution financière réservée à l'encadrement.
            </MessageCarte>
          ) : chargement ? (
            <MessageCarte chargement>
              Chargement de l'évolution financière...
            </MessageCarte>
          ) : erreurs.finances ? (
            <MessageCarte>
              Évolution financière indisponible pour le moment.
            </MessageCarte>
          ) : (
            <GraphiqueRapport
              titre="Évolution des dépenses mensuelles"
              sousTitre={`Données réelles · ${periodeFinanciere}`}
              type="bar"
              donnees={evolutionDonnees}
              cleLibelle="libelle"
              cleValeur="valeur"
              nomSerie="Dépenses (TND)"
              formatterValeur={formatMontantTND}
            />
          )}
        </div>

        <div>
          {!peutVoirFinances ? (
            <MessageCarte>
              Répartition financière réservée à l'encadrement.
            </MessageCarte>
          ) : chargement ? (
            <MessageCarte chargement>
              Chargement de la répartition des dépenses...
            </MessageCarte>
          ) : erreurs.finances ? (
            <MessageCarte>
              Répartition indisponible pour le moment.
            </MessageCarte>
          ) : (
            <GraphiqueRapport
              titre="Dépenses par catégorie"
              sousTitre={`Répartition réelle · ${periodeFinanciere}`}
              type="pie"
              donnees={depensesParCategorie}
              cleLibelle="libelle"
              cleValeur="valeur"
              formatterValeur={formatMontantTND}
            />
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          {chargement ? (
            <MessageCarte chargement>Chargement du cheptel...</MessageCarte>
          ) : erreurs.animauxListe ? (
            <MessageCarte>Effectifs animaux indisponibles.</MessageCarte>
          ) : animaux.length === 0 ? (
            <EtatVide
              titre="Aucun animal enregistré"
              message="La collection animals ne contient aucun document. Aucun graphique n'est affiché."
            />
          ) : (
            <GraphiqueRapport
              titre="Cheptel par espèce"
              sousTitre="Effectifs réels — état actuel de la base"
              type="bar"
              donnees={cheptelParEspece}
              cleLibelle="libelle"
              cleValeur="valeur"
              nomSerie="Animaux"
            />
          )}
        </div>

        <div className="lg:col-span-2">
          {chargement ? (
            <MessageCarte chargement>
              Chargement des activités récentes...
            </MessageCarte>
          ) : activites.length === 0 ? (
            <EtatVide
              titre="Aucune activité récente enregistrée"
              message="Aucune tâche, notification, mouvement de stock ou opération financière accessible n'est enregistré."
            />
          ) : (
            <Card>
              <CardHeader
                titre="Activités récentes"
                sousTitre="Enregistrements réels, triés par date décroissante"
                action={<Activity className="h-5 w-5 text-slate-400" />}
              />
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Activité</th>
                        <th className="px-5 py-3 font-semibold">Catégorie</th>
                        <th className="px-5 py-3 font-semibold">Date</th>
                        <th className="px-5 py-3 font-semibold">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activites.map((activite) => (
                        <tr key={activite.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3 font-medium text-slate-800">
                            {activite.titre}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {activite.categorie}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {formatDate(activite.date)}
                          </td>
                          <td className="px-5 py-3">
                            <Badge ton={activite.ton}>{activite.statut}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
