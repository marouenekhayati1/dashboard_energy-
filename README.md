# Dashboard Énergie — Plant Pulse / INDUS

Application web de suivi des utilités industrielles : check-lists de poste, relevés, historique, interventions de maintenance et commentaires.

## Instructions pour les assistants de code

Lire [AGENTS.md](AGENTS.md) avant toute modification assistée par IA. Le processus recommandé est décrit dans [docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md).

## Documentation du projet

- [Contexte et architecture](docs/PROJECT_CONTEXT.md)
- [Structure des fichiers et dépendances](docs/FILE_STRUCTURE.md)
- [Base de données Supabase](docs/DATABASE_SCHEMA.md)

## Technologies

- HTML, CSS et JavaScript natifs côté navigateur.
- Supabase pour les données.
- Client JavaScript Supabase chargé par CDN dans les pages HTML.
- Configuration partagée dans `js/config.js`.
- Certaines fonctions serveur sont déployées comme Supabase Edge Functions.
- `package.json` contient les dépendances/outils Node déclarés par le projet.

## Pages principales

- `index.html` : connexion.
- `register.html` : inscription d'un technicien.
- `dashboard.html` : application principale et ses différentes vues.

## Lancer le projet

Le frontend est composé de fichiers statiques. Pour le tester, servir le dossier avec un serveur HTTP local ou utiliser l'hébergement déjà configuré pour le projet. Les appels de données nécessitent une configuration Supabase valide et les autorisations de base de données correspondantes.

Le projet déclare le CLI Supabase dans `package.json`. Consulter la documentation officielle de Supabase avant d'exécuter des migrations ou des commandes qui modifient la base distante.

## Règles importantes avant une modification

1. Identifier la vue concernée et les fichiers JavaScript qu'elle utilise.
2. Vérifier les éléments HTML attendus par le JavaScript (IDs, classes, colonnes).
3. Vérifier les appels Supabase et le schéma réellement utilisé.
4. Préserver l'ordre des balises `<script>` : certains fichiers définissent des fonctions ou variables utilisées par les suivants.
5. Tester la fonctionnalité concernée et les vues voisines.
6. Ne jamais mettre une clé Supabase `service_role`, un mot de passe ou un secret serveur dans le frontend.
7. Garder la documentation à jour lorsque l'architecture, les tables ou les dépendances changent.

## Branches de travail

Le dépôt contient notamment les branches `main` et `modifchatgpt`. Vérifier la branche cible avant toute modification et ne pas supposer qu'elles sont identiques.
