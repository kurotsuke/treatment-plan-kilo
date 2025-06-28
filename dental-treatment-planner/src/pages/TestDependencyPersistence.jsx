import React, { useState } from 'react';
import RelativeGanttView from '../components/gantt/RelativeGanttView';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

// Générateur d'ID unique pour éviter les duplications
let logIdCounter = 0;
const generateLogId = () => {
  logIdCounter++;
  return `log_${Date.now()}_${logIdCounter}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Page de test pour vérifier la persistance des dépendances
 */
const TestDependencyPersistence = () => {
  // État pour stocker les données du plan de traitement
  const [treatmentData, setTreatmentData] = useState({
    taches: [
      {
        id: 'task-1',
        nom: 'Détartrage complet',
        phase: 1,
        duree: { valeur: 1, unite: 'jour' },
        dependances: [],
        statut: 'planned'
      },
      {
        id: 'task-2',
        nom: 'Radiographie panoramique',
        phase: 1,
        duree: { valeur: 1, unite: 'jour' },
        dependances: [],
        statut: 'planned'
      },
      {
        id: 'task-3',
        nom: 'Traitement carie dent 16',
        phase: 1,
        duree: { valeur: 2, unite: 'jours' },
        dependances: [],
        statut: 'planned'
      },
      {
        id: 'task-4',
        nom: 'Extraction dent 38',
        phase: 2,
        duree: { valeur: 1, unite: 'jour' },
        dependances: [],
        statut: 'planned'
      },
      {
        id: 'task-5',
        nom: 'Pose implant',
        phase: 2,
        duree: { valeur: 2, unite: 'jours' },
        dependances: [],
        statut: 'planned'
      }
    ],
    medecins_par_phase: {
      '1 - Phase': 'Dr. Martin',
      '2 - Phase': 'Dr. Dupont',
      '3 - Phase': 'Dr. Bernard'
    }
  });

  // État pour stocker les logs
  const [logs, setLogs] = useState([]);
  
  // Ajouter un log
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    setLogs(prev => [{
      id: generateLogId(),
      message,
      type,
      timestamp
    }, ...prev].slice(0, 10)); // Garder seulement les 10 derniers logs
  };

  // Handler pour la mise à jour des dépendances
  const handleDependencyUpdate = (taskId, dependencies) => {
    console.log('=== DEPENDENCY UPDATE ===', { taskId, dependencies });
    
    addLog(`Mise à jour des dépendances pour la tâche ${taskId}`, 'success');
    addLog(`Nouvelles dépendances: ${JSON.stringify(dependencies)}`, 'info');
    
    // Mettre à jour l'état
    setTreatmentData(prevData => ({
      ...prevData,
      taches: prevData.taches.map(tache => {
        if (tache.id === taskId) {
          const updatedTask = {
            ...tache,
            dependances: dependencies
          };
          console.log('Tâche mise à jour:', updatedTask);
          return updatedTask;
        }
        return tache;
      })
    }));
  };

  // Handler pour la mise à jour des tâches
  const handleTaskUpdate = (taskId, updates) => {
    console.log('=== TASK UPDATE ===', { taskId, updates });
    
    addLog(`Mise à jour de la tâche ${taskId}`, 'info');
    
    setTreatmentData(prevData => ({
      ...prevData,
      taches: prevData.taches.map(tache => {
        if (tache.id === taskId) {
          return {
            ...tache,
            ...updates
          };
        }
        return tache;
      })
    }));
  };

  // Handler pour les actions sur les tâches
  const handleTaskAction = (action, task) => {
    addLog(`Action ${action} sur la tâche ${task.id}`, 'warning');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Test de Persistance des Dépendances
          </h1>
          <p className="text-gray-600">
            Cette page teste que les dépendances créées par drag & drop sont bien persistées dans l'état.
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Survolez une tâche pour voir les points de connexion</li>
              <li>Cliquez et tirez depuis le point droit (sortie) d'une tâche</li>
              <li>Relâchez sur une autre tâche pour créer une dépendance</li>
              <li>Vérifiez dans les logs et l'état que la dépendance est persistée</li>
            </ol>
          </div>
        </div>

        {/* État actuel */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">État actuel des dépendances</h2>
          <div className="space-y-2">
            {treatmentData.taches.map(tache => (
              <div key={tache.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{tache.id}</span>
                  <span className="ml-2 text-gray-600">{tache.nom}</span>
                </div>
                <div className="text-sm">
                  {tache.dependances && tache.dependances.length > 0 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircleIcon className="w-4 h-4" />
                      {tache.dependances.length} dépendance(s): {tache.dependances.map(d => d.id_tache_precedente).join(', ')}
                    </span>
                  ) : (
                    <span className="text-gray-400">Aucune dépendance</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gantt View */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vue Gantt Interactive</h2>
          <RelativeGanttView
            data={treatmentData}
            onDependencyUpdate={handleDependencyUpdate}
            onTaskUpdate={handleTaskUpdate}
            onTaskAction={handleTaskAction}
          />
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Logs d'activité</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Aucune activité pour le moment</p>
            ) : (
              logs.map(log => (
                <div 
                  key={log.id} 
                  className={`
                    p-3 rounded-lg flex items-start gap-2
                    ${log.type === 'success' ? 'bg-green-50 text-green-800' : 
                      log.type === 'warning' ? 'bg-yellow-50 text-yellow-800' : 
                      log.type === 'error' ? 'bg-red-50 text-red-800' : 
                      'bg-gray-50 text-gray-800'}
                  `}
                >
                  <span className="text-xs font-mono">{log.timestamp}</span>
                  <span className="flex-1 text-sm">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* État JSON brut */}
        <details className="bg-white rounded-lg shadow-sm p-6">
          <summary className="cursor-pointer font-semibold text-gray-900 mb-4">
            État JSON brut (cliquez pour afficher)
          </summary>
          <pre className="mt-4 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-xs">
            {JSON.stringify(treatmentData, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default TestDependencyPersistence;