/**
 * Repository de base pour toutes les opérations Firebase
 * Fournit CRUD unifié, cache intelligent, gestion d'erreurs et validation
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
  writeBatch
} from 'firebase/firestore';
import { getDb } from '../../config/firebase';
import QueryBuilder from './QueryBuilder';
import CacheManager from './CacheManager';
import ErrorHandler from './ErrorHandler';

class BaseRepository {
  constructor(collectionName, schema = null) {
    this.collectionName = collectionName;
    this.schema = schema;
    this.cache = new CacheManager(collectionName);
    this.errorHandler = ErrorHandler;
    this.activeListeners = new Map();
    
    // Démarrer le nettoyage automatique du cache
    this.cache.startAutoCleanup();
    
    console.log(`🏗️ BaseRepository initialisé pour ${collectionName}`);
  }

  /**
   * Obtenir la référence de collection
   * @returns {CollectionReference}
   */
  getCollectionRef() {
    const db = getDb();
    return collection(db, this.collectionName);
  }

  /**
   * Créer un nouveau document
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} data - Données à créer
   * @returns {Promise<Object>} Document créé
   */
  async create(userId, data) {
    const operation = async () => {
      console.log(`➕ Création dans ${this.collectionName} pour utilisateur ${userId}`);
      
      // Validation des données
      if (this.schema && this.schema.validate) {
        const validation = this.schema.validate(data);
        if (!validation.isValid) {
          throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
        }
      }
      
      const collectionRef = this.getCollectionRef();
      
      // Préparer les données avec métadonnées
      const documentData = {
        ...data,
        userId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Créer le document
      const docRef = await addDoc(collectionRef, documentData);
      
      // Préparer le résultat
      const result = {
        id: docRef.id,
        ...documentData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mettre à jour le cache
      this.cache.set(`${userId}:doc:${docRef.id}`, result);
      this.cache.invalidate(`${userId}:list`); // Invalider la liste
      
      console.log(`✅ Document créé: ${docRef.id}`);
      return result;
    };

    return this.errorHandler.handle(
      null, 
      operation, 
      { operation: 'create', collection: this.collectionName, userId }
    ).catch(error => {
      return this.errorHandler.handle(
        error, 
        operation, 
        { operation: 'create', collection: this.collectionName, userId }
      );
    });
  }

  /**
   * Lire un document par ID
   * @param {string} docId - ID du document
   * @param {string} userId - ID de l'utilisateur (pour le cache)
   * @returns {Promise<Object|null>} Document ou null
   */
  async read(docId, userId = null) {
    const operation = async () => {
      console.log(`🔍 Lecture ${this.collectionName}/${docId}`);
      
      // Vérifier le cache d'abord
      if (userId) {
        const cached = this.cache.get(`${userId}:doc:${docId}`);
        if (cached) {
          return cached;
        }
      }
      
      const db = getDb();
      const docRef = doc(db, this.collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      const result = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date()
      };
      
      // Mettre en cache
      if (userId) {
        this.cache.set(`${userId}:doc:${docId}`, result);
      }
      
      console.log(`✅ Document lu: ${docId}`);
      return result;
    };

    return this.errorHandler.handle(
      null,
      operation,
      { operation: 'read', collection: this.collectionName, docId }
    ).catch(error => {
      return this.errorHandler.handle(
        error,
        operation,
        { operation: 'read', collection: this.collectionName, docId }
      );
    });
  }

  /**
   * Mettre à jour un document
   * @param {string} docId - ID du document
   * @param {Object} updates - Données à mettre à jour
   * @param {string} userId - ID de l'utilisateur (pour le cache)
   * @returns {Promise<Object>} Document mis à jour
   */
  async update(docId, updates, userId = null) {
    const operation = async () => {
      console.log(`📝 Mise à jour ${this.collectionName}/${docId}`);
      
      // Validation partielle des données
      if (this.schema && this.schema.validatePartial) {
        const validation = this.schema.validatePartial(updates);
        if (!validation.isValid) {
          throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
        }
      }
      
      const db = getDb();
      const docRef = doc(db, this.collectionName, docId);
      
      // Préparer les données avec timestamp
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      // Optimistic update du cache
      let rollback = null;
      if (userId) {
        const currentData = this.cache.get(`${userId}:doc:${docId}`);
        if (currentData) {
          const optimisticData = { ...currentData, ...updateData, updatedAt: new Date() };
          rollback = this.cache.optimisticUpdate(`${userId}:doc:${docId}`, optimisticData);
        }
      }
      
      try {
        // Mettre à jour dans Firestore
        await updateDoc(docRef, updateData);
        
        // Préparer le résultat
        const result = {
          id: docId,
          ...updates,
          updatedAt: new Date()
        };
        
        // Confirmer la mise à jour du cache
        if (userId) {
          this.cache.set(`${userId}:doc:${docId}`, result);
          this.cache.invalidate(`${userId}:list`); // Invalider la liste
        }
        
        console.log(`✅ Document mis à jour: ${docId}`);
        return result;
        
      } catch (error) {
        // Rollback en cas d'erreur
        if (rollback) {
          rollback();
        }
        throw error;
      }
    };

    return this.errorHandler.handle(
      null,
      operation,
      { operation: 'update', collection: this.collectionName, docId }
    ).catch(error => {
      return this.errorHandler.handle(
        error,
        operation,
        { operation: 'update', collection: this.collectionName, docId }
      );
    });
  }

  /**
   * Supprimer un document
   * @param {string} docId - ID du document
   * @param {string} userId - ID de l'utilisateur (pour le cache)
   * @returns {Promise<void>}
   */
  async delete(docId, userId = null) {
    const operation = async () => {
      console.log(`🗑️ Suppression ${this.collectionName}/${docId}`);
      
      const db = getDb();
      const docRef = doc(db, this.collectionName, docId);
      
      // Supprimer de Firestore
      await deleteDoc(docRef);
      
      // Nettoyer le cache
      if (userId) {
        this.cache.invalidate(`${userId}:doc:${docId}`);
        this.cache.invalidate(`${userId}:list`);
      }
      
      console.log(`✅ Document supprimé: ${docId}`);
    };

    return this.errorHandler.handle(
      null,
      operation,
      { operation: 'delete', collection: this.collectionName, docId }
    ).catch(error => {
      return this.errorHandler.handle(
        error,
        operation,
        { operation: 'delete', collection: this.collectionName, docId }
      );
    });
  }

  /**
   * Trouver des documents avec filtres
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} filters - Filtres à appliquer
   * @returns {Promise<Array>} Liste des documents
   */
  async findAll(userId, filters = {}) {
    const operation = async () => {
      console.log(`🔍 Recherche dans ${this.collectionName} pour utilisateur ${userId}`);
      
      // Vérifier le cache pour les requêtes simples
      const cacheKey = `${userId}:list:${JSON.stringify(filters)}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Object.keys(filters).length === 0) {
        console.log('💾 Utilisation du cache pour la liste');
        return cached;
      }
      
      const collectionRef = this.getCollectionRef();
      const queryBuilder = QueryBuilder.for(collectionRef);
      
      // Ajouter le filtre utilisateur
      queryBuilder.where('userId', '==', userId);
      
      // Appliquer les filtres
      this.applyFilters(queryBuilder, filters);
      
      // Construire et exécuter la requête
      const query = queryBuilder.build();
      const snapshot = await getDocs(query);
      
      // Traiter les résultats
      const results = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        results.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        });
      });
      
      // Tri côté client si nécessaire
      if (filters.sortBy) {
        this.sortResults(results, filters.sortBy, filters.sortOrder);
      }
      
      // Mettre en cache
      if (Object.keys(filters).length === 0) {
        this.cache.set(`${userId}:list`, results);
      }
      
      console.log(`✅ ${results.length} documents trouvés`);
      return results;
    };

    return this.errorHandler.handle(
      null,
      operation,
      { operation: 'findAll', collection: this.collectionName, userId }
    ).catch(error => {
      return this.errorHandler.handle(
        error,
        operation,
        { operation: 'findAll', collection: this.collectionName, userId }
      );
    });
  }

  /**
   * S'abonner aux changements en temps réel
   * @param {string} userId - ID de l'utilisateur
   * @param {Function} callback - Fonction appelée lors des changements
   * @param {Object} filters - Filtres optionnels
   * @returns {Function} Fonction de désabonnement
   */
  subscribe(userId, callback, filters = {}) {
    const listenerId = `${userId}:${Date.now()}`;
    
    try {
      console.log(`🔥 Abonnement temps réel ${this.collectionName} pour ${userId}`);
      
      const collectionRef = this.getCollectionRef();
      const queryBuilder = QueryBuilder.for(collectionRef);
      
      // Ajouter le filtre utilisateur
      queryBuilder.where('userId', '==', userId);
      
      // Appliquer les filtres
      this.applyFilters(queryBuilder, filters);
      
      // Construire la requête
      const query = queryBuilder.build();
      
      // Créer le listener
      const unsubscribe = onSnapshot(
        query,
        (snapshot) => {
          console.log(`🔥 Mise à jour temps réel: ${snapshot.size} documents`);
          
          const results = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const result = {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date()
            };
            
            results.push(result);
            
            // Mettre à jour le cache individuel
            this.cache.handleRealtimeUpdate(doc.id, result, userId);
          });
          
          // Tri côté client si nécessaire
          if (filters.sortBy) {
            this.sortResults(results, filters.sortBy, filters.sortOrder);
          }
          
          // Mettre à jour le cache de liste
          if (Object.keys(filters).length === 0) {
            this.cache.set(`${userId}:list`, results);
          }
          
          // Appeler le callback
          callback(results);
        },
        (error) => {
          console.error(`❌ Erreur listener ${this.collectionName}:`, error);
          
          // Gestion robuste des erreurs réseau
          if (error.code === 'unavailable' || error.message.includes('QUIC_PROTOCOL_ERROR')) {
            console.warn('⚠️ Erreur réseau temporaire, maintien des données actuelles');
            // Ne pas appeler callback([]) pour éviter de vider les données
          } else {
            console.error('❌ Erreur critique, retour de données vides');
            callback([]);
          }
        }
      );
      
      // Stocker le listener
      this.activeListeners.set(listenerId, unsubscribe);
      
      // Retourner la fonction de désabonnement
      return () => {
        console.log(`🔥 Désabonnement ${this.collectionName} pour ${userId}`);
        unsubscribe();
        this.activeListeners.delete(listenerId);
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la création du listener:', error);
      callback([]);
      return () => {}; // Fonction vide pour éviter les erreurs
    }
  }

  /**
   * Appliquer les filtres au QueryBuilder
   * @param {QueryBuilder} queryBuilder - Builder de requête
   * @param {Object} filters - Filtres à appliquer
   */
  applyFilters(queryBuilder, filters) {
    // Filtres standards
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && !this.isSpecialFilter(key)) {
        queryBuilder.where(key, '==', value);
      }
    });
    
    // Gestion spéciale pour certains filtres
    if (filters.limitCount) {
      queryBuilder.limit(filters.limitCount);
    }
    
    if (filters.startAfterDoc) {
      queryBuilder.startAfter(filters.startAfterDoc);
    }
    
    // Éviter orderBy si on a des filtres complexes (pour éviter les index manquants)
    if (filters.forceOrderBy && filters.sortBy) {
      queryBuilder.orderBy(filters.sortBy, filters.sortOrder || 'desc');
    }
  }

  /**
   * Vérifier si c'est un filtre spécial
   * @param {string} key - Clé du filtre
   * @returns {boolean}
   */
  isSpecialFilter(key) {
    const specialFilters = [
      'sortBy', 'sortOrder', 'limitCount', 'startAfterDoc', 'forceOrderBy'
    ];
    return specialFilters.includes(key);
  }

  /**
   * Trier les résultats côté client
   * @param {Array} results - Résultats à trier
   * @param {string} sortBy - Champ de tri
   * @param {string} sortOrder - Ordre de tri
   */
  sortResults(results, sortBy, sortOrder = 'desc') {
    results.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });
  }

  /**
   * Opération batch (transaction)
   * @param {Array} operations - Liste des opérations
   * @returns {Promise<void>}
   */
  async batch(operations) {
    const operation = async () => {
      console.log(`📦 Opération batch: ${operations.length} opérations`);
      
      const db = getDb();
      const batch = writeBatch(db);
      
      operations.forEach(op => {
        const docRef = doc(db, this.collectionName, op.id || doc(collection(db, this.collectionName)).id);
        
        switch (op.type) {
          case 'create':
          case 'set':
            batch.set(docRef, {
              ...op.data,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            break;
            
          case 'update':
            batch.update(docRef, {
              ...op.data,
              updatedAt: serverTimestamp()
            });
            break;
            
          case 'delete':
            batch.delete(docRef);
            break;
            
          default:
            throw new Error(`Type d'opération batch inconnu: ${op.type}`);
        }
      });
      
      await batch.commit();
      console.log('✅ Opération batch terminée');
    };

    return this.errorHandler.handle(
      null,
      operation,
      { operation: 'batch', collection: this.collectionName, count: operations.length }
    ).catch(error => {
      return this.errorHandler.handle(
        error,
        operation,
        { operation: 'batch', collection: this.collectionName, count: operations.length }
      );
    });
  }

  /**
   * Nettoyer les ressources
   */
  cleanup() {
    console.log(`🧹 Nettoyage ${this.collectionName}`);
    
    // Arrêter tous les listeners actifs
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners.clear();
    
    // Arrêter le nettoyage automatique du cache
    this.cache.stopAutoCleanup();
    
    // Vider le cache
    this.cache.clear();
  }

  /**
   * Obtenir les statistiques du repository
   * @returns {Object} Statistiques
   */
  getStats() {
    return {
      collection: this.collectionName,
      activeListeners: this.activeListeners.size,
      cache: this.cache.getStats()
    };
  }
}

export default BaseRepository;