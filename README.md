# AgriSmart — Smart Farm Management System

Application web de gestion agricole (React + Vite + Tailwind CSS v4 / Node.js + Express + Mongoose / MongoDB).

**État réel : phases 0 à 11 terminées — version 1.0.0.**

## Modules livrés

| Phase | Module |
|---|---|
| 1 | Authentification JWT, rôles `ADMIN` / `MANAGER` / `EMPLOYEE` |
| 2 | Design system, sidebar, tableau de bord, routage protégé |
| 3 | Animaux |
| 4 | Cultures et parcelles |
| 5 | Stocks : produits, mouvements traçables, alertes |
| 6 | Suivi vétérinaire : dossiers, historique immuable, rappels, alertes |
| 7 | Finances : catégories, opérations, paiements, rapports CSV/JSON |
| 8 | Employés et tâches agricoles |
| 9 | Notifications et alertes centralisées |
| 10 | Rapports & statistiques : six onglets, exports CSV/JSON |

L’API expose **100 routes** sous `/api`. Le détail figure dans [`docs/API.md`](docs/API.md).

## Prérequis

- Node.js **>= 20** (version relevée lors du développement : `v26.13.1`)
- npm (version relevée : `11.20.0`)
- MongoDB démarré sur **127.0.0.1:27021**, base `agrismart` (standalone)

## Structure

```text
backend/   API REST Express + Mongoose
frontend/  Application React + Vite + Tailwind CSS v4
docs/      Documentation, feuille de route et guides
```

Chaque partie est autonome et possède son propre `package.json`.

## Configuration

Les modèles sont `backend/.env.example` et `frontend/.env.example`. Les fichiers `.env` locaux sont ignorés par Git (`.gitignore`).

Backend :

```text
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27021/agrismart
JWT_SECRET=<clé longue et aléatoire>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

Frontend :

```text
VITE_API_URL=http://localhost:5000/api
```

> En production, remplacez obligatoirement `JWT_SECRET` et alignez `CORS_ORIGIN` sur l’origine réelle du frontend.

## Installation

```bash
cd backend
npm install

cd ../frontend
npm install
```

Aucune dépendance n’a été ajoutée en phase 11.

## Démarrage

Terminal 1 — API :

```bash
cd backend
npm run dev
```

Terminal 2 — frontend :

```bash
cd frontend
npm run dev
```

- Frontend : http://localhost:5173
- API : http://localhost:5000/api
- Santé : http://localhost:5000/api/health (indique l’état réel de Mongoose)

Le premier compte ADMIN se crée avec :

```bash
cd backend
npm run create:admin
```

## Commandes utiles

| Commande | Emplacement | Rôle |
|---|---|---|
| `npm run dev` | `backend/` | API avec redémarrage automatique |
| `npm start` | `backend/` | API sans watcher |
| `npm test` | `backend/` | 31 tests `node:test`, garde anti-écriture |
| `npm run create:admin` | `backend/` | Création du compte ADMIN initial |
| `npm run dev` | `frontend/` | Serveur Vite |
| `npm run build` | `frontend/` | Build de production dans `dist/` |
| `npm run preview` | `frontend/` | Prévisualisation du build |
| `npm test` | `frontend/` | 11 tests SSR Vite + `react-dom/server` |

## Tests

```bash
cd backend && npm test
cd ../frontend && npm test
```

Les tests backend refusent de s’exécuter si `NODE_ENV !== 'test'` ou si `MONGO_URI` cible la base `agrismart`. Aucune donnée réelle n’est écrite. Voir [`docs/TESTS.md`](docs/TESTS.md).

## Sécurité et permissions

- Mots de passe hachés avec `bcryptjs` (facteur 12), `password` exclu des réponses.
- JWT signé ; le rôle est relu depuis MongoDB à chaque requête, jamais cru depuis le token.
- `helmet`, CORS configuré, limiteur sur `POST /api/auth/login`.
- Toutes les réponses suivent `{ success, message, data }`.
- `EMPLOYEE` : lectures animaux/parcelles/cycles/stocks/tâches/notifications, avec filtrage strict sur ses affectations et ses notifications ; **aucun accès** à vétérinaire, finances, employés ni rapports.
- `ADMIN` : création de comptes via `POST /api/users`.
- Données financières et salaires strictement confidentielles ; `/api/rapports` n’expose aucun champ `*Millimes`.

## Documentation

- [Feuille de route](docs/ROADMAP.md)
- [Référence API — 100 routes](docs/API.md)
- [Tests et validation](docs/TESTS.md)
- [Exploitation, configuration, sauvegarde et restauration](docs/EXPLOITATION.md)
- [Guide utilisateur par rôle](docs/UTILISATEUR.md)
