import { useCallback } from 'react';

/**
 * Hook pour gérer les handlers d'événements Gantt
 */
export const useGanttHandlers = (data, updateFunctions = {}) => {
  const {
    onTaskMove,
    onTaskAdd,
    onTaskDelete,
    onTaskStatusUpdate,
    onTaskProgressUpdate,
    onTaskDurationChange,
    onMilestoneAdd,
    onMilestoneRemove
  } = updateFunctions;

  // Handler pour déplacer une tâche
  const handleTaskMove = useCallback((id, startDate, endDate) => {
    if (onTaskMove) {
      onTaskMove(id, startDate, endDate);
    } else {
      console.log(`Déplacer tâche ${id} de ${startDate} à ${endDate}`);
    }
  }, [onTaskMove]);

  // Handler pour ajouter une tâche
  const handleTaskAdd = useCallback((date) => {
    if (onTaskAdd) {
      onTaskAdd(date);
    } else {
      const newTask = {
        name: 'Nouvelle tâche',
        startAt: date,
        endAt: date,
        phase: 'Non défini',
        progression: 0
      };
      console.log('Ajouter nouvelle tâche:', newTask);
    }
  }, [onTaskAdd]);

  // Handler pour supprimer une tâche
  const handleTaskDelete = useCallback((id) => {
    if (onTaskDelete) {
      onTaskDelete(id);
    } else {
      console.log(`Supprimer tâche ${id}`);
    }
  }, [onTaskDelete]);

  // Handler pour mettre à jour le statut d'une tâche
  const handleTaskStatusUpdate = useCallback((id, status) => {
    if (onTaskStatusUpdate) {
      onTaskStatusUpdate(id, status);
    } else {
      console.log(`Mettre à jour statut tâche ${id}:`, status);
    }
  }, [onTaskStatusUpdate]);

  // Handler pour mettre à jour la progression d'une tâche
  const handleTaskProgressUpdate = useCallback((id, progress) => {
    if (onTaskProgressUpdate) {
      onTaskProgressUpdate(id, progress);
    } else {
      console.log(`Mettre à jour progression tâche ${id}: ${progress}%`);
    }
  }, [onTaskProgressUpdate]);

  // Handler pour changer la durée d'une tâche
  const handleDurationChange = useCallback((id, duration, durationType, newEndDate) => {
    if (onTaskDurationChange) {
      onTaskDurationChange(id, duration, durationType, newEndDate);
    } else {
      console.log(`Changer durée tâche ${id}: ${duration} ${durationType}, nouvelle fin: ${newEndDate.toLocaleDateString()}`);
    }
  }, [onTaskDurationChange]);

  // Handler pour ajouter un jalon
  const handleMilestoneAdd = useCallback((date, label = 'Nouveau jalon') => {
    if (onMilestoneAdd) {
      onMilestoneAdd({ date, label });
    } else {
      console.log(`Ajouter jalon: ${label} à ${date}`);
    }
  }, [onMilestoneAdd]);

  // Handler pour supprimer un jalon
  const handleMilestoneRemove = useCallback((id) => {
    if (onMilestoneRemove) {
      onMilestoneRemove(id);
    } else {
      console.log(`Supprimer jalon ${id}`);
    }
  }, [onMilestoneRemove]);

  // Handler pour créer un marqueur (jalon) depuis le Gantt
  const handleCreateMarker = useCallback((date) => {
    handleMilestoneAdd(date, 'Nouveau jalon');
  }, [handleMilestoneAdd]);

  return {
    handleTaskMove,
    handleTaskAdd,
    handleTaskDelete,
    handleTaskStatusUpdate,
    handleTaskProgressUpdate,
    handleDurationChange,
    handleMilestoneAdd,
    handleMilestoneRemove,
    handleCreateMarker
  };
};

/**
 * Hook spécialisé pour les handlers du contexte
 */
export const useContextGanttHandlers = (contextActions) => {
  return useGanttHandlers(null, {
    onTaskMove: contextActions.moveTask,
    onTaskAdd: contextActions.addTask,
    onTaskDelete: contextActions.deleteTask,
    onTaskStatusUpdate: contextActions.updateTaskStatus,
    onTaskProgressUpdate: contextActions.updateTaskProgress,
    onTaskDurationChange: contextActions.updateTaskDuration,
    onMilestoneAdd: contextActions.addMilestone,
    onMilestoneRemove: contextActions.removeMilestone
  });
};

/**
 * Hook spécialisé pour les handlers des données mockées
 */
export const useMockGanttHandlers = (setters) => {
  const {
    setProcedures,
    setMarkers
  } = setters;

  return useGanttHandlers(null, {
    onTaskMove: (id, startAt, endAt) => {
      if (setProcedures) {
        setProcedures(prev =>
          prev.map(procedure =>
            procedure.id === id ? { ...procedure, startAt, endAt } : procedure
          )
        );
      }
    },
    onTaskAdd: (date) => {
      console.log(`Ajouter procédure à ${date}`);
      // Implémentation spécifique pour les données mockées
    },
    onTaskDurationChange: (id, duration, durationType, newEndDate) => {
      if (setProcedures) {
        setProcedures(prev =>
          prev.map(procedure =>
            procedure.id === id ? { ...procedure, endAt: newEndDate } : procedure
          )
        );
        console.log(`Durée mise à jour pour tâche ${id}: ${duration} ${durationType}, nouvelle fin: ${newEndDate.toLocaleDateString()}`);
      }
    },
    onMilestoneAdd: (milestone) => {
      if (setMarkers) {
        const newMarker = {
          id: `marker-${Date.now()}`,
          date: milestone.date,
          label: milestone.label,
          className: 'bg-purple-100 text-purple-900'
        };
        setMarkers(prev => [...prev, newMarker]);
      }
    },
    onMilestoneRemove: (id) => {
      if (setMarkers) {
        setMarkers(prev => prev.filter(marker => marker.id !== id));
      }
    }
  });
};