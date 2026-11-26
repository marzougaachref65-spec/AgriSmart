# Guide utilisateur — AgriSmart 1.0.0

## Connexion

Ouvrez l’application, saisissez l’e-mail et le mot de passe fournis par l’administrateur. Le rôle est affiché dans l’en-tête : `Administrateur`, `Gestionnaire` ou `Employé`. En cas de perte de session, vous êtes redirigé vers la connexion.

## Navigation

Le menu est filtré selon le rôle :

| Section | Entrées |
|---|---|
| Vue générale | Tableau de bord |
| Exploitation | Animaux, Cultures & parcelles, Gestion des stocks, Suivi vétérinaire* |
| Gestion | Finances*, Employés*, Rapports*, Tâches agricoles |
| Communication | Notifications |

`*` Réservé aux administrateurs et gestionnaires.

---

## Administrateur / Gestionnaire

### Tableau de bord

Les chiffres financiers sont réels. Les autres cartes et graphiques peuvent porter la mention « démo » : ils illustrent la mise en page et ne proviennent pas de MongoDB.

### Animaux, cultures, stocks

- Créer, modifier, supprimer des animaux, parcelles, cycles et produits.
- Rechercher et filtrer par statut/espèce/catégorie.
- Les stocks se pilotent par des **mouvements** (entrées/sorties confirmées) : la quantité affichée provient du grand livre. Le champ de projection n’est pas modifiable directement.
- Les alertes de stock sont calculées automatiquement (rupture, seuil faible, expiration, proche expiration).

### Vétérinaire

- Un dossier médical par animal, l’historique sanitaire est en ajout seulement (jamais modifié ni supprimé).
- Vaccination avec date de rappel → création automatique d’un rappel de soin.
- Onglets : Dossiers, Historique sanitaire, Calendrier & rappels, Alertes & statistiques.
- L’horizon des alertes est réglable (1 à 365 jours, 30 par défaut).

### Finances

- Catégories, opérations de revenus/dépenses, paiements, annulation avec motif.
- Montants saisis en DT, affichés avec trois décimales ; stockage interne en millimes non exposé.
- Onglets : Tableau de bord, Opérations, Catégories, Rapports.
- Export CSV réel (BOM UTF-8, séparateur `;`) — aucun PDF ni Excel simulé.

### Employés et tâches

- Fiches employés séparées des comptes utilisateurs ; matricule généré automatiquement ; désactivation logique sans suppression.
- Salaires visibles uniquement pour l’encadrement.
- Tâches : planning, retards, historique ; affectation à un ou plusieurs employés actifs ; cible facultative sur animal/cycle/parcelle.
- Statuts : À faire, En cours, Terminée, Annulée (motif obligatoire).

### Notifications

- Compteur dans l’en-tête, rafraîchi toutes les 60 secondes.
- Filtres recherche, type, niveau, période, état ; marquage individuel ou global.
- « Recalculer les alertes » est réservé à l’encadrement.
- Les notifications financières sont confidentielles et réservées à l’encadrement.

### Rapports & statistiques

Six onglets :

1. Synthèse
2. Animaux & cultures
3. Stocks
4. Vétérinaire
5. Finances
6. Employés & tâches

- Filtre de période global (année en cours par défaut).
- Données réelles uniquement : aucun graphique ni chiffre fictif. Les collections vides affichent un état vide explicite.
- Les périodes et limites sont affichées : 100 lignes par tableau de détail, 1 000 opérations en synthèse financière, 10 000 en export CSV financier.
- Exports **CSV** et **JSON** de la période sélectionnée. Aucun PDF ni Excel n’est proposé.
- Les montants et salaires sont protégés ; la valeur du stock est réservée à l’encadrement.

---

## Employé

- Accès à : tableau de bord, animaux, cultures, stocks, tâches, notifications.
- Vous ne voyez **que vos tâches** (celles auxquelles vous êtes affecté) et **que vos notifications**.
- Aucun accès à : vétérinaire, finances, employés, rapports. Les boutons d’écriture sont masqués et le backend refuse les appels correspondants (403).
- Si aucune fiche employé n’est liée à votre compte, aucune tâche ne vous est affichée.

## Bon à savoir

- Aucune action de rapport n’écrit dans la base : les rapports sont calculés à la demande.
- Les périodes affichées dans les rapports sont celles réellement appliquées ; certains indicateurs reflètent l’état actuel de la base et sont signalés comme tels.
- En cas de message « Accès non autorisé », contactez un administrateur : votre rôle ne permet pas cette section.
