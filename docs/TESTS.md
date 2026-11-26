# Tests et validation — AgriSmart 1.0.0

## Principe

Aucun test n’écrit dans la base réelle `agrismart`. Les tests automatisés sont soit purs (fonctions, validateurs, middlewares), soit en rendu serveur (SSR) sans appel réseau. La vérification des Phases 3-10 est réalisée séparément en **lecture seule** (`GET` et `countDocuments`).

Aucune dépendance de test n’a été installée : le runner natif `node:test` et Vite SSR sont utilisés.

## Backend

```bash
cd backend
npm test
```

- Runner : `node test/run.mjs` → `node --test test` (31 tests).
- Garde absolue (`test/helpers/garde.mjs`), importée en premier par chaque test :
  - refus si `NODE_ENV !== 'test'` ;
  - refus si `MONGO_URI` cible la base `agrismart` ;
  - refus si le nom de base de test n’est pas explicite.
- `npm test` avec `NODE_ENV=development` s’arrête immédiatement avec un message `REFUS SÉCURITÉ`.

Couverture :

| Famille | Fichier | Vérifications |
|---|---|---|
| Garde | `garde.test.mjs` | Refus `NODE_ENV`, refus base `agrismart`, URI sans base, base de test acceptée |
| Permissions | `authorisation.test.mjs` | ADMIN/MANAGER passent, EMPLOYEE et absence de rôle → 403 `ApiError` |
| Erreurs | `erreurs.test.mjs` | `11000` → 409 avec message générique correct, 403 conservé, 500 sans fuite, JSON invalide → 400 |
| Validateurs | `validateurs.test.mjs` | Téléphone employé 30/31, `quantiteDisponible` interdite, domaines rapport, période inversée |
| Services | `services.test.mjs` | Échappement CSV, BOM/CRLF/`;`, CSV vétérinaire via `indicateurs`, assainissage millimes/salaires, périodes |
| Régressions | `regressions.test.mjs` | 19 montages, 100 routes, garde `/api/rapports`, garde frontend `hasRole(...ROLES_ENCADREMENT)` |

Résultat attendu : **31 tests / 0 échec**.

## Frontend

```bash
cd frontend
npm test
```

- Runner : `node test/run.mjs` → `node --test --test-concurrency=1 test` (11 tests).
- Rendu : `vite.ssrLoadModule()` + `react-dom/server.renderToStaticMarkup()`.
- Exécution sérialisée des fichiers pour éviter tout conflit de port HMR Vite.

Couverture :

| Fichier | Vérifications |
|---|---|
| `rapports.test.mjs` | ADMIN et MANAGER voient les 6 onglets, CSV/JSON, mention lecture seule, aucun PDF/Excel ; EMPLOYEE est refusé sans onglets ni export ; régression `hasRole(...ROLES_ENCADREMENT)` |
| `navigation.test.mjs` | Menu Rapports visible A/M et absent EMPLOYEE, `ROLES_ENCADREMENT` exact, `RoleBasedRoute` autorise A/M et refuse EMPLOYEE |
| `exports.test.mjs` | 6 onglets, formats CSV/JSON uniquement, conversion de période, nom de fichier, montant brut sans millimes, erreurs Blob JSON/texte |

Résultat attendu : **11 tests / 0 échec**.

## Build

```bash
cd frontend
npm run build
```

Build Vite réussi (environ 2 696 modules). L’avertissement sur la taille du bundle (> 500 kB) est connu et non bloquant.

## Vérification read-only Phases 3-10

En plus des tests automatisés, une passe de vérification est effectuée contre l’API locale démarrée :

- tous les `GET` des modules Animaux, Cultures, Stocks, Vétérinaire, Finances, Employés, Tâches, Notifications et Rapports → 200 + enveloppe ;
- contrats inchangés (`animals.total = 1`, `stocks.valeurTotaleStock = 50`, `finances.depensesMillimes = 25750` et `depenses = 25.75`, salaire présent dans l’API employés existante, tâches = 1, notifications = 2) ;
- CSV financier et CSV/JSON Rapports : BOM, `;`, CRLF, absence de `millimes` ;
- validateurs : domaine inconnu, dates inversées, date invalide → 400 ; anonyme → 401 ;
- 14 comptages MongoDB identiques avant/après.

Cette passe n’utilise **que** des `GET` et `countDocuments()`. Aucune écriture, aucun changement de rôle, aucune donnée fictive injectée.
