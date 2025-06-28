/**
 * Service pour transformer les devis en plans de traitement via Gemini
 */
import { getVisionModel, isGeminiConfigured } from '../config/gemini.js';

/**
 * Génère un plan de traitement dentaire en appelant l'API Gemini
 * @param {object} inputData - Les données d'entrée contenant medecins_par_phase et liste_actes
 * @returns {Promise<Array>} Plan de traitement au format JSON Kibo Gantt
 */
export async function generateDentalTreatmentPlan(inputData) {
  console.log('🤖 Début de la génération du plan de traitement avec Gemini');
  console.log('📊 Données d\'entrée:', inputData);

  // Vérifier si l'API est configurée
  if (!isGeminiConfigured()) {
    throw new Error('Clé API Gemini non configurée. Veuillez la configurer dans les paramètres.');
  }

  // Le prompt détaillé avec toutes les règles
  const promptTemplate = `
Rôle et Objectif :
Tu es un assistant expert en planification de traitements dentaires. Ton rôle est de prendre des données structurées sur les actes à réaliser et de les transformer en un plan de traitement chronologique au format JSON, destiné à un composant de diagramme de Gantt.

Format des Données d'Entrée :
Tu recevras les informations sous la forme de deux objets JSON.

Règles de Génération du JSON :
1. Ordre de Traitement :
   - Tu dois traiter les actes en respectant impérativement l'ordre numérique des phases : tous les actes de la "1 - Phase de soins" d'abord, puis ceux de la "2 - Phase fonctionnelle et orthodontie", et enfin ceux de la "3 - Phase esthétique".
   - Au sein de chaque phase, tu dois appliquer la logique clinique pour ordonner les actes (ex: un détartrage avant tout, une extraction avant la pose d'un implant, une prise d'empreinte avant la pose d'une couronne).

2. Attribution du Médecin (owner) :
   - Pour chaque acte, vérifie s'il possède une propriété "medecin". Si oui, utilise sa valeur pour "owner.name".
   - Sinon, utilise le nom du médecin par défaut de la phase correspondante.
   - Pour les tâches de "Cicatrisation", assigne-les au "Patient".

3. Gestion des Délais (Cicatrisation et Laboratoire) :
   - Cicatrisation : Après une extraction ou la pose d'un implant, crée une tâche distincte. Durée post-extraction : 3 semaines. Durée post-implant : 4 mois.
   - Laboratoire : Pour les couronnes ou facettes, incorpore un délai de 10 à 14 jours ouvrés en décalant la date de début de la "Pose" par rapport à la "Prise d'empreinte". N'ajoute pas de tâche visible pour le laboratoire.

4. Structure du JSON de Sortie :
   - Le résultat final DOIT être un tableau d'objets JSON respectant scrupuleusement cette structure :
   {
     "id": "un identifiant unique de type UUID",
     "name": "un nom clair et concis pour l'étape",
     "startAt": "la date de début calculée au format ISO 8601",
     "endAt": "la date de fin calculée au format ISO 8601",
     "status": { "id": "status-planned", "name": "Planned", "color": "#6B7280" },
     "owner": { "id": "owner-X", "name": "Nom du médecin calculé", "image": "" },
     "group": { "id": "group-X", "name": "Nom de la phase extraite des données" },
     "product": null, "initiative": null, "release": null
   }

Mise en application :
Génère maintenant le tableau JSON complet en te basant sur les données d'entrée ci-dessous. Le plan de traitement doit commencer le 1er juillet 2025. Assure-toi que la sortie est uniquement le tableau JSON, sans texte ou formatage supplémentaire comme \`\`\`json.
`;

  // Construction du prompt final en injectant les données spécifiques
  const fullPrompt = `
    ${promptTemplate}

    Données d'entrée :
    \`\`\`json
    ${JSON.stringify(inputData, null, 2)}
    \`\`\`
  `;

  try {
    console.log('🚀 Envoi de la requête à Gemini...');
    console.log('📏 Taille du prompt:', fullPrompt.length, 'caractères');
    
    const aiModel = getVisionModel();
    console.log('🔧 Modèle AI configuré:', aiModel ? 'OK' : 'ERREUR');
    
    const result = await aiModel.generateContent(fullPrompt);
    console.log('📡 Résultat reçu de Gemini:', result ? 'OK' : 'VIDE');
    
    const response = await result.response;
    console.log('📋 Réponse extraite:', response ? 'OK' : 'VIDE');
    
    let text = response.text();
    console.log('📝 Réponse brute de Gemini (longueur:', text?.length || 0, '):', text);

    // Vérifier si la réponse est vide
    if (!text || text.trim().length === 0) {
      throw new Error('Gemini a renvoyé une réponse vide. Vérifiez votre clé API et votre quota.');
    }

    // Nettoyage de la réponse pour s'assurer qu'elle est un JSON pur
    text = text.trim().replace(/^```json\n/, '').replace(/\n```$/, '');
    console.log('🧹 Texte nettoyé (longueur:', text.length, '):', text.substring(0, 200) + '...');

    // Vérifier si le texte nettoyé est vide
    if (text.length === 0) {
      throw new Error('Après nettoyage, la réponse de Gemini est vide.');
    }

    // Parser le JSON
    const ganttData = JSON.parse(text);
    
    console.log('✅ Plan de traitement généré avec succès:', ganttData.length, 'tâches');
    return ganttData;

  } catch (error) {
    console.error('❌ Erreur lors de la requête à l\'API Gemini:', error);
    console.error('🔍 Type d\'erreur:', error.constructor.name);
    console.error('📄 Message d\'erreur:', error.message);
    
    // Fournir des messages d'erreur plus spécifiques
    if (error.message.includes('API key')) {
      throw new Error('Clé API Gemini invalide. Vérifiez votre configuration.');
    } else if (error.message.includes('quota')) {
      throw new Error('Quota API Gemini dépassé. Attendez ou vérifiez votre plan.');
    } else if (error.message.includes('JSON')) {
      throw new Error('Gemini a renvoyé une réponse mal formatée. Réessayez.');
    } else {
      throw new Error(`La génération du plan de traitement a échoué: ${error.message}`);
    }
  }
}

/**
 * Transforme un devis en format d'entrée pour Gemini
 * @param {object} quote - Le devis à transformer
 * @returns {object} Données formatées pour Gemini
 */
export function mapQuoteToGeminiInput(quote) {
  console.log('🔄 Transformation du devis en format Gemini:', quote.quoteNumber);
  
  const medecins_par_phase = {};
  const liste_actes = [];
  
  // Mapper les phases et leurs médecins
  quote.phases.forEach(phase => {
    // Normaliser le nom de la phase pour correspondre au format attendu
    let phaseName = phase.name;
    if (phaseName.includes('Phase 1') || phaseName.includes('urgence') || phaseName.includes('soins')) {
      phaseName = "1 - Phase de soins";
    } else if (phaseName.includes('Phase 2') || phaseName.includes('fonctionnelle') || phaseName.includes('orthodontie')) {
      phaseName = "2 - Phase fonctionnelle et orthodontie";
    } else if (phaseName.includes('Phase 3') || phaseName.includes('esthétique')) {
      phaseName = "3 - Phase esthétique";
    }
    
    // Assigner le médecin de la phase
    const doctorName = phase.doctor?.name || quote.referringDoctor?.name || 'Dr. Inconnu';
    medecins_par_phase[phaseName] = doctorName;
    
    // Mapper les traitements de la phase
    phase.treatments.forEach(treatment => {
      liste_actes.push({
        phase: phaseName,
        nom: treatment.name,
        medecin: treatment.hasCustomDoctor ? treatment.doctor?.name : undefined,
        dents: treatment.teeth ? treatment.teeth.split(',').map(t => t.trim()).filter(t => t) : [],
        duree_estimee: treatment.sessions || 1
      });
    });
  });
  
  const result = { medecins_par_phase, liste_actes };
  console.log('✅ Transformation terminée:', result);
  return result;
}

/**
 * Valide les données d'un plan de traitement généré
 * @param {Array} ganttData - Les données du plan de traitement
 * @returns {boolean} True si valide
 */
export function validateGanttData(ganttData) {
  if (!Array.isArray(ganttData)) {
    throw new Error('Le plan de traitement doit être un tableau');
  }
  
  ganttData.forEach((task, index) => {
    if (!task.id || !task.name || !task.startAt || !task.endAt) {
      throw new Error(`Tâche ${index + 1} incomplète: propriétés manquantes`);
    }
    
    if (!task.status || !task.owner || !task.group) {
      throw new Error(`Tâche ${index + 1} incomplète: objets status/owner/group manquants`);
    }
    
    // Valider les dates
    const startDate = new Date(task.startAt);
    const endDate = new Date(task.endAt);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error(`Tâche ${index + 1}: dates invalides`);
    }
    
    if (endDate < startDate) {
      throw new Error(`Tâche ${index + 1}: date de fin antérieure à la date de début`);
    }
  });
  
  return true;
}

/**
 * Transforme les données Gantt pour les adapter au format des composants existants
 * @param {Array} ganttData - Données Gantt de Gemini
 * @returns {object} Données formatées pour les composants Gantt
 */
export function adaptGanttDataForComponents(ganttData) {
  console.log('🔧 Adaptation des données Gantt pour les composants');
  
  const tasks = ganttData.map(task => ({
    id: task.id,
    name: task.name,
    startAt: new Date(task.startAt),
    endAt: new Date(task.endAt),
    status: task.status,
    owner: task.owner,
    phase: task.group?.name || 'Non défini',
    progression: 0 // Nouveau plan, progression à 0
  }));
  
  // Grouper par phase pour créer les milestones
  const phaseGroups = {};
  tasks.forEach(task => {
    const phase = task.phase;
    if (!phaseGroups[phase]) {
      phaseGroups[phase] = [];
    }
    phaseGroups[phase].push(task);
  });
  
  // Créer des jalons pour chaque phase
  const milestones = Object.entries(phaseGroups).map(([phaseName, phaseTasks]) => {
    const phaseEndDate = new Date(Math.max(...phaseTasks.map(t => t.endAt.getTime())));
    return {
      id: `milestone-${phaseName.toLowerCase().replace(/\s+/g, '-')}`,
      date: phaseEndDate,
      label: `Fin ${phaseName}`
    };
  });
  
  console.log('✅ Adaptation terminée:', tasks.length, 'tâches,', milestones.length, 'jalons');
  
  return {
    tasks,
    milestones,
    patient: null, // Sera défini lors de la sauvegarde
    statistics: null // Sera calculé automatiquement
  };
}