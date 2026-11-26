/** Formatage uniforme des références et des montants du module finances. */

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

/** 25.750 DT → 25750 millimes, sans arithmetic flottante. */
export function millimesVersTexte(valeur) {
  if (valeur === undefined || valeur === null || valeur === '') return null
  const nombre = Number(valeur)
  if (!Number.isFinite(nombre)) return null
  const entier = Math.trunc(nombre)
  const signe = entier < 0 ? '-' : ''
  const absolu = Math.abs(entier)
  return `${signe}${Math.floor(absolu / 1000)}.${String(absolu % 1000).padStart(3, '0')}`
}

/** Libellé complet avec devise, utilisé dans le journal et les exports. */
export function formaterMillimesDT(valeur) {
  const texte = millimesVersTexte(valeur)
  return texte === null ? '—' : `${texte} DT`
}

/** Valeur décimale de restitution : 25750 → 25.75 (jamais utilisée pour calculer). */
export function millimesVersTnd(valeur, valeurParDefaut) {
  if (valeur !== undefined && valeur !== null) {
    const nombre = Number(valeur)
    if (Number.isFinite(nombre)) return nombre / 1000
  }
  const repli = Number(valeurParDefaut)
  return Number.isFinite(repli) ? repli : 0
}

export function formaterCategorieRef(brut) {
  if (!brut) return null
  if (estPeuple(brut)) {
    return {
      id: identifiant(brut),
      code: brut.code ?? '',
      libelle: brut.libelle ?? '',
      type: brut.type ?? null,
      couleur: brut.couleur ?? null,
    }
  }
  return {
    id: brut.toString(),
    code: '',
    libelle: '',
    type: null,
    couleur: null,
  }
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

function formaterPaiement(brut) {
  if (!brut) return null
  const objet = enObjet(brut)
  const { _id, createdBy, montantMillimes, ...reste } = objet
  return {
    ...reste,
    id: _id ? _id.toString() : objet.id,
    montantMillimes: Number.isFinite(Number(montantMillimes))
      ? Number(montantMillimes)
      : 0,
    montant: millimesVersTnd(montantMillimes, reste.montant),
    createdBy: formaterUtilisateurRef(createdBy),
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

/** Sortie API stable d'une opération, déjà peuplée ou non. */
export function formaterOperation(brut) {
  const source = enObjet(brut)
  if (!source) return null

  /* Le toJSON du modèle n'expose plus les millimes : les relire sur le document
     Mongoose d'origine avant de le transformer en DTO. */
  const millimesBruts = brut?.montantMillimes
  const millimesPayesBruts = brut?.montantPayeMillimes

  const {
    _id,
    categorie,
    createdBy,
    paiements,
    journal,
    montantMillimes = millimesBruts,
    montantPayeMillimes = millimesPayesBruts,
    ...reste
  } = source

  return {
    ...reste,
    id: _id ? _id.toString() : reste.id,
    categorie: formaterCategorieRef(categorie),
    createdBy: formaterUtilisateurRef(createdBy),
    paiements: Array.isArray(paiements)
      ? paiements.map(formaterPaiement)
      : [],
    journal: Array.isArray(journal) ? journal.map(formaterEntreeJournal) : [],
    montantMillimes: Number.isFinite(Number(montantMillimes))
      ? Number(montantMillimes)
      : 0,
    montantPayeMillimes: Number.isFinite(Number(montantPayeMillimes))
      ? Number(montantPayeMillimes)
      : 0,
    montant: millimesVersTnd(montantMillimes, reste.montant),
    montantPaye: millimesVersTnd(montantPayeMillimes, reste.montantPaye),
  }
}

/** Sortie API stable d'une catégorie, déjà formatée ou non. */
export function formaterCategorie(brut) {
  const source = enObjet(brut)
  if (!source) return null

  const { _id, createdBy, ...reste } = source
  return {
    ...reste,
    id: _id ? _id.toString() : reste.id,
    createdBy: formaterUtilisateurRef(createdBy),
  }
}
