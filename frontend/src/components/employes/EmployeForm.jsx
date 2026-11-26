import { useEffect, useState } from 'react'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'
import {
  PERIODICITES_SALAIRE,
  STATUTS_EMPLOYE,
  datePourChamp,
} from '../../utils/employes'
import { millimesVersTexte, saisieVersMillimes } from '../../utils/finances'

const formulaireVide = {
  nom: '',
  prenoms: '',
  fonction: '',
  specialite: '',
  cin: '',
  telephone: '',
  email: '',
  adresse: '',
  dateNaissance: '',
  dateRecrutement: datePourChamp(new Date()),
  salaire: '',
  periodiciteSalaire: 'Mensuel',
  statut: 'Actif',
  utilisateur: '',
  notes: '',
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  requis = false,
  disabled = false,
}) {
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
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500"
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

export default function EmployeForm({
  ouvert,
  employe,
  comptes,
  onFermer,
  onSoumettre,
  envoi = false,
  erreur = '',
}) {
  const [formulaire, setFormulaire] = useState(formulaireVide)
  const [erreurLocale, setErreurLocale] = useState('')
  const estModification = Boolean(employe)

  useEffect(() => {
    if (!ouvert) return
    setErreurLocale('')
    setFormulaire(
      employe
        ? {
            nom: employe.nom ?? '',
            prenoms: employe.prenoms ?? '',
            fonction: employe.fonction ?? '',
            specialite: employe.specialite ?? '',
            cin: employe.cin ?? '',
            telephone: employe.telephone ?? '',
            email: employe.email ?? '',
            adresse: employe.adresse ?? '',
            dateNaissance: datePourChamp(employe.dateNaissance),
            dateRecrutement: datePourChamp(employe.dateRecrutement),
            salaire: millimesVersTexte(employe.salaireMillimes) ?? '',
            periodiciteSalaire: employe.periodiciteSalaire ?? 'Mensuel',
            statut: employe.statut ?? 'Actif',
            utilisateur: employe.utilisateur?.id ?? '',
            notes: employe.notes ?? '',
          }
        : { ...formulaireVide, dateRecrutement: datePourChamp(new Date()) }
    )
  }, [ouvert, employe])

  const modifier = (cle) => (evenement) =>
    setFormulaire((etat) => ({ ...etat, [cle]: evenement.target.value }))

  const soumettre = (evenement) => {
    evenement.preventDefault()
    setErreurLocale('')

    if (!formulaire.nom.trim() || !formulaire.fonction.trim()) {
      setErreurLocale('Le nom et la fonction sont requis.')
      return
    }
    if (!formulaire.dateRecrutement) {
      setErreurLocale('La date de recrutement est requise.')
      return
    }
    const millimes = saisieVersMillimes(formulaire.salaire)
    if (!Number.isFinite(millimes) || millimes < 0) {
      setErreurLocale(
        'Le salaire doit être saisi en TND avec 3 décimales maximum (ex. 25.750).'
      )
      return
    }

    const donnees = {
      nom: formulaire.nom,
      prenoms: formulaire.prenoms || null,
      fonction: formulaire.fonction,
      specialite: formulaire.specialite || null,
      cin: formulaire.cin || null,
      telephone: formulaire.telephone || null,
      email: formulaire.email || null,
      adresse: formulaire.adresse || null,
      dateNaissance: formulaire.dateNaissance
        ? new Date(`${formulaire.dateNaissance}T00:00:00`).toISOString()
        : null,
      dateRecrutement: new Date(
        `${formulaire.dateRecrutement}T00:00:00`
      ).toISOString(),
      salaire: formulaire.salaire,
      periodiciteSalaire: formulaire.periodiciteSalaire,
      statut: formulaire.statut,
      utilisateur: formulaire.utilisateur || null,
      notes: formulaire.notes || null,
    }

    onSoumettre(donnees)
  }

  const optionsComptes = [...comptes]
  if (employe?.utilisateur?.id) {
    const dejaPresent = optionsComptes.some(
      (compte) => compte.id === employe.utilisateur.id
    )
    if (!dejaPresent) {
      optionsComptes.unshift({
        id: employe.utilisateur.id,
        name: employe.utilisateur.name || 'Compte associé',
        email: '',
      })
    }
  }

  return (
    <Modal
      ouvert={ouvert}
      titre={estModification ? 'Modifier la fiche employé' : 'Ajouter un employé'}
      sousTitre={
        estModification
          ? 'Mettez à jour les informations de la fiche employé'
          : 'Renseignez les informations du nouvel employé'
      }
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nom"
            value={formulaire.nom}
            onChange={modifier('nom')}
            placeholder="Ex. Ben Salem"
            maxLength={100}
            required
          />
          <Input
            label="Prénoms"
            value={formulaire.prenoms}
            onChange={modifier('prenoms')}
            placeholder="Ex. Ahmed"
            maxLength={150}
          />
          <Input
            label="Fonction"
            value={formulaire.fonction}
            onChange={modifier('fonction')}
            placeholder="Ex. Agronome"
            maxLength={100}
            required
          />
          <Input
            label="Spécialité"
            value={formulaire.specialite}
            onChange={modifier('specialite')}
            placeholder="Ex. Irrigation"
            maxLength={100}
          />
          <Input
            label="CIN"
            value={formulaire.cin}
            onChange={modifier('cin')}
            placeholder="Numéro de pièce d'identité"
            maxLength={50}
          />
          <Input
            label="Téléphone"
            value={formulaire.telephone}
            onChange={modifier('telephone')}
            placeholder="Ex. +216 12 345 678"
            maxLength={30}
          />
          <Input
            label="E-mail personnel"
            type="email"
            value={formulaire.email}
            onChange={modifier('email')}
            placeholder="Ex. ahmed@example.com"
            maxLength={150}
          />
          <Input
            label="Date de naissance"
            type="date"
            value={formulaire.dateNaissance}
            onChange={modifier('dateNaissance')}
          />
          <Input
            label="Date de recrutement"
            type="date"
            value={formulaire.dateRecrutement}
            onChange={modifier('dateRecrutement')}
            required
          />
          <Input
            label="Salaire (TND)"
            value={formulaire.salaire}
            onChange={modifier('salaire')}
            placeholder="Ex. 25.750"
            inputMode="decimal"
            required
          />
          <Select
            label="Périodicité du salaire"
            value={formulaire.periodiciteSalaire}
            onChange={modifier('periodiciteSalaire')}
            options={PERIODICITES_SALAIRE}
            requis
          />
          <div>
            <Select
              label={estModification ? 'Statut actuel' : 'Statut initial'}
              value={formulaire.statut}
              onChange={modifier('statut')}
              options={STATUTS_EMPLOYE}
              requis
              disabled={estModification}
            />
            {estModification && (
              <p className="mt-1 text-xs text-slate-500">
                Utilisez les actions du tableau pour désactiver ou réactiver l’employé.
              </p>
            )}
          </div>
          <Select
            label="Compte utilisateur (facultatif)"
            value={formulaire.utilisateur}
            onChange={modifier('utilisateur')}
            options={optionsComptes.map((compte) => ({
              value: compte.id,
              label: `${compte.name}${compte.email ? ` — ${compte.email}` : ''}`,
            }))}
            placeholder="Aucun compte associé"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Adresse
          </label>
          <Input
            value={formulaire.adresse}
            onChange={modifier('adresse')}
            placeholder="Adresse complète"
            maxLength={250}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            rows={3}
            value={formulaire.notes}
            onChange={modifier('notes')}
            maxLength={2000}
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <p className="text-xs text-slate-500">
          Le salaire est saisi en dinars tunisiens (TND) avec 3 décimales maximum
          et stocké en millimes. Les informations salariales sont réservées aux
          administrateurs et gestionnaires.
        </p>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variante="outline" onClick={onFermer} disabled={envoi}>
            Annuler
          </Button>
          <Button type="submit" disabled={envoi}>
            {envoi
              ? 'Enregistrement...'
              : estModification
                ? 'Enregistrer les modifications'
                : 'Ajouter l’employé'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
