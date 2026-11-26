import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  Boxes,
  CalendarDays,
  Leaf,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Sprout,
} from 'lucide-react'
import CycleDetails from '../../components/cultures/CycleDetails'
import CycleForm from '../../components/cultures/CycleForm'
import CycleTable from '../../components/cultures/CycleTable'
import ParcelleDetails from '../../components/cultures/ParcelleDetails'
import ParcelleForm from '../../components/cultures/ParcelleForm'
import ParcelleTable from '../../components/cultures/ParcelleTable'
import Button from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import { useAuth } from '../../hooks/useAuth'
import {
  createParcelle,
  deleteParcelle,
  getParcellesStats,
  listParcelles,
  updateParcelle,
} from '../../services/parcelleService'
import {
  createCycle,
  deleteCycle,
  getCyclesStats,
  listCycles,
  updateCycle,
} from '../../services/cycleService'
import {
  STATUTS_CYCLE,
  STATUTS_PARCELLE,
  formatNombre,
} from '../../utils/cultures'

const statsParcellesVides = {
  total: 0,
  superficieTotale: 0,
  disponibles: 0,
  cultivees: 0,
}
const statsCyclesVides = {
  enCours: 0,
  recoltees: 0,
  quantiteTotaleRecoltee: 0,
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

export default function Cultures() {
  const { hasRole } = useAuth()
  const peutEcrire = hasRole('ADMIN', 'MANAGER')

  const [onglet, setOnglet] = useState('parcelles')

  const [rechercheParcelle, setRechercheParcelle] = useState('')
  const [rechercheParcelleActive, setRechercheParcelleActive] = useState('')
  const [statutParcelle, setStatutParcelle] = useState('')
  const [typeSol, setTypeSol] = useState('')

  const [rechercheCycle, setRechercheCycle] = useState('')
  const [rechercheCycleActive, setRechercheCycleActive] = useState('')
  const [parcelleFiltre, setParcelleFiltre] = useState('')
  const [statutCycle, setStatutCycle] = useState('')

  const [parcelles, setParcelles] = useState([])
  const [cycles, setCycles] = useState([])
  const [statsParcelles, setStatsParcelles] = useState(statsParcellesVides)
  const [statsCycles, setStatsCycles] = useState(statsCyclesVides)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [notification, setNotification] = useState(null)

  const [modale, setModale] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreurFormulaire, setErreurFormulaire] = useState('')

  useEffect(() => {
    const minuteur = setTimeout(
      () => setRechercheParcelleActive(rechercheParcelle),
      300
    )
    return () => clearTimeout(minuteur)
  }, [rechercheParcelle])

  useEffect(() => {
    const minuteur = setTimeout(() => setRechercheCycleActive(rechercheCycle), 300)
    return () => clearTimeout(minuteur)
  }, [rechercheCycle])

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')

    const filtresParcelles = {}
    if (rechercheParcelleActive) filtresParcelles.recherche = rechercheParcelleActive
    if (statutParcelle) filtresParcelles.statut = statutParcelle
    if (typeSol) filtresParcelles.typeSol = typeSol

    const filtresCycles = {}
    if (rechercheCycleActive) filtresCycles.recherche = rechercheCycleActive
    if (parcelleFiltre) filtresCycles.parcelle = parcelleFiltre
    if (statutCycle) filtresCycles.statut = statutCycle

    try {
      const [listeParcelles, statsP, listeCycles, statsC] = await Promise.all([
        listParcelles(filtresParcelles),
        getParcellesStats(),
        listCycles(filtresCycles),
        getCyclesStats(),
      ])
      setParcelles(listeParcelles)
      setStatsParcelles(statsP)
      setCycles(listeCycles)
      setStatsCycles(statsC)
    } catch (e) {
      setErreur(
        messageErreur(e, 'Impossible de charger les données depuis le serveur.')
      )
    } finally {
      setChargement(false)
    }
  }, [
    rechercheParcelleActive,
    statutParcelle,
    typeSol,
    rechercheCycleActive,
    parcelleFiltre,
    statutCycle,
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

  const reinitialiserParcelles = () => {
    setRechercheParcelle('')
    setStatutParcelle('')
    setTypeSol('')
  }

  const reinitialiserCycles = () => {
    setRechercheCycle('')
    setParcelleFiltre('')
    setStatutCycle('')
  }

  const enregistrerParcelle = async (donnees) => {
    setEnvoi(true)
    setErreurFormulaire('')

    const estModification = Boolean(modale?.element)

    try {
      if (estModification) {
        await updateParcelle(modale.element.id, donnees)
      } else {
        await createParcelle(donnees)
      }

      setModale(null)
      setNotification({
        ton: 'success',
        message: estModification
          ? 'Parcelle mise à jour avec succès.'
          : 'Parcelle ajoutée avec succès.',
      })
      await charger()
    } catch (e) {
      setErreurFormulaire(
        messageErreur(e, "Impossible d'enregistrer la parcelle.")
      )
    } finally {
      setEnvoi(false)
    }
  }

  const enregistrerCycle = async (donnees) => {
    setEnvoi(true)
    setErreurFormulaire('')

    const estModification = Boolean(modale?.element)

    try {
      if (estModification) {
        await updateCycle(modale.element.id, donnees)
      } else {
        await createCycle(donnees)
      }

      setModale(null)
      setNotification({
        ton: 'success',
        message: estModification
          ? 'Cycle de culture mis à jour avec succès.'
          : 'Cycle de culture ajouté avec succès.',
      })
      await charger()
    } catch (e) {
      setErreurFormulaire(
        messageErreur(e, "Impossible d'enregistrer le cycle.")
      )
    } finally {
      setEnvoi(false)
    }
  }

  const supprimer = async () => {
    setEnvoi(true)

    try {
      if (modale.type === 'deleteParcelle') {
        await deleteParcelle(modale.element.id)
      } else {
        await deleteCycle(modale.element.id)
      }

      setModale(null)
      setNotification({
        ton: 'success',
        message:
          modale.type === 'deleteParcelle'
            ? 'Parcelle supprimée avec succès.'
            : 'Cycle de culture supprimé avec succès.',
      })
      await charger()
    } catch (e) {
      setModale(null)
      setNotification({
        ton: 'error',
        message: messageErreur(e, 'Impossible de supprimer cet élément.'),
      })
    } finally {
      setEnvoi(false)
    }
  }

  const filtresParcellesActifs = Boolean(
    rechercheParcelle || statutParcelle || typeSol
  )
  const filtresCyclesActifs = Boolean(
    rechercheCycle || parcelleFiltre || statutCycle
  )

  const nomSupprime =
    modale?.type === 'deleteCycle'
      ? `${modale.element?.typeCulture ?? ''} (${
          modale.element?.parcelle?.name ?? '—'
        })`
      : (modale?.element?.name ?? '')

  return (
    <>
      <PageHeader
        titre="Cultures & parcelles"
        sousTitre="Cycles de culture et occupation des sols — données réelles MongoDB"
        actions={
          peutEcrire &&
          (onglet === 'parcelles' ? (
            <Button onClick={() => setModale({ type: 'formParcelle', element: null })}>
              <Plus className="h-4 w-4" />
              Ajouter une parcelle
            </Button>
          ) : (
            <Button onClick={() => setModale({ type: 'formCycle', element: null })}>
              <Plus className="h-4 w-4" />
              Ajouter un cycle
            </Button>
          ))
        }
      />

      {!peutEcrire && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Votre rôle (<strong>Employé</strong>) autorise uniquement la
          consultation. La création, la modification et la suppression sont
          réservées aux administrateurs et gestionnaires.
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

      {/* Statistiques calculées sur les vraies données */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titre="Total parcelles"
          valeur={formatNombre(statsParcelles.total)}
          icone={Sprout}
        />
        <StatCard
          titre="Superficie totale (ha)"
          valeur={formatNombre(statsParcelles.superficieTotale)}
          icone={Boxes}
        />
        <StatCard
          titre="Parcelles disponibles"
          valeur={formatNombre(statsParcelles.disponibles)}
          icone={Leaf}
        />
        <StatCard
          titre="Parcelles cultivées"
          valeur={formatNombre(statsParcelles.cultivees)}
          icone={Sprout}
        />
        <StatCard
          titre="Cycles en cours"
          valeur={formatNombre(statsCycles.enCours)}
          icone={Activity}
        />
        <StatCard
          titre="Cycles récoltés"
          valeur={formatNombre(statsCycles.recoltees)}
          icone={CalendarDays}
        />
        <StatCard
          titre="Quantité récoltée (kg)"
          valeur={formatNombre(statsCycles.quantiteTotaleRecoltee)}
          icone={Boxes}
        />
      </div>

      {/* Onglets */}
      <Card className="mt-6">
        <div className="flex gap-2 border-b border-slate-100 px-3 pt-3 sm:px-5">
          <button
            type="button"
            role="tab"
            aria-selected={onglet === 'parcelles'}
            onClick={() => setOnglet('parcelles')}
            className={`rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
              onglet === 'parcelles'
                ? 'border-b-2 border-brand-600 text-brand-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Parcelles ({parcelles.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={onglet === 'cycles'}
            onClick={() => setOnglet('cycles')}
            className={`rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
              onglet === 'cycles'
                ? 'border-b-2 border-brand-600 text-brand-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Cycles de culture ({cycles.length})
          </button>
        </div>
      </Card>

      {/* Recherche et filtres */}
      <Card className="mt-4 p-4 sm:p-5">
        {onglet === 'parcelles' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Rechercher"
              icon={Search}
              placeholder="Nom ou localisation"
              value={rechercheParcelle}
              onChange={(e) => setRechercheParcelle(e.target.value)}
            />
            <SelectFiltre
              label="Statut"
              value={statutParcelle}
              onChange={(e) => setStatutParcelle(e.target.value)}
              options={STATUTS_PARCELLE}
              placeholder="Tous les statuts"
            />
            <Input
              label="Type de sol"
              value={typeSol}
              onChange={(e) => setTypeSol(e.target.value)}
              placeholder="Ex. Argileux"
              maxLength={100}
            />
            <div className="flex items-end">
              <Button
                variante="outline"
                onClick={reinitialiserParcelles}
                disabled={!filtresParcellesActifs}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Rechercher"
              icon={Search}
              placeholder="Culture ou variété"
              value={rechercheCycle}
              onChange={(e) => setRechercheCycle(e.target.value)}
            />
            <SelectFiltre
              label="Parcelle"
              value={parcelleFiltre}
              onChange={(e) => setParcelleFiltre(e.target.value)}
              options={parcelles.map((parcelle) => ({
                value: parcelle.id,
                label: parcelle.name,
              }))}
              placeholder="Toutes les parcelles"
            />
            <SelectFiltre
              label="Statut"
              value={statutCycle}
              onChange={(e) => setStatutCycle(e.target.value)}
              options={STATUTS_CYCLE}
              placeholder="Tous les statuts"
            />
            <div className="flex items-end">
              <Button
                variante="outline"
                onClick={reinitialiserCycles}
                disabled={!filtresCyclesActifs}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>
        )}
      </Card>

      {!chargement && (
        <div className="mt-6">
          {onglet === 'parcelles' ? (
            <ParcelleTable
              parcelles={parcelles}
              chargement={chargement}
              peutEcrire={peutEcrire}
              filtresActifs={filtresParcellesActifs}
              onVoir={(parcelle) => setModale({ type: 'detailsParcelle', element: parcelle })}
              onModifier={(parcelle) => setModale({ type: 'formParcelle', element: parcelle })}
              onSupprimer={(parcelle) => setModale({ type: 'deleteParcelle', element: parcelle })}
            />
          ) : (
            <CycleTable
              cycles={cycles}
              chargement={chargement}
              peutEcrire={peutEcrire}
              filtresActifs={filtresCyclesActifs}
              onVoir={(cycle) => setModale({ type: 'detailsCycle', element: cycle })}
              onModifier={(cycle) => setModale({ type: 'formCycle', element: cycle })}
              onSupprimer={(cycle) => setModale({ type: 'deleteCycle', element: cycle })}
            />
          )}
        </div>
      )}

      {chargement && (
        <Card className="mt-6">
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            Chargement des données...
          </div>
        </Card>
      )}

      <ParcelleForm
        ouvert={modale?.type === 'formParcelle'}
        parcelle={modale?.type === 'formParcelle' ? modale.element : null}
        onFermer={() => setModale(null)}
        onSoumettre={enregistrerParcelle}
        envoi={envoi}
        erreur={erreurFormulaire}
      />

      <ParcelleDetails
        ouvert={modale?.type === 'detailsParcelle'}
        parcelle={modale?.type === 'detailsParcelle' ? modale.element : null}
        onFermer={() => setModale(null)}
      />

      <CycleForm
        ouvert={modale?.type === 'formCycle'}
        cycle={modale?.type === 'formCycle' ? modale.element : null}
        parcelles={parcelles}
        onFermer={() => setModale(null)}
        onSoumettre={enregistrerCycle}
        envoi={envoi}
        erreur={erreurFormulaire}
      />

      <CycleDetails
        ouvert={modale?.type === 'detailsCycle'}
        cycle={modale?.type === 'detailsCycle' ? modale.element : null}
        onFermer={() => setModale(null)}
      />

      <ConfirmDialog
        ouvert={
          modale?.type === 'deleteParcelle' || modale?.type === 'deleteCycle'
        }
        message={
          modale?.type === 'deleteParcelle'
            ? 'Voulez-vous vraiment supprimer cette parcelle ? La suppression sera refusée si des cycles de culture y sont associés.'
            : 'Voulez-vous vraiment supprimer ce cycle de culture ?'
        }
        nomElement={nomSupprime}
        envoi={envoi}
        onAnnuler={() => setModale(null)}
        onConfirmer={supprimer}
      />
    </>
  )
}
