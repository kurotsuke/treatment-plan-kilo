/**
 * Service des réglages refactorisé avec la nouvelle couche d'abstraction
 * Version 2.0 - Utilise BaseRepository pour éliminer la redondance
 */
import { BaseRepository, BaseSchema, ValidationTypes } from '../../core/firebase';
import Resizer from 'react-image-file-resizer';

// Schéma de validation pour les réglages
const SettingsSchema = new BaseSchema({
  clinicName: ValidationTypes.STRING,
  clinicAddress: ValidationTypes.STRING,
  clinicCurrency: ValidationTypes.STRING,
  clinicLogo: ValidationTypes.STRING,
  geminiApiKey: ValidationTypes.STRING,
  // Validation personnalisée pour la devise
  clinicCurrency: (value) => {
    if (!value) return true; // Optionnel
    const validCurrencies = ['EUR', 'USD', 'MAD', 'CAD', 'GBP'];
    return validCurrencies.includes(value) || 'Devise non supportée';
  }
});

class SettingsServiceV2 extends BaseRepository {
  constructor() {
    super('settings', SettingsSchema);
    console.log('⚙️ SettingsServiceV2 initialisé avec BaseRepository');
  }

  /**
   * Obtenir les réglages d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Les réglages de l'utilisateur
   */
  async getSettings(userId) {
    console.log('⚙️ getSettings V2 pour userId:', userId);
    
    try {
      // Utiliser la méthode héritée de BaseRepository
      const settings = await this.read(userId, userId);
      
      if (settings) {
        console.log('✅ Réglages trouvés V2:', Object.keys(settings));
        return settings;
      } else {
        console.log('❌ Aucun réglage trouvé - retour des réglages par défaut V2');
        return this.getDefaultSettings();
      }
    } catch (error) {
      console.log('❌ Erreur lors de la récupération - retour des réglages par défaut V2');
      return this.getDefaultSettings();
    }
  }

  /**
   * Sauvegarder les réglages d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} settings - Réglages à sauvegarder
   * @returns {Promise<Object>} Les réglages sauvegardés
   */
  async saveSettings(userId, settings) {
    console.log('⚙️ saveSettings V2 pour userId:', userId);
    
    // Traiter le logo s'il est fourni
    let processedSettings = { ...settings };
    
    if (settings.clinicLogo !== undefined) {
      console.log('🖼️ Traitement du logo...');
      try {
        processedSettings.clinicLogo = await this.validateAndProcessLogo(settings.clinicLogo);
        console.log('✅ Logo traité avec succès V2');
      } catch (logoError) {
        console.error('❌ Erreur lors du traitement du logo V2:', logoError);
        throw new Error(`Erreur logo: ${logoError.message}`);
      }
    }
    
    // Vérifier si le document existe déjà
    const existingSettings = await this.read(userId, userId).catch(() => null);
    
    let result;
    if (existingSettings) {
      // Mettre à jour les réglages existants
      result = await this.update(userId, processedSettings, userId);
      result = { ...existingSettings, ...result };
    } else {
      // Créer de nouveaux réglages avec l'ID utilisateur comme ID de document
      const db = this.getCollectionRef().firestore;
      const docRef = this.getCollectionRef().doc(userId);
      
      const settingsData = {
        ...processedSettings,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await docRef.set(settingsData);
      result = settingsData;
      
      // Mettre en cache
      this.cache.set(`${userId}:doc:${userId}`, result);
    }
    
    // Synchroniser avec localStorage pour compatibilité
    this.syncToLocalStorage(result);
    
    console.log('✅ Réglages sauvegardés V2');
    return result;
  }

  /**
   * Écouter les changements des réglages en temps réel
   * @param {string} userId - ID de l'utilisateur
   * @param {Function} callback - Fonction appelée lors des changements
   * @returns {Function} Fonction pour arrêter l'écoute
   */
  subscribeToSettings(userId, callback) {
    console.log('🔥 subscribeToSettings V2 pour userId:', userId);
    
    // Utiliser la méthode héritée avec gestion spéciale pour les réglages
    return this.subscribe(userId, (settingsArray) => {
      // Les réglages sont un document unique, pas un array
      const settings = settingsArray.find(s => s.id === userId) || this.getDefaultSettings();
      
      console.log('🔥 Réglages temps réel V2:', !!settings);
      callback(settings);
    });
  }

  /**
   * Migrer les réglages depuis localStorage vers Firestore
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Les réglages migrés
   */
  async migrateFromLocalStorage(userId) {
    console.log('🔄 Migration depuis localStorage V2');
    
    try {
      // Récupérer les données depuis localStorage
      const localSettings = {
        clinicName: localStorage.getItem('clinicName') || '',
        clinicAddress: localStorage.getItem('clinicAddress') || '',
        clinicCurrency: localStorage.getItem('clinicCurrency') || 'EUR',
        clinicLogo: localStorage.getItem('clinicLogo') || '',
        geminiApiKey: localStorage.getItem('geminiApiKey') || ''
      };

      // Vérifier s'il y a des données à migrer
      const hasDataToMigrate = Object.values(localSettings).some(value => 
        value !== '' && value !== 'EUR'
      );
      
      if (!hasDataToMigrate) {
        console.log('Aucune donnée à migrer depuis localStorage V2');
        return this.getDefaultSettings();
      }

      // Sauvegarder dans Firebase
      const migratedSettings = await this.saveSettings(userId, {
        ...localSettings,
        migratedFromLocalStorage: true,
        migrationDate: new Date()
      });
      
      console.log('✅ Migration réussie depuis localStorage vers Firebase V2');
      return migratedSettings;
      
    } catch (error) {
      console.error('❌ Erreur lors de la migration V2:', error);
      throw new Error(`Impossible de migrer les données: ${error.message}`);
    }
  }

  /**
   * Synchroniser les réglages Firebase vers localStorage (pour compatibilité)
   * @param {Object} settings - Réglages à synchroniser
   */
  syncToLocalStorage(settings) {
    try {
      if (settings.clinicName !== undefined) {
        localStorage.setItem('clinicName', settings.clinicName);
      }
      if (settings.clinicAddress !== undefined) {
        localStorage.setItem('clinicAddress', settings.clinicAddress);
      }
      if (settings.clinicCurrency !== undefined) {
        localStorage.setItem('clinicCurrency', settings.clinicCurrency);
      }
      if (settings.clinicLogo !== undefined) {
        localStorage.setItem('clinicLogo', settings.clinicLogo);
      }
      if (settings.geminiApiKey !== undefined) {
        localStorage.setItem('geminiApiKey', settings.geminiApiKey);
      }
      
      // Déclencher un événement pour notifier les autres composants
      window.dispatchEvent(new Event('storage'));
      
      console.log('✅ Synchronisation localStorage V2 terminée');
    } catch (error) {
      console.warn('⚠️ Erreur lors de la synchronisation vers localStorage V2:', error);
    }
  }

  /**
   * Valider et traiter un logo
   * @param {File|string} logoInput - Fichier image ou string base64
   * @returns {Promise<string>} Logo traité en base64
   */
  async validateAndProcessLogo(logoInput) {
    try {
      // Si c'est déjà une string (base64), la valider
      if (typeof logoInput === 'string') {
        if (logoInput === '') return ''; // Logo vide autorisé
        
        if (!logoInput.startsWith('data:image/')) {
          throw new Error('Format de logo invalide');
        }
        
        // Vérifier la taille
        const sizeInBytes = (logoInput.length * 3) / 4;
        if (sizeInBytes > 100 * 1024) {
          throw new Error('Logo trop volumineux (max 100KB)');
        }
        
        return logoInput;
      }
      
      // Si c'est un fichier, le traiter
      if (logoInput instanceof File) {
        return await this.processLogoImage(logoInput);
      }
      
      throw new Error('Type de logo non supporté');
    } catch (error) {
      console.error('❌ Erreur lors de la validation du logo V2:', error);
      throw error;
    }
  }

  /**
   * Redimensionner et optimiser une image pour le logo
   * @param {File} file - Fichier image à traiter
   * @returns {Promise<string>} Image redimensionnée en base64
   */
  async processLogoImage(file) {
    return new Promise(async (resolve, reject) => {
      try {
        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
          reject(new Error('Le fichier doit être une image'));
          return;
        }

        // Vérifier les dimensions de l'image
        const dimensions = await this.getImageDimensions(file);
        console.log(`📐 Dimensions originales V2: ${dimensions.width}x${dimensions.height}`);

        // Déterminer si un redimensionnement est nécessaire
        const needsResize = dimensions.width > 1000 || dimensions.height > 1000;
        
        // Déterminer le format de sortie
        let outputFormat = 'JPEG';
        let quality = 80;
        
        if (file.type === 'image/png') {
          outputFormat = 'PNG';
          quality = 100;
        } else if (file.type === 'image/webp') {
          outputFormat = 'WEBP';
          quality = 80;
        } else if (file.type === 'image/gif') {
          outputFormat = 'PNG';
          quality = 100;
        }

        console.log(`🖼️ Traitement image V2: ${file.type} → ${outputFormat}`);

        if (!needsResize) {
          // Convertir directement en base64
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64 = e.target.result;
            const sizeInBytes = (base64.length * 3) / 4;
            
            if (sizeInBytes > 100 * 1024) {
              this.resizeImage(file, outputFormat, quality, resolve, reject);
            } else {
              console.log(`✅ Image conservée V2: ${Math.round(sizeInBytes/1024)}KB`);
              resolve(base64);
            }
          };
          reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
          reader.readAsDataURL(file);
        } else {
          this.resizeImage(file, outputFormat, quality, resolve, reject);
        }
      } catch (error) {
        reject(new Error(`Erreur lors du traitement de l'image: ${error.message}`));
      }
    });
  }

  /**
   * Redimensionner une image avec react-image-file-resizer
   * @param {File} file - Fichier à redimensionner
   * @param {string} outputFormat - Format de sortie
   * @param {number} quality - Qualité de compression
   * @param {Function} resolve - Fonction de résolution
   * @param {Function} reject - Fonction de rejet
   */
  resizeImage(file, outputFormat, quality, resolve, reject) {
    Resizer.imageFileResizer(
      file,
      1000, // largeur max
      1000, // hauteur max
      outputFormat,
      quality,
      0, // rotation
      (uri) => {
        const sizeInBytes = (uri.length * 3) / 4;
        if (sizeInBytes > 100 * 1024) {
          reject(new Error('L\'image est trop volumineuse même après compression'));
          return;
        }
        console.log(`✅ Image redimensionnée V2: ${Math.round(sizeInBytes/1024)}KB`);
        resolve(uri);
      },
      'base64'
    );
  }

  /**
   * Vérifier les dimensions d'une image
   * @param {File} file - Fichier image à analyser
   * @returns {Promise<{width: number, height: number}>} Dimensions de l'image
   */
  async getImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Impossible de lire les dimensions de l\'image'));
      };
      
      img.src = url;
    });
  }

  /**
   * Obtenir les réglages par défaut
   * @returns {Object} Réglages par défaut
   */
  getDefaultSettings() {
    return {
      clinicName: '',
      clinicAddress: '',
      clinicCurrency: 'EUR',
      clinicLogo: '',
      geminiApiKey: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      migratedFromLocalStorage: false
    };
  }

  /**
   * Vérifier si les réglages sont configurés
   * @param {Object} settings - Réglages à vérifier
   * @returns {boolean} True si les réglages sont configurés
   */
  isConfigured(settings) {
    return !!(
      settings &&
      (settings.clinicName || settings.clinicAddress || settings.clinicLogo || settings.geminiApiKey)
    );
  }

  /**
   * Obtenir un résumé des réglages pour l'affichage
   * @param {Object} settings - Réglages
   * @returns {Object} Résumé des réglages
   */
  getSettingsSummary(settings) {
    if (!settings) return { configured: false, count: 0 };

    const configuredFields = [
      settings.clinicName,
      settings.clinicAddress,
      settings.clinicLogo,
      settings.geminiApiKey
    ].filter(field => field && field.trim() !== '');

    return {
      configured: configuredFields.length > 0,
      count: configuredFields.length,
      total: 4,
      lastUpdated: settings.updatedAt,
      migratedFromLocalStorage: settings.migratedFromLocalStorage || false
    };
  }

  /**
   * Exporter les réglages au format JSON
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<string>} JSON des réglages
   */
  async exportSettings(userId) {
    console.log('📤 Export réglages V2');
    
    const settings = await this.getSettings(userId);
    
    // Nettoyer les données pour l'export (supprimer les images base64)
    const exportData = {
      clinicName: settings.clinicName,
      clinicAddress: settings.clinicAddress,
      clinicCurrency: settings.clinicCurrency,
      geminiApiKey: settings.geminiApiKey ? '***MASKED***' : '',
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    };
    
    const jsonData = JSON.stringify(exportData, null, 2);
    console.log('✅ Export réglages terminé V2');
    
    return jsonData;
  }

  /**
   * Réinitialiser les réglages aux valeurs par défaut
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Réglages réinitialisés
   */
  async resetSettings(userId) {
    console.log('🔄 Réinitialisation réglages V2');
    
    const defaultSettings = this.getDefaultSettings();
    const result = await this.saveSettings(userId, defaultSettings);
    
    console.log('✅ Réglages réinitialisés V2');
    return result;
  }
}

// Exporter une instance unique du service
export default new SettingsServiceV2();

// Exporter aussi la classe pour les tests
export { SettingsServiceV2 };