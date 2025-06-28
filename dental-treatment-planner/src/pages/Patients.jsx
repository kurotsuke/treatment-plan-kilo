import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { EllipsisVerticalIcon, FunnelIcon, ChevronDownIcon, PlusIcon } from '@heroicons/react/20/solid';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';
import { useAuth } from '../contexts/AuthContext';
import { useQuotes } from '../hooks/useQuotes';
import { useDoctors } from '../hooks/useDoctors';
import { useTreatmentPlans } from '../hooks/useTreatmentPlans';
import { useTreatmentPlanGeneration } from '../hooks/useTreatmentPlanGeneration'; // Sera ajusté plus tard
import TreatmentPlanGenerationModal from '../components/ui/TreatmentPlanGenerationModal';
import quotesService from '../services/quotesService'; // Ajout pour récupérer le devis complet
import treatmentPlansService from '../services/treatmentPlansService'; // Ajout pour sauvegarder le plan
// import { generateStructuredPlanFromQuoteObject } from '../services/aiService'; // Ancienne fonction
import { generateStructuredPlanWithNewPrompt } from '../services/aiService'; // Nouvelle fonction avec le nouveau prompt

// Mock patient data
const mockPatients = [
  {
    id: 1,
    fullName: 'Marie Dubois',
    createdDate: '2024-01-15',
    createdDateTime: '2024-01-15T10:30:00Z',
    quoteAmount: 2850.00,
    assignedDoctor: 'Dr. Jean Martin',
    status: 'En cours',
    hasTreatmentPlan: true,
  },
  {
    id: 2,
    fullName: 'Pierre Lefebvre',
    createdDate: '2024-01-20',
    createdDateTime: '2024-01-20T14:15:00Z',
    quoteAmount: 1200.50,
    assignedDoctor: 'Dr. Sophie Durand',
    status: 'Terminé',
    hasTreatmentPlan: false,
  },
  {
    id: 3,
    fullName: 'Claire Moreau',
    createdDate: '2024-02-05',
    createdDateTime: '2024-02-05T09:45:00Z',
    quoteAmount: 4200.00,
    assignedDoctor: 'Dr. Jean Martin',
    status: 'En attente',
    hasTreatmentPlan: true,
  },
  {
    id: 4,
    fullName: 'Antoine Bernard',
    createdDate: '2024-02-12',
    createdDateTime: '2024-02-12T16:20:00Z',
    quoteAmount: 890.75,
    assignedDoctor: 'Dr. Marie Rousseau',
    status: 'En cours',
    hasTreatmentPlan: false,
  },
  {
    id: 5,
    fullName: 'Isabelle Petit',
    createdDate: '2024-02-18',
    createdDateTime: '2024-02-18T11:10:00Z',
    quoteAmount: 3150.25,
    assignedDoctor: 'Dr. Sophie Durand',
    status: 'Terminé',
    hasTreatmentPlan: true,
  },
];

const statusStyles = {
  'En cours': 'text-blue-700 bg-blue-50 ring-blue-600/20',
  'Terminé': 'text-green-700 bg-green-50 ring-green-600/20',
  'En attente': 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  'Annulé': 'text-red-700 bg-red-50 ring-red-600/20',
};

// Les médecins seront récupérés depuis Firebase via useDoctors()

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}


function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`;
  return formatDate(dateString);
}

const Patients = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 🚀 Hooks existants avec optimisations
  const { quotes, loading: quotesLoading, deleteQuote } = useQuotes();
  const { doctors, loading: doctorsLoading } = useDoctors();
  const { treatmentPlans, loading: treatmentPlansLoading } = useTreatmentPlans();
  
  const {
    generateTreatmentPlan,
    resetGeneration,
    isGenerating,
    generationProgress,
    generationStatus,
    error: generationError
  } = useTreatmentPlanGeneration();
  
  // États locaux optimisés
  const [patients, setPatients] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [filterDoctor, setFilterDoctor] = useState('Tous les médecins');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePlanConfirm, setDeletePlanConfirm] = useState(null); // État pour confirmation suppression plan
  const [isDeletingPlan, setIsDeletingPlan] = useState(false); // État pour indicateur de chargement suppression plan
  const [, forceUpdate] = useState({});
  
  // États pour la génération de plan de traitement
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [currentGeneratingPatient, setCurrentGeneratingPatient] = useState(null);
  
  // 🚀 Refs pour optimisation
  const lastMappingRef = useRef(null);
  const patientsMapRef = useRef(new Map());
  const debounceTimerRef = useRef(null);

  // 🚀 Transformation directe des devis (sans groupement artificiel par patient)
  const mapQuotesToDisplay = useCallback(() => {
    const isLoading = quotesLoading || doctorsLoading || treatmentPlansLoading;
    
    if (isLoading) {
      console.log('⏸️ Mapping suspendu - Chargement en cours');
      return;
    }

    if (!quotes || quotes.length === 0) {
      console.log('📋 Aucun devis trouvé, utilisation des données mock');
      setPatients(mockPatients);
      return;
    }

    console.log('🔄 Transformation des devis pour affichage:', quotes.length, 'devis');
    
    // Transformer chaque devis en objet d'affichage
    const displayQuotes = quotes.map(quote => {
      const patientName = quote.patientName || 'Patient inconnu';
      
      // Trouver le médecin référent
      const referringDoctor = doctors.find(d => d.id === quote.basicInfo?.referringDoctorId);
      const doctorName = referringDoctor ? `Dr. ${referringDoctor.name}` : 'Médecin non assigné';
      
      // Calculer le montant total du devis
      const quoteAmount = quote.pricing?.total || 0;
      
      // Mapper le statut Firebase vers l'interface
      const statusMap = {
        'brouillon': 'En cours',
        'envoye': 'En attente',
        'accepte': 'Terminé',
        'refuse': 'Annulé',
        'expire': 'Annulé'
      };
      const status = statusMap[quote.status] || 'En cours';
      
      // Vérifier si le patient a un plan de traitement (utiliser le nom patient)
      const hasExistingTreatmentPlan = treatmentPlans.some(plan =>
        plan.patientName === patientName || plan.patientId === quote.id
      );
      
      return {
        id: quote.id, // Utiliser l'ID du devis comme identifiant unique
        fullName: patientName,
        quoteNumber: quote.quoteNumber,
        createdDate: quote.createdAt?.toISOString?.()?.split('T')[0] || new Date().toISOString().split('T')[0],
        createdDateTime: quote.createdAt?.toISOString?.() || new Date().toISOString(),
        quoteAmount: quoteAmount,
        assignedDoctor: doctorName,
        status: status,
        hasTreatmentPlan: hasExistingTreatmentPlan,
        latestQuoteId: quote.id, // C'est le même ID que l'ID principal
        quotesCount: 1 // Chaque ligne représente un devis
      };
    });
    
    console.log('✅ Devis transformés pour affichage:', displayQuotes.length);
    setPatients(displayQuotes); // Réutiliser la même variable d'état
    
  }, [quotes, doctors, treatmentPlans, quotesLoading, doctorsLoading, treatmentPlansLoading]);

  // 🚀 useEffect avec debouncing simple
  useEffect(() => {
    // Nettoyer le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debouncer le mapping pour éviter les appels multiples
    debounceTimerRef.current = setTimeout(() => {
      mapQuotesToDisplay();
    }, 300);
    
    // Nettoyage
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [mapQuotesToDisplay]);

  // Listen for currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      forceUpdate({});
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, []);

  // Créer la liste des médecins pour le filtre
  const doctorFilterOptions = useMemo(() => {
    const uniqueDoctors = ['Tous les médecins'];
    if (doctors.length > 0) {
      doctors.forEach(doctor => {
        const doctorName = `Dr. ${doctor.name}`;
        if (!uniqueDoctors.includes(doctorName)) {
          uniqueDoctors.push(doctorName);
        }
      });
    } else {
      // Fallback avec les médecins des patients existants
      const doctorsFromPatients = [...new Set(patients.map(p => p.assignedDoctor))];
      uniqueDoctors.push(...doctorsFromPatients);
    }
    return uniqueDoctors;
  }, [doctors, patients]);

  // Filter and sort patients
  const filteredAndSortedPatients = useMemo(() => {
    let filtered = patients;
    
    // Filter by doctor
    if (filterDoctor !== 'Tous les médecins') {
      filtered = filtered.filter(patient => patient.assignedDoctor === filterDoctor);
    }
    
    // Sort patients
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return a.fullName.localeCompare(b.fullName);
        case 'date':
          return new Date(b.createdDateTime) - new Date(a.createdDateTime);
        case 'amount':
          return b.quoteAmount - a.quoteAmount;
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [patients, sortBy, filterDoctor]);

  // 🚀 Fonction de suppression de devis
  const handleDeleteQuote = useCallback(async (quoteId) => {
    try {
      setIsDeleting(true);
      console.log('🗑️ Suppression du devis:', quoteId);
      
      // Trouver le devis à supprimer
      const quoteToDelete = quotes.find(quote => quote.id === quoteId);
      if (!quoteToDelete) {
        throw new Error('Devis non trouvé');
      }
      
      console.log('📋 Devis à supprimer:', quoteToDelete.quoteNumber);
      
      // Supprimer le devis depuis Firebase
      await deleteQuote(quoteId);
      
      console.log('✅ Devis supprimé avec succès');
      
      // Supprimer le devis de l'état local (sera mis à jour automatiquement par l'écoute temps réel)
      setPatients(prev => prev.filter(p => p.id !== quoteId));
      setDeleteConfirm(null);
      
      // Feedback utilisateur
      alert(`Devis ${quoteToDelete.quoteNumber || quoteId} supprimé avec succès !`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert(`Erreur lors de la suppression: ${error.message}`);
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  }, [quotes, deleteQuote]);

  const handleDeleteTreatmentPlan = useCallback(async (quoteId) => {
    if (!quoteId) return;

    setIsDeletingPlan(true);
    console.log('🗑️ Suppression des plans de traitement pour le devis:', quoteId);

    try {
      // Trouver le devis pour obtenir le nom du patient
      const quote = patients.find(p => p.id === quoteId);
      const patientName = quote?.fullName || 'Patient inconnu';
      
      // Chercher les plans de traitement par nom de patient ET/OU ID de devis
      const plansToDelete = treatmentPlans.filter(plan =>
        plan.patientName === patientName || plan.patientId === quoteId
      );
      
      if (plansToDelete.length === 0) {
        alert('Aucun plan de traitement trouvé pour ce devis.');
        setDeletePlanConfirm(null);
        setIsDeletingPlan(false);
        return;
      }

      console.log(`📋 ${plansToDelete.length} plan(s) de traitement à supprimer.`);

      const deletePromises = plansToDelete.map(plan => {
        console.log('🗑️ Suppression du plan de traitement:', plan.id, plan.planNumber);
        return treatmentPlansService.deleteTreatmentPlan(plan.id);
      });

      await Promise.all(deletePromises);
      console.log('✅ Tous les plans de traitement supprimés avec succès');

      // Mettre à jour l'état local du devis
      setPatients(prev => prev.map(p =>
        p.id === quoteId ? { ...p, hasTreatmentPlan: false } : p
      ));
      setDeletePlanConfirm(null);

      alert(`${plansToDelete.length} plan(s) de traitement supprimé(s) avec succès !`);

    } catch (error) {
      console.error('❌ Erreur lors de la suppression des plans de traitement:', error);
      alert(`Erreur lors de la suppression des plans: ${error.message}`);
      setDeletePlanConfirm(null);
    } finally {
      setIsDeletingPlan(false);
    }
  }, [treatmentPlans, patients, setPatients]);

  const handleViewQuote = (quoteId) => {
    console.log('🔍 Navigation vers éditeur de devis:', quoteId);
    navigate(`/quote-editor/${quoteId}`);
  };

  const handleTreatmentPlan = async (quoteId) => {
console.log('🎯 handleTreatmentPlan appelé avec quoteId:', quoteId);
const quote = patients.find(p => p.id === quoteId);
console.log('🎯 Devis trouvé:', quote);

// La variable 'user' est déjà disponible grâce à l'appel de useAuth() au niveau supérieur du composant (ligne 107)

if (!user) {
  alert('Utilisateur non authentifié. Veuillez vous reconnecter.');
  return;
}

    // Si un plan existe déjà, naviguer directement
    // Chercher par nom de patient et/ou ID de devis
    const patientName = quote?.fullName;
    const existingPlan = treatmentPlans.find(tp =>
      tp.patientName === patientName || tp.patientId === quoteId
    );
    
    if (quote?.hasTreatmentPlan && existingPlan) {
      console.log('🦷 Navigation vers plan de traitement existant:', existingPlan.id);
      navigate(`/treatment-plans/${existingPlan.patientId || quoteId}`);
      return;
    }

    // Générer un nouveau plan de traitement
    console.log('🤖 Génération d\'un nouveau plan de traitement pour:', quote?.fullName);

    if (!quoteId || quoteId === 'new') {
      alert('Devis invalide. Impossible de générer un plan de traitement.');
      return;
    }

    try {
      setCurrentGeneratingPatient(quote);
      setShowGenerationModal(true); // Afficher le modal de progression
      
      // Sauvegarder les données du devis dans localStorage pour l'éditeur
      console.log('💾 Sauvegarde des données du devis dans localStorage:', quote);
      localStorage.setItem('tempPatientData', JSON.stringify({
        id: quote.id,
        fullName: quote.fullName,
        nom: quote.fullName,
        createdDate: quote.createdDate,
        assignedDoctor: quote.assignedDoctor,
        tags: quote.tags || [],
        quoteAmount: quote.quoteAmount,
        status: quote.status
      }));

      // 1. Récupérer le devis complet
      console.log(`Récupération du devis ${quoteId} pour ${quote.fullName}`);
      const fullQuote = await quotesService.getQuote(quoteId);
      if (!fullQuote) {
        throw new Error(`Devis ${quoteId} non trouvé.`);
      }
      console.log('Devis complet récupéré:', fullQuote);

      // 2. Envoyer à l'IA via la fonction de aiService.js
      // Supposons que generateStructuredPlanFromQuoteObject existe et prend l'objet devis
      // et retourne directement le JSON structuré.
      console.log('Envoi du devis à l\'IA pour structuration...');
      // TODO: S'assurer que generateStructuredPlanFromQuoteObject est implémentée dans aiService.js
      // Pour l'instant, on utilise une fonction placeholder si elle n'existe pas.
      // const aiJsonResponse = await aiService.generateStructuredPlanFromQuoteObject(fullQuote);
      
      // Appel à la fonction qui sera créée/adaptée dans aiService.js
      // Cette fonction doit prendre l'objet devis complet et retourner le JSON brut de l'IA.
      // Appel à la nouvelle fonction avec le nouveau prompt
      console.log('Appel à generateStructuredPlanWithNewPrompt...');
      const aiJsonResponse = await generateStructuredPlanWithNewPrompt(fullQuote);


      if (!aiJsonResponse) {
        throw new Error('Réponse nulle ou invalide de l\'IA');
      }
      console.log('Réponse brute reçue de l\'IA:', aiJsonResponse);

      // 3. Sauvegarder le JSON retourné par l'IA dans Firebase via treatmentPlansService.js
      // ATTENTION: createFromGeminiData s'attend à l'ancien format JSON.
      // La sauvegarde va probablement échouer ou sauvegarder des données incorrectes avec le nouveau format.
      // Pour l'instant, l'objectif est d'afficher le JSON brut. La sauvegarde sera à revoir.
      console.log('Sauvegarde du plan de traitement JSON dans Firebase (ATTENTION: format peut être incompatible)...');
      
      // Pour que la sauvegarde ne plante pas complètement, on va passer un objet qui ressemble un peu
      // à ce que createFromGeminiData attend, en mettant le nouveau JSON dans geminiData.
      // Cela ne va PAS structurer le plan correctement dans la base, mais permettra de tester l'affichage.
      const dataToSave = {
        ...aiJsonResponse, // Contient { taches: [...] }
        // On ajoute des champs que createFromGeminiData pourrait attendre pour éviter des erreurs directes
        // mais la structure interne (phases, etc.) ne sera pas là.
        titre_plan: `Plan (Nouveau Prompt) - ${quote.fullName}`,
        resume_langage_commun: "Plan généré avec le nouveau prompt d'ordonnancement.",
        phases: [] // Le nouveau prompt ne génère pas de phases dans l'ancien format
      };

      const referringDoctorId = fullQuote.basicInfo?.referringDoctorId || null;
      console.log('ID du médecin référent:', referringDoctorId);
      // On passe aiJsonResponse directement, qui est { taches: [...] }
      // createFromGeminiData va tenter de mapper cela.
      // Pour un test d'affichage du JSON brut, on peut stocker aiJsonResponse dans le champ geminiData du plan.
      // La fonction createFromGeminiData va essayer de mapper les champs.
      // Si on veut juste stocker le JSON brut, on pourrait créer une version simplifiée de createFromGeminiData
      // ou ajouter une logique pour stocker le JSON brut si un certain flag est passé.
      // Pour l'instant, on va utiliser la nouvelle méthode sans validation pour stocker le JSON brut
      console.log('📤 Appel createFromGeminiDataNoValidation avec:', {
        userId: user.uid,
        quoteId: quoteId,
        patientName: quote?.fullName,
        hasAiResponse: !!aiJsonResponse
      });
      
      // Utiliser l'ID du devis pour la sauvegarde
      console.log('💾 Sauvegarde avec quoteId:', quoteId);
      
      const savedPlan = await treatmentPlansService.createFromGeminiDataNoValidation(user.uid, quoteId, aiJsonResponse, referringDoctorId, quote.fullName);
      
      if (!savedPlan || !savedPlan.id) {
        throw new Error('Échec de la sauvegarde du plan de traitement dans Firebase.');
      }
      
      console.log('✅ Plan de traitement JSON sauvegardé avec succès:', {
        planId: savedPlan.id,
        patientId: savedPlan.patientId,
        quoteId: quoteId,
        patientName: quote?.fullName
      });
      
      // Mettre à jour l'état local pour refléter le nouveau plan
      setPatients(prevPatients => prevPatients.map(p =>
        p.id === quoteId ? { ...p, hasTreatmentPlan: true } : p
      ));

      // Attendre un peu pour que l'utilisateur voie le succès
      setTimeout(() => {
        setShowGenerationModal(false);
        setCurrentGeneratingPatient(null);
        resetGeneration();

        // 4. Naviguer vers la page de plan de traitement
        const navigationId = savedPlan.patientId || quoteId;
        console.log('🚀 Navigation vers la page du plan de traitement:', {
          url: `/treatment-plans/${navigationId}`,
          navigationId: navigationId,
          savedPlanPatientId: savedPlan.patientId,
          quoteId: quoteId,
          patientName: quote?.fullName
        });
        navigate(`/treatment-plans/${navigationId}`);
      }, 2000);

    } catch (error) {
      console.error('❌ Erreur lors de la génération ou sauvegarde du plan de traitement:', error);
      // Le modal affichera l'erreur si generationError est mis à jour par le hook
      // Sinon, afficher une alerte ou un message d'erreur plus direct ici.
      // Pour l'instant, on se fie au modal via le hook.
      // Si le hook n'est pas encore adapté, il faut gérer l'erreur ici.
      alert(`Erreur: ${error.message}`); // Affichage temporaire
      setShowGenerationModal(false);
      setCurrentGeneratingPatient(null);
      resetGeneration();
    }
  };

  // Fonction pour fermer le modal de génération
  const handleCloseGenerationModal = () => {
    if (!isGenerating) {
      setShowGenerationModal(false);
      setCurrentGeneratingPatient(null);
      resetGeneration();
    }
  };

  // Fonction pour réessayer la génération
  const handleRetryGeneration = async () => {
    if (currentGeneratingPatient?.id) {
      try {
        resetGeneration();
        const result = await generateTreatmentPlan(currentGeneratingPatient.id);
        
        console.log('✅ Plan de traitement généré avec succès (retry):', result.treatmentPlan.id);
        
        setTimeout(() => {
          setShowGenerationModal(false);
          setCurrentGeneratingPatient(null);
          resetGeneration();
          navigate(`/treatment-plans/${currentGeneratingPatient.id}`);
        }, 2000);
        
      } catch (error) {
        console.error('❌ Erreur lors de la génération (retry):', error);
      }
    }
  };

  // 🚀 Condition de chargement simplifiée
  if (quotesLoading || doctorsLoading || treatmentPlansLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Chargement des patients...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Devis</h1>
        <p className="text-gray-600 mt-2">Gérez vos devis et consultez les informations patients</p>
      </div>

      {/* Controls Bar */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Sort Options */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Trier par:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('alphabetical')}
                  className={classNames(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    sortBy === 'alphabetical'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  )}
                >
                  Alphabétique
                </button>
                <button
                  onClick={() => setSortBy('date')}
                  className={classNames(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    sortBy === 'date'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  )}
                >
                  Date
                </button>
                <button
                  onClick={() => setSortBy('amount')}
                  className={classNames(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    sortBy === 'amount'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  )}
                >
                  Montant
                </button>
              </div>
            </div>

            {/* Filter by Doctor */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <Menu as="div" className="relative">
                <MenuButton className="flex items-center gap-x-1 text-sm font-medium text-gray-700 hover:text-gray-900">
                  {filterDoctor}
                  <ChevronDownIcon className="h-4 w-4" />
                </MenuButton>
                <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden">
                  {doctorFilterOptions.map((doctor) => (
                    <MenuItem key={doctor}>
                      <button
                        onClick={() => setFilterDoctor(doctor)}
                        className={classNames(
                          'block w-full px-4 py-2 text-left text-sm',
                          filterDoctor === doctor
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {doctor}
                      </button>
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>
            </div>
          </div>
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        {filteredAndSortedPatients.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun devis trouvé</h3>
            <p className="text-gray-500">
              {filterDoctor !== 'Tous les médecins'
                ? `Aucun devis assigné à ${filterDoctor}`
                : 'Aucun devis dans la base de données'
              }
            </p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-100">
            {filteredAndSortedPatients.map((patient) => (
              <li key={patient.id} className="flex items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-x-3">
                    <p className="text-base font-semibold text-gray-900 leading-6">
                      {patient.fullName}
                    </p>
                    <p
                      className={classNames(
                        statusStyles[patient.status],
                        'mt-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
                      )}
                    >
                      {patient.status}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-x-2 text-sm text-gray-500">
                    <p className="whitespace-nowrap">
                      Créé le <time dateTime={patient.createdDateTime}>{formatDate(patient.createdDate)}</time>
                    </p>
                    <svg viewBox="0 0 2 2" className="size-0.5 fill-current">
                      <circle r={1} cx={1} cy={1} />
                    </svg>
                    <p className="truncate">
                      <span className="font-medium">Médecin:</span> {patient.assignedDoctor}
                    </p>
                  </div>
                  <div className="mt-2">
                    <p className="text-lg font-bold text-indigo-600">
                      {formatCurrency(patient.quoteAmount)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-none items-center gap-x-4">
                  <div className="hidden sm:flex sm:gap-x-2">
                    <button
                      onClick={() => handleViewQuote(patient.id)}
                      className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 transition-colors"
                    >
                      Éditer Devis<span className="sr-only">, {patient.fullName}</span>
                    </button>
                    {patient.hasTreatmentPlan ? (
                      <button
                        onClick={() => handleTreatmentPlan(patient.id)}
                        className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                      >
                        Plan de traitement<span className="sr-only">, {patient.fullName}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTreatmentPlan(patient.id)}
                        className="rounded-md bg-gray-100 px-2.5 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-x-1"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Plan de traitement<span className="sr-only">, {patient.fullName}</span>
                      </button>
                    )}
                  </div>
                  <Menu as="div" className="relative flex-none">
                    <MenuButton className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900 transition-colors">
                      <span className="sr-only">Ouvrir les options</span>
                      <EllipsisVerticalIcon aria-hidden="true" className="size-5" />
                    </MenuButton>
                    <MenuItems
                      transition
                      className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 ring-1 shadow-lg ring-gray-900/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                    >
                      <MenuItem>
                        <button
                          onClick={() => handleViewQuote(patient.id)}
                          className="block w-full px-3 py-1 text-left text-sm text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                        >
                          Éditer Devis<span className="sr-only">, {patient.fullName}</span>
                        </button>
                      </MenuItem>
                      <MenuItem>
                        <button
                          onClick={() => handleTreatmentPlan(patient.id)}
                          className="block w-full px-3 py-1 text-left text-sm text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                        >
                          {patient.hasTreatmentPlan ? 'Plan de traitement' : '+ Plan de traitement'}<span className="sr-only">, {patient.fullName}</span>
                        </button>
                      </MenuItem>
                      <MenuItem>
                        <button
                          className="block w-full px-3 py-1 text-left text-sm text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                        >
                          Modifier<span className="sr-only">, {patient.fullName}</span>
                        </button>
                      </MenuItem>
                      {patient.hasTreatmentPlan && (
                        <MenuItem>
                          <button
                            onClick={() => setDeletePlanConfirm(patient.id)}
                            className="block w-full px-3 py-1 text-left text-sm text-orange-600 data-focus:bg-orange-50 data-focus:outline-hidden"
                          >
                            Suppr. Plan<span className="sr-only">, {patient.fullName}</span>
                          </button>
                        </MenuItem>
                      )}
                      <MenuItem>
                        <button
                          onClick={() => setDeleteConfirm(patient.id)}
                          className="block w-full px-3 py-1 text-left text-sm text-red-700 data-focus:bg-red-50 data-focus:outline-hidden"
                        >
                          Suppr. Devis<span className="sr-only">, {patient.fullName}</span>
                        </button>
                      </MenuItem>
                    </MenuItems>
                  </Menu>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-lg font-semibold text-gray-900">Supprimer le devis</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer ce devis ? Cette action ne peut pas être annulée.
                </p>
                {(() => {
                  const quote = patients.find(p => p.id === deleteConfirm);
                  return quote && (
                    <div className="mt-3 p-3 bg-red-50 rounded-md">
                      <p className="text-sm font-medium text-red-800">
                        Patient : {quote.fullName}
                      </p>
                      <p className="text-sm text-red-600">
                        Devis n° {quote.quoteNumber || quote.id} sera supprimé définitivement
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDeleteQuote(deleteConfirm)}
                disabled={isDeleting}
                className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Plan Confirmation Modal */}
      {deletePlanConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-lg font-semibold text-gray-900">Supprimer le(s) Plan(s) de Traitement</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer tous les plans de traitement pour ce patient ? Cette action ne peut pas être annulée.
                </p>
                {(() => {
                  const quote = patients.find(p => p.id === deletePlanConfirm);
                  const patientName = quote?.fullName;
                  const quotePlans = treatmentPlans.filter(plan =>
                    plan.patientName === patientName || plan.patientId === deletePlanConfirm
                  );
                  return quote && (
                    <div className="mt-3 p-3 bg-orange-50 rounded-md">
                      <p className="text-sm font-medium text-orange-800">
                        Patient : {quote.fullName}
                      </p>
                      <p className="text-sm text-orange-600">
                        {quotePlans.length} plan(s) de traitement sera(ont) supprimé(s) définitivement.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setDeletePlanConfirm(null)}
                className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTreatmentPlan(deletePlanConfirm)}
                disabled={isDeletingPlan}
                className="flex-1 rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeletingPlan && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isDeletingPlan ? 'Suppression...' : 'Supprimer Plan(s)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de génération de plan de traitement */}
      <TreatmentPlanGenerationModal
        isOpen={showGenerationModal}
        onClose={handleCloseGenerationModal}
        isGenerating={isGenerating}
        progress={generationProgress}
        status={generationStatus}
        error={generationError}
        onRetry={handleRetryGeneration}
        patientName={currentGeneratingPatient?.fullName || ''}
      />
    </div>
  );
};

export default Patients;