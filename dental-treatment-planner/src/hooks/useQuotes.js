/**
 * Hook personnalisé pour la gestion des devis
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import quotesService from '../services/quotesService';

export const useQuotes = (filters = {}) => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les devis
  const loadQuotes = useCallback(async () => {
    console.log('🔍 loadQuotes - État utilisateur:', {
      user: user ? 'connecté' : 'non connecté',
      uid: user?.uid,
      isAnonymous: user?.isAnonymous,
      authLoading,
      isAuthenticated
    });
    
    // Attendre que l'authentification soit complète
    if (authLoading) {
      console.log('⏳ Authentification en cours, attente...');
      return;
    }
    
    if (!user?.uid || !isAuthenticated) {
      console.log('❌ Pas d\'utilisateur connecté, arrêt du chargement');
      setQuotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Petit délai pour s'assurer que l'authentification est stable
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('📋 Tentative de récupération des devis pour userId:', user.uid);
      const data = await quotesService.getQuotes(user.uid, filters);
      console.log('✅ Devis récupérés avec succès:', data.length);
      setQuotes(data);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des devis:', err);
      console.error('❌ Type d\'erreur:', err.constructor.name);
      console.error('❌ Message d\'erreur:', err.message);
      setError(err.message);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, authLoading, isAuthenticated, JSON.stringify(filters)]);

  // Memoiser les filtres pour éviter les re-rendus inutiles
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  // Charger les devis au montage et quand les dépendances changent
  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (authLoading || !user?.uid || !isAuthenticated) {
      console.log('🔥 Pas d\'utilisateur pour l\'écoute temps réel ou auth en cours');
      return;
    }

    console.log('🔥 Mise en place de l\'écoute temps réel des devis pour userId:', user.uid);
    const unsubscribe = quotesService.subscribeToQuotes(user.uid, (updatedQuotes) => {
      console.log('🔥 Devis mis à jour en temps réel:', updatedQuotes.length);
      
      // Éviter les mises à jour inutiles si les données n'ont pas changé
      setQuotes(prevQuotes => {
        if (JSON.stringify(prevQuotes) === JSON.stringify(updatedQuotes)) {
          console.log('🔥 Pas de changement détecté, éviter la mise à jour');
          return prevQuotes;
        }
        return updatedQuotes;
      });
      setLoading(false);
    });

    return () => {
      console.log('🔥 Arrêt de l\'écoute temps réel des devis');
      unsubscribe();
    };
  }, [user?.uid, authLoading, isAuthenticated]);

  // Ajouter un devis
  const addQuote = useCallback(async (quoteData) => {
    if (!user?.uid) {
      throw new Error('Utilisateur non authentifié');
    }

    try {
      setError(null);
      const newQuote = await quotesService.addQuote(user.uid, quoteData);
      console.log('✅ Devis ajouté:', newQuote.id);
      return newQuote;
    } catch (err) {
      console.error('Erreur lors de l\'ajout du devis:', err);
      setError(err.message);
      throw err;
    }
  }, [user?.uid]);

  // Mettre à jour un devis
  const updateQuote = useCallback(async (quoteId, updates) => {
    try {
      setError(null);
      const updatedQuote = await quotesService.updateQuote(quoteId, updates);
      console.log('✅ Devis mis à jour:', quoteId);
      return updatedQuote;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du devis:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Supprimer un devis
  const deleteQuote = useCallback(async (quoteId) => {
    try {
      setError(null);
      await quotesService.deleteQuote(quoteId);
      console.log('✅ Devis supprimé:', quoteId);
    } catch (err) {
      console.error('Erreur lors de la suppression du devis:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Obtenir un devis spécifique
  const getQuote = useCallback(async (quoteId) => {
    try {
      setError(null);
      const quote = await quotesService.getQuote(quoteId);
      return quote;
    } catch (err) {
      console.error('Erreur lors de la récupération du devis:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Dupliquer un devis
  const duplicateQuote = useCallback(async (quoteId) => {
    try {
      setError(null);
      const duplicatedQuote = await quotesService.duplicateQuote(quoteId);
      console.log('✅ Devis dupliqué:', duplicatedQuote.id);
      return duplicatedQuote;
    } catch (err) {
      console.error('Erreur lors de la duplication du devis:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Créer une nouvelle version d'un devis
  const createQuoteVersion = useCallback(async (quoteId) => {
    try {
      setError(null);
      const newVersion = await quotesService.createQuoteVersion(quoteId);
      console.log('✅ Nouvelle version créée:', newVersion.id);
      return newVersion;
    } catch (err) {
      console.error('Erreur lors de la création de version:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Envoyer un devis
  const sendQuote = useCallback(async (quoteId) => {
    try {
      setError(null);
      const sentQuote = await quotesService.sendQuote(quoteId);
      console.log('✅ Devis envoyé:', quoteId);
      return sentQuote;
    } catch (err) {
      console.error('Erreur lors de l\'envoi du devis:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Accepter un devis
  const acceptQuote = useCallback(async (quoteId) => {
    try {
      setError(null);
      const acceptedQuote = await quotesService.acceptQuote(quoteId);
      console.log('✅ Devis accepté:', quoteId);
      return acceptedQuote;
    } catch (err) {
      console.error('Erreur lors de l\'acceptation du devis:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Faire expirer un devis
  const expireQuote = useCallback(async (quoteId) => {
    try {
      setError(null);
      const expiredQuote = await quotesService.expireQuote(quoteId);
      console.log('✅ Devis expiré:', quoteId);
      return expiredQuote;
    } catch (err) {
      console.error('Erreur lors de l\'expiration du devis:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Créer un devis depuis les données Gemini
  const createFromGeminiData = useCallback(async (patientId, geminiData) => {
    if (!user?.uid) {
      throw new Error('Utilisateur non authentifié');
    }

    try {
      setError(null);
      const newQuote = await quotesService.createFromGeminiData(user.uid, patientId, geminiData);
      console.log('✅ Devis créé depuis Gemini:', newQuote.id);
      return newQuote;
    } catch (err) {
      console.error('Erreur lors de la création depuis Gemini:', err);
      setError(err.message);
      throw err;
    }
  }, [user?.uid]);

  return {
    quotes,
    loading,
    error,
    addQuote,
    updateQuote,
    deleteQuote,
    getQuote,
    duplicateQuote,
    createQuoteVersion,
    sendQuote,
    acceptQuote,
    expireQuote,
    createFromGeminiData,
    refreshQuotes: loadQuotes
  };
};

export const useQuote = (quoteId) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!quoteId) {
      setQuote(null);
      setLoading(false);
      return;
    }

    const loadQuote = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await quotesService.getQuote(quoteId);
        setQuote(data);
      } catch (err) {
        console.error('Erreur lors du chargement du devis:', err);
        setError(err.message);
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
  }, [quoteId]);

  return {
    quote,
    loading,
    error
  };
};

export const usePatientQuotes = (patientId) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les devis du patient
  const loadPatientQuotes = useCallback(async () => {
    if (!patientId) {
      setQuotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await quotesService.getQuotesByPatient(patientId);
      setQuotes(data);
    } catch (err) {
      console.error('Erreur lors du chargement des devis du patient:', err);
      setError(err.message);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // Charger les devis au montage
  useEffect(() => {
    loadPatientQuotes();
  }, [loadPatientQuotes]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!patientId) return;

    console.log('🔥 Mise en place de l\'écoute temps réel des devis du patient');
    const unsubscribe = quotesService.subscribeToPatientQuotes(patientId, (updatedQuotes) => {
      console.log('🔥 Devis du patient mis à jour en temps réel:', updatedQuotes.length);
      setQuotes(updatedQuotes);
      setLoading(false);
    });

    return () => {
      console.log('🔥 Arrêt de l\'écoute temps réel des devis du patient');
      unsubscribe();
    };
  }, [patientId]);

  return {
    quotes,
    loading,
    error,
    refreshQuotes: loadPatientQuotes
  };
};

export default useQuotes;