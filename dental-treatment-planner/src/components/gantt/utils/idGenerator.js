/**
 * Générateur d'ID unique incrémental pour éviter les duplications
 */
let idCounter = 0;

/**
 * Génère un ID unique avec un préfixe, timestamp, compteur et chaîne aléatoire
 * @param {string} prefix - Préfixe de l'ID (par défaut 'task')
 * @returns {string} ID unique généré
 */
export function generateUniqueId(prefix = 'task') {
  idCounter++;
  return `${prefix}_${Date.now()}_${idCounter}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Réinitialise le compteur d'ID (utile pour les tests)
 */
export function resetIdCounter() {
  idCounter = 0;
}