import React, { useState } from 'react';
import RelativeGanttView from '../components/gantt/RelativeGanttView';

/**
 * Page de test pour la nouvelle approche de gestion des dépendances par drag & drop
 */
const TestDragDropDependencies = () => {
  // Données de test
  const [testData] = useState({
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
        nom: 'Détartrage (dents: toutes)',
        phase: 1,
        duree: { valeur: 2, unite: 'jours' },
        dependances: [
          {
            id_tache_precedente: 'task-2',
            type: 'FD',
            decalage: { valeur: 1, unite: 'jour' }
          }
        ],
        statut: 'in-progress',
        medecin: 'Dr. Dupont'
      },
      {
        id: 'task-4',
        nom: 'Traitement carie (dents: 16)',
        phase: 1,
        duree: { valeur: 1, unite: 'jour' },
        dependances: [],
        statut: 'planned',
        medecin: 'Dr. Martin'
      },
      {
        id: 'task-5',
        nom: 'Extraction (dents: 38)',
        phase: 2,
        duree: { valeur: 1, unite: 'jour' },
        dependances: [],
        statut: 'planned',
        medecin: 'Dr. Chirurgien'
      },
      {
        id: 'task-6',
        nom: 'Pose implant (dents: 36)',
        phase: 2,
        duree: { valeur: 2, unite: 'jours' },
        dependances: [],
        statut: 'planned',
        medecin: 'Dr. Implantologue'
      },
      {
        id: 'task-7',
        nom: 'Couronne provisoire (dents: 36)',
        phase: 2,
        duree: { valeur: 1, unite: 'jour' },
        dependances: [],
        statut: 'planned',
        medecin: 'Dr. Prothésiste'
      },
      {
        id: 'task-8',
        nom: 'Blanchiment (dents: toutes)',
        phase: 3,
        duree: { valeur: 3, unite: 'jours' },
        dependances: [],
        statut: 'planned',
        medecin: 'Dr. Esthétique'
      }
    ],
    medecins_par_phase: {
      '1 - Phase': 'Dr. Martin',
      '2 - Phase': 'Dr. Spécialiste',
      '3 - Phase': 'Dr. Esthétique'
    }
  });

  const handleTaskUpdate = (taskId, updates) => {
    console.log('Task updated:', { taskId, updates });
  };

  const handleTaskAction = (action, task) => {
    console.log('Task action:', { action, task });
  };

  const handleDependencyUpdate = (taskId, dependencies) => {
    console.log('Dependencies updated:', { taskId, dependencies });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test - Gestion des dépendances par Drag & Drop
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h2 className="font-semibold text-blue-900 mb-2">Instructions :</h2>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>Survolez une tâche pour voir apparaître les points de connexion</li>
              <li>Cliquez et tirez depuis un point vers une autre tâche pour créer une dépendance</li>
              <li>Point gauche : crée une dépendance Début-Début</li>
              <li>Point droit : crée une dépendance Fin-Début (par défaut)</li>
              <li>Survolez une ligne de dépendance pour voir le bouton de suppression</li>
              <li>Maintenez Shift pour ajouter plusieurs dépendances à une même tâche</li>
            </ul>
          </div>
        </div>

        <RelativeGanttView
          data={testData}
          onTaskUpdate={handleTaskUpdate}
          onTaskAction={handleTaskAction}
          onDependencyUpdate={handleDependencyUpdate}
        />
      </div>
    </div>
  );
};

export default TestDragDropDependencies;