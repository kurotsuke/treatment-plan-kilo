/**
 * Service pour la gestion des plans de traitement dans Firestore
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
  startAfter
} from 'firebase/firestore';
import { getDb } from '../config/firebase';

class TreatmentPlansService {
  constructor() {
    this.collection = 'treatmentPlans';
  }

  /**
   * Obtenir tous les plans de traitement d'un utilisateur avec filtres optionnels
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} filters - Filtres optionnels
   * @returns {Promise<Array>} Liste des plans de traitement
   */
  async getTreatmentPlans(userId, filters = {}) {
    try {
      console.log('🔍 getTreatmentPlans pour userId:', userId, 'avec filtres:', filters);
      const db = getDb();
      const plansRef = collection(db, this.collection);
      
      // Si aucun filtre complexe, utiliser une requête simple
      if (Object.keys(filters).length === 0 || (Object.keys(filters).length === 1 && (filters.sortBy || filters.sortOrder))) {
        console.log('📋 Utilisation requête simple (sans index)');
        const q = query(plansRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        
        const plans = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          plans.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
            startDate: data.timeline?.startDate?.toDate?.() || null,
            endDate: data.timeline?.endDate?.toDate?.() || null,
            lastAppointment: data.timeline?.lastAppointment?.toDate?.() || null
          });
        });
        
        // Tri côté client pour éviter l'index
        const sortBy = filters.sortBy || 'createdAt';
        const sortOrder = filters.sortOrder || 'desc';
        plans.sort((a, b) => {
          const aValue = a[sortBy];
          const bValue = b[sortBy];
          if (sortOrder === 'desc') {
            return bValue > aValue ? 1 : -1;
          } else {
            return aValue > bValue ? 1 : -1;
          }
        });
        
        console.log('✅ Plans de traitement récupérés (simple):', plans.length);
        return plans;
      }
      
      // Pour les requêtes complexes, construire avec filtres
      let constraints = [where('userId', '==', userId)];
      
      // Ajouter les filtres
      if (filters.patientId) {
        constraints.push(where('patientId', '==', filters.patientId));
      }
      
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      
      if (filters.referringDoctorId) {
        constraints.push(where('basicInfo.referringDoctorId', '==', filters.referringDoctorId));
      }
      
      if (filters.priority) {
        constraints.push(where('priority', '==', filters.priority));
      }
      
      // Éviter orderBy si possible pour éviter l'index
      if (filters.forceOrderBy) {
        const sortBy = filters.sortBy || 'createdAt';
        const sortOrder = filters.sortOrder || 'desc';
        constraints.push(orderBy(sortBy, sortOrder));
      }
      
      // Pagination
      if (filters.limitCount) {
        constraints.push(limit(filters.limitCount));
      }
      
      if (filters.startAfterDoc) {
        constraints.push(startAfter(filters.startAfterDoc));
      }
      
      const q = query(plansRef, ...constraints);
      console.log('📋 Requête créée avec contraintes:', constraints.length);
      
      const snapshot = await getDocs(q);
      console.log('📄 Snapshot reçu, nombre de docs:', snapshot.size);
      
      const plans = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🦷 Plan trouvé:', doc.id, data.planNumber);
        plans.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          startDate: data.timeline?.startDate?.toDate?.() || null,
          endDate: data.timeline?.endDate?.toDate?.() || null,
          lastAppointment: data.timeline?.lastAppointment?.toDate?.() || null
        });
      });
      
      console.log('✅ Plans de traitement récupérés:', plans.length);
      return plans;
    } catch (error) {
      console.error('Erreur lors de la récupération des plans de traitement:', error);
      throw new Error(`Impossible de récupérer les plans de traitement: ${error.message}`);
    }
  }

  /**
   * Obtenir un plan de traitement spécifique
   * @param {string} planId - ID du plan de traitement
   * @returns {Promise<Object>} Plan de traitement
   */
  async getTreatmentPlan(planId) {
    try {
      console.log('🔍 getTreatmentPlan pour ID:', planId);
      const db = getDb();
      const planRef = doc(db, this.collection, planId);
      
      const docSnap = await getDoc(planRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('✅ Plan de traitement trouvé:', data.planNumber);
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          startDate: data.timeline?.startDate?.toDate?.() || null,
          endDate: data.timeline?.endDate?.toDate?.() || null,
          lastAppointment: data.timeline?.lastAppointment?.toDate?.() || null
        };
      } else {
        throw new Error('Plan de traitement non trouvé');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du plan de traitement:', error);
      throw new Error(`Impossible de récupérer le plan de traitement: ${error.message}`);
    }
  }

  /**
   * Obtenir les plans de traitement d'un patient
   * @param {string} patientId - ID du patient
   * @returns {Promise<Array>} Plans de traitement du patient
   */
  async getTreatmentPlansByPatient(patientId) {
    try {
      console.log('🔍 getTreatmentPlansByPatient pour patient:', patientId);
      const db = getDb();
      const plansRef = collection(db, this.collection);
      
      // Requête simple sans orderBy pour éviter l'index
      const q = query(
        plansRef,
        where('patientId', '==', patientId)
      );
      
      const snapshot = await getDocs(q);
      const plans = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        plans.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          startDate: data.timeline?.startDate?.toDate?.() || null,
          endDate: data.timeline?.endDate?.toDate?.() || null,
          lastAppointment: data.timeline?.lastAppointment?.toDate?.() || null
        });
      });
      
      // Tri côté client pour éviter l'index
      plans.sort((a, b) => {
        const dateA = a.createdAt || new Date(0);
        const dateB = b.createdAt || new Date(0);
        return dateB - dateA; // Tri décroissant
      });
      
      console.log('✅ Plans du patient récupérés:', plans.length);
      return plans;
    } catch (error) {
      console.error('Erreur lors de la récupération des plans du patient:', error);
      throw new Error(`Impossible de récupérer les plans du patient: ${error.message}`);
    }
  }

  /**
   * Ajouter un nouveau plan de traitement
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} planData - Données du plan de traitement
   * @returns {Promise<Object>} Plan de traitement créé
   */
  async addTreatmentPlan(userId, planData) {
    try {
      console.log('🦷 Ajout plan de traitement avec données:', planData);
      
      // Valider les données
      const validation = this.validateTreatmentPlan(planData);
      if (!validation.isValid) {
        throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
      }
      
      const db = getDb();
      const plansRef = collection(db, this.collection);
      
      // Générer un numéro de plan unique
      const planNumber = await this.generatePlanNumber(userId);
      
      // Calculer les statistiques du plan
      const statistics = this.calculatePlanStatistics(planData.phases || []);
      
      const newPlan = {
        userId: userId,
        patientId: planData.patientId,
        quoteId: planData.quoteId || null,
        planNumber: planNumber,
        version: 1,
        status: planData.status || 'planifie',
        priority: planData.priority || 'normale',
        basicInfo: {
          title: planData.basicInfo?.title || 'Plan de traitement',
          description: planData.basicInfo?.description || '',
          referringDoctorId: planData.basicInfo?.referringDoctorId || null,
          objectives: planData.basicInfo?.objectives || [],
          notes: planData.basicInfo?.notes || ''
        },
        patientInfo: {
          healthStatus: planData.patientInfo?.healthStatus || '',
          allergies: planData.patientInfo?.allergies || [],
          medications: planData.patientInfo?.medications || [],
          medicalHistory: planData.patientInfo?.medicalHistory || '',
          contraindications: planData.patientInfo?.contraindications || []
        },
        phases: planData.phases || [],
        timeline: {
          startDate: planData.timeline?.startDate || null,
          endDate: planData.timeline?.endDate || null,
          estimatedDuration: planData.timeline?.estimatedDuration || 0,
          lastAppointment: null
        },
        statistics: statistics,
        geminiData: planData.geminiData || null,
        attachments: planData.attachments || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('💾 Sauvegarde plan dans Firestore...');
      const docRef = await addDoc(plansRef, newPlan);
      
      const result = {
        id: docRef.id,
        ...newPlan,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('✅ Plan de traitement ajouté avec succès:', result.id);
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du plan de traitement:', error);
      throw new Error(`Impossible d'ajouter le plan de traitement: ${error.message}`);
    }
  }

  /**
   * Mettre à jour un plan de traitement
   * @param {string} planId - ID du plan de traitement
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<Object>} Plan de traitement mis à jour
   */
  async updateTreatmentPlan(planId, updates) {
    try {
      console.log('📝 Mise à jour plan de traitement:', planId, updates);
      const db = getDb();
      const planRef = doc(db, this.collection, planId);
      
      // Recalculer les statistiques si les phases ont été modifiées
      if (updates.phases) {
        updates.statistics = this.calculatePlanStatistics(updates.phases);
      }
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(planRef, updateData);
      
      console.log('✅ Plan de traitement mis à jour avec succès');
      return {
        id: planId,
        ...updates,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du plan de traitement:', error);
      throw new Error(`Impossible de mettre à jour le plan de traitement: ${error.message}`);
    }
  }

  /**
   * Supprimer un plan de traitement
   * @param {string} planId - ID du plan de traitement
   * @returns {Promise<void>}
   */
  async deleteTreatmentPlan(planId) {
    try {
      console.log('🗑️ Suppression plan de traitement:', planId);
      const db = getDb();
      const planRef = doc(db, this.collection, planId);
      await deleteDoc(planRef);
      console.log('✅ Plan de traitement supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du plan de traitement:', error);
      throw new Error(`Impossible de supprimer le plan de traitement: ${error.message}`);
    }
  }

  /**
   * Créer une nouvelle version d'un plan de traitement
   * @param {string} planId - ID du plan original
   * @returns {Promise<Object>} Nouvelle version du plan
   */
  async createPlanVersion(planId) {
    try {
      console.log('📋 Création nouvelle version du plan:', planId);
      
      // Récupérer le plan original
      const originalPlan = await this.getTreatmentPlan(planId);
      
      // Créer une nouvelle version
      const newVersion = {
        ...originalPlan,
        version: (originalPlan.version || 1) + 1,
        status: 'planifie',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Supprimer l'ID pour créer un nouveau document
      delete newVersion.id;
      
      const db = getDb();
      const plansRef = collection(db, this.collection);
      const docRef = await addDoc(plansRef, newVersion);
      
      const result = {
        id: docRef.id,
        ...newVersion,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('✅ Nouvelle version créée:', result.id);
      return result;
    } catch (error) {
      console.error('Erreur lors de la création de version:', error);
      throw new Error(`Impossible de créer une nouvelle version: ${error.message}`);
    }
  }

  /**
   * Dupliquer un plan de traitement
   * @param {string} planId - ID du plan à dupliquer
   * @returns {Promise<Object>} Plan dupliqué
   */
  async duplicateTreatmentPlan(planId) {
    try {
      console.log('📋 Duplication plan de traitement:', planId);
      
      const originalPlan = await this.getTreatmentPlan(planId);
      
      // Créer une copie
      const duplicatedPlan = {
        ...originalPlan,
        status: 'planifie'
      };
      
      // Supprimer l'ID et les timestamps pour créer un nouveau document
      delete duplicatedPlan.id;
      delete duplicatedPlan.createdAt;
      delete duplicatedPlan.updatedAt;
      
      return await this.addTreatmentPlan(originalPlan.userId, duplicatedPlan);
    } catch (error) {
      console.error('Erreur lors de la duplication du plan:', error);
      throw new Error(`Impossible de dupliquer le plan: ${error.message}`);
    }
  }

  /**
   * Démarrer un plan de traitement
   * @param {string} planId - ID du plan
   * @returns {Promise<Object>} Plan démarré
   */
  async startTreatmentPlan(planId) {
    try {
      console.log('▶️ Démarrage plan de traitement:', planId);
      
      const updates = {
        status: 'en_cours',
        'timeline.startDate': serverTimestamp()
      };
      
      return await this.updateTreatmentPlan(planId, updates);
    } catch (error) {
      console.error('Erreur lors du démarrage du plan:', error);
      throw new Error(`Impossible de démarrer le plan: ${error.message}`);
    }
  }

  /**
   * Terminer un plan de traitement
   * @param {string} planId - ID du plan
   * @returns {Promise<Object>} Plan terminé
   */
  async completeTreatmentPlan(planId) {
    try {
      console.log('✅ Finalisation plan de traitement:', planId);
      
      const updates = {
        status: 'termine',
        'timeline.endDate': serverTimestamp()
      };
      
      return await this.updateTreatmentPlan(planId, updates);
    } catch (error) {
      console.error('Erreur lors de la finalisation du plan:', error);
      throw new Error(`Impossible de terminer le plan: ${error.message}`);
    }
  }

  /**
   * Suspendre un plan de traitement
   * @param {string} planId - ID du plan
   * @param {string} reason - Raison de la suspension
   * @returns {Promise<Object>} Plan suspendu
   */
  async suspendTreatmentPlan(planId, reason = '') {
    try {
      console.log('⏸️ Suspension plan de traitement:', planId);
      
      const updates = {
        status: 'suspendu',
        'basicInfo.suspensionReason': reason
      };
      
      return await this.updateTreatmentPlan(planId, updates);
    } catch (error) {
      console.error('Erreur lors de la suspension du plan:', error);
      throw new Error(`Impossible de suspendre le plan: ${error.message}`);
    }
  }

  /**
   * Reprendre un plan de traitement suspendu
   * @param {string} planId - ID du plan
   * @returns {Promise<Object>} Plan repris
   */
  async resumeTreatmentPlan(planId) {
    try {
      console.log('▶️ Reprise plan de traitement:', planId);
      
      const updates = {
        status: 'en_cours',
        'basicInfo.suspensionReason': null
      };
      
      return await this.updateTreatmentPlan(planId, updates);
    } catch (error) {
      console.error('Erreur lors de la reprise du plan:', error);
      throw new Error(`Impossible de reprendre le plan: ${error.message}`);
    }
  }

  /**
   * Mettre à jour le progrès d'une phase
   * @param {string} planId - ID du plan
   * @param {string} phaseId - ID de la phase
   * @param {number} progress - Progrès (0-100)
   * @returns {Promise<Object>} Plan mis à jour
   */
  async updatePhaseProgress(planId, phaseId, progress) {
    try {
      console.log('📊 Mise à jour progrès phase:', planId, phaseId, progress);
      
      const plan = await this.getTreatmentPlan(planId);
      const updatedPhases = plan.phases.map(phase => {
        if (phase.id === phaseId) {
          return {
            ...phase,
            progress: Math.max(0, Math.min(100, progress)),
            status: progress === 100 ? 'termine' : (progress > 0 ? 'en_cours' : 'planifie')
          };
        }
        return phase;
      });
      
      const updates = {
        phases: updatedPhases,
        statistics: this.calculatePlanStatistics(updatedPhases)
      };
      
      return await this.updateTreatmentPlan(planId, updates);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du progrès:', error);
      throw new Error(`Impossible de mettre à jour le progrès: ${error.message}`);
    }
  }

  /**
   * Ajouter un rendez-vous à un plan
   * @param {string} planId - ID du plan
   * @param {Object} appointment - Données du rendez-vous
   * @returns {Promise<Object>} Plan mis à jour
   */
  async addAppointment(planId, appointment) {
    try {
      console.log('📅 Ajout rendez-vous au plan:', planId, appointment);
      
      const plan = await this.getTreatmentPlan(planId);
      const appointments = plan.appointments || [];
      
      const newAppointment = {
        id: Date.now().toString(),
        date: appointment.date,
        duration: appointment.duration || 60,
        phaseId: appointment.phaseId,
        treatmentIds: appointment.treatmentIds || [],
        notes: appointment.notes || '',
        status: appointment.status || 'planifie',
        createdAt: new Date()
      };
      
      appointments.push(newAppointment);
      
      const updates = {
        appointments: appointments,
        'timeline.lastAppointment': appointment.date
      };
      
      return await this.updateTreatmentPlan(planId, updates);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du rendez-vous:', error);
      throw new Error(`Impossible d'ajouter le rendez-vous: ${error.message}`);
    }
  }

  /**
   * Calculer les statistiques d'un plan de traitement
   * @param {Array} phases - Phases du plan
   * @returns {Object} Statistiques calculées
   */
  calculatePlanStatistics(phases) {
    let totalTreatments = 0;
    let completedTreatments = 0;
    let totalSessions = 0;
    let completedSessions = 0;
    let totalCost = 0;
    let estimatedDuration = 0;
    
    phases.forEach(phase => {
      if (phase.treatments) {
        totalTreatments += phase.treatments.length;
        totalSessions += phase.sessions || 1;
        estimatedDuration += phase.estimatedDuration || 0;
        
        if (phase.status === 'termine') {
          completedTreatments += phase.treatments.length;
          completedSessions += phase.sessions || 1;
        }
        
        phase.treatments.forEach(treatment => {
          totalCost += (treatment.fees || 0);
        });
      }
    });
    
    const progressPercentage = totalTreatments > 0 
      ? Math.round((completedTreatments / totalTreatments) * 100) 
      : 0;
    
    return {
      totalPhases: phases.length,
      completedPhases: phases.filter(p => p.status === 'termine').length,
      totalTreatments: totalTreatments,
      completedTreatments: completedTreatments,
      totalSessions: totalSessions,
      completedSessions: completedSessions,
      totalCost: totalCost,
      estimatedDuration: estimatedDuration,
      progressPercentage: progressPercentage
    };
  }

  /**
   * Générer un numéro de plan unique
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<string>} Numéro de plan
   */
  async generatePlanNumber(userId) {
    try {
      // Format: PT-YYYY-NNNN (PT pour Plan de Traitement, année, numéro séquentiel)
      const year = new Date().getFullYear();
      
      // Utiliser une requête simplifiée pour éviter l'index manquant
      const db = getDb();
      const plansRef = collection(db, this.collection);
      const q = query(plansRef, where('userId', '==', userId));
      
      const snapshot = await getDocs(q);
      const planCount = snapshot.size + 1;
      
      return `PT-${year}-${planCount.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Erreur lors de la génération du numéro de plan:', error);
      // Fallback avec timestamp pour garantir l'unicité
      const timestamp = Date.now().toString().slice(-4);
      return `PT-${new Date().getFullYear()}-${timestamp}`;
    }
  }

  /**
   * Écouter les changements des plans de traitement en temps réel
   * @param {string} userId - ID de l'utilisateur
   * @param {Function} callback - Fonction appelée lors des changements
   * @returns {Function} Fonction pour arrêter l'écoute
   */
  subscribeToTreatmentPlans(userId, callback) {
    try {
      console.log('🔥 subscribeToTreatmentPlans pour userId:', userId);
      const db = getDb();
      const plansRef = collection(db, this.collection);
      
      const q = query(
        plansRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(
        q,
        (snapshot) => {
          console.log('🔥 Snapshot temps réel reçu, nombre de docs:', snapshot.size);
          const plans = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            plans.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
              startDate: data.timeline?.startDate?.toDate?.() || null,
              endDate: data.timeline?.endDate?.toDate?.() || null,
              lastAppointment: data.timeline?.lastAppointment?.toDate?.() || null
            });
          });
          
          console.log('🔥 Plans temps réel:', plans.length);
          callback(plans);
        },
        (error) => {
          console.error('Erreur lors de l\'écoute des plans:', error);
          callback([]);
        }
      );
    } catch (error) {
      console.error('Erreur lors de la création de l\'écoute:', error);
      callback([]);
      return () => {};
    }
  }

  /**
   * Écouter les plans d'un patient en temps réel
   * @param {string} patientId - ID du patient
   * @param {Function} callback - Fonction appelée lors des changements
   * @returns {Function} Fonction pour arrêter l'écoute
   */
  subscribeToPatientTreatmentPlans(patientId, callback) {
    try {
      console.log('🔥 subscribeToPatientTreatmentPlans pour patient:', patientId);
      const db = getDb();
      const plansRef = collection(db, this.collection);
      
      // Requête simple sans orderBy pour éviter l'index
      const q = query(
        plansRef,
        where('patientId', '==', patientId)
      );
      
      return onSnapshot(
        q,
        (snapshot) => {
          const plans = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            plans.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
              startDate: data.timeline?.startDate?.toDate?.() || null,
              endDate: data.timeline?.endDate?.toDate?.() || null,
              lastAppointment: data.timeline?.lastAppointment?.toDate?.() || null
            });
          });
          
          // Tri côté client pour éviter l'index
          plans.sort((a, b) => {
            const dateA = a.createdAt || new Date(0);
            const dateB = b.createdAt || new Date(0);
            return dateB - dateA; // Tri décroissant
          });
          
          callback(plans);
        },
        (error) => {
          console.error('Erreur lors de l\'écoute des plans du patient:', error);
          callback([]);
        }
      );
    } catch (error) {
      console.error('Erreur lors de la création de l\'écoute:', error);
      callback([]);
      return () => {};
    }
  }

  /**
   * Valider les données d'un plan de traitement
   * @param {Object} planData - Données à valider
   * @returns {Object} Résultat de la validation
   */
  validateTreatmentPlan(planData) {
    const errors = [];
    
    // Validation du patient
    if (!planData.patientId) {
      errors.push('L\'ID du patient est requis');
    }
    
    // Validation des informations de base
    if (!planData.basicInfo?.title || planData.basicInfo.title.trim().length < 2) {
      errors.push('Le titre du plan est requis');
    }
    
    if (!planData.basicInfo?.referringDoctorId) {
      errors.push('Le médecin référent est requis');
    }
    
    // Validation des phases
    if (!planData.phases || planData.phases.length === 0) {
      errors.push('Au moins une phase de traitement est requise');
    } else {
      planData.phases.forEach((phase, index) => {
        if (!phase.name || phase.name.trim().length < 2) {
          errors.push(`Le nom de la phase ${index + 1} est requis`);
        }
        
        if (!phase.treatments || phase.treatments.length === 0) {
          errors.push(`La phase ${index + 1} doit contenir au moins un traitement`);
        } else {
          phase.treatments.forEach((treatment, treatmentIndex) => {
            if (!treatment.name || treatment.name.trim().length < 2) {
              errors.push(`Le nom du traitement ${treatmentIndex + 1} de la phase ${index + 1} est requis`);
            }
          });
        }
      });
    }
    
    // Validation du statut
    const validStatuses = ['planifie', 'en_cours', 'suspendu', 'termine', 'annule'];
    if (planData.status && !validStatuses.includes(planData.status)) {
      errors.push('Le statut doit être: planifie, en_cours, suspendu, termine ou annule');
    }
    
    // Validation de la priorité
    const validPriorities = ['faible', 'normale', 'haute', 'urgente'];
    if (planData.priority && !validPriorities.includes(planData.priority)) {
      errors.push('La priorité doit être: faible, normale, haute ou urgente');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Créer un plan de traitement depuis un devis
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} quote - Devis source
   * @returns {Promise<Object>} Plan de traitement créé
   */
  async createFromQuote(userId, quote) {
    try {
      console.log('💰➡️🦷 Création plan depuis devis:', quote.id);
      
      const planData = {
        patientId: quote.patientId,
        quoteId: quote.id,
        basicInfo: {
          title: `Plan de traitement - ${quote.quoteNumber}`,
          description: quote.patientInfo?.treatmentSummary || '',
          referringDoctorId: quote.basicInfo?.referringDoctorId,
          objectives: [],
          notes: ''
        },
        patientInfo: {
          healthStatus: quote.patientInfo?.healthStatus || '',
          allergies: [],
          medications: [],
          medicalHistory: '',
          contraindications: []
        },
        phases: quote.phases.map(phase => ({
          ...phase,
          status: 'planifie',
          progress: 0,
          estimatedDuration: phase.sessions || 1
        })),
        timeline: {
          startDate: null,
          endDate: null,
          estimatedDuration: quote.phases.reduce((total, phase) => total + (phase.sessions || 1), 0)
        },
        priority: 'normale',
        status: 'planifie'
      };
      
      return await this.addTreatmentPlan(userId, planData);
    } catch (error) {
      console.error('Erreur lors de la création depuis devis:', error);
      throw new Error(`Impossible de créer le plan depuis le devis: ${error.message}`);
    }
  }

  /**
   * Créer un plan de traitement depuis les données Gemini
   * @param {string} userId - ID de l'utilisateur
   * @param {string} patientId - ID du patient
   * @param {Object} geminiData - Données extraites par Gemini
   * @param {string} referringDoctorId - ID du médecin référent
   * @returns {Promise<Object>} Plan de traitement créé
   */
  async createFromGeminiData(userId, patientId, geminiData, referringDoctorId = null) {
    try {
      console.log('🤖 Création plan depuis données Gemini:', geminiData);
      
      // Mapper les données Gemini vers la structure de plan de traitement
      const planData = {
        patientId: patientId,
        basicInfo: {
          title: geminiData.titre_plan || 'Plan de traitement',
          description: geminiData.resume_langage_commun || '',
          referringDoctorId: referringDoctorId,
          objectives: geminiData.objectifs || [],
          notes: geminiData.notes_praticien || ''
        },
        patientInfo: {
          healthStatus: Array.isArray(geminiData.etat_general)
            ? geminiData.etat_general.join('. ')
            : (geminiData.etat_general || ''),
          allergies: geminiData.allergies || [],
          medications: geminiData.medicaments || [],
          medicalHistory: geminiData.antecedents_medicaux || '',
          contraindications: geminiData.contre_indications || []
        },
        phases: this.mapGeminiPhasesToPlanPhases(geminiData.phases || []),
        timeline: {
          estimatedDuration: geminiData.duree_estimee_totale || 0
        },
        priority: geminiData.priorite || 'normale',
        geminiData: geminiData
      };
      
      return await this.addTreatmentPlan(userId, planData);
    } catch (error) {
      console.error('Erreur lors de la création depuis Gemini:', error);
      throw new Error(`Impossible de créer le plan depuis Gemini: ${error.message}`);
    }
  }

  /**
   * Mapper les phases Gemini vers les phases de plan de traitement
   * @param {Array} geminiPhases - Phases Gemini
   * @returns {Array} Phases de plan de traitement
   */
  mapGeminiPhasesToPlanPhases(geminiPhases) {
    return geminiPhases.map((phase, index) => {
      const treatments = [];
      
      // Traiter les groupes d'actes ou les actes directs
      if (phase.groupes_actes) {
        phase.groupes_actes.forEach((groupe) => {
          groupe.actes?.forEach((acte) => {
            treatments.push({
              id: Date.now() + Math.random(),
              name: acte.libelle || 'Traitement',
              description: acte.description || '',
              fees: acte.cout_total || acte.cout || 0,
              unitCost: acte.cout_unitaire || null,
              quantity: acte.dents ? (Array.isArray(acte.dents) ? acte.dents.length : 1) : 1,
              sessions: acte.nombre_seances || 1,
              teeth: Array.isArray(acte.dents) ? acte.dents.join(', ') : (acte.dents || ''),
              category: groupe.type || 'Général',
              status: 'planifie',
              progress: 0
            });
          });
        });
      } else if (phase.actes) {
        treatments.push(...phase.actes.map((acte) => ({
          id: Date.now() + Math.random(),
          name: acte.libelle || 'Traitement',
          description: acte.description || '',
          fees: acte.prix_total_acte || acte.honoraires_ligne || acte.cout || 0,
          unitCost: acte.cout_unitaire || null,
          quantity: acte.dents ? (Array.isArray(acte.dents) ? acte.dents.length : 1) : 1,
          sessions: acte.nombre_seances || 1,
          teeth: Array.isArray(acte.dents) ? acte.dents.join(', ') : (acte.dents || ''),
          category: 'Général',
          status: 'planifie',
          progress: 0
        })));
      }
      
      return {
        id: Date.now() + index,
        name: phase.nom || `Phase ${index + 1}`,
        description: phase.description_phase || phase.resume || '',
        sessions: phase.nombre_seances_estime || phase.nombre_seances || 1,
        estimatedDuration: phase.duree_estimee || 0,
        status: 'planifie',
        progress: 0,
        treatments: treatments
      };
    });
  }

  /**
   * Obtenir un résumé des statistiques pour un patient
   * @param {string} patientId - ID du patient
   * @returns {Promise<Object>} Résumé des statistiques
   */
  async getPatientTreatmentSummary(patientId) {
    try {
      const plans = await this.getTreatmentPlansByPatient(patientId);
      
      let totalPlans = plans.length;
      let activePlans = plans.filter(p => ['planifie', 'en_cours'].includes(p.status)).length;
      let completedPlans = plans.filter(p => p.status === 'termine').length;
      let totalCost = 0;
      let totalProgress = 0;
      
      plans.forEach(plan => {
        if (plan.statistics) {
          totalCost += plan.statistics.totalCost || 0;
          totalProgress += plan.statistics.progressPercentage || 0;
        }
      });
      
      const averageProgress = totalPlans > 0 ? Math.round(totalProgress / totalPlans) : 0;
      
      return {
        totalPlans,
        activePlans,
        completedPlans,
        totalCost,
        averageProgress,
        lastPlan: plans[0] || null
      };
    } catch (error) {
      console.error('Erreur lors du calcul du résumé patient:', error);
      return {
        totalPlans: 0,
        activePlans: 0,
        completedPlans: 0,
        totalCost: 0,
        averageProgress: 0,
        lastPlan: null
      };
    }
  }

  /**
   * Créer un plan de traitement depuis les données Gemini SANS VALIDATION
   * Pour le nouveau format avec tâches
   * @param {string} userId - ID de l'utilisateur
   * @param {string} patientIdOrQuoteId - ID du patient ou ID du devis (architecture quote-centric)
   * @param {Object} geminiData - Données brutes de Gemini
   * @param {string} referringDoctorId - ID du médecin référent
   * @param {string} patientName - Nom du patient (optionnel, pour architecture quote-centric)
   * @returns {Promise<Object>} Plan de traitement créé
   */
  async createFromGeminiDataNoValidation(userId, patientIdOrQuoteId, geminiData, referringDoctorId = null, patientName = null) {
    try {
      console.log('🎯 [createFromGeminiDataNoValidation] Début création plan de traitement:', {
        userId,
        patientIdOrQuoteId,
        hasGeminiData: !!geminiData,
        referringDoctorId,
        patientName
      });

      // Dans l'architecture quote-centric, on utilise directement le nom fourni
      let patientFullName = patientName;
      
      // Si pas de nom fourni, essayer de récupérer depuis l'ancien système patient
      if (!patientFullName) {
        try {
          const db = getDb();
          const patientDoc = await db.collection('users').doc(userId).collection('patients').doc(patientIdOrQuoteId).get();
          if (patientDoc.exists) {
            const patientData = patientDoc.data();
            patientFullName = patientData.fullName;
            console.log('👤 [createFromGeminiDataNoValidation] Patient récupéré (fallback):', patientFullName);
          }
        } catch (error) {
          console.warn('⚠️ [createFromGeminiDataNoValidation] Impossible de récupérer le patient, utilisation du nom par défaut');
          patientFullName = 'Patient';
        }
      }
      
      console.log('👤 [createFromGeminiDataNoValidation] Nom patient final:', patientFullName);
      
      const db = getDb();
      const plansRef = collection(db, this.collection);
      
      // Générer un numéro de plan unique
      const planNumber = await this.generatePlanNumber(userId);
      
      // Créer une phase factice pour contourner la validation
      // mais stocker les vraies données dans geminiData
      const dummyPhase = {
        id: Date.now(),
        name: 'Phase générée automatiquement',
        description: 'Phase créée pour stocker les tâches ordonnancées',
        treatments: [{
          id: Date.now() + 1,
          name: 'Traitement placeholder',
          fees: 0
        }],
        sessions: 1,
        status: 'planifie',
        progress: 0
      };
      
      // Extraire la réponse brute si elle est dans geminiRawResponse
      let rawResponse = geminiData.geminiRawResponse || geminiData;
      
      // S'assurer que les données sont un objet, pas une chaîne
      if (typeof rawResponse === 'string') {
        try {
          // Nettoyer les backticks markdown si présents
          let cleanedResponse = rawResponse;
          
          // Retirer les backticks markdown (```json au début et ``` à la fin)
          if (cleanedResponse.includes('```json')) {
            console.log('🧹 Nettoyage des backticks markdown détectés');
            cleanedResponse = cleanedResponse.replace(/```json\s*/g, '');
            cleanedResponse = cleanedResponse.replace(/```\s*$/g, '');
            cleanedResponse = cleanedResponse.trim();
          }
          
          // Aussi gérer le cas où il y a juste ``` au début
          if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```\w*\s*/, '');
            cleanedResponse = cleanedResponse.replace(/```\s*$/, '');
            cleanedResponse = cleanedResponse.trim();
          }
          
          rawResponse = JSON.parse(cleanedResponse);
          console.log('📋 RawResponse parsé depuis string dans createFromGeminiDataNoValidation');
        } catch (e) {
          console.error('❌ Erreur parsing rawResponse:', e);
          console.error('❌ String originale:', rawResponse?.substring(0, 200) + '...');
          // Garder la chaîne telle quelle si le parsing échoue
        }
      }
      
      console.log('💾 Format des données à sauvegarder:', {
        type: typeof rawResponse,
        hasTaches: !!rawResponse.taches,
        tachesCount: rawResponse.taches?.length || 0,
        firstTask: rawResponse.taches?.[0]?.nom || 'N/A'
      });
      
      const newPlan = {
        userId: userId,
        patientId: patientIdOrQuoteId, // Compatible avec l'architecture quote-centric
        quoteId: null,
        planNumber: planNumber,
        version: 1,
        status: 'planifie',
        priority: 'normale',
        basicInfo: {
          title: `Plan de traitement - ${patientFullName}`,
          description: 'Plan généré avec le nouveau prompt d\'ordonnancement',
          referringDoctorId: referringDoctorId,
          objectives: [],
          notes: 'Ce plan contient des tâches ordonnancées au lieu de phases traditionnelles'
        },
        patientInfo: {
          healthStatus: '',
          allergies: [],
          medications: [],
          medicalHistory: '',
          contraindications: []
        },
        phases: [dummyPhase], // Phase factice pour passer la validation
        timeline: {
          startDate: null,
          endDate: null,
          estimatedDuration: 0,
          lastAppointment: null
        },
        statistics: {
          totalPhases: 1,
          completedPhases: 0,
          totalTreatments: 1,
          completedTreatments: 0,
          totalSessions: 1,
          completedSessions: 0,
          totalCost: 0,
          estimatedDuration: 0,
          progressPercentage: 0
        },
        geminiData: rawResponse, // Stocker la réponse brute ici
        attachments: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('💾 Sauvegarde plan dans Firestore (sans validation)...');
      const docRef = await addDoc(plansRef, newPlan);
      
      const result = {
        id: docRef.id,
        ...newPlan,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('✅ Plan de traitement ajouté avec succès (sans validation):', result.id);
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du plan de traitement (sans validation):', error);
      throw new Error(`Impossible d'ajouter le plan de traitement: ${error.message}`);
    }
  }
}

// Exporter une instance unique du service
export default new TreatmentPlansService();