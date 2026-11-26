import Badge from '../common/Badge'
import Modal from '../common/Modal'
import {
  formatDate,
  formatDateHeure,
  formatMontant,
  formatNombre,
  LIBELLES_ALERTE,
  TONS_ALERTE,
} from '../../utils/stocks'

function Ligne({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="break-words text-sm text-slate-800">{children}</span>
    </div>
  )
}

export default function ProduitDetails({ ouvert, produit, onFermer }) {
  if (!produit) return null

  return (
    <Modal
      ouvert={ouvert}
      titre={produit.name}
      sousTitre={`Produit #${produit.id.slice(-8)}`}
      onFermer={onFermer}
    >
      <div className="space-y-1">
        <Ligne label="Catégorie">{produit.categorie}</Ligne>
        <Ligne label="Quantité disponible">
          <span className="font-semibold">
            {formatNombre(produit.quantiteDisponible)} {produit.unite}
          </span>
        </Ligne>
        <Ligne label="Seuil minimum">
          {formatNombre(produit.seuilMinimum)} {produit.unite}
        </Ligne>
        <Ligne label="Prix unitaire">{formatMontant(produit.prixUnitaire)}</Ligne>
        <Ligne label="Valeur du stock">
          {formatMontant(produit.quantiteDisponible * produit.prixUnitaire)}
        </Ligne>
        <Ligne label="Fournisseur">{produit.fournisseur || '—'}</Ligne>
        <Ligne label="Date d'expiration">{formatDate(produit.dateExpiration)}</Ligne>
        <Ligne label="Alerte">
          {produit.alerte ? (
            <Badge ton={TONS_ALERTE[produit.alerte] ?? 'neutral'}>
              {LIBELLES_ALERTE[produit.alerte] ?? produit.alerte}
            </Badge>
          ) : (
            <span className="text-slate-500">Aucune</span>
          )}
        </Ligne>
        <Ligne label="Créé le">{formatDateHeure(produit.createdAt)}</Ligne>
      </div>
    </Modal>
  )
}
