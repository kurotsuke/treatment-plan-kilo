/**
 * Utilitaires pour les calculs de dates dans le Gantt
 */

/**
 * Convertit une durée relative en jours
 * @param {Object} duree - Objet durée avec valeur et unité
 * @param {number} duree.valeur - Valeur numérique de la durée
 * @param {string} duree.unite - Unité de temps (jour, jours, semaine, semaines, mois, month, months)
 * @returns {number} Nombre de jours correspondant
 */
export function dureeEnJours(duree) {
  if (!duree || !duree.valeur || !duree.unite) return 1;
  
  const conversions = {
    'jour': 1,
    'jours': 1,
    'semaine': 7,
    'semaines': 7,
    'mois': 30,
    'month': 30,
    'months': 30
  };
  
  const multiplicateur = conversions[duree.unite.toLowerCase()] || 1;
  return duree.valeur * multiplicateur;
}

/**
 * Calcule la date de début d'une tâche en fonction de ses dépendances
 * Utilise une logique simplifiée "after" (une tâche commence après qu'une autre se termine)
 * @param {Object} tache - Tâche dont on calcule la date de début
 * @param {Map} tachesMap - Map des tâches indexées par ID
 * @param {Date} dateDebutProjet - Date de début du projet
 * @returns {Date} Date de début calculée pour la tâche
 */
export function calculerDateDebut(tache, tachesMap, dateDebutProjet) {
  console.log(`[calculerDateDebut] 🎯 Calcul pour tâche ${tache.id}`, {
    aDependances: !!(tache.dependances && tache.dependances.length > 0),
    nombreDependances: tache.dependances?.length || 0,
    tachesMapSize: tachesMap.size
  });
  
  if (!tache.dependances || tache.dependances.length === 0) {
    console.log(`[calculerDateDebut] ✅ Tâche ${tache.id} sans dépendances, date début = date projet`);
    return new Date(dateDebutProjet);
  }
  
  let dateMax = new Date(dateDebutProjet);
  
  for (const dep of tache.dependances) {
    // Format simplifié: la dépendance peut être une string (ID de la tâche) ou un objet
    let idTachePrecedente;
    let decalageJours = 0;
    
    if (typeof dep === 'string') {
      // Format simple: juste l'ID de la tâche précédente
      idTachePrecedente = dep;
    } else if (typeof dep === 'object') {
      // Format objet: peut contenir l'ID et un décalage optionnel
      idTachePrecedente = dep.after || dep.id_tache_precedente || dep.id;
      // Si un décalage est spécifié, l'utiliser
      if (dep.decalage) {
        decalageJours = dureeEnJours(dep.decalage);
      }
    }
    
    console.log(`[calculerDateDebut] 🔗 Traitement dépendance "after" pour ${tache.id}:`, {
      idTachePrecedente,
      decalageJours,
      formatDep: typeof dep,
      originalDep: dep
    });
    
    const tachePrecedente = tachesMap.get(idTachePrecedente);
    if (!tachePrecedente) {
      console.warn(`[calculerDateDebut] ⚠️ Dépendance non trouvée: ${idTachePrecedente} pour tâche ${tache.id}`);
      continue;
    }
    
    // Vérifier que la tâche précédente a bien ses dates calculées
    if (!tachePrecedente.startAt || !tachePrecedente.endAt) {
      console.error(`[calculerDateDebut] ❌ La tâche précédente ${idTachePrecedente} n'a pas ses dates calculées!`, {
        startAt: tachePrecedente.startAt,
        endAt: tachePrecedente.endAt
      });
      continue;
    }
    
    // Logique simplifiée: la tâche commence après la fin de la tâche précédente
    let dateCalculee = new Date(tachePrecedente.endAt);
    
    // Si pas de décalage spécifié, ajouter 1 jour par défaut pour éviter le chevauchement
    const decalageEffectif = decalageJours === 0 ? 1 : decalageJours;
    dateCalculee.setDate(dateCalculee.getDate() + decalageEffectif);
    
    console.log(`[calculerDateDebut] 📅 Date calculée (after ${idTachePrecedente}): ${dateCalculee.toISOString()}, décalage: ${decalageEffectif}j`);
    
    if (dateCalculee > dateMax) {
      console.log(`[calculerDateDebut] 🔄 Nouvelle date max pour ${tache.id}: ${dateCalculee.toISOString()}`);
      dateMax = dateCalculee;
    }
  }
  
  console.log(`[calculerDateDebut] ✅ Date finale pour ${tache.id}: ${dateMax.toISOString()}`);
  return dateMax;
}

/**
 * Formate une date pour un input HTML de type date
 * @param {Date} date - Date à formater
 * @returns {string} Date formatée en YYYY-MM-DD
 */
export function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Ajoute des jours à une date
 * @param {Date} date - Date de base
 * @param {number} days - Nombre de jours à ajouter (peut être négatif)
 * @returns {Date} Nouvelle date
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calcule le nombre de jours entre deux dates
 * @param {Date} startDate - Date de début
 * @param {Date} endDate - Date de fin
 * @returns {number} Nombre de jours
 */
export function daysBetween(startDate, endDate) {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}