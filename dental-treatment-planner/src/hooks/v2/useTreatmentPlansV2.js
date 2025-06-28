import { useState, useEffect, useCallback, useMemo } from 'react';
import treatmentPlansServiceV2 from '../services/v2/treatmentPlansService.js';

/**
 * Hook React pour la gestion des plans de traitement avec la nouvelle architecture Firebase V2
 * Fournit une interface réactive pour toutes les opérations plans de traitement
 */
export const useTreatmentPlansV2 = (userId) => {
  // États principaux
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // États pour les opérations
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  /**
   * Charger tous les plans de traitement
   */
  const loadTreatmentPlans = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement plans de traitement V2...');
      
      const plansData = await treatmentPlansServiceV2.getTreatmentPlans(userId);
      setTreatmentPlans(plansData);
      
      console.log('✅ Plans de traitement chargés V2:', plansData.length);
    } catch (err) {
      console.error('❌ Erreur chargement plans V2:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Créer un nouveau plan de traitement
   */
  const createTreatmentPlan = useCallback(async (planData) => {
    try {
      setCreating(true);
      setError(null);
      console.log('➕ Création plan de traitement V2...');
      
      const newPlan = await treatmentPlansServiceV2.createTreatmentPlan(userId, planData);
      setTreatmentPlans(prev => [newPlan, ...prev]);
      
      console.log('✅ Plan de traitement créé V2:', newPlan.id);
      return newPlan;
    } catch (err) {
      console.error('❌ Erreur création plan V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  }, [userId]);

  /**
   * Mettre à jour un plan de traitement
   */
  const updateTreatmentPlan = useCallback(async (planId, updates) => {
    try {
      setUpdating(true);
      setError(null);
      console.log('📝 Mise à jour plan de traitement V2:', planId);
      
      const updatedPlan = await treatmentPlansServiceV2.updateTreatmentPlan(planId, updates);
      setTreatmentPlans(prev => prev.map(p => p.id === planId ? updatedPlan : p));
      
      console.log('✅ Plan de traitement mis à jour V2:', planId);
      return updatedPlan;
    } catch (err) {
      console.error('❌ Erreur mise à jour plan V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * Supprimer un plan de traitement
   */
  const deleteTreatmentPlan = useCallback(async (planId) => {
    try {
      setDeleting(true);
      setError(null);
      console.log('🗑️ Suppression plan de traitement V2:', planId);
      
      await treatmentPlansServiceV2.deleteTreatmentPlan(planId);
      setTreatmentPlans(prev => prev.filter(p => p.id !== planId));
      
      console.log('✅ Plan de traitement supprimé V2:', planId);
    } catch (err) {
      console.error('❌ Erreur suppression plan V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, []);

  /**
   * Dupliquer un plan de traitement
   */
  const duplicateTreatmentPlan = useCallback(async (planId) => {
    try {
      setDuplicating(true);
      setError(null);
      console.log('📋 Duplication plan de traitement V2:', planId);
      
      const duplicatedPlan = await treatmentPlansServiceV2.duplicateTreatmentPlan(planId);
      setTreatmentPlans(prev => [duplicatedPlan, ...prev]);
      
      console.log('✅ Plan de traitement dupliqué V2:', duplicatedPlan.id);
      return duplicatedPlan;
    } catch (err) {
      console.error('❌ Erreur duplication plan V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setDuplicating(false);
    }
  }, []);

  /**
   * Changer le statut d'un plan de traitement
   */
  const changePlanStatus = useCallback(async (planId, newStatus) => {
    try {
      setUpdating(true);
      setError(null);
      console.log('🔄 Changement statut plan V2:', planId, '->', newStatus);
      
      const updatedPlan = await treatmentPlansServiceV2.updateTreatmentPlan(planId, { status: newStatus });
      setTreatmentPlans(prev => prev.map(p => p.id === planId ? updatedPlan : p));
      
      console.log('✅ Statut changé V2:', planId);
      return updatedPlan;
    } catch (err) {
      console.error('❌ Erreur changement statut V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * Changer la priorité d'un plan de traitement
   */
  const changePlanPriority = useCallback(async (planId, newPriority) => {
    try {
      setUpdating(true);
      setError(null);
      console.log('⚡ Changement priorité plan V2:', planId, '->', newPriority);
      
      const updatedPlan = await treatmentPlansServiceV2.updateTreatmentPlan(planId, { priority: newPriority });
      setTreatmentPlans(prev => prev.map(p => p.id === planId ? updatedPlan : p));
      
      console.log('✅ Priorité changée V2:', planId);
      return updatedPlan;
    } catch (err) {
      console.error('❌ Erreur changement priorité V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * Mettre à jour les phases d'un plan
   */
  const updatePlanPhases = useCallback(async (planId, phases) => {
    try {
      setUpdating(true);
      setError(null);
      console.log('📋 Mise à jour phases plan V2:', planId);
      
      const updatedPlan = await treatmentPlansServiceV2.updateTreatmentPlan(planId, { phases });
      setTreatmentPlans(prev => prev.map(p => p.id === planId ? updatedPlan : p));
      
      console.log('✅ Phases mises à jour V2:', planId);
      return updatedPlan;
    } catch (err) {
      console.error('❌ Erreur mise à jour phases V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * Mettre à jour la timeline d'un plan
   */
  const updatePlanTimeline = useCallback(async (planId, timeline) => {
    try {
      setUpdating(true);
      setError(null);
      console.log('📅 Mise à jour timeline plan V2:', planId);
      
      const updatedPlan = await treatmentPlansServiceV2.updateTreatmentPlan(planId, { timeline });
      setTreatmentPlans(prev => prev.map(p => p.id === planId ? updatedPlan : p));
      
      console.log('✅ Timeline mise à jour V2:', planId);
      return updatedPlan;
    } catch (err) {
      console.error('❌ Erreur mise à jour timeline V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * Obtenir les statistiques des plans de traitement
   */
  const getStatistics = useCallback(async () => {
    if (!userId) return null;

    try {
      console.log('📊 Chargement statistiques plans V2...');
      const stats = await treatmentPlansServiceV2.getTreatmentPlansStats(userId);
      console.log('✅ Statistiques plans V2:', stats);
      return stats;
    } catch (err) {
      console.error('❌ Erreur statistiques plans V2:', err);
      throw err;
    }
  }, [userId]);

  /**
   * Exporter les plans de traitement
   */
  const exportTreatmentPlans = useCallback(async () => {
    if (!userId) return null;

    try {
      console.log('📤 Export plans de traitement V2...');
      const exportData = await treatmentPlansServiceV2.exportTreatmentPlans(userId);
      console.log('✅ Export terminé V2');
      return exportData;
    } catch (err) {
      console.error('❌ Erreur export plans V2:', err);
      throw err;
    }
  }, [userId]);

  /**
   * Plans de traitement filtrés et triés
   */
  const filteredAndSortedPlans = useMemo(() => {
    let filtered = treatmentPlans;

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(plan => plan.status === statusFilter);
    }

    // Filtrage par priorité
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(plan => plan.priority === priorityFilter);
    }

    // Filtrage par terme de recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(plan => 
        plan.planNumber?.toLowerCase().includes(term) ||
        plan.patientInfo?.firstName?.toLowerCase().includes(term) ||
        plan.patientInfo?.lastName?.toLowerCase().includes(term) ||
        plan.basicInfo?.title?.toLowerCase().includes(term) ||
        plan.basicInfo?.description?.toLowerCase().includes(term)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Gestion spéciale pour les dates
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Gestion spéciale pour les coûts
      if (sortBy === 'totalCost') {
        aValue = a.statistics?.totalCost || 0;
        bValue = b.statistics?.totalCost || 0;
      }

      // Gestion spéciale pour le progrès
      if (sortBy === 'progress') {
        aValue = a.statistics?.progressPercentage || 0;
        bValue = b.statistics?.progressPercentage || 0;
      }

      // Gestion des valeurs nulles/undefined
      if (aValue == null) aValue = sortOrder === 'asc' ? -Infinity : Infinity;
      if (bValue == null) bValue = sortOrder === 'asc' ? -Infinity : Infinity;

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [treatmentPlans, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);

  /**
   * Statistiques calculées localement
   */
  const localStats = useMemo(() => {
    const totalCost = treatmentPlans.reduce((sum, plan) => sum + (plan.statistics?.totalCost || 0), 0);
    const averageProgress = treatmentPlans.length > 0 ?
      treatmentPlans.reduce((sum, plan) => sum + (plan.statistics?.progressPercentage || 0), 0) / treatmentPlans.length : 0;
    
    return {
      total: treatmentPlans.length,
      filtered: filteredAndSortedPlans.length,
      byStatus: {
        planifie: treatmentPlans.filter(p => p.status === 'planifie').length,
        en_cours: treatmentPlans.filter(p => p.status === 'en_cours').length,
        suspendu: treatmentPlans.filter(p => p.status === 'suspendu').length,
        termine: treatmentPlans.filter(p => p.status === 'termine').length,
        annule: treatmentPlans.filter(p => p.status === 'annule').length
      },
      byPriority: {
        faible: treatmentPlans.filter(p => p.priority === 'faible').length,
        normale: treatmentPlans.filter(p => p.priority === 'normale').length,
        haute: treatmentPlans.filter(p => p.priority === 'haute').length,
        urgente: treatmentPlans.filter(p => p.priority === 'urgente').length
      },
      totalCost,
      averageCost: treatmentPlans.length > 0 ? totalCost / treatmentPlans.length : 0,
      averageProgress,
      recentlyCreated: treatmentPlans.filter(p => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(p.createdAt) > weekAgo;
      }).length
    };
  }, [treatmentPlans, filteredAndSortedPlans]);

  /**
   * Obtenir un plan de traitement par ID
   */
  const getTreatmentPlanById = useCallback((planId) => {
    return treatmentPlans.find(p => p.id === planId);
  }, [treatmentPlans]);

  /**
   * Vérifier si un plan de traitement existe
   */
  const treatmentPlanExists = useCallback((planId) => {
    return treatmentPlans.some(p => p.id === planId);
  }, [treatmentPlans]);

  /**
   * Obtenir les plans d'un patient
   */
  const getTreatmentPlansByPatient = useCallback((patientId) => {
    return treatmentPlans.filter(p => p.patientId === patientId);
  }, [treatmentPlans]);

  /**
   * Obtenir les plans liés à un devis
   */
  const getTreatmentPlansByQuote = useCallback((quoteId) => {
    return treatmentPlans.filter(p => p.quoteId === quoteId);
  }, [treatmentPlans]);

  /**
   * Rafraîchir les données
   */
  const refresh = useCallback(() => {
    loadTreatmentPlans();
  }, [loadTreatmentPlans]);

  // Chargement initial
  useEffect(() => {
    loadTreatmentPlans();
  }, [loadTreatmentPlans]);

  return {
    // Données
    treatmentPlans: filteredAndSortedPlans,
    allTreatmentPlans: treatmentPlans,
    
    // États
    loading,
    error,
    creating,
    updating,
    deleting,
    duplicating,
    
    // Filtres et tri
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    
    // Actions CRUD
    createTreatmentPlan,
    updateTreatmentPlan,
    deleteTreatmentPlan,
    refresh,
    
    // Actions spécialisées
    duplicateTreatmentPlan,
    changePlanStatus,
    changePlanPriority,
    updatePlanPhases,
    updatePlanTimeline,
    
    // Statistiques et export
    getStatistics,
    exportTreatmentPlans,
    
    // Utilitaires
    getTreatmentPlanById,
    treatmentPlanExists,
    getTreatmentPlansByPatient,
    getTreatmentPlansByQuote,
    localStats,
    
    // Méta-données
    isEmpty: treatmentPlans.length === 0,
    hasResults: filteredAndSortedPlans.length > 0,
    isFiltered: searchTerm.trim().length > 0 || statusFilter !== 'all' || priorityFilter !== 'all'
  };
};

export default useTreatmentPlansV2;