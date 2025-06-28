import React from 'react';
import { RelativeGanttView } from '../components/gantt';
import { exempleJsonIA } from '../data/exempleJsonIA';

const TestRelativeGantt = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Test du Diagramme Gantt avec Dates Relatives
          </h1>
          <p className="mt-2 text-gray-600">
            Cette page teste le composant RelativeGanttView avec des données d'exemple
          </p>
        </div>

        <RelativeGanttView 
          data={exempleJsonIA}
          onDateChange={(newDate) => {
            console.log('Date de début changée:', newDate);
          }}
        />
      </div>
    </div>
  );
};

export default TestRelativeGantt;