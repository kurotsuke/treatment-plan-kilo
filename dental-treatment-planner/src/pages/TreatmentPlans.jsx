import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CalendarIcon, DocumentTextIcon, ChartBarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import treatmentPlansService from '../services/treatmentPlansService';
import { useAuth } from '../contexts/AuthContext';
import TreatmentRoadmap from '../components/TreatmentRoadmap';
import { updateTaskStatus, updateTaskPhase, calculateTreatmentStatistics } from '../services/treatmentDataTransformService';

const TreatmentPlans = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [treatmentPlan, setTreatmentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientInfo, setPatientInfo] = useState({ fullName: 'Chargement...' });
  const [treatmentData, setTreatmentData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [rawAIResponse, setRawAIResponse] = useState(null); // Stocker la réponse brute de l'IA

  // Gérer le cas de création d'un nouveau plan
  const isNewPlan = patientId === 'new';
  
  // Log pour tracer l'état de treatmentData
  useEffect(() => {
    console.log('🔍 [TreatmentPlans] treatmentData state changed:', {
      hasData: !!treatmentData,
      hasTaches: !!treatmentData?.taches,
      tachesCount: treatmentData?.taches?.length || 0,
      treatmentDataPreview: treatmentData ? JSON.stringify(treatmentData).substring(0, 200) + '...' : 'null'
    });
  }, [treatmentData]);

  useEffect(() => {
    if (!patientId || !user?.uid) {
      setError("ID du patient ou utilisateur non valide.");
      setLoading(false);
      return;
    }

    // Si c'est un nouveau plan, initialiser avec des données vides
    if (isNewPlan) {
      const emptyPlanData = {
        taches: [
          {
            id: 'task-demo-1',
            nom: 'Consultation initiale (dents: 11, 21)',
            phase: 1,
            duree: { valeur: 1, unite: 'jour' },
            statut: 'planned',
            dependances: []
          },
          {
            id: 'task-demo-2',
            nom: 'Détartrage (dents: toutes)',
            phase: 1,
            duree: { valeur: 2, unite: 'jours' },
            statut: 'planned',
            dependances: [
              {
                id_tache_precedente: 'task-demo-1',
                type: 'fin-debut',
                decalage: { valeur: 0, unite: 'jour' }
              }
            ]
          },
          {
            id: 'task-demo-3',
            nom: 'Traitement carie (dents: 16, 26)',
            phase: 2,
            duree: { valeur: 1, unite: 'jour' },
            statut: 'planned',
            dependances: [
              {
                id_tache_precedente: 'task-demo-2',
                type: 'fin-debut',
                decalage: { valeur: 1, unite: 'jour' }
              }
            ]
          }
        ],
        medecins_par_phase: {
          '1 - Phase': 'Dr. Martin',
          '2 - Phase': 'Dr. Dupont',
          '3 - Phase': 'Dr. Bernard'
        }
      };

      setTreatmentData(emptyPlanData);
      setPatientInfo({
        fullName: 'Nouveau Patient',
        treatmentType: 'Nouveau Plan de Traitement',
        doctor: 'Médecin à assigner'
      });
      setStatistics(calculateTreatmentStatistics(emptyPlanData));
      setLoading(false);
      return;
    }

    const fetchTreatmentPlan = async () => {
      setLoading(true);
      setError(null);
      try {
        const plans = await treatmentPlansService.getTreatmentPlansByPatient(patientId);
        
        if (plans && plans.length > 0) {
          const currentPlan = plans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          setTreatmentPlan(currentPlan);
          setPatientInfo({
            fullName: currentPlan.patientName || currentPlan.patientInfo?.fullName || `Patient ${patientId}`,
            treatmentType: currentPlan.basicInfo?.title || 'Plan de traitement',
            doctor: currentPlan.basicInfo?.referringDoctorName || 'Médecin non spécifié'
          });
          
          // Définir les données du traitement
          // Vérifier si geminiData est une chaîne JSON ou un objet
          let data = currentPlan.geminiData || currentPlan;
          let rawData = data; // Conserver une copie de la réponse brute
          
          // Si geminiData est une chaîne, la parser
          if (typeof data === 'string') {
            try {
              // Nettoyer les backticks markdown si présents
              let cleanedData = data;
              
              // Retirer les backticks markdown (```json au début et ``` à la fin)
              if (cleanedData.includes('```json')) {
                console.log('🧹 Nettoyage des backticks markdown dans TreatmentPlans');
                cleanedData = cleanedData.replace(/```json\s*/g, '');
                cleanedData = cleanedData.replace(/```\s*$/g, '');
                cleanedData = cleanedData.trim();
              }
              
              // Aussi gérer le cas où il y a juste ``` au début
              if (cleanedData.startsWith('```')) {
                cleanedData = cleanedData.replace(/^```\w*\s*/, '');
                cleanedData = cleanedData.replace(/```\s*$/, '');
                cleanedData = cleanedData.trim();
              }
              
              data = JSON.parse(cleanedData);
              rawData = data; // Mettre à jour rawData avec le JSON parsé
              console.log('📋 GeminiData parsé depuis string après nettoyage:', data);
            } catch (e) {
              console.error('❌ Erreur parsing geminiData:', e);
              console.error('❌ String originale:', data?.substring(0, 200) + '...');
              data = currentPlan;
            }
          }
          
          // Stocker la réponse brute de l'IA
          setRawAIResponse(rawData);
          
          // LOG DE DÉBOGAGE AVANT TOUTE TRANSFORMATION
          console.log('🔍 [TreatmentPlans] Données avant transformation:', {
            hasData: !!data,
            dataKeys: data ? Object.keys(data) : null,
            hasTaches: !!data?.taches,
            hasSections: !!data?.sections,
            sectionsCount: data?.sections ? Object.keys(data.sections).length : 0,
            dataSnapshot: JSON.stringify(data).substring(0, 200) + '...'
          });
          
          // S'assurer que le format est correct pour TreatmentRoadmap
          // TreatmentRoadmap attend un objet avec la propriété 'taches'
          if (!data.taches && data.geminiRawResponse) {
            // Si les données sont dans geminiRawResponse
            try {
              let geminiRawData = data.geminiRawResponse;
              
              // Si geminiRawResponse est une chaîne, la nettoyer et parser
              if (typeof geminiRawData === 'string') {
                // Nettoyer les backticks markdown si présents
                let cleanedRawData = geminiRawData;
                
                if (cleanedRawData.includes('```json')) {
                  console.log('🧹 Nettoyage des backticks dans geminiRawResponse');
                  cleanedRawData = cleanedRawData.replace(/```json\s*/g, '');
                  cleanedRawData = cleanedRawData.replace(/```\s*$/g, '');
                  cleanedRawData = cleanedRawData.trim();
                }
                
                if (cleanedRawData.startsWith('```')) {
                  cleanedRawData = cleanedRawData.replace(/^```\w*\s*/, '');
                  cleanedRawData = cleanedRawData.replace(/```\s*$/, '');
                  cleanedRawData = cleanedRawData.trim();
                }
                
                geminiRawData = JSON.parse(cleanedRawData);
              }
              
              // Stocker la réponse brute si on l'a trouvée dans geminiRawResponse
              setRawAIResponse(geminiRawData);
              
              if (geminiRawData.taches) {
                data = geminiRawData;
                console.log('📋 Données extraites de geminiRawResponse après nettoyage:', data);
              }
            } catch (e) {
              console.error('❌ Erreur parsing geminiRawResponse:', e);
            }
          }
          
          // Si on n'a toujours pas de taches, vérifier d'autres formats possibles
          if (!data.taches && !data.sections) {
            console.log('⚠️ Format de données non reconnu, structure actuelle:', data);
            // Créer une structure par défaut si nécessaire
            if (currentPlan.phases && currentPlan.phases.length > 0) {
              // Convertir l'ancien format phases en nouveau format taches
              console.log('🔄 Conversion du format phases vers taches...');
              data = {
                taches: [],
                medecins_par_phase: {}
              };
            } else {
              console.error('❌ Aucune donnée de tâches trouvée dans le plan');
              setError("Le format du plan de traitement n'est pas reconnu.");
              setLoading(false);
              return;
            }
          }
          
          // NE PAS CRÉER UN TABLEAU TACHES VIDE SI ON A DÉJÀ LE FORMAT SECTIONS
          if (data.taches && Array.isArray(data.taches) && data.taches.length === 0) {
            // Si on a le nouveau format sections, supprimer le tableau taches vide
            if (data.sections && Object.keys(data.sections).length > 0) {
              console.log('✅ Format sections détecté, suppression du tableau taches vide');
              delete data.taches;
            } else {
              console.error('❌ Aucune tâche ni section trouvée dans les données');
            }
          }
          
          // LOG DÉTAILLÉ avant de passer à TreatmentRoadmap
          console.log('✅ [TreatmentPlans] Données finales pour TreatmentRoadmap:', {
            hasData: !!data,
            hasTaches: !!data?.taches,
            tachesCount: data?.taches?.length || 0,
            sampleTask: data?.taches?.[0] || null,
            keys: data ? Object.keys(data) : null,
            fullDataStructure: data
          });
          
          // S'assurer que les données sont bien définies avant de les mettre dans l'état
          if (data && (data.taches || data.sections)) {
            console.log('🔧 [TreatmentPlans] Avant setTreatmentData, data contient:', {
              hasTaches: !!data.taches,
              tachesCount: data.taches?.length || 0,
              hasSections: !!data.sections,
              sectionsCount: data.sections ? Object.keys(data.sections).length : 0,
              medecinKeys: Object.keys(data.medecins_par_phase || {}),
              dataKeys: Object.keys(data),
              fullData: data
            });
            
            // IMPORTANT: S'assurer de passer les données telles quelles
            setTreatmentData(data);
            
            console.log('✅ [TreatmentPlans] treatmentData state mis à jour avec:', {
              hasData: !!data,
              hasTaches: !!data?.taches,
              tachesCount: data?.taches?.length || 0,
              hasSections: !!data?.sections,
              sectionsCount: data?.sections ? Object.keys(data.sections).length : 0,
              firstTask: data?.taches?.[0]?.nom || 'Aucune tâche',
              dataPreview: JSON.stringify(data).substring(0, 200) + '...'
            });
          } else {
            console.error('❌ [TreatmentPlans] data est invalide, pas de mise à jour de treatmentData');
          }
          
          // Calculer les statistiques
          const stats = calculateTreatmentStatistics(data);
          setStatistics(stats);
        } else {
          setError("Aucun plan de traitement trouvé pour ce patient.");
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du plan de traitement:", err);
        setError(`Erreur lors de la récupération du plan: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTreatmentPlan();
  }, [patientId, user?.uid, isNewPlan]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-700">Chargement du plan de traitement...</span>
      </div>
    );
  }

  if (error || (!treatmentPlan && !isNewPlan)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <div className="mx-auto h-12 w-12 text-red-500">
            <CalendarIcon />
          </div>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">
            {error ? "Erreur" : "Plan de traitement non trouvé"}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {error || "Ce patient n'a pas encore de plan de traitement ou l'ID est invalide."}
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/patients')}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <ArrowLeftIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
              Retour aux patients
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Gérer les mises à jour des tâches
  const handleTaskUpdate = async (update) => {
    console.log('🔄 [TreatmentPlans] handleTaskUpdate appelé avec:', {
      updateType: update.status ? 'status' : update.phase ? 'phase' : update.dependencies ? 'dependencies' : update.treatmentPlanData ? 'treatmentPlanData' : 'unknown',
      taskId: update.taskId,
      currentTreatmentData: treatmentData ? `${treatmentData.taches?.length || 0} tâches` : 'null'
    });
    
    // LOG DÉTAILLÉ pour treatmentPlanData
    if (update.treatmentPlanData) {
      console.log('🚨 [TreatmentPlans] ALERTE: Mise à jour treatmentPlanData reçue:', {
        hasData: !!update.treatmentPlanData,
        hasTaches: !!update.treatmentPlanData?.taches,
        tachesCount: update.treatmentPlanData?.taches?.length || 0,
        keys: update.treatmentPlanData ? Object.keys(update.treatmentPlanData) : [],
        isEmptyObject: update.treatmentPlanData && Object.keys(update.treatmentPlanData).length === 0,
        stackTrace: new Error().stack
      });
    }
    
    if (!treatmentData) {
      console.warn('⚠️ [TreatmentPlans] handleTaskUpdate: treatmentData est null, abandon');
      return;
    }
    
    let updatedData = treatmentData;
    
    if (update.status) {
      updatedData = updateTaskStatus(treatmentData, update.taskId, update.status);
    } else if (update.phase) {
      updatedData = updateTaskPhase(treatmentData, update.taskId, update.phase);
    } else if (update.dependencies) {
      // Gérer les mises à jour de dépendances
      console.log('[TreatmentPlans] Updating dependencies for task:', update.taskId, update.dependencies);
      
      // Créer une copie profonde des données
      updatedData = JSON.parse(JSON.stringify(treatmentData));
      
      // Trouver et mettre à jour la tâche
      if (updatedData.taches) {
        const taskIndex = updatedData.taches.findIndex(t => t.id === update.taskId);
        if (taskIndex !== -1) {
          updatedData.taches[taskIndex].dependances = update.dependencies;
        }
      }
    } else if (update.treatmentPlanData) {
      // Mise à jour complète des données (utilisé par TreatmentRoadmap)
      console.log('🚨 [TreatmentPlans] Mise à jour complète des données via treatmentPlanData:', {
        newDataTaches: update.treatmentPlanData?.taches?.length || 0,
        newDataKeys: update.treatmentPlanData ? Object.keys(update.treatmentPlanData) : []
      });
      
      // PROTECTION: Vérifier si les nouvelles données sont valides
      if (!update.treatmentPlanData.taches || update.treatmentPlanData.taches.length === 0) {
        console.error('❌❌❌ [TreatmentPlans] REJET: Tentative de mise à jour avec des données vides!', {
          currentTaches: treatmentData?.taches?.length || 0,
          newTaches: update.treatmentPlanData?.taches?.length || 0,
          caller: new Error().stack
        });
        return; // NE PAS mettre à jour avec des données vides
      }
      
      updatedData = update.treatmentPlanData;
    }
    
    console.log('📝 [TreatmentPlans] Avant setTreatmentData dans handleTaskUpdate:', {
      updatedDataTaches: updatedData?.taches?.length || 0,
      updatedDataKeys: updatedData ? Object.keys(updatedData) : []
    });
    
    setTreatmentData(updatedData);
    
    // LOG CRITIQUE : vérifier si on écrase avec un objet vide
    if (update.treatmentPlanData && (!updatedData.taches || updatedData.taches.length === 0)) {
      console.error('🚨🚨🚨 [TreatmentPlans] ALERTE: treatmentData écrasé avec des données vides!', {
        updateType: 'treatmentPlanData',
        updatedData,
        hasData: !!updatedData,
        hasTaches: !!updatedData?.taches,
        tachesCount: updatedData?.taches?.length || 0
      });
    }
    
    // Recalculer les statistiques
    const stats = calculateTreatmentStatistics(updatedData);
    setStatistics(stats);
    
    // Optionnel : sauvegarder les changements dans Firebase
    try {
      if (!isNewPlan && treatmentPlan?.id) {
        await treatmentPlansService.updateTreatmentPlan(treatmentPlan.id, {
          geminiData: updatedData,
          lastModified: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des modifications:', err);
    }
  };
  
  const handleDateChange = (newDate) => {
    console.log('Nouvelle date de début:', newDate);
    // Recalculer les statistiques avec la nouvelle date
    if (treatmentData) {
      const stats = calculateTreatmentStatistics(treatmentData, newDate);
      setStatistics(stats);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900">
                {isNewPlan ? 'Créer un nouveau plan de traitement' : `Plan de Traitement pour ${patientInfo.fullName}`}
              </h1>
              <p className="text-sm text-gray-500">
                {isNewPlan ? 'Utilisez la vue Gantt ci-dessous pour organiser les tâches avec les badges de dents draggables' : `${patientInfo.treatmentType} - ${patientInfo.doctor}`}
              </p>
            </div>
            <div className="flex items-center gap-x-2">
              {isNewPlan && (
                <button
                  onClick={() => {
                    // TODO: Implémenter la sauvegarde du nouveau plan
                    alert('Fonctionnalité de sauvegarde à implémenter');
                  }}
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                >
                  <CheckCircleIcon className="-ml-0.5 h-5 w-5" />
                  Sauvegarder
                </button>
              )}
              <button
                onClick={() => navigate('/patients')}
                className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <ArrowLeftIcon className="-ml-0.5 h-5 w-5" />
                Retour
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Section des intégrations */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <h3 className="text-sm font-medium text-gray-700 mr-4">Intégrations :</h3>
            <div className="flex gap-3">
              {/* Bouton Dropbox */}
              <button
                onClick={() => console.log('Connexion Dropbox - Non implémenté')}
                className="inline-flex items-center gap-x-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l4.5 3L12 7l5.5 3L22 7L12 2zm-5.5 8.5L2 13.5L12 18.5l10-5l-4.5-3L12 13.5l-5.5-3zM12 22l10-5v-4l-10 5l-10-5v4l10 5z"/>
                </svg>
                Connecter Dropbox
              </button>

              {/* Bouton Medit Link */}
              <button
                onClick={() => console.log('Connexion Medit Link - Non implémenté')}
                className="inline-flex items-center gap-x-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Connecter Medit Link
              </button>

              {/* Bouton Slack */}
              <button
                onClick={() => console.log('Connexion Slack - Non implémenté')}
                className="inline-flex items-center gap-x-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                </svg>
                Connecter Slack
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Statistiques du plan */}
          {statistics && (
            <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total des tâches
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {statistics.totalTasks}
                  </dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Durée estimée
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {statistics.estimatedDuration} jours
                  </dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Progression
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {statistics.completionPercentage}%
                  </dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tâches terminées
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {statistics.tasksByStatus.completed}
                  </dd>
                </div>
              </div>
            </div>
          )}

          {/* Roadmap avec 3 vues */}
        <div className="mb-8">
          {console.log('🎯 [TreatmentPlans] Passage des données à TreatmentRoadmap:', {
            treatmentDataType: typeof treatmentData,
            hasTreatmentData: !!treatmentData,
            hasTaches: !!treatmentData?.taches,
            tachesLength: treatmentData?.taches?.length || 0,
            treatmentDataSnapshot: treatmentData
          })}
          <TreatmentRoadmap
            treatmentPlanData={treatmentData}
            onDateChange={handleDateChange}
            onTaskUpdate={handleTaskUpdate}
          />
        </div>

          {/* Données JSON brutes (optionnel - peut être masqué par défaut) */}
          <details className="bg-white shadow-xl rounded-lg overflow-hidden">
            <summary className="bg-gray-50 px-4 py-5 sm:px-6 border-b border-gray-200 cursor-pointer hover:bg-gray-100">
              <div className="flex items-center">
                <DocumentTextIcon className="h-6 w-6 text-indigo-600 mr-2" />
                <h3 className="text-lg font-medium leading-6 text-gray-900 inline">
                  Données JSON brutes (Développeurs)
                </h3>
              </div>
            </summary>
            <div className="px-4 py-5 sm:p-6">
              {console.log('📊 [TreatmentPlans] Rendu de la section JSON, treatmentData:', {
                exists: !!treatmentData,
                type: typeof treatmentData,
                hasTaches: !!treatmentData?.taches,
                tachesLength: treatmentData?.taches?.length || 0,
                keys: treatmentData ? Object.keys(treatmentData) : 'null',
                snapshot: treatmentData
              })}
              {rawAIResponse ? (
                <>
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 font-medium">
                      ✅ Réponse brute de l'IA extraite avec succès
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {rawAIResponse.sections ?
                        `Format: Nouveau (sections) - ${Object.keys(rawAIResponse.sections).length} sections trouvées` :
                        rawAIResponse.taches ?
                          `Format: Ancien (taches) - ${rawAIResponse.taches.length} tâches trouvées` :
                          'Format non reconnu'}
                    </p>
                  </div>
                  <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto text-sm leading-relaxed">
                    {JSON.stringify(rawAIResponse, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800">⚠️ Aucune donnée JSON à afficher.</p>
                  <p className="text-xs text-yellow-600 mt-1">Les données de l'IA n'ont pas pu être extraites.</p>
                </div>
              )}
            </div>
          </details>
        </div>
      </main>
    </div>
  );
};

export default TreatmentPlans;