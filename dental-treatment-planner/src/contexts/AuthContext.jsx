/**
 * Contexte d'authentification Firebase pour Dental Treatment Planner
 * Phase 1: Authentification anonyme uniquement
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInAnonymously, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { getAuth } from '../config/firebase';

const AuthContext = createContext();

/**
 * Hook pour utiliser le contexte d'authentification
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

/**
 * Provider du contexte d'authentification
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  /**
   * Connexion anonyme
   */
  const signInAnonymous = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔥 Tentative de connexion anonyme Firebase...');
      const result = await signInAnonymously(getAuth());
      
      console.log('✅ Connexion anonyme réussie:', result.user.uid);
      return result.user;
    } catch (error) {
      console.error('❌ Erreur de connexion anonyme:', error);
      setError(`Erreur de connexion: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déconnexion
   */
  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(getAuth());
      console.log('🔥 Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur de déconnexion:', error);
      setError(`Erreur de déconnexion: ${error.message}`);
      throw error;
    }
  };

  /**
   * Réessayer la connexion
   */
  const retryConnection = async () => {
    if (connectionAttempts < 3) {
      setConnectionAttempts(prev => prev + 1);
      try {
        await signInAnonymous();
      } catch (error) {
        console.error('Échec de la reconnexion:', error);
      }
    }
  };

  /**
   * Réinitialiser les erreurs
   */
  const clearError = () => {
    setError(null);
    setConnectionAttempts(0);
  };

  // Écouter les changements d'authentification
  useEffect(() => {
    console.log('🔥 Initialisation du listener d\'authentification Firebase...');
    
    const unsubscribe = onAuthStateChanged(
      getAuth(),
      (user) => {
        console.log('🔥 État d\'authentification changé:', user ? `Connecté (${user.uid})` : 'Déconnecté');
        setUser(user);
        setLoading(false);
        
        if (user) {
          setError(null);
          setConnectionAttempts(0);
        }
      },
      (error) => {
        console.error('❌ Erreur du listener d\'authentification:', error);
        setError(`Erreur d'authentification: ${error.message}`);
        setLoading(false);
      }
    );

    return () => {
      console.log('🔥 Nettoyage du listener d\'authentification');
      unsubscribe();
    };
  }, []);

  // Connexion automatique anonyme si pas d'utilisateur
  useEffect(() => {
    if (!loading && !user && !error && connectionAttempts < 3) {
      console.log('🔥 Tentative de connexion automatique anonyme...');
      signInAnonymous().catch((error) => {
        console.error('Échec de la connexion automatique:', error);
      });
    }
  }, [loading, user, error, connectionAttempts]);

  /**
   * Obtenir les informations de l'utilisateur
   */
  const getUserInfo = () => {
    if (!user) return null;
    
    return {
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      creationTime: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime,
      displayName: user.displayName || 'Utilisateur Anonyme',
      email: user.email || null
    };
  };

  /**
   * Vérifier si Firebase est disponible
   */
  const isFirebaseAvailable = () => {
    try {
      const authInstance = getAuth();
      return !!authInstance && !!authInstance.app;
    } catch (error) {
      return false;
    }
  };

  const value = {
    // État
    user,
    loading,
    error,
    connectionAttempts,
    
    // Propriétés calculées
    isAuthenticated: !!user,
    isAnonymous: user?.isAnonymous || false,
    userId: user?.uid || null,
    
    // Actions
    signInAnonymous,
    signOut,
    retryConnection,
    clearError,
    
    // Utilitaires
    getUserInfo,
    isFirebaseAvailable,
    
    // Statut de connexion
    connectionStatus: {
      connected: !!user,
      loading,
      error: !!error,
      attempts: connectionAttempts,
      canRetry: connectionAttempts < 3
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * HOC pour protéger les composants nécessitant une authentification
 */
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Connexion à Firebase...</span>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-red-600 mb-2">❌ Non connecté à Firebase</div>
            <div className="text-sm text-gray-500">Veuillez vérifier votre configuration Firebase</div>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

export default AuthContext;