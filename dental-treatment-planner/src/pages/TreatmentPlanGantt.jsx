import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useContextGanttData, useContextGanttHandlers, useOverdueTasks } from '../hooks';
import { usePatient, usePatientQuotes, useTreatmentPlans } from '../hooks';
import { useTreatmentPlan } from '../contexts/TreatmentPlanContext';
import { GanttHeader } from '../components/gantt';
import TreatmentRoadmap from '../components/TreatmentRoadmap';

const TreatmentPlanGantt = () => {
  // Récupérer le patientId depuis l'URL
  const { patientId } = useParams();
  
  // Récupérer les données réelles du patient et de ses devis
  const { patient, loading: patientLoading, error: patientError } = usePatient(patientId);
  const { quotes, loading: quotesLoading, error: quotesError } = usePatientQuotes(patientId);
  const { getTreatmentPlansByPatient } = useTreatmentPlans();
  
  // Accès au contexte pour la mise à jour
  const { setPatientInfo } = useTreatmentPlan();
  
  // État pour stocker les données du plan de traitement depuis Firebase
  const [firebasePlanData, setFirebasePlanData] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  
  // Utilisation des hooks refactorisés avec le patientId
  const { data, loading, error, contextActions } = useContextGanttData(patientId);
  const handlers = useContextGanttHandlers(contextActions);
  const overdueTasks = useOverdueTasks(data?.tasks || []);
  
  // Mettre à jour le contexte avec les données réelles du patient
  useEffect(() => {
    // Si l'ID est 'patient-temp', essayer de récupérer depuis localStorage
    if (patientId === 'patient-temp') {
      console.log('🔍 Recherche des données patient-temp dans localStorage...');
      const storedData = localStorage.getItem('tempPatientData');
      if (storedData) {
        try {
          const tempData = JSON.parse(storedData);
          console.log('📦 Données patient-temp trouvées:', tempData);
          
          setPatientInfo({
            id: patientId,
            nom: tempData.fullName || tempData.nom || 'Patient temporaire',
            fullName: tempData.fullName || tempData.nom || 'Patient temporaire',
            dateDevis: tempData.createdDate ? new Date(tempData.createdDate) : new Date(),
            tags: tempData.tags || [],
            doctor: tempData.assignedDoctor || 'Médecin non spécifié'
          });
          return;
        } catch (e) {
          console.error('❌ Erreur parsing localStorage:', e);
        }
      }
    }
    
    // Sinon, utiliser les données du patient depuis Firebase
    if (patient && !patientLoading) {
      console.log('🔄 Mise à jour du contexte avec le patient réel:', patient);
      
      // Chercher le devis le plus récent accepté ou envoyé
      const activeQuote = quotes
        ?.filter(q => q.status === 'accepte' || q.status === 'envoye')
        ?.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))?.[0];
      
      // Mettre à jour les informations du patient dans le contexte
      setPatientInfo({
        id: patient.id,
        nom: patient.name || patient.patientName || patient.fullName || 'Patient',
        fullName: patient.fullName || patient.name || patient.patientName || 'Patient',
        dateDevis: activeQuote?.basicInfo?.date || new Date(),
        tags: patient.tags || activeQuote?.patientInfo?.tags || [],
        doctor: patient.assignedDoctor || activeQuote?.doctor || 'Médecin non spécifié'
      });
    }
  }, [patient, patientLoading, quotes, setPatientInfo, patientId]);

  // Charger les données du plan de traitement depuis Firebase
  useEffect(() => {
    const loadTreatmentPlan = async () => {
      if (patientId && patientId !== 'patient-temp') {
        try {
          setPlanLoading(true);
          console.log('📋 Chargement des plans de traitement pour:', patientId);
          
          const plans = await getTreatmentPlansByPatient(patientId);
          
          if (plans && plans.length > 0) {
            // Prendre le plan le plus récent
            const latestPlan = plans.sort((a, b) => {
              const dateA = a.createdAt || new Date(0);
              const dateB = b.createdAt || new Date(0);
              return dateB - dateA;
            })[0];
            
            console.log('📊 Plan de traitement trouvé:', latestPlan);
            
            // Extraire les données du patient depuis le plan
            if (latestPlan.geminiData) {
              setFirebasePlanData(latestPlan.geminiData);
              
              // Mettre à jour le contexte avec les infos du plan
              let patientName = patient?.fullName || patient?.name || 'Patient';
              
              // Si pas de nom dans patient, essayer localStorage
              if (patientName === 'Patient') {
                try {
                  const tempData = localStorage.getItem('tempPatientData');
                  if (tempData) {
                    const parsed = JSON.parse(tempData);
                    patientName = parsed.fullName || parsed.nom || 'Patient';
                  }
                } catch (e) {
                  console.error('Erreur parsing tempPatientData:', e);
                }
              }
              
              setPatientInfo({
                id: patientId,
                nom: patientName,
                fullName: patientName,
                dateDevis: latestPlan.createdAt || new Date(),
                tags: patient?.tags || [],
                doctor: latestPlan.basicInfo?.referringDoctorId || 'Médecin non spécifié',
                planNumber: latestPlan.planNumber || 'PT-2025-0000'
              });
            }
          }
        } catch (error) {
          console.error('❌ Erreur chargement plan:', error);
        } finally {
          setPlanLoading(false);
        }
      } else if (patientId === 'patient-temp') {
        // Pour patient-temp, essayer de charger depuis localStorage
        const storedPlan = localStorage.getItem('tempTreatmentPlan');
        if (storedPlan) {
          try {
            const planData = JSON.parse(storedPlan);
            setFirebasePlanData(planData);
          } catch (e) {
            console.error('❌ Erreur parsing plan localStorage:', e);
          }
        }
        setPlanLoading(false);
      } else {
        setPlanLoading(false);
      }
    };
    
    loadTreatmentPlan();
  }, [patientId, getTreatmentPlansByPatient, setPatientInfo, patient]);

  // Adapter les données pour TreatmentRoadmap - privilégier les données Firebase
  const treatmentPlanData = useMemo(() => {
    // Si on a des données Firebase, les utiliser en priorité
    if (firebasePlanData) {
      console.log('📊 Utilisation des données Firebase pour le plan');
      return firebasePlanData;
    }
    
    // Sinon, utiliser les données du contexte
    if (!data || !data.tasks) return null;

    console.log('📊 Utilisation des données du contexte (fallback)');
    // Transformer les tasks du contexte en taches pour TreatmentRoadmap
    const taches = data.tasks.map((task, index) => ({
      id: task.id,
      nom: task.name,
      phase: task.phase === 'Diagnostic' ? 1 :
             task.phase === 'Préparation' ? 1 :
             task.phase === 'Traitement actif' ? 2 :
             task.phase === 'Suivi' ? 2 :
             task.phase === 'Finalisation' ? 3 : 1,
      duree: {
        valeur: 1,
        unite: 'jour'
      },
      statut: task.status?.id === 'termine' ? 'completed' :
              task.status?.id === 'enCours' ? 'in-progress' :
              'planned',
      dependances: [] // Les dépendances peuvent être ajoutées si nécessaire
    }));

    // Extraire les médecins par phase (simulé pour l'instant)
    const medecins_par_phase = {
      '1 - Phase': 'Dr. Martin',
      '2 - Phase': 'Dr. Dupont',
      '3 - Phase': 'Dr. Leroy'
    };

    return {
      taches,
      medecins_par_phase,
      patient: data.patient
    };
  }, [data, firebasePlanData]);

  // Gestionnaire pour les mises à jour de tâches depuis TreatmentRoadmap
  const handleTaskUpdate = (updates) => {
    const { taskId, startAt, endAt, status, phase, dependencies } = updates;
    
    if (startAt || endAt) {
      handlers.onTaskMove?.(taskId, { startAt, endAt });
    }
    
    if (status) {
      const mappedStatus = status === 'completed' ? 'termine' :
                          status === 'in-progress' ? 'enCours' :
                          'planifie';
      handlers.onTaskStatusUpdate?.(taskId, mappedStatus);
    }
    
    if (phase) {
      // Mapper les phases numériques vers les noms de phases
      const phaseNames = {
        1: 'Diagnostic',
        2: 'Traitement actif',
        3: 'Finalisation'
      };
      handlers.onTaskUpdate?.(taskId, { phase: phaseNames[phase] || 'Diagnostic' });
    }

    if (dependencies) {
      // Gérer les dépendances si nécessaire
      console.log('Mise à jour des dépendances:', taskId, dependencies);
    }
  };

  // Gestionnaire pour le changement de date
  const handleDateChange = (newDate) => {
    // Implémenter la logique de changement de date si nécessaire
    console.log('Nouvelle date de début:', newDate);
  };

  // État de chargement combiné
  const isLoading = loading || patientLoading || quotesLoading || planLoading;
  const hasError = error || patientError || quotesError;
  
  // Gestion du loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {patientLoading ? 'Chargement des données du patient...' :
             quotesLoading ? 'Chargement des devis...' :
             'Chargement du plan de traitement...'}
          </p>
        </div>
      </div>
    );
  }

  // Gestion des erreurs
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Vérifier que les données sont disponibles
  if (!treatmentPlanData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Aucune donnée de plan de traitement disponible.</p>
        </div>
      </div>
    );
  }

  // Créer un objet patient avec toutes les informations correctes
  const patientInfo = useMemo(() => {
    // Si on a des données depuis Firebase
    if (firebasePlanData && patientId !== 'patient-temp') {
      return {
        id: patientId,
        nom: patient?.fullName || patient?.name || 'Patient',
        dateDevis: firebasePlanData.date_creation ? new Date(firebasePlanData.date_creation) : new Date(),
        tags: patient?.tags || [],
        doctor: firebasePlanData.medecin_referent || 'Médecin non spécifié',
        planNumber: firebasePlanData.numero_plan || 'PT-2025-0001'
      };
    }
    
    // Si c'est patient-temp, utiliser localStorage
    if (patientId === 'patient-temp') {
      let tempPatientData = null;
      try {
        const storedData = localStorage.getItem('tempPatientData');
        if (storedData) {
          tempPatientData = JSON.parse(storedData);
        }
      } catch (e) {
        console.error('Erreur parsing tempPatientData:', e);
      }
      
      return {
        id: patientId,
        nom: tempPatientData?.fullName || 'Patient temporaire',
        dateDevis: tempPatientData?.createdDate ? new Date(tempPatientData.createdDate) : new Date(),
        tags: tempPatientData?.tags || [],
        doctor: tempPatientData?.assignedDoctor || 'Médecin non spécifié',
        planNumber: 'PT-2025-TEMP'
      };
    }
    
    // Fallback vers les données du contexte
    return data?.patient || {
      id: patientId,
      nom: 'Patient',
      dateDevis: new Date(),
      tags: [],
      doctor: 'Médecin non spécifié'
    };
  }, [firebasePlanData, patientId, patient, data]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec informations patient et connexion Dropbox */}
      <GanttHeader
        patient={patientInfo}
        statistics={data?.statistics}
        overdueTasks={overdueTasks}
        showDropbox={true}
        dropboxProps={{
          dropboxConnected: contextActions.dropboxConnected,
          loading: contextActions.loading,
          onConnect: contextActions.connectToDropbox
        }}
        className="sticky top-0 z-50"
      />

      {/* Vue TreatmentRoadmap avec les 3 vues (Gantt, Liste, Kanban) */}
      <div className="p-6">
        <TreatmentRoadmap
          treatmentPlanData={treatmentPlanData}
          onDateChange={handleDateChange}
          onTaskUpdate={handleTaskUpdate}
          onDiagramStateChange={(jsonState) => {
            // ✅ AJOUT: Handler pour l'état JSON du diagramme
            console.log('📊 [TreatmentPlanGantt] État JSON du diagramme mis à jour:', {
              timestamp: new Date().toISOString(),
              totalTasks: jsonState.metadata?.totalTasks || 0,
              totalDependencies: jsonState.dependencies?.length || 0,
              hasOverrides: Object.keys(jsonState.configuration?.taskOverrides || {}).length > 0
            });
            
            // Ici on pourrait sauvegarder l'état JSON en base de données
            // ou l'envoyer à un service d'analytics
          }}
          className="mt-6"
        />
      </div>
    </div>
  );
};

export default TreatmentPlanGantt;