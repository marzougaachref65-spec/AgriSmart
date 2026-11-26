import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import EmployeDetails from '../../components/employes/EmployeDetails'
import EmployeForm from '../../components/employes/EmployeForm'
import EmployeTable from '../../components/employes/EmployeTable'
import { useAuth } from '../../hooks/useAuth'
import {
  createEmploye,
  desactiverEmploye,
  getHistoriqueEmployes,
  getStatistiquesEmployes,
  listComptesDisponibles,
  listEmployes,
  reactiverEmploye,
  updateEmploye,
} from '../../services/employeService'
import {
  LIBELLES_ACTION_EMPLOYE,
  formatDateHeure,
  formatNombre,
  nomComplet,
} from '../../utils/employes'

const resultatVide = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
}

const statistiquesVides = { total: 0, actifs: 0, inactifs: 0 }
const historiqueVide = { items: [], total: 0, employes: [] }
const filtresHistoriqueVides = { employe: '', action: '', debut: '', fin: '' }

const TONS_ACTION_EMPLOYE = {
  CREATION: 'success',
  MODIFICATION: 'brand',
  CHANGEMENT_STATUT: 'warning',
  AFFECTATION_COMPTE: 'info',
}

function messageErreur(erreur, fallback) {
  return erreur.response?.data?.message ?? fallback
}

function SelectFiltre({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const valeur = typeof option === 'string' ? option : option.value
          const libelle = typeof option === 'string' ? option : option.label
          return (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          )
        })}
      </select>
    </div>
  )
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

function LigneHistorique({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-2.5 sm:flex-row sm:justify-between sm:gap-6">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="break-words text-sm text-slate-800">{children || '—'}</span>
    </div>
  )
}

export default function Employes() {
  const { hasRole } = useAuth()
  const peutEcrire = hasRole('ADMIN', 'MANAGER')
  const peutVoirSalaire = peutEcrire

  const [onglet, setOnglet] = useState('employes')
  const [recherche, setRecherche] = useState('')
  const [rechercheActive, setRechercheActive] = useState('')
  const [statut, setStatut] = useState('Actif')
  const [page, setPage] = useState(1)

  const [resultat, setResultat] = useState(resultatVide)
  const [statistiques, setStatistiques] = useState(statistiquesVides)
  const [comptes, setComptes] = useState([])

  const [filtresHistorique, setFiltresHistorique] = useState(filtresHistoriqueVides)
  const [historique, setHistorique] = useState(historiqueVide)
  const [chargementHistorique, setChargementHistorique] = useState(false)
  const [entreeDetails, setEntreeDetails] = useState(null)

  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [notification, setNotification] = useState(null)
  const [modale, setModale] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreurFormulaire, setErreurFormulaire] = useState('')

  useEffect(() => {
    const minuteur = setTimeout(() => setRechercheActive(recherche), 300)
    return () => clearTimeout(minuteur)
  }, [recherche])

  useEffect(() => {
    setPage(1)
  }, [rechercheActive, onglet])

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')
    const filtres = { page, limit: 20, statut }
    if (rechercheActive) filtres.recherche = rechercheActive

    try {
      const [liste, stats, comptesDisponibles] = await Promise.all([
        listEmployes(filtres),
        getStatistiquesEmployes(),
        peutEcrire ? listComptesDisponibles() : Promise.resolve([]),
      ])
      setResultat(liste)
      setStatistiques(stats)
      setComptes(comptesDisponibles)
    } catch (e) {
      setErreur(
        messageErreur(e, 'Impossible de charger les employés depuis le serveur.')
      )
    } finally {
      setChargement(false)
    }
  }, [page, rechercheActive, statut, peutEcrire])

  useEffect(() => {
    if (onglet !== 'historique') charger()
  }, [charger, onglet])

  useEffect(() => {
    if (!notification) return undefined
    const minuteur = setTimeout(() => setNotification(null), 5000)
    return () => clearTimeout(minuteur)
  }, [notification])

  useEffect(() => {
    if (!modale?.type?.startsWith('form')) setErreurFormulaire('')
  }, [modale?.type])

  const chargerHistorique = useCallback(async () => {
    setChargementHistorique(true)
    const filtres = {}
    for (const [cle, valeur] of Object.entries(filtresHistorique)) {
      if (!valeur) continue
      if (cle === 'debut') {
        filtres.debut = new Date(`${valeur}T00:00:00`).toISOString()
      } else if (cle === 'fin') {
        filtres.fin = new Date(`${valeur}T23:59:59.999`).toISOString()
      } else {
        filtres[cle] = valeur
      }
    }
    try {
      setHistorique(await getHistoriqueEmployes(filtres))
    } catch (e) {
      setNotification({
        ton: 'error',
        message: messageErreur(
          e,
          "Impossible de charger l'historique des employés."
        ),
      })
    } finally {
      setChargementHistorique(false)
    }
  }, [filtresHistorique])

  useEffect(() => {
    if (onglet === 'historique') chargerHistorique()
  }, [onglet, chargerHistorique])

  const ouvrirOnglet = (nouvelOnglet) => {
    if (nouvelOnglet === 'employes') setStatut('Actif')
    if (nouvelOnglet === 'inactifs') setStatut('Inactif')
    setOnglet(nouvelOnglet)
  }

  const voirHistorique = (employe) => {
    if (!employe?.id) return
    setFiltresHistorique({ ...filtresHistoriqueVides, employe: employe.id })
    setOnglet('historique')
  }

  const reinitialiser = () => setRecherche('')

  const modifierFiltreHistorique = (cle) => (evenement) => {
    setFiltresHistorique((etat) => ({
      ...etat,
      [cle]: evenement.target.value,
    }))
  }

  const enregistrer = async (donnees) => {
    setEnvoi(true)
    setErreurFormulaire('')
    const estModification = Boolean(modale?.element)
    try {
      if (estModification) {
        await updateEmploye(modale.element.id, donnees)
      } else {
        await createEmploye(donnees)
      }
      setModale(null)
      setNotification({
        ton: 'success',
        message: estModification
          ? 'Fiche employé mise à jour avec succès.'
          : 'Employé ajouté avec succès.',
      })
      await charger()
    } catch (e) {
      setErreurFormulaire(
        messageErreur(e, "Impossible d'enregistrer la fiche employé.")
      )
    } finally {
      setEnvoi(false)
    }
  }

  const confirmerDesactivation = async () => {
    setEnvoi(true)
    const employe = modale?.element
    try {
      await desactiverEmploye(employe.id)
      setModale(null)
      setNotification({
        ton: 'success',
        message: `${nomComplet(employe)} a été désactivé. Son historique est conservé.`,
      })
      await charger()
    } catch (e) {
      setModale(null)
      setNotification({
        ton: 'error',
        message: messageErreur(e, "Impossible de désactiver l'employé."),
      })
    } finally {
      setEnvoi(false)
    }
  }

  const confirmerReactivation = async () => {
    setEnvoi(true)
    const employe = modale?.element
    try {
      await reactiverEmploye(employe.id)
      setModale(null)
      setNotification({
        ton: 'success',
        message: `${nomComplet(employe)} a été réactivé. Il peut de nouveau être affecté à des tâches.`,
      })
      await charger()
    } catch (e) {
      setModale(null)
      setNotification({
        ton: 'error',
        message: messageErreur(e, "Impossible de réactiver l'employé."),
      })
    } finally {
      setEnvoi(false)
    }
  }

  const filtresActifs = Boolean(recherche)
  const optionsEmployes = (historique.employes ?? []).map((employe) => ({
    value: employe.id,
    label: nomComplet(employe),
  }))
  const optionsActions = Object.keys(LIBELLES_ACTION_EMPLOYE).map((action) => ({
    value: action,
    label: LIBELLES_ACTION_EMPLOYE[action],
  }))
  const estInactif = onglet === 'inactifs'

  return (
    <>
      <PageHeader
        titre="Gestion des employés"
        sousTitre="Fiches du personnel, statuts et historique des changements — données réelles MongoDB"
        actions={
          peutEcrire && (
            <Button onClick={() => setModale({ type: 'form', element: null })}>
              <Plus className="h-4 w-4" />
              Ajouter un employé
            </Button>
          )
        }
      />

      {!peutEcrire && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Votre rôle n'autorise pas la gestion des fiches employés. Ce module est
          réservé aux administrateurs et gestionnaires.
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

      {erreur && onglet !== 'historique' && (
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          titre="Employés enregistrés"
          valeur={formatNombre(statistiques.total)}
          icone={Users}
        />
        <StatCard
          titre="Employés actifs"
          valeur={formatNombre(statistiques.actifs)}
          icone={UserCheck}
        />
        <StatCard
          titre="Employés inactifs"
          valeur={formatNombre(statistiques.inactifs)}
          icone={UserX}
        />
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-3 pt-3 sm:px-5">
          <Onglet
            actif={onglet === 'employes'}
            label="Employés"
            count={statistiques.actifs}
            onClick={() => ouvrirOnglet('employes')}
          />
          <Onglet
            actif={estInactif}
            label="Inactifs"
            count={statistiques.inactifs}
            onClick={() => ouvrirOnglet('inactifs')}
          />
          <Onglet
            actif={onglet === 'historique'}
            label="Historique"
            count={historique.total}
            onClick={() => ouvrirOnglet('historique')}
          />
        </div>
      </Card>

      {(onglet === 'employes' || estInactif) && (
        <>
          <Card className="mt-4 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Rechercher"
                icon={Search}
                placeholder="Nom ou prénom..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
              <div className="flex items-end">
                <Button
                  variante="outline"
                  onClick={reinitialiser}
                  disabled={!filtresActifs}
                >
                  <RotateCcw className="h-4 w-4" />
                  Réinitialiser
                </Button>
              </div>
            </div>
          </Card>

          <div className="mt-6">
            <EmployeTable
              employes={resultat.items}
              chargement={chargement}
              filtresActifs={filtresActifs}
              peutEcrire={peutEcrire}
              peutVoirSalaire={peutVoirSalaire}
              inactifs={estInactif}
              onVoir={(employe) => setModale({ type: 'details', element: employe })}
              onModifier={(employe) => setModale({ type: 'form', element: employe })}
              onDesactiver={(employe) =>
                setModale({ type: 'desactiver', element: employe })
              }
              onReactiver={(employe) =>
                setModale({ type: 'reactiver', element: employe })
              }
              onHistorique={voirHistorique}
            />
            {!chargement && resultat.pagination?.pages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button
                  variante="outline"
                  taille="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Précédent
                </Button>
                <span className="text-xs text-slate-500">
                  Page {page} / {resultat.pagination.pages}
                </span>
                <Button
                  variante="outline"
                  taille="sm"
                  disabled={page >= resultat.pagination.pages}
                  onClick={() => setPage(page + 1)}
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {onglet === 'historique' && (
        <Card className="mt-4 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectFiltre
              label="Employé"
              value={filtresHistorique.employe}
              onChange={modifierFiltreHistorique('employe')}
              options={optionsEmployes}
              placeholder="Tous les employés"
            />
            <SelectFiltre
              label="Type d'action"
              value={filtresHistorique.action}
              onChange={modifierFiltreHistorique('action')}
              options={optionsActions}
              placeholder="Toutes les actions"
            />
            <Input
              label="Du"
              type="date"
              value={filtresHistorique.debut}
              onChange={modifierFiltreHistorique('debut')}
            />
            <Input
              label="Au"
              type="date"
              value={filtresHistorique.fin}
              onChange={modifierFiltreHistorique('fin')}
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {formatNombre(historique.total)} événement(s) enregistré(s)
            </p>
            <Button
              variante="outline"
              taille="sm"
              onClick={() => setFiltresHistorique(filtresHistoriqueVides)}
              disabled={Object.values(filtresHistorique).every((valeur) => !valeur)}
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser les filtres
            </Button>
          </div>

          {chargementHistorique && (
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Chargement de l'historique...
            </p>
          )}

          {!chargementHistorique && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Employé</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold">Date et heure</th>
                    <th className="px-4 py-3 font-semibold">Auteur</th>
                    <th className="px-4 py-3 text-right font-semibold">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(historique.items ?? []).map((entree) => (
                    <tr key={entree.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {nomComplet(entree.employe)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge ton={TONS_ACTION_EMPLOYE[entree.action] ?? 'neutral'}>
                          {LIBELLES_ACTION_EMPLOYE[entree.action] ?? entree.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {entree.detail || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDateHeure(entree.date)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {entree.utilisateur?.name || 'Utilisateur inconnu'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          title="Voir le détail de l'événement"
                          aria-label={`Détail de l'événement ${entree.id}`}
                          onClick={() => setEntreeDetails(entree)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(historique.items ?? []).length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-14 text-center text-sm text-slate-500"
                      >
                        <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                        Aucun événement ne correspond aux filtres.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <EmployeForm
        ouvert={modale?.type === 'form'}
        employe={modale?.element ?? null}
        comptes={comptes}
        onFermer={() => setModale(null)}
        onSoumettre={enregistrer}
        envoi={envoi}
        erreur={erreurFormulaire}
      />

      <EmployeDetails
        ouvert={modale?.type === 'details'}
        employe={modale?.element}
        peutVoirSalaire={peutVoirSalaire}
        onFermer={() => setModale(null)}
        onHistorique={voirHistorique}
      />

      <ConfirmDialog
        ouvert={modale?.type === 'desactiver'}
        titre="Désactiver l'employé"
        message="L'employé sera désactivé : ses fiches et son historique restent conservés. Il ne pourra plus être affecté à de nouvelles tâches."
        nomElement={modale?.element ? nomComplet(modale.element) : ''}
        note="Vous pourrez réactiver cet employé depuis la liste des employés inactifs."
        labelConfirmer="Désactiver l'employé"
        labelEnvoi="Désactivation..."
        envoi={envoi}
        onAnnuler={() => setModale(null)}
        onConfirmer={confirmerDesactivation}
      />

      <ConfirmDialog
        ouvert={modale?.type === 'reactiver'}
        titre="Réactiver l'employé"
        message="L'employé sera réactivé et pourra de nouveau être affecté à des tâches. Sa fiche et son historique sont conservés."
        nomElement={modale?.element ? nomComplet(modale.element) : ''}
        note="Cette action ajoute une entrée à l'historique de l'employé."
        labelConfirmer="Réactiver l'employé"
        labelEnvoi="Réactivation..."
        envoi={envoi}
        onAnnuler={() => setModale(null)}
        onConfirmer={confirmerReactivation}
      />

      <Modal
        ouvert={Boolean(entreeDetails)}
        titre="Détail de l'événement"
        sousTitre={
          entreeDetails ? nomComplet(entreeDetails.employe) : ''
        }
        onFermer={() => setEntreeDetails(null)}
      >
        <LigneHistorique label="Employé">
          {nomComplet(entreeDetails?.employe)}
        </LigneHistorique>
        <LigneHistorique label="Action">
          {LIBELLES_ACTION_EMPLOYE[entreeDetails?.action] ?? entreeDetails?.action}
        </LigneHistorique>
        <LigneHistorique label="Description">
          {entreeDetails?.detail}
        </LigneHistorique>
        <LigneHistorique label="Date et heure">
          {formatDateHeure(entreeDetails?.date)}
        </LigneHistorique>
        <LigneHistorique label="Auteur">
          {entreeDetails?.utilisateur?.name || 'Utilisateur inconnu'}
        </LigneHistorique>
      </Modal>
    </>
  )
}
