import React, { useState } from 'react';
import RelativeGanttView from '../components/gantt/RelativeGanttView';
import { exempleJsonIA, exempleAvecDependancesComplexes } from '../data/exempleJsonIA';
import { Button } from '../components/ui/button';

const TestTreatmentRoadmap = () => {
  const [useComplexExample, setUseComplexExample] = useState(false);
  const [selectedData, setSelectedData] = useState(exempleJsonIA);

  const handleDateChange = (newDate) => {
    console.log('Date de début changée:', newDate);
  };

  const handleTaskUpdate = (taskId, updates) => {
    console.log('Mise à jour de tâche:', { taskId, updates });
  };

  const handleTaskAction = (action, task) => {
    console.log('Action sur tâche:', { action, task });
    
    switch (action) {
      case 'edit':
        console.log('Éditer la tâche:', task);
        break;
      case 'duplicate':
        console.log('Dupliquer la tâche:', task);
        break;
      case 'delete':
        console.log('Supprimer la tâche:', task);
        break;
      case 'manage-dependencies':
        console.log('Gérer les dépendances de la tâche:', task);
        break;
      default:
        console.log('Action non reconnue:', action);
    }
  };

  const handleDependencyUpdate = (taskId, updatedDependencies) => {
    console.log('Mise à jour des dépendances:', { taskId, updatedDependencies });
    
    // Dans une vraie application, vous mettriez à jour l'état global ici
    // Par exemple:
    // updateTaskDependencies(taskId, updatedDependencies);
  };

  const toggleDataset = () => {
    const newUseComplex = !useComplexExample;
    setUseComplexExample(newUseComplex);
    setSelectedData(newUseComplex ? {
      ...exempleJsonIA,
      taches: exempleAvecDependancesComplexes.taches
    } : exempleJsonIA);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Test du composant RelativeGanttView
          </h1>
          
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <h2 className="text-lg font-semibold mb-2">Fonctionnalités disponibles :</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Drag & Drop des tâches pour modifier leur position temporelle</li>
              <li>Redimensionnement des tâches par les bords</li>
              <li>Création de dépendances par glisser-déposer entre les points de connexion</li>
              <li>Mode création de dépendances avec le bouton "Créer des dépendances"</li>
              <li>Gestion complète des dépendances via le menu contextuel</li>
              <li>Visualisation interactive des lignes de dépendances</li>
              <li>Support des dépendances multiples avec Shift + Click</li>
            </ul>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={toggleDataset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <span>Utiliser les données {useComplexExample ? 'simples' : 'complexes'}</span>
            </Button>
            <span className="text-sm text-gray-600">
              {useComplexExample 
                ? 'Données avec dépendances complexes (DD, FF, décalages)'
                : 'Données du plan de traitement dentaire complet'}
            </span>
          </div>
        </div>
        
        <RelativeGanttView
          data={selectedData}
          onDateChange={handleDateChange}
          onTaskUpdate={handleTaskUpdate}
          onTaskAction={handleTaskAction}
          onDependencyUpdate={handleDependencyUpdate}
          className="w-full"
        />

        <div className="mt-8 bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Instructions d'utilisation :</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>Déplacer une tâche :</strong> Cliquez et faites glisser une barre de tâche horizontalement</p>
            <p><strong>Redimensionner une tâche :</strong> Survolez les bords de la tâche et faites glisser</p>
            <p><strong>Créer une dépendance :</strong> Cliquez sur le bouton "Créer des dépendances", puis cliquez sur deux tâches</p>
            <p><strong>Créer une dépendance par drag & drop :</strong> Faites glisser depuis un point de connexion d'une tâche vers une autre</p>
            <p><strong>Gérer les dépendances :</strong> Clic droit sur une tâche → "Gérer les dépendances"</p>
            <p><strong>Modifier une dépendance :</strong> Cliquez sur une ligne de dépendance pour voir les options</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTreatmentRoadmap;