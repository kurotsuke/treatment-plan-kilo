/**
 * Constructeur de requêtes intelligent pour Firestore
 * Gère les contraintes, optimisations et évite les problèmes d'index
 */
import { 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  endBefore,
  startAt,
  endAt
} from 'firebase/firestore';

class QueryBuilder {
  constructor(collectionRef) {
    this.collectionRef = collectionRef;
    this.constraints = [];
    this.hasOrderBy = false;
    this.orderByField = null;
    this.orderByDirection = 'asc';
  }

  /**
   * Ajouter une contrainte where
   * @param {string} field - Champ à filtrer
   * @param {string} operator - Opérateur (==, !=, <, <=, >, >=, array-contains, in, array-contains-any)
   * @param {any} value - Valeur à comparer
   * @returns {QueryBuilder} Instance pour chaînage
   */
  where(field, operator, value) {
    // Validation des paramètres
    if (!field || !operator || value === undefined) {
      throw new Error('Paramètres where invalides');
    }

    // Éviter les valeurs null/undefined qui causent des erreurs
    if (value === null || value === undefined) {
      console.warn(`⚠️ Valeur null/undefined pour le champ ${field}, requête ignorée`);
      return this;
    }

    // Optimisation : éviter les doublons
    const existingConstraint = this.constraints.find(c => 
      c.type === 'where' && c.field === field && c.operator === operator
    );
    
    if (existingConstraint) {
      console.warn(`⚠️ Contrainte where dupliquée pour ${field}, remplacement`);
      existingConstraint.value = value;
      return this;
    }

    this.constraints.push({
      type: 'where',
      field,
      operator,
      value
    });

    console.log(`🔍 Ajout contrainte where: ${field} ${operator} ${value}`);
    return this;
  }

  /**
   * Ajouter un tri
   * @param {string} field - Champ à trier
   * @param {string} direction - Direction ('asc' ou 'desc')
   * @returns {QueryBuilder} Instance pour chaînage
   */
  orderBy(field, direction = 'asc') {
    if (this.hasOrderBy) {
      console.warn(`⚠️ OrderBy déjà défini sur ${this.orderByField}, remplacement par ${field}`);
    }

    this.hasOrderBy = true;
    this.orderByField = field;
    this.orderByDirection = direction;

    this.constraints.push({
      type: 'orderBy',
      field,
      direction
    });

    console.log(`📊 Ajout tri: ${field} ${direction}`);
    return this;
  }

  /**
   * Limiter le nombre de résultats
   * @param {number} count - Nombre maximum de résultats
   * @returns {QueryBuilder} Instance pour chaînage
   */
  limit(count) {
    if (typeof count !== 'number' || count <= 0) {
      throw new Error('La limite doit être un nombre positif');
    }

    // Remplacer la limite existante
    this.constraints = this.constraints.filter(c => c.type !== 'limit');
    
    this.constraints.push({
      type: 'limit',
      count
    });

    console.log(`📏 Ajout limite: ${count}`);
    return this;
  }

  /**
   * Pagination - commencer après un document
   * @param {DocumentSnapshot} docSnapshot - Document de référence
   * @returns {QueryBuilder} Instance pour chaînage
   */
  startAfter(docSnapshot) {
    if (!docSnapshot) {
      throw new Error('Document snapshot requis pour startAfter');
    }

    // Supprimer les autres contraintes de pagination
    this.constraints = this.constraints.filter(c => 
      !['startAfter', 'startAt', 'endBefore', 'endAt'].includes(c.type)
    );

    this.constraints.push({
      type: 'startAfter',
      docSnapshot
    });

    console.log(`⏭️ Pagination startAfter: ${docSnapshot.id}`);
    return this;
  }

  /**
   * Pagination - commencer à un document
   * @param {DocumentSnapshot} docSnapshot - Document de référence
   * @returns {QueryBuilder} Instance pour chaînage
   */
  startAt(docSnapshot) {
    if (!docSnapshot) {
      throw new Error('Document snapshot requis pour startAt');
    }

    this.constraints = this.constraints.filter(c => 
      !['startAfter', 'startAt', 'endBefore', 'endAt'].includes(c.type)
    );

    this.constraints.push({
      type: 'startAt',
      docSnapshot
    });

    console.log(`▶️ Pagination startAt: ${docSnapshot.id}`);
    return this;
  }

  /**
   * Optimiser la requête pour éviter les problèmes d'index
   * @returns {QueryBuilder} Instance pour chaînage
   */
  optimizeForIndex() {
    // Si on a orderBy + where sur des champs différents, c'est problématique
    const whereConstraints = this.constraints.filter(c => c.type === 'where');
    const orderByConstraint = this.constraints.find(c => c.type === 'orderBy');

    if (orderByConstraint && whereConstraints.length > 0) {
      const hasWhereOnDifferentField = whereConstraints.some(w => 
        w.field !== orderByConstraint.field && w.operator !== '=='
      );

      if (hasWhereOnDifferentField) {
        console.warn('⚠️ Requête complexe détectée, suppression du orderBy pour éviter l\'index manquant');
        this.constraints = this.constraints.filter(c => c.type !== 'orderBy');
        this.hasOrderBy = false;
        this.orderByField = null;
      }
    }

    return this;
  }

  /**
   * Construire la requête Firestore finale
   * @returns {Query} Requête Firestore
   */
  build() {
    console.log('🏗️ Construction de la requête avec contraintes:', this.constraints.length);

    // Optimiser automatiquement
    this.optimizeForIndex();

    // Construire les contraintes Firestore
    const firestoreConstraints = [];

    for (const constraint of this.constraints) {
      try {
        switch (constraint.type) {
          case 'where':
            firestoreConstraints.push(
              where(constraint.field, constraint.operator, constraint.value)
            );
            break;

          case 'orderBy':
            firestoreConstraints.push(
              orderBy(constraint.field, constraint.direction)
            );
            break;

          case 'limit':
            firestoreConstraints.push(
              limit(constraint.count)
            );
            break;

          case 'startAfter':
            firestoreConstraints.push(
              startAfter(constraint.docSnapshot)
            );
            break;

          case 'startAt':
            firestoreConstraints.push(
              startAt(constraint.docSnapshot)
            );
            break;

          case 'endBefore':
            firestoreConstraints.push(
              endBefore(constraint.docSnapshot)
            );
            break;

          case 'endAt':
            firestoreConstraints.push(
              endAt(constraint.docSnapshot)
            );
            break;

          default:
            console.warn(`⚠️ Type de contrainte inconnu: ${constraint.type}`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la construction de la contrainte ${constraint.type}:`, error);
        throw new Error(`Contrainte invalide: ${constraint.type}`);
      }
    }

    // Construire la requête finale
    if (firestoreConstraints.length === 0) {
      console.log('📋 Requête simple sans contraintes');
      return this.collectionRef;
    }

    console.log(`🔧 Requête construite avec ${firestoreConstraints.length} contraintes`);
    return query(this.collectionRef, ...firestoreConstraints);
  }

  /**
   * Créer une nouvelle instance pour une collection
   * @param {CollectionReference} collectionRef - Référence de collection
   * @returns {QueryBuilder} Nouvelle instance
   */
  static for(collectionRef) {
    return new QueryBuilder(collectionRef);
  }

  /**
   * Réinitialiser le builder
   * @returns {QueryBuilder} Instance pour chaînage
   */
  reset() {
    this.constraints = [];
    this.hasOrderBy = false;
    this.orderByField = null;
    this.orderByDirection = 'asc';
    console.log('🔄 QueryBuilder réinitialisé');
    return this;
  }

  /**
   * Cloner le builder actuel
   * @returns {QueryBuilder} Nouvelle instance avec les mêmes contraintes
   */
  clone() {
    const newBuilder = new QueryBuilder(this.collectionRef);
    newBuilder.constraints = [...this.constraints];
    newBuilder.hasOrderBy = this.hasOrderBy;
    newBuilder.orderByField = this.orderByField;
    newBuilder.orderByDirection = this.orderByDirection;
    return newBuilder;
  }

  /**
   * Obtenir un résumé de la requête pour debug
   * @returns {Object} Résumé de la requête
   */
  getSummary() {
    const whereConstraints = this.constraints.filter(c => c.type === 'where');
    const orderByConstraints = this.constraints.filter(c => c.type === 'orderBy');
    const limitConstraint = this.constraints.find(c => c.type === 'limit');
    const paginationConstraints = this.constraints.filter(c => 
      ['startAfter', 'startAt', 'endBefore', 'endAt'].includes(c.type)
    );

    return {
      collection: this.collectionRef.path,
      whereCount: whereConstraints.length,
      hasOrderBy: orderByConstraints.length > 0,
      hasLimit: !!limitConstraint,
      hasPagination: paginationConstraints.length > 0,
      totalConstraints: this.constraints.length,
      constraints: this.constraints.map(c => ({
        type: c.type,
        field: c.field,
        operator: c.operator,
        hasValue: c.value !== undefined
      }))
    };
  }
}

export default QueryBuilder;