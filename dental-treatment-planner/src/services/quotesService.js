/**
 * Service pour la gestion des devis dans Firestore
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

class QuotesService {
  constructor() {
    this.collection = 'quotes';
  }

  /**
   * Obtenir tous les devis d'un utilisateur avec filtres optionnels
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} filters - Filtres optionnels
   * @returns {Promise<Array>} Liste des devis
   */
  async getQuotes(userId, filters = {}) {
    try {
      console.log('🔍 getQuotes pour userId:', userId, 'avec filtres:', filters);
      console.log('🔍 Type de userId:', typeof userId, 'Valeur:', userId);
      
      const db = getDb();
      console.log('🔍 Base de données obtenue:', db ? 'OK' : 'ERREUR');
      
      const quotesRef = collection(db, this.collection);
      console.log('🔍 Référence collection créée:', quotesRef ? 'OK' : 'ERREUR');
      
      // Construire la requête de base
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
      
      // Tri par défaut par date de création (plus récent en premier)
      // Seulement si des filtres de tri sont explicitement demandés
      if (filters.sortBy) {
        const sortBy = filters.sortBy;
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
      
      const q = query(quotesRef, ...constraints);
      console.log('📋 Requête créée avec contraintes:', constraints.length);
      console.log('📋 Contraintes détaillées:', constraints.map(c => c.toString()));
      
      console.log('📋 Tentative d\'exécution de la requête...');
      const snapshot = await getDocs(q);
      console.log('📄 Snapshot reçu avec succès, nombre de docs:', snapshot.size);
      
      const quotes = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('💰 Devis trouvé:', doc.id, data.quoteNumber);
        quotes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          sentAt: data.sentAt?.toDate?.() || null,
          validUntil: data.basicInfo?.validUntil?.toDate?.() || null
        });
      });
      
      console.log('✅ Devis récupérés:', quotes.length);
      return quotes;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des devis:', error);
      console.error('❌ Type d\'erreur:', error.constructor.name);
      console.error('❌ Code d\'erreur:', error.code);
      console.error('❌ Message d\'erreur:', error.message);
      console.error('❌ Stack trace:', error.stack);
      throw new Error(`Impossible de récupérer les devis: ${error.message}`);
    }
  }

  /**
   * Obtenir un devis spécifique
   * @param {string} quoteId - ID du devis
   * @returns {Promise<Object>} Devis
   */
  async getQuote(quoteId) {
    try {
      console.log('🔍 getQuote pour ID:', quoteId);
      const db = getDb();
      const quoteRef = doc(db, this.collection, quoteId);
      
      const docSnap = await getDoc(quoteRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('✅ Devis trouvé:', data.quoteNumber);
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          sentAt: data.sentAt?.toDate?.() || null,
          validUntil: data.basicInfo?.validUntil?.toDate?.() || null
        };
      } else {
        throw new Error('Devis non trouvé');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du devis:', error);
      throw new Error(`Impossible de récupérer le devis: ${error.message}`);
    }
  }

  /**
   * Obtenir les devis d'un patient
   * @param {string} patientId - ID du patient
   * @returns {Promise<Array>} Devis du patient
   */
  async getQuotesByPatient(patientId) {
    try {
      console.log('🔍 getQuotesByPatient pour patient:', patientId);
      const db = getDb();
      const quotesRef = collection(db, this.collection);
      
      const q = query(
        quotesRef,
        where('patientId', '==', patientId)
      );
      
      const snapshot = await getDocs(q);
      const quotes = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        quotes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          sentAt: data.sentAt?.toDate?.() || null,
          validUntil: data.basicInfo?.validUntil?.toDate?.() || null
        });
      });
      
      console.log('✅ Devis du patient récupérés:', quotes.length);
      return quotes;
    } catch (error) {
      console.error('Erreur lors de la récupération des devis du patient:', error);
      throw new Error(`Impossible de récupérer les devis du patient: ${error.message}`);
    }
  }

  /**
   * Ajouter un nouveau devis
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} quoteData - Données du devis
   * @returns {Promise<Object>} Devis créé
   */
  async addQuote(userId, quoteData) {
    try {
      console.group('💰 DIAGNOSTIC AVANCÉ - Sauvegarde devis');
      console.log('📥 Données reçues pour sauvegarde:', {
        userId,
        patientName: quoteData.patientName,
        phases: quoteData.phases?.length || 0,
        pricingExists: !!quoteData.pricing
      });
      console.log('📥 Données complètes:', quoteData);
      
      // Valider les données
      console.log('🔍 Validation des données...');
      const validation = this.validateQuote(quoteData);
      if (!validation.isValid) {
        console.error('❌ Validation échouée:', validation.errors);
        throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
      }
      console.log('✅ Validation réussie');
      
      const db = getDb();
      const quotesRef = collection(db, this.collection);
      console.log('🔗 Référence collection obtenue:', !!quotesRef);
      
      // Générer un numéro de devis unique
      console.log('🔢 Génération du numéro de devis...');
      const quoteNumber = await this.generateQuoteNumber(userId);
      console.log('🔢 Numéro généré:', quoteNumber);
      
      // Calculer les totaux
      console.log('💰 Calcul des totaux...');
      const pricing = this.calculateQuoteTotals(quoteData.phases || []);
      if (quoteData.pricing) {
        pricing.discountType = quoteData.pricing.discountType || 'percentage';
        pricing.discountValue = quoteData.pricing.discountValue || 0;
        pricing.paymentPlan = quoteData.pricing.paymentPlan || {};
        
        // Recalculer le total avec la remise
        const discountAmount = pricing.discountType === 'percentage'
          ? (pricing.subtotal * pricing.discountValue) / 100
          : pricing.discountValue;
        pricing.total = pricing.subtotal - discountAmount;
      }
      console.log('💰 Totaux calculés:', pricing);
      
      const newQuote = {
        userId: userId,
        patientName: quoteData.patientName || '',
        quoteNumber: quoteNumber,
        version: 1,
        status: quoteData.status || 'brouillon',
        basicInfo: {
          date: quoteData.basicInfo?.date || new Date(),
          validUntil: quoteData.basicInfo?.validUntil || null,
          referringDoctorId: quoteData.basicInfo?.referringDoctorId || null,
          currency: quoteData.basicInfo?.currency || 'EUR'
        },
        patientInfo: {
          healthStatus: quoteData.patientInfo?.healthStatus || '',
          treatmentSummary: quoteData.patientInfo?.treatmentSummary || '',
          tags: quoteData.patientInfo?.tags || []
        },
        phases: quoteData.phases || [],
        pricing: pricing,
        geminiData: quoteData.geminiData || null,
        attachments: quoteData.attachments || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        sentAt: null
      };
      
      console.log('📋 Objet devis final à sauvegarder:', {
        userId: newQuote.userId,
        patientName: newQuote.patientName,
        quoteNumber: newQuote.quoteNumber,
        status: newQuote.status,
        phases: newQuote.phases.length,
        pricing: newQuote.pricing
      });
      
      console.log('💾 Tentative de sauvegarde dans Firestore...');
      const docRef = await addDoc(quotesRef, newQuote);
      console.log('✅ Document créé avec ID:', docRef.id);
      
      const result = {
        id: docRef.id,
        ...newQuote,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('✅ Devis ajouté avec succès:', {
        id: result.id,
        userId: result.userId,
        patientName: result.patientName,
        quoteNumber: result.quoteNumber
      });
      console.groupEnd();
      return result;
    } catch (error) {
      console.error('❌ ERREUR LORS DE LA SAUVEGARDE:', error);
      console.error('📍 Type d\'erreur:', error.constructor.name);
      console.error('📍 Code d\'erreur:', error.code);
      console.error('📍 Message d\'erreur:', error.message);
      console.error('📍 Stack trace:', error.stack);
      console.groupEnd();
      throw new Error(`Impossible d'ajouter le devis: ${error.message}`);
    }
  }

  /**
   * Mettre à jour un devis
   * @param {string} quoteId - ID du devis
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<Object>} Devis mis à jour
   */
  async updateQuote(quoteId, updates) {
    try {
      console.group('📝 DIAGNOSTIC AVANCÉ - Mise à jour devis');
      console.log('🆔 Quote ID:', quoteId);
      console.log('📥 Données de mise à jour:', {
        patientName: updates.patientName,
        phases: updates.phases?.length || 'non modifiées',
        pricingExists: !!updates.pricing,
        keysCount: Object.keys(updates).length
      });
      console.log('📥 Données complètes:', updates);
      
      const db = getDb();
      const quoteRef = doc(db, this.collection, quoteId);
      console.log('🔗 Référence document créée:', !!quoteRef);
      
      // Recalculer les totaux si les phases ont été modifiées
      if (updates.phases) {
        console.log('💰 Recalcul des totaux car phases modifiées...');
        const pricing = this.calculateQuoteTotals(updates.phases);
        if (updates.pricing) {
          pricing.discountType = updates.pricing.discountType || 'percentage';
          pricing.discountValue = updates.pricing.discountValue || 0;
          pricing.paymentPlan = updates.pricing.paymentPlan || {};
          
          // Recalculer le total avec la remise
          const discountAmount = pricing.discountType === 'percentage'
            ? (pricing.subtotal * pricing.discountValue) / 100
            : pricing.discountValue;
          pricing.total = pricing.subtotal - discountAmount;
        }
        updates.pricing = pricing;
        console.log('💰 Nouveaux totaux calculés:', pricing);
      }
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      console.log('📋 Données finales pour mise à jour:', {
        userId: updateData.userId,
        patientName: updateData.patientName,
        fieldsCount: Object.keys(updateData).length
      });
      
      console.log('💾 Tentative de mise à jour dans Firestore...');
      await updateDoc(quoteRef, updateData);
      console.log('✅ Document mis à jour avec succès');
      
      const result = {
        id: quoteId,
        ...updates,
        updatedAt: new Date()
      };
      
      console.log('✅ Mise à jour terminée:', {
        id: result.id,
        userId: result.userId,
        patientName: result.patientName
      });
      console.groupEnd();
      return result;
    } catch (error) {
      console.error('❌ ERREUR LORS DE LA MISE À JOUR:', error);
      console.error('📍 Type d\'erreur:', error.constructor.name);
      console.error('📍 Code d\'erreur:', error.code);
      console.error('📍 Message d\'erreur:', error.message);
      console.error('📍 Stack trace:', error.stack);
      console.groupEnd();
      throw new Error(`Impossible de mettre à jour le devis: ${error.message}`);
    }
  }

  /**
   * Supprimer un devis
   * @param {string} quoteId - ID du devis
   * @returns {Promise<void>}
   */
  async deleteQuote(quoteId) {
    try {
      console.log('🗑️ Suppression devis:', quoteId);
      const db = getDb();
      const quoteRef = doc(db, this.collection, quoteId);
      await deleteDoc(quoteRef);
      console.log('✅ Devis supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du devis:', error);
      throw new Error(`Impossible de supprimer le devis: ${error.message}`);
    }
  }

  /**
   * Créer une nouvelle version d'un devis
   * @param {string} quoteId - ID du devis original
   * @returns {Promise<Object>} Nouvelle version du devis
   */
  async createQuoteVersion(quoteId) {
    try {
      console.log('📋 Création nouvelle version du devis:', quoteId);
      
      // Récupérer le devis original
      const originalQuote = await this.getQuote(quoteId);
      
      // Créer une nouvelle version
      const newVersion = {
        ...originalQuote,
        version: (originalQuote.version || 1) + 1,
        status: 'brouillon',
        sentAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Supprimer l'ID pour créer un nouveau document
      delete newVersion.id;
      
      const db = getDb();
      const quotesRef = collection(db, this.collection);
      const docRef = await addDoc(quotesRef, newVersion);
      
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
   * Obtenir toutes les versions d'un devis
   * @param {string} quoteId - ID du devis
   * @returns {Promise<Array>} Versions du devis
   */
  async getQuoteVersions(quoteId) {
    try {
      const quote = await this.getQuote(quoteId);
      const db = getDb();
      const quotesRef = collection(db, this.collection);
      
      const q = query(
        quotesRef,
        where('patientId', '==', quote.patientId),
        where('quoteNumber', '==', quote.quoteNumber),
        orderBy('version', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const versions = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        versions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          sentAt: data.sentAt?.toDate?.() || null
        });
      });
      
      return versions;
    } catch (error) {
      console.error('Erreur lors de la récupération des versions:', error);
      throw new Error(`Impossible de récupérer les versions: ${error.message}`);
    }
  }

  /**
   * Calculer les totaux d'un devis
   * @param {Array} phases - Phases du devis
   * @returns {Object} Totaux calculés
   */
  calculateQuoteTotals(phases) {
    let subtotal = 0;
    
    phases.forEach(phase => {
      if (phase.treatments) {
        phase.treatments.forEach(treatment => {
          subtotal += (treatment.fees || 0);
        });
      }
    });
    
    return {
      subtotal: subtotal,
      discountType: 'percentage',
      discountValue: 0,
      total: subtotal,
      paymentPlan: {}
    };
  }

  /**
   * Générer un numéro de devis unique
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<string>} Numéro de devis
   */
  async generateQuoteNumber(userId) {
    try {
      // Format: D-YYYY-NNNN (D pour Devis, année, numéro séquentiel)
      const year = new Date().getFullYear();
      
      // Essayer de récupérer les devis existants pour compter
      let quoteCount = 1;
      try {
        const quotes = await this.getQuotes(userId);
        quoteCount = quotes.length + 1;
      } catch (error) {
        console.log('Aucun devis existant trouvé, utilisation du numéro 1');
        // Si aucun devis n'existe encore, commencer à 1
        quoteCount = 1;
      }
      
      return `D-${year}-${quoteCount.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Erreur lors de la génération du numéro de devis:', error);
      // Fallback avec timestamp pour garantir l'unicité
      const timestamp = Date.now().toString().slice(-4);
      return `D-${new Date().getFullYear()}-${timestamp}`;
    }
  }

  /**
   * Dupliquer un devis
   * @param {string} quoteId - ID du devis à dupliquer
   * @returns {Promise<Object>} Devis dupliqué
   */
  async duplicateQuote(quoteId) {
    try {
      console.log('📋 Duplication devis:', quoteId);
      
      const originalQuote = await this.getQuote(quoteId);
      
      // Créer une copie
      const duplicatedQuote = {
        ...originalQuote,
        status: 'brouillon',
        sentAt: null
      };
      
      // Supprimer l'ID et les timestamps pour créer un nouveau document
      delete duplicatedQuote.id;
      delete duplicatedQuote.createdAt;
      delete duplicatedQuote.updatedAt;
      
      return await this.addQuote(originalQuote.userId, duplicatedQuote);
    } catch (error) {
      console.error('Erreur lors de la duplication du devis:', error);
      throw new Error(`Impossible de dupliquer le devis: ${error.message}`);
    }
  }

  /**
   * Envoyer un devis
   * @param {string} quoteId - ID du devis
   * @returns {Promise<Object>} Devis envoyé
   */
  async sendQuote(quoteId) {
    try {
      console.log('📤 Envoi devis:', quoteId);
      
      const updates = {
        status: 'envoye',
        sentAt: serverTimestamp()
      };
      
      return await this.updateQuote(quoteId, updates);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du devis:', error);
      throw new Error(`Impossible d'envoyer le devis: ${error.message}`);
    }
  }

  /**
   * Accepter un devis
   * @param {string} quoteId - ID du devis
   * @returns {Promise<Object>} Devis accepté
   */
  async acceptQuote(quoteId) {
    try {
      console.log('✅ Acceptation devis:', quoteId);
      
      const updates = {
        status: 'accepte'
      };
      
      return await this.updateQuote(quoteId, updates);
    } catch (error) {
      console.error('Erreur lors de l\'acceptation du devis:', error);
      throw new Error(`Impossible d'accepter le devis: ${error.message}`);
    }
  }

  /**
   * Faire expirer un devis
   * @param {string} quoteId - ID du devis
   * @returns {Promise<Object>} Devis expiré
   */
  async expireQuote(quoteId) {
    try {
      console.log('⏰ Expiration devis:', quoteId);
      
      const updates = {
        status: 'expire'
      };
      
      return await this.updateQuote(quoteId, updates);
    } catch (error) {
      console.error('Erreur lors de l\'expiration du devis:', error);
      throw new Error(`Impossible de faire expirer le devis: ${error.message}`);
    }
  }

  /**
   * Écouter les changements des devis en temps réel
   * @param {string} userId - ID de l'utilisateur
   * @param {Function} callback - Fonction appelée lors des changements
   * @returns {Function} Fonction pour arrêter l'écoute
   */
  subscribeToQuotes(userId, callback) {
    try {
      console.log('🔥 subscribeToQuotes pour userId:', userId);
      const db = getDb();
      const quotesRef = collection(db, this.collection);
      
      const q = query(
        quotesRef,
        where('userId', '==', userId)
      );
      
      return onSnapshot(
        q,
        (snapshot) => {
          console.log('🔥 Snapshot temps réel reçu, nombre de docs:', snapshot.size);
          const quotes = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            quotes.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
              sentAt: data.sentAt?.toDate?.() || null,
              validUntil: data.basicInfo?.validUntil?.toDate?.() || null
            });
          });
          
          console.log('🔥 Devis temps réel:', quotes.length);
          callback(quotes);
        },
        (error) => {
          // Gestion robuste des erreurs réseau Firebase
          if (error.code === 'unavailable' || error.message.includes('QUIC_PROTOCOL_ERROR')) {
            console.warn('⚠️ Erreur réseau temporaire Firebase (QUIC/unavailable):', error.message);
            // Ne pas appeler callback([]) pour éviter de vider les données
            // L'application continuera avec les données déjà chargées
          } else {
            console.error('❌ Erreur critique lors de l\'écoute des devis:', error);
            callback([]);
          }
        }
      );
    } catch (error) {
      console.error('Erreur lors de la création de l\'écoute:', error);
      callback([]);
      return () => {};
    }
  }

  /**
   * Écouter les devis d'un patient en temps réel
   * @param {string} patientId - ID du patient
   * @param {Function} callback - Fonction appelée lors des changements
   * @returns {Function} Fonction pour arrêter l'écoute
   */
  subscribeToPatientQuotes(patientId, callback) {
    try {
      console.log('🔥 subscribeToPatientQuotes pour patient:', patientId);
      const db = getDb();
      const quotesRef = collection(db, this.collection);
      
      const q = query(
        quotesRef,
        where('patientId', '==', patientId)
      );
      
      return onSnapshot(
        q,
        (snapshot) => {
          const quotes = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            quotes.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
              sentAt: data.sentAt?.toDate?.() || null,
              validUntil: data.basicInfo?.validUntil?.toDate?.() || null
            });
          });
          
          callback(quotes);
        },
        (error) => {
          console.error('Erreur lors de l\'écoute des devis du patient:', error);
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
   * Valider les données d'un devis
   * @param {Object} quoteData - Données à valider
   * @returns {Object} Résultat de la validation
   */
  validateQuote(quoteData) {
    const errors = [];
    
    // Validation du nom du patient
    if (!quoteData.patientName || !quoteData.patientName.trim()) {
      errors.push('Le nom du patient est requis');
    }
    
    // Validation des informations de base
    if (!quoteData.basicInfo?.referringDoctorId) {
      errors.push('Le médecin référent est requis');
    }
    
    // Validation des phases
    if (!quoteData.phases || quoteData.phases.length === 0) {
      errors.push('Au moins une phase de traitement est requise');
    } else {
      quoteData.phases.forEach((phase, index) => {
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
            
            if (typeof treatment.fees !== 'number' || treatment.fees < 0) {
              errors.push(`Le prix du traitement ${treatmentIndex + 1} de la phase ${index + 1} doit être un nombre positif`);
            }
          });
        }
      });
    }
    
    // Validation du statut
    const validStatuses = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'];
    if (quoteData.status && !validStatuses.includes(quoteData.status)) {
      errors.push('Le statut doit être: brouillon, envoye, accepte, refuse ou expire');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Créer un devis depuis les données Gemini
   * @param {string} userId - ID de l'utilisateur
   * @param {string} patientId - ID du patient
   * @param {Object} geminiData - Données extraites par Gemini
   * @returns {Promise<Object>} Devis créé
   */
  async createFromGeminiData(userId, patientId, geminiData) {
    try {
      console.log('🤖 Création devis depuis données Gemini:', geminiData);
      
      // Mapper les données Gemini vers la structure de devis
      const quoteData = {
        patientId: patientId,
        basicInfo: {
          date: geminiData.date_devis ? new Date(geminiData.date_devis) : new Date(),
          currency: 'EUR'
        },
        patientInfo: {
          healthStatus: Array.isArray(geminiData.etat_general) 
            ? geminiData.etat_general.join('. ') 
            : (geminiData.etat_general || ''),
          treatmentSummary: geminiData.resume_langage_commun || '',
          tags: []
        },
        phases: this.mapGeminiPhasesToQuotePhases(geminiData.phases || []),
        pricing: {
          discountType: 'fixed',
          discountValue: geminiData.synthese_financiere?.remise_totale || 0
        },
        geminiData: geminiData
      };
      
      return await this.addQuote(userId, quoteData);
    } catch (error) {
      console.error('Erreur lors de la création depuis Gemini:', error);
      throw new Error(`Impossible de créer le devis depuis Gemini: ${error.message}`);
    }
  }

  /**
   * Mapper les phases Gemini vers les phases de devis
   * @param {Array} geminiPhases - Phases Gemini
   * @returns {Array} Phases de devis
   */
  mapGeminiPhasesToQuotePhases(geminiPhases) {
    return geminiPhases.map((phase, index) => {
      const treatments = [];
      
      // Traiter les groupes d'actes ou les actes directs
      if (phase.groupes_actes) {
        phase.groupes_actes.forEach((groupe) => {
          groupe.actes?.forEach((acte) => {
            treatments.push({
              id: Date.now() + Math.random(),
              name: acte.libelle || 'Traitement',
              doctor: acte.doctor || null, // Préserver le médecin si présent
              fees: acte.cout_total || acte.cout || 0,
              unitCost: acte.cout_unitaire || null,
              quantity: acte.dents ? (Array.isArray(acte.dents) ? acte.dents.length : 1) : 1,
              sessions: 1,
              teeth: Array.isArray(acte.dents) ? acte.dents.join(', ') : (acte.dents || ''),
              category: groupe.type || 'Général'
            });
          });
        });
      } else if (phase.actes) {
        treatments.push(...phase.actes.map((acte) => ({
          id: Date.now() + Math.random(),
          name: acte.libelle || 'Traitement',
          doctor: acte.doctor || null, // Préserver le médecin si présent
          fees: acte.prix_total_acte || acte.honoraires_ligne || acte.cout || 0,
          unitCost: acte.cout_unitaire || null,
          quantity: acte.dents ? (Array.isArray(acte.dents) ? acte.dents.length : 1) : 1,
          sessions: 1,
          teeth: Array.isArray(acte.dents) ? acte.dents.join(', ') : (acte.dents || ''),
          category: 'Général'
        })));
      }
      
      return {
        id: Date.now() + index,
        name: phase.nom || `Phase ${index + 1}`,
        description: phase.description_phase || phase.resume || '',
        sessions: phase.nombre_seances_estime || phase.nombre_seances || 1,
        doctor: phase.doctor || null, // Préserver le médecin de la phase si présent
        treatments: treatments
      };
    });
  }
}

// Exporter une instance unique du service
export default new QuotesService();