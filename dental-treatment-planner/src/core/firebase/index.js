/**
 * Point d'entrée pour la couche d'abstraction Firebase
 * Exporte tous les composants de base
 */

export { default as BaseRepository } from './BaseRepository.js';
export { default as QueryBuilder } from './QueryBuilder.js';
export { default as CacheManager } from './CacheManager.js';
export { default as ErrorHandler } from './ErrorHandler.js';

// Utilitaires pour créer des repositories spécialisés
export const createRepository = (collectionName, schema = null) => {
  return new BaseRepository(collectionName, schema);
};

// Types de validation de base
export const ValidationTypes = {
  REQUIRED: 'required',
  EMAIL: 'email',
  PHONE: 'phone',
  NUMBER: 'number',
  ARRAY: 'array',
  OBJECT: 'object',
  STRING: 'string',
  BOOLEAN: 'boolean',
  DATE: 'date'
};

// Schéma de validation de base
export class BaseSchema {
  constructor(fields = {}) {
    this.fields = fields;
  }

  validate(data) {
    const errors = [];
    
    Object.entries(this.fields).forEach(([fieldName, rules]) => {
      const value = data[fieldName];
      
      // Vérifier les règles
      if (Array.isArray(rules)) {
        rules.forEach(rule => {
          const error = this.validateField(fieldName, value, rule);
          if (error) errors.push(error);
        });
      } else {
        const error = this.validateField(fieldName, value, rules);
        if (error) errors.push(error);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validatePartial(data) {
    const errors = [];
    
    // Valider seulement les champs présents dans les données
    Object.entries(data).forEach(([fieldName, value]) => {
      if (this.fields[fieldName]) {
        const rules = this.fields[fieldName];
        
        if (Array.isArray(rules)) {
          rules.forEach(rule => {
            // Ignorer la règle 'required' pour la validation partielle
            if (rule !== ValidationTypes.REQUIRED) {
              const error = this.validateField(fieldName, value, rule);
              if (error) errors.push(error);
            }
          });
        } else if (rules !== ValidationTypes.REQUIRED) {
          const error = this.validateField(fieldName, value, rules);
          if (error) errors.push(error);
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateField(fieldName, value, rule) {
    switch (rule) {
      case ValidationTypes.REQUIRED:
        if (value === undefined || value === null || value === '') {
          return `Le champ ${fieldName} est requis`;
        }
        break;
        
      case ValidationTypes.EMAIL:
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return `Le champ ${fieldName} doit être un email valide`;
        }
        break;
        
      case ValidationTypes.PHONE:
        if (value && !/^[\d\s\-\+\(\)]{10,}$/.test(value)) {
          return `Le champ ${fieldName} doit être un numéro de téléphone valide`;
        }
        break;
        
      case ValidationTypes.NUMBER:
        if (value !== undefined && typeof value !== 'number') {
          return `Le champ ${fieldName} doit être un nombre`;
        }
        break;
        
      case ValidationTypes.ARRAY:
        if (value !== undefined && !Array.isArray(value)) {
          return `Le champ ${fieldName} doit être un tableau`;
        }
        break;
        
      case ValidationTypes.OBJECT:
        if (value !== undefined && (typeof value !== 'object' || Array.isArray(value))) {
          return `Le champ ${fieldName} doit être un objet`;
        }
        break;
        
      case ValidationTypes.STRING:
        if (value !== undefined && typeof value !== 'string') {
          return `Le champ ${fieldName} doit être une chaîne de caractères`;
        }
        break;
        
      case ValidationTypes.BOOLEAN:
        if (value !== undefined && typeof value !== 'boolean') {
          return `Le champ ${fieldName} doit être un booléen`;
        }
        break;
        
      case ValidationTypes.DATE:
        if (value !== undefined && !(value instanceof Date) && !this.isValidDateString(value)) {
          return `Le champ ${fieldName} doit être une date valide`;
        }
        break;
        
      default:
        // Règle personnalisée (fonction)
        if (typeof rule === 'function') {
          const result = rule(value, fieldName);
          if (result !== true) {
            return result || `Le champ ${fieldName} est invalide`;
          }
        }
    }
    
    return null;
  }

  isValidDateString(value) {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
}

// Utilitaires de logging
export const FirebaseLogger = {
  info: (message, data = {}) => {
    console.log(`🔥 Firebase: ${message}`, data);
  },
  
  warn: (message, data = {}) => {
    console.warn(`⚠️ Firebase: ${message}`, data);
  },
  
  error: (message, error = null, data = {}) => {
    console.error(`❌ Firebase: ${message}`, { error, ...data });
  },
  
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`🐛 Firebase: ${message}`, data);
    }
  }
};

// Configuration par défaut
export const FirebaseConfig = {
  cache: {
    defaultTtl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    autoCleanupInterval: 5 * 60 * 1000 // 5 minutes
  },
  
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  },
  
  query: {
    defaultLimit: 50,
    maxLimit: 1000
  }
};

// Hooks utilitaires pour React
export const useFirebaseRepository = (collectionName, schema = null) => {
  const [repository] = useState(() => new BaseRepository(collectionName, schema));
  
  useEffect(() => {
    return () => {
      repository.cleanup();
    };
  }, [repository]);
  
  return repository;
};

// Export des hooks React si disponibles
let useState, useEffect;
try {
  const React = require('react');
  useState = React.useState;
  useEffect = React.useEffect;
} catch (e) {
  // React n'est pas disponible, ignorer les hooks
}