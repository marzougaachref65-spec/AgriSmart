import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Plus,
  RotateCcw,
  Scale,
  Tags,
  Wallet,
} from 'lucide-react'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import CategorieForm from '../../components/finances/CategorieForm'
import CategorieTable from '../../components/finances/CategorieTable'
import DashboardFinancier from '../../components/finances/DashboardFinancier'
import FiltresFinances from '../../components/finances/FiltresFinances'
import OperationDetails from '../../components/finances/OperationDetails'
import OperationForm from '../../components/finances/OperationForm'
import OperationTable from '../../components/finances/OperationTable'
import PaiementForm from '../../components/finances/PaiementForm'
import RapportFinancier from '../../components/finances/RapportFinancier'
import { useAuth } from '../../hooks/useAuth'
import {
  annulerOperation,
  creerPaiement,
  createCategorie,
  createOperation,
  desactiverCategorie,
  getHistoriqueOperation,
  getRapportCsv,
  getRapportSynthese,
  getStatistiquesFinancieres,
  getTableauDeBord,
  listCategories,
  listOperations,
  updateCategorie,
  updateOperation,
} from '../../services/financeService'
import {
  datePourChamp,
  formatMontantTND,
  formatNombre,
  saisieVersMillimes,
} from '../../utils/finances'

const resultatVide = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
}

const filtresVides = {
  recherche: '',
  type: '',
  categorie: '',
  statutPaiement: '',
  modePaiement: '',
  sourceModule: '',
  debut: '',
  fin: '',
  page: 1,
}

async function messageErreur(erreur, fallback) {
  const donnees = erreur?.response?.data

  /* Les endpoints en `responseType: 'blob'` (CSV) renvoient un Blob, y compris
     pour les erreurs : le message serveur doit être relu avant d'être affiché. */
  if (donnees instanceof Blob) {
    try {
      const texte = await donnees.text()
      try {
        const analyse = JSON.parse(texte)
        if (analyse?.message) return analyse.message
      } catch {
        // Le corps n'est pas du JSON : on utilise le texte brut.
      }
      return texte.trim() || fallback
    } catch {
      return fallback
    }
  }

  return donnees?.message ?? fallback
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
      {label}
      {count !== undefined && ` (${count})`}
    </button>
  )
}

function soldeRestantOperation(operation) {
  if (!operation) return 0
  if (
    operation.montantMillimes !== undefined &&
    operation.montantPayeMillimes !== undefined
  ) {
    return Math.max(
      0,
      Number(operation.montantMillimes) - Number(operation.montantPayeMillimes)
    )
  }
  return Math.max(
    0,
    saisieVersMillimes(String(operation.montant ?? 0)) -
      saisieVersMillimes(String(operation.montantPaye ?? 0))
  )
}

export default function Finances() {
  const { hasRole } = useAuth()
  const peutEcrire = hasRole('ADMIN', 'MANAGER')

  const [onglet, setOnglet] = useState('tableau')
  const [filtres, setFiltres] = useState(filtresVides)
  const [rechercheActive, setRechercheActive] = useState('')

  const [categories, setCategories] = useState([])
  const [resultat, setResultat] = useState(resultatVide)
  const [tableau, setTableau] = useState(null)
  const [statistiques, setStatistiques] = useState(null)
  const [rapport, setRapport] = useState(null)
  const [historique, setHistorique] = useState([])

  const [chargement, setChargement] = useState(true)
  const [chargementHistorique, setChargementHistorique] = useState(false)
  const [erreur, setErreur] = useState('')
  const [notification, setNotification] = useState(null)
  const [modale, setModale] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreurFormulaire, setErreurFormulaire] = useState('')
  const [motifAnnulation, setMotifAnnulation] = useState('')
  const [exportEnvoi, setExportEnvoi] = useState(false)

  const parametresPeriode = useMemo(() => {
    const parametres = {}
    if (filtres.debut) {
      parametres.debut = new Date(`${filtres.debut}T00:00:00`).toISOString()
    }
    if (filtres.fin) {
      parametres.fin = new Date(`${filtres.fin}T23:59:59.999`).toISOString()
    }
    return parametres
  }, [filtres.debut, filtres.fin])

  useEffect(() => {
    const minuteur = setTimeout(() => setRechercheActive(filtres.recherche), 300)
    return () => clearTimeout(minuteur)
  }, [filtres.recherche])

  useEffect(() => {
    if (!notification) return undefined
    const minuteur = setTimeout(() => setNotification(null), 5000)
    return () => clearTimeout(minuteur)
  }, [notification])

  useEffect(() => {
    setErreurFormulaire('')
  }, [modale?.type])

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')

    const parametresOperations = { page: filtres.page, limit: 20, ...parametresPeriode }
    if (rechercheActive) parametresOperations.recherche = rechercheActive
    if (filtres.type) parametresOperations.type = filtres.type
    if (filtres.categorie) parametresOperations.categorie = filtres.categorie
    if (filtres.statutPaiement) {
      parametresOperations.statutPaiement = filtres.statutPaiement
    }
    if (filtres.modePaiement) parametresOperations.modePaiement = filtres.modePaiement
    if (filtres.sourceModule) parametresOperations.sourceModule = filtres.sourceModule

    try {
      const [
        listeCategories,
        resultatOperations,
        tableauBord,
        statistiquesFinancieres,
        synthese,
      ] = await Promise.all([
        listCategories(),
        listOperations(parametresOperations),
        getTableauDeBord(parametresPeriode),
        getStatistiquesFinancieres(parametresPeriode),
        getRapportSynthese(parametresPeriode),
      ])

      setCategories(listeCategories ?? [])
      setResultat(resultatOperations ?? resultatVide)
      setTableau(tableauBord)
      setStatistiques(statistiquesFinancieres)
      setRapport(synthese)
    } catch (e) {
      setErreur(
        await messageErreur(
          e,
          'Impossible de charger les données financières depuis le serveur.'
        )
      )
    } finally {
      setChargement(false)
    }
  }, [
    filtres.page,
    filtres.type,
    filtres.categorie,
    filtres.statutPaiement,
    filtres.modePaiement,
    filtres.sourceModule,
    rechercheActive,
    parametresPeriode,
  ])

  useEffect(() => {
    charger()
  }, [charger])

  const chargerHistorique = useCallback(async (operationId) => {
    if (!operationId) {
      setHistorique([])
      return
    }
    setChargementHistorique(true)
    try {
      setHistorique(await getHistoriqueOperation(operationId))
    } catch (e) {
      setNotification({
        ton: 'error',
        message: await messageErreur(
          e,
          "Impossible de charger l'historique de l'opération."
        ),
      })
    } finally {
      setChargementHistorique(false)
    }
  }, [])

  const changerFiltre = (cle, valeur) =>
    setFiltres((etat) => ({
      ...etat,
      [cle]: valeur,
      ...(cle === 'page' ? {} : { page: 1 }),
    }))

  const reinitialiserFiltres = () => setFiltres(filtresVides)

  const voirDetails = (operation) => {
    setHistorique([])
    setModale({ type: 'detailsOperation', element: operation })
    chargerHistorique(operation?.id)
  }

  const confirmerDesactivation = async () => {
    setEnvoi(true)
    const categorie = modale?.element
    try {
      await desactiverCategorie(categorie.id)
      setModale(null)
      setNotification({
        ton: 'success',
        message: 'Catégorie désactivée avec succès.',
      })
      await charger()
    } catch (e) {
      setModale(null)
      setNotification({
        ton: 'error',
        message: await messageErreur(
          e,
          'Impossible de désactiver la catégorie.'
        ),
      })
    } finally {
      setEnvoi(false)
    }
  }

  const enregistrerCategorie = async (donnees) => {
    setEnvoi(true)
    setErreurFormulaire('')
    const estModification = Boolean(modale?.element)
    try {
      if (estModification) {
        await updateCategorie(modale.element.id, donnees)
      } else {
        await createCategorie(donnees)
      }
      setModale(null)
      setNotification({
        ton: 'success',
        message: estModification
          ? 'Catégorie mise à jour avec succès.'
          : 'Catégorie créée avec succès.',
      })
      await charger()
    } catch (e) {
      setErreurFormulaire(
        await messageErreur(e, "Impossible d'enregistrer la catégorie.")
      )
    } finally {
      setEnvoi(false)
    }
  }

  const enregistrerOperation = async (donnees) => {
    setEnvoi(true)
    setErreurFormulaire('')
    const estModification = Boolean(modale?.element)
    try {
      const reponse = estModification
        ? await updateOperation(modale.element.id, donnees)
        : await createOperation(donnees)
      setModale(null)
      setNotification({
        ton: 'success',
        message: reponse?.dejaExistant
          ? 'Cette opération était déjà enregistrée avec cette référence.'
          : estModification
            ? 'Opération mise à jour avec succès.'
            : 'Opération enregistrée avec succès.',
      })
      await charger()
    } catch (e) {
      setErreurFormulaire(
        await messageErreur(e, "Impossible d'enregistrer l'opération.")
      )
    } finally {
      setEnvoi(false)
    }
  }

  const enregistrerPaiement = async (donnees) => {
    setEnvoi(true)
    setErreurFormulaire('')
    try {
      await creerPaiement(modale.element.id, donnees)
      setModale(null)
      setNotification({
        ton: 'success',
        message: 'Paiement enregistré avec succès.',
      })
      await charger()
    } catch (e) {
      setErreurFormulaire(
        await messageErreur(e, "Impossible d'enregistrer le paiement.")
      )
    } finally {
      setEnvoi(false)
    }
  }

  const confirmerAnnulation = async () => {
    setEnvoi(true)
    try {
      await annulerOperation(modale.element.id, motifAnnulation)
      setModale(null)
      setMotifAnnulation('')
      setNotification({
        ton: 'success',
        message: 'Opération annulée avec succès.',
      })
      await charger()
    } catch (e) {
      setNotification({
        ton: 'error',
        message: await messageErreur(
          e,
          "Impossible d'annuler l'opération."
        ),
      })
    } finally {
      setEnvoi(false)
    }
  }

  const telechargerCsv = async () => {
    setExportEnvoi(true)
    try {
      const contenu = await getRapportCsv(parametresPeriode)
      const fichier =
        contenu instanceof Blob
          ? contenu
          : new Blob([contenu], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(fichier)
      const lien = document.createElement('a')
      lien.href = url
      lien.download = `agrismart-operations-${datePourChamp(new Date())}.csv`
      document.body.appendChild(lien)
      lien.click()
      document.body.removeChild(lien)
      URL.revokeObjectURL(url)
      setNotification({ ton: 'success', message: 'Export CSV téléchargé.' })
    } catch (e) {
      setNotification({
        ton: 'error',
        message: await messageErreur(
          e,
          'Impossible de télécharger le fichier CSV.'
        ),
      })
    } finally {
      setExportEnvoi(false)
    }
  }

  const filtresActifs = Boolean(
    filtres.recherche ||
      filtres.type ||
      filtres.categorie ||
      filtres.statutPaiement ||
      filtres.modePaiement ||
      filtres.sourceModule ||
      filtres.debut ||
      filtres.fin
  )

  const totaux = tableau?.totaux ?? {}
  const periodeAffichage = {
    debut: parametresPeriode.debut,
    fin: parametresPeriode.fin,
  }

  return (
    <>
      <PageHeader
        titre="Gestion des finances"
        sousTitre="Revenus, dépenses, paiements et rapports — données réelles MongoDB"
        actions={
          peutEcrire ? (
            <>
              <Button
                onClick={() => setModale({ type: 'formOperation', element: null })}
              >
                <Plus className="h-4 w-4" />
                Nouvelle opération
              </Button>
              <Button
                variante="outline"
                onClick={() => setModale({ type: 'formCategorie', element: null })}
              >
                <Tags className="h-4 w-4" />
                Nouvelle catégorie
              </Button>
            </>
          ) : null
        }
      />

      {!peutEcrire && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Le module financier est réservé aux administrateurs et gestionnaires.
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
          titre="Revenus (période)"
          valeur={formatMontantTND(totaux.revenusMillimes)}
          icone={ArrowUpRight}
        />
        <StatCard
          titre="Dépenses (période)"
          valeur={formatMontantTND(totaux.depensesMillimes)}
          icone={ArrowDownRight}
        />
        <StatCard
          titre="Bénéfice (période)"
          valeur={formatMontantTND(totaux.beneficeMillimes)}
          icone={Scale}
        />
        <StatCard
          titre="Solde"
          valeur={formatMontantTND(totaux.soldeMillimes)}
          icone={Wallet}
          complement={`${formatNombre(totaux.impayees)} impayée(s)`}
        />
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-3 pt-3 sm:px-5">
          <Onglet
            actif={onglet === 'tableau'}
            label="Tableau de bord"
            onClick={() => setOnglet('tableau')}
          />
          <Onglet
            actif={onglet === 'operations'}
            label="Opérations"
            count={resultat?.pagination?.total ?? 0}
            onClick={() => setOnglet('operations')}
          />
          <Onglet
            actif={onglet === 'categories'}
            label="Catégories"
            count={categories.length}
            onClick={() => setOnglet('categories')}
          />
          <Onglet
            actif={onglet === 'rapports'}
            label="Rapports"
            onClick={() => setOnglet('rapports')}
          />
        </div>
      </Card>

      {onglet === 'operations' && (
        <Card className="mt-4 p-4 sm:p-5">
          <FiltresFinances
            valeurs={filtres}
            onChange={changerFiltre}
            categories={categories}
            onReset={reinitialiserFiltres}
            onExport={telechargerCsv}
            filtresActifs={filtresActifs}
            chargement={chargement}
          />
        </Card>
      )}

      {chargement ? (
        <Card className="mt-6">
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            Chargement des finances...
          </div>
        </Card>
      ) : (
        <div className="mt-6">
          {onglet === 'tableau' && (
            <DashboardFinancier
              tableau={tableau}
              statistiques={statistiques}
              chargement={false}
              onVoirOperations={() => setOnglet('operations')}
            />
          )}

          {onglet === 'operations' && (
            <OperationTable
              resultat={resultat}
              chargement={false}
              filtresActifs={filtresActifs}
              onVoir={voirDetails}
              onPayer={(operation) =>
                setModale({ type: 'paiement', element: operation })
              }
              onAnnuler={(operation) => {
                setMotifAnnulation('')
                setModale({ type: 'annulerOperation', element: operation })
              }}
              onPage={(page) => changerFiltre('page', page)}
            />
          )}

          {onglet === 'categories' && (
            <CategorieTable
              categories={categories}
              chargement={false}
              filtresActifs={false}
              onVoir={(categorie) =>
                setModale({ type: 'detailsCategorie', element: categorie })
              }
              onModifier={(categorie) =>
                setModale({ type: 'formCategorie', element: categorie })
              }
              onDesactiver={(categorie) =>
                setModale({ type: 'desactiverCategorie', element: categorie })
              }
            />
          )}

          {onglet === 'rapports' && (
            <RapportFinancier
              rapport={rapport}
              statistiques={statistiques}
              chargement={false}
              periode={periodeAffichage}
              onTelechargerCsv={telechargerCsv}
            />
          )}
        </div>
      )}

      {exportEnvoi && (
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Préparation du fichier CSV...
        </p>
      )}

      {/* Détail d'une catégorie */}
      <Modal
        ouvert={modale?.type === 'detailsCategorie'}
        titre={modale?.element?.libelle ?? 'Catégorie'}
        sousTitre={modale?.element?.code}
        onFermer={() => setModale(null)}
        largeur="max-w-xl"
      >
        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Type</span>
            <Badge ton={modale?.element?.type === 'Revenu' ? 'success' : 'danger'}>
              {modale?.element?.type}
            </Badge>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Couleur</span>
            <span className="font-mono">{modale?.element?.couleur ?? '—'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Statut</span>
            <span className="text-slate-800">
              {modale?.element?.actif === false ? 'Inactive' : 'Active'}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-slate-700">
            {modale?.element?.description || 'Aucune description.'}
          </p>
        </div>
      </Modal>

      <CategorieForm
        ouvert={modale?.type === 'formCategorie'}
        categorie={modale?.type === 'formCategorie' ? modale.element : null}
        onFermer={() => setModale(null)}
        onSoumettre={enregistrerCategorie}
        envoi={envoi}
        erreur={erreurFormulaire}
      />

      <OperationForm
        ouvert={modale?.type === 'formOperation'}
        categories={categories}
        operation={modale?.type === 'formOperation' ? modale.element : null}
        onFermer={() => setModale(null)}
        onSoumettre={enregistrerOperation}
        envoi={envoi}
        erreur={erreurFormulaire}
      />

      <OperationDetails
        ouvert={modale?.type === 'detailsOperation'}
        operation={modale?.type === 'detailsOperation' ? modale.element : null}
        historique={historique}
        chargementHistorique={chargementHistorique}
        onFermer={() => setModale(null)}
        onPayer={(operation) =>
          setModale({ type: 'paiement', element: operation })
        }
        onAnnuler={(operation) => {
          setMotifAnnulation('')
          setModale({ type: 'annulerOperation', element: operation })
        }}
      />

      <PaiementForm
        ouvert={modale?.type === 'paiement'}
        operation={modale?.type === 'paiement' ? modale.element : null}
        soldeRestant={
          modale?.type === 'paiement' ? soldeRestantOperation(modale.element) : 0
        }
        onFermer={() => setModale(null)}
        onSoumettre={enregistrerPaiement}
        envoi={envoi}
        erreur={erreurFormulaire}
      />

      <Modal
        ouvert={modale?.type === 'annulerOperation'}
        titre="Annuler l'opération"
        sousTitre={modale?.element?.reference}
        onFermer={() => setModale(null)}
        largeur="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">
            L'opération « {modale?.element?.libelle} » sera marquée comme annulée.
            Son historique et ses paiements sont conservés.
          </p>
          <Input
            label="Motif d'annulation"
            value={motifAnnulation}
            onChange={(evenement) => setMotifAnnulation(evenement.target.value)}
            placeholder="Précisez le motif"
            maxLength={500}
            required
          />
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <Button variante="outline" onClick={() => setModale(null)} disabled={envoi}>
              Conserver l'opération
            </Button>
            <Button
              variante="danger"
              onClick={confirmerAnnulation}
              disabled={envoi || !motifAnnulation.trim()}
            >
              {envoi ? 'Annulation...' : "Confirmer l'annulation"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        ouvert={modale?.type === 'desactiverCategorie'}
        titre="Désactiver la catégorie"
        message="Voulez-vous vraiment désactiver cette catégorie ? Elle ne pourra plus être utilisée pour de nouvelles opérations."
        nomElement={
          modale?.type === 'desactiverCategorie' ? modale.element?.libelle : ''
        }
        note="La catégorie est désactivée logiquement : elle reste enregistrée dans MongoDB avec son historique."
        envoi={envoi}
        labelConfirmer="Confirmer l'annulation"
        labelEnvoi="Annulation..."
        onAnnuler={() => setModale(null)}
        onConfirmer={confirmerDesactivation}
      />
    </>
  )
}
