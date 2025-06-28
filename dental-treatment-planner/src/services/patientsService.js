/**
 * Service pour la gestion des patients dans Firestore
 */
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  or,
  and
} from 'firebase/firestore';
import { getDb } from '../config/firebase';

class PatientsService {
  constructor() {
    this.collection = 'patients';
  }

  /**
   * Obtenir tous les patients d'un utilisateur avec filtres optionnels
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} filters - Filtres optionnels
   * @returns {Promise<Array>} Liste des patients
   */
  async getPatients(userId, filters = {}) {
    try {
      console.log('🔍 getPatients pour userId:', userId, 'avec filtres:', filters);
      const db = getDb();
      const patientsRef = collection(db, this.collection);
      
      // Construire la requête de base
      let constraints = [where('userId', '==', userId)];
      
      // Ajouter les filtres
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      
      if (filters.assignedDoctorId) {
        constraints.push(where('assignedDoctorId', '==', filters.assignedDoctorId));
      }
      
      // Tri par défaut par date de création (plus récent en premier)
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      constraints.push(orderBy(sortBy, sortOrder));
      
      // Pagination
      if (filters.limitCount) {
        constraints.push(limit(filters.limitCount));
      }
      
      if (filters.startAfterDoc) {
        constraints.push(startAfter(filters.startAfterDoc));
      }
      
      const q = query(patientsRef, ...constraints);
      console.log('📋 Requête créée avec contraintes:', constraints.length);
      
      const snapshot = await getDocs(q);
      console.log('📄 Snapshot reçu, nombre de docs:', snapshot.size);
      
      const patients = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('👤 Patient trouvé:', doc.id, data.personalInfo?.fullName);
        patients.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          lastVisit: data.lastVisit?.toDate?.() || null
        });
      });
      
      console.log('✅ Patients récupérés:', patients.length);
      return patients;
    } catch (error) {
      console.error('Erreur lors de la récupération des patients:', error);
      throw new Error(`Impossible de récupérer les patients: ${error.message}`);
    }
  }

  /**
   * Obtenir un patient spécifique
   * @param {string} patientId - ID du patient
   * @returns {Promise<Object>} Patient
   */
  async getPatient(patientId) {
    try {
      console.log('🔍 getPatient pour ID:', patientId);
      const db = getDb();
      const patientRef = doc(db, this.collection, patientId);
      
      const docSnap = await getDoc(patientRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('✅ Patient trouvé:', data.personalInfo?.fullName);
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          lastVisit: data.lastVisit?.toDate?.() || null
        };
      } else {
        throw new Error('Patient non trouvé');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du patient:', error);
      throw new Error(`Impossible de récupérer le patient: ${error.message}`);
    }
  }

  /**
   * Ajouter un nouveau patient
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} patientData - Données du patient
   * @returns {Promise<Object>} Patient créé
   */
  async addPatient(userId, patientData) {
    try {
      console.log('👤 Ajout patient avec données:', patientData);
      
      // Valider les données
      const validation = this.validatePatient(patientData);
      if (!validation.isValid) {
        throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
      }
      
      const db = getDb();
      const patientsRef = collection(db, this.collection);
      
      const newPatient = {
        userId: userId,
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastVisit: null
      };
      
      console.log('💾 Sauvegarde patient dans Firestore...');
      const docRef = await addDoc(patientsRef, newPatient);
      
      const result = {
        id: docRef.id,
        ...newPatient,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('✅ Patient ajouté avec succès:', result.id);
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du patient:', error);
      throw new Error(`Impossible d'ajouter le patient: ${error.message}`);
    }
  }

  /**
   * Mettre à jour un patient
   * @param {string} patientId - ID du patient
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<Object>} Patient mis à jour
   */
  async updatePatient(patientId, updates) {
    try {
      console.log('📝 Mise à jour patient:', patientId, updates);
      const db = getDb();
      const patientRef = doc(db, this.collection, patientId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(patientRef, updateData);
      
      console.log('✅ Patient mis à jour avec succès');
      return {
        id: patientId,
        ...updates,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du patient:', error);
      throw new Error(`Impossible de mettre à jour le patient: ${error.message}`);
    }
  }

  /**
   * Supprimer un patient
   * @param {string} patientId - ID du patient
   * @returns {Promise<void>}
   */
  async deletePatient(patientId) {
    try {
      console.log('🗑️ Suppression patient:', patientId);
      const db = getDb();
      const patientRef = doc(db, this.collection, patientId);
      await deleteDoc(patientRef);
      console.log('✅ Patient supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du patient:', error);
      throw new Error(`Impossible de supprimer le patient: ${error.message}`);
    }
  }

  /**
   * Rechercher des patients par nom
   * @param {string} userId - ID de l'utilisateur
   * @param {string} searchTerm - Terme de recherche
   * @returns {Promise<Array>} Patients correspondants
   */
  async searchPatients(userId, searchTerm) {
    try {
      console.log('🔍 Recherche patients:', searchTerm);
      
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }
      
      // Pour une recherche simple, on récupère tous les patients et on filtre côté client
      // Dans une vraie application, on utiliserait Algolia ou une solution de recherche full-text
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
      
      console.log('✅ Patients trouvés:', filteredPatients.length);
      return filteredPatients;
    } catch (error) {
      console.error('Erreur lors de la recherche de patients:', error);
      throw new Error(`Impossible de rechercher les patients: ${error.message}`);
    }
  }

  /**
   * Obtenir les patients assignés à un médecin
   * @param {string} userId - ID de l'utilisateur
   * @param {string} doctorId - ID du médecin
   * @returns {Promise<Array>} Patients assignés
   */
  async getPatientsByDoctor(userId, doctorId) {
    try {
      return await this.getPatients(userId, { assignedDoctorId: doctorId });
    } catch (error) {
      console.error('Erreur lors de la récupération des patients par médecin:', error);
      throw new Error(`Impossible de récupérer les patients du médecin: ${error.message}`);
    }
  }

  /**
   * Obtenir les patients par statut
   * @param {string} userId - ID de l'utilisateur
   * @param {string} status - Statut des patients
   * @returns {Promise<Array>} Patients avec le statut donné
   */
  async getPatientsByStatus(userId, status) {
    try {
      return await this.getPatients(userId, { status });
    } catch (error) {
      console.error('Erreur lors de la récupération des patients par statut:', error);
      throw new Error(`Impossible de récupérer les patients par statut: ${error.message}`);
    }
  }

  /**
   * Écouter les changements des patients en temps réel
   * @param {string} userId - ID de l'utilisateur
   * @param {Function} callback - Fonction appelée lors des changements
   * @returns {Function} Fonction pour arrêter l'écoute
   */
  subscribeToPatients(userId, callback) {
    try {
      console.log('🔥 subscribeToPatients pour userId:', userId);
      const db = getDb();
      const patientsRef = collection(db, this.collection);
      
      const q = query(
        patientsRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(
        q,
        (snapshot) => {
          console.log('🔥 Snapshot temps réel reçu, nombre de docs:', snapshot.size);
          const patients = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            patients.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
              lastVisit: data.lastVisit?.toDate?.() || null
            });
          });
          
          console.log('🔥 Patients temps réel:', patients.length);
          callback(patients);
        },
        (error) => {
          console.error('Erreur lors de l\'écoute des patients:', error);
          callback([]);
        }
      );
    } catch (error) {
      console.error('Erreur lors de la création de l\'écoute:', error);
      callback([]);
      return () => {}; // Retourner une fonction vide pour éviter les erreurs
    }
  }

  /**
   * Valider les données d'un patient
   * @param {Object} patientData - Données à valider
   * @returns {Object} Résultat de la validation
   */
  validatePatient(patientData) {
    const errors = [];
    
    // Validation des informations personnelles
    if (!patientData.personalInfo?.fullName || patientData.personalInfo.fullName.trim().length < 2) {
      errors.push('Le nom complet doit contenir au moins 2 caractères');
    }
    
    // Validation de l'email si fourni
    if (patientData.personalInfo?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(patientData.personalInfo.email)) {
        errors.push('L\'adresse email n\'est pas valide');
      }
    }
    
    // Validation du téléphone si fourni
    if (patientData.personalInfo?.phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
      if (!phoneRegex.test(patientData.personalInfo.phone)) {
        errors.push('Le numéro de téléphone n\'est pas valide');
      }
    }
    
    // Validation du statut
    const validStatuses = ['nouveau', 'en_cours', 'termine', 'suspendu'];
    if (patientData.status && !validStatuses.includes(patientData.status)) {
      errors.push('Le statut doit être: nouveau, en_cours, termine ou suspendu');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
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
      console.error('Erreur lors de la génération du numéro patient:', error);
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
   * @returns {Promise<void>}
   */
  async updateLastVisit(patientId, visitDate = new Date()) {
    try {
      await this.updatePatient(patientId, {
        lastVisit: visitDate
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la dernière visite:', error);
      throw error;
    }
  }
}

// Exporter une instance unique du service
export default new PatientsService();