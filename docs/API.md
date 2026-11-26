# Référence API AgriSmart — 100 routes

Base URL : `http://localhost:5000/api`  
Toutes les réponses JSON suivent l’enveloppe `{ "success": boolean, "message": string, "data": ... }`.

## Conventions

| Élément | Règle |
|---|---|
| Authentification | Header `Authorization: Bearer <token>` (sauf les 2 routes publiques) |
| `Public` | Aucun token requis |
| `Tous` | Tout utilisateur authentifié (`ADMIN`, `MANAGER`, `EMPLOYEE`) |
| `A/M` | `ADMIN` ou `MANAGER` uniquement |
| `A` | `ADMIN` uniquement |
| Pagination | `?page=&limit=` ; `limit` borné à 100 pour finances, notifications, employés, vétérinaire et tâches |
| Période | `?debut=AAAA-MM-JJ&fin=AAAA-MM-JJ` (ISO), fin >= début |
| Erreurs | `400` validation, `401` token, `403` rôle, `404` route, `409` conflit, `500` générique |
| Argent | Stocké en millimes côté serveur ; formats DT exposés par les contrats existants ; **aucun champ `*Millimes` dans `/api/rapports`** |

---

## Santé — 1 route

| Méthode | Chemin | Accès |
|---|---|---|
| GET | `/api/health` | Public |

## Authentification et comptes — 3 routes

| Méthode | Chemin | Accès |
|---|---|---|
| POST | `/api/auth/login` | Public (limiteur 20 tentatives / 15 min) |
| GET | `/api/auth/me` | Tous |
| POST | `/api/users` | A |

## Animaux — 6 routes

| Méthode | Chemin | Accès |
|---|---|---|
| GET | `/api/animals` | Tous |
| GET | `/api/animals/statistiques` | Tous |
| GET | `/api/animals/:id` | Tous |
| POST | `/api/animals` | A/M |
| PUT | `/api/animals/:id` | A/M |
| DELETE | `/api/animals/:id` | A/M |

## Cultures et parcelles — 12 routes

| Méthode | Chemin | Accès |
|---|---|---|
| GET | `/api/parcelles` | Tous |
| GET | `/api/parcelles/statistiques` | Tous |
| GET | `/api/parcelles/:id` | Tous |
| POST | `/api/parcelles` | A/M |
| PUT | `/api/parcelles/:id` | A/M |
| DELETE | `/api/parcelles/:id` | A/M |
| GET | `/api/cycles` | Tous |
| GET | `/api/cycles/statistiques` | Tous |
| GET | `/api/cycles/:id` | Tous |
| POST | `/api/cycles` | A/M |
| PUT | `/api/cycles/:id` | A/M |
| DELETE | `/api/cycles/:id` | A/M |

## Stocks — 12 routes

| Méthode | Chemin | Accès | Note |
|---|---|---|---|
| GET | `/api/stocks/produits` | Tous | |
| GET | `/api/stocks/produits/:id` | Tous | |
| POST | `/api/stocks/produits` | A/M | `stockInitial` converti en mouvement |
| PUT | `/api/stocks/produits/:id` | A/M | `quantiteDisponible` interdite |
| DELETE | `/api/stocks/produits/:id` | A/M | Refusé si mouvements existants |
| GET | `/api/stocks/mouvements` | Tous | |
| GET | `/api/stocks/mouvements/incoherences` | A/M | Diagnostic lecture seule |
| GET | `/api/stocks/mouvements/:id` | Tous | |
| POST | `/api/stocks/mouvements` | A/M | Grand livre, idempotence par `reference` |
| POST | `/api/stocks/mouvements/reconcilier` | A/M | Réconciliation contrôlée |
| GET | `/api/stocks/statistiques` | Tous | |
| GET | `/api/stocks/alertes` | Tous | |

## Vétérinaire — 18 routes

Toutes réservées à `A/M`. L’historique sanitaire est immuable : aucun `PUT`/`DELETE` sur les événements.

| Méthode | Chemin |
|---|---|
| GET | `/api/veterinaire/dossiers` |
| GET | `/api/veterinaire/dossiers/animal/:animalId` |
| GET | `/api/veterinaire/dossiers/:id` |
| POST | `/api/veterinaire/dossiers` |
| PUT | `/api/veterinaire/dossiers/:id` |
| DELETE | `/api/veterinaire/dossiers/:id` |
| GET | `/api/veterinaire/evenements` |
| GET | `/api/veterinaire/evenements/:id` |
| POST | `/api/veterinaire/evenements` |
| GET | `/api/veterinaire/calendrier` |
| GET | `/api/veterinaire/alertes` |
| GET | `/api/veterinaire/statistiques` |
| GET | `/api/veterinaire/animaux/:animalId/historique` |
| GET | `/api/veterinaire/rappels` |
| GET | `/api/veterinaire/rappels/:id` |
| POST | `/api/veterinaire/rappels` |
| PUT | `/api/veterinaire/rappels/:id` |
| DELETE | `/api/veterinaire/rappels/:id` |

## Finances — 16 routes

Toutes réservées à `A/M`. Montants en DT (millimes internes non exposés).

| Méthode | Chemin | Note |
|---|---|---|
| GET | `/api/finances/categories` | |
| GET | `/api/finances/categories/:id` | |
| POST | `/api/finances/categories` | |
| PUT | `/api/finances/categories/:id` | |
| DELETE | `/api/finances/categories/:id` | Désactivation logique |
| GET | `/api/finances/operations` | |
| GET | `/api/finances/operations/:id/historique` | |
| GET | `/api/finances/operations/:id` | |
| POST | `/api/finances/operations` | Idempotence par `reference` |
| POST | `/api/finances/operations/:id/paiements` | |
| POST | `/api/finances/operations/:id/annuler` | Motif obligatoire |
| PUT | `/api/finances/operations/:id` | Champs calculés immuables |
| GET | `/api/finances/tableau-de-bord` | `?debut=&fin=` |
| GET | `/api/finances/statistiques` | `?debut=&fin=` |
| GET | `/api/finances/rapports/synthese` | Limite 1 000 opérations |
| GET | `/api/finances/rapports/operations.csv` | BOM UTF-8, `;`, CRLF, limite 10 000 |

## Employés — 8 routes

Toutes réservées à `A/M`. Salaires visibles uniquement pour l’encadrement ; désactivation logique, jamais de suppression.

| Méthode | Chemin |
|---|---|
| GET | `/api/employes` |
| GET | `/api/employes/statistiques` |
| GET | `/api/employes/comptes-disponibles` |
| GET | `/api/employes/:id/historique` |
| GET | `/api/employes/:id` |
| POST | `/api/employes` |
| PUT | `/api/employes/:id` |
| PATCH | `/api/employes/:id/desactiver` |

## Tâches — 10 routes

Lecture ouverte à `Tous` ; écriture `A/M`. Un compte `EMPLOYEE` ne voit que ses tâches affectées.

| Méthode | Chemin | Accès |
|---|---|---|
| GET | `/api/taches` | Tous |
| GET | `/api/taches/statistiques` | Tous |
| GET | `/api/taches/en-retard` | Tous |
| GET | `/api/taches/:id/historique` | Tous |
| GET | `/api/taches/:id` | Tous |
| POST | `/api/taches` | A/M |
| PUT | `/api/taches/:id` | A/M |
| PATCH | `/api/taches/:id/statut` | A/M |
| POST | `/api/taches/:id/annuler` | A/M |
| DELETE | `/api/taches/:id` | A/M |

## Notifications — 6 routes

Lecture/marquage `Tous` avec filtrage strict sur le destinataire ; actualisation `A/M`.

| Méthode | Chemin | Accès |
|---|---|---|
| GET | `/api/notifications/statistiques` | Tous |
| POST | `/api/notifications/actualiser` | A/M |
| PATCH | `/api/notifications/lire-toutes` | Tous |
| GET | `/api/notifications` | Tous |
| GET | `/api/notifications/:id` | Tous |
| PATCH | `/api/notifications/:id/lue` | Tous |

Les types `FINANCE_*` sont invisibles pour `EMPLOYEE`, y compris dans les statistiques.

## Rapports & statistiques — 8 routes

Module isolé, intégralement `A/M`, **lecture seule**, données réelles uniquement.

| Méthode | Chemin | Note |
|---|---|---|
| GET | `/api/rapports/synthese` | 5 domaines + erreurs partielles |
| GET | `/api/rapports/animaux-cultures` | État actuel |
| GET | `/api/rapports/stocks` | `calculerStockLedger()` uniquement |
| GET | `/api/rapports/veterinaire` | Source partielle (consultations filtrées) |
| GET | `/api/rapports/finances` | Montants DT uniquement |
| GET | `/api/rapports/employes-taches` | Aucun salaire exposé |
| GET | `/api/rapports/export.csv?domaine=` | BOM UTF-8, `;`, CRLF |
| GET | `/api/rapports/export.json?domaine=` | Rapport affiché, assaini |

Domaines exportables : `animaux-cultures`, `stocks`, `veterinaire`, `finances`, `employes-taches`, `synthese`.  
Limites : 100 lignes par tableau de détail, 1 000 opérations en synthèse financière, 10 000 opérations en export CSV financier. Aucun PDF ni Excel simulé.

---

**Total : 100 routes.** Aucune route n’a été ajoutée ni supprimée en phase 11.
