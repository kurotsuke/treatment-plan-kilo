/**
 * Service pour transformer les données de plan de traitement entre différents formats
 */

/**
 * Transforme les données du format Gemini (avec dates absolues) vers le format relatif
 * @param {Array} ganttData - Données Gantt de Gemini
 * @param {Date} startDate - Date de début du projet
 * @returns {object} Données au format relatif avec dépendances
 */
export function transformGanttToRelativeFormat(ganttData, startDate = new Date()) {
  if (!Array.isArray(ganttData) || ganttData.length === 0) {
    return { medecins_par_phase: {}, taches: [] };
  }

  // Extraire les médecins par phase
  const medecins_par_phase = {};
  const phasesSet = new Set();
  
  ganttData.forEach(task => {
    if (task.group?.name) {
      phasesSet.add(task.group.name);
      if (!medecins_par_phase[task.group.name] && task.owner?.name) {
        medecins_par_phase[task.group.name] = task.owner.name;
      }
    }
  });

  // Trier les tâches par date de début
  const sortedTasks = [...ganttData].sort((a, b) => 
    new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );

  // Créer les tâches avec dépendances
  const taches = [];
  const taskMap = new Map();

  sortedTasks.forEach((task, index) => {
    const startAt = new Date(task.startAt);
    const endAt = new Date(task.endAt);
    const dureeJours = Math.ceil((endAt - startAt) / (1000 * 60 * 60 * 24));
    
    // Déterminer la phase
    let phase = 1;
    if (task.group?.name?.includes('2') || task.group?.name?.includes('fonctionnelle')) {
      phase = 2;
    } else if (task.group?.name?.includes('3') || task.group?.name?.includes('esthétique')) {
      phase = 3;
    }

    // Extraire les dents du nom
    const dentsMatch = task.name.match(/\(dents?:\s*([^)]+)\)/i);
    const dents = dentsMatch ? dentsMatch[1].split(',').map(d => d.trim()) : [];
    
    // Créer la tâche
    const tache = {
      id: task.id || `T${index + 1}`,
      nom: task.name,
      phase: phase,
      duree: convertirDureeEnUnites(dureeJours),
      dependances: [],
      medecin: task.owner?.name !== medecins_par_phase[task.group?.name] ? task.owner?.name : undefined,
      statut: task.status?.id || 'planned'
    };

    // Déterminer les dépendances
    if (index > 0) {
      // Chercher la tâche précédente la plus proche dans le temps
      let tachePrecedente = null;
      let minDecalage = Infinity;
      
      for (let i = index - 1; i >= 0; i--) {
        const prevTask = sortedTasks[i];
        const prevEndAt = new Date(prevTask.endAt);
        const decalageJours = Math.ceil((startAt - prevEndAt) / (1000 * 60 * 60 * 24));
        
        if (decalageJours >= 0 && decalageJours < minDecalage) {
          minDecalage = decalageJours;
          tachePrecedente = prevTask;
        }
      }
      
      if (tachePrecedente) {
        tache.dependances.push({
          id_tache_precedente: tachePrecedente.id || `T${sortedTasks.indexOf(tachePrecedente) + 1}`,
          type: "fin-debut",
          decalage: convertirDureeEnUnites(minDecalage)
        });
      }
    }

    taches.push(tache);
    taskMap.set(tache.id, tache);
  });

  return {
    medecins_par_phase,
    taches
  };
}

/**
 * Convertit un nombre de jours en unité appropriée (jour, semaine, mois)
 * @param {number} jours - Nombre de jours
 * @returns {object} Durée avec valeur et unité
 */
function convertirDureeEnUnites(jours) {
  if (jours === 0) {
    return { valeur: 0, unite: "jour" };
  } else if (jours % 30 === 0 && jours >= 30) {
    return { valeur: jours / 30, unite: jours === 30 ? "mois" : "mois" };
  } else if (jours % 7 === 0 && jours >= 7) {
    return { valeur: jours / 7, unite: jours === 7 ? "semaine" : "semaines" };
  } else {
    return { valeur: jours, unite: jours === 1 ? "jour" : "jours" };
  }
}

/**
 * Transforme les données relatives en format Gantt pour l'affichage
 * @param {object} relativeData - Données au format relatif
 * @param {Date} startDate - Date de début du projet
 * @returns {Array} Données Gantt pour affichage
 */
export function transformRelativeToGanttFormat(relativeData, startDate = new Date()) {
  if (!relativeData) {
    return [];
  }

  // Gérer les deux formats possibles : ancien (avec phases) et nouveau (avec taches)
  let taches = relativeData.taches || [];
  let medecins_par_phase = relativeData.medecins_par_phase || {};
  
  // Si on a le nouveau format (juste taches), créer un medecins_par_phase vide
  if (taches.length > 0 && Object.keys(medecins_par_phase).length === 0) {
    medecins_par_phase = {
      '1 - Phase de soins': 'Dr. Non assigné',
      '2 - Phase fonctionnelle et orthodontie': 'Dr. Non assigné',
      '3 - Phase esthétique': 'Dr. Non assigné'
    };
  }
  
  const ganttTasks = [];
  const taskDatesMap = new Map();

  // Fonction pour calculer la date de début d'une tâche
  const calculateTaskStartDate = (tache) => {
    if (!tache.dependances || tache.dependances.length === 0) {
      return new Date(startDate);
    }

    let maxDate = new Date(startDate);
    
    for (const dep of tache.dependances) {
      // Gérer les deux formats de dépendances
      let depId, decalageJours = 0;
      
      if (typeof dep === 'string') {
        // Nouveau format : ["T14"]
        depId = dep;
      } else if (typeof dep === 'object' && dep.id_tache_precedente) {
        // Ancien format : {id_tache_precedente: "T14", type: "fin-debut", decalage: {...}}
        depId = dep.id_tache_precedente;
        decalageJours = dep.decalage ? dureeEnJours(dep.decalage) : 0;
      } else {
        continue; // Format non reconnu, ignorer
      }
      
      const prevTask = taskDatesMap.get(depId);
      if (!prevTask) continue;

      let depDate = new Date(prevTask.endAt);
      depDate.setDate(depDate.getDate() + decalageJours);

      if (depDate > maxDate) {
        maxDate = depDate;
      }
    }

    return maxDate;
  };

  // Fonction pour convertir une durée en jours
  const dureeEnJours = (duree) => {
    if (!duree || !duree.valeur || !duree.unite) return 1;
    
    const conversions = {
      'jour': 1,
      'jours': 1,
      'semaine': 7,
      'semaines': 7,
      'mois': 30,
      'months': 30
    };
    
    return duree.valeur * (conversions[duree.unite.toLowerCase()] || 1);
  };

  // Trier les tâches par phase
  const sortedTaches = [...taches].sort((a, b) => (a.phase || 0) - (b.phase || 0));

  // Transformer chaque tâche
  sortedTaches.forEach(tache => {
    const taskStartDate = calculateTaskStartDate(tache);
    const durationDays = dureeEnJours(tache.duree);
    const taskEndDate = new Date(taskStartDate);
    taskEndDate.setDate(taskEndDate.getDate() + durationDays);

    // Déterminer le nom de la phase
    const phaseName = `${tache.phase} - Phase ${
      tache.phase === 1 ? 'de soins' :
      tache.phase === 2 ? 'fonctionnelle et orthodontie' :
      'esthétique'
    }`;

    // Déterminer le médecin - gérer le cas où medecins_par_phase pourrait être vide
    let medecin = tache.medecin || 'Dr. Non assigné';
    if (!tache.medecin && medecins_par_phase) {
      // Essayer différentes variantes de clés
      medecin = medecins_par_phase[phaseName] ||
                medecins_par_phase[`Phase ${tache.phase}`] ||
                medecins_par_phase[tache.phase] ||
                'Dr. Non assigné';
    }

    // Déterminer le statut
    const statusMap = {
      'planned': { id: 'status-planned', name: 'Planifié', color: '#6B7280' },
      'in-progress': { id: 'status-in-progress', name: 'En cours', color: '#F59E0B' },
      'completed': { id: 'status-completed', name: 'Terminé', color: '#10B981' }
    };

    const ganttTask = {
      id: tache.id,
      name: tache.nom,
      startAt: taskStartDate.toISOString(),
      endAt: taskEndDate.toISOString(),
      status: statusMap[tache.statut] || statusMap['planned'],
      owner: {
        id: `owner-${medecin.toLowerCase().replace(/\s+/g, '-')}`,
        name: medecin,
        image: ''
      },
      group: {
        id: `group-phase-${tache.phase}`,
        name: phaseName
      },
      product: null,
      initiative: null,
      release: null
    };

    ganttTasks.push(ganttTask);
    taskDatesMap.set(tache.id, {
      startAt: taskStartDate,
      endAt: taskEndDate
    });
  });

  return ganttTasks;
}

/**
 * Met à jour le statut d'une tâche dans les données relatives
 * @param {object} relativeData - Données au format relatif
 * @param {string} taskId - ID de la tâche
 * @param {string} newStatus - Nouveau statut
 * @returns {object} Données mises à jour
 */
export function updateTaskStatus(relativeData, taskId, newStatus) {
  if (!relativeData || !relativeData.taches) {
    return relativeData;
  }

  const updatedTaches = relativeData.taches.map(tache => {
    if (tache.id === taskId) {
      return { ...tache, statut: newStatus };
    }
    return tache;
  });

  return {
    ...relativeData,
    taches: updatedTaches
  };
}

/**
 * Met à jour la phase d'une tâche et recalcule les dépendances si nécessaire
 * @param {object} relativeData - Données au format relatif
 * @param {string} taskId - ID de la tâche
 * @param {number} newPhase - Nouvelle phase
 * @returns {object} Données mises à jour
 */
export function updateTaskPhase(relativeData, taskId, newPhase) {
  if (!relativeData || !relativeData.taches) {
    return relativeData;
  }

  const updatedTaches = relativeData.taches.map(tache => {
    if (tache.id === taskId) {
      return { ...tache, phase: newPhase };
    }
    return tache;
  });

  // Retrier les tâches par phase
  updatedTaches.sort((a, b) => (a.phase || 0) - (b.phase || 0));

  return {
    ...relativeData,
    taches: updatedTaches
  };
}

/**
 * Calcule les statistiques du plan de traitement
 * @param {object} relativeData - Données au format relatif
 * @param {Date} startDate - Date de début du projet
 * @returns {object} Statistiques
 */
export function calculateTreatmentStatistics(relativeData, startDate = new Date()) {
  if (!relativeData || !relativeData.taches || relativeData.taches.length === 0) {
    return {
      totalTasks: 0,
      tasksByPhase: { 1: 0, 2: 0, 3: 0 },
      tasksByStatus: { planned: 0, 'in-progress': 0, completed: 0 },
      estimatedDuration: 0,
      completionPercentage: 0
    };
  }

  const ganttTasks = transformRelativeToGanttFormat(relativeData, startDate);
  
  const stats = {
    totalTasks: relativeData.taches.length,
    tasksByPhase: { 1: 0, 2: 0, 3: 0 },
    tasksByStatus: { planned: 0, 'in-progress': 0, completed: 0 },
    estimatedDuration: 0,
    completionPercentage: 0
  };

  // Compter les tâches par phase et statut
  relativeData.taches.forEach(tache => {
    if (tache.phase >= 1 && tache.phase <= 3) {
      stats.tasksByPhase[tache.phase]++;
    }
    const status = tache.statut || 'planned';
    if (stats.tasksByStatus.hasOwnProperty(status)) {
      stats.tasksByStatus[status]++;
    }
  });

  // Calculer la durée totale estimée
  if (ganttTasks.length > 0) {
    const startDates = ganttTasks.map(t => new Date(t.startAt).getTime());
    const endDates = ganttTasks.map(t => new Date(t.endAt).getTime());
    const projectStart = new Date(Math.min(...startDates));
    const projectEnd = new Date(Math.max(...endDates));
    stats.estimatedDuration = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24));
  }

  // Calculer le pourcentage de complétion
  if (stats.totalTasks > 0) {
    stats.completionPercentage = Math.round(
      (stats.tasksByStatus.completed / stats.totalTasks) * 100
    );
  }

  return stats;
}