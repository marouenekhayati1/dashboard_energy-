# Base de données Supabase

## Périmètre et fiabilité

Ce document résume les tables et appels confirmés dans le code consulté et dans les migrations présentes. Il ne remplace pas l'inspection du schéma du projet Supabase distant. Des tables, colonnes, vues, fonctions ou politiques peuvent exister dans le projet distant sans être décrites dans les migrations versionnées ici.

## Tables repérées

### `technicians`

Utilisée par `js/services/supabaseService.js` et les pages de connexion/inscription.

Colonnes explicitement référencées par le frontend :
- `id`
- `first_name`
- `last_name`
- `matricule`
- `role`
- `is_active`

Le frontend récupère les techniciens actifs, vérifie le matricule associé à un technicien et crée des techniciens avec le rôle initial `technician`. Le code de modification des interventions vérifie également le rôle `admin`.

### `measurements`

Utilisée pour les relevés des check-lists, l'historique et les commentaires.

Colonnes/relations directement visibles dans les requêtes consultées :
- `recorded_at`
- `utility_name`
- `data`
- relation `technicians(first_name,last_name)`

La colonne `data` contient les valeurs des champs du relevé sous forme de données structurées. Les noms exacts de toutes les colonnes, contraintes, relations et politiques doivent être confirmés dans le schéma Supabase distant et les migrations d'origine.

### `maintenance_tasks`

Définie dans `supabase/migrations/20261006000000_create_maintenance_tables.sql`.

Colonnes confirmées par cette migration :
- `id` : UUID, clé primaire.
- `utility_name`, `utility_label`
- `equipment_name`
- `title`
- `created_by`
- `created_at`

Un index unique empêche les doublons de titre pour une même utilité et un même équipement (comparaison du titre en minuscules).

### `maintenance_logs`

Définie dans la même migration et utilisée par `js/maintenance.js` et `js/comments.js`.

Colonnes confirmées par la migration :
- `id) : UUID, clé primaire.
- `task_id) : référence à `maintenance_tasks.id`.
- `utility_name`, `utility_label`, `equipment_name`, `task_title`
- `operating_hours) : nombre décimal, nul ou positif.
- `maintenance_date) : date.
- `poste) : `matin`, `apres-midi` ou `nuit`.
- `work_order_number)
- `comment) : texte, vide par défaut.
- `technician_id)
- `technician_name)
- `created_at)

Un index facilite la recherche par date d'intervention et date de création.

## Fonction serveur liée à la maintenance

La migration `20261006000003_enable_maintenance_log_updates.sql` définit la fonction PostgreSQL `public.update_maintenance_log(...)`. Elle vérifie notamment le technicien actif et son matricule, autorise un administrateur ou le technicien propriétaire à modifier l'intervention, conserve l'association à l'utilité et à l'équipement et valide les compteurs/date.

Le code frontend doit appeler cette fonction selon sa signature actuelle. Avant de la modifier, lire à la fois la migration et le code d'appel dans `js/maintenance.js`.

## RLS et permissions

La migration de création de maintenance active la Row Level Security (RLS) sur `maintenance_tasks` et `maintenance_logs`, puis ajoute des politiques de lecture et de création pour les rôles `anon` et `authenticated`. Les règles complètes et les migrations ultérieures doivent être relues avant toute modification de sécurité.

Ne pas supposer que RLS est configurée correctement uniquement parce qu'une politique existe : vérifier les politiques du projet distant et tester les accès avec les rôles concernés.

## Carte des appels de données

| Fonctionnalité | Tables/objets |
|---|---|
| Connexion / inscription | `technicians` |
| Relevés et historique | `measurements` |
| Vue commentaires | `measurements`, `maintenance_logs` |
| Interventions | `maintenance_logs`, `maintenance_tasks`, `technicians` via la fonction de mise à jour |
| Modification d'un relevé | Edge Function `update-measurement` et données de relevés |

## Avant de changer le schéma

1. Chercher toutes les références à la table/colonne dans le dépôt.
2. Vérifier le schéma distant Supabase, les clés étrangères, index, fonctions, triggers et politiques RLS.
3. Ajouter une migration SQL versionnée plutôt que de documenter seulement une modification manuelle.
4. Vérifier si le frontend attend le nom ou le type exact de la colonne.
5. Tester lecture, insertion, modification et droits d'accès concernés.
6. Mettre à jour ce document après la migration.
