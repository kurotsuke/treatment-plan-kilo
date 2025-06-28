/**
 * Service des plans de traitement refactorisé avec la nouvelle couche d'abstraction
 * Version 2.0 - Utilise BaseRepository pour éliminer la redondance
 */
import { BaseRepository, BaseSchema, ValidationTypes } from '../../core/firebase';

// Schéma de validation pour les plans de traitement
const TreatmentPlanSchema = new BaseSchema({
  patientId: [ValidationTypes.REQUIRED, ValidationTypes.STRING],
  quoteId: ValidationTypes.STRING,
  planNumber: ValidationTypes.STRING,
  version: ValidationTypes.NUMBER,
  status: (value) => {
    if (!value) return true; // Optionnel
    const validStatuses = ['planifie', 'en_cours', 'suspendu', 'termine', 'annule'];
    return validStatuses.includes(value) || 'Le statut doit être: planifie, en_cours, suspendu, termine ou annule';
  },
  priority: (value) => {
    if (!value) return true; // Optionnel
    const validPriorities = ['faible', 'normale', 'haute', 'urgente'];
    return validPriorities.includes(value) || 'La priorité doit être: faible, normale, haute ou urgente';
  },
  'basicInfo.title': [ValidationTypes.REQUIRED, ValidationTypes.STRING],
  'basicInfo.description': ValidationTypes.STRING,
  'basicInfo.referringDoctorId': ValidationTypes.STRING,
  'basicInfo.objectives': ValidationTypes.ARRAY,
  'basicInfo.notes': ValidationTypes.STRING,
  'patientInfo.healthStatus': ValidationTypes.STRING,
  'patientInfo.allergies': ValidationTypes.ARRAY,
  'patientInfo.medications': ValidationTypes.ARRAY,
  'patientInfo.medicalHistory': ValidationTypes.STRING,
  'patientInfo.contraindications': ValidationTypes.ARRAY,
  phases: [ValidationTypes.REQUIRED, ValidationTypes.ARRAY],
  'timeline.estimatedDuration': ValidationTypes.NUMBER,
  'statistics.totalPhases': ValidationTypes.NUMBER,
  'statistics.totalCost': ValidationTypes.NUMBER,
  attachments: ValidationTypes.ARRAY
});

class TreatmentPlansServiceV2 extends BaseRepository {
  constructor() {
    super('treatmentPlans', TreatmentPlanSchema);
    console.log('🦷 TreatmentPlansServiceV2 initialisé avec BaseRepository');
  }

  /**
   * Obtenir tous les plans de traitement d'un utilisateur avec filtres optionnels
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} filters - Filtres optionnels
   * @returns {Promise<Array>} Liste des plans de traitement
   */
  async getTreatmentPlans(userId, filters = {}) {
    console.log('🦷 getTreatmentPlans V2 pour userId:', userId, 'avec filtres:', filters);
    
    // Utiliser la méthode héritée de BaseRepository
    const plans = await this.findAll(userId, filters);
    
    console.log('✅ Plans de traitement récupérés V2:', plans.length);
    return plans;
  }

  /**
   * Obtenir un plan de traitement spécifique
   * @param {string} planId - ID du plan de traitement
   * @param {string} userId - ID de l'utilisateur (pour le cache)
   * @returns {Promise<Object>} Plan de traitement
   */
  async getTreatmentPlan(planId, userId = null) {
    console.log('🦷 getTreatmentPlan V2 pour ID:', planId);
    
    const plan = await this.read(planId, userId);
    
    if (!plan) {
      throw new Error('Plan de traitement non trouvé');
    }
    
    console.log('✅ Plan de traitement trouvé V2:', plan.planNumber);
    return plan;
  }

  /**
   * Obtenir les plans de traitement d'un patient
   * @param {string} patientId - ID du patient
   * @returns {Promise<Array>} Plans de traitement du patient
   */
  async getTreatmentPlansByPatient(patientId) {
    console.log('🦷 getTreatmentPlansByPatient V2 pour patient:', patientId);
    
    // Utiliser une requête spéciale pour les plans par patient
    const db = this.getCollectionRef().firestore;
    const plansRef = this.getCollectionRef();
    
    const QueryBuilder = (await import('../../core/firebase/QueryBuilder.js')).default;
    const query = QueryBuilder.for(plansRef)
      .where('patientId', '==', patientId)
      .orderBy('createdAt', 'desc')
      .build();
    
    const snapshot = await db.getDocs ? await db.getDocs(query) : await query.get();
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
    
    console.log('✅ Plans du patient récupérés V2:', plans.length);
    return plans;
  }

  /**
   * Ajouter un nouveau plan de traitement
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} planData - Données du plan de traitement
   * @returns {Promise<Object>} Plan de traitement créé
   */
  async addTreatmentPlan(userId, planData) {
    console.log('🦷 Ajout plan de traitement V2 avec données:', planData);
    
    // Générer un numéro de plan unique
    const planNumber = await this.generatePlanNumber(userId);
    
    // Calculer les statistiques du plan
    const statistics = this.calculatePlanStatistics(planData.phases || []);
    
    // Structurer les données selon le schéma
    const structuredData = {
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
      attachments: planData.attachments || []
    };
    
    // Utiliser la méthode héritée de BaseRepository (avec validation automatique)
    const newPlan = await this.create(userId, structuredData);
    
    console.log('✅ Plan de traitement ajouté V2:', newPlan.id);
    return newPlan;
  }

  /**
   * Mettre à jour un plan de traitement
   * @param {string} planId - ID du plan de traitement
   * @param {Object} updates - Données à mettre à jour
   * @param {string} userId - ID de l'utilisateur (pour le cache)
   * @returns {Promise<Object>} Plan de traitement mis à jour
   */
  async updateTreatmentPlan(planId, updates, userId = null) {
    console.log('🦷 Mise à jour plan de traitement V2:', planId);
    
    // Recalculer les statistiques si les phases ont été modifiées
    if (updates.phases) {
      updates.statistics = this.calculatePlanStatistics(updates.phases);
    }
    
    // Utiliser la méthode héritée de BaseRepository (avec validation automatique)
    const updatedPlan = await this.update(planId, updates, userId);
    
    console.log('✅ Plan de traitement mis à jour V2:', planId);
    return updatedPlan;
  }

  /**
   * Supprimer un plan de traitement
   * @param {string} planId - ID du plan de traitement
   * @param {string} userId - ID de l'utilisateur (pour le cache)
   * @returns {Promise<void>}
   */
  async deleteTreatmentPlan(planId, userId = null) {
    console.log('🦷 Suppression plan de traitement V2:', planId);
    
    // Utiliser la méthode héritée de BaseRepository
    await this.delete(planId, userId);
    
    console.log('✅ Plan de traitement supprimé V2:', planId);
  }

  /**
   * Créer une nouvelle version d'un plan de traitement
   * @param {string} planId - ID du plan original
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Nouvelle version du plan
   */
  async createPlanVersion(planId, userId = null) {
    console.log('🦷 Création nouvelle version du plan V2:', planId);
    
    // Récupérer le plan original
    const originalPlan = await this.getTreatmentPlan(planId, userId);
    
    // Créer une nouvelle version
    const newVersionData = {
      ...originalPlan,
      version: (originalPlan.version || 1) + 1,
      status: 'planifie'
    };
    
    // Supprimer les champs qui seront régénérés
    delete newVersionData.id;
    delete newVersionData.createdAt;
    delete newVersionData.updatedAt;
    
    const newVersion = await this.create(originalPlan.userId, newVersionData);
    
    console.log('✅ Nouvelle version créée V2:', newVersion.id);
    return newVersion;
  }

  /**
   * Dupliquer un plan de traitement
   * @param {string} planId - ID du plan à dupliquer
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Plan dupliqué
   */
  async duplicateTreatmentPlan(planId, userId = null) {
    console.log('🦷 Duplication plan de traitement V2:', planId);
    
    const originalPlan = await this.getTreatmentPlan(planId, userId);
    
    // Créer une copie
    const duplicatedData = {
      ...originalPlan,
      status: 'planifie'
    };
    
    // Supprimer les champs qui seront régénérés
    delete duplicatedData.id;
    delete duplicatedData.createdAt;
    delete duplicatedData.updatedAt;
    delete duplicatedData.planNumber; // Sera régénéré
    
    const duplicatedPlan = await this.create(originalPlan.userId, duplicatedData);
    
    console.log('✅ Plan de traitement dupliqué V2:', duplicatedPlan.id);
    return duplicatedPlan;
  }

  /**
   * Démarrer un plan de traitement
   * @param {string} planId - ID du plan
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Plan démarré
   */
  async startTreatmentPlan(planId, userId = null) {
    console.log('🦷 Démarrage plan de traitement V2:', planId);
    
    const updates = {
      status: 'en_cours',
      'timeline.startDate': new Date()
    };
    
    const startedPlan = await this.updateTreatmentPlan(planId, updates, userId);
    
    console.log('✅ Plan démarré V2:', planId);
    return startedPlan;
  }

  /**
   * Terminer un plan de traitement
   * @param {string} planId - ID du plan
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Plan terminé
   */
  async completeTreatmentPlan(planId, userId = null) {
    console.log('🦷 Finalisation plan de traitement V2:', planId);
    
    const updates = {
      status: 'termine',
      'timeline.endDate': new Date()
    };
    
    const completedPlan = await this.updateTreatmentPlan(planId, updates, userId);
    
    console.log('✅ Plan terminé V2:', planId);
    return completedPlan;
  }

  /**
   * Suspendre un plan de traitement
   * @param {string} planId - ID du plan
   * @param {string} reason - Raison de la suspension
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Plan suspendu
   */
  async suspendTreatmentPlan(planId, reason = '', userId = null) {
    console.log('🦷 Suspension plan de traitement V2:', planId);
    
    const updates = {
      status: 'suspendu',
      'basicInfo.suspensionReason': reason,
      suspendedAt: new Date()
    };
    
    const suspendedPlan = await this.updateTreatmentPlan(planId, updates, userId);
    
    console.log('✅ Plan suspendu V2:', planId);
    return suspendedPlan;
  }

  /**
   * Reprendre un plan de traitement suspendu
   * @param {string} planId - ID du plan
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Plan repris
   */
  async resumeTreatmentPlan(planId, userId = null) {
    console.log('🦷 Reprise plan de traitement V2:', planId);
    
    const updates = {
      status: 'en_cours',
      'basicInfo.suspensionReason': null,
      resumedAt: new Date()
    };
    
    const resumedPlan = await this.updateTreatmentPlan(planId, updates, userId);
    
    console.log('✅ Plan repris V2:', planId);
    return resumedPlan;
  }

  /**
   * Mettre à jour le progrès d'une phase
   * @param {string} planId - ID du plan
   * @param {string} phaseId - ID de la phase
   * @param {number} progress - Progrès (0-100)
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Plan mis à jour
   */
  async updatePhaseProgress(planId, phaseId, progress, userId = null) {
    console.log('🦷 Mise à jour progrès phase V2:', planId, phaseId, progress);
    
    const plan = await this.getTreatmentPlan(planId, userId);
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
    
    const updatedPlan = await this.updateTreatmentPlan(planId, updates, userId);
    
    console.log('✅ Progrès phase mis à jour V2:', phaseId);
    return updatedPlan;
  }

  /**
   * Ajouter un rendez-vous à un plan
   * @param {string} planId - ID du plan
   * @param {Object} appointment - Données du rendez-vous
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Plan mis à jour
   */
  async addAppointment(planId, appointment, userId = null) {
    console.log('🦷 Ajout rendez-vous au plan V2:', planId, appointment);
    
    const plan = await this.getTreatmentPlan(planId, userId);
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
    
    const updatedPlan = await this.updateTreatmentPlan(planId, updates, userId);
    
    console.log('✅ Rendez-vous ajouté V2:', newAppointment.id);
    return updatedPlan;
  }

  /**
   * S'abonner aux changements des plans de traitement en temps réel
   * @param {string} userId - ID de l'utilisateur
   * @param {Function} callback - Fonction appelée lors des changements
   * @param {Object} filters - Filtres optionnels
   * @returns {Function} Fonction pour arrêter l'écoute
   */
  subscribeToTreatmentPlans(userId, callback, filters = {}) {
    console.log('🔥 subscribeToTreatmentPlans V2 pour userId:', userId);
    
    // Utiliser la méthode héritée de BaseRepository
    return this.subscribe(userId, (plans) => {
      console.log('🔥 Plans temps réel V2:', plans.length);
      callback(plans);
    }, filters);
  }

  /**
   * Écouter les plans d'un patient en temps réel
   * @param {string} patientId - ID du patient
   * @param {Function} callback - Fonction appelée lors des changements
   * @returns {Function} Fonction pour arrêter l'écoute
   */
  subscribeToPatientTreatmentPlans(patientId, callback) {
    console.log('🔥 subscribeToPatientTreatmentPlans V2 pour patient:', patientId);
    
    // Utiliser une requête spéciale pour les plans par patient
    const filters = { patientId: patientId };
    
    return this.subscribe('*', (plans) => {
      // Filtrer côté client pour les plans du patient
      const patientPlans = plans.filter(plan => plan.patientId === patientId);
      console.log('🔥 Plans patient temps réel V2:', patientPlans.length);
      callback(patientPlans);
    }, filters);
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
      
      const plans = await this.getTreatmentPlans(userId);
      const planCount = plans.length + 1;
      
      return `PT-${year}-${planCount.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('❌ Erreur lors de la génération du numéro de plan V2:', error);
      // Fallback avec timestamp pour garantir l'unicité
      const timestamp = Date.now().toString().slice(-4);
      return `PT-${new Date().getFullYear()}-${timestamp}`;
    }
  }

  /**
   * Créer un plan de traitement depuis un devis
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} quote - Devis source
   * @returns {Promise<Object>} Plan de traitement créé
   */
  async createFromQuote(userId, quote) {
    console.log('🦷 Création plan depuis devis V2:', quote.id);
    
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
    
    const newPlan = await this.addTreatmentPlan(userId, planData);
    
    console.log('✅ Plan créé depuis devis V2:', newPlan.id);
    return newPlan;
  }

  /**
   * Créer un plan de traitement depuis les données Gemini
   * @param {string} userId - ID de l'utilisateur
   * @param {string} patientId - ID du patient
   * @param {Object} geminiData - Données extraites par Gemini
   * @returns {Promise<Object>} Plan de traitement créé
   */
  async createFromGeminiData(userId, patientId, geminiData) {
    console.log('🦷 Création plan depuis données Gemini V2:', geminiData);
    
    // Mapper les données Gemini vers la structure de plan de traitement
    const planData = {
      patientId: patientId,
      basicInfo: {
        title: geminiData.titre_plan || 'Plan de traitement',
        description: geminiData.resume_langage_commun || '',
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
    
    const newPlan = await this.addTreatmentPlan(userId, planData);
    
    console.log('✅ Plan créé depuis Gemini V2:', newPlan.id);
    return newPlan;
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
    console.log('🦷 Résumé traitement patient V2:', patientId);
    
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
      
      const summary = {
        totalPlans,
        activePlans,
        completedPlans,
        totalCost,
        averageProgress,
        lastPlan: plans[0] || null
      };
      
      console.log('✅ Résumé calculé V2:', summary);
      return summary;
      
    } catch (error) {
      console.error('❌ Erreur lors du calcul du résumé patient V2:', error);
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
   * Obtenir les statistiques des plans de traitement
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Statistiques
   */
  async getTreatmentPlansStats(userId) {
    console.log('📊 Statistiques plans de traitement V2');
    
    const plans = await this.getTreatmentPlans(userId);
    
    const stats = {
      total: plans.length,
      byStatus: {
        planifie: plans.filter(p => p.status === 'planifie').length,
        en_cours: plans.filter(p => p.status === 'en_cours').length,
        suspendu: plans.filter(p => p.status === 'suspendu').length,
        termine: plans.filter(p => p.status === 'termine').length,
        annule: plans.filter(p => p.status === 'annule').length
      },
      byPriority: {
        faible: plans.filter(p => p.priority === 'faible').length,
        normale: plans.filter(p => p.priority === 'normale').length,
        haute: plans.filter(p => p.priority === 'haute').length,
        urgente: plans.filter(p => p.priority === 'urgente').length
      },
      totalCost: plans.reduce((sum, plan) => sum + (plan.statistics?.totalCost || 0), 0),
      averageCost: plans.length > 0 ?
        plans.reduce((sum, plan) => sum + (plan.statistics?.totalCost || 0), 0) / plans.length : 0,
      averageProgress: plans.length > 0 ?
        plans.reduce((sum, plan) => sum + (plan.statistics?.progressPercentage || 0), 0) / plans.length : 0,
      recentlyCreated: plans.filter(p => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return p.createdAt > weekAgo;
      }).length
    };
    
    console.log('✅ Statistiques calculées V2:', stats);
    return stats;
  }

  /**
   * Exporter les plans de traitement au format JSON
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<string>} JSON des plans
   */
  async exportTreatmentPlans(userId) {
    console.log('📤 Export plans de traitement V2');
    
    const plans = await this.getTreatmentPlans(userId);
    
    // Nettoyer les données pour l'export
    const exportData = plans.map(plan => ({
      id: plan.id,
      planNumber: plan.planNumber,
      patientId: plan.patientId,
      quoteId: plan.quoteId,
      status: plan.status,
      priority: plan.priority,
      basicInfo: plan.basicInfo,
      patientInfo: plan.patientInfo,
      phases: plan.phases,
      timeline: plan.timeline,
      statistics: plan.statistics,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    }));
    
    const jsonData = JSON.stringify(exportData, null, 2);
    console.log('✅ Export terminé V2:', exportData.length, 'plans');
    
    return jsonData;
  }

  /**
   * Valider les données d'un plan de traitement (méthode publique pour compatibilité)
   * @param {Object} planData - Données à valider
   * @returns {Object} Résultat de la validation
   */
  validateTreatmentPlan(planData) {
    // Utiliser le schéma de validation intégré
    return this.schema.validate(planData);
  }
}

// Exporter une instance unique du service
export default new TreatmentPlansServiceV2();

// Exporter aussi la classe pour les tests
export { TreatmentPlansServiceV2 };