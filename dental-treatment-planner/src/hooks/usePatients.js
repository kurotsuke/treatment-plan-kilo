/**
 * Hook personnalisé pour la gestion des patients
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import patientsService from '../services/patientsService';

export const usePatients = (filters = {}) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les patients
  const loadPatients = useCallback(async () => {
    if (!user?.uid) {
      setPatients([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await patientsService.getPatients(user.uid, filters);
      setPatients(data);
    } catch (err) {
      console.error('Erreur lors du chargement des patients:', err);
      setError(err.message);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, JSON.stringify(filters)]);

  // Charger les patients au montage et quand les dépendances changent
  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!user?.uid) return;

    console.log('🔥 Mise en place de l\'écoute temps réel des patients');
    const unsubscribe = patientsService.subscribeToPatients(user.uid, (updatedPatients) => {
      console.log('🔥 Patients mis à jour en temps réel:', updatedPatients.length);
      setPatients(updatedPatients);
      setLoading(false);
    });

    return () => {
      console.log('🔥 Arrêt de l\'écoute temps réel des patients');
      unsubscribe();
    };
  }, [user?.uid]);

  // Ajouter un patient
  const addPatient = useCallback(async (patientData) => {
    if (!user?.uid) {
      throw new Error('Utilisateur non authentifié');
    }

    try {
      setError(null);
      const newPatient = await patientsService.addPatient(user.uid, patientData);
      console.log('✅ Patient ajouté:', newPatient.id);
      return newPatient;
    } catch (err) {
      console.error('Erreur lors de l\'ajout du patient:', err);
      setError(err.message);
      throw err;
    }
  }, [user?.uid]);

  // Mettre à jour un patient
  const updatePatient = useCallback(async (patientId, updates) => {
    try {
      setError(null);
      const updatedPatient = await patientsService.updatePatient(patientId, updates);
      console.log('✅ Patient mis à jour:', patientId);
      return updatedPatient;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du patient:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Supprimer un patient
  const deletePatient = useCallback(async (patientId) => {
    try {
      setError(null);
      await patientsService.deletePatient(patientId);
      console.log('✅ Patient supprimé:', patientId);
    } catch (err) {
      console.error('Erreur lors de la suppression du patient:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Rechercher des patients
  const searchPatients = useCallback(async (searchTerm) => {
    if (!user?.uid) {
      return [];
    }

    try {
      setError(null);
      const results = await patientsService.searchPatients(user.uid, searchTerm);
      return results;
    } catch (err) {
      console.error('Erreur lors de la recherche de patients:', err);
      setError(err.message);
      return [];
    }
  }, [user?.uid]);

  // Obtenir un patient spécifique
  const getPatient = useCallback(async (patientId) => {
    try {
      setError(null);
      const patient = await patientsService.getPatient(patientId);
      return patient;
    } catch (err) {
      console.error('Erreur lors de la récupération du patient:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Dupliquer un patient
  const duplicatePatient = useCallback(async (patientId) => {
    try {
      setError(null);
      const duplicatedPatient = await patientsService.duplicatePatient(patientId);
      console.log('✅ Patient dupliqué:', duplicatedPatient.id);
      return duplicatedPatient;
    } catch (err) {
      console.error('Erreur lors de la duplication du patient:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    patients,
    loading,
    error,
    addPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    getPatient,
    duplicatePatient,
    refreshPatients: loadPatients
  };
};

export const usePatient = (patientId) => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) {
      setPatient(null);
      setLoading(false);
      return;
    }

    const loadPatient = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await patientsService.getPatient(patientId);
        setPatient(data);
      } catch (err) {
        console.error('Erreur lors du chargement du patient:', err);
        setError(err.message);
        setPatient(null);
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
  }, [patientId]);

  return {
    patient,
    loading,
    error
  };
};

export default usePatients;