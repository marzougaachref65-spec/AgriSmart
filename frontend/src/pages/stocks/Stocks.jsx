import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownToLine,
  Boxes,
  CalendarClock,
  ClipboardList,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import MouvementDetails from '../../components/stocks/MouvementDetails'
import MouvementForm from '../../components/stocks/MouvementForm'
import MouvementTable from '../../components/stocks/MouvementTable'
import ProduitDetails from '../../components/stocks/ProduitDetails'
import ProduitForm from '../../components/stocks/ProduitForm'
import ProduitTable from '../../components/stocks/ProduitTable'
import { useAuth } from '../../hooks/useAuth'
import {
  createMouvement,
  createProduit,
  deleteProduit,
  getAlertesStocks,
  getStatistiquesStocks,
  listMouvements,
  listProduits,
  updateProduit,
} from '../../services/stockService'
import {
  ALERTES,
  CATEGORIES_PRODUIT,
  LIBELLES_ALERTE,
  MOTIFS_ENTREE,
  MOTIFS_SORTIE,
  STATUTS_MOUVEMENT,
  TONS_ALERTE,
  formatDate,
  formatMontant,
  formatNombre,
} from '../../utils/stocks'

const statistiquesVides = {
  totalProduits: 0,
  valeurTotaleStock: 0,
  produitsStockFaible: 0,
  produitsExpires: 0,
  nombreMouvements: 0,
  entrees: { nombre: 0, quantite: 0 },
  sorties: { nombre: 0, quantite: 0 },
}

const alertesVides = {
  rupture: { count: 0, produits: [] },
  faible: { count: 0, produits: [] },
  proche: { count: 0, produits: [] },
  expire: { count: 0, produits: [] },
  delaiExpirationJours: 30,
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

export default function Stocks() {
  const { hasRole } = useAuth()
  const peutEcrire = hasRole('ADMIN', 'MANAGER')

  const [onglet, setOnglet] = useState('produits')

  const [rechercheProduit, setRechercheProduit] = useState('')
  const [rechercheProduitActive, setRechercheProduitActive] = useState('')
  const [categorie, setCategorie] = useState('')
  const [alerte, setAlerte] = useState('')

  const [rechercheMouvement, setRechercheMouvement] = useState('')
  const [rechercheMouvementActive, setRechercheMouvementActive] = useState('')
  const [produitFiltre, setProduitFiltre] = useState('')
  const [typeFiltre, setTypeFiltre] = useState('')
  const [motifFiltre, setMotifFiltre] = useState('')
  const [statutFiltre, setStatutFiltre] = useState('')
  const [depuis, setDepuis] = useState('')

  const [produits, setProduits] = useState([])
  const [produitsTous, setProduitsTous] = useState([])
  const [mouvements, setMouvements] = useState([])
  const [statistiques, setStatistiques] = useState(statistiquesVides)
  const [alertes, setAlertes] = useState(alertesVides)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [notification, setNotification] = useState(null)

  const [modale, setModale] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreurFormulaire, setErreurFormulaire] = useState('')

  useEffect(() => {
    const minuteur = setTimeout(
      () => setRechercheProduitActive(rechercheProduit),
      300
    )
    return () => clearTimeout(minuteur)
  }, [rechercheProduit])

  useEffect(() => {
    const minuteur = setTimeout(
      () => setRechercheMouvementActive(rechercheMouvement),
      300
    )
    return () => clearTimeout(minuteur)
  }, [rechercheMouvement])

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur('')

    const filtresProduits = {}
    if (rechercheProduitActive) filtresProduits.recherche = rechercheProduitActive
    if (categorie) filtresProduits.categorie = categorie
    if (alerte) filtresProduits.alerte = alerte

    const filtresMouvements = {}
    if (rechercheMouvementActive) {
      filtresMouvements.recherche = rechercheMouvementActive
    }
    if (produitFiltre) filtresMouvements.produit = produitFiltre
    if (typeFiltre) filtresMouvements.type = typeFiltre
    if (motifFiltre) filtresMouvements.motif = motifFiltre
    if (statutFiltre) filtresMouvements.statut = statutFiltre
    if (depuis) filtresMouvements.debut = new Date(depuis).toISOString()

    const parametresStats = depuis ? { debut: new Date(depuis).toISOString() } : {}

    try {
      const [listeProduits, listeComplete, listeMouvements, stats, etatAlertes] =
        await Promise.all([
          listProduits(filtresProduits),
          listProduits(),
          listMouvements(filtresMouvements),
          getStatistiquesStocks(parametresStats),
          getAlertesStocks(),
        ])

      setProduits(listeProduits)
      setProduitsTous(listeComplete)
      setMouvements(listeMouvements)
      setStatistiques(stats)
      setAlertes(etatAlertes)
    } catch (e) {
      setErreur(
        messageErreur(e, 'Impossible de charger les stocks depuis le serveur.')
      )
    } finally {
      setChargement(false)
    }
  }, [
    rechercheProduitActive,
    categorie,
    alerte,
    rechercheMouvementActive,
    produitFiltre,
    typeFiltre,
    motifFiltre,
    statutFiltre,
    depuis,
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

  const reinitialiserProduits = () => {
    setRechercheProduit('')
    setCategorie('')
    setAlerte('')
  }

  const reinitialiserMouvements = () => {
    setRechercheMouvement('')
    setProduitFiltre('')
    setTypeFiltre('')
    setMotifFiltre('')
    setStatutFiltre('')
    setDepuis('')
  }

  const enregistrerProduit = async (donnees) => {
    setEnvoi(true)
    setErreurFormulaire('')

    const estModification = Boolean(modale?.element)

    try {
      if (estModification) {
        await updateProduit(modale.element.id, donnees)
      } else {
        await createProduit(donnees)
      }

      setModale(null)
      setNotification({
        ton: 'success',
        message: estModification
          ? 'Produit mis à jour avec succès.'
          : 'Produit ajouté avec succès.',
      })
      await charger()
    } catch (e) {
      setErreurFormulaire(
        messageErreur(e, "Impossible d'enregistrer le produit.")
      )
    } finally {
      setEnvoi(false)
    }
  }

  const enregistrerMouvement = async (donnees) => {
    setEnvoi(true)
    setErreurFormulaire('')

    try {
      await createMouvement(donnees)
      setModale(null)
      setNotification({
        ton: 'success',
        message: 'Mouvement de stock enregistré avec succès.',
      })
      await charger()
    } catch (e) {
      setErreurFormulaire(
        messageErreur(e, "Impossible d'enregistrer le mouvement.")
      )
    } finally {
      setEnvoi(false)
    }
  }

  const supprimerProduit = async () => {
    setEnvoi(true)

    try {
      await deleteProduit(modale.element.id)
      setModale(null)
      setNotification({
        ton: 'success',
        message: 'Produit supprimé avec succès.',
      })
      await charger()
    } catch (e) {
      setModale(null)
      setNotification({
        ton: 'error',
        message: messageErreur(e, 'Impossible de supprimer ce produit.'),
      })
    } finally {
      setEnvoi(false)
    }
  }

  const filtresProduitsActifs = Boolean(rechercheProduit || categorie || alerte)
  const filtresMouvementsActifs = Boolean(
    rechercheMouvement ||
      produitFiltre ||
      typeFiltre ||
      motifFiltre ||
      statutFiltre ||
      depuis
  )
  const motifsDisponibles = [...MOTIFS_ENTREE, ...MOTIFS_SORTIE].filter(
    (motif, index, liste) => liste.indexOf(motif) === index
  )
  const nombreAlertes = ALERTES.reduce(
    (total, cle) => total + (alertes[cle]?.count ?? 0),
    0
  )

  const voirAlerte = (cle) => {
    setRechercheProduit('')
    setCategorie('')
    setAlerte(cle)
    setOnglet('produits')
  }

  return (
    <>
      <PageHeader
        titre="Gestion des stocks"
        sousTitre="Produits, mouvements et alertes — données réelles MongoDB"
        actions={
          peutEcrire &&
          (onglet === 'mouvements' ? (
            <Button onClick={() => setModale({ type: 'formMouvement', element: null })}>
              <ArrowDownToLine className="h-4 w-4" />
              Nouveau mouvement
            </Button>
          ) : (
            <Button onClick={() => setModale({ type: 'formProduit', element: null })}>
              <Plus className="h-4 w-4" />
              Ajouter un produit
            </Button>
          ))
        }
      />

      {!peutEcrire && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Votre rôle (<strong>Employé</strong>) autorise uniquement la
          consultation. La création, la modification, la suppression et les
          mouvements de stock sont réservés aux administrateurs et
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

      {/* Statistiques calculées sur les vraies données */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titre="Total produits"
          valeur={formatNombre(statistiques.totalProduits)}
          icone={Package}
        />
        <StatCard
          titre="Valeur totale du stock"
          valeur={formatMontant(statistiques.valeurTotaleStock)}
          icone={Boxes}
        />
        <StatCard
          titre="Stock faible"
          valeur={formatNombre(statistiques.produitsStockFaible)}
          icone={AlertTriangle}
        />
        <StatCard
          titre="Produits expirés"
          valeur={formatNombre(statistiques.produitsExpires)}
          icone={CalendarClock}
        />
        <StatCard
          titre="Mouvements enregistrés"
          valeur={formatNombre(statistiques.nombreMouvements)}
          icone={ClipboardList}
        />
        <StatCard
          titre="Entrées sur la période"
          valeur={formatNombre(statistiques.entrees?.nombre)}
          icone={ArrowDownToLine}
          complement={`${formatNombre(statistiques.entrees?.quantite)} unités`}
        />
        <StatCard
          titre="Sorties sur la période"
          valeur={formatNombre(statistiques.sorties?.nombre)}
          icone={ClipboardList}
          complement={`${formatNombre(statistiques.sorties?.quantite)} unités`}
        />
        <StatCard
          titre="Alertes actives"
          valeur={formatNombre(nombreAlertes)}
          icone={AlertTriangle}
          complement={`Expiration à ${alertes.delaiExpirationJours ?? 30} jours`}
        />
      </div>

      {/* Onglets */}
      <Card className="mt-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-3 pt-3 sm:px-5">
          <Onglet
            actif={onglet === 'produits'}
            label="Produits"
            count={produits.length}
            onClick={() => setOnglet('produits')}
          />
          <Onglet
            actif={onglet === 'mouvements'}
            label="Mouvements"
            count={mouvements.length}
            onClick={() => setOnglet('mouvements')}
          />
          <Onglet
            actif={onglet === 'alertes'}
            label="Alertes"
            count={nombreAlertes}
            onClick={() => setOnglet('alertes')}
          />
        </div>
      </Card>

      {/* Recherche et filtres */}
      <Card className="mt-4 p-4 sm:p-5">
        {onglet === 'produits' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Rechercher"
              icon={Search}
              placeholder="Nom ou fournisseur"
              value={rechercheProduit}
              onChange={(e) => setRechercheProduit(e.target.value)}
            />
            <SelectFiltre
              label="Catégorie"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              options={CATEGORIES_PRODUIT}
              placeholder="Toutes les catégories"
            />
            <SelectFiltre
              label="Alerte"
              value={alerte}
              onChange={(e) => setAlerte(e.target.value)}
              options={ALERTES.map((cle) => ({
                value: cle,
                label: LIBELLES_ALERTE[cle],
              }))}
              placeholder="Toutes les alertes"
            />
            <div className="flex items-end">
              <Button
                variante="outline"
                onClick={reinitialiserProduits}
                disabled={!filtresProduitsActifs}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>
        )}

        {onglet === 'mouvements' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Rechercher"
              icon={Search}
              placeholder="Produit, motif ou référence"
              value={rechercheMouvement}
              onChange={(e) => setRechercheMouvement(e.target.value)}
            />
            <SelectFiltre
              label="Produit"
              value={produitFiltre}
              onChange={(e) => setProduitFiltre(e.target.value)}
              options={produitsTous.map((p) => ({ value: p.id, label: p.name }))}
              placeholder="Tous les produits"
            />
            <SelectFiltre
              label="Type"
              value={typeFiltre}
              onChange={(e) => setTypeFiltre(e.target.value)}
              options={['Entrée', 'Sortie']}
              placeholder="Tous les types"
            />
            <SelectFiltre
              label="Statut"
              value={statutFiltre}
              onChange={(e) => setStatutFiltre(e.target.value)}
              options={STATUTS_MOUVEMENT}
              placeholder="Tous les statuts"
            />
            <Input
              label="Données depuis"
              type="date"
              value={depuis}
              onChange={(e) => setDepuis(e.target.value)}
            />
            <SelectFiltre
              label="Motif"
              value={motifFiltre}
              onChange={(e) => setMotifFiltre(e.target.value)}
              options={motifsDisponibles}
              placeholder="Tous les motifs"
            />
            <div className="flex items-end lg:col-span-2">
              <Button
                variante="outline"
                onClick={reinitialiserMouvements}
                disabled={!filtresMouvementsActifs}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>
        )}

        {onglet === 'alertes' && (
          <p className="text-sm text-slate-600">
            Alertes calculées à partir des quantités, seuils et dates
            d’expiration réellement enregistrés. Une priorité est appliquée :
            expiré &gt; rupture &gt; stock faible &gt; expiration proche.
          </p>
        )}
      </Card>

      {chargement && (
        <Card className="mt-6">
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            Chargement des données...
          </div>
        </Card>
      )}

      {!chargement && onglet === 'produits' && (
        <div className="mt-6">
          <ProduitTable
            produits={produits}
            chargement={chargement}
            peutEcrire={peutEcrire}
            filtresActifs={filtresProduitsActifs}
            onVoir={(produit) => setModale({ type: 'detailsProduit', element: produit })}
            onModifier={(produit) => setModale({ type: 'formProduit', element: produit })}
            onSupprimer={(produit) => setModale({ type: 'deleteProduit', element: produit })}
            onMouvement={(produit) =>
              setModale({ type: 'formMouvement', element: produit })
            }
          />
        </div>
      )}

      {!chargement && onglet === 'mouvements' && (
        <div className="mt-6">
          <MouvementTable
            mouvements={mouvements}
            chargement={chargement}
            filtresActifs={filtresMouvementsActifs}
            onVoir={(mouvement) =>
              setModale({ type: 'detailsMouvement', element: mouvement })
            }
          />
        </div>
      )}

      {!chargement && onglet === 'alertes' && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {ALERTES.map((cle) => (
            <Card key={cle} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge ton={TONS_ALERTE[cle]}>{LIBELLES_ALERTE[cle]}</Badge>
                  <span className="text-sm font-semibold text-slate-800">
                    {alertes[cle]?.count ?? 0}
                  </span>
                </div>
                <Button
                  variante="ghost"
                  taille="sm"
                  onClick={() => voirAlerte(cle)}
                >
                  Voir les produits
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                {(alertes[cle]?.produits ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun produit concerné.</p>
                ) : (
                  alertes[cle].produits.map((produit) => (
                    <div
                      key={produit.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">
                          {produit.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          Expiration : {formatDate(produit.dateExpiration)}
                        </p>
                      </div>
                      <span className="shrink-0 text-slate-600">
                        {formatNombre(produit.quantiteDisponible)} {produit.unite}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProduitForm
        ouvert={modale?.type === 'formProduit'}
        produit={modale?.type === 'formProduit' ? modale.element : null}
        onFermer={() => setModale(null)}
        onSoumettre={enregistrerProduit}
        envoi={envoi}
        erreur={erreurFormulaire}
      />

      <ProduitDetails
        ouvert={modale?.type === 'detailsProduit'}
        produit={modale?.type === 'detailsProduit' ? modale.element : null}
        onFermer={() => setModale(null)}
      />

      <MouvementForm
        ouvert={modale?.type === 'formMouvement'}
        produits={produitsTous}
        produitInitial={modale?.type === 'formMouvement' ? modale.element : null}
        onFermer={() => setModale(null)}
        onSoumettre={enregistrerMouvement}
        envoi={envoi}
        erreur={erreurFormulaire}
      />

      <MouvementDetails
        ouvert={modale?.type === 'detailsMouvement'}
        mouvement={modale?.type === 'detailsMouvement' ? modale.element : null}
        onFermer={() => setModale(null)}
      />

      <ConfirmDialog
        ouvert={modale?.type === 'deleteProduit'}
        message="Voulez-vous vraiment supprimer ce produit ? La suppression sera refusée si un mouvement de stock y est associé."
        nomElement={modale?.type === 'deleteProduit' ? modale.element?.name : ''}
        envoi={envoi}
        onAnnuler={() => setModale(null)}
        onConfirmer={supprimerProduit}
      />
    </>
  )
}
