/**
 * Utilitaires pour les calculs de dépendances dans le Gantt
 */

import { dureeEnJours } from './dateCalculations';

/**
 * Fonction simplifiée pour calculer les mises à jour des tâches dépendantes
 * Utilise la logique "after" : une tâche commence après qu'une autre se termine
 * @param {string} modifiedTaskId - ID de la tâche modifiée
 * @param {Date} newStartDate - Nouvelle date de début
 * @param {Date} newEndDate - Nouvelle date de fin
 * @param {Array} tasks - Liste des tâches actuelles
 * @param {Array} originalTasks - Liste des tâches originales (pour les durées)
 * @param {Date} projectStartDate - Date de début du projet
 * @param {Set} visitedTasks - Set des tâches déjà visitées (évite les boucles)
 * @returns {Object} Objet avec les mises à jour des tâches dépendantes
 */
export function calculateSmartDependentUpdates(
  modifiedTaskId,
  newStartDate,
  newEndDate,
  tasks,
  originalTasks,
  projectStartDate,
  visitedTasks = new Set()
) {
  if (visitedTasks.has(modifiedTaskId)) {
    return {};
  }
  
  console.log('[calculateSmartDependentUpdates] DEBUG - Input:', {
    modifiedTaskId,
    newStartDate: newStartDate?.toISOString(),
    newEndDate: newEndDate?.toISOString(),
    isValidStartDate: newStartDate instanceof Date && !isNaN(newStartDate),
    isValidEndDate: newEndDate instanceof Date && !isNaN(newEndDate)
  });
  
  visitedTasks.add(modifiedTaskId);
  const updatedTasks = {};
  
  // Trouver toutes les tâches qui dépendent de la tâche modifiée
  const dependentTasks = tasks.filter(task => {
    const originalTask = originalTasks.find(t => t.id === task.id);
    return originalTask?.dependances?.some(dep => {
      // Gérer les différents formats de dépendance
      const depId = typeof dep === 'string' ? dep : (dep.after || dep.id_tache_precedente || dep.id);
      return depId === modifiedTaskId;
    });
  });
  
  dependentTasks.forEach(dependentTask => {
    const originalTask = originalTasks.find(t => t.id === dependentTask.id);
    const dependency = originalTask.dependances.find(dep => {
      const depId = typeof dep === 'string' ? dep : (dep.after || dep.id_tache_precedente || dep.id);
      return depId === modifiedTaskId;
    });
    
    if (!dependency) return;
    
    // Toujours calculer la durée depuis la tâche originale
    const dureeOriginaleJours = originalTask.duree ? dureeEnJours(originalTask.duree) : 1;
    
    console.log('[calculateSmartDependentUpdates] DEBUG - Dependent task:', {
      taskId: dependentTask.id,
      originalDuree: originalTask.duree,
      dureeOriginaleJours
    });
    
    // Extraire le décalage si spécifié
    let decalageJours = 0;
    if (typeof dependency === 'object' && dependency.decalage) {
      decalageJours = dureeEnJours(dependency.decalage);
    }
    
    // Logique simplifiée "after" : la tâche doit commencer après la fin de la tâche modifiée
    const decalageEffectif = decalageJours === 0 ? 1 : decalageJours; // 1 jour par défaut pour éviter le chevauchement
    const requiredStartDate = new Date(newEndDate);
    requiredStartDate.setDate(requiredStartDate.getDate() + decalageEffectif);
    
    console.log(`[calculateSmartDependentUpdates] After dependency: décalage=${decalageJours}, effectif=${decalageEffectif}`);
    
    // Mettre à jour seulement si la tâche commence avant la date requise
    if (dependentTask.startAt < requiredStartDate) {
      const newTaskStartDate = requiredStartDate;
      const newTaskEndDate = new Date(newTaskStartDate);
      newTaskEndDate.setDate(newTaskEndDate.getDate() + dureeOriginaleJours);
      
      // Vérifier que les dates sont valides
      if (!newTaskStartDate || !newTaskEndDate || isNaN(newTaskStartDate.getTime()) || isNaN(newTaskEndDate.getTime())) {
        console.error('[calculateSmartDependentUpdates] ERROR - Invalid dates:', {
          taskId: dependentTask.id,
          newTaskStartDate: newTaskStartDate?.toISOString(),
          newTaskEndDate: newTaskEndDate?.toISOString()
        });
        return;
      }
      
      console.log('[calculateSmartDependentUpdates] Updating task:', {
        taskId: dependentTask.id,
        oldStart: dependentTask.startAt.toISOString(),
        newStart: newTaskStartDate.toISOString(),
        newEnd: newTaskEndDate.toISOString()
      });
      
      updatedTasks[dependentTask.id] = {
        startAt: newTaskStartDate,
        endAt: newTaskEndDate
      };
      
      // Récursivement mettre à jour les tâches qui dépendent de celle-ci
      const cascadedUpdates = calculateSmartDependentUpdates(
        dependentTask.id,
        newTaskStartDate,
        newTaskEndDate,
        tasks,
        originalTasks,
        projectStartDate,
        visitedTasks
      );
      
      Object.assign(updatedTasks, cascadedUpdates);
    }
  });
  
  return updatedTasks;
}

/**
 * Recalcule les dates des tâches dépendantes en cascade
 * @param {string} modifiedTaskId - ID de la tâche modifiée
 * @param {Array} allTasks - Liste de toutes les tâches avec leurs dépendances
 * @param {Object} currentOverrides - Overrides actuels des tâches
 * @param {Date} projectStartDate - Date de début du projet
 * @returns {Object} Nouvel objet d'overrides avec les mises à jour en cascade
 */
export function recalculateDependentTasks(modifiedTaskId, allTasks, currentOverrides, projectStartDate) {
  console.log('[recalculateDependentTasks] Starting cascade update for task:', modifiedTaskId);
  
  const newOverrides = { ...currentOverrides };
  const visited = new Set();
  const queue = [modifiedTaskId];
  
  // Créer une map des tâches pour un accès rapide
  const tasksMap = new Map();
  allTasks.forEach(task => {
    // Appliquer les overrides existants
    const override = newOverrides[task.id] || {};
    tasksMap.set(task.id, {
      ...task,
      startAt: override.startAt || task.startAt,
      endAt: override.endAt || task.endAt
    });
  });
  
  while (queue.length > 0) {
    const currentTaskId = queue.shift();
    
    // Éviter les boucles infinies
    if (visited.has(currentTaskId)) {
      console.warn('[recalculateDependentTasks] Circular dependency detected for task:', currentTaskId);
      continue;
    }
    visited.add(currentTaskId);
    
    // Trouver toutes les tâches qui dépendent de la tâche courante
    const dependentTasks = allTasks.filter(task =>
      task.dependances &&
      task.dependances.some(dep =>
        (dep.id_tache_precedente === currentTaskId) || (dep.id === currentTaskId)
      )
    );
    
    console.log(`[recalculateDependentTasks] Found ${dependentTasks.length} dependent tasks for ${currentTaskId}`);
    
    for (const dependentTask of dependentTasks) {
      // Recalculer la date de début en fonction des dépendances
      const newStartDate = calculerDateDebut(dependentTask, tasksMap, projectStartDate);
      
      // Calculer la nouvelle date de fin
      const dureeJours = dureeEnJours(dependentTask.duree);
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + dureeJours);
      
      // Vérifier si les dates ont changé
      const currentStart = newOverrides[dependentTask.id]?.startAt || dependentTask.startAt;
      const currentEnd = newOverrides[dependentTask.id]?.endAt || dependentTask.endAt;
      
      if (newStartDate.getTime() !== currentStart.getTime() ||
          newEndDate.getTime() !== currentEnd.getTime()) {
        
        console.log(`[recalculateDependentTasks] Updating task ${dependentTask.id}:`, {
          oldStart: currentStart,
          newStart: newStartDate,
          oldEnd: currentEnd,
          newEnd: newEndDate
        });
        
        // Mettre à jour les overrides
        newOverrides[dependentTask.id] = {
          startAt: newStartDate,
          endAt: newEndDate
        };
        
        // Mettre à jour la map pour les calculs suivants
        tasksMap.set(dependentTask.id, {
          ...tasksMap.get(dependentTask.id),
          startAt: newStartDate,
          endAt: newEndDate
        });
        
        // Ajouter à la queue pour traiter ses propres dépendants
        queue.push(dependentTask.id);
      }
    }
  }
  
  console.log('[recalculateDependentTasks] Cascade update complete. Total tasks updated:', Object.keys(newOverrides).length);
  return newOverrides;
}

/**
 * Détermine le type de dépendance - Simplifié pour toujours retourner "after"
 * @param {string} fromPosition - Position de départ (ignoré)
 * @param {string} toPosition - Position d'arrivée (ignoré)
 * @returns {string} Type de dépendance (toujours 'after')
 */
export function determineDependencyType(fromPosition, toPosition) {
  // Logique simplifiée : toujours utiliser "after" (équivalent à fin-début)
  return 'after';
}

/**
 * Vérifie s'il existe une dépendance circulaire
 * @param {string} fromTaskId - ID de la tâche source
 * @param {string} toTaskId - ID de la tâche cible
 * @param {Array} tasks - Liste de toutes les tâches
 * @returns {boolean} True si une dépendance circulaire est détectée
 */
export function hasCircularDependency(fromTaskId, toTaskId, tasks) {
  const visited = new Set();
  const queue = [toTaskId];
  
  while (queue.length > 0) {
    const currentId = queue.shift();
    
    if (currentId === fromTaskId) {
      return true; // Dépendance circulaire détectée
    }
    
    if (visited.has(currentId)) {
      continue;
    }
    
    visited.add(currentId);
    
    const task = tasks.find(t => t.id === currentId);
    if (task && task.dependances) {
      task.dependances.forEach(dep => {
        // Gérer les deux formats : id_tache_precedente ou id
        const depId = dep.id_tache_precedente || dep.id;
        if (depId) {
          queue.push(depId);
        }
      });
    }
  }
  
  return false;
}

// Importer la fonction calculerDateDebut depuis dateCalculations
import { calculerDateDebut } from './dateCalculations';