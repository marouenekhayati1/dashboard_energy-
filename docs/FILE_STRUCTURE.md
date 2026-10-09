# Structure des fichiers et relations

Cette cartographie décrit les fichiers identifiés dans le dépôt. Elle vise à aider les prochaines modifications ciblées ; ce n'est pas une garantie que chaque fichier du dépôt est listé.

## Racine

| Fichier/dossier | Rôle |
|---|---|
| `index.html` | Page de connexion |
| `register.html` | Page d'inscription |
| `dashboard.html` | Interface principale, navigation et zones de vues |
| `package.json` / `package-lock.json` | Dépendances et verrouillage des versions Node |
| `css/common.css` | Styles partagés des pages |
| `js/` | Logique frontend |
| `supabase/config.toml` | Configuration locale de la CLI Supabase |
| `supabase/functions/` | Fonctions Edge côté serveur |
| `supabase/migrations/` | Migrations SQL présentes dans le dépôt |

## JavaScript

| Fichier | Responsabilité | Dépendances / fichiers associés |
|---|---|---|
| `js/config.js` | Constantes de configuration et création du client `window.db` | Bibliothèque Supabase chargée avant ce fichier |
| `js/auth.js` | Lecture, écriture et suppression de la session applicative | `js/config.js`, pages de connexion et tableau de bord |
| `js/theme.js` | Thème clair/sombre et boutons associés | Pages HTML avec éléments `data-theme-toggle` |
| `js/services/supabaseService.js` | Accès commun aux données des techniciens | `window.db`, pages de connexion et d'inscription |
| `js/pages/login.js` | Logique du formulaire de connexion | `index.html`, `SupabaseService`, fonctions d'authentification |
| `js/pages/register.js` | Logique du formulaire d'inscription | `register.html`, `SupabaseService` |
| `js/checklist-engine.js` | Moteur partagé des check-lists et gestion des vues | `dashboard.html`, `js/checklists.js`, Supabase |
| `js/checklists.js` | Définitions des champs et sections de chaque check-list | `registerChecklist` fourni par le moteur |
| `js/history.js` | Fonctions/libellés de l'historique | Données de relevés et zone HTML d'historique |
| `js/history-v2.js` | Deuxième implémentation de l'historique | Fonctions/libellés partagés et zone HTML dédiée |
| `js/maintenance.js` | Tâches, équipements et interventions de maintenance | Zone maintenance, tables Supabase de maintenance |
| `js/water-consumption.js` | Vue de consommation d'eau et libellés des compteurs | Zone de consommation, données de relevés |
| `js/comments.js` | Vue transversale des commentaires non vides | `measurements`, `maintenance_logs`, zone commentaires |
| `js/pages/dashboard.js` | Initialisation de la session et navigation des vues | `dashboard.html` et les modules de vues |
| `supabase/functions/update-measurement/index.ts` | Traitement serveur de modification d'un relevé | Variables d'environnement Supabase et base de données |

## Ordre des scripts de `dashboard.html`

L'ordre actuel suit globalement cette séquence :

1. Client Supabase chargé par CDN.
2. `js/config.js`.
3. `js/auth.js` et `js/theme.js`.
4. `js/checklist-engine.js`.
5. `js/checklists.js`.
6. Modules de vue : historique, historique v2, maintenance, consommation d'eau et commentaires.
7. `js/pages/dashboard.js`.

Ne pas réordonner les scripts sans vérifier les symboles globaux qu'ils définissent et utilisent.

## Où effectuer une modification ?

| Besoin | Commencer par | Vérifier aussi |
|---|---|---|
| Modifier la structure ou ajouter une vue | `dashboard.html` | `js/pages/dashboard.js`, module de la vue, `css/common.css` |
| Modifier les champs d'une check-list | `js/checklists.js` | `js/checklist-engine.js`, stockage Supabase et historique |
| Modifier l'enregistrement des check-lists | `js/checklist-engine.js` | `js/checklists.js`, schéma et politiques Supabase |
| Modifier le tri ou les filtres de maintenance | `js/maintenance.js` | IDs/en-têtes dans `dashboard.html` |
| Modifier les commentaires | `js/comments.js` | IDs de la table dans `dashboard.html`, colonnes utilisées dans les requêtes |
| Modifier l'historique | `js/history.js` et/ou `js/history-v2.js` | `dashboard.html`, navigation et fonctions partagées |
| Modifier la connexion/inscription | `js/pages/login.js` ou `js/pages/register.js` | `js/auth.js`, `js/services/supabaseService.js`, `js/config.js` |
| Modifier le thème | `js/theme.js` | `css/common.css`, attribut `data-theme` |
| Modifier une opération serveur de relevé | `supabase/functions/update-measurement/index.ts` | appel frontend, secrets de fonction, politiques et schéma |

## Méthode recommandée pour chaque changement

1. Lire le fichier de la fonctionnalité.
2. Rechercher les IDs HTML, fonctions globales et tables appelés par ce fichier.
3. Lire uniquement les dépendances directement concernées.
4. Modifier le minimum de fichiers nécessaire.
5. Vérifier la syntaxe JavaScript/HTML et les différences Git.
6. Tester la fonctionnalité dans le navigateur, y compris un état vide et un cas d'erreur.
7. Mettre à jour cette cartographie si les responsabilités ou les dépendances changent.
