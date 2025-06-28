/**
 * Service pour la gestion des réglages utilisateur dans Firestore
 */
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../config/firebase';
import Resizer from 'react-image-file-resizer';

class SettingsService {
  constructor() {
    this.collection = 'settings';
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
        console.log(`📐 Dimensions originales: ${dimensions.width}x${dimensions.height}`);

        // Déterminer si un redimensionnement est nécessaire
        const needsResize = dimensions.width > 1000 || dimensions.height > 1000;
        
        // Déterminer le format de sortie basé sur le type de fichier original
        let outputFormat = 'JPEG'; // Par défaut
        let quality = 80;
        
        if (file.type === 'image/png') {
          outputFormat = 'PNG';
          quality = 100; // PNG ne supporte pas la compression avec qualité
        } else if (file.type === 'image/webp') {
          outputFormat = 'WEBP';
          quality = 80;
        } else if (file.type === 'image/gif') {
          // Pour les GIF, on les convertit en PNG pour préserver la transparence
          outputFormat = 'PNG';
          quality = 100;
        }

        console.log(`🖼️ Traitement image: ${file.type} → ${outputFormat} (qualité: ${quality})`);
        console.log(`🔄 Redimensionnement nécessaire: ${needsResize ? 'Oui' : 'Non'}`);

        if (!needsResize) {
          // Si pas de redimensionnement nécessaire, convertir directement en base64
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64 = e.target.result;
            // Vérifier la taille finale
            const sizeInBytes = (base64.length * 3) / 4;
            if (sizeInBytes > 100 * 1024) { // 100KB max
              // Si trop volumineux, forcer le redimensionnement
              console.log(`⚠️ Image trop volumineuse (${Math.round(sizeInBytes/1024)}KB), redimensionnement forcé`);
              this.resizeImage(file, outputFormat, quality, resolve, reject);
            } else {
              console.log(`✅ Image conservée: ${outputFormat}, taille: ${Math.round(sizeInBytes/1024)}KB`);
              resolve(base64);
            }
          };
          reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
          reader.readAsDataURL(file);
        } else {
          // Redimensionner l'image
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
      1000, // largeur max (augmentée de 200 à 1000)
      1000, // hauteur max (augmentée de 200 à 1000)
      outputFormat, // format de sortie préservé
      quality, // qualité adaptée au format
      0, // rotation
      (uri) => {
        // Vérifier la taille finale
        const sizeInBytes = (uri.length * 3) / 4;
        if (sizeInBytes > 100 * 1024) { // 100KB max
          reject(new Error('L\'image est trop volumineuse même après compression'));
          return;
        }
        console.log(`✅ Image redimensionnée: ${outputFormat}, taille: ${Math.round(sizeInBytes/1024)}KB`);
        resolve(uri);
      },
      'base64' // format de sortie
    );
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
      console.error('Erreur lors de la validation du logo:', error);
      throw error;
    }
  }

  /**
   * Obtenir les réglages d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Les réglages de l'utilisateur
   */
  async getSettings(userId) {
    console.log('🔥 === SERVICE settingsService.getSettings ===');
    console.log('👤 UserId:', userId);
    console.log('📁 Collection:', this.collection);
    
    try {
      console.log('🔗 Obtention de la DB...');
      const db = getDb();
      console.log('✅ DB obtenue:', !!db);
      
      const docRef = doc(db, this.collection, userId);
      console.log('📄 DocRef créé:', docRef.path);
      
      console.log('🔍 Recherche du document...');
      const docSnap = await getDoc(docRef);
      console.log('📄 Document existe:', docSnap.exists());
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('✅ Données trouvées dans Firestore:', data);
        const result = {
          ...data,
          // Convertir les timestamps Firestore en dates JavaScript
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        };
        console.log('📤 Retour avec timestamps convertis:', result);
        return result;
      } else {
        console.log('❌ Aucun document trouvé - retour des réglages par défaut');
        // Retourner les réglages par défaut si aucun document n'existe
        const defaultSettings = this.getDefaultSettings();
        console.log('🔄 Réglages par défaut:', defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des réglages:', error);
      throw new Error(`Impossible de récupérer les réglages: ${error.message}`);
    }
  }

  /**
   * Sauvegarder les réglages d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} settings - Réglages à sauvegarder
   * @returns {Promise<Object>} Les réglages sauvegardés
   */
  async saveSettings(userId, settings) {
    console.log('🔥 === SERVICE settingsService.saveSettings ===');
    console.log('👤 UserId:', userId);
    console.log('📝 Settings:', settings);
    console.log('📁 Collection:', this.collection);
    
    try {
      console.log('🔗 Obtention de la DB...');
      const db = getDb();
      console.log('✅ DB obtenue:', !!db);
      
      const docRef = doc(db, this.collection, userId);
      console.log('📄 DocRef créé:', docRef.path);
      
      // Traiter le logo s'il est fourni
      let processedSettings = { ...settings };
      if (settings.clinicLogo !== undefined) {
        console.log('🖼️ Traitement du logo...');
        try {
          processedSettings.clinicLogo = await this.validateAndProcessLogo(settings.clinicLogo);
          console.log('✅ Logo traité avec succès');
        } catch (logoError) {
          console.error('❌ Erreur lors du traitement du logo:', logoError);
          throw new Error(`Erreur logo: ${logoError.message}`);
        }
      }
      
      // Préparer les données avec timestamps
      const settingsWithTimestamp = {
        ...processedSettings,
        userId: userId,
        updatedAt: serverTimestamp()
      };
      
      console.log('📝 Settings avec timestamp:', settingsWithTimestamp);

      // Ajouter createdAt seulement si c'est un nouveau document
      console.log('🔍 Vérification document existant...');
      const existingDoc = await getDoc(docRef);
      console.log('📄 Document existe:', existingDoc.exists());
      
      if (!existingDoc.exists()) {
        settingsWithTimestamp.createdAt = serverTimestamp();
        console.log('🆕 Nouveau document - ajout createdAt');
      }
      
      console.log('💾 Écriture dans Firestore...');
      await setDoc(docRef, settingsWithTimestamp, { merge: true });
      console.log('✅ Écriture réussie dans Firestore');
      
      // Retourner les données avec les timestamps convertis
      const result = {
        ...settingsWithTimestamp,
        createdAt: settingsWithTimestamp.createdAt || existingDoc.data()?.createdAt?.toDate?.() || new Date(),
        updatedAt: new Date()
      };
      
      console.log('📤 Retour du service:', result);
      console.log('🔥 === FIN SERVICE saveSettings ===');
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des réglages:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      throw new Error(`Impossible de sauvegarder les réglages: ${error.message}`);
    }
  }

  /**
   * Écouter les changements des réglages en temps réel
   * @param {string} userId - ID de l'utilisateur
   * @param {Function} callback - Fonction appelée lors des changements
   * @returns {Function} Fonction pour arrêter l'écoute
   */
  subscribeToSettings(userId, callback) {
    const docRef = doc(getDb(), this.collection, userId);
    
    return onSnapshot(
      docRef, 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const settingsWithDates = {
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date()
          };
          callback(settingsWithDates);
        } else {
          callback(this.getDefaultSettings());
        }
      }, 
      (error) => {
        console.error('Erreur lors de l\'écoute des réglages:', error);
        // En cas d'erreur, retourner les réglages par défaut
        callback(this.getDefaultSettings());
      }
    );
  }

  /**
   * Migrer les réglages depuis localStorage vers Firestore
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Les réglages migrés
   */
  async migrateFromLocalStorage(userId) {
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
      const hasDataToMigrate = Object.values(localSettings).some(value => value !== '' && value !== 'EUR');
      
      if (!hasDataToMigrate) {
        console.log('Aucune donnée à migrer depuis localStorage');
        return this.getDefaultSettings();
      }

      // Sauvegarder dans Firebase
      const migratedSettings = await this.saveSettings(userId, {
        ...localSettings,
        migratedFromLocalStorage: true,
        migrationDate: new Date()
      });
      
      console.log('Migration réussie depuis localStorage vers Firebase');
      return migratedSettings;
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
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
    } catch (error) {
      console.warn('Erreur lors de la synchronisation vers localStorage:', error);
    }
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
}

// Exporter une instance unique du service
export default new SettingsService();