/**
 * Adaptateur pour transformer les données normalisées vers le format RelativeGanttView
 */

/**
 * Transforme le format de statut unifié vers le format attendu par RelativeGanttView
 */
const transformStatus = (status) => {
  if (!status) return 'planned';
  
  const statusMap = {
    'completed': 'completed',
    'termine': 'completed',
    'in-progress': 'in-progress',
    'enCours': 'in-progress',
    'planned': 'planned',
    'planifie': 'planned'
  };
  
  return statusMap[status.id] || 'planned';
};

/**
 * Transforme les tâches du format unifié vers le format RelativeGanttView
 */
const transformTasks = (tasks) => {
  return tasks.map(task => {
    // Extraire le nom et les dents
    const matches = task.name.match(/^(.+?)\s*(?:\(dents?:\s*(.+?)\))?$/);
    const nom = matches ? matches[1] : task.name;
    const dentsStr = matches && matches[2] ? matches[2] : '';
    
    return {
      id: task.id,
      nom: task.name,
      phase: parseInt(task.phase) || 1,
      duree: calculateDuree(task.startAt, task.endAt),
      dependances: task.dependances || [],
      statut: transformStatus(task.status),
      medecin: task.owner?.name || 'Dr. Inconnu',
      dents: dentsStr ? dentsStr.split(',').map(d => d.trim()) : []
    };
  });
};

/**
 * Calcule la durée entre deux dates
 */
const calculateDuree = (startAt, endAt) => {
  if (!startAt || !endAt) {
    return { valeur: 1, unite: 'jour' };
  }
  
  const start = new Date(startAt);
  const end = new Date(endAt);
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) {
    return { valeur: 1, unite: 'jour' };
  } else if (diffDays <= 7) {
    return { valeur: diffDays, unite: 'jours' };
  } else if (diffDays <= 30) {
    const weeks = Math.ceil(diffDays / 7);
    return { valeur: weeks, unite: weeks === 1 ? 'semaine' : 'semaines' };
  } else {
    const months = Math.ceil(diffDays / 30);
    return { valeur: months, unite: 'mois' };
  }
};

/**
 * Adaptateur principal pour transformer les données vers le format RelativeGanttView
 */
export const toRelativeGanttFormat = (normalizedData) => {
  if (!normalizedData) return null;
  
  return {
    taches: transformTasks(normalizedData.tasks || []),
    medecins_par_phase: {
      '1 - Phase': 'Dr. Martin',
      '2 - Phase': 'Dr. Spécialiste',
      '3 - Phase': 'Dr. Esthétique'
    },
    patient: normalizedData.patient,
    statistics: normalizedData.statistics,
    milestones: normalizedData.milestones
  };
};

/**
 * Adaptateur inverse pour transformer du format RelativeGanttView vers le format unifié
 */
export const fromRelativeGanttFormat = (relativeData) => {
  if (!relativeData) return null;
  
  return {
    tasks: relativeData.taches.map(tache => ({
      id: tache.id,
      name: tache.nom,
      startAt: new Date(), // À calculer selon la logique de RelativeGanttView
      endAt: new Date(), // À calculer selon la logique de RelativeGanttView
      status: {
        id: tache.statut,
        name: tache.statut,
        color: getStatusColor(tache.statut)
      },
      phase: tache.phase.toString(),
      owner: {
        name: tache.medecin
      },
      dependances: tache.dependances
    })),
    patient: relativeData.patient,
    milestones: relativeData.milestones || [],
    statistics: relativeData.statistics
  };
};

/**
 * Obtient la couleur selon le statut
 */
const getStatusColor = (status) => {
  const colors = {
    'completed': '#10B981',
    'in-progress': '#F59E0B',
    'planned': '#6B7280'
  };
  
  return colors[status] || '#6B7280';
};