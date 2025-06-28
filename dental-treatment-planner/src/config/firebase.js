/**
 * Configuration Firebase pour Dental Treatment Planner
 * Support de la configuration dynamique via localStorage
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth as createAuth, connectAuthEmulator } from 'firebase/auth';
import firebaseConfigService from '../services/firebaseConfigService';

// Configuration Firebase par défaut (variables d'environnement)
const defaultFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dental-planner-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dental-planner-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dental-planner-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:demo"
};

// Variables pour les services Firebase
let firebaseApp = null;
let firebaseDb = null;
let firebaseAuth = null;

// Fonction pour initialiser Firebase
const initializeFirebaseServices = (config = null) => {
  try {
    const firebaseConfig = config || defaultFirebaseConfig;
    
    console.log('🔥 Initialisation Firebase avec config:', firebaseConfig.projectId);
    
    // Créer l'application Firebase avec un nom fixe
    firebaseApp = initializeApp(firebaseConfig, 'dental-planner-main');
    
    console.log('✅ Application Firebase créée:', firebaseApp.name);
    
    // Initialiser les services
    firebaseDb = getFirestore(firebaseApp);
    firebaseAuth = createAuth(firebaseApp);

    // Configuration pour le développement local (émulateurs)
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      try {
        connectFirestoreEmulator(firebaseDb, 'localhost', 8080);
        connectAuthEmulator(firebaseAuth, 'http://localhost:9099');
        console.log('🔥 Firebase émulateurs connectés');
      } catch (error) {
        console.warn('Émulateurs Firebase déjà connectés ou non disponibles');
      }
    }

    console.log('🔥 Firebase initialisé avec succès');
    return { app: firebaseApp, db: firebaseDb, auth: firebaseAuth };
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de Firebase:', error);
    throw error;
  }
};

// Fonction pour obtenir ou initialiser les services Firebase
const getFirebaseServices = () => {
  // Vérifier si une configuration dynamique existe
  const savedConfig = firebaseConfigService.getCurrentConfig();
  
  if (savedConfig && !firebaseApp) {
    // Utiliser la configuration sauvegardée
    return initializeFirebaseServices(savedConfig);
  } else if (!firebaseApp) {
    // Utiliser la configuration par défaut
    return initializeFirebaseServices();
  }
  
  return { app: firebaseApp, db: firebaseDb, auth: firebaseAuth };
};

// Initialiser Firebase au chargement
try {
  getFirebaseServices();
} catch (error) {
  console.warn('Initialisation Firebase différée:', error.message);
}

// Exporter les services avec getter pour la configuration dynamique
export const getDb = () => {
  console.log('🔥 === getDb() appelé ===');
  console.log('🔍 firebaseDb existe:', !!firebaseDb);
  
  if (!firebaseDb) {
    console.log('🔄 Initialisation des services Firebase...');
    const services = getFirebaseServices();
    console.log('✅ Services obtenus:', !!services.db);
    return services.db;
  }
  
  console.log('✅ Retour firebaseDb existant');
  return firebaseDb;
};

export const getAuth = () => {
  if (!firebaseAuth) {
    const services = getFirebaseServices();
    return services.auth;
  }
  return firebaseAuth;
};

export const getApp = () => {
  if (!firebaseApp) {
    const services = getFirebaseServices();
    return services.app;
  }
  return firebaseApp;
};

// Fonction pour reconfigurer Firebase avec de nouvelles clés
export const reconfigureFirebase = async (newConfig) => {
  try {
    console.log('🔄 Reconfiguration Firebase...');
    
    // Détruire l'instance actuelle
    if (firebaseApp) {
      console.log('🗑️ Suppression de l\'ancienne instance Firebase');
      await firebaseApp.delete();
      firebaseApp = null;
      firebaseDb = null;
      firebaseAuth = null;
    }
    
    // Initialiser avec la nouvelle configuration
    console.log('🆕 Création de la nouvelle instance Firebase');
    const services = initializeFirebaseServices(newConfig);
    
    // Sauvegarder la configuration
    firebaseConfigService.saveConfig(newConfig);
    
    console.log('✅ Reconfiguration Firebase terminée');
    return services;
  } catch (error) {
    console.error('❌ Erreur lors de la reconfiguration Firebase:', error);
    throw error;
  }
};

// Fonction pour vérifier la configuration Firebase
export const isFirebaseConfigured = () => {
  const savedConfig = firebaseConfigService.getCurrentConfig();
  if (savedConfig) {
    return firebaseConfigService.validateConfig(savedConfig);
  }
  
  return !!(
    defaultFirebaseConfig.apiKey && 
    defaultFirebaseConfig.projectId && 
    defaultFirebaseConfig.apiKey !== "demo-api-key"
  );
};

// Fonction pour obtenir les informations de configuration
export const getFirebaseInfo = () => {
  const savedConfig = firebaseConfigService.getCurrentConfig();
  const config = savedConfig || defaultFirebaseConfig;
  
  return {
    projectId: config.projectId,
    authDomain: config.authDomain,
    isConfigured: isFirebaseConfigured(),
    isDevelopment: import.meta.env.DEV,
    useEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true',
    configSource: savedConfig ? 'localStorage' : 'environment'
  };
};

// Fonction pour réinitialiser la configuration
export const resetFirebaseConfig = async () => {
  try {
    // Supprimer la configuration sauvegardée
    firebaseConfigService.clearConfig();
    
    // Détruire l'instance actuelle
    if (firebaseApp) {
      await firebaseApp.delete();
      firebaseApp = null;
      firebaseDb = null;
      firebaseAuth = null;
    }
    
    // Réinitialiser avec la configuration par défaut
    return initializeFirebaseServices();
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    throw error;
  }
};

// Exports par défaut pour la compatibilité
export const db = getDb();
export const auth = getAuth();
export default getApp();