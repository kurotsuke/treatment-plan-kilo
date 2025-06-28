/**
 * Gestionnaire d'optimisation pour réduire les appels Firebase redondants
 * Implémente la memoization, le debouncing et la gestion des listeners
 */

class OptimizationManager {
  constructor() {
    // Cache des instances de base de données
    this.dbCache = new Map();
    
    // Cache des listeners actifs pour éviter les doublons
    this.activeListeners = new Map();
    
    // Cache des requêtes récentes pour éviter les appels redondants
    this.queryCache = new Map();
    
    // Debounce des appels d'authentification
    this.authDebounceTimers = new Map();
    
    // Statistiques pour monitoring
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      listenersCreated: 0,
      listenersReused: 0,
      queriesDebounced: 0
    };
  }

  /**
   * Obtenir une instance de base de données mise en cache
   */
  getCachedDb(config) {
    const cacheKey = JSON.stringify(config);
    
    if (this.dbCache.has(cacheKey)) {
      this.stats.cacheHits++;
      console.log('🎯 DB Cache HIT:', cacheKey.substring(0, 50) + '...');
      return this.dbCache.get(cacheKey);
    }
    
    this.stats.cacheMisses++;
    console.log('❌ DB Cache MISS:', cacheKey.substring(0, 50) + '...');
    return null;
  }

  /**
   * Mettre en cache une instance de base de données
   */
  setCachedDb(config, dbInstance) {
    const cacheKey = JSON.stringify(config);
    this.dbCache.set(cacheKey, dbInstance);
    console.log('💾 DB mise en cache:', cacheKey.substring(0, 50) + '...');
  }

  /**
   * Vérifier si un listener est déjà actif pour éviter les doublons
   */
  isListenerActive(collection, userId, filters = {}) {
    const listenerKey = `${collection}-${userId}-${JSON.stringify(filters)}`;
    return this.activeListeners.has(listenerKey);
  }

  /**
   * Enregistrer un listener actif
   */
  registerListener(collection, userId, filters = {}, unsubscribe) {
    const listenerKey = `${collection}-${userId}-${JSON.stringify(filters)}`;
    
    if (this.activeListeners.has(listenerKey)) {
      console.log('♻️ Listener déjà actif, réutilisation:', listenerKey);
      this.stats.listenersReused++;
      return this.activeListeners.get(listenerKey);
    }
    
    this.activeListeners.set(listenerKey, unsubscribe);
    this.stats.listenersCreated++;
    console.log('🎧 Nouveau listener enregistré:', listenerKey);
    
    return unsubscribe;
  }

  /**
   * Nettoyer un listener
   */
  unregisterListener(collection, userId, filters = {}) {
    const listenerKey = `${collection}-${userId}-${JSON.stringify(filters)}`;
    
    if (this.activeListeners.has(listenerKey)) {
      const unsubscribe = this.activeListeners.get(listenerKey);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      this.activeListeners.delete(listenerKey);
      console.log('🔇 Listener nettoyé:', listenerKey);
    }
  }

  /**
   * Debouncer les appels d'authentification pour éviter les appels multiples
   */
  debounceAuthCall(hookName, userId, callback, delay = 300) {
    const debounceKey = `${hookName}-${userId}`;
    
    // Annuler le timer précédent s'il existe
    if (this.authDebounceTimers.has(debounceKey)) {
      clearTimeout(this.authDebounceTimers.get(debounceKey));
      this.stats.queriesDebounced++;
    }
    
    // Créer un nouveau timer
    const timer = setTimeout(() => {
      callback();
      this.authDebounceTimers.delete(debounceKey);
    }, delay);
    
    this.authDebounceTimers.set(debounceKey, timer);
    console.log('⏱️ Appel auth debouncé:', debounceKey);
  }

  /**
   * Cache des requêtes pour éviter les appels identiques rapprochés
   */
  getCachedQuery(queryKey, ttl = 5000) {
    if (this.queryCache.has(queryKey)) {
      const cached = this.queryCache.get(queryKey);
      const now = Date.now();
      
      if (now - cached.timestamp < ttl) {
        console.log('🎯 Query Cache HIT:', queryKey);
        return cached.data;
      } else {
        this.queryCache.delete(queryKey);
        console.log('⏰ Query Cache EXPIRED:', queryKey);
      }
    }
    
    console.log('❌ Query Cache MISS:', queryKey);
    return null;
  }

  /**
   * Mettre en cache le résultat d'une requête
   */
  setCachedQuery(queryKey, data) {
    this.queryCache.set(queryKey, {
      data,
      timestamp: Date.now()
    });
    console.log('💾 Query mise en cache:', queryKey);
  }

  /**
   * Nettoyer tous les caches et listeners
   */
  cleanup() {
    // Nettoyer les listeners actifs
    for (const [key, unsubscribe] of this.activeListeners) {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    }
    this.activeListeners.clear();
    
    // Nettoyer les timers de debounce
    for (const timer of this.authDebounceTimers.values()) {
      clearTimeout(timer);
    }
    this.authDebounceTimers.clear();
    
    // Nettoyer les caches
    this.queryCache.clear();
    
    console.log('🧹 OptimizationManager nettoyé');
  }

  /**
   * Obtenir les statistiques d'optimisation
   */
  getStats() {
    return {
      ...this.stats,
      activeListeners: this.activeListeners.size,
      cachedQueries: this.queryCache.size,
      pendingDebounces: this.authDebounceTimers.size
    };
  }

  /**
   * Afficher un rapport d'optimisation
   */
  logOptimizationReport() {
    const stats = this.getStats();
    console.log('📊 RAPPORT D\'OPTIMISATION FIREBASE:');
    console.log('  Cache DB - Hits:', stats.cacheHits, 'Misses:', stats.cacheMisses);
    console.log('  Listeners - Créés:', stats.listenersCreated, 'Réutilisés:', stats.listenersReused);
    console.log('  Queries - Debouncées:', stats.queriesDebounced);
    console.log('  Actifs - Listeners:', stats.activeListeners, 'Queries en cache:', stats.cachedQueries);
  }
}

// Instance singleton
const optimizationManager = new OptimizationManager();

// Nettoyer automatiquement au déchargement de la page
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    optimizationManager.cleanup();
  });
}

export default optimizationManager;