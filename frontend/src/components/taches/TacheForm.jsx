import { useEffect, useMemo, useState } from 'react'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'
import {
  MODULES_CIBLE,
  PRIORITES_TACHE,
  STATUTS_TACHE,
  datePourChamp,
  nomEmploye,
} from '../../utils/taches'

const formulaireVide = {
  titre: '',
  description: '',
  priorite: 'Moyenne',
  statut: 'À faire',
  dateDebut: datePourChamp(new Date()),
  dateEcheance: datePourChamp(new Date(Date.now() + 7 * 86400000)),
  employes: [],
  module: 'Autre',
  referenceId: '',
  motifAnnulation: '',
}

function Select({ label, value, onChange, options, placeholder, requis = false }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {requis && ' *'}
      </label>
      <select
        value={value}
        onChange={onChange}
        required={requis}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
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

export default function TacheForm({
  ouvert,
  tache,
  employes,
  animaux,
  cycles,
  parcelles,
  onFermer,
  onSoumettre,
  envoi = false,
  erreur = '',
}) {
  const [formulaire, setFormulaire] = useState(formulaireVide)
  const [erreurLocale, setErreurLocale] = useState('')
  const estModification = Boolean(tache)

  useEffect(() => {
    if (!ouvert) return
    setErreurLocale('')
    setFormulaire(
      tache
        ? {
            titre: tache.titre ?? '',
            description: tache.description ?? '',
            priorite: tache.priorite ?? 'Moyenne',
            statut: tache.statut ?? 'À faire',
            dateDebut: datePourChamp(tache.dateDebut),
            dateEcheance: datePourChamp(tache.dateEcheance),
            employes: (tache.employes ?? []).map((element) => element.id),
            module: tache.cible?.module ?? 'Autre',
            referenceId: tache.cible?.referenceId ?? '',
            motifAnnulation: tache.motifAnnulation ?? '',
          }
        : {
            ...formulaireVide,
            dateDebut: datePourChamp(new Date()),
            dateEcheance: datePourChamp(new Date(Date.now() + 7 * 86400000)),
          }
    )
  }, [ouvert, tache])

  const optionsCible = useMemo(() => {
    if (formulaire.module === 'Animaux') {
      return animaux.map((element) => ({
        value: element.id,
        label: `${element.name} — ${element.espece ?? ''}`.trim(),
      }))
    }
    if (formulaire.module === 'Cultures') {
      return cycles.map((element) => ({
        value: element.id,
        label: `${element.typeCulture}${
          element.variete ? ` — ${element.variete}` : ''
        }`,
      }))
    }
    if (formulaire.module === 'Parcelles') {
      return parcelles.map((element) => ({
        value: element.id,
        label: element.name,
      }))
    }
    return []
  }, [formulaire.module, animaux, cycles, parcelles])

  const modifier = (cle) => (evenement) =>
    setFormulaire((etat) => ({ ...etat, [cle]: evenement.target.value }))

  const modifierModule = (evenement) =>
    setFormulaire((etat) => ({
      ...etat,
      module: evenement.target.value,
      referenceId: '',
    }))

  const modifierEmployes = (evenement) =>
    setFormulaire((etat) => ({
      ...etat,
      employes: Array.from(
        evenement.target.selectedOptions,
        (option) => option.value
      ),
    }))

  const soumettre = (evenement) => {
    evenement.preventDefault()
    setErreurLocale('')

    if (!formulaire.titre.trim()) {
      setErreurLocale('Le titre de la tâche est requis.')
      return
    }
    if (!formulaire.dateDebut || !formulaire.dateEcheance) {
      setErreurLocale('Les dates de début et d’échéance sont requises.')
      return
    }
    const debut = new Date(`${formulaire.dateDebut}T00:00:00`).getTime()
    const echeance = new Date(`${formulaire.dateEcheance}T00:00:00`).getTime()
    if (echeance < debut) {
      setErreurLocale("La date d'échéance ne peut pas précéder la date de début.")
      return
    }
    if (formulaire.module !== 'Autre' && !formulaire.referenceId) {
      setErreurLocale('Veuillez choisir un élément cible.')
      return
    }
    if (formulaire.statut === 'Annulée' && !formulaire.motifAnnulation.trim()) {
      setErreurLocale('Le motif est requis pour annuler une tâche.')
      return
    }

    onSoumettre({
      titre: formulaire.titre,
      description: formulaire.description || null,
      priorite: formulaire.priorite,
      statut: formulaire.statut,
      dateDebut: new Date(`${formulaire.dateDebut}T00:00:00`).toISOString(),
      dateEcheance: new Date(`${formulaire.dateEcheance}T00:00:00`).toISOString(),
      employes: formulaire.employes,
      cible: {
        module: formulaire.module,
        referenceId: formulaire.module === 'Autre' ? null : formulaire.referenceId,
      },
      motifAnnulation: formulaire.motifAnnulation || null,
    })
  }

  return (
    <Modal
      ouvert={ouvert}
      titre={estModification ? 'Modifier la tâche' : 'Nouvelle tâche agricole'}
      sousTitre="Affectation à un ou plusieurs employés — lien facultatif avec une cible réelle"
      onFermer={onFermer}
      largeur="max-w-4xl"
    >
      <form onSubmit={soumettre} className="space-y-4">
        {(erreur || erreurLocale) && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {erreur || erreurLocale}
          </div>
        )}

        <Input
          label="Titre"
          value={formulaire.titre}
          onChange={modifier('titre')}
          placeholder="Ex. Irrigation du champ nord"
          maxLength={150}
          required
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            rows={3}
            value={formulaire.description}
            onChange={modifier('description')}
            maxLength={2000}
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Priorité"
            value={formulaire.priorite}
            onChange={modifier('priorite')}
            options={PRIORITES_TACHE}
            requis
          />
          <Select
            label="Statut"
            value={formulaire.statut}
            onChange={modifier('statut')}
            options={STATUTS_TACHE}
            requis
          />
          <Input
            label="Date de début"
            type="date"
            value={formulaire.dateDebut}
            onChange={modifier('dateDebut')}
            required
          />
          <Input
            label="Date d'échéance"
            type="date"
            value={formulaire.dateEcheance}
            onChange={modifier('dateEcheance')}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Employés affectés (sélection multiple)
          </label>
          <select
            multiple
            value={formulaire.employes}
            onChange={modifierEmployes}
            size={Math.min(Math.max(employes.length, 3), 6)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {employes.map((element) => (
              <option key={element.id} value={element.id}>
                {nomEmploye(element)} — {element.fonction}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Maintenez Ctrl (ou ⌘) pour sélectionner plusieurs employés actifs.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Lier à une cible (facultatif)"
            value={formulaire.module}
            onChange={modifierModule}
            options={MODULES_CIBLE}
            requis
          />
          {formulaire.module !== 'Autre' && (
            <Select
              label="Élément cible"
              value={formulaire.referenceId}
              onChange={modifier('referenceId')}
              options={optionsCible}
              placeholder="Choisir un élément"
              requis
            />
          )}
        </div>

        {formulaire.statut === 'Annulée' && (
          <Input
            label="Motif d'annulation"
            value={formulaire.motifAnnulation}
            onChange={modifier('motifAnnulation')}
            placeholder="Ex. Conditions météorologiques défavorables"
            maxLength={500}
            required
          />
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variante="outline" onClick={onFermer} disabled={envoi}>
            Annuler
          </Button>
          <Button type="submit" disabled={envoi}>
            {envoi
              ? 'Enregistrement...'
              : estModification
                ? 'Enregistrer les modifications'
                : 'Créer la tâche'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
