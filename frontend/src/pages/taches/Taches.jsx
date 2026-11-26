import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Info,
  ListTodo,
  Loader2,
  Plus,
  RotateCcw,
} from 'lucide-react'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import FiltresTaches from '../../components/taches/FiltresTaches'
import TacheDetails from '../../components/taches/TacheDetails'
import TacheForm from '../../components/taches/TacheForm'
import TacheTable from '../../components/taches/TacheTable'
import { useAuth } from '../../hooks/useAuth'
import { listAnimals } from '../../services/animalService'
import { listCycles } from '../../services/cycleService'
import { listParcelles } from '../../services/parcelleService'
import { listEmployes } from '../../services/employeService'
import {
  annulerTache,
  changerStatutTache,
  createTache,
  deleteTache,
  getHistoriqueTache,
  getStatistiquesTaches,
  listTaches,
  updateTache,
} from '../../services/tacheService'
import {
  LIBELLES_ACTION_TACHE,
  STATUTS_TACHE,
  formatDateHeure,
  formatNombre,
} from '../../utils/taches'

const resultatVide = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
}

const statistiquesVides = {
  total: 0,
  enCours: 0,
  aFaire: 0,
  terminees: 0,
  annulees: 0,
  enRetard: 0,
  parStatut: {},
}

const STATUTS_RAPIDES = ['À faire', 'En cours', 'Terminée']

function messageErreur(erreur, fallback) {
  return erreur.response?.data?.message ?? fallback
}

function Onglet({ actif, label, count, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={actif}
      onClick={onClick}
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

export default function Taches() {
  const { hasRole } = useAuth()
  const peutEcrire = hasRole('ADMIN', 'MANAGER')
  const estEmploye = hasRole('EMPLOYEE')

  const [onglet, setOnglet] = useState('planning')

  const [recherche, setRecherche] = useState('')
  const [rechercheActive, setRechercheActive] = useState('')
  const [statut, setStatut] = useState('')
  const [priorite, setPriorite] = useState('')
  const [employe, setEmploye] = useState('')
  const [moduleCible, setModuleCible] = useState('')
  const [debut, setDebut] = useState('')
  const [fin, setFin] = useState('')
  const [enRetard, setEnRetard] = useState('')
  const [page, setPage] = useState(1)

  const [resultat, setResultat] = useState(resultatVide)
  const [resultatRetard, setResultatRetard] = useState(resultatVide)
  const [statistiques, setStatistiques] = useState(statistiquesVides)
  const [employes, setEmployes] = useState([])
  const [animaux, setAnimaux] = useState([])
  const [cycles, setCycles] = useState([])
  const [parcelles, setParcelles] = useState([])

  const [tacheHistorique, setTacheHistorique] = useState('')
  const [historique, setHistorique] = useState(null)
  const [chargementHistorique, setChargementHistorique] = useState(false)

  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [notification, setNotification] = useState(null)
  const [modale, setModale] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreurFormulaire, setErreurFormulaire] = useState('')
  const [statutRapide, setStatutRapide] = useState('En cours')
  const [motifAnnulation, setMotifAnnulation] = useState('')

  useEffect(() => {
    const minuteur = setTimeout(() => setRechercheActive(recherche), 300)
    return () => clearTimeout(minuteur)
  }, [recherche])

  useEffect(() => {
    setPage(1)
  }, [rechercheActive, statut, priorite, employe, moduleCible, debut, fin, enRetard])

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')

    const filtres = { page, limit: 20 }
    if (rechercheActive) filtres.recherche = rechercheActive
    if (statut) filtres.statut = statut
    if (priorite) filtres.priorite = priorite
    if (employe) filtres.employe = employe
    if (moduleCible) filtres.module = moduleCible
    if (debut) filtres.debut = new Date(`${debut}T00:00:00`).toISOString()
    if (fin) filtres.fin = new Date(`${fin}T23:59:59`).toISOString()
    if (enRetard) filtres.enRetard = enRetard

    try {
      const taches = [
        listTaches(filtres),
        listTaches({ enRetard: 'true', limit: 100 }),
        getStatistiquesTaches(),
      ]
      if (peutEcrire) {
        taches.push(
          listEmployes({ statut: 'Actif', limit: 100 }),
          listAnimals(),
          listCycles(),
          listParcelles()
        )
      }
      const resultats = await Promise.all(taches)
      setResultat(resultats[0])
      setResultatRetard(resultats[1])
      setStatistiques(resultats[2])
      if (peutEcrire) {
        setEmployes(resultats[3].items ?? [])
        setAnimaux(resultats[4] ?? [])
        setCycles(resultats[5] ?? [])
        setParcelles(resultats[6] ?? [])
      }
    } catch (e) {
      setErreur(
        messageErreur(e, 'Impossible de charger les tâches depuis le serveur.')
      )
    } finally {
      setChargement(false)
    }
  }, [
    page,
    rechercheActive,
    statut,
    priorite,
    employe,
    moduleCible,
    debut,
    fin,
    enRetard,
    peutEcrire,
  ])

  useEffect(() => {
    charger()
  }, [charger])

  useEffect(() => {
    if (!notification) return undefined
    const minuteur = setTimeout(() => setNotification(null), 5000)
    return () => clearTimeout(minuteur)
  }, [notification])

  useEffect(() => {
    if (!modale?.type?.startsWith('form')) setErreurFormulaire('')
  }, [modale?.type])

  const chargerHistorique = useCallback(async (id) => {
    if (!id) {
      setHistorique(null)
      return
    }
    setChargementHistorique(true)
    try {
      setHistorique(await getHistoriqueTache(id))
    } catch (e) {
      setNotification({
        ton: 'error',
        message: messageErreur(e, "Impossible de charger l'historique de la tâche."),
      })
    } finally {
      setChargementHistorique(false)
    }
  }, [])

  useEffect(() => {
    chargerHistorique(tacheHistorique)
  }, [tacheHistorique, chargerHistorique, resultat.pagination?.total])

  const voirHistorique = (tache) => {
    if (!tache?.id) return
    setTacheHistorique(tache.id)
    setHistorique(null)
    setOnglet('historique')
  }

  const reinitialiser = () => {
    setRecherche('')
    setStatut('')
    setPriorite('')
    setEmploye('')
    setModuleCible('')
    setDebut('')
    setFin('')
    setEnRetard('')
  }

  const enregistrer = async (donnees) => {
    setEnvoi(true)
    setErreurFormulaire('')
    const estModification = Boolean(modale?.element)
    try {
      if (estModification) {
        await updateTache(modale.element.id, donnees)
      } else {
        await createTache(donnees)
      }
      setModale(null)
      setNotification({
        ton: 'success',
        message: estModification
          ? 'Tâche mise à jour avec succès.'
          : 'Tâche créée avec succès.',
      })
      await charger()
    } catch (e) {
      setErreurFormulaire(messageErreur(e, "Impossible d'enregistrer la tâche."))
    } finally {
      setEnvoi(false)
    }
  }

  const ouvrirChangementStatut = (tache) => {
    setStatutRapide(
      STATUTS_RAPIDES.includes(tache.statut) ? tache.statut : 'À faire'
    )
    setModale({ type: 'statut', element: tache })
  }

  const confirmerChangementStatut = async () => {
    setEnvoi(true)
    const tache = modale?.element
    try {
      await changerStatutTache(tache.id, { statut: statutRapide })
      setModale(null)
      setNotification({
        ton: 'success',
        message: `Statut mis à jour : ${statutRapide}.`,
      })
      await charger()
    } catch (e) {
      setModale(null)
      setNotification({
        ton: 'error',
        message: messageErreur(e, 'Impossible de changer le statut de la tâche.'),
      })
    } finally {
      setEnvoi(false)
    }
  }

  const confirmerAnnulation = async () => {
    setEnvoi(true)
    const tache = modale?.element
    try {
      await annulerTache(tache.id, { motifAnnulation })
      setModale(null)
      setMotifAnnulation('')
      setNotification({ ton: 'success', message: 'Tâche annulée avec succès.' })
      await charger()
    } catch (e) {
      setErreurFormulaire(
        messageErreur(e, 'Impossible d’annuler la tâche.')
      )
    } finally {
      setEnvoi(false)
    }
  }

  const confirmerSuppression = async () => {
    setEnvoi(true)
    const tache = modale?.element
    try {
      await deleteTache(tache.id)
      setModale(null)
      setNotification({ ton: 'success', message: 'Tâche supprimée avec succès.' })
      await charger()
    } catch (e) {
      setModale(null)
      setNotification({
        ton: 'error',
        message: messageErreur(e, 'Impossible de supprimer la tâche.'),
      })
    } finally {
      setEnvoi(false)
    }
  }

  const filtresActifs = Boolean(
    recherche ||
      statut ||
      priorite ||
      employe ||
      moduleCible ||
      debut ||
      fin ||
      enRetard
  )
  const optionsHistorique = [...resultat.items, ...resultatRetard.items].filter(
    (tache, index, liste) =>
      liste.findIndex((element) => element.id === tache.id) === index
  )

  return (
    <>
      <PageHeader
        titre="Tâches agricoles"
        sousTitre="Planning, affectations, retards et historique — données réelles MongoDB"
        actions={
          peutEcrire && (
            <Button onClick={() => setModale({ type: 'form', element: null })}>
              <Plus className="h-4 w-4" />
              Nouvelle tâche
            </Button>
          )
        }
      />

      {estEmploye && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Vous consultez uniquement les tâches auxquelles vous êtes affecté. La
          création et la modification sont réservées aux administrateurs et
          gestionnaires.
        </div>
      )}

      {notification && (
        <div
          role="status"
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            notification.ton === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {notification.message}
        </div>
      )}

      {erreur && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{erreur}</span>
          <Button variante="outline" taille="sm" onClick={charger}>
            <RotateCcw className="h-4 w-4" />
            Réessayer
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          titre="Total des tâches"
          valeur={formatNombre(statistiques.total)}
          icone={ListTodo}
        />
        <StatCard
          titre="À faire"
          valeur={formatNombre(statistiques.aFaire)}
          icone={ClipboardList}
        />
        <StatCard
          titre="En cours"
          valeur={formatNombre(statistiques.enCours)}
          icone={Clock3}
        />
        <StatCard
          titre="Terminées"
          valeur={formatNombre(statistiques.terminees)}
          icone={CheckCircle2}
        />
        <StatCard
          titre="En retard"
          valeur={formatNombre(statistiques.enRetard)}
          icone={AlertTriangle}
        />
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-3 pt-3 sm:px-5">
          <Onglet
            actif={onglet === 'planning'}
            label="Planning"
            count={resultat.pagination?.total ?? 0}
            onClick={() => setOnglet('planning')}
          />
          <Onglet
            actif={onglet === 'retard'}
            label="En retard"
            count={resultatRetard.pagination?.total ?? 0}
            onClick={() => setOnglet('retard')}
          />
          <Onglet
            actif={onglet === 'historique'}
            label="Historique"
            count={historique?.journal?.length ?? 0}
            onClick={() => setOnglet('historique')}
          />
        </div>
      </Card>

      {(onglet === 'planning' || onglet === 'retard') && (
        <Card className="mt-4 p-4 sm:p-5">
          {onglet === 'planning' ? (
            <FiltresTaches
              recherche={recherche}
              onRecherche={setRecherche}
              statut={statut}
              onStatut={setStatut}
              priorite={priorite}
              onPriorite={setPriorite}
              employe={employe}
              onEmploye={setEmploye}
              moduleCible={moduleCible}
              onModuleCible={setModuleCible}
              debut={debut}
              onDebut={setDebut}
              fin={fin}
              onFin={setFin}
              enRetard={enRetard}
              onEnRetard={setEnRetard}
              onReinitialiser={reinitialiser}
              filtresActifs={filtresActifs}
              employes={employes}
            />
          ) : (
            <p className="text-sm text-slate-600">
              Tâches non terminées dont la date d'échéance est dépassée. Le
              retard est calculé à la lecture, sans modification des données.
            </p>
          )}
        </Card>
      )}

      {onglet === 'planning' && (
        <div className="mt-6">
          <TacheTable
            resultat={resultat}
            chargement={chargement}
            filtresActifs={filtresActifs}
            peutEcrire={peutEcrire}
            onVoir={(tache) => setModale({ type: 'details', element: tache })}
            onModifier={(tache) => setModale({ type: 'form', element: tache })}
            onChangerStatut={ouvrirChangementStatut}
            onAnnuler={(tache) => {
              setMotifAnnulation('')
              setErreurFormulaire('')
              setModale({ type: 'annuler', element: tache })
            }}
            onSupprimer={(tache) => setModale({ type: 'delete', element: tache })}
            onPage={setPage}
          />
        </div>
      )}

      {onglet === 'retard' && (
        <div className="mt-6">
          <TacheTable
            resultat={resultatRetard}
            chargement={chargement}
            filtresActifs={false}
            peutEcrire={peutEcrire}
            onVoir={(tache) => setModale({ type: 'details', element: tache })}
            onModifier={(tache) => setModale({ type: 'form', element: tache })}
            onChangerStatut={ouvrirChangementStatut}
            onAnnuler={(tache) => {
              setMotifAnnulation('')
              setErreurFormulaire('')
              setModale({ type: 'annuler', element: tache })
            }}
            onSupprimer={(tache) => setModale({ type: 'delete', element: tache })}
            onPage={setPage}
          />
        </div>
      )}

      {onglet === 'historique' && (
        <Card className="mt-4 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Historique d'une tâche
              </label>
              <select
                value={tacheHistorique}
                onChange={(e) => setTacheHistorique(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Choisir une tâche</option>
                {optionsHistorique.map((tache) => (
                  <option key={tache.id} value={tache.id}>
                    {tache.titre} — {tache.reference?.slice(0, 10)}
                  </option>
                ))}
              </select>
            </div>
            {historique && (
              <div className="flex items-end">
                <p className="text-xs text-slate-500">
                  {formatNombre(historique.journal?.length)} changement(s) —{' '}
                  <span className="font-mono">{historique.reference?.slice(0, 12)}</span>
                </p>
              </div>
            )}
          </div>

          {chargementHistorique && (
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Chargement de l'historique...
            </p>
          )}

          {!chargementHistorique && historique && (
            <div className="mt-4 space-y-2">
              {(historique.journal ?? []).length === 0 ? (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Aucun changement enregistré pour cette tâche.
                </p>
              ) : (
                historique.journal.map((entree) => (
                  <div
                    key={entree.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge ton="brand">
                        {LIBELLES_ACTION_TACHE[entree.action] ?? entree.action}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {formatDateHeure(entree.date)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      {entree.detail || '—'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Par {entree.utilisateur?.name || 'utilisateur inconnu'}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      )}

      <TacheForm
        ouvert={modale?.type === 'form'}
        tache={modale?.element ?? null}
        employes={employes}
        animaux={animaux}
        cycles={cycles}
        parcelles={parcelles}
        onFermer={() => setModale(null)}
        onSoumettre={enregistrer}
        envoi={envoi}
        erreur={erreurFormulaire}
      />

      <TacheDetails
        ouvert={modale?.type === 'details'}
        tache={modale?.element}
        onFermer={() => setModale(null)}
        onHistorique={voirHistorique}
      />

      <Modal
        ouvert={modale?.type === 'statut'}
        titre="Changer le statut de la tâche"
        sousTitre={modale?.element?.titre}
        onFermer={() => setModale(null)}
        largeur="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Nouveau statut
            </label>
            <select
              value={statutRapide}
              onChange={(e) => setStatutRapide(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {STATUTS_RAPIDES.map((element) => (
                <option key={element} value={element}>
                  {element}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500">
            Pour annuler une tâche, utilisez le bouton « Annuler la tâche » afin
            de renseigner le motif obligatoire.
          </p>
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <Button variante="outline" onClick={() => setModale(null)} disabled={envoi}>
              Annuler
            </Button>
            <Button onClick={confirmerChangementStatut} disabled={envoi}>
              {envoi ? 'Mise à jour...' : 'Enregistrer le statut'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        ouvert={modale?.type === 'annuler'}
        titre="Annuler la tâche"
        sousTitre={modale?.element?.titre}
        onFermer={() => setModale(null)}
        largeur="max-w-md"
      >
        <div className="space-y-4">
          {erreurFormulaire && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {erreurFormulaire}
            </div>
          )}
          <Input
            label="Motif d'annulation"
            value={motifAnnulation}
            onChange={(e) => setMotifAnnulation(e.target.value)}
            placeholder="Ex. Intervention reportée"
            maxLength={500}
            required
          />
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <Button variante="outline" onClick={() => setModale(null)} disabled={envoi}>
              Retour
            </Button>
            <Button
              variante="danger"
              onClick={confirmerAnnulation}
              disabled={envoi || !motifAnnulation.trim()}
            >
              {envoi ? 'Annulation...' : 'Confirmer l’annulation'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        ouvert={modale?.type === 'delete'}
        titre="Supprimer la tâche"
        message="La tâche et son historique seront définitivement supprimés de MongoDB."
        nomElement={modale?.element?.titre ?? ''}
        envoi={envoi}
        onAnnuler={() => setModale(null)}
        onConfirmer={confirmerSuppression}
      />
    </>
  )
}
