/**
 * Hook Firebase optimisé pour réduire les appels redondants
 * Remplace les hooks individuels par un système unifié et optimisé
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import optimizationManager from '../core/firebase/OptimizationManager';

// Services existants (à optimiser progressivement)
import doctorsService from '../services/doctorsService';
import quotesService from '../services/quotesService';
import settingsService from '../services/settingsService';
import treatmentPlansService from '../services/treatmentPlansService';

/**
 * Hook Firebase optimisé avec gestion intelligente des appels
 */
export const useOptimizedFirebase = (collections = []) => {
  const { user, isAuthenticated, authLoading } = useAuth();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  
  // Refs pour éviter les re-renders inutiles
  const listenersRef = useRef(new Map());
  const lastAuthStateRef = useRef(null);
  const mountedRef = useRef(true);

  // Memoization de l'userId pour éviter les changements inutiles
  const userId = useMemo(() => {
    return user?.uid || null;
  }, [user?.uid]);

  // Memoization des collections demandées
  const collectionsToLoad = useMemo(() => {
    return Array.isArray(collections) ? collections : [collections];
  }, [collections]);

  /**
   * Fonction optimisée pour charger les données d'une collection
   */
  const loadCollectionData = useCallback(async (collection, forceReload = false) => {
    if (!userId || !isAuthenticated || authLoading) {
      console.log(`⏸️ Chargement ${collection} suspendu - Auth:`, { userId, isAuthenticated, authLoading });
      return;
    }

    // Vérifier le cache des requêtes pour éviter les appels redondants
    const queryKey = `${collection}-${userId}`;
    if (!forceReload) {
      const cachedData = optimizationManager.getCachedQuery(queryKey);
      if (cachedData) {
        setData(prev => ({ ...prev, [collection]: cachedData }));
        return;
      }
    }

    // Éviter les appels multiples simultanés
    if (loading[collection]) {
      console.log(`⏸️ Chargement ${collection} déjà en cours, ignoré`);
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [collection]: true }));
      setErrors(prev => ({ ...prev, [collection]: null }));

      let result = [];
      
      // Appeler le service approprié
      switch (collection) {
        case 'doctors':
          result = await doctorsService.getDoctors(userId);
          break;
        case 'quotes':
          result = await quotesService.getQuotes(userId);
          break;
        case 'treatmentPlans':
          result = await treatmentPlansService.getTreatmentPlans(userId);
          break;
        case 'settings':
          result = await settingsService.getSettings(userId);
          break;
        default:
          console.warn(`Collection ${collection} non supportée`);
          return;
      }

      if (mountedRef.current) {
        setData(prev => ({ ...prev, [collection]: result }));
        optimizationManager.setCachedQuery(queryKey, result);
        console.log(`✅ ${collection} chargé avec optimisation:`, result?.length || 'N/A');
      }

    } catch (error) {
      console.error(`❌ Erreur chargement ${collection}:`, error);
      if (mountedRef.current) {
        setErrors(prev => ({ ...prev, [collection]: error.message }));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(prev => ({ ...prev, [collection]: false }));
      }
    }
  }, [userId, isAuthenticated, authLoading, loading]);

  /**
   * Fonction optimisée pour configurer les listeners temps réel
   */
  const setupRealtimeListener = useCallback((collection) => {
    if (!userId || !isAuthenticated) {
      return;
    }

    // Vérifier si un listener est déjà actif
    if (optimizationManager.isListenerActive(collection, userId)) {
      console.log(`♻️ Listener ${collection} déjà actif, réutilisation`);
      return;
    }

    let unsubscribe = null;

    try {
      // Configurer le listener approprié
      switch (collection) {
        case 'doctors':
          unsubscribe = doctorsService.subscribeToDoctors(userId, (doctors) => {
            if (mountedRef.current) {
              setData(prev => ({ ...prev, doctors }));
              optimizationManager.setCachedQuery(`doctors-${userId}`, doctors);
              console.log(`🔄 Doctors temps réel optimisé:`, doctors.length);
            }
          });
          break;
          
        case 'quotes':
          unsubscribe = quotesService.subscribeToQuotes(userId, (quotes) => {
            if (mountedRef.current) {
              setData(prev => ({ ...prev, quotes }));
              optimizationManager.setCachedQuery(`quotes-${userId}`, quotes);
              console.log(`🔄 Quotes temps réel optimisé:`, quotes.length);
            }
          });
          break;
          
        case 'settings':
          // Settings n'a généralement pas besoin de listener temps réel
          break;
          
        default:
          console.warn(`Listener temps réel non supporté pour ${collection}`);
          return;
      }

      if (unsubscribe) {
        // Enregistrer le listener pour éviter les doublons
        optimizationManager.registerListener(collection, userId, {}, unsubscribe);
        listenersRef.current.set(collection, unsubscribe);
        console.log(`🎧 Listener ${collection} configuré avec optimisation`);
      }

    } catch (error) {
      console.error(`❌ Erreur configuration listener ${collection}:`, error);
    }
  }, [userId, isAuthenticated]);

  /**
   * Nettoyer les listeners d'une collection
   */
  const cleanupListener = useCallback((collection) => {
    if (listenersRef.current.has(collection)) {
      const unsubscribe = listenersRef.current.get(collection);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      listenersRef.current.delete(collection);
      optimizationManager.unregisterListener(collection, userId);
      console.log(`🔇 Listener ${collection} nettoyé`);
    }
  }, [userId]);

  /**
   * Effet principal optimisé avec debouncing
   */
  useEffect(() => {
    // Éviter les appels multiples pendant l'initialisation de l'auth
    if (authLoading) {
      console.log('⏸️ Auth en cours, attente...');
      return;
    }

    // Vérifier si l'état d'auth a vraiment changé
    const currentAuthState = { userId, isAuthenticated };
    const lastAuthState = lastAuthStateRef.current;
    
    if (lastAuthState && 
        lastAuthState.userId === currentAuthState.userId && 
        lastAuthState.isAuthenticated === currentAuthState.isAuthenticated) {
      console.log('⏸️ État auth inchangé, pas de rechargement');
      return;
    }

    lastAuthStateRef.current = currentAuthState;

    if (!isAuthenticated || !userId) {
      console.log('🔒 Non authentifié, nettoyage des données');
      setData({});
      setLoading({});
      setErrors({});
      
      // Nettoyer tous les listeners
      collectionsToLoad.forEach(cleanupListener);
      return;
    }

    console.log('🚀 Chargement optimisé des collections:', collectionsToLoad);

    // Debouncer le chargement pour éviter les appels multiples rapides
    optimizationManager.debounceAuthCall(
      'useOptimizedFirebase',
      userId,
      () => {
        // Charger les données et configurer les listeners
        collectionsToLoad.forEach(collection => {
          loadCollectionData(collection);
          setupRealtimeListener(collection);
        });
      },
      500 // Délai de 500ms pour éviter les appels multiples
    );

  }, [userId, isAuthenticated, authLoading, collectionsToLoad, loadCollectionData, setupRealtimeListener, cleanupListener]);

  /**
   * Nettoyage au démontage
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      // Nettoyer tous les listeners
      for (const [collection, unsubscribe] of listenersRef.current) {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
        optimizationManager.unregisterListener(collection, userId);
      }
      listenersRef.current.clear();
      
      console.log('🧹 useOptimizedFirebase nettoyé');
    };
  }, [userId]);

  /**
   * Fonction de rafraîchissement optimisée
   */
  const refresh = useCallback((collection = null) => {
    if (collection) {
      loadCollectionData(collection, true);
    } else {
      collectionsToLoad.forEach(col => loadCollectionData(col, true));
    }
  }, [collectionsToLoad, loadCollectionData]);

  /**
   * Statistiques d'optimisation
   */
  const getOptimizationStats = useCallback(() => {
    return optimizationManager.getStats();
  }, []);

  // Calculer les états globaux
  const isLoading = useMemo(() => {
    return Object.values(loading).some(Boolean);
  }, [loading]);

  const hasErrors = useMemo(() => {
    return Object.values(errors).some(Boolean);
  }, [errors]);

  const allErrors = useMemo(() => {
    return Object.entries(errors)
      .filter(([, error]) => error)
      .reduce((acc, [collection, error]) => {
        acc[collection] = error;
        return acc;
      }, {});
  }, [errors]);

  return {
    // Données
    data,
    
    // États par collection
    loading,
    errors,
    
    // États globaux
    isLoading,
    hasErrors,
    allErrors,
    
    // Actions
    refresh,
    
    // Utilitaires
    getOptimizationStats,
    
    // Méta-données
    userId,
    isAuthenticated,
    collectionsLoaded: Object.keys(data),
    
    // Accès direct aux données (pour compatibilité)
    doctors: data.doctors || [],
    quotes: data.quotes || [],
    treatmentPlans: data.treatmentPlans || [],
    settings: data.settings || null
  };
};

export default useOptimizedFirebase;