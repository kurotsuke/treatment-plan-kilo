import React from 'react';
import { CheckCircleIcon, PlayCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Badge } from '../ui/badge';

/**
 * Composant pour afficher les statistiques du Gantt
 */
const GanttStatistics = ({ 
  statistics, 
  showDetailed = false, 
  className = "",
  overdueTasks = []
}) => {
  const {
    total = 0,
    completed = 0,
    inProgress = 0,
    planned = 0,
    globalProgress = 0,
    milestonesCount = 0
  } = statistics || {};

  if (showDetailed) {
    // Version détaillée pour la page principale
    return (
      <div className={`flex items-center justify-center space-x-6 ${className}`}>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-xs text-gray-500">Procédures totales</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
            <span className="text-2xl font-bold text-green-600">{completed}</span>
          </div>
          <div className="text-xs text-gray-500">Terminées</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center">
            <PlayCircleIcon className="h-5 w-5 text-blue-500 mr-1" />
            <span className="text-2xl font-bold text-blue-600">{inProgress}</span>
          </div>
          <div className="text-xs text-gray-500">En cours</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center">
            <ClockIcon className="h-5 w-5 text-gray-400 mr-1" />
            <span className="text-2xl font-bold text-gray-600">{planned}</span>
          </div>
          <div className="text-xs text-gray-500">Planifiées</div>
        </div>
      </div>
    );
  }

  // Version compacte pour le header
  return (
    <div className={`flex items-center space-x-4 text-sm ${className}`}>
      <div className="text-center">
        <div className="font-semibold text-blue-600">{total}</div>
        <div className="text-gray-500">Tâches</div>
      </div>
      <div className="text-center">
        <div className="font-semibold text-green-600">{globalProgress}%</div>
        <div className="text-gray-500">Terminé</div>
      </div>
      {milestonesCount > 0 && (
        <div className="text-center">
          <div className="font-semibold text-purple-600">{milestonesCount}</div>
          <div className="text-gray-500">Jalons</div>
        </div>
      )}
    </div>
  );
};

/**
 * Composant pour afficher les badges de statut
 */
export const GanttStatusBadges = ({ 
  globalProgress, 
  overdueTasks = [], 
  className = "" 
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Badge de progression globale */}
      <Badge variant="outline">
        Progression: {globalProgress}%
      </Badge>
      
      {/* Badge d'alerte pour les tâches en retard */}
      {overdueTasks.length > 0 && (
        <Badge variant="destructive">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          {overdueTasks.length} en retard
        </Badge>
      )}
    </div>
  );
};

/**
 * Composant pour afficher les statistiques par statut
 */
export const GanttStatusBreakdown = ({ statistics, className = "" }) => {
  const {
    total = 0,
    completed = 0,
    inProgress = 0,
    planned = 0
  } = statistics || {};

  const getPercentage = (value) => total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Terminées</span>
        <span className="font-medium text-green-600">
          {completed} ({getPercentage(completed)}%)
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">En cours</span>
        <span className="font-medium text-blue-600">
          {inProgress} ({getPercentage(inProgress)}%)
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Planifiées</span>
        <span className="font-medium text-gray-600">
          {planned} ({getPercentage(planned)}%)
        </span>
      </div>
    </div>
  );
};

export default GanttStatistics;