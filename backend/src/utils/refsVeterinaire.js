/** Formatage uniforme des références peuplées du module vétérinaire. */

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

export function formaterAnimalRef(brut) {
  if (estPeuple(brut)) {
    return {
      id: identifiant(brut),
      name: brut.name ?? '',
      espece: brut.espece ?? null,
      statut: brut.statut ?? null,
    }
  }
  return brut ? { id: brut.toString(), name: '', espece: null, statut: null } : null
}

export function formaterUtilisateurRef(brut) {
  if (estPeuple(brut)) {
    return {
      id: identifiant(brut),
      name: brut.name ?? '',
      role: brut.role ?? null,
    }
  }
  return brut ? { id: brut.toString(), name: '', role: null } : null
}

export function formaterDossierRef(brut) {
  if (!brut) return null
  if (estPeuple(brut)) {
    return { id: identifiant(brut), animal: formaterAnimalRef(brut.animal) }
  }
  return { id: brut.toString(), animal: null }
}

export function formaterEvenementRef(brut) {
  if (!brut) return null
  return {
    id: brut._id ? brut._id.toString() : brut.id,
    type: brut.type ?? null,
    reference: brut.reference ?? null,
  }
}

/**
 * Remplace les ObjectId sérialisés par des objets `{ id, ... }` stables.
 */
export function formaterRefs(objet) {
  return {
    ...objet,
    animal: formaterAnimalRef(objet.animal),
    dossier: formaterDossierRef(objet.dossier),
    createdBy: formaterUtilisateurRef(objet.createdBy),
    evenementOrigine: formaterEvenementRef(objet.evenementOrigine),
  }
}
