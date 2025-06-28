/**
 * Hook personnalisé pour la gestion des médecins avec la nouvelle architecture
 * Version 2.0 - Utilise le DoctorsServiceV2 avec BaseRepository
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import doctorsServiceV2 from '../../services/v2/doctorsService';

/**
 * Hook pour gérer les médecins avec la nouvelle couche d'abstraction
 */
export const useDoctorsV2 = () => {
  const { user, isAuthenticated } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  /**
   * Charger les médecins depuis Firebase
   */
  const loadDoctors = useCallback(async () => {
    if (!user) {
      console.log('🔍 [DEBUG] loadDoctorsV2: Pas d\'utilisateur');
      return;
    }

    try {
      console.log('🔍 [DEBUG] loadDoctorsV2: Début du chargement pour', user.uid.substring(0, 8) + '...');
      setLoading(true);
      setError(null);
      
      // Utiliser le nouveau service avec gestion d'erreurs intégrée
      const userDoctors = await doctorsServiceV2.getDoctors(user.uid);
      
      console.log('🔍 [DEBUG] loadDoctorsV2: Médecins chargés:', userDoctors.length);
      setDoctors(userDoctors);
      
    } catch (error) {
      console.error('🔍 [DEBUG] loadDoctorsV2: Erreur:', error);
      
      // Le nouveau service fournit des erreurs conviviales
      setError(error.isUserFriendly ? error.message : 'Erreur lors du chargement des médecins');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Ajouter un nouveau médecin
   */
  const addDoctor = useCallback(async (doctorData) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      setSyncing(true);
      setError(null);
      
      // Le nouveau service gère automatiquement la validation
      const newDoctor = await doctorsServiceV2.addDoctor(user.uid, doctorData);
      
      console.log('✅ Médecin ajouté V2:', newDoctor.id);
      
      // Pas besoin de mettre à jour manuellement l'état,
      // le listener temps réel s'en charge
      return newDoctor;
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du médecin V2:', error);
      setError(error.isUserFriendly ? error.message : 'Erreur lors de l\'ajout du médecin');
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [user]);

  /**
   * Mettre à jour un médecin
   */
  const updateDoctor = useCallback(async (doctorId, updates) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      setSyncing(true);
      setError(null);
      
      // Le nouveau service gère automatiquement la validation partielle
      const updatedDoctor = await doctorsServiceV2.updateDoctor(doctorId, updates, user.uid);
      
      console.log('✅ Médecin mis à jour V2:', updatedDoctor.id);
      
      // Le cache et les listeners temps réel gèrent la synchronisation
      return updatedDoctor;
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du médecin V2:', error);
      setError(error.isUserFriendly ? error.message : 'Erreur lors de la mise à jour du médecin');
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [user]);

  /**
   * Supprimer un médecin
   */
  const deleteDoctor = useCallback(async (doctorId) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      setSyncing(true);
      setError(null);
      
      await doctorsServiceV2.deleteDoctor(doctorId, user.uid);
      
      console.log('✅ Médecin supprimé V2:', doctorId);
      
      // Le cache et les listeners temps réel gèrent la synchronisation
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du médecin V2:', error);
      setError(error.isUserFriendly ? error.message : 'Erreur lors de la suppression du médecin');
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [user]);

  /**
   * Rechercher des médecins
   */
  const searchDoctors = useCallback(async (searchTerm) => {
    if (!user) {
      return [];
    }

    try {
      const results = await doctorsServiceV2.searchDoctors(user.uid, searchTerm);
      console.log('🔍 Recherche médecins V2:', results.length, 'résultats');
      return results;
    } catch (error) {
      console.error('❌ Erreur lors de la recherche V2:', error);
      return [];
    }
  }, [user]);

  /**
   * Obtenir les médecins par phase
   */
  const getDoctorsByPhase = useCallback(async (phase) => {
    if (!user) {
      return [];
    }

    try {
      const results = await doctorsServiceV2.getDoctorsByPhase(user.uid, phase);
      console.log('🔍 Médecins phase', phase, 'V2:', results.length);
      return results;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération par phase V2:', error);
      return [];
    }
  }, [user]);

  /**
   * Obtenir les statistiques des médecins
   */
  const getDoctorsStats = useCallback(async () => {
    if (!user) {
      return null;
    }

    try {
      const stats = await doctorsServiceV2.getDoctorsStats(user.uid);
      console.log('📊 Statistiques médecins V2:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Erreur lors du calcul des statistiques V2:', error);
      return null;
    }
  }, [user]);

  /**
   * Exporter les médecins
   */
  const exportDoctors = useCallback(async () => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const jsonData = await doctorsServiceV2.exportDoctors(user.uid);
      console.log('📤 Export médecins V2 terminé');
      return jsonData;
    } catch (error) {
      console.error('❌ Erreur lors de l\'export V2:', error);
      throw error;
    }
  }, [user]);

  /**
   * Obtenir les phases de traitement disponibles
   */
  const getTreatmentPhases = useCallback(() => {
    return doctorsServiceV2.getTreatmentPhases();
  }, []);

  /**
   * Valider les données d'un médecin
   */
  const validateDoctor = useCallback((doctorData) => {
    return doctorsServiceV2.validateDoctor(doctorData);
  }, []);

  // Charger les médecins au montage et quand l'utilisateur change
  useEffect(() => {
    console.log('🔍 [DEBUG] === useEffect loadDoctorsV2 ===');
    console.log('🔍 [DEBUG] isAuthenticated:', isAuthenticated, 'user:', !!user);
    
    if (isAuthenticated && user) {
      console.log('🔍 [DEBUG] ✅ Conditions remplies - chargement des médecins V2...');
      loadDoctors();
    } else if (!isAuthenticated && !user) {
      console.log('🔍 [DEBUG] ❌ Non authentifié - réinitialisation V2');
      setDoctors([]);
      setLoading(false);
    } else {
      console.log('🔍 [DEBUG] ⏳ En attente d\'authentification V2...');
    }
  }, [isAuthenticated, user, loadDoctors]);

  // Écouter les changements en temps réel avec la nouvelle architecture
  useEffect(() => {
    if (!user || !isAuthenticated) {
      console.log('🔥 Pas d\'écoute temps réel V2 - user:', !!user, 'isAuthenticated:', isAuthenticated);
      return;
    }

    console.log('🔥 Démarrage de l\'écoute temps réel V2 pour:', user.uid.substring(0, 8) + '...');
    
    // Le nouveau service gère automatiquement les erreurs réseau et le cache
    const unsubscribe = doctorsServiceV2.subscribeToDoctors(
      user.uid,
      (newDoctors) => {
        console.log('🔥 Médecins mis à jour en temps réel V2:', newDoctors.length);
        setDoctors(newDoctors);
        setLoading(false);
        setError(null);
      }
    );

    return () => {
      console.log('🔥 Arrêt de l\'écoute temps réel V2');
      unsubscribe();
    };
  }, [user, isAuthenticated]);

  // Nettoyer les ressources au démontage
  useEffect(() => {
    return () => {
      // Le service se nettoie automatiquement
      console.log('🧹 Nettoyage useDoctorsV2');
    };
  }, []);

  return {
    // État
    doctors,
    loading,
    error,
    syncing,
    
    // Propriétés calculées
    isReady: !loading && isAuthenticated,
    doctorsCount: doctors.length,
    
    // Actions CRUD
    addDoctor,
    updateDoctor,
    deleteDoctor,
    loadDoctors,
    
    // Actions de recherche et filtrage
    searchDoctors,
    getDoctorsByPhase,
    
    // Statistiques et export
    getDoctorsStats,
    exportDoctors,
    
    // Utilitaires
    getTreatmentPhases,
    validateDoctor,
    clearError: () => setError(null),
    
    // Informations de debug
    serviceStats: () => doctorsServiceV2.getStats()
  };
};

export default useDoctorsV2;