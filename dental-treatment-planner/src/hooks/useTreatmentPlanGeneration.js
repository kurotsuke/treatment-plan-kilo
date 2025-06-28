/**
 * Hook pour gérer la génération de plans de traitement depuis les devis
 */
import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuotes } from './useQuotes';
import { useTreatmentPlans } from './useTreatmentPlans';
// Utiliser la fonction qui génère le bon format avec taches
import { generateStructuredPlanWithNewPrompt } from '../services/aiService';
// treatmentPlansService est déjà utilisé via useTreatmentPlans, mais on pourrait avoir besoin de createFromGeminiData directement
// import treatmentPlansService from '../services/treatmentPlansService'; // Si on appelle createFromGeminiData ici

export const useTreatmentPlanGeneration = () => {
  const { user } = useAuth();
  const { getQuote } = useQuotes(); // Pour récupérer l'objet devis complet
  const { addTreatmentPlan } = useTreatmentPlans(); // Pour sauvegarder le plan
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [error, setError] = useState(null);

  /**
   * Génère un plan de traitement structuré (JSON brut de l'IA) depuis un devis.
   * @param {string} quoteId - ID du devis.
   * @returns {Promise<object>} L'objet du plan de traitement sauvegardé.
   */
  const generateTreatmentPlan = useCallback(async (quoteId) => {
    if (!user?.uid) {
      throw new Error('Utilisateur non connecté');
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Initialisation...');
    setError(null);

    try {
      // Étape 1: Récupérer le devis complet
      setGenerationStatus('Récupération du devis...');
      setGenerationProgress(10);
      const quote = await getQuote(quoteId);
      if (!quote) {
        throw new Error(`Devis ${quoteId} non trouvé.`);
      }
      console.log('📋 Devis complet récupéré:', quote.quoteNumber);
      setGenerationProgress(25);

      // Étape 2: Envoyer le devis à l'IA pour obtenir le JSON structuré
      setGenerationStatus('Génération du plan par l\'IA...');
      setGenerationProgress(40);
      // Utilisation de la fonction qui génère le format avec taches
      const aiJsonResponse = await generateStructuredPlanWithNewPrompt(quote);
      if (!aiJsonResponse) {
        throw new Error('Réponse nulle ou invalide de l\'IA.');
      }
      console.log('🤖 JSON structuré reçu de l\'IA (format taches):', {
        hasTaches: !!aiJsonResponse.taches,
        nombreTaches: aiJsonResponse.taches?.length || 0,
        premiereTache: aiJsonResponse.taches?.[0] || null,
        fullResponse: aiJsonResponse
      });
      setGenerationProgress(70);

      // Étape 3: Sauvegarder le JSON brut dans Firebase
      // La fonction addTreatmentPlan de useTreatmentPlans s'attend à un format spécifique.
      // Nous allons utiliser la fonction createFromGeminiData de treatmentPlansService si elle est adaptée,
      // ou alors il faut que addTreatmentPlan soit capable de gérer directement le geminiData.
      // Pour l'instant, on va construire l'objet planData comme attendu par addTreatmentPlan,
      // en y incluant le geminiData.
      setGenerationStatus('Sauvegarde du plan de traitement...');
      setGenerationProgress(85);

      const treatmentPlanPayload = {
        patientId: quote.patientId,
        patientName: quote.patientName || 'N/A', // Assurer que patientName est présent
        quoteId: quote.id,
        basicInfo: {
          title: `Plan pour ${quote.patientName || quote.patientId}`,
          description: 'Plan de traitement généré par IA.',
          referringDoctorId: quote.basicInfo?.referringDoctorId, // Conserver le médecin du devis
        },
        // Les informations patientInfo, phases, timeline pourraient être remplies à partir de aiJsonResponse
        // ou laissées minimales si l'affichage se base uniquement sur geminiData.
        // Pour l'instant, on se concentre sur la sauvegarde de geminiData.
        patientInfo: { // Informations minimales
            healthStatus: '',
        },
        phases: [], // Pas de phases dans le nouveau format
        timeline: { // Timeline minimale
            startDate: new Date(), // Placeholder
        },
        status: 'planifie', // Statut initial
        geminiData: aiJsonResponse, // Le JSON brut de l'IA avec format taches
        createdAt: new Date(), // Géré par serverTimestamp dans le service normalement
        updatedAt: new Date(), // Géré par serverTimestamp
      };
      
      // Utiliser addTreatmentPlan du hook useTreatmentPlans
      // Ce hook devrait appeler treatmentPlansService.addTreatmentPlan en interne.
      const savedPlan = await addTreatmentPlan(treatmentPlanPayload);

      if (!savedPlan || !savedPlan.id) {
        throw new Error('Échec de la sauvegarde du plan de traitement dans Firebase.');
      }
      console.log('💾 Plan de traitement JSON sauvegardé avec succès:', savedPlan.id);
      setGenerationProgress(100);
      setGenerationStatus('Plan de traitement généré et sauvegardé !');

      return {
        treatmentPlan: savedPlan, // Le plan sauvegardé avec son ID Firebase
        rawAiJson: aiJsonResponse, // Le JSON brut pour référence si besoin
        sourceQuote: quote
      };

    } catch (err) {
      console.error('❌ Erreur majeure dans useTreatmentPlanGeneration:', err);
      setError(err.message || 'Une erreur inconnue est survenue.');
      setGenerationStatus(`Erreur: ${err.message}`);
      throw err; // Renvoyer l'erreur pour que l'appelant puisse la gérer
    } finally {
      setIsGenerating(false);
    }
  }, [user, getQuote, addTreatmentPlan]);

  /**
   * Réinitialise l'état du hook
   */
  const resetGeneration = useCallback(() => {
    setIsGenerating(false);
    setGenerationProgress(0);
    setGenerationStatus('');
    setError(null);
  }, []);

  return {
    generateTreatmentPlan,
    resetGeneration,
    isGenerating,
    generationProgress,
    generationStatus,
    error
  };
};