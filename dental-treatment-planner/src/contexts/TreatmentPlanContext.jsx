import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Actions pour le reducer
const ACTIONS = {
  SET_PATIENT_INFO: 'SET_PATIENT_INFO',
  UPDATE_TASK: 'UPDATE_TASK',
  ADD_TASK: 'ADD_TASK',
  DELETE_TASK: 'DELETE_TASK',
  UPDATE_TASK_STATUS: 'UPDATE_TASK_STATUS',
  UPDATE_TASK_PROGRESS: 'UPDATE_TASK_PROGRESS',
  SET_DROPBOX_CONNECTION: 'SET_DROPBOX_CONNECTION',
  ADD_MILESTONE: 'ADD_MILESTONE',
  REMOVE_MILESTONE: 'REMOVE_MILESTONE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

// État initial
const initialState = {
  patientInfo: {
    nom: "ELHADDAOUI MARYAM",
    dateDevis: new Date(2025, 3, 14),
    tags: [
      { nom: "Orthodontie", couleur: "bg-blue-500" },
      { nom: "Adulte", couleur: "bg-green-500" },
      { nom: "Complexe", couleur: "bg-orange-500" }
    ]
  },
  tasks: [],
  milestones: [],
  dropboxConnected: false,
  loading: false,
  error: null
};

// Statuts disponibles
export const TASK_STATUSES = {
  planifie: { id: 'planifie', name: 'Planifié', color: '#3b82f6' },
  enCours: { id: 'enCours', name: 'En cours', color: '#f59e0b' },
  termine: { id: 'termine', name: 'Terminé', color: '#10b981' },
  reporte: { id: 'reporte', name: 'Reporté', color: '#ef4444' }
};

// Reducer pour gérer l'état
const treatmentPlanReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_PATIENT_INFO:
      return {
        ...state,
        patientInfo: { ...state.patientInfo, ...action.payload }
      };

    case ACTIONS.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates }
            : task
        )
      };

    case ACTIONS.ADD_TASK:
      return {
        ...state,
        tasks: [...state.tasks, action.payload]
      };

    case ACTIONS.DELETE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };

    case ACTIONS.UPDATE_TASK_STATUS:
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, status: action.payload.status }
            : task
        )
      };

    case ACTIONS.UPDATE_TASK_PROGRESS:
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, progression: action.payload.progress }
            : task
        )
      };

    case ACTIONS.SET_DROPBOX_CONNECTION:
      return {
        ...state,
        dropboxConnected: action.payload
      };

    case ACTIONS.ADD_MILESTONE:
      return {
        ...state,
        milestones: [...state.milestones, action.payload]
      };

    case ACTIONS.REMOVE_MILESTONE:
      return {
        ...state,
        milestones: state.milestones.filter(milestone => milestone.id !== action.payload)
      };

    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };

    default:
      return state;
  }
};

// Contexte
const TreatmentPlanContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useTreatmentPlan = () => {
  const context = useContext(TreatmentPlanContext);
  if (!context) {
    throw new Error('useTreatmentPlan doit être utilisé dans un TreatmentPlanProvider');
  }
  return context;
};

// Provider du contexte
export const TreatmentPlanProvider = ({ children }) => {
  const [state, dispatch] = useReducer(treatmentPlanReducer, initialState);

  // Actions du contexte
  const actions = {
    // Gestion des informations patient
    setPatientInfo: (patientInfo) => {
      dispatch({ type: ACTIONS.SET_PATIENT_INFO, payload: patientInfo });
    },

    // Gestion des tâches
    updateTask: (id, updates) => {
      dispatch({ type: ACTIONS.UPDATE_TASK, payload: { id, updates } });
    },

    addTask: (task) => {
      const newTask = {
        id: Date.now().toString(),
        name: task.name,
        startAt: task.startAt,
        endAt: task.endAt,
        status: task.status || TASK_STATUSES.planifie,
        phase: task.phase,
        progression: task.progression || 0,
        ...task
      };
      dispatch({ type: ACTIONS.ADD_TASK, payload: newTask });
    },

    deleteTask: (id) => {
      dispatch({ type: ACTIONS.DELETE_TASK, payload: id });
    },

    updateTaskStatus: (id, status) => {
      dispatch({ type: ACTIONS.UPDATE_TASK_STATUS, payload: { id, status } });
    },

    updateTaskProgress: (id, progress) => {
      dispatch({ type: ACTIONS.UPDATE_TASK_PROGRESS, payload: { id, progress } });
    },

    // Gestion de la connexion Dropbox
    setDropboxConnection: (connected) => {
      dispatch({ type: ACTIONS.SET_DROPBOX_CONNECTION, payload: connected });
    },

    // Simulation de connexion Dropbox
    connectToDropbox: async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        // Simulation d'une connexion de 2 secondes
        await new Promise(resolve => setTimeout(resolve, 2000));
        dispatch({ type: ACTIONS.SET_DROPBOX_CONNECTION, payload: true });
        dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Erreur de connexion à Dropbox' });
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    // Gestion des jalons
    addMilestone: (milestone) => {
      const newMilestone = {
        id: Date.now().toString(),
        ...milestone
      };
      dispatch({ type: ACTIONS.ADD_MILESTONE, payload: newMilestone });
    },

    removeMilestone: (id) => {
      dispatch({ type: ACTIONS.REMOVE_MILESTONE, payload: id });
    },

    // Gestion des erreurs et du loading
    setLoading: (loading) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: loading });
    },

    setError: (error) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error });
    },

    // Logique métier spécifique
    moveTask: (id, startDate, endDate) => {
      actions.updateTask(id, {
        startAt: startDate,
        endAt: endDate
      });
    },

    // Groupement des tâches par phase
    getTasksByPhase: () => {
      return state.tasks.reduce((acc, task) => {
        if (!acc[task.phase]) {
          acc[task.phase] = [];
        }
        acc[task.phase].push(task);
        return acc;
      }, {});
    },

    // Calcul de la progression globale
    getOverallProgress: () => {
      if (state.tasks.length === 0) return 0;
      const totalProgress = state.tasks.reduce((sum, task) => sum + task.progression, 0);
      return Math.round(totalProgress / state.tasks.length);
    },

    // Obtenir les tâches en retard
    getOverdueTasks: () => {
      const today = new Date();
      return state.tasks.filter(task => 
        task.endAt < today && 
        task.status.id !== 'termine'
      );
    }
  };

  // Initialisation des données par défaut
  useEffect(() => {
    // Initialiser seulement si pas de tâches
    if (state.tasks.length === 0) {
      // Données des tâches de traitement par défaut
      const defaultTasks = [
        {
          id: 'task-1',
          name: 'Consultation initiale',
          startAt: new Date(2025, 3, 15),
          endAt: new Date(2025, 3, 15),
          status: TASK_STATUSES.termine,
          phase: 'Diagnostic',
          progression: 100
        },
        {
          id: 'task-2',
          name: 'Radiographies panoramiques',
          startAt: new Date(2025, 3, 16),
          endAt: new Date(2025, 3, 16),
          status: TASK_STATUSES.termine,
          phase: 'Diagnostic',
          progression: 100
        },
        {
          id: 'task-3',
          name: 'Empreintes dentaires',
          startAt: new Date(2025, 3, 20),
          endAt: new Date(2025, 3, 20),
          status: TASK_STATUSES.enCours,
          phase: 'Préparation',
          progression: 60
        },
        {
          id: 'task-4',
          name: 'Pose des brackets',
          startAt: new Date(2025, 4, 5),
          endAt: new Date(2025, 4, 5),
          status: TASK_STATUSES.planifie,
          phase: 'Traitement actif',
          progression: 0
        },
        {
          id: 'task-5',
          name: 'Ajustement mensuel #1',
          startAt: new Date(2025, 5, 5),
          endAt: new Date(2025, 5, 5),
          status: TASK_STATUSES.planifie,
          phase: 'Traitement actif',
          progression: 0
        },
        {
          id: 'task-6',
          name: 'Ajustement mensuel #2',
          startAt: new Date(2025, 6, 5),
          endAt: new Date(2025, 6, 5),
          status: TASK_STATUSES.planifie,
          phase: 'Traitement actif',
          progression: 0
        },
        {
          id: 'task-7',
          name: 'Contrôle intermédiaire',
          startAt: new Date(2025, 7, 15),
          endAt: new Date(2025, 7, 15),
          status: TASK_STATUSES.planifie,
          phase: 'Suivi',
          progression: 0
        },
        {
          id: 'task-8',
          name: 'Retrait des brackets',
          startAt: new Date(2025, 11, 15),
          endAt: new Date(2025, 11, 15),
          status: TASK_STATUSES.planifie,
          phase: 'Finalisation',
          progression: 0
        },
        {
          id: 'task-9',
          name: 'Pose de la contention',
          startAt: new Date(2025, 11, 20),
          endAt: new Date(2025, 11, 20),
          status: TASK_STATUSES.planifie,
          phase: 'Finalisation',
          progression: 0
        }
      ];

      // Ajouter toutes les tâches en une seule fois
      defaultTasks.forEach(task => {
        dispatch({ type: ACTIONS.ADD_TASK, payload: task });
      });
    }

    // Initialiser seulement si pas de jalons
    if (state.milestones.length === 0) {
      // Jalons par défaut
      const defaultMilestones = [
        {
          id: 'milestone-debut-traitement',
          date: new Date(2025, 4, 5),
          label: 'Début traitement'
        },
        {
          id: 'milestone-mi-parcours',
          date: new Date(2025, 7, 15),
          label: 'Mi-parcours'
        },
        {
          id: 'milestone-fin-traitement',
          date: new Date(2025, 11, 20),
          label: 'Fin traitement'
        }
      ];

      // Ajouter tous les jalons en une seule fois
      defaultMilestones.forEach(milestone => {
        dispatch({ type: ACTIONS.ADD_MILESTONE, payload: milestone });
      });
    }
  }, [state.tasks.length, state.milestones.length]);

  const value = {
    ...state,
    ...actions
  };

  return (
    <TreatmentPlanContext.Provider value={value}>
      {children}
    </TreatmentPlanContext.Provider>
  );
};

export default TreatmentPlanContext;