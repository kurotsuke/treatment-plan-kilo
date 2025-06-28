import { useState, useEffect, useCallback, useMemo } from 'react';
import settingsServiceV2 from '../services/v2/settingsService.js';

/**
 * Hook React pour la gestion des paramètres avec la nouvelle architecture Firebase V2
 * Fournit une interface réactive pour toutes les opérations de configuration
 */
export const useSettingsV2 = (userId) => {
  // États principaux
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour les opérations
  const [updating, setUpdating] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  /**
   * Charger les paramètres
   */
  const loadSettings = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement paramètres V2...');
      
      const settingsData = await settingsServiceV2.getSettings(userId);
      setSettings(settingsData);
      
      console.log('✅ Paramètres chargés V2:', settingsData ? 'trouvés' : 'défaut');
    } catch (err) {
      console.error('❌ Erreur chargement paramètres V2:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Mettre à jour les paramètres
   */
  const updateSettings = useCallback(async (updates) => {
    try {
      setUpdating(true);
      setError(null);
      console.log('📝 Mise à jour paramètres V2...');
      
      const updatedSettings = await settingsServiceV2.updateSettings(userId, updates);
      setSettings(updatedSettings);
      
      console.log('✅ Paramètres mis à jour V2');
      return updatedSettings;
    } catch (err) {
      console.error('❌ Erreur mise à jour paramètres V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [userId]);

  /**
   * Mettre à jour les informations du cabinet
   */
  const updateClinicInfo = useCallback(async (clinicInfo) => {
    return updateSettings({ clinicInfo });
  }, [updateSettings]);

  /**
   * Mettre à jour les informations du docteur
   */
  const updateDoctorInfo = useCallback(async (doctorInfo) => {
    return updateSettings({ doctorInfo });
  }, [updateSettings]);

  /**
   * Mettre à jour les préférences d'affichage
   */
  const updateDisplayPreferences = useCallback(async (displayPreferences) => {
    return updateSettings({ displayPreferences });
  }, [updateSettings]);

  /**
   * Mettre à jour les préférences de notification
   */
  const updateNotificationPreferences = useCallback(async (notificationPreferences) => {
    return updateSettings({ notificationPreferences });
  }, [updateSettings]);

  /**
   * Mettre à jour les paramètres de facturation
   */
  const updateBillingSettings = useCallback(async (billingSettings) => {
    return updateSettings({ billingSettings });
  }, [updateSettings]);

  /**
   * Mettre à jour les paramètres de sécurité
   */
  const updateSecuritySettings = useCallback(async (securitySettings) => {
    return updateSettings({ securitySettings });
  }, [updateSettings]);

  /**
   * Uploader le logo du cabinet
   */
  const uploadLogo = useCallback(async (logoFile) => {
    try {
      setUploadingLogo(true);
      setError(null);
      console.log('📤 Upload logo V2...');
      
      const logoUrl = await settingsServiceV2.uploadLogo(userId, logoFile);
      
      // Mettre à jour les paramètres avec la nouvelle URL du logo
      const updatedSettings = await updateSettings({
        clinicInfo: {
          ...settings?.clinicInfo,
          logoUrl
        }
      });
      
      console.log('✅ Logo uploadé V2:', logoUrl);
      return logoUrl;
    } catch (err) {
      console.error('❌ Erreur upload logo V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setUploadingLogo(false);
    }
  }, [userId, settings, updateSettings]);

  /**
   * Uploader la signature du docteur
   */
  const uploadSignature = useCallback(async (signatureFile) => {
    try {
      setUploadingSignature(true);
      setError(null);
      console.log('📤 Upload signature V2...');
      
      const signatureUrl = await settingsServiceV2.uploadSignature(userId, signatureFile);
      
      // Mettre à jour les paramètres avec la nouvelle URL de signature
      const updatedSettings = await updateSettings({
        doctorInfo: {
          ...settings?.doctorInfo,
          signatureUrl
        }
      });
      
      console.log('✅ Signature uploadée V2:', signatureUrl);
      return signatureUrl;
    } catch (err) {
      console.error('❌ Erreur upload signature V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setUploadingSignature(false);
    }
  }, [userId, settings, updateSettings]);

  /**
   * Réinitialiser les paramètres aux valeurs par défaut
   */
  const resetToDefaults = useCallback(async () => {
    try {
      setUpdating(true);
      setError(null);
      console.log('🔄 Réinitialisation paramètres V2...');
      
      const defaultSettings = await settingsServiceV2.resetToDefaults(userId);
      setSettings(defaultSettings);
      
      console.log('✅ Paramètres réinitialisés V2');
      return defaultSettings;
    } catch (err) {
      console.error('❌ Erreur réinitialisation V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [userId]);

  /**
   * Exporter les paramètres
   */
  const exportSettings = useCallback(async () => {
    if (!userId) return null;

    try {
      console.log('📤 Export paramètres V2...');
      const exportData = await settingsServiceV2.exportSettings(userId);
      console.log('✅ Export terminé V2');
      return exportData;
    } catch (err) {
      console.error('❌ Erreur export paramètres V2:', err);
      throw err;
    }
  }, [userId]);

  /**
   * Importer les paramètres
   */
  const importSettings = useCallback(async (settingsData) => {
    try {
      setUpdating(true);
      setError(null);
      console.log('📥 Import paramètres V2...');
      
      const importedSettings = await settingsServiceV2.importSettings(userId, settingsData);
      setSettings(importedSettings);
      
      console.log('✅ Paramètres importés V2');
      return importedSettings;
    } catch (err) {
      console.error('❌ Erreur import paramètres V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [userId]);

  /**
   * Paramètres avec valeurs par défaut
   */
  const settingsWithDefaults = useMemo(() => {
    if (!settings) return null;

    return {
      clinicInfo: {
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        logoUrl: '',
        ...settings.clinicInfo
      },
      doctorInfo: {
        firstName: '',
        lastName: '',
        title: 'Dr.',
        specialization: '',
        licenseNumber: '',
        phone: '',
        email: '',
        signatureUrl: '',
        ...settings.doctorInfo
      },
      displayPreferences: {
        theme: 'light',
        language: 'fr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        currency: 'MAD',
        timezone: 'Africa/Casablanca',
        ...settings.displayPreferences
      },
      notificationPreferences: {
        emailNotifications: true,
        smsNotifications: false,
        appointmentReminders: true,
        paymentReminders: true,
        systemUpdates: true,
        ...settings.notificationPreferences
      },
      billingSettings: {
        defaultTaxRate: 20,
        invoicePrefix: 'INV',
        quotePrefix: 'DEV',
        paymentTerms: 30,
        defaultPaymentMethod: 'cash',
        ...settings.billingSettings
      },
      securitySettings: {
        sessionTimeout: 30,
        requirePasswordChange: false,
        twoFactorAuth: false,
        loginAttempts: 5,
        ...settings.securitySettings
      },
      ...settings
    };
  }, [settings]);

  /**
   * Vérifier si les paramètres sont configurés
   */
  const isConfigured = useMemo(() => {
    if (!settings) return false;
    
    const hasClinicInfo = settings.clinicInfo?.name && settings.clinicInfo?.address;
    const hasDoctorInfo = settings.doctorInfo?.firstName && settings.doctorInfo?.lastName;
    
    return hasClinicInfo && hasDoctorInfo;
  }, [settings]);

  /**
   * Obtenir une valeur de paramètre spécifique
   */
  const getSetting = useCallback((path) => {
    if (!settingsWithDefaults) return null;
    
    const keys = path.split('.');
    let value = settingsWithDefaults;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return null;
    }
    
    return value;
  }, [settingsWithDefaults]);

  /**
   * Rafraîchir les données
   */
  const refresh = useCallback(() => {
    loadSettings();
  }, [loadSettings]);

  // Chargement initial
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    // Données
    settings: settingsWithDefaults,
    rawSettings: settings,
    
    // États
    loading,
    error,
    updating,
    uploadingLogo,
    uploadingSignature,
    
    // Actions principales
    updateSettings,
    refresh,
    
    // Actions spécialisées
    updateClinicInfo,
    updateDoctorInfo,
    updateDisplayPreferences,
    updateNotificationPreferences,
    updateBillingSettings,
    updateSecuritySettings,
    
    // Upload d'images
    uploadLogo,
    uploadSignature,
    
    // Import/Export
    exportSettings,
    importSettings,
    resetToDefaults,
    
    // Utilitaires
    getSetting,
    isConfigured,
    
    // Méta-données
    hasSettings: settings !== null,
    isEmpty: !settings
  };
};

export default useSettingsV2;