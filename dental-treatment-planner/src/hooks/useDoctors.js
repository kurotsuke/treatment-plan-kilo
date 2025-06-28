/**
 * Hook personnalisé pour la gestion des médecins avec Firebase
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import doctorsService from '../services/doctorsService';

/**
 * Hook pour gérer les médecins avec synchronisation Firebase
 */
export const useDoctors = () => {
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
      console.log('🔍 [DEBUG] loadDoctors: Pas d\'utilisateur');
      return;
    }

    try {
      console.log('🔍 [DEBUG] loadDoctors: Début du chargement pour', user.uid.substring(0, 8) + '...');
      setLoading(true);
      setError(null);
      
      const userDoctors = await doctorsService.getDoctors(user.uid);
      console.log('🔍 [DEBUG] loadDoctors: Médecins chargés:', userDoctors);
      console.log('🔍 [DEBUG] loadDoctors: Nombre de médecins:', userDoctors.length);
      setDoctors(userDoctors);
      
    } catch (error) {
      console.error('🔍 [DEBUG] loadDoctors: Erreur lors du chargement des médecins:', error);
      setError(error.message);
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

    // Valider les données
    const validation = doctorsService.validateDoctor(doctorData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    try {
      setSyncing(true);
      setError(null);
      
      const newDoctor = await doctorsService.addDoctor(user.uid, doctorData);
      console.log('✅ Médecin ajouté:', newDoctor);
      
      return newDoctor;
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du médecin:', error);
      setError(error.message);
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

    // Valider les données si elles sont fournies
    if (updates.firstName || updates.lastName || updates.treatmentPhases) {
      const currentDoctor = doctors.find(d => d.id === doctorId);
      const updatedData = { ...currentDoctor, ...updates };
      const validation = doctorsService.validateDoctor(updatedData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
    }

    try {
      setSyncing(true);
      setError(null);
      
      const updatedDoctor = await doctorsService.updateDoctor(doctorId, updates);
      console.log('✅ Médecin mis à jour:', updatedDoctor);
      
      return updatedDoctor;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du médecin:', error);
      setError(error.message);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [user, doctors]);

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
      
      await doctorsService.deleteDoctor(doctorId);
      console.log('✅ Médecin supprimé:', doctorId);
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du médecin:', error);
      setError(error.message);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [user]);

  /**
   * Obtenir les phases de traitement disponibles
   */
  const getTreatmentPhases = useCallback(() => {
    return doctorsService.getTreatmentPhases();
  }, []);

  // Charger les médecins au montage et quand l'utilisateur change
  useEffect(() => {
    console.log('🔍 [DEBUG] === useEffect loadDoctors ===');
    console.log('🔍 [DEBUG] isAuthenticated:', isAuthenticated, 'user:', !!user);
    console.log('🔍 [DEBUG] loading:', loading, 'doctors.length:', doctors.length);
    
    if (isAuthenticated && user) {
      console.log('🔍 [DEBUG] ✅ Conditions remplies - chargement des médecins...');
      loadDoctors();
    } else if (!isAuthenticated && !user) {
      console.log('🔍 [DEBUG] ❌ Non authentifié - réinitialisation');
      setDoctors([]);
      setLoading(false);
    } else {
      console.log('🔍 [DEBUG] ⏳ En attente d\'authentification...');
    }
    console.log('🔍 [DEBUG] === FIN useEffect loadDoctors ===');
  }, [isAuthenticated, user, loadDoctors]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!user || !isAuthenticated) {
      console.log('🔥 Pas d\'écoute temps réel - user:', !!user, 'isAuthenticated:', isAuthenticated);
      return;
    }

    console.log('🔥 Démarrage de l\'écoute temps réel des médecins pour:', user.uid.substring(0, 8) + '...');
    
    const unsubscribe = doctorsService.subscribeToDoctors(
      user.uid,
      (newDoctors) => {
        console.log('🔥 Médecins mis à jour en temps réel:', newDoctors);
        setDoctors(newDoctors);
        setLoading(false);
        setError(null);
      }
    );

    return () => {
      console.log('🔥 Arrêt de l\'écoute temps réel des médecins');
      unsubscribe();
    };
  }, [user, isAuthenticated]);

  return {
    // État
    doctors,
    loading,
    error,
    syncing,
    
    // Propriétés calculées
    isReady: !loading && isAuthenticated,
    doctorsCount: doctors.length,
    
    // Actions
    addDoctor,
    updateDoctor,
    deleteDoctor,
    loadDoctors,
    
    // Utilitaires
    getTreatmentPhases,
    clearError: () => setError(null)
  };
};

export default useDoctors;