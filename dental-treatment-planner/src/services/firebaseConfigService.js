/**
 * Service pour la gestion dynamique de la configuration Firebase
 */
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth as createAuth } from 'firebase/auth';

class FirebaseConfigService {
  constructor() {
    this.currentConfig = null;
    this.currentApp = null;
    this.currentDb = null;
    this.currentAuth = null;
    this.isConfigured = false;
  }

  /**
   * Obtenir la configuration actuelle depuis localStorage
   */
  getCurrentConfig() {
    try {
      const config = localStorage.getItem('firebaseConfig');
      return config ? JSON.parse(config) : null;
    } catch (error) {
      console.error('Erreur lors de la lecture de la configuration Firebase:', error);
      return null;
    }
  }

  /**
   * Sauvegarder la configuration Firebase dans localStorage
   */
  saveConfig(config) {
    try {
      // Valider la configuration
      if (!this.validateConfig(config)) {
        throw new Error('Configuration Firebase invalide');
      }

      // Sauvegarder dans localStorage
      localStorage.setItem('firebaseConfig', JSON.stringify(config));
      
      // Marquer comme configuré
      localStorage.setItem('firebaseConfigured', 'true');
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      throw error;
    }
  }

  /**
   * Supprimer la configuration Firebase
   */
  clearConfig() {
    try {
      localStorage.removeItem('firebaseConfig');
      localStorage.removeItem('firebaseConfigured');
      
      // Réinitialiser l'état
      this.currentConfig = null;
      this.currentApp = null;
      this.currentDb = null;
      this.currentAuth = null;
      this.isConfigured = false;
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la configuration:', error);
      return false;
    }
  }

  /**
   * Valider une configuration Firebase
   */
  validateConfig(config) {
    const requiredFields = [
      'apiKey',
      'authDomain',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId'
    ];

    return requiredFields.every(field => 
      config[field] && 
      typeof config[field] === 'string' && 
      config[field].trim() !== ''
    );
  }

  /**
   * Initialiser Firebase avec la configuration fournie
   */
  async initializeFirebase(config) {
    try {
      // Valider la configuration
      if (!this.validateConfig(config)) {
        throw new Error('Configuration Firebase invalide');
      }

      // Détruire l'instance précédente si elle existe
      if (this.currentApp) {
        try {
          await this.currentApp.delete();
        } catch (error) {
          console.warn('Erreur lors de la suppression de l\'ancienne instance Firebase:', error);
        }
      }

      // Créer une nouvelle instance Firebase
      this.currentApp = initializeApp(config, `dental-planner-${Date.now()}`);
      this.currentDb = getFirestore(this.currentApp);
      this.currentAuth = createAuth(this.currentApp);
      
      // Sauvegarder la configuration
      this.currentConfig = config;
      this.isConfigured = true;
      
      // Sauvegarder dans localStorage
      this.saveConfig(config);
      
      console.log('🔥 Firebase initialisé avec succès');
      return {
        app: this.currentApp,
        db: this.currentDb,
        auth: this.currentAuth
      };
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Firebase:', error);
      this.isConfigured = false;
      throw error;
    }
  }

  /**
   * Tester la connexion Firebase
   */
  async testConnection(config) {
    try {
      // Initialiser temporairement Firebase pour le test
      const testApp = initializeApp(config, `test-${Date.now()}`);
      const testAuth = createAuth(testApp);
      
      // Tenter une connexion anonyme pour tester
      const { signInAnonymously } = await import('firebase/auth');
      const result = await signInAnonymously(testAuth);
      
      // Nettoyer l'instance de test
      await testApp.delete();
      
      return {
        success: true,
        userId: result.user.uid
      };
    } catch (error) {
      console.error('Test de connexion échoué:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtenir les services Firebase actuels
   */
  getServices() {
    if (!this.isConfigured) {
      throw new Error('Firebase n\'est pas configuré');
    }
    
    return {
      app: this.currentApp,
      db: this.currentDb,
      auth: this.currentAuth
    };
  }

  /**
   * Vérifier si Firebase est configuré
   */
  isFirebaseConfigured() {
    return this.isConfigured || localStorage.getItem('firebaseConfigured') === 'true';
  }

  /**
   * Charger la configuration au démarrage
   */
  async loadSavedConfig() {
    try {
      const savedConfig = this.getCurrentConfig();
      if (savedConfig && this.validateConfig(savedConfig)) {
        await this.initializeFirebase(savedConfig);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration sauvegardée:', error);
      return false;
    }
  }

  /**
   * Obtenir un template de configuration
   */
  getConfigTemplate() {
    return {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    };
  }

  /**
   * Extraire la configuration depuis une chaîne de configuration Firebase
   */
  parseFirebaseConfigString(configString) {
    try {
      // Nettoyer la chaîne (supprimer les espaces, retours à la ligne, etc.)
      const cleanString = configString.trim();
      
      // Tenter de parser comme JSON
      if (cleanString.startsWith('{')) {
        return JSON.parse(cleanString);
      }
      
      // Tenter d'extraire depuis un objet JavaScript
      const match = cleanString.match(/const\s+firebaseConfig\s*=\s*({[\s\S]*?});?/);
      if (match) {
        return JSON.parse(match[1]);
      }
      
      throw new Error('Format de configuration non reconnu');
    } catch (error) {
      console.error('Erreur lors du parsing de la configuration:', error);
      throw new Error('Format de configuration invalide');
    }
  }
}

// Exporter une instance unique
export default new FirebaseConfigService();