import { useState, useEffect, useCallback, useMemo } from 'react';
import patientsServiceV2 from '../services/v2/patientsService.js';

/**
 * Hook React pour la gestion des patients avec la nouvelle architecture Firebase V2
 * Fournit une interface réactive pour toutes les opérations patients
 */
export const usePatientsV2 = (userId) => {
  // États principaux
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('lastName');
  const [sortOrder, setSortOrder] = useState('asc');

  // États pour les opérations
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /**
   * Charger tous les patients
   */
  const loadPatients = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement patients V2...');
      
      const patientsData = await patientsServiceV2.getPatients(userId);
      setPatients(patientsData);
      
      console.log('✅ Patients chargés V2:', patientsData.length);
    } catch (err) {
      console.error('❌ Erreur chargement patients V2:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Créer un nouveau patient
   */
  const createPatient = useCallback(async (patientData) => {
    try {
      setCreating(true);
      setError(null);
      console.log('➕ Création patient V2...');
      
      const newPatient = await patientsServiceV2.createPatient(userId, patientData);
      setPatients(prev => [...prev, newPatient]);
      
      console.log('✅ Patient créé V2:', newPatient.id);
      return newPatient;
    } catch (err) {
      console.error('❌ Erreur création patient V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  }, [userId]);

  /**
   * Mettre à jour un patient
   */
  const updatePatient = useCallback(async (patientId, updates) => {
    try {
      setUpdating(true);
      setError(null);
      console.log('📝 Mise à jour patient V2:', patientId);
      
      const updatedPatient = await patientsServiceV2.updatePatient(patientId, updates);
      setPatients(prev => prev.map(p => p.id === patientId ? updatedPatient : p));
      
      console.log('✅ Patient mis à jour V2:', patientId);
      return updatedPatient;
    } catch (err) {
      console.error('❌ Erreur mise à jour patient V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * Supprimer un patient
   */
  const deletePatient = useCallback(async (patientId) => {
    try {
      setDeleting(true);
      setError(null);
      console.log('🗑️ Suppression patient V2:', patientId);
      
      await patientsServiceV2.deletePatient(patientId);
      setPatients(prev => prev.filter(p => p.id !== patientId));
      
      console.log('✅ Patient supprimé V2:', patientId);
    } catch (err) {
      console.error('❌ Erreur suppression patient V2:', err);
      setError(err.message);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, []);

  /**
   * Rechercher des patients
   */
  const searchPatients = useCallback(async (term) => {
    if (!userId || !term.trim()) {
      await loadPatients();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Recherche patients V2:', term);
      
      const results = await patientsServiceV2.searchPatients(userId, term);
      setPatients(results);
      
      console.log('✅ Recherche terminée V2:', results.length, 'résultats');
    } catch (err) {
      console.error('❌ Erreur recherche patients V2:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, loadPatients]);

  /**
   * Obtenir les statistiques des patients
   */
  const getStatistics = useCallback(async () => {
    if (!userId) return null;

    try {
      console.log('📊 Chargement statistiques patients V2...');
      const stats = await patientsServiceV2.getPatientsStats(userId);
      console.log('✅ Statistiques patients V2:', stats);
      return stats;
    } catch (err) {
      console.error('❌ Erreur statistiques patients V2:', err);
      throw err;
    }
  }, [userId]);

  /**
   * Exporter les patients
   */
  const exportPatients = useCallback(async () => {
    if (!userId) return null;

    try {
      console.log('📤 Export patients V2...');
      const exportData = await patientsServiceV2.exportPatients(userId);
      console.log('✅ Export terminé V2');
      return exportData;
    } catch (err) {
      console.error('❌ Erreur export patients V2:', err);
      throw err;
    }
  }, [userId]);

  /**
   * Patients filtrés et triés
   */
  const filteredAndSortedPatients = useMemo(() => {
    let filtered = patients;

    // Filtrage par terme de recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = patients.filter(patient => 
        patient.firstName?.toLowerCase().includes(term) ||
        patient.lastName?.toLowerCase().includes(term) ||
        patient.email?.toLowerCase().includes(term) ||
        patient.phone?.includes(term) ||
        patient.patientNumber?.toLowerCase().includes(term)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Gestion des valeurs nulles/undefined
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      // Conversion en string pour comparaison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return filtered;
  }, [patients, searchTerm, sortBy, sortOrder]);

  /**
   * Statistiques calculées localement
   */
  const localStats = useMemo(() => {
    return {
      total: patients.length,
      filtered: filteredAndSortedPatients.length,
      byGender: {
        homme: patients.filter(p => p.gender === 'homme').length,
        femme: patients.filter(p => p.gender === 'femme').length,
        autre: patients.filter(p => p.gender === 'autre').length
      },
      recentlyAdded: patients.filter(p => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return p.createdAt > weekAgo;
      }).length
    };
  }, [patients, filteredAndSortedPatients]);

  /**
   * Obtenir un patient par ID
   */
  const getPatientById = useCallback((patientId) => {
    return patients.find(p => p.id === patientId);
  }, [patients]);

  /**
   * Vérifier si un patient existe
   */
  const patientExists = useCallback((patientId) => {
    return patients.some(p => p.id === patientId);
  }, [patients]);

  /**
   * Rafraîchir les données
   */
  const refresh = useCallback(() => {
    loadPatients();
  }, [loadPatients]);

  // Chargement initial
  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Gestion de la recherche avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchPatients(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchPatients]);

  return {
    // Données
    patients: filteredAndSortedPatients,
    allPatients: patients,
    
    // États
    loading,
    error,
    creating,
    updating,
    deleting,
    
    // Filtres et tri
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    
    // Actions CRUD
    createPatient,
    updatePatient,
    deletePatient,
    refresh,
    
    // Recherche et statistiques
    searchPatients,
    getStatistics,
    exportPatients,
    
    // Utilitaires
    getPatientById,
    patientExists,
    localStats,
    
    // Méta-données
    isEmpty: patients.length === 0,
    hasResults: filteredAndSortedPatients.length > 0,
    isFiltered: searchTerm.trim().length > 0
  };
};

export default usePatientsV2;