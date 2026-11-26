import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  CheckCheck,
  Inbox,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { Card, CardHeader } from '../../components/common/Card'
import PageHeader from '../../components/common/PageHeader'
import Spinner from '../../components/common/Spinner'
import StatCard from '../../components/common/StatCard'
import FiltresNotifications from '../../components/notifications/FiltresNotifications'
import NotificationTable from '../../components/notifications/NotificationTable'
import { useNotifications } from '../../context/NotificationsContext'
import { useAuth } from '../../hooks/useAuth'
import {
  actualiserNotifications,
  listNotifications,
} from '../../services/notificationService'
import {
  datePourInput,
  LIBELLES_TYPES,
  TYPES_FINANCIERS,
} from '../../utils/notifications'

const resultatVide = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
}

function messageErreur(erreur, fallback) {
  return erreur.response?.data?.message ?? fallback
}

function Onglet({ id, label, count, actif, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={actif}
      onClick={() => onClick(id)}
      className={`rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
        actif
          ? 'border-b-2 border-brand-600 text-brand-700'
          : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      {label} ({count})
    </button>
  )
}

export default function Notifications() {
  const { hasRole } = useAuth()
  const peutActualiser = hasRole('ADMIN', 'MANAGER')
  const { statistiques, rafraichir, marquerLue, marquerToutesLues } = useNotifications()

  const [onglet, setOnglet] = useState('toutes')
  const [recherche, setRecherche] = useState('')
  const [rechercheActive, setRechercheActive] = useState('')
  const [type, setType] = useState('')
  const [niveau, setNiveau] = useState('')
  const [du, setDu] = useState('')
  const [au, setAu] = useState('')
  const [actif, setActif] = useState('')
  const [page, setPage] = useState(1)
  const [resultat, setResultat] = useState(resultatVide)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [enCours, setEnCours] = useState(null)
  const [actualisation, setActualisation] = useState(false)

  const typesDisponibles = useMemo(() => {
    if (peutActualiser) return LIBELLES_TYPES
    return Object.fromEntries(
      Object.entries(LIBELLES_TYPES).filter(([cle]) => !TYPES_FINANCIERS.includes(cle))
    )
  }, [peutActualiser])

  useEffect(() => {
    const minuteur = setTimeout(() => setRechercheActive(recherche), 300)
    return () => clearTimeout(minuteur)
  }, [recherche])

  useEffect(() => {
    setPage(1)
  }, [rechercheActive, type, niveau, du, au, actif, onglet])

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')
    const filtres = { page, limit: 20 }
    if (rechercheActive) filtres.recherche = rechercheActive
    if (type) filtres.type = type
    if (niveau) filtres.niveau = niveau
    if (actif) filtres.actif = actif
    if (onglet === 'non-lues') filtres.lue = 'false'
    if (onglet === 'lues') filtres.lue = 'true'
    if (du) filtres.du = new Date(`${du}T00:00:00`).toISOString()
    if (au) filtres.au = new Date(`${au}T23:59:59`).toISOString()

    try {
      setResultat(await listNotifications(filtres))
    } catch (e) {
      setErreur(messageErreur(e, 'Impossible de charger les notifications.'))
    } finally {
      setChargement(false)
    }
  }, [page, rechercheActive, type, niveau, actif, onglet, du, au])

  useEffect(() => {
    charger()
  }, [charger])

  const surMarquerLue = useCallback(async (id) => {
    setEnCours(id)
    setErreur('')
    setSucces('')
    try {
      await marquerLue(id, true)
      setSucces('Notification marquée comme lue.')
      await charger()
    } catch (e) {
      setErreur(messageErreur(e, 'Impossible de marquer cette notification comme lue.'))
    } finally {
      setEnCours(null)
    }
  }, [marquerLue, charger])

  const surToutMarquer = useCallback(async () => {
    setEnCours('toutes')
    setErreur('')
    setSucces('')
    try {
      const reponse = await marquerToutesLues(true)
      setSucces(`${reponse.modifiees} notification(s) marquée(s) comme lue(s).`)
      await charger()
    } catch (e) {
      setErreur(messageErreur(e, 'Impossible de marquer toutes les notifications comme lues.'))
    } finally {
      setEnCours(null)
    }
  }, [marquerToutesLues, charger])

  const surActualiser = useCallback(async () => {
    setActualisation(true)
    setErreur('')
    setSucces('')
    try {
      await actualiserNotifications()
      await Promise.all([charger(), rafraichir().catch(() => {})])
      setSucces('Les alertes ont été recalculées à partir des données réelles.')
    } catch (e) {
      setErreur(messageErreur(e, 'Impossible de recalculer les alertes.'))
    } finally {
      setActualisation(false)
    }
  }, [charger, rafraichir])

  const { pagination } = resultat

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Notifications et alertes"
        sousTitre="Suivi des tâches, rappels vétérinaires, stocks et échéances financières"
        actions={
          <>
            <Button
              variante="outline"
              onClick={charger}
              disabled={chargement}
              aria-label="Rafraîchir la liste"
            >
              <RefreshCw className={`h-4 w-4 ${chargement ? 'animate-spin' : ''}`} />
              Rafraîchir
            </Button>
            {peutActualiser && (
              <Button
                variante="outline"
                onClick={surActualiser}
                disabled={actualisation}
              >
                <RefreshCw className={`h-4 w-4 ${actualisation ? 'animate-spin' : ''}`} />
                Recalculer les alertes
              </Button>
            )}
            <Button
              variante="primary"
              onClick={surToutMarquer}
              disabled={enCours === 'toutes' || statistiques.nonLues === 0}
            >
              <CheckCheck className="h-4 w-4" />
              Tout marquer comme lu
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titre="Notifications" valeur={statistiques.total} icone={Bell}
          complement="Historique complet" />
        <StatCard titre="Non lues" valeur={statistiques.nonLues} icone={Inbox}
          complement="En attente de lecture" />
        <StatCard titre="Urgentes non lues" valeur={statistiques.urgentesNonLues} icone={ShieldAlert}
          complement="Priorité haute" />
        <StatCard titre="Alertes en cours" valeur={statistiques.actives} icone={RefreshCw}
          complement="Situations persistantes" />
      </div>

      {erreur && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erreur}
        </div>
      )}
      {succes && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {succes}
        </div>
      )}

      <Card>
        <CardHeader
          titre="Vos notifications"
          sousTitre="Seules vos notifications sont affichées — aucune génération depuis le navigateur."
          action={
            <Badge ton="brand">{pagination.total} résultat(s)</Badge>
          }
        />

        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 pt-3" role="tablist">
          <Onglet id="toutes" label="Toutes" count={statistiques.total}
            actif={onglet === 'toutes'} onClick={setOnglet} />
          <Onglet id="non-lues" label="Non lues" count={statistiques.nonLues}
            actif={onglet === 'non-lues'} onClick={setOnglet} />
          <Onglet id="lues" label="Lues" count={statistiques.lues}
            actif={onglet === 'lues'} onClick={setOnglet} />
        </div>

        <FiltresNotifications
          recherche={recherche}
          onRecherche={setRecherche}
          type={type}
          onType={setType}
          niveau={niveau}
          onNiveau={setNiveau}
          du={du}
          onDu={setDu}
          au={au}
          onAu={setAu}
          actif={actif}
          onActif={setActif}
          types={typesDisponibles}
        />

        {chargement ? (
          <div className="py-12">
            <Spinner label="Chargement des notifications..." />
          </div>
        ) : (
          <NotificationTable
            notifications={resultat.items}
            surMarquerLue={surMarquerLue}
            enCours={enCours}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-xs text-slate-500">
            Page {pagination.page} sur {Math.max(pagination.pages, 1)}
          </p>
          <div className="flex gap-2">
            <Button variante="outline" taille="sm" disabled={page <= 1 || chargement}
              onClick={() => setPage((p) => p - 1)}>
              Précédent
            </Button>
            <Button variante="outline" taille="sm" disabled={page >= pagination.pages || chargement}
              onClick={() => setPage((p) => p + 1)}>
              Suivant
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
