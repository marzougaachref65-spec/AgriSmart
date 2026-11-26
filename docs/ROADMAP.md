# Feuille de route AgriSmart

Plan de développement validé. Chaque phase est livrée et vérifiée avant de passer à la suivante.

**Statut global du projet : phases 0 à 11 terminées — version 1.0.0.**

| Phase | Objectif | Statut |
|---|---|---|
| 0 | Socle technique : arborescence, Vite, React, Tailwind v4, Express, Mongoose, configuration | ✅ Terminée |
| 1 | Authentification, JWT, bcryptjs, rôles ADMIN / MANAGER / EMPLOYEE | ✅ Terminée |
| 2 | Design system, sidebar, dashboard, routing protégé | ✅ Terminée |
| 3 | Gestion des animaux (premier CRUD complet) | ✅ Terminée |
| 4 | Cultures et parcelles | ✅ Terminée |
| 5 | Gestion des stocks : produits, mouvements traçables, alertes et statistiques | ✅ Terminée |
| 6 | Suivi vétérinaire : dossiers médicaux, historique sanitaire, rappels et alertes | ✅ Terminée |
| 7 | Gestion des finances : revenus, dépenses, catégories, paiements, tableaux de bord et rapports | ✅ Terminée |
| 8 | Employés et tâches agricoles | ✅ Terminée |
| 9 | Notifications et alertes centralisées | ✅ Terminée |
| 10 | Statistiques et rapports | ✅ Terminée |
| 11 | Finition, tests et documentation | ✅ Terminée |

Décisions techniques validées :

- Hachage des mots de passe : **bcryptjs**
- CSS : **Tailwind CSS v4** via le plugin Vite
- Rôles : **ADMIN**, **MANAGER**, **EMPLOYEE**
- Base MongoDB : **agrismart** (standalone sur le port `27021`)
- Dépendances optionnelles : ajoutées progressivement selon les besoins de chaque phase
- Phase 5 — cohérence des stocks sans transactions (MongoDB standalone) : le mouvement est le grand livre, `quantiteDisponible` est une projection ; insertion `En attente`, mise à jour absolue sous verrou, confirmation, idempotence par `reference` et réconciliation des mouvements anciens
- Phase 5 — aucune dépendance npm ajoutée (`crypto.randomUUID()` natif)
- Phase 6 — accès réservé à **ADMIN / MANAGER** (backend `protect` + `authorize` sur toutes les routes, navigation filtrée par rôle)
- Phase 6 — un dossier médical par animal réel (index unique, 409 sur doublon) ; suppression refusée (409) dès qu'un événement ou un rappel y est associé
- Phase 6 — historique sanitaire **immuable** : `EvenementVeterinaire` est en ajout seulement (aucun `PUT`/`DELETE`)
- Phase 6 — rappels dédiés `RappelSoin`, générés automatiquement depuis une vaccination avec `dateRappel` ; repli dans le calcul d'alertes sur `EvenementVeterinaire.dateRappel` si la création échoue (MongoDB standalone, pas de transaction)
- Phase 6 — alertes disjointes par priorité : `rappelRetard` > `rappelProche` > `traitementEnCours` > `maladieActive` (horizon 30 jours, surchargeable via `?jours=`)
- Phase 6 — aucune dépendance npm ajoutée (`crypto.randomUUID()` natif)
- Phase 6 — version de l'application portée en **0.6.0** (UI et manifests)
- Phase 7 — accès réservé à **ADMIN / MANAGER** sur toutes les routes financières et sur la navigation
- Phase 7 — grand livre unique `OperationFinanciere` + référentiel `CategorieFinanciere` ; paiements intégrés à l'opération, aucun enregistrement comptable automatique depuis les autres modules (liens `source` optionnels en lecture seule)
- Phase 7 — devise unique **TND / DT**, montants stockés en **millimes entiers** (`1 TND = 1000 millimes`, `25.750 DT = 25750 millimes`) et affichés avec 3 décimales ; aucun `$inc` sur l'argent, mise à jour mono-document par pipeline d'agrégation pour les paiements (MongoDB standalone, aucune transaction)
- Phase 7 — idempotence par `reference` (200 + `dejaExistant`) et index partiel unique sur `(source.module, source.referenceId, type, statut)` pour empêcher les doublons actifs ; conflits `11000` traduits localement
- Phase 7 — catégories désactivées logiquement (jamais supprimées), refus si des opérations actives les utilisent ; opérations annulées logiquement avec motif et journal d'audit
- Phase 7 — exports natifs **JSON structuré** et **CSV** (BOM UTF-8, séparateur `;`) ; PDF/Excel non retenus en phase 10 (CSV/JSON uniquement, sans simulation)
- Phase 7 — aucune dépendance npm ajoutée ; version de l'application portée en **0.7.0** (UI et manifests)
- Phase 8 — fiches employés **séparées** du modèle `User`, avec lien optionnel `Employe.utilisateur` (aucune modification du modèle `User`) ; un seul compte `EMPLOYEE` actif peut être associé à une fiche
- Phase 8 — matricule employé `EMP-AAAA-XXXXXX` généré côté backend ; contrôle d'unicité et journal d'audit embarqué sur les changements importants
- Phase 8 — salaires en **TND / DT**, stockés en **millimes entiers** selon le contrat Phase 7 (`25.750 DT = 25750 millimes`) ; périodicités `Mensuel`, `Journalier`, `Horaire` ; champs salariaux masqués dans l'API et l'UI pour tout rôle autre que **ADMIN / MANAGER**
- Phase 8 — désactivation logique des employés (jamais de suppression définitive) avec `dateFin` et conservation de l'historique ; refus d'affecter un employé inactif à une tâche
- Phase 8 — tâches affectables à **un ou plusieurs employés actifs** ; cible facultative vérifiée sur des documents réels (`Animal`, `CycleCulture`, `Parcelle`) via `exists()` ; référence `TAC_` générée automatiquement
- Phase 8 — statuts `À faire`, `En cours`, `Terminée`, `Annulée` et priorités `Basse`, `Moyenne`, `Haute`, `Urgente` ; motif obligatoire pour toute annulation ; retard calculé à la lecture (aucune écriture)
- Phase 8 — permissions strictes : routes employés réservées à **ADMIN / MANAGER** ; lecture des tâches ouverte aux trois rôles mais **un employé ne voit que ses propres tâches** (et aucune sans fiche liée) ; écriture tâches réservée à l'encadrement
- Phase 8 — aucune dépendance npm ajoutée ; version de l'application portée en **0.8.0** (UI et manifests)
- Phase 9 — notifications internes par utilisateur, strictement **own-scope** : le destinataire est toujours injecté depuis `req.user`, jamais fourni par le client ; lecture, statistiques et marquage filtrés serveur pour les trois rôles
- Phase 9 — treize types couvrant tâches (création, affectation, échéance à 3 jours, retard), vétérinaire, stocks et finances (impayé, échéance à 7 jours, dépassement) ; trois niveaux `Info` / `Avertissement` / `Urgent`
- Phase 9 — anti-doublon par `cleUnicite` et index partiel unique `(destinataire, cleUnicite)` sur `active: true` : une situation persistante garde sa notification active, la résolution la désactive, et une nouvelle notification n'est créée que si l'état ou l'échéance change réellement
- Phase 9 — génération native côté backend (`setInterval`, premier passage après 30 s puis toutes les 15 min), garde anti-chevauchement, collecteurs isolés par `Promise.allSettled`, erreurs journalisées, arrêt propre sur **SIGTERM / SIGINT** ; aucun cron système et aucune génération depuis le navigateur
- Phase 9 — confidentialité financière renforcée : types `FINANCE_*`, titres, messages, sources, montants et statistiques réservés à **ADMIN / MANAGER**, avec défense en profondeur dans le formateur d'API même si un document incohérent existe en base
- Phase 9 — interface française dédiée : compteur global dans l'en-tête (polling lecture seule de 60 s), filtres recherche/type/niveau/période/état, onglets, pagination, lecture individuelle et « Tout marquer comme lu » ; recalcul manuel réservé à l'encadrement
- Phase 9 — MongoDB standalone sans transaction multi-document, aucune notification fictive injectée dans les données réelles, aucune dépendance npm ajoutée ; version de l'application portée en **0.9.0** (UI et manifests)
- Phase 10 — module isolé `/api/rapports` réservé à **ADMIN / MANAGER** (API, page et menu) ; orchestration en lecture seule des services métier existants, aucun recalcul métier dupliqué, aucun contrat des phases précédentes modifié
- Phase 10 — données réelles uniquement : calcul à la demande, états vides explicites, périodes et limites affichées (détails à 100 lignes, synthèse financière à 1 000 opérations, export CSV à 10 000)
- Phase 10 — stock exclusivement via `calculerStockLedger()` et `determinerAlerte()` ; incohérences de projection signalées sans jamais être corrigées ; `quantiteDisponible` n'est pas une source autoritative
- Phase 10 — exports **CSV** (BOM UTF-8, `;`, CRLF) et **JSON** uniquement ; aucun PDF ni Excel simulé, aucune nouvelle dépendance npm
- Phase 10 — confidentialité stricte : aucun champ `*Millimes` ni donnée salariale exposé par `/api/rapports`, y compris dans les exports ; valeur du stock réservée à l'encadrement ; filtres personnels tâches/notifications conservés
- Phase 10 — six onglets (Synthèse, Animaux & cultures, Stocks, Vétérinaire, Finances, Employés & tâches), filtre de période global et graphiques Recharts partagés ; version portée en **1.0.0** (UI et manifests)
- Phase 11 — suites de tests natives : **31 tests backend** (`node:test`) et **11 tests frontend** (Vite SSR + `react-dom/server`), sans aucune dépendance npm ajoutée ; garde anti-écriture refusant `NODE_ENV !== 'test'` et toute cible `agrismart`
- Phase 11 — correctifs non destructifs : CSV vétérinaire alimenté par les vrais `indicateurs`, erreur MongoDB `11000` avec message générique correct, téléphone employé uniformisé à 30 caractères ; aucun contrat API modifié hors CSV vétérinaire
- Phase 11 — documentation alignée sur l'état réel : `README.md`, `docs/API.md` (100 routes), `docs/TESTS.md`, `docs/EXPLOITATION.md` (port `27021`, sauvegarde/restauration), `docs/UTILISATEUR.md`
- Phase 11 — vérification finale validée : **61 contrôles HTTP en lecture seule**, 14 comptages MongoDB identiques avant/après, build Vite réussi ; version maintenue en **1.0.0**
