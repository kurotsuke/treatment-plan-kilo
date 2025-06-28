# 🦷 Dental Treatment Planner

Une application React moderne pour la planification de traitements dentaires avec diagramme de Gantt interactif.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 16+ 
- npm ou yarn
- Compte Firebase
- Compte Google AI (Gemini)

### Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Configurer vos variables d'environnement dans .env
# - Clés Firebase
# - Clé Google AI (Gemini)

# Démarrer le serveur de développement
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

## 🛠️ Technologies

- **React 18** avec Vite
- **Firebase** (Firestore, Auth)
- **Google AI (Gemini)** pour la génération IA
- **Tailwind CSS** pour le styling
- **Lucide React** pour les icônes

## 📁 Structure du Projet

```
src/
├── components/           # Composants UI réutilisables
│   ├── gantt/           # Composants Gantt chart
│   └── ui/              # Composants UI de base
├── hooks/               # Hooks React personnalisés
├── services/            # Services API et Firebase
├── pages/               # Pages de l'application
├── contexts/            # Contextes React
├── config/              # Configuration Firebase/AI
├── adapters/            # Adaptateurs de données
└── utils/               # Utilitaires
```

## 🎯 Fonctionnalités

### 📋 Gestion des Patients
- Création et modification de profils patients
- Historique des traitements
- Informations de contact

### 📊 Plans de Traitement
- **Diagramme de Gantt interactif**
- **Gestion des dépendances** entre traitements
- **Calculs automatiques** de durée et dates
- **Timeline relative** avec séquencement intelligent

### 🤖 IA Intégrée
- **Génération automatique** de plans de traitement
- **Analyse de documents** PDF
- **Suggestions intelligentes** basées sur les cas similaires

### 👨‍⚕️ Gestion des Docteurs
- Profils des praticiens
- Spécialités et disponibilités
- Attribution aux traitements

## 📊 Diagramme de Gantt

### Fonctionnalités Avancées
- **Drag & Drop** pour réorganiser les tâches
- **Connexions visuelles** entre tâches dépendantes
- **Mode édition** pour modifier les dépendances
- **Calculs automatiques** des dates
- **Statistiques en temps réel**

### Gestion des Dépendances
- **Dépendances séquentielles** (finish-to-start)
- **Validation automatique** des connexions
- **Recalcul en cascade** des dates
- **Interface visuelle** pour la création/suppression

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev              # Serveur de développement
npm run build            # Build de production
npm run preview          # Aperçu du build

# Tests et qualité
npm run lint             # Vérification ESLint
npm run lint:fix         # Correction automatique ESLint

# Firebase
npm run firebase:deploy  # Déploiement Firebase
npm run firebase:serve   # Serveur Firebase local
```

## ⚙️ Configuration

### Variables d'Environnement

Créez un fichier `.env` basé sur `.env.example` :

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id

# Google AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Règles Firestore

Les règles de sécurité Firestore sont définies dans `firestore.rules` :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles de sécurité pour les collections
    match /patients/{document} {
      allow read, write: if request.auth != null;
    }
    // ... autres règles
  }
}
```

## 🎨 Composants UI

### Composants Gantt
- `RelativeGanttView` - Vue principale du Gantt
- `DependencyLines` - Gestion des connexions visuelles
- `DraggableTaskBar` - Barres de tâches interactives
- `GanttStatistics` - Statistiques en temps réel

### Composants Formulaires
- `DentalTaskDialog` - Édition des tâches dentaires
- `TreatmentPlanGenerationModal` - Génération IA
- `DurationModal` - Configuration des durées

## 📱 Pages Principales

- **Dashboard** - Vue d'ensemble et statistiques
- **Patients** - Gestion des patients
- **TreatmentPlans** - Liste des plans de traitement
- **TreatmentPlanGantt** - Vue Gantt détaillée
- **Settings** - Configuration de l'application

## 🔄 Hooks Personnalisés

- `useGanttData` - Gestion des données Gantt
- `useGanttHandlers` - Handlers d'événements Gantt
- `useTreatmentPlans` - Gestion des plans de traitement
- `useTreatmentPlanGeneration` - Génération IA
- `usePatients` - Gestion des patients
- `useDoctors` - Gestion des docteurs

## 🚀 Déploiement

### Build de Production

```bash
npm run build
```

### Déploiement Firebase

```bash
# Configuration initiale
firebase init

# Déploiement
firebase deploy
```

## 🐛 Dépannage

### Problèmes Courants

1. **Erreur Firebase** : Vérifiez vos clés dans `.env`
2. **Erreur IA** : Vérifiez votre clé Google AI Gemini
3. **Erreur de build** : Vérifiez les dépendances avec `npm install`

### Logs de Debug

Activez les logs détaillés en définissant :
```env
VITE_DEBUG=true
```

## 📝 Contribution

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Commitez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Poussez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

**Développé avec ❤️ pour optimiser la planification des traitements dentaires**