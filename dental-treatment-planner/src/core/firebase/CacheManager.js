/**
 * Gestionnaire de cache intelligent pour Firebase
 * Gère le cache local, l'invalidation et la synchronisation temps réel
 */

class CacheManager {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.cache = new Map();
    this.subscribers = new Set();
    this.lastUpdate = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes par défaut
    this.maxSize = 1000; // Limite de taille du cache
    
    console.log(`💾 CacheManager initialisé pour ${collectionName}`);
  }

  /**
   * Obtenir une valeur du cache
   * @param {string} key - Clé du cache
   * @returns {any|null} Valeur cachée ou null
   */
  get(key) {
    const cacheKey = this.buildKey(key);
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      console.log(`💾 Cache MISS pour ${cacheKey}`);
      return null;
    }
    
    // Vérifier l'expiration
    if (this.isExpired(cacheKey)) {
      console.log(`⏰ Cache EXPIRED pour ${cacheKey}`);
      this.cache.delete(cacheKey);
      this.lastUpdate.delete(cacheKey);
      return null;
    }
    
    console.log(`💾 Cache HIT pour ${cacheKey}`);
    return cached.data;
  }

  /**
   * Stocker une valeur dans le cache
   * @param {string} key - Clé du cache
   * @param {any} data - Données à cacher
   * @param {number} customTtl - TTL personnalisé en ms
   */
  set(key, data, customTtl = null) {
    const cacheKey = this.buildKey(key);
    
    // Vérifier la taille du cache
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    const ttlToUse = customTtl || this.ttl;
    const expiresAt = Date.now() + ttlToUse;
    
    this.cache.set(cacheKey, {
      data: this.deepClone(data),
      expiresAt,
      createdAt: Date.now()
    });
    
    this.lastUpdate.set(cacheKey, Date.now());
    
    console.log(`💾 Cache SET pour ${cacheKey} (expire dans ${ttlToUse}ms)`);
    
    // Notifier les subscribers
    this.notifySubscribers(cacheKey, data);
  }

  /**
   * Invalider une entrée du cache
   * @param {string} key - Clé à invalider
   */
  invalidate(key) {
    const cacheKey = this.buildKey(key);
    
    if (this.cache.has(cacheKey)) {
      this.cache.delete(cacheKey);
      this.lastUpdate.delete(cacheKey);
      console.log(`🗑️ Cache invalidé pour ${cacheKey}`);
      
      // Notifier les subscribers de l'invalidation
      this.notifySubscribers(cacheKey, null, true);
    }
  }

  /**
   * Invalider par pattern
   * @param {string|RegExp} pattern - Pattern à matcher
   */
  invalidatePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.lastUpdate.delete(key);
    });
    
    if (keysToDelete.length > 0) {
      console.log(`🗑️ Cache invalidé par pattern ${pattern}: ${keysToDelete.length} entrées`);
    }
  }

  /**
   * Invalider toutes les entrées d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   */
  invalidateUser(userId) {
    this.invalidatePattern(`${this.collectionName}:${userId}:`);
  }

  /**
   * Vider tout le cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.lastUpdate.clear();
    console.log(`🗑️ Cache vidé: ${size} entrées supprimées`);
  }

  /**
   * Gérer une mise à jour temps réel
   * @param {string} docId - ID du document
   * @param {any} newData - Nouvelles données
   * @param {string} userId - ID de l'utilisateur
   */
  handleRealtimeUpdate(docId, newData, userId) {
    const listKey = this.buildKey(`${userId}:list`);
    const docKey = this.buildKey(`${userId}:doc:${docId}`);
    
    // Mettre à jour le document individuel
    if (newData) {
      this.set(`${userId}:doc:${docId}`, newData);
    } else {
      // Document supprimé
      this.invalidate(`${userId}:doc:${docId}`);
    }
    
    // Invalider la liste pour forcer un rechargement
    this.invalidate(`${userId}:list`);
    
    console.log(`🔄 Mise à jour temps réel: ${docId} pour utilisateur ${userId}`);
  }

  /**
   * Optimistic update - mettre à jour le cache avant la confirmation
   * @param {string} key - Clé du cache
   * @param {any} newData - Nouvelles données
   * @param {Function} rollbackFn - Fonction de rollback en cas d'échec
   */
  optimisticUpdate(key, newData, rollbackFn) {
    const cacheKey = this.buildKey(key);
    const oldData = this.get(key);
    
    // Appliquer la mise à jour optimiste
    this.set(key, newData);
    
    console.log(`⚡ Mise à jour optimiste pour ${cacheKey}`);
    
    // Retourner une fonction de rollback
    return () => {
      if (oldData) {
        this.set(key, oldData);
      } else {
        this.invalidate(key);
      }
      
      if (rollbackFn) {
        rollbackFn();
      }
      
      console.log(`↩️ Rollback optimiste pour ${cacheKey}`);
    };
  }

  /**
   * S'abonner aux changements du cache
   * @param {Function} callback - Fonction appelée lors des changements
   * @returns {Function} Fonction de désabonnement
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notifier les subscribers
   * @param {string} key - Clé modifiée
   * @param {any} data - Nouvelles données
   * @param {boolean} isInvalidation - Si c'est une invalidation
   */
  notifySubscribers(key, data, isInvalidation = false) {
    for (const callback of this.subscribers) {
      try {
        callback({
          key,
          data,
          isInvalidation,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('❌ Erreur lors de la notification du subscriber:', error);
      }
    }
  }

  /**
   * Construire une clé de cache
   * @param {string} key - Clé de base
   * @returns {string} Clé complète
   */
  buildKey(key) {
    return `${this.collectionName}:${key}`;
  }

  /**
   * Vérifier si une entrée est expirée
   * @param {string} cacheKey - Clé du cache
   * @returns {boolean}
   */
  isExpired(cacheKey) {
    const cached = this.cache.get(cacheKey);
    return cached && Date.now() > cached.expiresAt;
  }

  /**
   * Éviction des entrées les plus anciennes
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, cached] of this.cache.entries()) {
      if (cached.createdAt < oldestTime) {
        oldestTime = cached.createdAt;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.lastUpdate.delete(oldestKey);
      console.log(`🗑️ Éviction de l'entrée la plus ancienne: ${oldestKey}`);
    }
  }

  /**
   * Clone profond pour éviter les mutations
   * @param {any} obj - Objet à cloner
   * @returns {any} Clone de l'objet
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    
    return cloned;
  }

  /**
   * Obtenir les statistiques du cache
   * @returns {Object} Statistiques
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalSize = 0;
    
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        expiredCount++;
      }
      totalSize += JSON.stringify(cached.data).length;
    }
    
    return {
      collection: this.collectionName,
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      maxSize: this.maxSize,
      approximateSize: totalSize,
      subscribers: this.subscribers.size,
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * Calculer le taux de hit du cache (approximatif)
   * @returns {number} Taux de hit en pourcentage
   */
  calculateHitRate() {
    // Implémentation simplifiée - dans un vrai système, on trackrait hits/misses
    const activeEntries = this.cache.size;
    const maxEntries = this.maxSize;
    return Math.round((activeEntries / maxEntries) * 100);
  }

  /**
   * Nettoyer les entrées expirées
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.lastUpdate.delete(key);
    });
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Nettoyage du cache: ${keysToDelete.length} entrées expirées supprimées`);
    }
  }

  /**
   * Démarrer le nettoyage automatique
   * @param {number} interval - Intervalle en ms (défaut: 5 minutes)
   */
  startAutoCleanup(interval = 5 * 60 * 1000) {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, interval);
    
    console.log(`🧹 Nettoyage automatique démarré (${interval}ms)`);
  }

  /**
   * Arrêter le nettoyage automatique
   */
  stopAutoCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🧹 Nettoyage automatique arrêté');
    }
  }
}

export default CacheManager;