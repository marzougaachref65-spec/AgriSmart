import { useEffect, useState } from 'react'
import { Stethoscope } from 'lucide-react'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'
import {
  GRAVITES_MALADIE,
  NATURES_CONSULTATION,
  STATUTS_MALADIE,
  STATUTS_TRAITEMENT,
  TYPES_EVENEMENT,
  datePourChamp,
  optionnel,
} from '../../utils/veterinaire'

const formulaireVide = {
  animal: '',
  type: 'Consultation',
  date: datePourChamp(new Date()),
  libelle: '',
  notes: '',
  reference: '',

  vaccin: '',
  lot: '',
  dateRappel: '',

  nomMaladie: '',
  diagnostic: '',
  gravite: 'Légère',
  dateDebut: '',
  dateFin: '',
  statutMaladie: 'En cours',

  medicament: '',
  posologie: '',
  dose: '',
  motif: '',
  prescripteur: '',
  statutTraitement: 'En cours',

  nature: 'Consultation',
  veterinaire: '',
  cout: '',
}

function Select({ label, value, onChange, options, requis = false }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}{requis && ' *'}
      </label>
      <select
        value={value}
        onChange={onChange}
        required={requis}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {!requis && <option value="">—</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function EvenementForm({
  ouvert,
  animaux,
  animalParDefaut = '',
  onFermer,
  onSoumettre,
  envoi = false,
  erreur = '',
}) {
  const [formulaire, setFormulaire] = useState(formulaireVide)

  useEffect(() => {
    if (!ouvert) return
    setFormulaire({
      ...formulaireVide,
      animal: animalParDefaut || animaux[0]?.id || '',
      date: datePourChamp(new Date()),
    })
  }, [ouvert, animalParDefaut, animaux])

  const modifier = (cle) => (evenement) =>
    setFormulaire((etat) => ({ ...etat, [cle]: evenement.target.value }))

  const soumettre = (evenement) => {
    evenement.preventDefault()
    const commun = {
      animal: formulaire.animal,
      type: formulaire.type,
      date: formulaire.date
        ? new Date(`${formulaire.date}T00:00:00`).toISOString()
        : undefined,
      libelle: formulaire.libelle,
      notes: formulaire.notes,
      reference: formulaire.reference,
    }

    let specifique = {}
    if (formulaire.type === 'Vaccination') {
      specifique = {
        vaccin: formulaire.vaccin,
        lot: formulaire.lot,
        dateRappel: formulaire.dateRappel
          ? new Date(`${formulaire.dateRappel}T00:00:00`).toISOString()
          : null,
      }
    } else if (formulaire.type === 'Maladie') {
      specifique = {
        nomMaladie: formulaire.nomMaladie,
        diagnostic: formulaire.diagnostic,
        gravite: formulaire.gravite,
        statutMaladie: formulaire.statutMaladie,
        dateDebut: formulaire.dateDebut
          ? new Date(`${formulaire.dateDebut}T00:00:00`).toISOString()
          : null,
        dateFin: formulaire.dateFin
          ? new Date(`${formulaire.dateFin}T00:00:00`).toISOString()
          : null,
      }
    } else if (formulaire.type === 'Traitement') {
      specifique = {
        medicament: formulaire.medicament,
        posologie: formulaire.posologie,
        dose: formulaire.dose === '' ? null : Number(formulaire.dose),
        motif: formulaire.motif,
        prescripteur: formulaire.prescripteur,
        statutTraitement: formulaire.statutTraitement,
        dateDebut: formulaire.dateDebut
          ? new Date(`${formulaire.dateDebut}T00:00:00`).toISOString()
          : null,
        dateFin: formulaire.dateFin
          ? new Date(`${formulaire.dateFin}T00:00:00`).toISOString()
          : null,
      }
    } else {
      specifique = {
        nature: formulaire.nature,
        motif: formulaire.motif,
        veterinaire: formulaire.veterinaire,
        cout: formulaire.cout === '' ? null : Number(formulaire.cout),
      }
    }

    onSoumettre({ ...commun, ...specifique })
  }

  return (
    <Modal
      ouvert={ouvert}
      titre="Nouvel événement sanitaire"
      sousTitre="Vaccination, maladie, traitement ou consultation — enregistrement définitif"
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Animal"
            value={formulaire.animal}
            onChange={modifier('animal')}
            options={animaux.map((animal) => animal.id)}
            requis
          />
          <Select
            label="Type d'événement"
            value={formulaire.type}
            onChange={modifier('type')}
            options={TYPES_EVENEMENT}
            requis
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Date de l'événement"
            type="date"
            value={formulaire.date}
            onChange={modifier('date')}
            required
          />
          <Input
            label="Libellé"
            value={formulaire.libelle}
            onChange={modifier('libelle')}
            placeholder="Ex. Vaccination annuelle"
            maxLength={150}
          />
        </div>

        {/* Vaccination */}
        {formulaire.type === 'Vaccination' && (
          <div className="space-y-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <Stethoscope className="h-4 w-4" /> Détails de la vaccination
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Vaccin"
                value={formulaire.vaccin}
                onChange={modifier('vaccin')}
                placeholder="Ex. Rage"
                maxLength={150}
                required
              />
              <Input
                label="Lot"
                value={formulaire.lot}
                onChange={modifier('lot')}
                placeholder="Référence du lot"
                maxLength={100}
              />
              <Input
                label="Date de rappel"
                type="date"
                value={formulaire.dateRappel}
                onChange={modifier('dateRappel')}
              />
            </div>
            <p className="text-xs text-emerald-700">
              Un rappel de soin sera généré automatiquement si une date de rappel est renseignée.
            </p>
          </div>
        )}

        {/* Maladie */}
        {formulaire.type === 'Maladie' && (
          <div className="space-y-4 rounded-xl border border-red-100 bg-red-50/50 p-4">
            <p className="text-sm font-semibold text-red-800">Détails du diagnostic</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nom de la maladie"
                value={formulaire.nomMaladie}
                onChange={modifier('nomMaladie')}
                placeholder="Ex. Fièvre aphteuse"
                maxLength={150}
                required
              />
              <Select
                label="Gravité"
                value={formulaire.gravite}
                onChange={modifier('gravite')}
                options={GRAVITES_MALADIE}
                required
              />
              <Select
                label="Statut"
                value={formulaire.statutMaladie}
                onChange={modifier('statutMaladie')}
                options={STATUTS_MALADIE}
                required
              />
              <Input
                label="Date de début"
                type="date"
                value={formulaire.dateDebut}
                onChange={modifier('dateDebut')}
              />
              <Input
                label="Date de fin / guérison"
                type="date"
                value={formulaire.dateFin}
                onChange={modifier('dateFin')}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Diagnostic
              </label>
              <textarea
                rows={3}
                value={formulaire.diagnostic}
                onChange={modifier('diagnostic')}
                maxLength={2000}
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        )}

        {/* Traitement */}
        {formulaire.type === 'Traitement' && (
          <div className="space-y-4 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
            <p className="text-sm font-semibold text-amber-800">Détails du traitement</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Médicament"
                value={formulaire.medicament}
                onChange={modifier('medicament')}
                placeholder="Ex. Pénicilline"
                maxLength={150}
                required
              />
              <Input
                label="Posologie"
                value={formulaire.posologie}
                onChange={modifier('posologie')}
                placeholder="Ex. 1 dose / jour"
                maxLength={500}
              />
              <Input
                label="Dose"
                type="number"
                step="0.01"
                min="0"
                value={formulaire.dose}
                onChange={modifier('dose')}
              />
              <Select
                label="Statut"
                value={formulaire.statutTraitement}
                onChange={modifier('statutTraitement')}
                options={STATUTS_TRAITEMENT}
                required
              />
              <Input
                label="Date de début"
                type="date"
                value={formulaire.dateDebut}
                onChange={modifier('dateDebut')}
              />
              <Input
                label="Date de fin"
                type="date"
                value={formulaire.dateFin}
                onChange={modifier('dateFin')}
              />
              <Input
                label="Prescripteur"
                value={formulaire.prescripteur}
                onChange={modifier('prescripteur')}
                maxLength={150}
              />
              <Input
                label="Motif"
                value={formulaire.motif}
                onChange={modifier('motif')}
                maxLength={500}
              />
            </div>
          </div>
        )}

        {/* Consultation */}
        {formulaire.type === 'Consultation' && (
          <div className="space-y-4 rounded-xl border border-sky-100 bg-sky-50/50 p-4">
            <p className="text-sm font-semibold text-sky-800">
              Détails de la consultation / intervention
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Nature"
                value={formulaire.nature}
                onChange={modifier('nature')}
                options={NATURES_CONSULTATION}
                required
              />
              <Input
                label="Vétérinaire"
                value={formulaire.veterinaire}
                onChange={modifier('veterinaire')}
                maxLength={150}
              />
              <Input
                label="Coût (€)"
                type="number"
                step="0.01"
                min="0"
                value={formulaire.cout}
                onChange={modifier('cout')}
              />
              <Input
                label="Motif"
                value={formulaire.motif}
                onChange={modifier('motif')}
                placeholder="Motif de l'intervention"
                maxLength={500}
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Notes complémentaires
          </label>
          <textarea
            rows={3}
            value={formulaire.notes}
            onChange={modifier('notes')}
            maxLength={2000}
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Référence (facultative — générée automatiquement si vide)
          </label>
          <input
            value={formulaire.reference}
            onChange={modifier('reference')}
            maxLength={100}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variante="outline" onClick={onFermer} disabled={envoi}>
            Annuler
          </Button>
          <Button type="submit" disabled={envoi || !formulaire.animal}>
            {envoi ? 'Enregistrement...' : 'Enregistrer l’événement'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
