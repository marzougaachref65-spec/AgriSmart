import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  HeartPulse,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Stethoscope,
  Syringe,
} from 'lucide-react'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import CalendrierSoins from '../../components/veterinaire/CalendrierSoins'
import DossierDetails from '../../components/veterinaire/DossierDetails'
import DossierForm from '../../components/veterinaire/DossierForm'
import DossierTable from '../../components/veterinaire/DossierTable'
import EvenementDetails from '../../components/veterinaire/EvenementDetails'
import EvenementForm from '../../components/veterinaire/EvenementForm'
import EvenementTable from '../../components/veterinaire/EvenementTable'
import RappelForm from '../../components/veterinaire/RappelForm'
import RappelTable from '../../components/veterinaire/RappelTable'
import { useAuth } from '../../hooks/useAuth'
import { listAnimals } from '../../services/animalService'
import {
  createDossier,
  createEvenement,
  createRappel,
  deleteDossier,
  deleteRappel,
  getAlertesVeterinaires,
  getCalendrierSoins,
  getHistoriqueAnimal,
  getStatistiquesVeterinaires,
  listDossiers,
  listEvenements,
  listRappels,
  updateDossier,
  updateRappel,
} from '../../services/veterinaireService'
import {
  ALERTES_VETERINAIRES,
  LIBELLES_ALERTE_VETERINAIRE,
  LIBELLES_TYPE_EVENEMENT,
  STATUTS_RAPPEL,
  TONS_ALERTE_VETERINAIRE,
  TYPES_EVENEMENT,
  TYPES_RAPPEL,
  formatDate,
  formatDateHeure,
  formatMontant,
  formatNombre,
  libelleEvenement,
  nomAnimal,
} from '../../utils/veterinaire'

const statistiquesVides = {
  totalDossiers: 0,
  totalEvenements: 0,
  evenementsParType: {
    Vaccination: 0,
    Maladie: 0,
    Traitement: 0,
    Consultation: 0,
  },
  rappelsPlanifies: 0,
  rappelsEnRetard: 0,
  traitementsEnCours: 0,
  maladiesActives: 0,
  vaccinationsAVenir: 0,
  consultations: { nombre: 0, coutTotal: 0 },
}

const alertesVides = {
  rappelRetard: { count: 0, items: [] },
  rappelProche: { count: 0, items: [] },
  traitementEnCours: { count: 0, items: [] },
  maladieActive: { count: 0, items: [] },
  delaiJours: 30,
}

const resultatVide = { items: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }

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
      <span className="text-sm text-slate-800">{children || '—'}</span>
    </div>
  )
}

export default function Veterinaire() {
  const { hasRole } = useAuth()
  const peutEcrire = hasRole('ADMIN', 'MANAGER')

  const [onglet, setOnglet] = useState('dossiers')

  const [rechercheDossier, setRechercheDossier] = useState('')
  const [rechercheDossierActive, setRechercheDossierActive] = useState('')

  const [rechercheEvenement, setRechercheEvenement] = useState('')
  const [rechercheEvenementActive, setRechercheEvenementActive] = useState('')
  const [evenementAnimal, setEvenementAnimal] = useState('')
  const [evenementType, setEvenementType] = useState('')
  const [evenementDebut, setEvenementDebut] = useState('')
  const [evenementFin, setEvenementFin] = useState('')
  const [evenementPage, setEvenementPage] = useState(1)

  const [rechercheRappel, setRechercheRappel] = useState('')
  const [rechercheRappelActive, setRechercheRappelActive] = useState('')
  const [rappelAnimal, setRappelAnimal] = useState('')
  const [rappelStatut, setRappelStatut] = useState('')
  const [rappelType, setRappelType] = useState('')
  const [rappelPage, setRappelPage] = useState(1)

  const [calendrierDebut, setCalendrierDebut] = useState('')
  const [calendrierFin, setCalendrierFin] = useState('')
  const [joursAlerte, setJoursAlerte] = useState(30)
  const [statsDebut, setStatsDebut] = useState('')
  const [statsFin, setStatsFin] = useState('')

  const [animaux, setAnimaux] = useState([])
  const [dossiers, setDossiers] = useState([])
  const [evenements, setEvenements] = useState(resultatVide)
  const [rappels, setRappels] = useState(resultatVide)
  const [calendrier, setCalendrier] = useState([])
  const [alertes, setAlertes] = useState(alertesVides)
  const [statistiques, setStatistiques] = useState(statistiquesVides)
  const [historique, setHistorique] = useState(null)
  const [animalHistorique, setAnimalHistorique] = useState('')
  const [chargementHistorique, setChargementHistorique] = useState(false)

  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [notification, setNotification] = useState(null)
  const [modale, setModale] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreurFormulaire, setErreurFormulaire] = useState('')

  useEffect(() => {
    const minuteur = setTimeout(
      () => setRechercheDossierActive(rechercheDossier),
      300
    )
    return () => clearTimeout(minuteur)
  }, [rechercheDossier])

  useEffect(() => {
    const minuteur = setTimeout(
      () => setRechercheEvenementActive(rechercheEvenement),
      300
    )
    return () => clearTimeout(minuteur)
  }, [rechercheEvenement])

  useEffect(() => {
    const minuteur = setTimeout(
      () => setRechercheRappelActive(rechercheRappel),
      300
    )
    return () => clearTimeout(minuteur)
  }, [rechercheRappel])

  useEffect(() => {
    setEvenementPage(1)
  }, [rechercheEvenementActive, evenementAnimal, evenementType, evenementDebut, evenementFin])

  useEffect(() => {
    setRappelPage(1)
  }, [rechercheRappelActive, rappelAnimal, rappelStatut, rappelType])

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')

    const filtresDossiers = rechercheDossierActive
      ? { recherche: rechercheDossierActive }
      : {}

    const filtresEvenements = { page: evenementPage, limit: 20 }
    if (rechercheEvenementActive) filtresEvenements.recherche = rechercheEvenementActive
    if (evenementAnimal) filtresEvenements.animal = evenementAnimal
    if (evenementType) filtresEvenements.type = evenementType
    if (evenementDebut) filtresEvenements.debut = new Date(evenementDebut).toISOString()
    if (evenementFin) filtresEvenements.fin = new Date(evenementFin).toISOString()

    const filtresRappels = { page: rappelPage, limit: 20 }
    if (rechercheRappelActive) filtresRappels.recherche = rechercheRappelActive
    if (rappelAnimal) filtresRappels.animal = rappelAnimal
    if (rappelStatut) filtresRappels.statut = rappelStatut
    if (rappelType) filtresRappels.type = rappelType

    const filtresCalendrier = {}
    if (calendrierDebut) filtresCalendrier.debut = new Date(calendrierDebut).toISOString()
    if (calendrierFin) filtresCalendrier.fin = new Date(calendrierFin).toISOString()

    const filtresStats = {}
    if (statsDebut) filtresStats.debut = new Date(statsDebut).toISOString()
    if (statsFin) filtresStats.fin = new Date(statsFin).toISOString()

    try {
      const [
        listeAnimaux,
        listeDossiers,
        listeEvenements,
        listeRappels,
        entreesCalendrier,
        etatAlertes,
        stats,
      ] = await Promise.all([
        listAnimals(),
        listDossiers(filtresDossiers),
        listEvenements(filtresEvenements),
        listRappels(filtresRappels),
        getCalendrierSoins(filtresCalendrier),
        getAlertesVeterinaires({ jours: joursAlerte }),
        getStatistiquesVeterinaires(filtresStats),
      ])

      setAnimaux(listeAnimaux)
      setDossiers(listeDossiers)
      setEvenements(listeEvenements)
      setRappels(listeRappels)
      setCalendrier(entreesCalendrier)
      setAlertes(etatAlertes)
      setStatistiques(stats)
    } catch (e) {
      setErreur(
        messageErreur(e, 'Impossible de charger le suivi vétérinaire depuis le serveur.')
      )
    } finally {
      setChargement(false)
    }
  }, [
    rechercheDossierActive,
    evenementPage,
    rechercheEvenementActive,
    evenementAnimal,
    evenementType,
    evenementDebut,
    evenementFin,
    rappelPage,
    rechercheRappelActive,
    rappelAnimal,
    rappelStatut,
    rappelType,
    calendrierDebut,
    calendrierFin,
    joursAlerte,
    statsDebut,
    statsFin,
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

  const chargerHistorique = useCallback(async (animalId) => {
    if (!animalId) {
      setHistorique(null)
      return
    }
    setChargementHistorique(true)
    try {
      setHistorique(await getHistoriqueAnimal(animalId))
    } catch (e) {
      setNotification({
        ton: 'error',
        message: messageErreur(e, "Impossible de charger l'historique sanitaire."),
      })
    } finally {
      setChargementHistorique(false)
    }
  }, [])

  useEffect(() => {
    chargerHistorique(animalHistorique)
  }, [animalHistorique, chargerHistorique, evenements.pagination?.total])

  const voirHistorique = (animalId) => {
    if (!animalId) return
    setAnimalHistorique(animalId)
    setHistorique(null)
    setOnglet('historique')
  }

  const reinitialiserDossiers = () => setRechercheDossier('')

  const reinitialiserEvenements = () => {
    setRechercheEvenement('')
    setEvenementAnimal('')
    setEvenementType('')
    setEvenementDebut('')
    setEvenementFin('')
  }

  const reinitialiserRappels = () => {
    setRechercheRappel('')
    setRappelAnimal('')
    setRappelStatut('')
    setRappelType('')
  }

  const enregistrerDossier = async (donnees) => {
    setEnvoi(true)
    setErreurFormulaire('')
    const estModification = Boolean(modale?.element)
    try {
      if (estModification) {
        await updateDossier(modale.element.id, {
          notesGenerales: donnees.notesGenerales,
          allergies: donnees.allergies,
          antecedents: donnees.antecedents,
          veterinaireReferent: donnees.veterinaireReferent,
        })
      } else {
        await createDossier(donnees)
      }
      setModale(null)
      setNotification({
        ton: 'success',
        message: estModification
          ? 'Dossier médical mis à jour avec succès.'
          : 'Dossier médical créé avec succès.',
      })
      await charger()
    } catch (e) {
      setErreurFormulaire(
        messageErreur(e, "Impossible d'enregistrer le dossier médical.")
      )
    } finally {
      setEnvoi(false)
    }
  }

  const enregistrerEvenement = async (donnees) => {
    setEnvoi(true)
    setErreurFormulaire('')
    try {
      const resultat = await createEvenement(donnees)
      setModale(null)
      setNotification({
        ton: 'success',
        message: resultat?.dejaExistant
          ? 'Cet événement était déjà enregistré avec cette référence.'
          : 'Événement sanitaire enregistré avec succès.',
      })
      await charger()
      if (donnees.animal) {
        setAnimalHistorique(donnees.animal)
        await chargerHistorique(donnees.animal)
      }
    } catch (e) {
      setErreurFormulaire(
        messageErreur(e, "Impossible d'enregistrer l'événement sanitaire.")
      )
    } finally {
      setEnvoi(false)
    }
  }

  const enregistrerRappel = async (donnees) => {
    setEnvoi(true)
    setErreurFormulaire('')
    try {
      await createRappel(donnees)
      setModale(null)
      setNotification({
        ton: 'success',
        message: 'Rappel de soin planifié avec succès.',
      })
      await charger()
      if (donnees.animal) {
        setAnimalHistorique(donnees.animal)
        await chargerHistorique(donnees.animal)
      }
    } catch (e) {
      setErreurFormulaire(messageErreur(e, "Impossible de planifier le rappel."))
    } finally {
      setEnvoi(false)
    }
  }

  const effectuerRappel = async (rappel) => {
    setEnvoi(true)
    try {
      await updateRappel(rappel.id, { statut: 'Effectué' })
      setNotification({ ton: 'success', message: 'Rappel marqué comme effectué.' })
      await charger()
      if (rappel.animal?.id) await chargerHistorique(rappel.animal.id)
    } catch (e) {
      setNotification({
        ton: 'error',
        message: messageErreur(e, 'Impossible de mettre à jour le rappel.'),
      })
    } finally {
      setEnvoi(false)
    }
  }

  const confirmerSuppression = async () => {
    setEnvoi(true)
    const estDossier = modale?.type === 'deleteDossier'
    const element = modale?.element
    try {
      if (estDossier) {
        await deleteDossier(element.id)
      } else {
        await deleteRappel(element.id)
      }
      setModale(null)
      setNotification({
        ton: 'success',
        message: estDossier
          ? 'Dossier médical supprimé avec succès.'
          : 'Rappel de soin supprimé avec succès.',
      })
      await charger()
      if (!estDossier && element?.animal?.id) {
        await chargerHistorique(element.animal.id)
      }
    } catch (e) {
      setModale(null)
      setNotification({
        ton: 'error',
        message: messageErreur(e, 'Impossible de réaliser la suppression.'),
      })
    } finally {
      setEnvoi(false)
    }
  }

  const nombreAlertes = ALERTES_VETERINAIRES.reduce(
    (total, cle) => total + (alertes[cle]?.count ?? 0),
    0
  )
  const filtresDossiersActifs = Boolean(rechercheDossier)
  const filtresEvenementsActifs = Boolean(
    rechercheEvenement ||
      evenementAnimal ||
      evenementType ||
      evenementDebut ||
      evenementFin
  )
  const filtresRappelsActifs = Boolean(
    rechercheRappel || rappelAnimal || rappelStatut || rappelType
  )
  const optionsAnimaux = animaux.map((animal) => ({
    value: animal.id,
    label: `${animal.name} — ${animal.espece}`,
  }))

  const actionSelonOnglet =
    peutEcrire &&
    (onglet === 'dossiers' ? (
      <Button onClick={() => setModale({ type: 'formDossier', element: null })}>
        <Plus className="h-4 w-4" />
        Nouveau dossier
      </Button>
    ) : onglet === 'historique' ? (
      <Button onClick={() => setModale({ type: 'formEvenement', element: null })}>
        <Plus className="h-4 w-4" />
        Nouvel événement
      </Button>
    ) : onglet === 'calendrier' ? (
      <Button onClick={() => setModale({ type: 'formRappel', element: null })}>
        <Plus className="h-4 w-4" />
        Nouveau rappel
      </Button>
    ) : null)

  return (
    <>
      <PageHeader
        titre="Suivi vétérinaire"
        sousTitre="Dossiers médicaux, vaccinations, traitements et rappels — données réelles MongoDB"
        actions={actionSelonOnglet}
      />

      {!peutEcrire && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Votre rôle (<strong>Employé</strong>) n'autorise pas l'accès à ce module.
          Le suivi vétérinaire est réservé aux administrateurs et gestionnaires.
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

      {/* Statistiques — toujours visibles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titre="Dossiers médicaux"
          valeur={formatNombre(statistiques.totalDossiers)}
          icone={ClipboardList}
        />
        <StatCard
          titre="Événements sanitaires"
          valeur={formatNombre(statistiques.totalEvenements)}
          icone={Activity}
        />
        <StatCard
          titre="Rappels en retard"
          valeur={formatNombre(statistiques.rappelsEnRetard)}
          icone={AlertTriangle}
          complement={`${formatNombre(statistiques.rappelsPlanifies)} planifiés`}
        />
        <StatCard
          titre="Vaccinations à venir"
          valeur={formatNombre(statistiques.vaccinationsAVenir)}
          icone={Syringe}
          complement="30 prochains jours"
        />
        <StatCard
          titre="Traitements en cours"
          valeur={formatNombre(statistiques.traitementsEnCours)}
          icone={Stethoscope}
        />
        <StatCard
          titre="Maladies actives"
          valeur={formatNombre(statistiques.maladiesActives)}
          icone={HeartPulse}
        />
        <StatCard
          titre="Alertes actives"
          valeur={formatNombre(nombreAlertes)}
          icone={AlertTriangle}
          complement={`Horizon ${alertes.delaiJours ?? 30} jours`}
        />
        <StatCard
          titre="Consultations (période)"
          valeur={formatNombre(statistiques.consultations?.nombre)}
          icone={CalendarClock}
          complement={`${formatMontant(statistiques.consultations?.coutTotal)} €`}
        />
      </div>

      {/* Onglets */}
      <Card className="mt-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-3 pt-3 sm:px-5">
          <Onglet
            actif={onglet === 'dossiers'}
            label="Dossiers"
            count={dossiers.length}
            onClick={() => setOnglet('dossiers')}
          />
          <Onglet
            actif={onglet === 'historique'}
            label="Historique sanitaire"
            count={evenements.pagination?.total ?? 0}
            onClick={() => setOnglet('historique')}
          />
          <Onglet
            actif={onglet === 'calendrier'}
            label="Calendrier & rappels"
            count={(rappels.pagination?.total ?? 0) + calendrier.length}
            onClick={() => setOnglet('calendrier')}
          />
          <Onglet
            actif={onglet === 'alertes'}
            label="Alertes & statistiques"
            count={nombreAlertes}
            onClick={() => setOnglet('alertes')}
          />
        </div>
      </Card>

      {/* Filtres */}
      <Card className="mt-4 p-4 sm:p-5">
        {onglet === 'dossiers' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Rechercher"
              icon={Search}
              placeholder="Nom de l'animal"
              value={rechercheDossier}
              onChange={(e) => setRechercheDossier(e.target.value)}
            />
            <div className="flex items-end sm:col-span-2">
              <Button
                variante="outline"
                onClick={reinitialiserDossiers}
                disabled={!filtresDossiersActifs}
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>
        )}

        {onglet === 'historique' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Rechercher"
              icon={Search}
              placeholder="Référence, vaccin, médicament..."
              value={rechercheEvenement}
              onChange={(e) => setRechercheEvenement(e.target.value)}
            />
            <SelectFiltre
              label="Animal"
              value={evenementAnimal}
              onChange={(e) => setEvenementAnimal(e.target.value)}
              options={optionsAnimaux}
              placeholder="Tous les animaux"
            />
            <SelectFiltre
              label="Type d'événement"
              value={evenementType}
              onChange={(e) => setEvenementType(e.target.value)}
              options={TYPES_EVENEMENT.map((type) => ({
                value: type,
                label: LIBELLES_TYPE_EVENEMENT[type],
              }))}
              placeholder="Tous les types"
            />
            <Input
              label="Depuis"
              type="date"
              value={evenementDebut}
              onChange={(e) => setEvenementDebut(e.target.value)}
            />
            <Input
              label="Jusqu'au"
              type="date"
              value={evenementFin}
              onChange={(e) => setEvenementFin(e.target.value)}
            />
            <div className="flex items-end lg:col-span-3">
              <Button
                variante="outline"
                onClick={reinitialiserEvenements}
                disabled={!filtresEvenementsActifs}
                className="w-full sm:w-auto"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser les filtres
              </Button>
            </div>
          </div>
        )}

        {onglet === 'calendrier' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Rechercher un rappel"
              icon={Search}
              placeholder="Titre ou notes"
              value={rechercheRappel}
              onChange={(e) => setRechercheRappel(e.target.value)}
            />
            <SelectFiltre
              label="Animal"
              value={rappelAnimal}
              onChange={(e) => setRappelAnimal(e.target.value)}
              options={optionsAnimaux}
              placeholder="Tous les animaux"
            />
            <SelectFiltre
              label="Statut"
              value={rappelStatut}
              onChange={(e) => setRappelStatut(e.target.value)}
              options={STATUTS_RAPPEL}
              placeholder="Tous les statuts"
            />
            <SelectFiltre
              label="Type de rappel"
              value={rappelType}
              onChange={(e) => setRappelType(e.target.value)}
              options={TYPES_RAPPEL}
              placeholder="Tous les types"
            />
            <Input
              label="Agenda du"
              type="date"
              value={calendrierDebut}
              onChange={(e) => setCalendrierDebut(e.target.value)}
            />
            <Input
              label="Agenda au"
              type="date"
              value={calendrierFin}
              onChange={(e) => setCalendrierFin(e.target.value)}
            />
            <div className="flex items-end lg:col-span-2">
              <Button
                variante="outline"
                onClick={() => {
                  reinitialiserRappels()
                  setCalendrierDebut('')
                  setCalendrierFin('')
                }}
                disabled={
                  !filtresRappelsActifs && !calendrierDebut && !calendrierFin
                }
                className="w-full sm:w-auto"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>
        )}

        {onglet === 'alertes' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Horizon des alertes (jours)"
              type="number"
              min="1"
              max="365"
              value={joursAlerte}
              onChange={(e) => setJoursAlerte(Number(e.target.value) || 30)}
            />
            <Input
              label="Consultations du"
              type="date"
              value={statsDebut}
              onChange={(e) => setStatsDebut(e.target.value)}
            />
            <Input
              label="Consultations au"
              type="date"
              value={statsFin}
              onChange={(e) => setStatsFin(e.target.value)}
            />
          </div>
        )}
      </Card>

      {chargement && (
        <Card className="mt-6">
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            Chargement du suivi vétérinaire...
          </div>
        </Card>
      )}

      {!chargement && onglet === 'dossiers' && (
        <div className="mt-6">
          <DossierTable
            dossiers={dossiers}
            chargement={chargement}
            filtresActifs={filtresDossiersActifs}
            onVoir={(dossier) => setModale({ type: 'detailsDossier', element: dossier })}
            onModifier={(dossier) => setModale({ type: 'formDossier', element: dossier })}
            onSupprimer={(dossier) =>
              setModale({ type: 'deleteDossier', element: dossier })
            }
            onHistorique={voirHistorique}
          />
        </div>
      )}

      {!chargement && onglet === 'historique' && (
        <div className="mt-6 space-y-6">
          <Card className="p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SelectFiltre
                label="Historique d'un animal"
                value={animalHistorique}
                onChange={(e) => setAnimalHistorique(e.target.value)}
                options={optionsAnimaux}
                placeholder="Choisir un animal"
              />
              <div className="flex items-end sm:col-span-2">
                {animalHistorique && historique && (
                  <p className="text-xs text-slate-500">
                    {formatNombre(historique.totaux?.evenements)} événement(s),{' '}
                    {formatNombre(historique.totaux?.rappels)} rappel(s) —{' '}
                    {nomAnimal(historique.animal)}
                  </p>
                )}
              </div>
            </div>

            {chargementHistorique && (
              <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Chargement de l'historique...
              </p>
            )}

            {!chargementHistorique && historique && (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Card className="p-4">
                  <p className="mb-2 text-sm font-semibold text-slate-800">
                    Identification
                  </p>
                  <LigneHistorique label="Animal">{historique.animal?.name}</LigneHistorique>
                  <LigneHistorique label="Espèce">{historique.animal?.espece}</LigneHistorique>
                  <LigneHistorique label="Statut">{historique.animal?.statut}</LigneHistorique>
                  <LigneHistorique label="Dossier médical">
                    {historique.dossier ? 'Présent' : 'Aucun'}
                  </LigneHistorique>
                </Card>
                <Card className="p-4">
                  <p className="mb-2 text-sm font-semibold text-slate-800">
                    Totaux sanitaires
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      ['Vaccinations', historique.totaux?.vaccinations],
                      ['Maladies', historique.totaux?.maladies],
                      ['Traitements', historique.totaux?.traitements],
                      ['Consultations', historique.totaux?.consultations],
                      ['Rappels', historique.totaux?.rappels],
                      ['Événements', historique.totaux?.evenements],
                    ].map(([label, valeur]) => (
                      <div key={label} className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          {label}
                        </p>
                        <p className="mt-0.5 text-lg font-bold text-slate-800">
                          {formatNombre(valeur)}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {!chargementHistorique && historique && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  Chronologie sanitaire
                </p>
                <div className="space-y-2">
                  {(historique.evenements ?? []).length === 0 ? (
                    <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Aucun événement sanitaire enregistré pour cet animal.
                    </p>
                  ) : (
                    historique.evenements.map((evenement) => (
                      <button
                        key={evenement.id}
                        type="button"
                        onClick={() =>
                          setModale({ type: 'detailsEvenement', element: evenement })
                        }
                        className="flex w-full flex-col gap-1 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-brand-200 hover:bg-brand-50/30 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="text-sm font-medium text-slate-800">
                          {libelleEvenement(evenement)}
                        </span>
                        <span className="flex items-center gap-3 text-xs text-slate-500">
                          <Badge ton={evenement.type === 'Maladie' ? 'danger' : 'brand'}>
                            {LIBELLES_TYPE_EVENEMENT[evenement.type] ?? evenement.type}
                          </Badge>
                          {formatDate(evenement.date)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </Card>

          <EvenementTable
            resultat={evenements}
            chargement={false}
            filtresActifs={filtresEvenementsActifs}
            onVoir={(evenement) =>
              setModale({ type: 'detailsEvenement', element: evenement })
            }
            onPage={setEvenementPage}
          />
        </div>
      )}

      {!chargement && onglet === 'calendrier' && (
        <div className="mt-6 space-y-6">
          <CalendrierSoins
            entrees={calendrier}
            chargement={false}
            periode={{
              debut: calendrierDebut ? formatDate(calendrierDebut) : 'Aujourd’hui',
              fin: calendrierFin ? formatDate(calendrierFin) : '+ 30 jours',
            }}
          />
          <RappelTable
            resultat={rappels}
            chargement={false}
            filtresActifs={filtresRappelsActifs}
            onEffectuer={effectuerRappel}
            onSupprimer={(rappel) =>
              setModale({ type: 'deleteRappel', element: rappel })
            }
            onPage={setRappelPage}
          />
        </div>
      )}

      {!chargement && onglet === 'alertes' && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {ALERTES_VETERINAIRES.map((cle) => (
            <Card key={cle} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge ton={TONS_ALERTE_VETERINAIRE[cle]}>
                    {LIBELLES_ALERTE_VETERINAIRE[cle]}
                  </Badge>
                  <span className="text-sm font-semibold text-slate-800">
                    {alertes[cle]?.count ?? 0}
                  </span>
                </div>
                {cle === 'rappelRetard' || cle === 'rappelProche' ? (
                  <Button
                    variante="ghost"
                    taille="sm"
                    onClick={() => setOnglet('calendrier')}
                  >
                    Voir le calendrier
                  </Button>
                ) : (
                  <Button
                    variante="ghost"
                    taille="sm"
                    onClick={() => setOnglet('historique')}
                  >
                    Voir l'historique
                  </Button>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {(alertes[cle]?.items ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun élément concerné.</p>
                ) : (
                  alertes[cle].items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">
                          {item.titre}
                        </p>
                        <p className="text-xs text-slate-400">
                          {nomAnimal(item.animal)} · {formatDateHeure(item.date)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ))}

          <Card className="p-5 lg:col-span-2">
            <p className="mb-3 text-sm font-semibold text-slate-800">
              Événements par type (toutes données confondues)
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TYPES_EVENEMENT.map((type) => (
                <div key={type} className="rounded-xl bg-slate-50 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    {LIBELLES_TYPE_EVENEMENT[type]}
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-800">
                    {formatNombre(statistiques.evenementsParType?.[type])}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Période des consultations : {formatDate(statistiques.periode?.debut)} →{' '}
              {formatDate(statistiques.periode?.fin)}
            </p>
          </Card>
        </div>
      )}

      {/* Formulaires et détails */}
      <DossierForm
        ouvert={modale?.type === 'formDossier'}
        animaux={animaux}
        dossier={modale?.type === 'formDossier' ? modale.element : null}
        onFermer={() => setModale(null)}
        onSoumettre={enregistrerDossier}
        envoi={envoi}
        erreur={erreurFormulaire}
      />

      <DossierDetails
        ouvert={modale?.type === 'detailsDossier'}
        dossier={modale?.type === 'detailsDossier' ? modale.element : null}
        onFermer={() => setModale(null)}
        onHistorique={(animalId) => {
          setModale(null)
          voirHistorique(animalId)
        }}
      />

      <EvenementForm
        ouvert={modale?.type === 'formEvenement'}
        animaux={animaux}
        animalParDefaut={animalHistorique}
        onFermer={() => setModale(null)}
        onSoumettre={enregistrerEvenement}
        envoi={envoi}
        erreur={erreurFormulaire}
      />

      <EvenementDetails
        ouvert={modale?.type === 'detailsEvenement'}
        evenement={modale?.type === 'detailsEvenement' ? modale.element : null}
        onFermer={() => setModale(null)}
      />

      <RappelForm
        ouvert={modale?.type === 'formRappel'}
        animaux={animaux}
        animalParDefaut={animalHistorique}
        onFermer={() => setModale(null)}
        onSoumettre={enregistrerRappel}
        envoi={envoi}
        erreur={erreurFormulaire}
      />

      <ConfirmDialog
        ouvert={modale?.type === 'deleteDossier'}
        titre="Supprimer le dossier médical"
        message="Voulez-vous vraiment supprimer ce dossier médical ? La suppression sera refusée si des événements ou des rappels y sont associés, afin de préserver l'historique sanitaire."
        nomElement={
          modale?.type === 'deleteDossier'
            ? nomAnimal(modale.element?.animal)
            : ''
        }
        envoi={envoi}
        onAnnuler={() => setModale(null)}
        onConfirmer={confirmerSuppression}
      />

      <ConfirmDialog
        ouvert={modale?.type === 'deleteRappel'}
        titre="Supprimer le rappel de soin"
        message="Voulez-vous vraiment supprimer ce rappel de soin ? Cette action est définitive."
        nomElement={
          modale?.type === 'deleteRappel' ? modale.element?.titre : ''
        }
        envoi={envoi}
        onAnnuler={() => setModale(null)}
        onConfirmer={confirmerSuppression}
      />
    </>
  )
}
