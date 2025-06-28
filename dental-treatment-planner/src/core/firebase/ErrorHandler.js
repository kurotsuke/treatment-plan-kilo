/**
 * Gestionnaire d'erreurs centralisé pour Firebase
 * Gère les retry, fallbacks et logging uniforme
 */

class ErrorHandler {
  constructor() {
    this.retryStrategies = new Map();
    this.fallbackStrategies = new Map();
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 seconde
  }

  /**
   * Gérer une erreur avec retry automatique et fallbacks
   * @param {Error} error - L'erreur à gérer
   * @param {Function} operation - L'opération à retry
   * @param {Object} context - Contexte de l'opération
   * @returns {Promise<any>} Résultat de l'opération ou fallback
   */
  async handle(error, operation, context = {}) {
    console.error('🚨 ErrorHandler - Gestion d\'erreur:', {
      error: error.message,
      code: error.code,
      context
    });

    // Retry automatique pour erreurs réseau
    if (this.isNetworkError(error)) {
      console.log('🔄 Tentative de retry pour erreur réseau...');
      return this.retryWithBackoff(operation, context);
    }
    
    // Gestion spéciale pour erreurs QUIC (problème connu Firebase)
    if (this.isQuicError(error)) {
      console.log('🌐 Gestion erreur QUIC - retry avec délai...');
      return this.retryWithBackoff(operation, context, 2000);
    }
    
    // Fallback pour erreurs de quota
    if (this.isQuotaError(error)) {
      console.log('📊 Erreur de quota - utilisation du fallback...');
      return this.useFallbackStrategy(context);
    }
    
    // Gestion des erreurs de permissions
    if (this.isPermissionError(error)) {
      console.log('🔒 Erreur de permissions détectée');
      throw this.createUserFriendlyError('Permissions insuffisantes', error);
    }
    
    // Logging uniforme pour toutes les erreurs
    this.logError(error, context);
    
    // Normaliser l'erreur pour l'utilisateur
    throw this.normalizeError(error);
  }

  /**
   * Retry avec backoff exponentiel
   * @param {Function} operation - Opération à retry
   * @param {Object} context - Contexte
   * @param {number} initialDelay - Délai initial
   * @returns {Promise<any>}
   */
  async retryWithBackoff(operation, context = {}, initialDelay = this.baseDelay) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentative ${attempt}/${this.maxRetries}...`);
        
        if (attempt > 1) {
          const delay = initialDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Attente de ${delay}ms avant retry...`);
          await this.sleep(delay);
        }
        
        const result = await operation();
        console.log(`✅ Succès après ${attempt} tentative(s)`);
        return result;
        
      } catch (error) {
        lastError = error;
        console.log(`❌ Tentative ${attempt} échouée:`, error.message);
        
        // Si ce n'est plus une erreur réseau, arrêter les retry
        if (!this.isRetryableError(error)) {
          console.log('🛑 Erreur non-retryable, arrêt des tentatives');
          break;
        }
      }
    }
    
    console.log('💥 Toutes les tentatives ont échoué');
    throw lastError;
  }

  /**
   * Utiliser une stratégie de fallback
   * @param {Object} context - Contexte de l'opération
   * @returns {any} Résultat du fallback
   */
  useFallbackStrategy(context) {
    const { operation, collection } = context;
    
    // Fallback pour lecture : retourner cache ou données vides
    if (operation === 'read' || operation === 'list') {
      console.log('📋 Fallback: retour de données vides');
      return [];
    }
    
    // Fallback pour écriture : mise en queue locale
    if (operation === 'write' || operation === 'update') {
      console.log('💾 Fallback: mise en queue pour retry ultérieur');
      this.queueForLaterRetry(context);
      return { success: false, queued: true };
    }
    
    throw new Error('Aucune stratégie de fallback disponible');
  }

  /**
   * Mettre en queue pour retry ultérieur
   * @param {Object} context - Contexte de l'opération
   */
  queueForLaterRetry(context) {
    // TODO: Implémenter une queue persistante pour les opérations échouées
    console.log('📝 Opération mise en queue:', context);
  }

  /**
   * Vérifier si c'est une erreur réseau
   * @param {Error} error - L'erreur à vérifier
   * @returns {boolean}
   */
  isNetworkError(error) {
    const networkCodes = [
      'unavailable',
      'deadline-exceeded',
      'network-error',
      'timeout'
    ];
    
    const networkMessages = [
      'network error',
      'connection failed',
      'timeout',
      'unavailable'
    ];
    
    return networkCodes.includes(error.code) ||
           networkMessages.some(msg => error.message.toLowerCase().includes(msg));
  }

  /**
   * Vérifier si c'est une erreur QUIC
   * @param {Error} error - L'erreur à vérifier
   * @returns {boolean}
   */
  isQuicError(error) {
    return error.message && error.message.includes('QUIC_PROTOCOL_ERROR');
  }

  /**
   * Vérifier si c'est une erreur de quota
   * @param {Error} error - L'erreur à vérifier
   * @returns {boolean}
   */
  isQuotaError(error) {
    const quotaCodes = ['resource-exhausted', 'quota-exceeded'];
    return quotaCodes.includes(error.code) ||
           (error.message && error.message.includes('quota'));
  }

  /**
   * Vérifier si c'est une erreur de permissions
   * @param {Error} error - L'erreur à vérifier
   * @returns {boolean}
   */
  isPermissionError(error) {
    const permissionCodes = ['permission-denied', 'unauthenticated'];
    return permissionCodes.includes(error.code);
  }

  /**
   * Vérifier si l'erreur est retryable
   * @param {Error} error - L'erreur à vérifier
   * @returns {boolean}
   */
  isRetryableError(error) {
    return this.isNetworkError(error) || this.isQuicError(error);
  }

  /**
   * Logger une erreur de manière uniforme
   * @param {Error} error - L'erreur à logger
   * @param {Object} context - Contexte de l'erreur
   */
  logError(error, context) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error.message,
      code: error.code,
      stack: error.stack,
      context: context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.error('🚨 Firebase Error Log:', errorInfo);
    
    // TODO: Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
  }

  /**
   * Normaliser une erreur pour l'utilisateur
   * @param {Error} error - L'erreur à normaliser
   * @returns {Error} Erreur normalisée
   */
  normalizeError(error) {
    // Messages d'erreur conviviaux
    const friendlyMessages = {
      'permission-denied': 'Vous n\'avez pas les permissions nécessaires pour cette action',
      'unauthenticated': 'Vous devez être connecté pour effectuer cette action',
      'not-found': 'Les données demandées n\'ont pas été trouvées',
      'already-exists': 'Ces données existent déjà',
      'resource-exhausted': 'Service temporairement indisponible, veuillez réessayer',
      'unavailable': 'Service temporairement indisponible, veuillez réessayer',
      'deadline-exceeded': 'L\'opération a pris trop de temps, veuillez réessayer'
    };
    
    const friendlyMessage = friendlyMessages[error.code] || 
                           'Une erreur inattendue s\'est produite';
    
    return this.createUserFriendlyError(friendlyMessage, error);
  }

  /**
   * Créer une erreur conviviale pour l'utilisateur
   * @param {string} message - Message convivial
   * @param {Error} originalError - Erreur originale
   * @returns {Error}
   */
  createUserFriendlyError(message, originalError) {
    const error = new Error(message);
    error.code = originalError.code;
    error.originalError = originalError;
    error.isUserFriendly = true;
    return error;
  }

  /**
   * Utilitaire pour attendre
   * @param {number} ms - Millisecondes à attendre
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exporter une instance unique
export default new ErrorHandler();