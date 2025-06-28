import { useState, useEffect, useCallback, useMemo } from 'react';
import quotesServiceV2 from '../services/v2/quotesService.js';

/**
 * Hook React pour la gestion des devis avec la nouvelle architecture Firebase V2
 * Fournit une interface réactive pour toutes les opérations devis
 */
export const useQuotesV2 = (userId) => {
  // États principaux
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // États pour les opérations
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);

  /**
   * Charger tous les devis
   */
  const loadQuotes = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement devis V2...');
      
      const quotesData = await quotesServiceV2.getQuotes(userId);
      setQuotes(quotesData);
      
      console.log('✅ Devis chargés V2:', quotesData.length);
    } catch (err) {
      console.error('❌ Erreur chargement devis V2:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Créer un nouveau devis
   */
  const createQuote = useCallback(async (quoteData) => {
    try {
      setCreating(true);
      setError(null);
      console.log('➕ Création devis V2...');
      
      const newQuote = await quotesServiceV2.createQuote(userId, quoteData);
      setQuotes(prev => [newQuote, ...prev]);
      
      console.log('✅ Devis créé V2:', newQuote.id);
      return newQuote;
    } catch (err) {
      console.error('❌ Erreur création devis V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  }, [userId]);

  /**
   * Mettre à jour un devis
   */
  const updateQuote = useCallback(async (quoteId, updates) => {
    try {
      setUpdating(true);
      setError(null);
      console.log('📝 Mise à jour devis V2:', quoteId);
      
      const updatedQuote = await quotesServiceV2.updateQuote(quoteId, updates);
      setQuotes(prev => prev.map(q => q.id === quoteId ? updatedQuote : q));
      
      console.log('✅ Devis mis à jour V2:', quoteId);
      return updatedQuote;
    } catch (err) {
      console.error('❌ Erreur mise à jour devis V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * Supprimer un devis
   */
  const deleteQuote = useCallback(async (quoteId) => {
    try {
      setDeleting(true);
      setError(null);
      console.log('🗑️ Suppression devis V2:', quoteId);
      
      await quotesServiceV2.deleteQuote(quoteId);
      setQuotes(prev => prev.filter(q => q.id !== quoteId));
      
      console.log('✅ Devis supprimé V2:', quoteId);
    } catch (err) {
      console.error('❌ Erreur suppression devis V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, []);

  /**
   * Générer un devis avec Gemini AI
   */
  const generateQuoteWithAI = useCallback(async (patientData, treatments) => {
    try {
      setGenerating(true);
      setError(null);
      console.log('🤖 Génération devis IA V2...');
      
      const generatedQuote = await quotesServiceV2.generateQuoteWithGemini(userId, patientData, treatments);
      setQuotes(prev => [generatedQuote, ...prev]);
      
      console.log('✅ Devis généré par IA V2:', generatedQuote.id);
      return generatedQuote;
    } catch (err) {
      console.error('❌ Erreur génération IA V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, [userId]);

  /**
   * Dupliquer un devis
   */
  const duplicateQuote = useCallback(async (quoteId) => {
    try {
      setCreating(true);
      setError(null);
      console.log('📋 Duplication devis V2:', quoteId);
      
      const duplicatedQuote = await quotesServiceV2.duplicateQuote(quoteId);
      setQuotes(prev => [duplicatedQuote, ...prev]);
      
      console.log('✅ Devis dupliqué V2:', duplicatedQuote.id);
      return duplicatedQuote;
    } catch (err) {
      console.error('❌ Erreur duplication devis V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  /**
   * Changer le statut d'un devis
   */
  const changeQuoteStatus = useCallback(async (quoteId, newStatus) => {
    try {
      setUpdating(true);
      setError(null);
      console.log('🔄 Changement statut devis V2:', quoteId, '->', newStatus);
      
      const updatedQuote = await quotesServiceV2.updateQuote(quoteId, { status: newStatus });
      setQuotes(prev => prev.map(q => q.id === quoteId ? updatedQuote : q));
      
      console.log('✅ Statut changé V2:', quoteId);
      return updatedQuote;
    } catch (err) {
      console.error('❌ Erreur changement statut V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * Obtenir les statistiques des devis
   */
  const getStatistics = useCallback(async () => {
    if (!userId) return null;

    try {
      console.log('📊 Chargement statistiques devis V2...');
      const stats = await quotesServiceV2.getQuotesStats(userId);
      console.log('✅ Statistiques devis V2:', stats);
      return stats;
    } catch (err) {
      console.error('❌ Erreur statistiques devis V2:', err);
      throw err;
    }
  }, [userId]);

  /**
   * Exporter les devis
   */
  const exportQuotes = useCallback(async () => {
    if (!userId) return null;

    try {
      console.log('📤 Export devis V2...');
      const exportData = await quotesServiceV2.exportQuotes(userId);
      console.log('✅ Export terminé V2');
      return exportData;
    } catch (err) {
      console.error('❌ Erreur export devis V2:', err);
      throw err;
    }
  }, [userId]);

  /**
   * Devis filtrés et triés
   */
  const filteredAndSortedQuotes = useMemo(() => {
    let filtered = quotes;

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    // Filtrage par terme de recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(quote => 
        quote.quoteNumber?.toLowerCase().includes(term) ||
        quote.patientInfo?.firstName?.toLowerCase().includes(term) ||
        quote.patientInfo?.lastName?.toLowerCase().includes(term) ||
        quote.basicInfo?.title?.toLowerCase().includes(term) ||
        quote.basicInfo?.description?.toLowerCase().includes(term)
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

      // Gestion spéciale pour les montants
      if (sortBy === 'totalAmount') {
        aValue = a.pricing?.totalAmount || 0;
        bValue = b.pricing?.totalAmount || 0;
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
  }, [quotes, searchTerm, statusFilter, sortBy, sortOrder]);

  /**
   * Statistiques calculées localement
   */
  const localStats = useMemo(() => {
    const totalAmount = quotes.reduce((sum, quote) => sum + (quote.pricing?.totalAmount || 0), 0);
    
    return {
      total: quotes.length,
      filtered: filteredAndSortedQuotes.length,
      byStatus: {
        brouillon: quotes.filter(q => q.status === 'brouillon').length,
        envoye: quotes.filter(q => q.status === 'envoye').length,
        accepte: quotes.filter(q => q.status === 'accepte').length,
        refuse: quotes.filter(q => q.status === 'refuse').length,
        expire: quotes.filter(q => q.status === 'expire').length
      },
      totalAmount,
      averageAmount: quotes.length > 0 ? totalAmount / quotes.length : 0,
      recentlyCreated: quotes.filter(q => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(q.createdAt) > weekAgo;
      }).length
    };
  }, [quotes, filteredAndSortedQuotes]);

  /**
   * Obtenir un devis par ID
   */
  const getQuoteById = useCallback((quoteId) => {
    return quotes.find(q => q.id === quoteId);
  }, [quotes]);

  /**
   * Vérifier si un devis existe
   */
  const quoteExists = useCallback((quoteId) => {
    return quotes.some(q => q.id === quoteId);
  }, [quotes]);

  /**
   * Obtenir les devis d'un patient
   */
  const getQuotesByPatient = useCallback((patientId) => {
    return quotes.filter(q => q.patientId === patientId);
  }, [quotes]);

  /**
   * Rafraîchir les données
   */
  const refresh = useCallback(() => {
    loadQuotes();
  }, [loadQuotes]);

  // Chargement initial
  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  return {
    // Données
    quotes: filteredAndSortedQuotes,
    allQuotes: quotes,
    
    // États
    loading,
    error,
    creating,
    updating,
    deleting,
    generating,
    
    // Filtres et tri
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    
    // Actions CRUD
    createQuote,
    updateQuote,
    deleteQuote,
    refresh,
    
    // Actions spécialisées
    generateQuoteWithAI,
    duplicateQuote,
    changeQuoteStatus,
    
    // Statistiques et export
    getStatistics,
    exportQuotes,
    
    // Utilitaires
    getQuoteById,
    quoteExists,
    getQuotesByPatient,
    localStats,
    
    // Méta-données
    isEmpty: quotes.length === 0,
    hasResults: filteredAndSortedQuotes.length > 0,
    isFiltered: searchTerm.trim().length > 0 || statusFilter !== 'all'
  };
};

export default useQuotesV2;