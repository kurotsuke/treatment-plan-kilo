/**
 * Firebase AI configuration and initialization
 */
import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from "firebase/ai";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7Mb4EE334DlkcN1Szi_1-Snc2EMfgXxI",
  authDomain: "dentalplan-ai.firebaseapp.com",
  projectId: "dentalplan-ai",
  storageBucket: "dentalplan-ai.firebasestorage.app",
  messagingSenderId: "138043766893",
  appId: "1:138043766893:web:1c187bea717e7fbd75e764"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize the Gemini Developer API backend service
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

export const treatmentPlanSchema = Schema.object({
  properties: {
    patient: Schema.string(),
    // Format de date ISO YYYY-MM-DD
    date_devis: Schema.string(),
    etat_general: Schema.array({
      items: Schema.string()
    }),
    resume_langage_commun: Schema.string(),
    phases: Schema.array({
      items: Schema.object({
        properties: {
          numero: Schema.number(),
          nom: Schema.string(),
          description_phase: Schema.string(),
          nombre_seances_estime: Schema.number(),
          groupes_actes: Schema.array({
            items: Schema.object({
              properties: {
                type: Schema.string(),
                actes: Schema.array({
                  items: Schema.object({
                    properties: {
                      libelle: Schema.string(),
                      dents: Schema.array({
                        items: Schema.number()
                      }),
                      cout: Schema.number(),
                      cout_unitaire: Schema.number(),
                      cout_total: Schema.number()
                    },
                    required: ["libelle"],
                    optionalProperties: ["dents",]
                  })
                }),
                sous_total: Schema.number()
              },
              required: ["type", "actes", "sous_total","cout", "cout_unitaire", "cout_total"]
            })
          }),
          total_phase: Schema.number()
        },
        required: ["numero", "nom", "description_phase", "nombre_seances_estime", "groupes_actes", "total_phase"]
      })
    }),
    synthese_financiere: Schema.object({
      properties: {
        total_brut: Schema.number(),
        remise_totale: Schema.number(),
        net_a_payer: Schema.number()
      },
      required: ["total_brut", "remise_totale", "net_a_payer"]
    })
  },
  required: ["patient", "date_devis", "etat_general", "resume_langage_commun", "phases", "synthese_financiere"]
});
/**
 * JSON Schema for structured treatment plan with tasks
 */
export const taskPlanSchema = Schema.object({
  properties: {
    taches: Schema.array({
      items: Schema.object({
        properties: {
          id: Schema.string(),
          nom: Schema.string(),
          dents: Schema.string(),
          phase: Schema.number(),
          duree: Schema.object({
            properties: {
              valeur: Schema.number(),
              unite: Schema.string()
            }
          }),
          dependances: Schema.array({
            items: Schema.string()
          })
        },
        optionalProperties: ["dents"]
      })
    }),
    // ✅ CORRECTION: Définir les propriétés d'erreur dans le bloc properties
    error: Schema.string(),
    message: Schema.string(),
    geminiRawResponse: Schema.string(),
    errorMessage: Schema.string()
  },
  required: ["taches"],
  optionalProperties: ["error", "message", "geminiRawResponse", "errorMessage"]
});

/**
 * Get a generative model for treatment plan analysis
 */
export function getTreatmentPlanModel() {
  return getGenerativeModel(ai, {
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: treatmentPlanSchema
    }
  });
}

/**
 * Get a generative model for task-based treatment planning
 */
export function getTaskPlanModel() {
  return getGenerativeModel(ai, {
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: taskPlanSchema
    }
  });
}

/**
 * Get a vision model for PDF processing
 */
export function getVisionModel() {
  return getGenerativeModel(ai, {
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: treatmentPlanSchema
    }
  });
}

/**
 * Check if Firebase AI is configured
 */
export function isFirebaseAIConfigured() {
  try {
    return !!firebaseApp && !!ai;
  } catch (error) {
    console.error('Erreur de configuration Firebase AI:', error);
    return false;
  }
}

/**
 * Get Firebase AI configuration
 */
export function getFirebaseAIConfig() {
  return firebaseConfig;
}