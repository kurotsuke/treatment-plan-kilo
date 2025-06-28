/**
 * AI services for processing dental treatment plans
 */
import {
  getVisionModel,
  getTreatmentPlanModel,
  getTaskPlanModel,
  isFirebaseAIConfigured
} from '../config/firebaseAI.js';
import { getTreatmentPlanPrompt, getTreatmentPlanStructuringPrompt } from './prompts.js';

/**
 * Log AI response to text file
 * @param {string} responseText - The AI response text
 * @param {object} quote - The quote object for context
 */
async function logAIResponse(responseText, quote) {
  try {
    const timestamp = new Date().toISOString();
    const patientName = quote?.patientName || 'Patient inconnu';
    
    const logEntry = `
[${timestamp}] ===== NOUVELLE RÉPONSE IA =====
Patient: ${patientName}
Prompt utilisé: getTreatmentPlanStructuringPrompt()
Longueur réponse: ${responseText.length} caractères

--- RÉPONSE BRUTE DE L'IA ---
${responseText}

--- FIN DE LA RÉPONSE ---
===============================================

`;
    
    // Écrire dans le fichier de log (côté client, on utilise une approche alternative)
    // En environnement Node.js, on utiliserait fs.appendFile
    // Ici, on va logger dans la console avec un format spécial pour le debug
    console.log('📝 =====  LOG RÉPONSE IA TREATMENT PLAN ===== ');
    console.log(`🕒 Timestamp: ${timestamp}`);
    console.log(`👤 Patient: ${patientName}`);
    console.log(`📏 Longueur: ${responseText.length} caractères`);
    console.log('📄 Réponse brute:');
    console.log(responseText);
    console.log('📝 ============================================ ');
    
    // Tenter d'écrire dans un fichier via l'API File System Access (si supportée)
    if ('showSaveFilePicker' in window) {
      // Cette approche nécessite une interaction utilisateur, donc on l'ignore pour l'instant
      // et on se contente du log console
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du logging de la réponse IA:', error);
  }
}

/**
 * Process PDF directly with AI
 * @param {string} base64PDF - Base64 encoded PDF
 * @param {string} language - Language code (fr/en)
 * @returns {Object} - Processed treatment plan data
 */
export async function processPdfDirectly(base64PDF, language = 'fr') {
  try {
    if (!isFirebaseAIConfigured()) {
      throw new Error('Firebase AI non configuré. Veuillez vérifier la configuration.');
    }
    
    const aiModel = getVisionModel();
    const prompt = getTreatmentPlanPrompt();

    const imagePart = {
      inlineData: {
        data: base64PDF,
        mimeType: "application/pdf"
      }
    };
    
    const result = await aiModel.generateContent([prompt, imagePart]);
    const response = result.response;
    
    console.log('🤖 FIREBASE AI - Réponse reçue du modèle Vision');
    
    // With Firebase AI and JSON schema, the response should already be structured JSON
    try {
      const responseText = response.text();
      
      // ✨ LOGS DÉTAILLÉS DU JSON GÉNÉRÉ PAR FIREBASE AI ✨
      console.log('📄 ===== RÉPONSE BRUTE FIREBASE AI (Vision Model) =====');
      console.log('📏 Longueur de la réponse:', responseText.length, 'caractères');
      console.log('📝 Contenu brut:');
      console.log(responseText);
      console.log('📄 ================================================');
      
      const jsonResponse = JSON.parse(responseText);
      
      console.log('✅ JSON PARSÉ AVEC SUCCÈS PAR FIREBASE AI');
      console.log('📊 ===== STRUCTURE JSON FINALE =====');
      console.log(JSON.stringify(jsonResponse, null, 2));
      console.log('📊 ================================');
      
      // Validation de la cohérence financière
      if (jsonResponse.phases && jsonResponse.synthese_financiere) {
        const totalPhases = jsonResponse.phases.reduce((sum, phase) => sum + (phase.total_phase || 0), 0);
        const totalBrut = jsonResponse.synthese_financiere.total_brut;
        
        if (Math.abs(totalPhases - totalBrut) > 0.01) {
          console.warn('⚠️ INCOHÉRENCE FINANCIÈRE DÉTECTÉE:');
          console.warn('- Somme des phases:', totalPhases);
          console.warn('- Total brut déclaré:', totalBrut);
          console.warn('- Différence:', Math.abs(totalPhases - totalBrut));
        } else {
          console.log('✅ Validation financière OK - Totaux cohérents');
        }
      }
      
      return jsonResponse;
    } catch (jsonError) {
      console.error('❌ ERREUR DE PARSING JSON:', jsonError.message);
      throw new Error(`Échec du parsing de la réponse IA: ${jsonError.message}`);
    }
  } catch (error) {
    console.error('❌ ERREUR LORS DU TRAITEMENT PDF:', error.message);
    throw new Error(`Échec du traitement PDF: ${error.message}`);
  }
}

/**
 * Convert file to base64
 * @param {File} file - File object
 * @returns {Promise<string>} - Base64 encoded file
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the data:application/pdf;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Validate PDF file
 * @param {File} file - File to validate
 * @returns {Object} - Validation result
 */
export function validatePdfFile(file) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['application/pdf'];
  
  if (!file) {
    return { isValid: false, error: 'Aucun fichier sélectionné' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Le fichier doit être un PDF' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'Le fichier ne doit pas dépasser 10MB' };
  }
  
  return { isValid: true };
}

/**
 * Génère un plan de traitement depuis un devis en utilisant Gemini
 * @param {object} quote - Le devis source
 * @returns {Promise<object>} Plan de traitement généré
 */
export async function generateTreatmentPlanFromQuote(quote) {
  try {
    // Importer les fonctions du service de transformation
    const {
      generateDentalTreatmentPlan,
      mapQuoteToGeminiInput,
      validateGanttData,
      adaptGanttDataForComponents
    } = await import('./ganttTransformService.js');
    
    // Transformer le devis en format Gemini
    const geminiInput = mapQuoteToGeminiInput(quote);
    
    // Appeler Gemini pour générer le plan
    const ganttData = await generateDentalTreatmentPlan(geminiInput);
    
    // Valider les données
    validateGanttData(ganttData);
    
    // Adapter pour les composants
    const adaptedData = adaptGanttDataForComponents(ganttData);
    
    return {
      success: true,
      data: adaptedData,
      rawGanttData: ganttData,
      sourceQuote: quote
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du plan de traitement:', error);
    throw new Error(`Échec de la génération du plan de traitement: ${error.message}`);
  }
}

/**
 * Génère un plan de traitement structuré (JSON brut de l'IA) à partir d'un objet devis.
 * @param {object} quote - L'objet devis complet.
 * @returns {Promise<object>} Le JSON structuré retourné par l'IA.
 */
export async function generateStructuredPlanFromQuoteObject(quote) {
  try {
    if (!isFirebaseAIConfigured()) {
      throw new Error('Firebase AI non configuré. Veuillez vérifier la configuration.');
    }

    const aiModel = getTreatmentPlanModel();
    const prompt = getTreatmentPlanPrompt();

    // Simplification du devis pour l'envoi à l'IA
    const simplifiedQuoteForAI = {
      patient: quote.patientName || "Nom du patient non disponible",
      date_devis: (() => {
        try {
          if (quote.basicInfo?.date) {
            // Si c'est un objet Firestore Timestamp
            if (quote.basicInfo.date.toDate && typeof quote.basicInfo.date.toDate === 'function') {
              return quote.basicInfo.date.toDate().toISOString().split('T')[0];
            }
            // Si c'est déjà une date valide
            const date = new Date(quote.basicInfo.date);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
          }
          return new Date().toISOString().split('T')[0];
        } catch (e) {
          console.warn('Erreur lors de la conversion de la date:', e);
          return new Date().toISOString().split('T')[0];
        }
      })(),
      actes: quote.phases?.flatMap(phase =>
        phase.treatments?.map(treatment => ({
          libelle: treatment.name,
          dents: treatment.teeth ? treatment.teeth.split(',').map(d => d.trim()).filter(d => d) : undefined,
          honoraires_bruts: treatment.fees
        })) || []
      ) || [],
      montant_total_brut_devis: quote.pricing?.subtotal,
      remise_totale_devis: quote.pricing?.discountType === 'percentage'
        ? (quote.pricing.subtotal * (quote.pricing.discountValue || 0)) / 100
        : (quote.pricing.discountValue || 0),
      net_a_payer_devis: quote.pricing?.total
    };

    const quoteContextForAI = `Voici les détails du devis à analyser (format JSON):\n\n${JSON.stringify(simplifiedQuoteForAI, null, 2)}`;
    
    const result = await aiModel.generateContent([prompt, quoteContextForAI]);
    const response = result.response;

    // With Firebase AI and JSON schema, the response should already be structured JSON
    const responseText = response.text();
    const jsonResponse = JSON.parse(responseText);
    return jsonResponse;

  } catch (error) {
    console.error('❌ ERREUR LORS DE LA GÉNÉRATION DU PLAN DEPUIS OBJET DEVIS:', error.message);
    throw new Error(`Échec de la génération du plan structuré depuis l'objet devis: ${error.message}`);
  }
}

/**
 * Génère un plan de traitement structuré (JSON brut de l'IA) à partir d'un objet devis, en utilisant le NOUVEAU prompt.
 * @param {object} quote - L'objet devis complet.
 * @returns {Promise<object>} Le JSON structuré retourné par l'IA (format Mermaid-like avec sections).
 */
export async function generateStructuredPlanWithNewPrompt(quote) {
  try {
    if (!isFirebaseAIConfigured()) {
      throw new Error('Firebase AI non configuré. Veuillez vérifier la configuration.');
    }

    const aiModel = getTaskPlanModel();
    const prompt = getTreatmentPlanStructuringPrompt();

    // Préparer les données du devis pour l'IA
    const phasesDetaillees = quote.phases?.map(phase => ({
      nom_phase: phase.name,
      medecin_assigne: phase.assignedDoctorId || quote.basicInfo?.referringDoctorId || 'Non spécifié',
      traitements: phase.treatments?.map(treatment => ({
        nom: treatment.name,
        dents: treatment.teeth || '',
        sessions: treatment.sessions || 1
      })) || []
    })) || [];

    if (phasesDetaillees.length === 0) {
      console.warn('⚠️ Aucune phase trouvée dans le devis pour le nouveau prompt.');
      return { taches: [] };
    }

    // Créer un contexte enrichi avec toutes les informations
    const contexteEnrichiPourIA = `
Voici les informations complètes du devis dentaire :

Patient: ${quote.patientName || 'Non spécifié'}
Médecin référent principal: ${quote.basicInfo?.referringDoctorId || 'Non spécifié'}

Phases du traitement:
${phasesDetaillees.map((phase, index) => `
Phase ${index + 1}: ${phase.nom_phase}
Médecin assigné: ${phase.medecin_assigne}
Traitements:
${phase.traitements.map(t => `  - ${t.nom}${t.dents ? ` (dents: ${t.dents})` : ''}${t.sessions > 1 ? ` - ${t.sessions} séances` : ''}`).join('\n')}
`).join('\n')}

Génère un plan de traitement ordonné en suivant les règles du prompt.`;
    
    const result = await aiModel.generateContent([prompt, contexteEnrichiPourIA]);
    
    if (!result || !result.response) {
      throw new Error('Aucune réponse reçue de Firebase AI');
    }
    
    const response = result.response;
    
    // With Firebase AI and JSON schema, the response should already be structured JSON
    try {
      const responseText = response.text();
      
      // ✅ AJOUT: Log de la réponse dans le fichier texte
      await logAIResponse(responseText, quote);
      
      const parsedData = JSON.parse(responseText);
      
      // Si l'IA retourne encore l'ancien format, le convertir au nouveau format Mermaid-like
      if (parsedData.taches && !parsedData.sections) {
        console.log('🔄 Conversion de l\'ancien format vers le nouveau format Mermaid-like');
        
        const sections = {};
        const phaseNames = {
          1: "Phase 1 - Soins",
          2: "Phase 2 - Fonctionnelle",
          3: "Phase 3 - Esthétique"
        };
        
        // Grouper les tâches par phase
        parsedData.taches.forEach(tache => {
          const phaseName = phaseNames[tache.phase] || `Phase ${tache.phase}`;
          
          if (!sections[phaseName]) {
            sections[phaseName] = [];
          }
          
          // Convertir la durée au format Mermaid
          let duration = "1d"; // Par défaut
          if (tache.duree) {
            const val = tache.duree.valeur || 1;
            const unite = tache.duree.unite || "jour";
            const unitMap = {
              "heure": "h", "heures": "h",
              "jour": "d", "jours": "d",
              "semaine": "w", "semaines": "w",
              "mois": "m", "month": "m", "months": "m"
            };
            const unitCode = unitMap[unite.toLowerCase()] || "d";
            duration = `${val}${unitCode}`;
          }
          
          // Déterminer le type de tâche
          let type = "clinique"; // Par défaut
          const nom = tache.nom.toLowerCase();
          if (nom.includes("cicatrisation") || nom.includes("guérison") || nom.includes("consolidation")) {
            type = "cicatrisation";
          } else if (nom.includes("administratif") || nom.includes("paiement") || nom.includes("dossier")) {
            type = "administratif";
          }
          
          // Extraire le premier ID de dépendance (format simplifié)
          let after = null;
          if (tache.dependances && tache.dependances.length > 0) {
            const firstDep = tache.dependances[0];
            if (typeof firstDep === 'string') {
              after = firstDep;
            } else if (firstDep.id_tache_precedente) {
              after = firstDep.id_tache_precedente;
            }
          }
          
          // ✅ CORRECTION: Prioriser le champ tache.dents puis fallback sur l'extraction depuis le nom
          let nomSansDents = tache.nom;
          let dents = [];
          
          // Priorité 1: Utiliser directement tache.dents si disponible
          if (tache.dents) {
            if (typeof tache.dents === 'string' && tache.dents.trim()) {
              // L'IA retourne les dents comme string: "16,26,37"
              dents = tache.dents.split(',').map(d => d.trim()).filter(d => d.length > 0);
            } else if (Array.isArray(tache.dents)) {
              // L'IA retourne les dents comme array: ["16", "26", "37"]
              dents = tache.dents;
            }
            // Le nom reste tel quel car les dents sont dans un champ séparé
            nomSansDents = tache.nom;
          }
          // Priorité 2: Fallback - extraire les dents du nom (pour rétrocompatibilité)
          else if (tache.nom.includes(' (dents: ')) {
            const [nom, dentsInfo] = tache.nom.split(' (dents: ');
            nomSansDents = nom;
            dents = dentsInfo ? dentsInfo.replace(')', '').split(',').map(d => d.trim()) : [];
          }
          // Priorité 3: Format "Acte (XX,XX)"
          else if (tache.nom.includes('(') && tache.nom.includes(')')) {
            const match = tache.nom.match(/^(.+?)\s*\(([^)]+)\)$/);
            if (match) {
              nomSansDents = match[1].trim();
              const dentsString = match[2];
              // Vérifier si le contenu entre parenthèses ressemble à des numéros de dents
              if (/^\d+(?:,\s*\d+)*$/.test(dentsString)) {
                dents = dentsString.split(',').map(d => d.trim());
              }
            }
          }
          
          // Créer la tâche au nouveau format
          sections[phaseName].push({
            task: nomSansDents.replace(/\\n/g, ' '), // Nettoyer les caractères de saut de ligne
            id: tache.id,
            duration: duration,
            after: after,
            type: type,
            assignedTo: tache.medecin || quote.basicInfo?.referringDoctorId || "Dr. Non spécifié",
            done: tache.statut === "completed",
            dents: dents // Ajouter la propriété dents
          });
        });
        
        // Retourner uniquement le nouveau format
        return { sections };
      }
      
      return parsedData;
    } catch (parseError) {
      console.error('❌ ERREUR DE PARSING JSON:', parseError.message);
      
      // Plan minimal de secours en cas d'erreur (nouveau format uniquement)
      const minimalPlan = {
        sections: {
          "Phase 1 - Soins": [
            {
              task: "Consultation initiale",
              id: "T1",
              duration: "1d",
              after: null,
              type: "clinique",
              assignedTo: quote.basicInfo?.referringDoctorId || "Dr. Non spécifié",
              done: false,
              dents: []
            },
            {
              task: "Plan de traitement détaillé à générer",
              id: "T2",
              duration: "1d",
              after: "T1",
              type: "administratif",
              assignedTo: quote.basicInfo?.referringDoctorId || "Dr. Non spécifié",
              done: false,
              dents: []
            }
          ]
        },
        error: "JSON_PARSE_ERROR",
        message: "Erreur lors du parsing de la réponse IA. Plan minimal généré."
      };
      return minimalPlan;
    }

  } catch (error) {
    console.error('❌ ERREUR LORS DE LA GÉNÉRATION DU PLAN (NOUVEAU PROMPT):', error.message);
    throw new Error(`Échec de la génération du plan structuré (nouveau prompt): ${error.message}`);
  }
}

/**
 * Configuration de l'API AI (compatible avec l'interface de aiServiceOptimized)
 */
export function configureFirebaseAI(config) {
  // Firebase AI utilise la configuration intégrée du projet Firebase
  // Cette fonction est conservée pour la compatibilité
  console.log('Firebase AI utilise la configuration du projet Firebase intégrée');
  return true;
}

/**
 * Vérifier si l'API AI est configurée
 */
export { isFirebaseAIConfigured } from '../config/firebaseAI.js';

/**
 * Obtenir la configuration AI actuelle
 */
export { getFirebaseAIConfig } from '../config/firebaseAI.js';

/**
 * Fonction wrapper pour la compatibilité avec aiServiceOptimized
 * @param {string} base64PDF - Base64 encoded PDF
 * @param {string} language - Language code (fr/en)
 * @returns {Object} - Processed treatment plan data
 */
export async function processPdfOptimized(base64PDF, language = 'fr') {
  // Utilise processPdfDirectly qui fait la même chose
  return processPdfDirectly(base64PDF, language);
}
