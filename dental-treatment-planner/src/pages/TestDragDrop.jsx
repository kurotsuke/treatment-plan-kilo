import React, { useState } from 'react';
import TreatmentRoadmap from '../components/TreatmentRoadmap';

const TestDragDrop = () => {
  const [taskUpdates, setTaskUpdates] = useState([]);
  
  // Données de test
  const testData = {
    taches: [
      {
        id: 'task-1',
        nom: 'Détartrage (dents: 11, 12)',
        phase: 1,
        duree: { valeur: 1, unite: 'jour' },
        statut: 'planned',
        medecin: 'Dr. Martin',
        dependances: []
      },
      {
        id: 'task-2',
        nom: 'Traitement carie (dents: 15)',
        phase: 1,
        duree: { valeur: 2, unite: 'jours' },
        statut: 'in-progress',
        medecin: 'Dr. Martin',
        dependances: []
      },
      {
        id: 'task-3',
        nom: 'Extraction (dents: 38)',
        phase: 2,
        duree: { valeur: 1, unite: 'jour' },
        statut: 'planned',
        medecin: 'Dr. Dupont',
        dependances: [{ id_tache_precedente: 'task-1', type: 'FD' }]
      },
      {
        id: 'task-4',
        nom: 'Pose implant (dents: 38)',
        phase: 2,
        duree: { valeur: 3, unite: 'jours' },
        statut: 'planned',
        medecin: 'Dr. Dupont',
        dependances: [{ id_tache_precedente: 'task-3', type: 'FD', decalage: { valeur: 7, unite: 'jours' } }]
      },
      {
        id: 'task-5',
        nom: 'Blanchiment (dents: toutes)',
        phase: 3,
        duree: { valeur: 1, unite: 'jour' },
        statut: 'completed',
        medecin: 'Dr. Martin',
        dependances: [{ id_tache_precedente: 'task-2', type: 'FD' }]
      }
    ],
    medecins_par_phase: {
      '1 - Phase': 'Dr. Martin',
      '2 - Phase': 'Dr. Dupont',
      '3 - Phase': 'Dr. Martin'
    }
  };

  const handleTaskUpdate = (update) => {
    console.log('Task update received:', update);
    setTaskUpdates(prev => [...prev, {
      ...update,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Drag & Drop - Vue Liste</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>Essayez de glisser une tâche d'une colonne à une autre</li>
          <li>Les logs apparaîtront dans la console du navigateur</li>
          <li>Les mises à jour seront affichées ci-dessous</li>
        </ul>
      </div>

      <TreatmentRoadmap
        treatmentPlanData={testData}
        onTaskUpdate={handleTaskUpdate}
      />

      {taskUpdates.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Mises à jour des tâches:</h2>
          <div className="bg-gray-100 rounded-lg p-4 space-y-2">
            {taskUpdates.map((update, index) => (
              <div key={index} className="bg-white p-2 rounded border border-gray-200">
                <span className="text-sm text-gray-500">{update.timestamp}</span>
                <span className="ml-2">
                  Tâche {update.taskId} - 
                  {update.status && ` Nouveau statut: ${update.status}`}
                  {update.phase && ` Nouvelle phase: ${update.phase}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDragDrop;