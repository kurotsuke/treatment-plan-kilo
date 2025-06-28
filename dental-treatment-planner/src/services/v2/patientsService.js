/**
 * Service des patients refactorisé avec la nouvelle couche d'abstraction
 * Version 2.0 - Utilise BaseRepository pour éliminer la redondance
 */
import { BaseRepository, BaseSchema, ValidationTypes } from '../../core/firebase';

// Schéma de validation pour les patients
const PatientSchema = new BaseSchema({
  'personalInfo.fullName': [ValidationTypes.REQUIRED, ValidationTypes.STRING],
  'personalInfo.email': ValidationTypes.EMAIL,
  'personalInfo.phone': ValidationTypes.PHONE,
  'personalInfo.dateOfBirth': ValidationTypes.DATE,
  'personalInfo.address': ValidationTypes.STRING,
  'medicalInfo.allergies': ValidationTypes.ARRAY,
  'medicalInfo.medications': ValidationTypes.ARRAY,
  'medicalInfo.medicalHistory': ValidationTypes.STRING,
  'medicalInfo.dentalHistory': ValidationTypes.STRING,
  assignedDoctorId: ValidationTypes.STRING,
  status: (value) => {
    if (!value) return true; // Optionnel
    const validStatuses = ['nouveau', 'en_cours', 'termine', 'suspendu'];
    return validStatuses.includes(value) || 'Le statut doit être: nouveau, en_cours, termine ou suspendu';
  },
  tags: ValidationTypes.ARRAY,
  notes: ValidationTypes.STRING
});

class PatientsServiceV2 extends BaseRepository {
  constructor() {
    super('patients', PatientSchema);
    console.log('👤 PatientsServiceV2 initialisé avec BaseRepository');
  }

  /**
   * Obtenir tous les patients d'un utilisateur avec filtres optionnels
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} filters - Filtres optionnels
   * @returns {Promise<Array>} Liste des patients
   */
  async getPatients(userId, filters = {}) {
    console.log('👤 getPatients V2 pour userId:', userId, 'avec filtres:', filters);
    
    // Utiliser la méthode héritée de BaseRepository
    const patients = await this.findAll(userId, filters);
    
    console.log('✅ Patients récupérés V2:', patients.length);
    return patients;
  }

  /**
   * Obtenir un patient spécifique
   * @param {string} patientId - ID du patient
   * @param {string} userId - ID de l'utilisateur (pour le cache)
   * @returns {Promise<Object>} Patient
   */
  async getPatient(patientId, userId = null) {
    console.log('👤 getPatient V2 pour ID:', patientId);
    
    const patient = await this.read(patientId, userId);
    
    if (!patient) {
      throw new Error('Patient non trouvé');
    }
    
    console.log('✅ Patient trouvé V2:', patient.personalInfo?.fullName);
    return patient;
  }

  /**
   * Ajouter un nouveau patient
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} patientData - Données du patient
   * @returns {Promise<Object>} Patient créé
   */
  async addPatient(userId, patientData) {
    console.log('👤 Ajout patient V2 avec données:', patientData);
    
    // Structurer les données selon le schéma
    const structuredData = {
      personalInfo: {
        fullName: patientData.personalInfo?.fullName || '',
        email: patientData.personalInfo?.email || '',
        phone: patientData.personalInfo?.phone || '',
        dateOfBirth: patientData.personalInfo?.dateOfBirth || null,
        address: patientData.personalInfo?.address || '',
        emergencyContact: patientData.personalInfo?.emergencyContact || null
      },
      medicalInfo: {
        allergies: patientData.medicalInfo?.allergies || [],
        medications: patientData.medicalInfo?.medications || [],
        medicalHistory: patientData.medicalInfo?.medicalHistory || '',
        dentalHistory: patientData.medicalInfo?.dentalHistory || ''
      },
      assignedDoctorId: patientData.assignedDoctorId || null,
      status: patientData.status || 'nouveau',
      tags: patientData.tags || [],
      notes: patientData.notes || '',
      lastVisit: null
    };
    
    // Utiliser la méthode héritée de BaseRepository (avec validation automatique)
    const newPatient = await this.create(userId, structuredData);
    
    console.log('✅ Patient ajouté V2:', newPatient.id);
    return newPatient;
  }

  /**
   * Mettre à jour un patient
   * @param {string} patientId - ID du patient
   * @param {Object} updates - Données à mettre à jour
   * @param {string} userId - ID de l'utilisateur (pour le cache)
   * @returns {Promise<Object>} Patient mis à jour
   */
  async updatePatient(patientId, updates, userId = null) {
    console.log('👤 Mise à jour patient V2:', patientId);
    
    // Utiliser la méthode héritée de BaseRepository (avec validation automatique)
    const updatedPatient = await this.update(patientId, updates, userId);
    
    console.log('✅ Patient mis à jour V2:', patientId);
    return updatedPatient;
  }

  /**
   * Supprimer un patient
   * @param {string} patientId - ID du patient
   * @param {string} userId - ID de l'utilisateur (pour le cache)
   * @returns {Promise<void>}
   */
  async deletePatient(patientId, userId = null) {
    console.log('👤 Suppression patient V2:', patientId);
    
    // Utiliser la méthode héritée de BaseRepository
    await this.delete(patientId, userId);
    
    console.log('✅ Patient supprimé V2:', patientId);
  }

  /**
   * Rechercher des patients par nom
   * @param {string} userId - ID de l'utilisateur
   * @param {string} searchTerm - Terme de recherche
   * @returns {Promise<Array>} Patients correspondants
   */
  async searchPatients(userId, searchTerm) {
    console.log('👤 Recherche patients V2:', searchTerm);
    
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }
    
    // Récupérer tous les patients et filtrer côté client
    const allPatients = await this.getPatients(userId);
    
    const searchTermLower = searchTerm.toLowerCase();
    const filteredPatients = allPatients.filter(patient => {
      const fullName = patient.personalInfo?.fullName?.toLowerCase() || '';
      const email = patient.personalInfo?.email?.toLowerCase() || '';
      const phone = patient.personalInfo?.phone || '';
      
      return fullName.includes(searchTermLower) || 
             email.includes(searchTermLower) || 
             phone.includes(searchTerm);
    });
    
    console.log('✅ Patients trouvés V2:', filteredPatients.length);
    return filteredPatients;
  }

  /**
   * Obtenir les patients assignés à un médecin
   * @param {string} userId - ID de l'utilisateur
   * @param {string} doctorId - ID du médecin
   * @returns {Promise<Array>} Patients assignés
   */
  async getPatientsByDoctor(userId, doctorId) {
    console.log('👤 Patients par médecin V2:', doctorId);
    
    const patients = await this.getPatients(userId, { assignedDoctorId: doctorId });
    
    console.log('✅ Patients du médecin V2:', patients.length);
    return patients;
  }

  /**
   * Obtenir les patients par statut
   * @param {string} userId - ID de l'utilisateur
   * @param {string} status - Statut des patients
   * @returns {Promise<Array>} Patients avec le statut donné
   */
  async getPatientsByStatus(userId, status) {
    console.log('👤 Patients par statut V2:', status);
    
    const patients = await this.getPatients(userId, { status });
    
    console.log('✅ Patients avec statut', status, 'V2:', patients.length);
    return patients;
  }

  /**
   * S'abonner aux changements des patients en temps réel
   * @param {string} userId - ID de l'utilisateur
   * @param {Function} callback - Fonction appelée lors des changements
   * @param {Object} filters - Filtres optionnels
   * @returns {Function} Fonction pour arrêter l'écoute
   */
  subscribeToPatients(userId, callback, filters = {}) {
    console.log('🔥 subscribeToPatients V2 pour userId:', userId);
    
    // Utiliser la méthode héritée de BaseRepository
    return this.subscribe(userId, (patients) => {
      console.log('🔥 Patients temps réel V2:', patients.length);
      callback(patients);
    }, filters);
  }

  /**
   * Générer un numéro de patient unique
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<string>} Numéro de patient
   */
  async generatePatientNumber(userId) {
    try {
      // Format: P-YYYY-NNNN (P pour Patient, année, numéro séquentiel)
      const year = new Date().getFullYear();
      const patients = await this.getPatients(userId);
      const patientCount = patients.length + 1;
      
      return `P-${year}-${patientCount.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('❌ Erreur lors de la génération du numéro patient V2:', error);
      return `P-${new Date().getFullYear()}-0001`;
    }
  }

  /**
   * Obtenir un résumé du patient
   * @param {Object} patient - Patient
   * @returns {Object} Résumé du patient
   */
  getPatientSummary(patient) {
    if (!patient) return null;
    
    const age = patient.personalInfo?.dateOfBirth 
      ? new Date().getFullYear() - new Date(patient.personalInfo.dateOfBirth).getFullYear()
      : null;
    
    return {
      id: patient.id,
      fullName: patient.personalInfo?.fullName || 'Nom non défini',
      age: age,
      status: patient.status,
      lastVisit: patient.lastVisit,
      hasEmail: !!patient.personalInfo?.email,
      hasPhone: !!patient.personalInfo?.phone,
      assignedDoctor: patient.assignedDoctorId,
      tagsCount: patient.tags?.length || 0,
      createdAt: patient.createdAt
    };
  }

  /**
   * Mettre à jour la date de dernière visite
   * @param {string} patientId - ID du patient
   * @param {Date} visitDate - Date de la visite
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<void>}
   */
  async updateLastVisit(patientId, visitDate = new Date(), userId = null) {
    console.log('👤 Mise à jour dernière visite V2:', patientId);
    
    await this.updatePatient(patientId, {
      lastVisit: visitDate
    }, userId);
    
    console.log('✅ Dernière visite mise à jour V2');
  }

  /**
   * Obtenir les statistiques des patients
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Statistiques
   */
  async getPatientsStats(userId) {
    console.log('📊 Statistiques patients V2');
    
    const patients = await this.getPatients(userId);
    
    const stats = {
      total: patients.length,
      byStatus: {
        nouveau: patients.filter(p => p.status === 'nouveau').length,
        en_cours: patients.filter(p => p.status === 'en_cours').length,
        termine: patients.filter(p => p.status === 'termine').length,
        suspendu: patients.filter(p => p.status === 'suspendu').length
      },
      withEmail: patients.filter(p => p.personalInfo?.email).length,
      withPhone: patients.filter(p => p.personalInfo?.phone).length,
      assigned: patients.filter(p => p.assignedDoctorId).length,
      recentlyAdded: patients.filter(p => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return p.createdAt > weekAgo;
      }).length,
      averageAge: this.calculateAverageAge(patients)
    };
    
    console.log('✅ Statistiques calculées V2:', stats);
    return stats;
  }

  /**
   * Calculer l'âge moyen des patients
   * @param {Array} patients - Liste des patients
   * @returns {number} Âge moyen
   */
  calculateAverageAge(patients) {
    const patientsWithAge = patients.filter(p => p.personalInfo?.dateOfBirth);
    
    if (patientsWithAge.length === 0) return 0;
    
    const totalAge = patientsWithAge.reduce((sum, patient) => {
      const age = new Date().getFullYear() - new Date(patient.personalInfo.dateOfBirth).getFullYear();
      return sum + age;
    }, 0);
    
    return Math.round(totalAge / patientsWithAge.length);
  }

  /**
   * Exporter les patients au format JSON
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<string>} JSON des patients
   */
  async exportPatients(userId) {
    console.log('📤 Export patients V2');
    
    const patients = await this.getPatients(userId);
    
    // Nettoyer les données pour l'export
    const exportData = patients.map(patient => ({
      id: patient.id,
      personalInfo: {
        fullName: patient.personalInfo?.fullName,
        email: patient.personalInfo?.email,
        phone: patient.personalInfo?.phone,
        dateOfBirth: patient.personalInfo?.dateOfBirth,
        address: patient.personalInfo?.address
      },
      medicalInfo: {
        allergies: patient.medicalInfo?.allergies,
        medications: patient.medicalInfo?.medications,
        medicalHistory: patient.medicalInfo?.medicalHistory,
        dentalHistory: patient.medicalInfo?.dentalHistory
      },
      status: patient.status,
      assignedDoctorId: patient.assignedDoctorId,
      tags: patient.tags,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      lastVisit: patient.lastVisit
    }));
    
    const jsonData = JSON.stringify(exportData, null, 2);
    console.log('✅ Export terminé V2:', exportData.length, 'patients');
    
    return jsonData;
  }

  /**
   * Importer des patients depuis JSON
   * @param {string} userId - ID de l'utilisateur
   * @param {string} jsonData - Données JSON à importer
   * @returns {Promise<Array>} Patients importés
   */
  async importPatients(userId, jsonData) {
    console.log('📥 Import patients V2');
    
    try {
      const patientsData = JSON.parse(jsonData);
      
      if (!Array.isArray(patientsData)) {
        throw new Error('Les données doivent être un tableau de patients');
      }
      
      const importedPatients = [];
      
      for (const patientData of patientsData) {
        try {
          // Supprimer l'ID pour créer un nouveau patient
          const { id, createdAt, updatedAt, ...cleanData } = patientData;
          
          const newPatient = await this.addPatient(userId, cleanData);
          importedPatients.push(newPatient);
          
        } catch (error) {
          console.warn('⚠️ Erreur lors de l\'import d\'un patient:', error.message);
        }
      }
      
      console.log('✅ Import terminé V2:', importedPatients.length, 'patients importés');
      return importedPatients;
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'import V2:', error);
      throw new Error(`Impossible d'importer les patients: ${error.message}`);
    }
  }

  /**
   * Valider les données d'un patient (méthode publique pour compatibilité)
   * @param {Object} patientData - Données à valider
   * @returns {Object} Résultat de la validation
   */
  validatePatient(patientData) {
    // Utiliser le schéma de validation intégré
    return this.schema.validate(patientData);
  }

  /**
   * Obtenir les patients récents
   * @param {string} userId - ID de l'utilisateur
   * @param {number} days - Nombre de jours (défaut: 7)
   * @returns {Promise<Array>} Patients récents
   */
  async getRecentPatients(userId, days = 7) {
    console.log('👤 Patients récents V2:', days, 'jours');
    
    const patients = await this.getPatients(userId);
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const recentPatients = patients.filter(patient => 
      patient.createdAt > cutoffDate
    );
    
    console.log('✅ Patients récents trouvés V2:', recentPatients.length);
    return recentPatients;
  }

  /**
   * Archiver un patient (changer le statut)
   * @param {string} patientId - ID du patient
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Patient archivé
   */
  async archivePatient(patientId, userId = null) {
    console.log('📦 Archivage patient V2:', patientId);
    
    const archivedPatient = await this.updatePatient(patientId, {
      status: 'archive',
      archivedAt: new Date()
    }, userId);
    
    console.log('✅ Patient archivé V2:', patientId);
    return archivedPatient;
  }
}

// Exporter une instance unique du service
export default new PatientsServiceV2();

// Exporter aussi la classe pour les tests
export { PatientsServiceV2 };