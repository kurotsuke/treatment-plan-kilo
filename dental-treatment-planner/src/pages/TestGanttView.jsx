import React, { useState } from 'react';
import RelativeGanttView from '../components/gantt/RelativeGanttView';

const TestGanttView = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [testData, setTestData] = useState({
    taches: [
      {
        id: 'task-1',
        nom: 'Détartrage et polissage (dents: 11, 12, 13)',
        phase: 1,
        duree: { valeur: 1, unite: 'jour' },
        medecin: 'Dr. Martin',
        dependances: [],
        statut: 'completed'
      },
      {
        id: 'task-2',
        nom: 'Traitement carie (dents: 14, 15)',
        phase: 1,
        duree: { valeur: 2, unite: 'jours' },
        medecin: 'Dr. Martin',
        dependances: [
          {
            id_tache_precedente: 'task-1',
            type: 'fin-debut',
            decalage: { valeur: 1, unite: 'jour' }
          }
        ],
        statut: 'in-progress'
      },
      {
        id: 'task-3',
        nom: 'Extraction dent de sagesse (dents: 18)',
        phase: 1,
        duree: { valeur: 1, unite: 'jour' },
        medecin: 'Dr. Dupont',
        dependances: [
          {
            id_tache_precedente: 'task-2',
            type: 'fin-debut',
            decalage: { valeur: 3, unite: 'jours' }
          }
        ],
        statut: 'planned'
      },
      {
        id: 'task-4',
        nom: 'Pose couronne (dents: 26)',
        phase: 2,
        duree: { valeur: 2, unite: 'semaines' },
        medecin: 'Dr. Martin',
        dependances: [
          {
            id_tache_precedente: 'task-3',
            type: 'fin-debut',
            decalage: { valeur: 1, unite: 'semaine' }
          }
        ],
        statut: 'planned'
      },
      {
        id: 'task-5',
        nom: 'Blanchiment dentaire (dents: 11, 12, 13, 21, 22, 23)',
        phase: 3,
        duree: { valeur: 3, unite: 'jours' },
        medecin: 'Dr. Dubois',
        dependances: [
          {
            id_tache_precedente: 'task-4',
            type: 'fin-debut',
            decalage: { valeur: 2, unite: 'semaines' }
          }
        ],
        statut: 'planned'
      }
    ],
    medecins_par_phase: {
      '1 - Phase': 'Dr. Martin',
      '2 - Phase': 'Dr. Martin',
      '3 - Phase': 'Dr. Dubois'
    }
  });

  // Gestion de la mise à jour des tâches
  const handleTaskUpdate = (taskId, updates) => {
    console.log('Task update:', taskId, updates);
    
    // Ici, vous pourriez mettre à jour les données dans votre état ou base de données
    // Pour cet exemple, on affiche juste dans la console
    setTestData(prevData => ({
      ...prevData,
      taches: prevData.taches.map(tache => 
        tache.id === taskId 
          ? { ...tache, ...updates }
          : tache
      )
    }));
  };

  // Gestion des actions du menu contextuel
  const handleTaskAction = (action, task) => {
    console.log('Task action:', action, task);
    
    switch (action) {
      case 'edit':
        alert(`Édition de la tâche: ${task.name}`);
        break;
      case 'duplicate':
        alert(`Duplication de la tâche: ${task.name}`);
        break;
      case 'delete':
        if (confirm(`Voulez-vous vraiment supprimer la tâche: ${task.name}?`)) {
          setTestData(prevData => ({
            ...prevData,
            taches: prevData.taches.filter(t => t.id !== task.id)
          }));
        }
        break;
      case 'dependencies':
        alert(`Gestion des dépendances pour: ${task.name}`);
        break;
      default:
        console.log('Action non gérée:', action);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test de la vue Gantt avec fonctionnalités avancées</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Informations du test</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Nombre de tâches:</span> {testData.taches.length}
            </div>
            <div>
              <span className="font-medium">Date de début:</span> {startDate.toLocaleDateString('fr-FR')}
            </div>
            <div>
              <span className="font-medium">Phases:</span> 3 (Soins, Fonctionnelle, Esthétique)
            </div>
            <div>
              <span className="font-medium">Médecins:</span> Dr. Martin, Dr. Dupont, Dr. Dubois
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <RelativeGanttView
            data={testData}
            onDateChange={(date) => {
              console.log('Date changed:', date);
              setStartDate(date);
            }}
            onTaskUpdate={handleTaskUpdate}
            onTaskAction={handleTaskAction}
          />
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Nouvelles fonctionnalités:</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li><strong>Drag & Drop:</strong> Déplacez les barres horizontalement pour changer les dates</li>
            <li><strong>Resize:</strong> Redimensionnez les barres en tirant sur les bords gauche/droit</li>
            <li><strong>Context Menu:</strong> Clic droit ou bouton menu (⋮) pour accéder aux actions</li>
            <li><strong>Avatars:</strong> Les initiales des médecins sont affichées dans les barres</li>
            <li><strong>Statuts:</strong> Les tâches ont des couleurs selon leur statut (terminé, en cours, planifié)</li>
          </ul>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Instructions d'utilisation:</h3>
          <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
            <li>Survolez une barre pour voir les poignées de redimensionnement</li>
            <li>Cliquez et glissez une barre pour la déplacer dans le temps</li>
            <li>Cliquez sur le bouton menu (⋮) pour voir les options disponibles</li>
            <li>Les actions sont loggées dans la console pour le débogage</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestGanttView;