/** Formatage uniforme des références et sorties des modules employés/tâches. */
import { millimesVersTexte } from './refsFinancieres.js'

export function estPeuple(valeur) {
  return Boolean(
    valeur &&
      typeof valeur === 'object' &&
      valeur._bsontype !== 'ObjectId' &&
      (valeur._id || valeur.id)
  )
}

function identifiant(valeur) {
  return (valeur._id ?? valeur.id).toString()
}

function enObjet(brut) {
  if (!brut) return null
  return brut && typeof brut.toJSON === 'function' && !Array.isArray(brut)
    ? brut.toJSON()
    : brut
}

export function formaterUtilisateurRef(brut) {
  if (!brut) return null
  if (estPeuple(brut)) {
    return {
      id: identifiant(brut),
      name: brut.name ?? '',
      role: brut.role ?? null,
    }
  }
  return { id: brut.toString(), name: '', role: null }
}

/** Référence publique d'un employé : jamais d'information salariale. */
export function formaterEmployeRef(brut) {
  if (!brut) return null
  if (estPeuple(brut)) {
    return {
      id: identifiant(brut),
      nom: brut.nom ?? '',
      prenoms: brut.prenoms ?? '',
      fonction: brut.fonction ?? '',
      statut: brut.statut ?? null,
    }
  }
  return {
    id: brut.toString(),
    nom: '',
    prenoms: '',
    fonction: '',
    statut: null,
  }
}

function formaterEntreeJournal(brut) {
  if (!brut) return null
  const objet = enObjet(brut)
  const { _id, utilisateur, ...reste } = objet
  return {
    ...reste,
    id: _id ? _id.toString() : objet.id,
    utilisateur: formaterUtilisateurRef(utilisateur),
  }
}

/**
 * Sortie API d'un employé. Les informations salariales ne sont ajoutées
 * que pour ADMIN et MANAGER, quel que soit le endpoint appelé.
 */
export function formaterEmploye(brut, utilisateur = null, avecSalaire = false) {
  const source = enObjet(brut)
  if (!source) return null

  const {
    _id,
    journal,
    createdBy,
    utilisateur: compte,
    salaireMillimes,
    periodiciteSalaire,
    matricule,
    ...reste
  } = source
  /* `matricule` est écarté volontairement : référence interne MongoDB uniquement. */
  void matricule

  const sortie = {
    ...reste,
    id: _id ? _id.toString() : reste.id,
    createdBy: formaterUtilisateurRef(createdBy),
    utilisateur: formaterUtilisateurRef(compte),
    journal: Array.isArray(journal) ? journal.map(formaterEntreeJournal) : [],
  }

  const peutVoirSalaire =
    avecSalaire && ['ADMIN', 'MANAGER'].includes(utilisateur?.role)
  if (peutVoirSalaire) {
    constTexteSalaire(sortie, salaireMillimes, periodiciteSalaire)
  }

  return sortie
}

function constTexteSalaire(sortie, salaireMillimes, periodiciteSalaire) {
  const millimes = Number.isFinite(Number(salaireMillimes))
    ? Number(salaireMillimes)
    : 0
  const texte = millimesVersTexte(millimes) ?? '0.000'
  const libelles = {
    Mensuel: '/ mois',
    Journalier: '/ jour',
    Horaire: '/ heure',
  }
  sortie.salaireMillimes = millimes
  sortie.periodiciteSalaire = periodiciteSalaire ?? 'Mensuel'
  sortie.salaire = texte
  sortie.salaireLibelle = `${texte} DT ${libelles[periodiciteSalaire] ?? '/ mois'}`
}

/** Historique d'un employé ou d'une tâche : la même forme que celui des finances. */
export function formaterHistorique(elements) {
  return (elements ?? []).map(formaterEntreeJournal).filter(Boolean)
}

/**
 * Sortie API d'une tâche. `enRetard` est calculé et jamais persisté.
 * `cibleLibelle` est enrichi par le service selon le module réel.
 */
export function formaterTache(brut) {
  const source = enObjet(brut)
  if (!source) return null

  const { _id, employes, createdBy, journal, cible, ...reste } = source
  const terminale = ['Terminée', 'Annulée'].includes(reste.statut)
  const echeance = reste.dateEcheance ? new Date(reste.dateEcheance).getTime() : null
  const enRetard = !terminale && echeance !== null && echeance < Date.now()

  return {
    ...reste,
    id: _id ? _id.toString() : reste.id,
    enRetard,
    employes: Array.isArray(employes) ? employes.map(formaterEmployeRef) : [],
    cible: cible
      ? {
          ...cible,
          id: cible._id ? cible._id.toString() : cible.id,
          referenceId: cible.referenceId
            ? cible.referenceId.toString()
            : null,
        }
      : { module: 'Autre', referenceId: null, libelle: '' },
    createdBy: formaterUtilisateurRef(createdBy),
    journal: Array.isArray(journal) ? journal.map(formaterEntreeJournal) : [],
  }
}
