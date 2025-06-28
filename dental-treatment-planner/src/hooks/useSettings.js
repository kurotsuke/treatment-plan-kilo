/**
 * Hook personnalisé pour la gestion des réglages avec Firebase
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import settingsService from '../services/settingsService';

/**
 * Hook pour gérer les réglages utilisateur avec synchronisation Firebase
 */
export const useSettings = () => {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  /**
   * Charger les réglages depuis localStorage immédiatement
   */
  const loadFromLocalStorage = useCallback(() => {
    try {
      console.log('📱 Chargement depuis localStorage...');
      
      const localSettings = {
        clinicName: localStorage.getItem('clinicName') || '',
        clinicAddress: localStorage.getItem('clinicAddress') || '',
        clinicCurrency: localStorage.getItem('clinicCurrency') || 'EUR',
        clinicLogo: localStorage.getItem('clinicLogo') || '',
        geminiApiKey: localStorage.getItem('geminiApiKey') || '',
        lastApiCheck: localStorage.getItem('lastApiCheck') || null,
        geminiConnectionStatus: localStorage.getItem('geminiConnectionStatus') || null
      };
      
      // Vérifier si on a des données en localStorage
      const hasLocalData = Object.values(localSettings).some(value => value && value !== '');
      
      if (hasLocalData) {
        console.log('✅ Données trouvées en localStorage:', localSettings);
        setSettings(localSettings);
        setLoading(false); // Arrêter le loading immédiatement
        return localSettings;
      } else {
        console.log('📱 Pas de données en localStorage');
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur lecture localStorage:', error);
      return null;
    }
  }, []);

  /**
   * Charger les réglages depuis Firebase (synchronisation en arrière-plan)
   */
  const loadSettings = useCallback(async () => {
    if (!user) {
      console.log('❌ loadSettings: Pas d\'utilisateur');
      return;
    }

    try {
      console.log('🔄 loadSettings: Début du chargement Firebase pour', user.uid.substring(0, 8) + '...');
      setSyncing(true);
      setError(null);
      
      const userSettings = await settingsService.getSettings(user.uid);
      console.log('✅ loadSettings: Réglages Firebase chargés:', userSettings);
      setSettings(userSettings);
      setLastSyncTime(new Date());
      
      // Synchroniser vers localStorage pour la prochaine fois
      settingsService.syncToLocalStorage(userSettings);
      
    } catch (error) {
      console.error('❌ loadSettings: Erreur lors du chargement des réglages:', error);
      setError(error.message);
      
      // En cas d'erreur Firebase, utiliser les réglages par défaut seulement si pas de settings
      const currentSettings = settings;
      if (!currentSettings) {
        const defaultSettings = settingsService.getDefaultSettings();
        console.log('🔄 loadSettings: Utilisation des réglages par défaut:', defaultSettings);
        setSettings(defaultSettings);
      }
    } finally {
      setSyncing(false);
    }
  }, [user]); // SUPPRIMÉ settings des dépendances pour éviter la boucle

  /**
   * Sauvegarder les réglages dans Firebase
   */
  const saveSettings = useCallback(async (newSettings) => {
    console.log('🎯 === HOOK useSettings.saveSettings ===');
    console.log('👤 User:', user ? `${user.uid.substring(0, 8)}...` : 'null');
    console.log('📝 New settings:', newSettings);
    console.log('📋 Current settings:', settings);
    
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      throw new Error('Utilisateur non connecté');
    }

    try {
      console.log('🔄 Début synchronisation...');
      setSyncing(true);
      setError(null);
      
      // Fusionner avec les réglages existants
      const updatedSettings = {
        ...settings,
        ...newSettings
      };
      
      console.log('🔀 Settings fusionnés:', updatedSettings);
      console.log('💾 Appel settingsService.saveSettings...');
      
      const savedSettings = await settingsService.saveSettings(user.uid, updatedSettings);
      
      console.log('✅ Réponse du service:', savedSettings);
      
      // Synchroniser vers localStorage
      settingsService.syncToLocalStorage(savedSettings);
      
      setLastSyncTime(new Date());
      
      console.log('🎯 === FIN HOOK saveSettings ===');
      return savedSettings;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des réglages:', error);
      console.error('❌ Error details:', error.message, error.code);
      setError(error.message);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [user, settings]);

  /**
   * Migrer les données depuis localStorage
   */
  const migrateFromLocalStorage = useCallback(async () => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      setSyncing(true);
      setError(null);
      
      const migratedSettings = await settingsService.migrateFromLocalStorage(user.uid);
      setLastSyncTime(new Date());
      
      return migratedSettings;
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
      setError(error.message);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [user]);

  /**
   * Forcer la synchronisation
   */
  const forceSync = useCallback(async () => {
    if (!user) return;
    
    try {
      setSyncing(true);
      setError(null);
      
      // Recharger depuis Firebase
      await loadSettings();
      
    } catch (error) {
      console.error('Erreur lors de la synchronisation forcée:', error);
      setError(error.message);
    } finally {
      setSyncing(false);
    }
  }, [user, loadSettings]);

  /**
   * Réinitialiser les réglages
   */
  const resetSettings = useCallback(async () => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      setSyncing(true);
      setError(null);
      
      const defaultSettings = settingsService.getDefaultSettings();
      const resetSettings = await settingsService.saveSettings(user.uid, defaultSettings);
      
      // Nettoyer localStorage
      localStorage.removeItem('clinicName');
      localStorage.removeItem('clinicAddress');
      localStorage.removeItem('clinicCurrency');
      localStorage.removeItem('clinicLogo');
      localStorage.removeItem('geminiApiKey');
      
      setLastSyncTime(new Date());
      
      return resetSettings;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      setError(error.message);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [user]);

  /**
   * Mettre à jour un réglage spécifique
   */
  const updateSetting = useCallback(async (key, value) => {
    return await saveSettings({ [key]: value });
  }, [saveSettings]);

  // Charger immédiatement depuis localStorage au montage
  useEffect(() => {
    console.log('📱 useEffect initial - chargement localStorage...');
    const localData = loadFromLocalStorage();
    
    if (!localData) {
      // Pas de données locales, utiliser les réglages par défaut
      const defaultSettings = settingsService.getDefaultSettings();
      setSettings(defaultSettings);
      setLoading(false);
    }
  }, [loadFromLocalStorage]);

  // Synchroniser avec Firebase quand l'utilisateur est connecté (UNE SEULE FOIS)
  useEffect(() => {
    console.log('🔄 useEffect Firebase sync - isAuthenticated:', isAuthenticated, 'user:', !!user);
    
    if (isAuthenticated && user) {
      console.log('✅ Utilisateur connecté - synchronisation Firebase...');
      loadSettings(); // Synchronisation en arrière-plan UNE SEULE FOIS
    } else if (!isAuthenticated && !user) {
      console.log('❌ Non authentifié - garder les données locales');
      // Ne pas réinitialiser settings, garder les données localStorage
    } else {
      console.log('⏳ En attente d\'authentification...');
    }
  }, [isAuthenticated, user]); // SUPPRIMÉ loadSettings des dépendances

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!user || !isAuthenticated) {
      console.log('🔥 Pas d\'écoute temps réel - user:', !!user, 'isAuthenticated:', isAuthenticated);
      return;
    }

    console.log('🔥 Démarrage de l\'écoute temps réel des réglages pour:', user.uid.substring(0, 8) + '...');
    
    const unsubscribe = settingsService.subscribeToSettings(
      user.uid,
      (newSettings) => {
        console.log('🔥 Réglages mis à jour en temps réel:', newSettings);
        
        // Éviter les mises à jour inutiles qui causent des boucles
        setSettings(currentSettings => {
          // Comparer les données importantes (sans les timestamps)
          const currentData = currentSettings ? {
            clinicName: currentSettings.clinicName,
            clinicAddress: currentSettings.clinicAddress,
            clinicCurrency: currentSettings.clinicCurrency,
            clinicLogo: currentSettings.clinicLogo,
            geminiApiKey: currentSettings.geminiApiKey
          } : null;
          
          const newData = {
            clinicName: newSettings.clinicName,
            clinicAddress: newSettings.clinicAddress,
            clinicCurrency: newSettings.clinicCurrency,
            clinicLogo: newSettings.clinicLogo,
            geminiApiKey: newSettings.geminiApiKey
          };
          
          // Seulement mettre à jour si les données ont vraiment changé
          if (JSON.stringify(currentData) !== JSON.stringify(newData)) {
            console.log('🔥 Données différentes - mise à jour');
            setLoading(false);
            setError(null);
            setLastSyncTime(new Date());
            
            // Synchroniser vers localStorage
            settingsService.syncToLocalStorage(newSettings);
            
            return newSettings;
          } else {
            console.log('🔥 Données identiques - pas de mise à jour');
            return currentSettings;
          }
        });
      }
    );

    return () => {
      console.log('🔥 Arrêt de l\'écoute temps réel des réglages');
      unsubscribe();
    };
  }, [user, isAuthenticated]);

  /**
   * Obtenir le résumé des réglages
   */
  const getSettingsSummary = useCallback(() => {
    return settingsService.getSettingsSummary(settings);
  }, [settings]);

  /**
   * Vérifier si les réglages sont configurés
   */
  const isConfigured = useCallback(() => {
    return settingsService.isConfigured(settings);
  }, [settings]);

  return {
    // État
    settings,
    loading,
    error,
    syncing,
    lastSyncTime,
    
    // Propriétés calculées
    isReady: !loading && settings !== null && isAuthenticated,
    isConfigured: isConfigured(),
    summary: getSettingsSummary(),
    
    // Actions
    saveSettings,
    updateSetting,
    migrateFromLocalStorage,
    forceSync,
    resetSettings,
    
    // Utilitaires
    clearError: () => setError(null),
    
    // Statut de synchronisation
    syncStatus: {
      syncing,
      lastSync: lastSyncTime,
      hasError: !!error,
      isOnline: isAuthenticated
    }
  };
};

/**
 * Hook pour un réglage spécifique
 */
export const useSetting = (key, defaultValue = '') => {
  const { settings, updateSetting, loading, syncing } = useSettings();
  
  const value = settings?.[key] ?? defaultValue;
  
  const setValue = useCallback(async (newValue) => {
    return await updateSetting(key, newValue);
  }, [key, updateSetting]);
  
  return [value, setValue, { loading, syncing }];
};

/**
 * Hook pour les réglages de la clinique
 */
export const useClinicSettings = () => {
  const { settings, saveSettings, loading, syncing } = useSettings();
  
  const clinicSettings = {
    name: settings?.clinicName || '',
    address: settings?.clinicAddress || '',
    currency: settings?.clinicCurrency || 'EUR',
    logo: settings?.clinicLogo || ''
  };
  
  const updateClinicSettings = useCallback(async (newClinicSettings) => {
    return await saveSettings({
      clinicName: newClinicSettings.name,
      clinicAddress: newClinicSettings.address,
      clinicCurrency: newClinicSettings.currency,
      clinicLogo: newClinicSettings.logo
    });
  }, [saveSettings]);
  
  return {
    clinicSettings,
    updateClinicSettings,
    loading,
    syncing
  };
};

export default useSettings;