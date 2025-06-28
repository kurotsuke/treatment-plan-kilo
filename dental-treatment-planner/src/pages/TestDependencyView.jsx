import React, { useState } from 'react';
import RelativeGanttView from '../components/gantt/RelativeGanttView';

// Données de test avec dépendances
const testData = {
  medecins_par_phase: {
    "1 - Phase de soins": "Dr. Martin",
    "2 - Phase fonctionnelle et orthodontie": "Dr. Dubois",
    "3 - Phase esthétique": "Dr. Laurent"
  },
  taches: [
    {
      id: "T1",
      nom: "Consultation initiale et bilan",
      phase: 1,
      duree: { valeur: 1, unite: "jour" },
      dependances: [],
      statut: "completed"
    },
    {
      id: "T2",
      nom: "Détartrage complet",
      phase: 1,
      duree: { valeur: 1, unite: "jour" },
      dependances: [
        {
          id_tache_precedente: "T1",
          type: "fin-debut",
          decalage: { valeur: 2, unite: "jours" }
        }
      ],
      statut: "completed"
    },
    {
      id: "T3",
      nom: "Extraction dent 16",
      phase: 1,
      duree: { valeur: 1, unite: "jour" },
      dependances: [
        {
          id_tache_precedente: "T2",
          type: "fin-debut",
          decalage: { valeur: 1, unite: "jour" }
        }
      ],
      statut: "in-progress"
    },
    {
      id: "T4",
      nom: "Cicatrisation post-extraction",
      phase: 1,
      duree: { valeur: 3, unite: "semaines" },
      dependances: [
        {
          id_tache_precedente: "T3",
          type: "fin-debut",
          decalage: { valeur: 0, unite: "jour" }
        }
      ],
      medecin: "Patient",
      statut: "planned"
    },
    {
      id: "T5",
      nom: "Pose implant dent 16",
      phase: 2,
      duree: { valeur: 2, unite: "jours" },
      dependances: [
        {
          id_tache_precedente: "T4",
          type: "fin-debut",
          decalage: { valeur: 1, unite: "semaine" }
        }
      ],
      statut: "planned"
    },
    {
      id: "T6",
      nom: "Ostéointégration implant",
      phase: 2,
      duree: { valeur: 4, unite: "mois" },
      dependances: [
        {
          id_tache_precedente: "T5",
          type: "fin-debut",
          decalage: { valeur: 0, unite: "jour" }
        }
      ],
      medecin: "Patient",
      statut: "planned"
    },
    {
      id: "T7",
      nom: "Prise d'empreinte couronne",
      phase: 3,
      duree: { valeur: 1, unite: "jour" },
      dependances: [
        {
          id_tache_precedente: "T6",
          type: "fin-debut",
          decalage: { valeur: 1, unite: "semaine" }
        }
      ],
      statut: "planned"
    },
    {
      id: "T8",
      nom: "Pose couronne sur implant",
      phase: 3,
      duree: { valeur: 1, unite: "jour" },
      dependances: [
        {
          id_tache_precedente: "T7",
          type: "fin-debut",
          decalage: { valeur: 2, unite: "semaines" }
        }
      ],
      statut: "planned"
    },
    // Exemple de dépendances parallèles
    {
      id: "T9",
      nom: "Traitement carie dent 24",
      phase: 1,
      duree: { valeur: 1, unite: "jour" },
      dependances: [
        {
          id_tache_precedente: "T2",
          type: "fin-debut",
          decalage: { valeur: 1, unite: "jour" }
        }
      ],
      statut: "in-progress"
    },
    {
      id: "T10",
      nom: "Traitement carie dent 25",
      phase: 1,
      duree: { valeur: 1, unite: "jour" },
      dependances: [
        {
          id_tache_precedente: "T2",
          type: "debut-debut",
          decalage: { valeur: 0, unite: "jour" }
        }
      ],
      statut: "in-progress"
    },
    // Exemple de dépendance fin-fin
    {
      id: "T11",
      nom: "Blanchiment dentaire",
      phase: 3,
      duree: { valeur: 2, unite: "semaines" },
      dependances: [
        {
          id_tache_precedente: "T8",
          type: "fin-fin",
          decalage: { valeur: 0, unite: "jour" }
        }
      ],
      statut: "planned"
    }
  ]
};

const TestDependencyView = () => {
  const [startDate, setStartDate] = useState(new Date());
  
  const handleDateChange = (newDate) => {
    console.log('Date de début changée:', newDate);
    setStartDate(newDate);
  };
  
  const handleTaskUpdate = (taskId, updates) => {
    console.log('Mise à jour de la tâche:', taskId, updates);
  };
  
  const handleTaskAction = (action, task) => {
    console.log('Action sur la tâche:', action, task);
    
    if (action === 'dependencies') {
      alert(`Gestion des dépendances pour: ${task.name}\nCette fonctionnalité sera implémentée dans la Phase 2.`);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test de Visualisation des Dépendances
          </h1>
          <p className="text-gray-600">
            Cette page teste l'affichage des lignes de dépendances entre les tâches du diagramme Gantt.
          </p>
        </div>
        
        {/* Légende des types de dépendances */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Types de dépendances</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-12 h-0.5 bg-blue-500"></div>
              <span>Fin-Début (FD)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-0.5 bg-green-500"></div>
              <span>Début-Début (DD)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-0.5 bg-orange-500"></div>
              <span>Fin-Fin (FF)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-0.5 bg-red-500"></div>
              <span>Début-Fin (DF)</span>
            </div>
          </div>
        </div>
        
        {/* Diagramme Gantt avec dépendances */}
        <RelativeGanttView
          data={testData}
          onDateChange={handleDateChange}
          onTaskUpdate={handleTaskUpdate}
          onTaskAction={handleTaskAction}
        />
        
        {/* Instructions */}
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Les lignes colorées représentent les dépendances entre les tâches</li>
            <li>• Survolez une ligne pour voir les détails de la dépendance</li>
            <li>• Cliquez sur une ligne pour sélectionner la dépendance (log dans la console)</li>
            <li>• Les flèches indiquent la direction de la dépendance</li>
            <li>• Les lignes en pointillés représentent des dépendances désactivées (si présentes)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestDependencyView;