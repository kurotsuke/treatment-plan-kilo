import React from 'react';
import RelativeGanttView from '../components/gantt/RelativeGanttView';

// Données de test avec dépendances
const testData = {
  taches: [
    {
      id: 'task-1',
      nom: 'Consultation initiale (dents: 11, 21)',
      phase: 1,
      duree: { valeur: 1, unite: 'jour' },
      dependances: [],
      statut: 'completed',
      medecin: 'Dr. Martin'
    },
    {
      id: 'task-2',
      nom: 'Radiographie panoramique',
      phase: 1,
      duree: { valeur: 1, unite: 'jour' },
      dependances: [
        {
          id_tache_precedente: 'task-1',
          type: 'FD',
          decalage: { valeur: 0, unite: 'jours' }
        }
      ],
      statut: 'completed',
      medecin: 'Dr. Martin'
    },
    {
      id: 'task-3',
      nom: 'Détartrage complet',
      phase: 1,
      duree: { valeur: 2, unite: 'jours' },
      dependances: [
        {
          id_tache_precedente: 'task-1',
          type: 'FD',
          decalage: { valeur: 1, unite: 'jour' }
        }
      ],
      statut: 'in-progress',
      medecin: 'Dr. Dubois'
    },
    {
      id: 'task-4',
      nom: 'Traitement carie dent 16',
      phase: 2,
      duree: { valeur: 1, unite: 'jour' },
      dependances: [
        {
          id_tache_precedente: 'task-3',
          type: 'FD',
          decalage: { valeur: 2, unite: 'jours' }
        }
      ],
      statut: 'planned',
      medecin: 'Dr. Martin'
    },
    {
      id: 'task-5',
      nom: 'Traitement carie dent 26',
      phase: 2,
      duree: { valeur: 1, unite: 'jour' },
      dependances: [
        {
          id_tache_precedente: 'task-3',
          type: 'DD',
          decalage: { valeur: 0, unite: 'jours' }
        }
      ],
      statut: 'planned',
      medecin: 'Dr. Martin'
    },
    {
      id: 'task-6',
      nom: 'Pose couronne dent 16',
      phase: 2,
      duree: { valeur: 3, unite: 'jours' },
      dependances: [
        {
          id_tache_precedente: 'task-4',
          type: 'FD',
          decalage: { valeur: 7, unite: 'jours' }
        }
      ],
      statut: 'planned',
      medecin: 'Dr. Dubois'
    },
    {
      id: 'task-7',
      nom: 'Blanchiment dentaire',
      phase: 3,
      duree: { valeur: 2, unite: 'jours' },
      dependances: [
        {
          id_tache_precedente: 'task-6',
          type: 'FF',
          decalage: { valeur: 0, unite: 'jours' }
        },
        {
          id_tache_precedente: 'task-5',
          type: 'FD',
          decalage: { valeur: 14, unite: 'jours' },
          active: false // Dépendance désactivée pour test
        }
      ],
      statut: 'planned',
      medecin: 'Dr. Martin'
    },
    {
      id: 'task-8',
      nom: 'Contrôle final',
      phase: 3,
      duree: { valeur: 1, unite: 'jour' },
      dependances: [
        {
          id_tache_precedente: 'task-7',
          type: 'FD',
          decalage: { valeur: 7, unite: 'jours' }
        }
      ],
      statut: 'planned',
      medecin: 'Dr. Martin'
    }
  ],
  medecins_par_phase: {
    '1 - Phase': 'Dr. Martin',
    '2 - Phase': 'Dr. Dubois',
    '3 - Phase': 'Dr. Martin'
  }
};

const TestDependencyPhase2 = () => {
  const handleDateChange = (newDate) => {
    console.log('Date de début changée:', newDate);
  };

  const handleTaskUpdate = (taskId, updates) => {
    console.log('Tâche mise à jour:', taskId, updates);
  };

  const handleTaskAction = (action, task) => {
    console.log('Action sur la tâche:', action, task);
  };

  const handleDependencyUpdate = (taskId, dependencies) => {
    console.log('Dépendances mises à jour pour la tâche:', taskId, dependencies);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Test Phase 2 - Gestion Interactive des Dépendances
          </h1>
          <p className="mt-2 text-gray-600">
            Cette page teste toutes les fonctionnalités de la Phase 2 du système de gestion des dépendances.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Instructions de Test</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-medium text-gray-900">1. Mode Création de Dépendances</h3>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Cliquez sur "Créer des dépendances" dans la barre d'outils</li>
                <li>Sélectionnez un type de dépendance (FD, DD, FF, DF)</li>
                <li>Cliquez sur une tâche source (elle sera mise en évidence en bleu)</li>
                <li>Cliquez sur une tâche cible (prévisualisation de la ligne pendant le survol)</li>
                <li>La dépendance sera créée automatiquement</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">2. Modification des Dépendances</h3>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Cliquez sur une ligne de dépendance existante</li>
                <li>Un popover apparaîtra avec les options :</li>
                <li className="ml-4">- Changer le type de dépendance</li>
                <li className="ml-4">- Activer/désactiver la dépendance</li>
                <li className="ml-4">- Supprimer la dépendance</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">3. Gestionnaire de Dépendances</h3>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Faites un clic droit sur une tâche</li>
                <li>Sélectionnez "Gérer les dépendances"</li>
                <li>Dans le modal, vous pouvez :</li>
                <li className="ml-4">- Voir toutes les dépendances entrantes et sortantes</li>
                <li className="ml-4">- Ajouter de nouvelles dépendances</li>
                <li className="ml-4">- Modifier les propriétés des dépendances existantes</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">4. Feedback Visuel</h3>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Les lignes changent d'opacité au survol</li>
                <li>Les tâches liées sont mises en évidence lors du survol d'une dépendance</li>
                <li>Les dépendances désactivées apparaissent en pointillés</li>
                <li>Codes couleur : Bleu (FD), Vert (DD), Orange (FF), Rouge (DF)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <RelativeGanttView
            data={testData}
            onDateChange={handleDateChange}
            onTaskUpdate={handleTaskUpdate}
            onTaskAction={handleTaskAction}
            onDependencyUpdate={handleDependencyUpdate}
          />
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Note de Test</h3>
          <p className="text-sm text-blue-700">
            Ouvrez la console du navigateur pour voir les logs des actions effectuées.
            La tâche "Blanchiment dentaire" a une dépendance désactivée (ligne en pointillés) pour démonstration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestDependencyPhase2;