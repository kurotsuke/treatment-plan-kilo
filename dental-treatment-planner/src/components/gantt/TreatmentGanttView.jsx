import React, { useMemo } from 'react';
import RelativeGanttView from './RelativeGanttView';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toRelativeGanttFormat } from '../../adapters/relativeGanttAdapter';

/**
 * Composant principal pour afficher le diagramme Gantt de traitement
 */
const TreatmentGanttView = ({
  data,
  handlers,
  title = "Planification du traitement",
  description = "Visualisez et gérez le planning complet du traitement",
  range = "monthly",
  zoom = 100,
  className = "",
  showError = true
}) => {
  const {
    handleTaskMove,
    handleTaskAdd,
    handleCreateMarker,
    handleMilestoneRemove,
    handleDurationChange,
    handleDependencyUpdate
  } = handlers || {};

  // Convertir les données au format RelativeGanttView
  const relativeGanttData = useMemo(() => {
    return toRelativeGanttFormat(data);
  }, [data]);

  // Vérification des données
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée disponible</h3>
          <p className="text-gray-500">Les données du traitement ne sont pas disponibles.</p>
        </div>
      </div>
    );
  }

  // Protection contre le rendu prématuré
  if (!relativeGanttData || !relativeGanttData.taches || relativeGanttData.taches.length === 0) {
    return (
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
        <div className="flex items-center justify-center h-64 border rounded-lg bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des tâches...</p>
          </div>
        </div>
      </div>
    );
  }

  // Gestion des erreurs
  if (showError && data.error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700">{data.error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
      {/* En-tête du Gantt */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {title}
            </h2>
            <p className="text-sm text-gray-600">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Utilisation de RelativeGanttView avec drag & drop pour les dépendances */}
      <RelativeGanttView
        data={relativeGanttData}
        onDateChange={handleTaskAdd}
        onTaskUpdate={handleTaskMove}
        onTaskAction={handleMilestoneRemove}
        onDependencyUpdate={handleDependencyUpdate}
      />
    </div>
  );
};

/**
 * Composant Gantt simplifié pour les cas d'usage basiques
 */
export const SimpleGanttView = ({
  tasks = [],
  milestones = [],
  onTaskMove,
  onTaskAdd,
  className = ""
}) => {
  const tasksByPhase = useTasksByPhase(tasks);

  return (
    <div className={className}>
      <GanttProvider
        range="monthly"
        zoom={100}
        onAddItem={onTaskAdd}
        tasks={tasks}
        className="h-[500px] border rounded-lg"
      >
        <div className="flex h-full">
          <GanttSidebar className="w-1/3 border-r">
            {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
              <GanttSidebarGroup key={phase} name={phase}>
                {phaseTasks.map((task) => (
                  <GanttSidebarItem
                    key={task.id}
                    feature={task}
                    onDurationChange={handleDurationChange}
                    className="hover:bg-gray-50"
                  />
                ))}
              </GanttSidebarGroup>
            ))}
          </GanttSidebar>

          <GanttTimeline className="flex-1">
            <GanttHeader />
            
            <GanttFeatureList>
              {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
                <GanttFeatureListGroup key={phase}>
                  {phaseTasks.map((task) => (
                    <GanttFeatureItem
                      key={task.id}
                      {...task}
                      onMove={onTaskMove}
                    >
                      <span className="text-xs font-medium truncate">
                        {task.name}
                      </span>
                    </GanttFeatureItem>
                  ))}
                </GanttFeatureListGroup>
              ))}
            </GanttFeatureList>

            <GanttToday className="bg-red-100 text-red-800 border-red-200" />
          </GanttTimeline>
        </div>
      </GanttProvider>
    </div>
  );
};

export default TreatmentGanttView;