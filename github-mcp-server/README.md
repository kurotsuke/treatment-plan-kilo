# Configuration du serveur MCP GitHub

Ce répertoire contient la configuration du serveur MCP GitHub selon les spécifications du projet.

## Installation terminée

✅ **Répertoire créé** : `github-mcp-server/`
✅ **Image Docker téléchargée** : `ghcr.io/github/github-mcp-server:latest`
✅ **Configuration MCP** : `mcp_settings.json` avec le nom de serveur `github.com/github/github-mcp-server`

## Prochaines étapes requises

### 1. Créer un GitHub Personal Access Token

Pour utiliser le serveur MCP GitHub, vous devez créer un Personal Access Token :

1. Allez sur : [https://github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)
2. Sélectionnez les permissions appropriées selon vos besoins :
   - **repos** : Pour les opérations sur les dépôts
   - **issues** : Pour créer/modifier des issues
   - **pull_requests** : Pour les pull requests
   - **actions** : Pour GitHub Actions
   - **notifications** : Pour les notifications

### 2. Configuration des variables d'environnement

Créez un fichier `.env` avec votre token :
```bash
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here
```

## Structure des fichiers

```
/Users/adil/Downloads/Treatment plan - KILO/
├── mcp_settings.json           # Configuration MCP principale
├── github-mcp-server/          # Répertoire du serveur
│   └── README.md              # Ce fichier
```

## Capacités du serveur

Le serveur GitHub MCP propose les fonctionnalités suivantes :

### Outils disponibles
- **Utilisateurs** : `get_me`, `search_users`
- **Issues** : `get_issue`, `create_issue`, `list_issues`, `update_issue`, etc.
- **Pull Requests** : `get_pull_request`, `create_pull_request`, `merge_pull_request`, etc.
- **Dépôts** : `create_repository`, `get_file_contents`, `push_files`, etc.
- **Actions** : `list_workflows`, `run_workflow`, `get_workflow_run`, etc.
- **Sécurité** : `list_code_scanning_alerts`, `list_secret_scanning_alerts`
- **Notifications** : `list_notifications`, `dismiss_notification`, etc.

### Toolsets configurables
Vous pouvez limiter les outils disponibles avec `--toolsets` :
- `actions` : GitHub Actions
- `context` : Contexte utilisateur (recommandé)
- `code_security` : Alertes de sécurité
- `issues` : Gestion des issues
- `notifications` : Notifications
- `pull_requests` : Pull requests
- `repos` : Opérations sur les dépôts
- `secret_protection` : Protection des secrets
- `users` : Utilisateurs
- `experiments` : Fonctionnalités expérimentales

## Test de fonctionnement

Une fois votre token configuré, vous pourrez tester le serveur avec des outils MCP compatibles.