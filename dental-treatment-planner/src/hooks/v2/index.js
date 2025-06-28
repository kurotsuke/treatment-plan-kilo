/**
 * Index des hooks V2 - Nouvelle architecture Firebase
 * Point d'entrée centralisé pour tous les hooks refactorisés
 */

// Import des hooks V2
export { default as useDoctorsV2 } from './useDoctorsV2.js';
export { default as usePatientsV2 } from './usePatientsV2.js';
export { default as useQuotesV2 } from './useQuotesV2.js';
export { default as useSettingsV2 } from './useSettingsV2.js';
export { default as useTreatmentPlansV2 } from './useTreatmentPlansV2.js';

// Export nommé pour compatibilité
export {
  useDoctorsV2,
  usePatientsV2,
  useQuotesV2,
  useSettingsV2,
  useTreatmentPlansV2
} from './index.js';

/**
 * Hook combiné pour charger toutes les données utilisateur
 * Utile pour les tableaux de bord et vues d'ensemble
 */
export const useAllDataV2 = (userId) => {
  const doctors = useDoctorsV2(userId);
  const patients = usePatientsV2(userId);
  const quotes = useQuotesV2(userId);
  const settings = useSettingsV2(userId);
  const treatmentPlans = useTreatmentPlansV2(userId);

  return {
    doctors,
    patients,
    quotes,
    settings,
    treatmentPlans,
    
    // États globaux
    loading: doctors.loading || patients.loading || quotes.loading || 
             settings.loading || treatmentPlans.loading,
    
    error: doctors.error || patients.error || quotes.error || 
           settings.error || treatmentPlans.error,
    
    // Méthodes de rafraîchissement globales
    refreshAll: () => {
      doctors.refresh();
      patients.refresh();
      quotes.refresh();
      settings.refresh();
      treatmentPlans.refresh();
    }
  };
};

/**
 * Métadonnées des hooks V2
 */
export const HOOKS_V2_METADATA = {
  version: '2.0.0',
  description: 'Hooks React refactorisés avec la nouvelle architecture Firebase',
  features: [
    'Cache intelligent avec TTL',
    'Gestion d\'erreurs robuste avec retry automatique',
    'Validation automatique des données',
    'Optimisation des requêtes Firestore',
    'Listeners temps réel optimisés',
    'Interface réactive complète'
  ],
  hooks: {
    useDoctorsV2: {
      description: 'Gestion des médecins',
      features: ['CRUD complet', 'Recherche', 'Statistiques', 'Export']
    },
    usePatientsV2: {
      description: 'Gestion des patients',
      features: ['CRUD complet', 'Recherche avancée', 'Filtrage', 'Statistiques', 'Export']
    },
    useQuotesV2: {
      description: 'Gestion des devis',
      features: ['CRUD complet', 'Génération IA', 'Duplication', 'Gestion statuts', 'Export']
    },
    useSettingsV2: {
      description: 'Gestion des paramètres',
      features: ['Configuration complète', 'Upload images', 'Import/Export', 'Valeurs par défaut']
    },
    useTreatmentPlansV2: {
      description: 'Gestion des plans de traitement',
      features: ['CRUD complet', 'Gestion phases', 'Timeline', 'Priorités', 'Statistiques avancées']
    }
  }
};

export default {
  useDoctorsV2,
  usePatientsV2,
  useQuotesV2,
  useSettingsV2,
  useTreatmentPlansV2,
  useAllDataV2,
  HOOKS_V2_METADATA
};