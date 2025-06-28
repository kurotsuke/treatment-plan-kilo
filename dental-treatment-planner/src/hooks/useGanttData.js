import { useMemo } from 'react';
import { useTreatmentPlan } from '../contexts/TreatmentPlanContext';
import { contextDataAdapter, mockDataAdapter } from '../adapters';

/**
 * Hook pour gérer les données Gantt depuis différentes sources
 */
export const useGanttData = (source, options = {}) => {
  const contextData = useTreatmentPlan();
  
  return useMemo(() => {
    try {
      switch (source) {
        case 'context':
          return {
            data: contextDataAdapter(contextData),
            loading: contextData.loading,
            error: contextData.error,
            refetch: () => {
              // Le contexte gère déjà les données
              console.log('Refetch depuis le contexte');
            }
          };
          
        case 'mock':
          const { mockData, patientId } = options;
          if (!mockData || !patientId) {
            throw new Error('mockData et patientId sont requis pour la source mock');
          }
          
          return {
            data: mockDataAdapter(mockData, patientId),
            loading: false,
            error: null,
            refetch: () => {
              console.log('Refetch des données mockées');
            }
          };
          
        case 'api':
          // À implémenter pour les futures données API
          return {
            data: null,
            loading: false,
            error: 'Source API non implémentée',
            refetch: () => {}
          };
          
        default:
          throw new Error(`Source de données inconnue: ${source}`);
      }
    } catch (error) {
      return {
        data: null,
        loading: false,
        error: error.message,
        refetch: () => {}
      };
    }
  }, [source, contextData, options]);
};

/**
 * Hook pour obtenir les données du contexte uniquement
 */
export const useContextGanttData = (patientId = null) => {
  const contextData = useTreatmentPlan();
  
  return useMemo(() => ({
    data: contextDataAdapter(contextData, patientId),
    loading: contextData.loading,
    error: contextData.error,
    contextActions: {
      moveTask: contextData.moveTask,
      addTask: contextData.addTask,
      deleteTask: contextData.deleteTask,
      updateTaskStatus: contextData.updateTaskStatus,
      updateTaskProgress: contextData.updateTaskProgress,
      addMilestone: contextData.addMilestone,
      removeMilestone: contextData.removeMilestone,
      connectToDropbox: contextData.connectToDropbox,
      setDropboxConnection: contextData.setDropboxConnection
    }
  }), [contextData]);
};

/**
 * Hook pour obtenir les données mockées
 */
export const useMockGanttData = (mockData, patientId) => {
  return useMemo(() => {
    if (!mockData || !patientId) {
      return {
        data: null,
        loading: false,
        error: 'Données mockées ou ID patient manquants'
      };
    }

    return {
      data: mockDataAdapter(mockData, patientId),
      loading: false,
      error: null
    };
  }, [mockData, patientId]);
};