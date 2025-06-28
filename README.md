# 🦷 Treatment Plan KILO - Planificateur de Traitement Dentaire

Un système de planification de traitement dentaire avancé avec diagramme de Gantt interactif et intégration MCP GitHub.

## 🎯 Fonctionnalités Principales

### 📊 Planification de Traitement
- **Diagramme de Gantt interactif** pour visualiser les étapes de traitement
- **Gestion des dépendances** entre les traitements
- **Timeline relative** avec calculs automatiques de durée
- **Statistiques en temps réel** sur les plans de traitement

### 👨‍⚕️ Gestion des Données
- **Base de données Firebase** pour les patients, docteurs et plans
- **Interface intuitive** pour la création et modification des plans
- **Système de génération IA** pour les plans de traitement
- **Export et partage** des planifications

### 🔧 Intégration MCP GitHub
- **Serveur MCP GitHub** configuré et opérationnel
- **Gestion de version** automatisée via GitHub API
- **Outils de collaboration** intégrés

## 🏗️ Architecture du Projet

```
Treatment Plan KILO/
├── dental-treatment-planner/     # Application principale React
│   ├── src/
│   │   ├── components/          # Composants UI
│   │   ├── hooks/              # Hooks React personnalisés
│   │   ├── services/           # Services API et Firebase
│   │   ├── pages/              # Pages de l'application
│   │   └── config/             # Configuration Firebase/AI
│   ├── public/                 # Assets statiques
│   └── package.json           # Dépendances npm
├── github-mcp-server/          # Configuration serveur MCP GitHub
│   ├── README.md              # Documentation MCP
│   ├── INSTALLATION_SUCCESS.md # Rapport d'installation
│   └── test-*.sh             # Scripts de test
├── mcp_settings.template.json  # Template configuration MCP
└── README.md                  # Ce fichier
```

## 🚀 Installation et Configuration

### Prérequis

- **Node.js** (v16+)
- **Docker** (pour le serveur MCP GitHub)
- **Compte GitHub** avec Personal Access Token
- **Projet Firebase** configuré

### 1. Installation des dépendances

```bash
cd dental-treatment-planner
npm install
```

### 2. Configuration Firebase

1. Créez un projet Firebase
2. Configurez Firestore Database
3. Copiez `.env.example` vers `.env` et ajoutez vos clés Firebase

### 3. Configuration MCP GitHub

1. Copiez `mcp_settings.template.json` vers `mcp_settings.json`
2. Ajoutez votre GitHub Personal Access Token
3. Installez l'image Docker :

```bash
docker pull ghcr.io/github/github-mcp-server
```

### 4. Démarrage de l'application

```bash
npm run dev
```

## 🔧 Serveur MCP GitHub

Le projet inclut une configuration complète du serveur MCP GitHub qui permet :

### ✅ Outils Disponibles
- **Utilisateurs** : `get_me`, `search_users`
- **Dépôts** : `create_repository`, `get_file_contents`, `push_files`
- **Issues** : `create_issue`, `list_issues`, `update_issue`
- **Pull Requests** : `create_pull_request`, `merge_pull_request`
- **Actions** : `list_workflows`, `run_workflow`
- **Sécurité** : `list_code_scanning_alerts`, `list_secret_scanning_alerts`

### 🎯 Utilisation

Le serveur est configuré avec le nom : `github.com/github/github-mcp-server`

```bash
# Test du serveur
./github-mcp-server/test-server.sh

# Démonstration des capacités
./github-mcp-server/demo-capabilities.sh
```

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** avec Vite
- **Tailwind CSS** pour le styling
- **Lucide React** pour les icônes
- **React Hook Form** pour les formulaires

### Backend & Services
- **Firebase Firestore** pour la base de données
- **Google AI (Gemini)** pour la génération de plans
- **Docker** pour le serveur MCP

### Outils de Développement
- **ESLint** pour la qualité du code
- **PostCSS** pour le traitement CSS
- **Git** pour la gestion de version

## 📝 Utilisation

### Création d'un Plan de Traitement

1. **Ajouter un patient** dans la section Patients
2. **Générer un plan** via l'IA ou créer manuellement
3. **Visualiser** dans le diagramme de Gantt
4. **Ajuster** les dépendances et durées
5. **Exporter** ou partager le plan

### Gestion des Dépendances

- **Connexions visuelles** entre les tâches liées
- **Calculs automatiques** des dates de début/fin
- **Mode édition** pour modifier les dépendances

### Statistiques et Rapports

- **Durée totale** du traitement
- **Nombre de séances** planifiées
- **Progression** en temps réel

## 🔐 Sécurité

- **Tokens d'authentification** sécurisés
- **Variables d'environnement** pour les secrets
- **Règles Firebase** pour l'accès aux données
- **Mode lecture seule** pour les tests MCP

## 🎉 Démonstration Réussie

Le serveur MCP GitHub a été testé avec succès :

- ✅ **Dépôt créé** : `https://github.com/kurotsuke/treatment-plan-kilo`
- ✅ **Authentification GitHub** validée
- ✅ **Outils MCP** opérationnels
- ✅ **Configuration** complète et documentée

## 📚 Documentation Additionnelle

- [Configuration MCP GitHub](github-mcp-server/README.md)
- [Rapport d'installation](github-mcp-server/INSTALLATION_SUCCESS.md)
- [Format JSON des données](dental-treatment-planner/docs/NEW_JSON_FORMAT.md)

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Commitez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Poussez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🎯 Roadmap

- [ ] **Notifications en temps réel** via Firebase
- [ ] **Mode collaboratif** multi-utilisateurs
- [ ] **Export PDF** des plans de traitement
- [ ] **Intégration calendrier** pour les rendez-vous
- [ ] **API REST** pour intégrations tierces
- [ ] **Mode hors ligne** avec synchronisation

---

**Développé avec ❤️ pour optimiser la planification des traitements dentaires**