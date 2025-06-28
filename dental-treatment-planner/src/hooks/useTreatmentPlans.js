/**
 * Hook pour gérer les plans de traitement
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import treatmentPlansService from '../services/treatmentPlansService';

export const useTreatmentPlans = () => {
  const { user } = useAuth();
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les plans de traitement
  const loadTreatmentPlans = useCallback(async () => {
    if (!user?.uid) {
      setTreatmentPlans([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🦷 Chargement des plans de traitement pour:', user.uid);
      
      const plans = await treatmentPlansService.getTreatmentPlans(user.uid);
      console.log('✅ Plans de traitement chargés:', plans.length);
      
      setTreatmentPlans(plans);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des plans:', err);
      setError(err.message);
      setTreatmentPlans([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Charger les plans au montage et quand l'utilisateur change
  useEffect(() => {
    loadTreatmentPlans();
  }, [loadTreatmentPlans]);

  // Ajouter un plan de traitement
  const addTreatmentPlan = useCallback(async (planData) => {
    if (!user?.uid) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      console.log('➕ Ajout d\'un nouveau plan de traitement');
      const newPlan = await treatmentPlansService.addTreatmentPlan(user.uid, planData);
      
      setTreatmentPlans(prev => [newPlan, ...prev]);
      console.log('✅ Plan de traitement ajouté:', newPlan.id);
      
      return newPlan;
    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout du plan:', err);
      throw err;
    }
  }, [user?.uid]);

  // Mettre à jour un plan de traitement
  const updateTreatmentPlan = useCallback(async (planId, updates) => {
    try {
      console.log('📝 Mise à jour du plan:', planId);
      const updatedPlan = await treatmentPlansService.updateTreatmentPlan(planId, updates);
      
      setTreatmentPlans(prev => 
        prev.map(plan => plan.id === planId ? { ...plan, ...updatedPlan } : plan)
      );
      
      console.log('✅ Plan mis à jour:', planId);
      return updatedPlan;
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour:', err);
      throw err;
    }
  }, []);

  // Supprimer un plan de traitement
  const deleteTreatmentPlan = useCallback(async (planId) => {
    try {
      console.log('🗑️ Suppression du plan:', planId);
      await treatmentPlansService.deleteTreatmentPlan(planId);
      
      setTreatmentPlans(prev => prev.filter(plan => plan.id !== planId));
      console.log('✅ Plan supprimé:', planId);
    } catch (err) {
      console.error('❌ Erreur lors de la suppression:', err);
      throw err;
    }
  }, []);

  // Obtenir un plan spécifique
  const getTreatmentPlan = useCallback(async (planId) => {
    try {
      console.log('🔍 Récupération du plan:', planId);
      const plan = await treatmentPlansService.getTreatmentPlan(planId);
      console.log('✅ Plan récupéré:', plan.planNumber);
      return plan;
    } catch (err) {
      console.error('❌ Erreur lors de la récupération:', err);
      throw err;
    }
  }, []);

  // Obtenir les plans d'un patient
  const getTreatmentPlansByPatient = useCallback(async (patientId) => {
    try {
      console.log('🔍 Récupération des plans pour le patient:', patientId);
      const plans = await treatmentPlansService.getTreatmentPlansByPatient(patientId);
      console.log('✅ Plans du patient récupérés:', plans.length);
      return plans;
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des plans du patient:', err);
      throw err;
    }
  }, []);

  // Créer un plan depuis un devis
  const createFromQuote = useCallback(async (quote) => {
    if (!user?.uid) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      console.log('💰➡️🦷 Création d\'un plan depuis le devis:', quote.quoteNumber);
      const newPlan = await treatmentPlansService.createFromQuote(user.uid, quote);
      
      setTreatmentPlans(prev => [newPlan, ...prev]);
      console.log('✅ Plan créé depuis devis:', newPlan.id);
      
      return newPlan;
    } catch (err) {
      console.error('❌ Erreur lors de la création depuis devis:', err);
      throw err;
    }
  }, [user?.uid]);

  // Démarrer un plan de traitement
  const startTreatmentPlan = useCallback(async (planId) => {
    try {
      console.log('▶️ Démarrage du plan:', planId);
      const updatedPlan = await treatmentPlansService.startTreatmentPlan(planId);
      
      setTreatmentPlans(prev => 
        prev.map(plan => plan.id === planId ? { ...plan, ...updatedPlan } : plan)
      );
      
      console.log('✅ Plan démarré:', planId);
      return updatedPlan;
    } catch (err) {
      console.error('❌ Erreur lors du démarrage:', err);
      throw err;
    }
  }, []);

  // Terminer un plan de traitement
  const completeTreatmentPlan = useCallback(async (planId) => {
    try {
      console.log('✅ Finalisation du plan:', planId);
      const updatedPlan = await treatmentPlansService.completeTreatmentPlan(planId);
      
      setTreatmentPlans(prev => 
        prev.map(plan => plan.id === planId ? { ...plan, ...updatedPlan } : plan)
      );
      
      console.log('✅ Plan terminé:', planId);
      return updatedPlan;
    } catch (err) {
      console.error('❌ Erreur lors de la finalisation:', err);
      throw err;
    }
  }, []);

  return {
    treatmentPlans,
    loading,
    error,
    loadTreatmentPlans,
    addTreatmentPlan,
    updateTreatmentPlan,
    deleteTreatmentPlan,
    getTreatmentPlan,
    getTreatmentPlansByPatient,
    createFromQuote,
    startTreatmentPlan,
    completeTreatmentPlan
  };
};