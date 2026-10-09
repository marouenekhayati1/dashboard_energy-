# Workflow de modification assistée par IA

## But

Réduire les lectures répétitives du code, limiter les modifications inutiles et garder une compréhension durable du projet entre les sessions.

## Avant de modifier

1. Lire `AGENTS.md` et le passage pertinent de la documentation.
2. Confirmer la branche cible.
3. Définir la demande en une phrase et lister les critères d'acceptation.
4. Identifier le fichier principal à modifier.
5. Rechercher les références directes aux fonctions, IDs HTML, classes CSS, tables et colonnes concernées.
6. Lire uniquement les dépendances réellement touchées.

## Carte rapide des fonctionnalités

| Demande | Point de départ | Dépendances à vérifier |
|---|---|---|
| Connexion | `js/pages/login.js` | `js/auth.js`, `js/services/supabaseService.js`, `js/config.js`, `index.html` |
| Inscription | `js/pages/register.js` | `js/services/supabaseService.js`, `js/config.js`, `register.html` |
| Navigation / nouvelle vue | `js/pages/dashboard.js` | `dashboard.html`, module de la vue, IDs et attributs `data-action` |
| Check-lists | `js/checklists.js` | `js/checklist-engine.js`, stockage des relevés, historique |
| Historique classique | `js/history.js` | `dashboard.html`, `measurements`, édition des relevés |
| Historique v2 | `js/history-v2.js` | `dashboard.html`, navigation, `measurements` |
| Maintenance | `js/maintenance.js` | zones et en-têtes dans `dashboard.html`, `maintenance_tasks`, `maintenance_logs` |
| Commentaires | `js/comments.js` | table des commentaires dans `dashboard.html`, `measurements`, `maintenance_logs` |
| Consommation d'eau | `js/water-consumption.js` | IDs de la zone d'eau dans `dashboard.html`, `measurements`, format de `data` |
| Thème | `js/theme.js` | `css/common.css`, attribut `data-theme`, boutons de thème |
| Données des techniciens | `js/services/supabaseService.js` | `technicians`, appels depuis les pages de connexion/inscription |
| Mise à jour serveur d'un relevé | `supabase/functions/update-measurement/index.ts` | appel frontend, variables d'environnement, schéma et autorisations |
| Modification d'une intervention | `js/maintenance.js` | fonction SQL `update_maintenance_log`, migration et règles de permission |

## Après la modification

1. Vérifier les changements dans chaque fichier.
2. Vérifier que les sélecteurs HTML/JS et les noms de colonnes correspondent.
3. Rechercher les autres usages de toute fonction ou contrat modifié.
4. Exécuter les contrôles de syntaxe/tests disponibles si l'environnement le permet.
5. Pour une modification UI, tester les cas normal, vide, erreur et permissions si possible.
6. Pour une modification de base, vérifier la migration et les politiques sans exécuter une migration distante sans demande/autorisation explicite.
7. Actualiser les documents si la structure ou les dépendances changent.
8. Rendre compte honnêtement de ce qui a été testé et de ce qui ne l'a pas été.

## Comment garder le contexte à jour

- Mettre à jour `docs/FILE_STRUCTURE.md` si un fichier ou une relation entre modules change.
- Mettre à jour `docs/PROJECT_CONTEXT.md` si un flux métier ou l'architecture change.
- Mettre à jour `docs/DATABASE_SCHEMA.md` si une table, une colonne, une fonction SQL, une migration ou une politique change.
- Mettre à jour cette carte si une nouvelle fonctionnalité récurrente apparaît.
- Ne pas ajouter de longs détails temporaires : conserver surtout les informations qui évitent de relire ou de redécouvrir le projet.

## Limite

La documentation et ces instructions réduisent le travail de découverte, mais ne remplacent pas la vérification du code actuel. Pour un changement transversal, une recherche plus large reste nécessaire.
