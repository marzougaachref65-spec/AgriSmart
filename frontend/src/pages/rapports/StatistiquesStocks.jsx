import { AlertTriangle, Boxes, ClipboardCheck, PackageSearch } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import Badge from '../../components/common/Badge'
import { Card } from '../../components/common/Card'
import StatCard from '../../components/common/StatCard'
import EtatVide from '../../components/rapports/EtatVide'
import GraphiqueRapport from '../../components/rapports/GraphiqueRapport'
import TableauRapport from '../../components/rapports/TableauRapport'
import {
  LIBELLES_ALERTE,
  TONS_ALERTE,
  TONS_STATUT_MOUVEMENT,
  TONS_TYPE_MOUVEMENT,
} from '../../utils/stocks'
import {
  formatDate,
  formatNombre,
  formatValeurBrute,
  periodeAffichee,
} from '../../utils/rapports'

export default function StatistiquesStocks({ rapport, chargement }) {
  if (chargement || !rapport) {
    return (
      <Card>
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          Calcul du stock depuis le grand livre...
        </div>
      </Card>
    )
  }

  const { indicateurs = {}, incoherences = {}, details = {}, source = {} } = rapport
  const entrees = indicateurs.entrees ?? { nombre: 0, quantite: 0 }
  const sorties = indicateurs.sorties ?? { nombre: 0, quantite: 0 }
  const alertes = indicateurs.alertes ?? {}
  const mouvementsDonnees = [
    { libelle: 'Entrées', valeur: entrees.quantite ?? 0 },
    { libelle: 'Sorties', valeur: sorties.quantite ?? 0 },
  ]
  const aDesIncoherences =
    (incoherences.nombreProduitsDesynchronises ?? 0) > 0 ||
    (incoherences.nombreMouvementsEnAttente ?? 0) > 0

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">Période :</span>{' '}
        {periodeAffichee(rapport)} — {source.precision ?? ''}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titre="Produits enregistrés"
          valeur={formatNombre(indicateurs.totalProduits ?? 0)}
          icone={PackageSearch}
          complement="Grand livre des mouvements confirmés"
        />
        <StatCard
          titre="Valeur du stock"
          valeur={formatValeurBrute(indicateurs.valeurTotaleStockLedger ?? 0)}
          icone={Boxes}
          complement="Prix unitaire × quantité du grand livre"
        />
        <StatCard
          titre="Stock faible / rupture"
          valeur={formatNombre((alertes.faible ?? 0) + (alertes.rupture ?? 0))}
          icone={AlertTriangle}
          complement={`${formatNombre(alertes.expire ?? 0)} expiré(s)`}
        />
        <StatCard
          titre="Mouvements enregistrés"
          valeur={formatNombre(indicateurs.nombreMouvements ?? 0)}
          icone={ClipboardCheck}
          complement={`${formatNombre(entrees.nombre ?? 0)} entrées · ${formatNombre(
            sorties.nombre ?? 0
          )} sorties`}
        />
      </div>

      {aDesIncoherences && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Incohérences signalées — lecture seule
          </div>
          <p className="mt-1 text-xs">
            {formatNombre(incoherences.nombreProduitsDesynchronises ?? 0)} projetion(s)
            divergent(e)s et{' '}
            {formatNombre(incoherences.nombreMouvementsEnAttente ?? 0)} mouvement(s) en
            attente. Aucune correction ni resynchronisation n’a été appliquée par ce
            rapport.
          </p>
        </div>
      )}

      <GraphiqueRapport
        titre="Entrées et sorties sur la période"
        sousTitre="Quantités cumulées des mouvements confirmés"
        donnees={mouvementsDonnees}
        nomSerie="Quantité"
        formatterValeur={(valeur) => formatNombre(valeur)}
      />

      <TableauRapport
        titre="Détail des produits"
        sousTitre="Quantité calculée par le grand livre, jamais par la projection"
        colonnes={[
          { cle: 'name', libelle: 'Produit' },
          { cle: 'categorie', libelle: 'Catégorie' },
          {
            cle: 'quantiteLedger',
            libelle: 'Quantité (ledger)',
            alignement: 'droite',
            rendu: (ligne) =>
              `${formatNombre(ligne.quantiteLedger ?? 0)} ${ligne.unite ?? ''}`.trim(),
          },
          {
            cle: 'seuilMinimum',
            libelle: 'Seuil',
            alignement: 'droite',
            rendu: (ligne) => formatNombre(ligne.seuilMinimum ?? 0),
          },
          {
            cle: 'prixUnitaire',
            libelle: 'Prix unitaire',
            alignement: 'droite',
            rendu: (ligne) => formatValeurBrute(ligne.prixUnitaire ?? 0),
          },
          {
            cle: 'alerte',
            libelle: 'Alerte',
            rendu: (ligne) =>
              ligne.alerte ? (
                <Badge ton={TONS_ALERTE[ligne.alerte] ?? 'neutral'}>
                  {LIBELLES_ALERTE[ligne.alerte] ?? ligne.alerte}
                </Badge>
              ) : (
                <span className="text-slate-400">Aucune</span>
              ),
          },
          {
            cle: 'dateExpiration',
            libelle: 'Expiration',
            rendu: (ligne) => formatDate(ligne.dateExpiration),
          },
        ]}
        donnees={details.produits?.elements ?? []}
        tronque={details.produits?.tronque}
        total={details.produits?.total ?? 0}
        messageVide="Aucun produit n'est enregistré dans la collection produits."
      />

      <TableauRapport
        titre="Détail des mouvements"
        sousTitre="Historique des mouvements confirmés sur la période"
        colonnes={[
          { cle: 'reference', libelle: 'Référence' },
          { cle: 'produit', libelle: 'Produit', rendu: (ligne) => ligne.produit?.name ?? '—' },
          {
            cle: 'type',
            libelle: 'Type',
            rendu: (ligne) => (
              <Badge ton={TONS_TYPE_MOUVEMENT[ligne.type] ?? 'neutral'}>
                {ligne.type ?? '—'}
              </Badge>
            ),
          },
          {
            cle: 'quantite',
            libelle: 'Quantité',
            alignement: 'droite',
            rendu: (ligne) => formatNombre(ligne.quantite ?? 0),
          },
          {
            cle: 'date',
            libelle: 'Date',
            rendu: (ligne) => formatDate(ligne.date),
          },
          {
            cle: 'statut',
            libelle: 'Statut',
            rendu: (ligne) => (
              <Badge ton={TONS_STATUT_MOUVEMENT[ligne.statut] ?? 'neutral'}>
                {ligne.statut ?? '—'}
              </Badge>
            ),
          },
        ]}
        donnees={details.mouvements?.elements ?? []}
        tronque={details.mouvements?.tronque}
        total={details.mouvements?.total ?? 0}
        messageVide="Aucun mouvement confirmé sur la période sélectionnée."
      />

      {(details.produits?.elements ?? []).length === 0 &&
        (details.mouvements?.elements ?? []).length === 0 && (
          <EtatVide
            titre="Aucune donnée de stock"
            message="Les collections produits et mouvementstocks ne contiennent aucun document correspondant."
            icone={Boxes}
          />
        )}
    </div>
  )
}
