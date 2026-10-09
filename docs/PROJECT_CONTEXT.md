# Contexte du projet

## Objectif

Application web interne de suivi des utilités et de la maintenance. L'interface permet notamment de saisir les check-lists par utilité, consulter les relevés et leur historique, suivre les consommations d'eau, enregistrer des interventions de maintenance et consulter les commentaires non vides.

## Architecture générale

Le projet est principalement une application frontend statique :

1. Les pages HTML définissent la structure.
2. Les feuilles CSS définissent l'apparence commune.
3. Les fichiers JavaScript gèrent la connexion, la navigation, les check-lists et les vues métier.
4. Supabase fournit les données persistantes.
5. Une Edge Function existe pour certaines opérations serveur liées à la modification des relevés.

Il n'y a pas de framework frontend principal visible dans les pages examinées. Le client Supabase est chargé par CDN dans les pages HTML.

## Pages

### `index.html`
Page de connexion. Charge la bibliothèque Supabase, la configuration, les fonctions de session, le service Supabase, le thème et le contrôleur de connexion.

### `register.html`
Page d'inscription d'un technicien. Réutilise la configuration et les fonctions communes, puis charge `js/pages/register.js`.

### `dashboard.html`
Conteneur principal de l'application. Il contient la navigation et les zones des différentes vues. Il charge notamment le moteur et les définitions de check-lists, l'historique, la maintenance, la consommation d'eau, les commentaires et le contrôleur du tableau de bord.

## Flux principaux

### Connexion
`js/pages/login.js` utilise `SupabaseService` pour récupérer les techniciens actifs et vérifier les informations de connexion. `js/auth.js` gère la session applicative stockée dans `localStorage`.

### Check-lists
`js/checklist-engine.js` contient le moteur commun : registre des check-lists, affichage, gestion du poste et enregistrement. `js/checklists.js` déclare les champs et sections propres aux différentes utilités en appelant `registerChecklist(...)`.

**Dépendance importante :** le moteur doit être chargé avant les définitions de check-lists.

### Navigation du tableau de bord
`js/pages/dashboard.js` relie la navigation aux différentes zones HTML. Une modification d'une vue doit vérifier à la fois son balisage dans `dashboard.html` et son contrôleur JavaScript.

### Historique
`js/history.js` contient des fonctions et libellés utilisés par l'historique. `js/history-v2.js` contient une autre implémentation de l'historique. Les deux fichiers sont actuellement chargés par `dashboard.html`; vérifier les appels et les responsabilités avant de modifier ou supprimer l'un d'eux.

### Maintenance
`js/maintenance.js` gère les équipements/utilités de maintenance, la création des tâches et des interventions, leur affichage et la modification des interventions. Les données persistantes utilisent notamment `maintenance_tasks` et `maintenance_logs`.

### Commentaires
`js/comments.js` agrège les commentaires non vides issus des relevés (`measurements`) et des interventions (`maintenance_logs`). La structure HTML de cette vue se trouve dans `dashboard.html`.

### Consommation d'eau
`js/water-consumption.js` contient la logique de la vue de consommation d'eau et les libellés des compteurs. Son fonctionnement dépend de la structure des données de relevés enregistrées dans Supabase.

## Configuration et sécurité

- `js/config.js` initialise le client Supabase partagé dans `window.db`.
- La clé anon du frontend est une clé publique conçue pour être utilisée côté navigateur ; la sécurité des données doit être assurée par les politiques RLS et les contrôles côté serveur.
- Ne jamais ajouter une clé `service_role`, un secret ou un mot de passe serveur au code frontend.
- `supabase/functions/update-measurement/index.ts` est une fonction serveur séparée. Les secrets nécessaires doivent être configurés dans l'environnement Supabase, jamais codés dans un fichier frontend.

## Points de vigilance connus

- Les balises HTML et le JavaScript sont fortement couplés via les IDs des éléments et les noms de fonctions.
- L'ordre des scripts dans `dashboard.html` est important.
- Les vues historiques peuvent se chevaucher fonctionnellement : comprendre les deux versions avant une refactorisation.
- Le schéma distant Supabase peut contenir des objets qui ne sont pas décrits par les migrations présentes dans ce dépôt. Vérifier le schéma distant avant de conclure qu'une table ou une colonne n'existe pas.
- Après chaque changement de tableau, vérifier les en-têtes, les filtres, le tri, les états vides et les actions par ligne.
