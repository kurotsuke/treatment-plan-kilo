import { useMemo } from 'react';

/**
 * Hook pour calculer les statistiques des tâches Gantt
 */
export const useGanttStatistics = (tasks, milestones) => {
  return useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        planned: 0,
        overdue: 0,
        globalProgress: 0,
        milestonesCount: milestones?.length || 0
      };
    }

    const total = tasks.length;
    const completed = tasks.filter(t => 
      t.status?.id === 'termine' || t.status?.id === 'completed'
    ).length;
    const inProgress = tasks.filter(t => 
      t.status?.id === 'enCours' || t.status?.id === 'in-progress'
    ).length;
    const planned = tasks.filter(t => 
      t.status?.id === 'planifie' || t.status?.id === 'planned'
    ).length;
    
    // Tâches en retard
    const today = new Date();
    const overdue = tasks.filter(task => 
      task.endAt < today && 
      (task.status?.id !== 'termine' && task.status?.id !== 'completed')
    ).length;
    
    // Progression globale
    const globalProgress = Math.round(
      tasks.reduce((sum, task) => sum + (task.progression || 0), 0) / total
    );

    return {
      total,
      completed,
      inProgress,
      planned,
      overdue,
      globalProgress,
      milestonesCount: milestones?.length || 0
    };
  }, [tasks, milestones]);
};

/**
 * Hook pour grouper les tâches par phase
 */
export const useTasksByPhase = (tasks) => {
  return useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {};
    }

    return tasks.reduce((acc, task) => {
      const phase = task.phase || 'Non défini';
      if (!acc[phase]) {
        acc[phase] = [];
      }
      acc[phase].push(task);
      return acc;
    }, {});
  }, [tasks]);
};

/**
 * Hook pour obtenir les tâches en retard
 */
export const useOverdueTasks = (tasks) => {
  return useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    const today = new Date();
    return tasks.filter(task => 
      task.endAt < today && 
      (task.status?.id !== 'termine' && task.status?.id !== 'completed')
    );
  }, [tasks]);
};