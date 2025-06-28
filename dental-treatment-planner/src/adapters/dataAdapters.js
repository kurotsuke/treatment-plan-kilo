/**
 * Adaptateurs pour normaliser les données de différentes sources
 * vers un format unifié pour les composants Gantt
 */

// Interface normalisée pour les données Gantt
export const createNormalizedData = ({
  patient,
  tasks = [],
  milestones = [],
  statistics = null
}) => ({
  patient,
  tasks,
  milestones,
  statistics: statistics || calculateStatistics(tasks)
});

// Calcul des statistiques à partir des tâches
const calculateStatistics = (tasks) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status?.id === 'termine' || t.status?.id === 'completed').length;
  const inProgress = tasks.filter(t => t.status?.id === 'enCours' || t.status?.id === 'in-progress').length;
  const planned = tasks.filter(t => t.status?.id === 'planifie' || t.status?.id === 'planned').length;
  
  // Tâches en retard
  const today = new Date();
  const overdue = tasks.filter(task => 
    task.endAt < today && 
    (task.status?.id !== 'termine' && task.status?.id !== 'completed')
  ).length;
  
  // Progression globale
  const globalProgress = total > 0 
    ? Math.round(tasks.reduce((sum, task) => sum + (task.progression || 0), 0) / total)
    : 0;

  return {
    total,
    completed,
    inProgress,
    planned,
    overdue,
    globalProgress
  };
};

/**
 * Adaptateur pour les données du contexte TreatmentPlanContext
 */
export const contextDataAdapter = (contextData, patientId = null) => {
  const { patientInfo, tasks, milestones } = contextData;
  
  return createNormalizedData({
    patient: {
      id: patientId || patientInfo.id || 'context-patient',
      nom: patientInfo.nom || patientInfo.fullName || 'Patient',
      dateDevis: patientInfo.dateDevis,
      tags: patientInfo.tags || [],
      doctor: patientInfo.doctor || patientInfo.assignedDoctor || 'Médecin non spécifié'
    },
    tasks: tasks.map(task => ({
      id: task.id,
      name: task.name,
      startAt: task.startAt,
      endAt: task.endAt,
      status: task.status,
      phase: task.phase,
      progression: task.progression || 0
    })),
    milestones: milestones.map(milestone => ({
      id: milestone.id,
      date: milestone.date,
      label: milestone.label
    }))
  });
};

/**
 * Adaptateur pour les données mockées de TreatmentPlans
 */
export const mockDataAdapter = (mockData, patientId) => {
  const patientData = mockData[patientId];
  
  if (!patientData) {
    return createNormalizedData({
      patient: null,
      tasks: [],
      milestones: []
    });
  }

  return createNormalizedData({
    patient: {
      id: patientData.id,
      nom: patientData.fullName,
      dateDevis: new Date(patientData.startDate),
      tags: [
        { nom: patientData.treatmentType, couleur: 'bg-blue-500' },
        { nom: patientData.doctor, couleur: 'bg-green-500' }
      ]
    },
    tasks: patientData.procedures.map(procedure => ({
      id: procedure.id,
      name: procedure.name,
      startAt: procedure.startAt,
      endAt: procedure.endAt,
      status: procedure.status,
      phase: procedure.group?.name || 'Non défini',
      progression: getProgressionFromStatus(procedure.status?.id),
      owner: procedure.owner
    })),
    milestones: [] // Les données mockées n'ont pas de jalons définis
  });
};

/**
 * Convertit le statut en progression pour les données mockées
 */
const getProgressionFromStatus = (statusId) => {
  switch (statusId) {
    case 'completed':
      return 100;
    case 'in-progress':
      return 50;
    case 'planned':
    default:
      return 0;
  }
};

/**
 * Adaptateur générique pour futures sources de données API
 */
export const apiDataAdapter = (apiData) => {
  // À implémenter selon le format de l'API
  return createNormalizedData({
    patient: apiData.patient,
    tasks: apiData.tasks,
    milestones: apiData.milestones
  });
};

/**
 * Fonction utilitaire pour grouper les tâches par phase
 */
export const groupTasksByPhase = (tasks) => {
  return tasks.reduce((acc, task) => {
    const phase = task.phase || 'Non défini';
    if (!acc[phase]) {
      acc[phase] = [];
    }
    acc[phase].push(task);
    return acc;
  }, {});
};

/**
 * Fonction utilitaire pour obtenir les tâches en retard
 */
export const getOverdueTasks = (tasks) => {
  const today = new Date();
  return tasks.filter(task => 
    task.endAt < today && 
    (task.status?.id !== 'termine' && task.status?.id !== 'completed')
  );
};