/**
 * Service des devis refactorisé avec la nouvelle couche d'abstraction
 * Version 2.0 - Utilise BaseRepository pour éliminer la redondance
 */
import { BaseRepository, BaseSchema, ValidationTypes } from '../../core/firebase';

// Schéma de validation pour les devis
const QuoteSchema = new BaseSchema({
  patientId: [ValidationTypes.REQUIRED, ValidationTypes.STRING],
  patientName: ValidationTypes.STRING,
  quoteNumber: ValidationTypes.STRING,
  version: ValidationTypes.NUMBER,
  status: (value) => {
    if (!value) return true; // Optionnel
    const validStatuses = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'];
    return validStatuses.includes(value) || 'Le statut doit être: brouillon, envoye, accepte, refuse ou expire';
  },
  'basicInfo.referringDoctorId': ValidationTypes.STRING,
  'basicInfo.currency': ValidationTypes.STRING,
  'patientInfo.healthStatus': ValidationTypes.STRING,
  'patientInfo.treatmentSummary': ValidationTypes.STRING,
  'patientInfo.tags': ValidationTypes.ARRAY,
  phases: [ValidationTypes.REQUIRED, ValidationTypes.ARRAY],
  'pricing.subtotal': ValidationTypes.NUMBER,
  'pricing.total': ValidationTypes.NUMBER,
  attachments: ValidationTypes.ARRAY
});

class QuotesServiceV2 extends BaseRepository {
  constructor() {
    super('quotes', QuoteSchema);
    console.log('💰 QuotesServiceV2 initialisé avec BaseRepository');
  }

  /**
   * Obtenir tous les devis d'un utilisateur avec filtres optionnels
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} filters - Filtres optionnels
   * @returns {Promise<Array>} Liste des devis
   */
  async getQuotes(userId, filters = {}) {
    console.log('💰 getQuotes V2 pour userId:', userId, 'avec filtres:', filters);
    
    // Utiliser la méthode héritée de BaseRepository
    const quotes = await this.findAll(userId, filters);
    
    console.log('✅ Devis récupérés V2:', quotes.length);
    return quotes;
  }

  /**
   * Obtenir un devis spécifique
   * @param {string} quoteId - ID du devis
   * @param {string} userId - ID de l'utilisateur (pour le cache)
   * @returns {Promise<Object>} Devis
   */
  async getQuote(quoteId, userId = null) {
    console.log('💰 getQuote V2 pour ID:', quoteId);
    
    const quote = await this.read(quoteId, userId);
    
    if (!quote) {
      throw new Error('Devis non trouvé');
    }
    
    console.log('✅ Devis trouvé V2:', quote.quoteNumber);
    return quote;
  }

  /**
   * Obtenir les devis d'un patient
   * @param {string} patientId - ID du patient
   * @returns {Promise<Array>} Devis du patient
   */
  async getQuotesByPatient(patientId) {
    console.log('💰 getQuotesByPatient V2 pour patient:', patientId);
    
    // Utiliser une requête spéciale pour les devis par patient
    const db = this.getCollectionRef().firestore;
    const quotesRef = this.getCollectionRef();
    
    const QueryBuilder = (await import('../../core/firebase/QueryBuilder.js')).default;
    const query = QueryBuilder.for(quotesRef)
      .where('patientId', '==', patientId)
      .orderBy('createdAt', 'desc')
      .build();
    
    const snapshot = await db.getDocs ? await db.getDocs(query) : await query.get();
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
    
    console.log('✅ Devis du patient récupérés V2:', quotes.length);
    return quotes;
  }

  /**
   * Ajouter un nouveau devis
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} quoteData - Données du devis
   * @returns {Promise<Object>} Devis créé
   */
  async addQuote(userId, quoteData) {
    console.log('💰 Ajout devis V2 avec données:', quoteData);
    
    // Générer un numéro de devis unique
    const quoteNumber = await this.generateQuoteNumber(userId);
    
    // Calculer les totaux
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
    
    // Structurer les données selon le schéma
    const structuredData = {
      patientId: quoteData.patientId,
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
      sentAt: null
    };
    
    // Utiliser la méthode héritée de BaseRepository (avec validation automatique)
    const newQuote = await this.create(userId, structuredData);
    
    console.log('✅ Devis ajouté V2:', newQuote.id);
    return newQuote;
  }

  /**
   * Mettre à jour un devis
   * @param {string} quoteId - ID du devis
   * @param {Object} updates - Données à mettre à jour
   * @param {string} userId - ID de l'utilisateur (pour le cache)
   * @returns {Promise<Object>} Devis mis à jour
   */
  async updateQuote(quoteId, updates, userId = null) {
    console.log('💰 Mise à jour devis V2:', quoteId);
    
    // Recalculer les totaux si les phases ont été modifiées
    if (updates.phases) {
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
    }
    
    // Utiliser la méthode héritée de BaseRepository (avec validation automatique)
    const updatedQuote = await this.update(quoteId, updates, userId);
    
    console.log('✅ Devis mis à jour V2:', quoteId);
    return updatedQuote;
  }

  /**
   * Supprimer un devis
   * @param {string} quoteId - ID du devis
   * @param {string} userId - ID de l'utilisateur (pour le cache)
   * @returns {Promise<void>}
   */
  async deleteQuote(quoteId, userId = null) {
    console.log('💰 Suppression devis V2:', quoteId);
    
    // Utiliser la méthode héritée de BaseRepository
    await this.delete(quoteId, userId);
    
    console.log('✅ Devis supprimé V2:', quoteId);
  }

  /**
   * Créer une nouvelle version d'un devis
   * @param {string} quoteId - ID du devis original
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Nouvelle version du devis
   */
  async createQuoteVersion(quoteId, userId = null) {
    console.log('💰 Création nouvelle version du devis V2:', quoteId);
    
    // Récupérer le devis original
    const originalQuote = await this.getQuote(quoteId, userId);
    
    // Créer une nouvelle version
    const newVersionData = {
      ...originalQuote,
      version: (originalQuote.version || 1) + 1,
      status: 'brouillon',
      sentAt: null
    };
    
    // Supprimer les champs qui seront régénérés
    delete newVersionData.id;
    delete newVersionData.createdAt;
    delete newVersionData.updatedAt;
    
    const newVersion = await this.create(originalQuote.userId, newVersionData);
    
    console.log('✅ Nouvelle version créée V2:', newVersion.id);
    return newVersion;
  }

  /**
   * Dupliquer un devis
   * @param {string} quoteId - ID du devis à dupliquer
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Devis dupliqué
   */
  async duplicateQuote(quoteId, userId = null) {
    console.log('💰 Duplication devis V2:', quoteId);
    
    const originalQuote = await this.getQuote(quoteId, userId);
    
    // Créer une copie
    const duplicatedData = {
      ...originalQuote,
      status: 'brouillon',
      sentAt: null
    };
    
    // Supprimer les champs qui seront régénérés
    delete duplicatedData.id;
    delete duplicatedData.createdAt;
    delete duplicatedData.updatedAt;
    delete duplicatedData.quoteNumber; // Sera régénéré
    
    const duplicatedQuote = await this.create(originalQuote.userId, duplicatedData);
    
    console.log('✅ Devis dupliqué V2:', duplicatedQuote.id);
    return duplicatedQuote;
  }

  /**
   * Envoyer un devis
   * @param {string} quoteId - ID du devis
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Devis envoyé
   */
  async sendQuote(quoteId, userId = null) {
    console.log('💰 Envoi devis V2:', quoteId);
    
    const updates = {
      status: 'envoye',
      sentAt: new Date()
    };
    
    const sentQuote = await this.updateQuote(quoteId, updates, userId);
    
    console.log('✅ Devis envoyé V2:', quoteId);
    return sentQuote;
  }

  /**
   * Accepter un devis
   * @param {string} quoteId - ID du devis
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Devis accepté
   */
  async acceptQuote(quoteId, userId = null) {
    console.log('💰 Acceptation devis V2:', quoteId);
    
    const updates = {
      status: 'accepte',
      acceptedAt: new Date()
    };
    
    const acceptedQuote = await this.updateQuote(quoteId, updates, userId);
    
    console.log('✅ Devis accepté V2:', quoteId);
    return acceptedQuote;
  }

  /**
   * Faire expirer un devis
   * @param {string} quoteId - ID du devis
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Devis expiré
   */
  async expireQuote(quoteId, userId = null) {
    console.log('💰 Expiration devis V2:', quoteId);
    
    const updates = {
      status: 'expire',
      expiredAt: new Date()
    };
    
    const expiredQuote = await this.updateQuote(quoteId, updates, userId);
    
    console.log('✅ Devis expiré V2:', quoteId);
    return expiredQuote;
  }

  /**
   * S'abonner aux changements des devis en temps réel
   * @param {string} userId - ID de l'utilisateur
   * @param {Function} callback - Fonction appelée lors des changements
   * @param {Object} filters - Filtres optionnels
   * @returns {Function} Fonction pour arrêter l'écoute
   */
  subscribeToQuotes(userId, callback, filters = {}) {
    console.log('🔥 subscribeToQuotes V2 pour userId:', userId);
    
    // Utiliser la méthode héritée de BaseRepository avec gestion d'erreurs robuste
    return this.subscribe(userId, (quotes) => {
      console.log('🔥 Devis temps réel V2:', quotes.length);
      callback(quotes);
    }, filters);
  }

  /**
   * Écouter les devis d'un patient en temps réel
   * @param {string} patientId - ID du patient
   * @param {Function} callback - Fonction appelée lors des changements
   * @returns {Function} Fonction pour arrêter l'écoute
   */
  subscribeToPatientQuotes(patientId, callback) {
    console.log('🔥 subscribeToPatientQuotes V2 pour patient:', patientId);
    
    // Utiliser une requête spéciale pour les devis par patient
    const filters = { patientId: patientId };
    
    return this.subscribe('*', (quotes) => {
      // Filtrer côté client pour les devis du patient
      const patientQuotes = quotes.filter(quote => quote.patientId === patientId);
      console.log('🔥 Devis patient temps réel V2:', patientQuotes.length);
      callback(patientQuotes);
    }, filters);
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
      
      // Récupérer les devis existants pour compter
      let quoteCount = 1;
      try {
        const quotes = await this.getQuotes(userId);
        quoteCount = quotes.length + 1;
      } catch (error) {
        console.log('Aucun devis existant trouvé V2, utilisation du numéro 1');
        quoteCount = 1;
      }
      
      return `D-${year}-${quoteCount.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('❌ Erreur lors de la génération du numéro de devis V2:', error);
      // Fallback avec timestamp pour garantir l'unicité
      const timestamp = Date.now().toString().slice(-4);
      return `D-${new Date().getFullYear()}-${timestamp}`;
    }
  }

  /**
   * Créer un devis depuis les données Gemini
   * @param {string} userId - ID de l'utilisateur
   * @param {string} patientId - ID du patient
   * @param {Object} geminiData - Données extraites par Gemini
   * @returns {Promise<Object>} Devis créé
   */
  async createFromGeminiData(userId, patientId, geminiData) {
    console.log('💰 Création devis depuis données Gemini V2:', geminiData);
    
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
    
    const newQuote = await this.addQuote(userId, quoteData);
    
    console.log('✅ Devis créé depuis Gemini V2:', newQuote.id);
    return newQuote;
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
        treatments: treatments
      };
    });
  }

  /**
   * Obtenir les statistiques des devis
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Statistiques
   */
  async getQuotesStats(userId) {
    console.log('📊 Statistiques devis V2');
    
    const quotes = await this.getQuotes(userId);
    
    const stats = {
      total: quotes.length,
      byStatus: {
        brouillon: quotes.filter(q => q.status === 'brouillon').length,
        envoye: quotes.filter(q => q.status === 'envoye').length,
        accepte: quotes.filter(q => q.status === 'accepte').length,
        refuse: quotes.filter(q => q.status === 'refuse').length,
        expire: quotes.filter(q => q.status === 'expire').length
      },
      totalValue: quotes.reduce((sum, quote) => sum + (quote.pricing?.total || 0), 0),
      averageValue: quotes.length > 0 ? 
        quotes.reduce((sum, quote) => sum + (quote.pricing?.total || 0), 0) / quotes.length : 0,
      recentlyCreated: quotes.filter(q => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return q.createdAt > weekAgo;
      }).length,
      conversionRate: quotes.length > 0 ? 
        (quotes.filter(q => q.status === 'accepte').length / quotes.length) * 100 : 0
    };
    
    console.log('✅ Statistiques calculées V2:', stats);
    return stats;
  }

  /**
   * Exporter les devis au format JSON
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<string>} JSON des devis
   */
  async exportQuotes(userId) {
    console.log('📤 Export devis V2');
    
    const quotes = await this.getQuotes(userId);
    
    // Nettoyer les données pour l'export
    const exportData = quotes.map(quote => ({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      patientId: quote.patientId,
      patientName: quote.patientName,
      status: quote.status,
      basicInfo: quote.basicInfo,
      patientInfo: quote.patientInfo,
      phases: quote.phases,
      pricing: quote.pricing,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      sentAt: quote.sentAt
    }));
    
    const jsonData = JSON.stringify(exportData, null, 2);
    console.log('✅ Export terminé V2:', exportData.length, 'devis');
    
    return jsonData;
  }

  /**
   * Valider les données d'un devis (méthode publique pour compatibilité)
   * @param {Object} quoteData - Données à valider
   * @returns {Object} Résultat de la validation
   */
  validateQuote(quoteData) {
    // Utiliser le schéma de validation intégré
    return this.schema.validate(quoteData);
  }
}

// Exporter une instance unique du service
export default new QuotesServiceV2();

// Exporter aussi la classe pour les tests
export { QuotesServiceV2 };