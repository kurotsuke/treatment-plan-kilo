/**
 * Service AI optimisé avec Google Generative AI SDK
 * Compatible avec l'exécution dans le navigateur
 */
import { getApp } from '../config/firebase';

// ✅ Utilisation du SDK Google Generative AI (compatible navigateur)
import { GoogleGenerativeAI } from "@google/generative-ai";

console.log('✅ Service AI initialisé avec Google Generative AI SDK (compatible navigateur)');

// Schema JSON pour le plan de traitement structuré
const treatmentPlanSchema = {
  type: "object",
  properties: {
    patient: { type: "string" },
    date_devis: { type: "string" },
    etat_general: {
      type: "array",
      items: { type: "string" }
    },
    resume_langage_commun: { type: "string" },
    phases: {
      type: "array",
      items: {
        type: "object",
        properties: {
          numero: { type: "number" },
          nom: { type: "string" },
          description_phase: { type: "string" },
          nombre_seances_estime: { type: "number" },
          groupes_actes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                actes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      libelle: { type: "string" },
                      dents: {
                        type: "array",
                        items: { type: "number" }
                      },
                      cout: { type: "number" },
                      cout_unitaire: { type: "number" },
                      cout_total: { type: "number" }
                    },
                    optionalProperties: ["dents", "cout_unitaire", "cout_total"]
                  }
                },
                sous_total: { type: "number" }
              }
            }
          },
          total_phase: { type: "number" }
        }
      }
    },
    synthese_financiere: {
      type: "object",
      properties: {
        total_brut: { type: "number" },
        remise_totale: { type: "number" },
        net_a_payer: { type: "number" }
      }
    }
  }
};

// Schema pour le plan Gantt simplifié
const ganttPlanSchema = {
  type: "object",
  properties: {
    taches: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          nom: { type: "string" },
          phase: { type: "number" },
          duree: {
            type: "object",
            properties: {
              valeur: { type: "number" },
              unite: { type: "string" }
            }
          },
          dependances: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    },
    medecins_par_phase: {
      type: "object",
      additionalProperties: { type: "string" }
    }
  }
};

// Initialiser Google Generative AI
let genAI;

function initializeGoogleAI() {
  if (!genAI) {
    try {
      // Vérifier la configuration API
      const apiKey = localStorage.getItem('firebaseAIApiKey') || "";
      
      if (!apiKey) {
        throw new Error('Configuration Google AI manquante. Veuillez configurer l\'API Key dans les paramètres.');
      }
      
      // Initialiser le client Google Generative AI
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Google Generative AI initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation Google AI:', error);
      throw error;
    }
  }
  return genAI;
}

/**
 * Prompt optimisé et réduit pour l'extraction de devis
 */
function getOptimizedPrompt() {
  return `Analyse ce devis dentaire et structure-le en phases médicales.

Phase 1 (Thérapeutique): Soins, parodontologie, chirurgie, endodontie
Phase 2 (Fonctionnelle): Prothèses, implants, orthodontie
Phase 3 (Esthétique): Blanchiment, facettes

Pour chaque acte, extrais: libellé exact, dents concernées, honoraires bruts.
Regroupe les actes similaires. Calcule les totaux par phase.
Décris l'état bucco-dentaire en termes simples pour le patient.`;
}

/**
 * Prompt ultra-court pour la transformation en Gantt
 */
function getGanttPrompt() {
  return `Transforme ces phases en tâches ordonnées. Max 20 tâches.
Durées: Consultation=1j, Soins=2j, Chirurgie=1j+3sem cicatrisation, Prothèse=2sem labo, Implant=4mois.
Dépendances: même zone=fin-début, zones différentes=début-début.`;
}

/**
 * Traiter un PDF avec l'API optimisée
 */
export async function processPdfOptimized(base64PDF, language = 'fr') {
  console.log('🚀 Traitement PDF avec Google Generative AI...');
  
  try {
    const genAI = initializeGoogleAI();
    
    // Créer le modèle avec structured output
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: treatmentPlanSchema,
        temperature: 0.1,
        maxOutputTokens: 4096 // Réduit pour éviter les dépassements
      }
    });
    
    const prompt = getOptimizedPrompt();
    
    // Créer la partie image
    const imagePart = {
      inlineData: {
        data: base64PDF,
        mimeType: "application/pdf"
      }
    };
    
    console.log('📤 Envoi à Gemini avec schema structuré...');
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    
    // Avec structured output, la réponse est déjà en JSON
    const jsonResponse = JSON.parse(response.text());
    console.log('✅ Réponse structurée reçue:', {
      patient: jsonResponse.patient,
      phases: jsonResponse.phases?.length || 0,
      total: jsonResponse.synthese_financiere?.total_brut
    });
    
    return jsonResponse;
    
  } catch (error) {
    console.error('❌ Erreur traitement PDF:', error);
    
    // Si c'est une erreur de limite de tokens, utiliser une version de secours
    if (error.message.includes('MAX_TOKENS')) {
      console.log('🔄 Utilisation du mode fallback...');
      return await processPdfFallback(base64PDF);
    }
    
    throw error;
  }
}

/**
 * Version fallback avec prompt minimal
 */
async function processPdfFallback(base64PDF) {
  console.log('🔄 Mode fallback avec prompt minimal...');
  
  const genAI = initializeGoogleAI();
  
  // Modèle avec un prompt vraiment minimal
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-latest",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          patient: { type: "string" },
          actes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nom: { type: "string" },
                dents: { type: "string" },
                prix: { type: "number" }
              }
            }
          },
          total: { type: "number" }
        }
      },
      temperature: 0.1,
      maxOutputTokens: 2048
    }
  });
  
  const minimalPrompt = "Extrais: patient, liste des actes (nom, dents, prix), total.";
  
  const imagePart = {
    inlineData: {
      data: base64PDF,
      mimeType: "application/pdf"
    }
  };
  
  const result = await model.generateContent([minimalPrompt, imagePart]);
  const simpleResponse = JSON.parse(result.response.text());
  
  // Reconstruire un format minimal utilisable
  return {
    patient: simpleResponse.patient || "Patient",
    date_devis: new Date().toISOString().split('T')[0],
    etat_general: ["Plan de traitement à détailler"],
    resume_langage_commun: "Plan de traitement dentaire",
    phases: [{
      numero: 1,
      nom: "Traitement complet",
      description_phase: "Tous les soins nécessaires",
      nombre_seances_estime: simpleResponse.actes?.length || 1,
      groupes_actes: [{
        type: "Soins",
        actes: simpleResponse.actes || [],
        sous_total: simpleResponse.total || 0
      }],
      total_phase: simpleResponse.total || 0
    }],
    synthese_financiere: {
      total_brut: simpleResponse.total || 0,
      remise_totale: 0,
      net_a_payer: simpleResponse.total || 0
    }
  };
}

/**
 * Générer un plan Gantt optimisé depuis un objet devis
 */
export async function generateGanttPlanOptimized(quote) {
  console.log('🚀 Génération Gantt avec Google Generative AI...');
  
  try {
    const genAI = initializeGoogleAI();
    
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: ganttPlanSchema,
        temperature: 0.1,
        maxOutputTokens: 2048
      }
    });
    
    // Contexte simplifié
    const context = `Patient: ${quote.patientName}
Phases:
${quote.phases?.map((p, i) => `${i+1}. ${p.name}: ${p.treatments?.map(t => t.name).join(', ')}`).join('\n')}`;
    
    const prompt = getGanttPrompt();
    
    console.log('📤 Envoi à Gemini pour Gantt...');
    const result = await model.generateContent([prompt, context]);
    const ganttData = JSON.parse(result.response.text());
    
    console.log('✅ Plan Gantt généré:', {
      taches: ganttData.taches?.length || 0
    });
    
    return ganttData;
    
  } catch (error) {
    console.error('❌ Erreur génération Gantt:', error);
    
    // Plan de secours minimal
    return {
      taches: [{
        id: "T1",
        nom: "Consultation initiale",
        phase: 1,
        duree: { valeur: 1, unite: "jour" },
        dependances: []
      }],
      medecins_par_phase: {
        "1 - Phase": "Dr. " + (quote.basicInfo?.referringDoctorName || "Médecin")
      }
    };
  }
}

/**
 * Configuration Firebase AI
 */
export function configureFirebaseAI(config) {
  localStorage.setItem('firebaseAIApiKey', config.apiKey || '');
  localStorage.setItem('firebaseAILocation', config.location || 'us-central1');
  
  // Réinitialiser l'instance AI pour forcer la reconfiguration
  genAI = null;
}

/**
 * Vérifier si Firebase AI est configuré
 */
export function isFirebaseAIConfigured() {
  return !!localStorage.getItem('firebaseAIApiKey');
}

/**
 * Obtenir la configuration Firebase AI actuelle
 */
export function getFirebaseAIConfig() {
  return {
    apiKey: localStorage.getItem('firebaseAIApiKey') || '',
    location: localStorage.getItem('firebaseAILocation') || 'us-central1'
  };
}