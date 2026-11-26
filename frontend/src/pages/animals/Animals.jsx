import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  Eye,
  Loader2,
  PawPrint,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import AnimalDetails from '../../components/animals/AnimalDetails'
import AnimalForm from '../../components/animals/AnimalForm'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { Card, CardBody, CardHeader } from '../../components/common/Card'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import { useAuth } from '../../hooks/useAuth'
import {
  createAnimal,
  deleteAnimal,
  getAnimalStats,
  listAnimals,
  updateAnimal,
} from '../../services/animalService'
import {
  ESPECES,
  STATUTS,
  TONS_STATUT,
  formatDate,
  formatNombre,
} from '../../utils/animals'

const statistiquesVides = { total: 0, males: 0, femelles: 0, malades: 0 }

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
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function Animals() {
  const { hasRole } = useAuth()
  const peutEcrire = hasRole('ADMIN', 'MANAGER')

  const [recherche, setRecherche] = useState('')
  const [rechercheActive, setRechercheActive] = useState('')
  const [espece, setEspece] = useState('')
  const [statut, setStatut] = useState('')

  const [animaux, setAnimaux] = useState([])
  const [statistiques, setStatistiques] = useState(statistiquesVides)
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

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')

    const filtres = {}
    if (rechercheActive) filtres.recherche = rechercheActive
    if (espece) filtres.espece = espece
    if (statut) filtres.statut = statut

    try {
      const [liste, stats] = await Promise.all([
        listAnimals(filtres),
        getAnimalStats(),
      ])
      setAnimaux(liste)
      setStatistiques(stats)
    } catch (e) {
      setErreur(
        messageErreur(e, 'Impossible de charger les animaux depuis le serveur.')
      )
    } finally {
      setChargement(false)
    }
  }, [rechercheActive, espece, statut])

  useEffect(() => {
    charger()
  }, [charger])

  useEffect(() => {
    if (!notification) return undefined
    const minuteur = setTimeout(() => setNotification(null), 5000)
    return () => clearTimeout(minuteur)
  }, [notification])

  /* Efface l'erreur du formulaire quand sa modale est refermée. */
  useEffect(() => {
    if (modale?.type !== 'form') setErreurFormulaire('')
  }, [modale?.type])

  const reinitialiserFiltres = () => {
    setRecherche('')
    setEspece('')
    setStatut('')
  }

  const enregistrer = async (donnees) => {
    setEnvoi(true)
    setErreurFormulaire('')

    const estModification = Boolean(modale?.animal)

    try {
      if (estModification) {
        await updateAnimal(modale.animal.id, donnees)
      } else {
        await createAnimal(donnees)
      }

      setModale(null)
      setNotification({
        ton: 'success',
        message: estModification
          ? 'Animal mis à jour avec succès.'
          : 'Animal ajouté avec succès.',
      })
      await charger()
    } catch (e) {
      setErreurFormulaire(
        messageErreur(e, "Impossible d'enregistrer l'animal.")
      )
    } finally {
      setEnvoi(false)
    }
  }

  const supprimer = async () => {
    setEnvoi(true)

    try {
      await deleteAnimal(modale.animal.id)
      setModale(null)
      setNotification({
        ton: 'success',
        message: 'Animal supprimé avec succès.',
      })
      await charger()
    } catch (e) {
      setModale(null)
      setNotification({
        ton: 'error',
        message: messageErreur(e, 'Impossible de supprimer cet animal.'),
      })
    } finally {
      setEnvoi(false)
    }
  }

  const filtresActifs = Boolean(recherche || espece || statut)

  return (
    <>
      <PageHeader
        titre="Animaux"
        sousTitre="Gestion du cheptel — données réelles enregistrées dans MongoDB"
        actions={
          peutEcrire && (
            <Button onClick={() => setModale({ type: 'form', animal: null })}>
              <Plus className="h-4 w-4" />
              Ajouter un animal
            </Button>
          )
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
          titre="Total animaux"
          valeur={formatNombre(statistiques.total)}
          icone={PawPrint}
        />
        <StatCard titre="Mâles" valeur={formatNombre(statistiques.males)} icone={Users} />
        <StatCard
          titre="Femelles"
          valeur={formatNombre(statistiques.femelles)}
          icone={Users}
        />
        <StatCard
          titre="Animaux malades"
          valeur={formatNombre(statistiques.malades)}
          icone={Activity}
        />
      </div>

      {/* Recherche et filtres */}
      <Card className="mt-6 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Rechercher"
            icon={Search}
            placeholder="Nom ou race"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          <SelectFiltre
            label="Espèce"
            value={espece}
            onChange={(e) => setEspece(e.target.value)}
            options={ESPECES}
            placeholder="Toutes les espèces"
          />
          <SelectFiltre
            label="Statut"
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            options={STATUTS}
            placeholder="Tous les statuts"
          />
          <div className="flex items-end">
            <Button
              variante="outline"
              onClick={reinitialiserFiltres}
              disabled={!filtresActifs}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      {/* Tableau */}
      <Card className="mt-6">
        <CardHeader
          titre={`Animaux (${animaux.length})`}
          sousTitre="Cliquez sur l'œil pour consulter la fiche complète"
        />
        <CardBody className="p-0">
          {chargement ? (
            <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
              Chargement des animaux...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Animal</th>
                    <th className="px-5 py-3 font-semibold">Espèce</th>
                    <th className="px-5 py-3 font-semibold">Race</th>
                    <th className="px-5 py-3 font-semibold">Sexe</th>
                    <th className="px-5 py-3 font-semibold">Poids</th>
                    <th className="px-5 py-3 font-semibold">Statut</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {animaux.map((animal) => (
                    <tr key={animal.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">{animal.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          #{animal.id.slice(-6)}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{animal.espece}</td>
                      <td className="px-5 py-3 text-slate-500">
                        {animal.race || '—'}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{animal.sexe}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {animal.poids !== null
                          ? `${formatNombre(animal.poids)} kg`
                          : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <Badge ton={TONS_STATUT[animal.statut] ?? 'neutral'}>
                          {animal.statut}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            title="Voir les détails"
                            aria-label={`Voir ${animal.name}`}
                            onClick={() =>
                              setModale({ type: 'details', animal })
                            }
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {peutEcrire && (
                            <>
                              <button
                                type="button"
                                title="Modifier"
                                aria-label={`Modifier ${animal.name}`}
                                onClick={() =>
                                  setModale({ type: 'form', animal })
                                }
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                title="Supprimer"
                                aria-label={`Supprimer ${animal.name}`}
                                onClick={() =>
                                  setModale({ type: 'delete', animal })
                                }
                                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {animaux.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-14 text-center text-sm text-slate-500"
                      >
                        Aucun animal trouvé.
                        {filtresActifs
                          ? ' Modifiez les filtres ou ajoutez un animal.'
                          : ' Cliquez sur « Ajouter un animal » pour commencer.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <AnimalForm
        ouvert={modale?.type === 'form'}
        animal={modale?.type === 'form' ? modale.animal : null}
        onFermer={() => setModale(null)}
        onSoumettre={enregistrer}
        envoi={envoi}
        erreur={erreurFormulaire}
      />

      <AnimalDetails
        ouvert={modale?.type === 'details'}
        animal={modale?.type === 'details' ? modale.animal : null}
        onFermer={() => setModale(null)}
      />

      <ConfirmDialog
        ouvert={modale?.type === 'delete'}
        message="Voulez-vous vraiment supprimer cet animal ?"
        nomElement={modale?.type === 'delete' ? modale.animal.name : ''}
        envoi={envoi}
        onAnnuler={() => setModale(null)}
        onConfirmer={supprimer}
      />
    </>
  )
}
