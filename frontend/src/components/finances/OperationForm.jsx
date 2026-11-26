import { useEffect, useMemo, useState } from 'react'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'
import {
  DEVISES,
  LIBELLES_DEVISE,
  LIBELLES_TYPE_OPERATION,
  MODES_PAIEMENT,
  MODULES_SOURCE,
  TYPES_OPERATION,
  categoriesPourType,
  datePourChamp,
  millimesVersTexte,
  optionnel,
  saisieVersMillimes,
  typeInitialPourCategories,
} from '../../utils/finances'

const formulaireVide = {
  type: 'Depense',
  montant: '',
  devise: 'TND',
  date: datePourChamp(new Date()),
  dateEcheance: '',
  categorie: '',
  libelle: '',
  description: '',
  reference: '',
  sourceModule: '',
  referenceId: '',
  libelleSource: '',
  modePaiement: 'Espèces',
  montantPaiement: '',
  notePaiement: '',
}

function Select({ label, value, onChange, options, placeholder, requis = false, disabled = false }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}{requis && ' *'}
      </label>
      <select
        value={value}
        onChange={onChange}
        required={requis}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
      >
        {placeholder && <option value="">{placeholder}</option>}
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

/** Date YYYY-MM-DD → ISO, dans le fuseau local de l'utilisateur. */
function enIso(dateChamp) {
  if (!dateChamp) return null
  return new Date(`${dateChamp}T00:00:00`).toISOString()
}

export default function OperationForm({
  ouvert,
  categories,
  operation,
  onFermer,
  onSoumettre,
  envoi = false,
  erreur = '',
}) {
  const [formulaire, setFormulaire] = useState(() => ({
    ...formulaireVide,
    type: typeInitialPourCategories(categories),
  }))
  const estModification = Boolean(operation)

  useEffect(() => {
    if (!ouvert) return
    setFormulaire({
      ...formulaireVide,
      type: operation?.type ?? typeInitialPourCategories(categories),
      montant:
        operation?.montantMillimes !== undefined
          ? millimesVersTexte(operation.montantMillimes)
          : (operation?.montant ?? ''),
      devise: operation?.devise ?? 'TND',
      date: datePourChamp(operation?.date) || datePourChamp(new Date()),
      dateEcheance: datePourChamp(operation?.dateEcheance),
      categorie: operation?.categorie?.id ?? '',
      libelle: operation?.libelle ?? '',
      description: operation?.description ?? '',
      reference: operation?.reference ?? '',
      sourceModule: operation?.source?.module ?? '',
      referenceId: operation?.source?.referenceId ?? '',
      libelleSource: operation?.source?.libelle ?? '',
      modePaiement: 'Espèces',
      montantPaiement: '',
      notePaiement: '',
    })
  }, [ouvert, operation, categories])

  const categoriesDisponibles = useMemo(
    () => categoriesPourType(categories, formulaire.type),
    [categories, formulaire.type]
  )

  const modifier = (cle) => (evenement) =>
    setFormulaire((etat) => {
      const suivant = { ...etat, [cle]: evenement.target.value }
      if (cle === 'type' && etat.categorie) {
        const categorie = (categories ?? []).find((element) => element.id === etat.categorie)
        if (
          categorie &&
          categorie.type !== suivant.type &&
          categorie.type !== 'Les deux'
        ) {
          suivant.categorie = ''
        }
      }
      return suivant
    })

  const soumettre = (evenement) => {
    evenement.preventDefault()

    if (estModification) {
      // Le contrat PUT n'autorise que ces quatre champs.
      const donnees = {
        libelle: formulaire.libelle,
        description: optionnel(formulaire.description),
        dateEcheance: enIso(formulaire.dateEcheance),
        categorie: formulaire.categorie || undefined,
      }
      onSoumettre(donnees)
      return
    }

    const donnees = {
      type: formulaire.type,
      /* La saisie reste en TND : la conversion en millimes est faite une seule
         fois par le backend. Aucun calcul flottant côté client. */
      montant: formulaire.montant,
      devise: formulaire.devise,
      date: enIso(formulaire.date),
      categorie: formulaire.categorie,
      libelle: formulaire.libelle,
    }

    const dateEcheance = enIso(formulaire.dateEcheance)
    if (dateEcheance) donnees.dateEcheance = dateEcheance

    const description = optionnel(formulaire.description)
    const reference = optionnel(formulaire.reference)
    if (description) donnees.description = description
    if (reference) donnees.reference = reference

    if (formulaire.sourceModule) {
      donnees.source = { module: formulaire.sourceModule }
      const referenceId = optionnel(formulaire.referenceId)
      const libelleSource = optionnel(formulaire.libelleSource)
      if (referenceId) donnees.source.referenceId = referenceId
      if (libelleSource) donnees.source.libelle = libelleSource
    }

    const montantPaiementMillimes = saisieVersMillimes(formulaire.montantPaiement)
    if (
      formulaire.montantPaiement !== '' &&
      Number.isFinite(montantPaiementMillimes) &&
      montantPaiementMillimes > 0
    ) {
      donnees.paiementInitial = {
        mode: formulaire.modePaiement,
        montant: formulaire.montantPaiement,
      }
      const note = optionnel(formulaire.notePaiement)
      if (note) donnees.paiementInitial.note = note
    }

    onSoumettre(donnees)
  }

  return (
    <Modal
      ouvert={ouvert}
      titre={estModification ? 'Modifier l’opération' : 'Nouvelle opération'}
      sousTitre={
        estModification
          ? 'Type, montant, date et source sont immuables — seule la saisie est modifiable'
          : 'Enregistrement d’une opération financière réelle en TND (DT)'
      }
      onFermer={onFermer}
      largeur="max-w-4xl"
    >
      <form onSubmit={soumettre} className="space-y-4">
        {erreur && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {erreur}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Type"
            value={formulaire.type}
            onChange={modifier('type')}
            options={TYPES_OPERATION.map((type) => ({
              value: type,
              label: type === 'Depense' ? 'Dépense' : 'Revenu',
            }))}
            requis
            disabled={estModification}
          />
          <Input
            label="Montant (DT)"
            type="number"
            step="0.001"
            min="0.001"
            value={formulaire.montant}
            onChange={modifier('montant')}
            placeholder="0.000"
            disabled={estModification}
            required={!estModification}
          />
          <Select
            label="Devise"
            value={formulaire.devise}
            onChange={modifier('devise')}
            options={DEVISES.map((devise) => ({
              value: devise,
              label: LIBELLES_DEVISE[devise] ?? devise,
            }))}
            requis
            disabled
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Date de l'opération"
            type="date"
            value={formulaire.date}
            onChange={modifier('date')}
            disabled={estModification}
            required={!estModification}
          />
          <Input
            label="Date d'échéance (facultative)"
            type="date"
            value={formulaire.dateEcheance}
            onChange={modifier('dateEcheance')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Catégorie"
            value={formulaire.categorie}
            onChange={modifier('categorie')}
            options={categoriesDisponibles.map((categorie) => ({
              value: categorie.id,
              label: categorie.libelle,
            }))}
            placeholder="Choisir une catégorie"
            requis
          />
          {categoriesDisponibles.length === 0 && (
            <p
              role="status"
              className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
            >
              Aucune catégorie active n’est compatible avec le type «{' '}
              {LIBELLES_TYPE_OPERATION[formulaire.type] ?? formulaire.type} ».
              Créez d’abord une catégorie depuis « Nouvelle catégorie ».
            </p>
          )}
          <Input
            label="Libellé"
            value={formulaire.libelle}
            onChange={modifier('libelle')}
            placeholder="Ex. Achat d'aliment bétail"
            maxLength={150}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            rows={3}
            value={formulaire.description}
            onChange={modifier('description')}
            maxLength={2000}
            placeholder="Détails facultatifs"
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Origine de l'opération</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Module source"
              value={formulaire.sourceModule}
              onChange={modifier('sourceModule')}
              options={MODULES_SOURCE}
              placeholder="Aucune source"
              disabled={estModification}
            />
            <Input
              label="Référence liée"
              value={formulaire.referenceId}
              onChange={modifier('referenceId')}
              placeholder="Identifiant du module"
              maxLength={100}
              disabled={estModification || !formulaire.sourceModule}
            />
            <Input
              label="Libellé source"
              value={formulaire.libelleSource}
              onChange={modifier('libelleSource')}
              placeholder="Ex. Lot ovins A"
              maxLength={150}
              disabled={estModification || !formulaire.sourceModule}
            />
          </div>
          <Input
            label="Référence (facultative — générée automatiquement si vide)"
            value={formulaire.reference}
            onChange={modifier('reference')}
            placeholder="Référence métier"
            maxLength={100}
            disabled={estModification}
          />
        </div>

        {!estModification && (
          <div className="space-y-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              Paiement initial (facultatif)
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Mode"
                value={formulaire.modePaiement}
                onChange={modifier('modePaiement')}
                options={MODES_PAIEMENT}
                requis
              />
              <Input
                label="Montant payé (DT)"
                type="number"
                step="0.001"
                min="0"
                value={formulaire.montantPaiement}
                onChange={modifier('montantPaiement')}
                placeholder="0.000"
                error={
                  formulaire.montantPaiement !== '' &&
                  Number.isFinite(montantPaiementMillimes) &&
                  Number.isFinite(saisieVersMillimes(formulaire.montant)) &&
                  montantPaiementMillimes > saisieVersMillimes(formulaire.montant)
                    ? 'Le montant payé ne peut pas dépasser le montant de l’opération.'
                    : ''
                }
              />
              <Input
                label="Note"
                value={formulaire.notePaiement}
                onChange={modifier('notePaiement')}
                placeholder="Facultatif"
                maxLength={300}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variante="outline" onClick={onFermer} disabled={envoi}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={
              envoi ||
              !formulaire.libelle.trim() ||
              !formulaire.categorie ||
              (!estModification &&
                (!formulaire.montant ||
                  !Number.isFinite(saisieVersMillimes(formulaire.montant)) ||
                  saisieVersMillimes(formulaire.montant) <= 0))
            }
          >
            {envoi ? 'Enregistrement...' : 'Enregistrer l’opération'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
