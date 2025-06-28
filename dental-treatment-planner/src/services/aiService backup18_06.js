/**
 * AI services for processing dental treatment plans
 */
import { getVisionModel, isGeminiConfigured } from '../config/gemini.js';

/**
 * Get the treatment plan extraction prompt
 * @returns {string} - The prompt for AI to extract treatment plan
 */
export function getTreatmentPlanPrompt() {
 
  return `
# Prompt : Analyse et Structuration de Devis Dentaire

Vous êtes un assistant IA expert en dentisterie française. Votre mission est de transformer un devis dentaire brut en un plan de traitement structuré au format JSON. Ce plan doit être organisé en phases médicales logiques, clair pour le patient et techniquement précis.

## Objectif Principal

Analyser le contenu d'un devis dentaire pour extraire toutes les informations pertinentes, les organiser en un plan de traitement cohérent et calculer les coûts associés à chaque étape en se basant sur les honoraires bruts.

---

## Instructions Détaillées

### 1. **Extraction des Données du Devis**
Analysez l'intégralité du devis pour extraire les informations suivantes :
- **\`patient\`** : Le nom complet du patient.
- **\`date_devis\`** : La date d'émission du devis.
- **\`actes\`** : Pour chaque ligne de traitement, extrayez :
    - Le **libellé** exact de l'acte.
    - Le ou les **numéros de dent(s)** concerné(s). Si non applicable, ce champ peut être omis.
    - Le **montant des honoraires bruts (colonne 'Honoraires')**, avant l'application de toute remise individuelle.

### 2. **Organisation en Phases Médicales**
Structurez les actes extraits en un maximum de trois phases séquentielles. Chaque phase doit contenir :
- Un **numéro** de phase (1, 2, 3).
- Un **nom** de phase clair et standardisé.
- Une **description** simple expliquant les objectifs de la phase et ses bénéfices pour le patient.
- Un **nombre de séances estimé** pour compléter la phase.
- Les **groupes d'actes** appartenant à cette phase.
- Le **total financier** de la phase.

#### **Phase 1 : Thérapeutique (Assainissement et Soins)**
Regroupe les traitements visant à éliminer les pathologies et à préparer une base saine.
- **Parodontologie** : Détartrage, surfaçage, traitements laser.
- **Chirurgie** : Extractions dentaires, élongations coronaires, sinus lift.
- **Endodontie** : Dévitalisations, traitements canalaires.
- **Soins Conservateurs** : Traitement des caries (composites, inlays/onlays), reconstitutions.

#### **Phase 2 : Fonctionnelle (Réhabilitation Prothétique et / ou orthodontique)**
Concerne la reconstruction et le remplacement des dents pour restaurer la fonction et l'esthétique.
- **Prothèses Fixes** : Couronnes, bridges.
- **Prothèses Amovibles** : Appareils partiels ou complets.
- **Implantologie** : Implants et piliers (si présents).
- **Orthodontie** : Inclut les traitements par **aligneurs (gouttières)** et les appareils traditionnels (bagues). Ces traitements visent à corriger l'alignement des dents et l'occlusion pour des raisons fonctionnelles et doivent **impérativement** être classés dans cette phase, même si le bénéfice esthétique est important.

#### **Phase 3 : Esthétique (Optionnelle)**
Regroupe les traitements à visée purement cosmétique. N'inclure cette phase que si des actes spécifiques sont listés.
- Blanchiment dentaire.
- Pose de facettes.
- Autres corrections esthétiques.

### 3. **Regroupement Intelligent des Actes**
À l'intérieur de chaque phase, regroupez les actes de même nature pour plus de clarté :
- **Actes identiques sur dents multiples** : Créez une seule entrée. Spécifiez la liste des dents, le coût unitaire et le coût total. (Ex: "Composite sur dents 12, 13, 14").
- **Actes similaires** : Regroupez sous un même type. (Ex: Toutes les extractions ensemble).
- **Logique de secteur** : Gardez ensemble les actes sur des dents adjacentes ou dans le même secteur buccal.

### 4. **Synthèse Financière**
Calculez et structurez les coûts de manière précise :
- **Coût par acte** et **coût total par groupe** d'actes.
- **Règle de calcul importante** : Tous les calculs de coût pour les actes et les phases doivent se baser sur les **honoraires bruts**, et non sur le montant "à payer" après remise.
- **Sous-total par phase**.
- **Synthèse financière globale** à la fin du JSON, incluant :
    - Le **montant total brut** (somme des phases, doit correspondre au total des honoraires).
    - Le **montant total de la remise** ou rabais explicitement mentionné.
    - Le **net à payer** final.

### 5. **État général simplifié**
Après avoir analysé chaque ligne, rédige une synthèse globale. Cette conclusion doit brosser un portrait complet de l'état  du patient. Décrivez en termes  simples et accessibles pour le patient sa situation bucco-dentaire actuelle. L'objectif est qu'il comprenne pourquoi les soins sont nécessaires.

### 6. **Résumé langage commun**
Expliquez en langage simple les grandes étapes du traitement et, surtout, le résultat final attendu pour le patient (ex: "retrouver un sourire sain, fonctionnel et esthétique").
  

---

## Format de Sortie Exigé (JSON)

La sortie doit être **uniquement** un objet JSON valide, sans aucun texte ou commentaire en dehors. Suivez rigoureusement la structure ci-dessous.

\\\`\\\`\\\`json
{
  "patient": "ELHADDAOUI MARYAM",
  "date_devis": "2025-04-14",
    "etat_general": ["Vos gencives sont rouges et gonflées, elles saignent facilement car il y a beaucoup de tartre à nettoyer.",
    "Plusieurs caries sont présentes, ce qui fragilise vos dents et peut causer des douleurs.",
    "Il vous manque des dents, ce qui peut rendre la mastication difficile et user les autres dents plus vite."
  ],
  "resume_langage_commun": "Le plan de traitement va se dérouler en deux grandes étapes. D'abord, nous allons assainir complètement votre bouche : nettoyer les gencives, soigner toutes les caries et enlever les dents qui ne peuvent pas être sauvées. Ensuite, nous remplacerons les dents manquantes et protégerons les dents fragiles avec des couronnes. L'objectif final est que vous retrouviez une bouche saine, sans douleur, avec laquelle vous pourrez manger confortablement et sourire en toute confiance.",
  "phases": [
    {
      "numero": 1,
      "nom": "Phase Thérapeutique - Assainissement et Soins",
      "description_phase": "Cette phase cruciale vise à traiter toutes les infections et caries actives, à assainir les gencives et à préparer votre bouche pour la reconstruction, garantissant ainsi la pérennité des futurs traitements.",
      "nombre_seances_estime": 6,
      "groupes_actes": [
        {
          "type": "Parodontologie",
          "actes": [
            {
              "libelle": "Surfaçage + Lazer",
              "cout": 6000
            }
          ],
          "sous_total": 6000
        },
        {
          "type": "Chirurgie",
          "actes": [
            {
              "libelle": "Ext. par alvéolectomie",
              "dents": [16, 17, 24, 13, 44, 45, 47, 46],
              "cout_unitaire": 500,
              "cout_total": 4000
            },
            {
              "libelle": "Elongation coronaire",
              "cout": 5000
            },
            {
              "libelle": "Sinus lift",
              "cout": 12000
            }
          ],
          "sous_total": 21000
        },
        {
          "type": "Endodontie",
          "actes": [
            {
              "libelle": "Trait canalaire Prémolaire",
              "dents": [14, 25],
              "cout_unitaire": 1200,
              "cout_total": 2400
            },
            {
              "libelle": "Trait canalaire mono radiculée",
              "dents": [12, 21, 11, 22, 23],
              "cout_unitaire": 1200,
              "cout_total": 6000
            }
          ],
          "sous_total": 8400
        },
        {
          "type": "Soins Conservateurs",
          "actes": [
            {
              "libelle": "Reconstitution",
              "dents": [14, 12, 21, 11, 22, 23, 25],
              "cout_unitaire": 1000,
              "cout_total": 7000
            }
          ],
          "sous_total": 7000
        }
      ],
      "total_phase": 42400
    },
    {
      "numero": 2,
      "nom": "Phase Fonctionnelle - Réhabilitation Prothétique et / ou orthodontique",
      "description_phase": "L'objectif est de remplacer les dents manquantes et de protéger les dents traitées afin de restaurer une fonction masticatoire optimale et un sourire harmonieux.",
      "nombre_seances_estime": 5,
      "groupes_actes": [
        {
          "type": "Implantologie",
          "actes": [
            {
              "libelle": "Implant",
              "dents": [16, 26, 44, 46, 34, 36],
              "cout_unitaire": 9000,
              "cout_total": 54000
            }
          ],
          "sous_total": 54000
        },
        {
          "type": "Prothèses Fixes",
          "actes": [
            {
              "libelle": "Couronne zircone",
              "dents": [15, 25],
              "cout_unitaire": 4000,
              "cout_total": 8000
            },
            {
              "libelle": "Bridge sur dents naturelles-Couronne zircone de 10 éléments",
              "dents": [11, 12, 13, 14, 15, 21, 22, 23, 24, 25],
              "cout": 40000
            },
            {
              "libelle": "Bridge sur dents naturelles-Couronne zircone de 3 éléments",
              "dents": [44, 45, 46],
              "cout": 12000
            },
            {
              "libelle": "Bridge sur dents naturelles-Couronne zircone de 3 éléments",
              "dents": [34, 35, 36],
              "cout": 12000
            }
          ],
          "sous_total": 72000
        }
      ],
      "total_phase": 126000
    }
  ],
  "synthese_financiere": {
    "total_brut": 168400,
    "remise_totale": 15440,
    "net_a_payer": 152960
  }
}
\\\`\\\`\\\`

---

## Contraintes et Points de Vigilance

- **Cohérence Financière** : Le \`total_brut\` dans la synthèse doit impérativement correspondre à la somme des \`total_phase\`, qui elle-même doit être la somme de tous les honoraires bruts du devis.
- **Fidélité Absolue** : Utilisez la terminologie exacte du devis. N'inventez, ne modifiez, ni n'omettez aucun acte listé.
- **Exhaustivité** : Chaque phase identifiée doit obligatoirement comporter une \`description_phase\` et un \`nombre_seances_estime\`.
- **Gestion des Incertitudes** : Si un acte est ambigu ou ne semble appartenir à aucune phase, placez-le dans la phase la plus plausible en vous basant sur votre expertise.
`;
}

/**
 * Get the treatment plan structuring prompt (new prompt)
 * @returns {string} - The prompt for AI to structure treatment plan
 */
export function getTreatmentPlanStructuringPrompt() {
  return `JSON SEULEMENT. MAX 20 tâches. Durées: Clinique=1j, Labo=2sem, Cicatrisation=3sem, Implant=4m.

Format: {"taches":[{"id":"T1","nom":"Acte (dents)","phase":1,"duree":{"valeur":1,"unite":"jour"},"dependances":[]}]}

Dépendances: fin-debut même secteur, debut-debut secteurs différents.`;
}

/**
 * Process PDF directly with AI
 * @param {string} base64PDF - Base64 encoded PDF
 * @param {string} language - Language code (fr/en)
 * @returns {Object} - Processed treatment plan data
 */
export async function processPdfDirectly(base64PDF, language = 'fr') {
  console.log('🔧 DÉBUT DU TRAITEMENT PDF');
  console.log('==========================================');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🌍 Langue:', language);
  console.log('🚀 Modèle IA: Gemini 2.5 Flash Preview (05-20)');
  
  try {
    // Vérifier si l'API est configurée
    console.log('🔑 Vérification de la configuration API...');
    if (!isGeminiConfigured()) {
      console.error('❌ Clé API Gemini non configurée');
      throw new Error('Clé API Gemini non configurée. Veuillez la configurer dans les paramètres.');
    }
    console.log('✅ API Gemini configurée');
    
    // Get the Vision model for PDF processing
    console.log('🤖 Initialisation du modèle Vision...');
    const aiModel = getVisionModel();
    console.log('✅ Modèle Vision initialisé');
    console.log('🔧 Modèle utilisé: models/gemini-2.5-flash-preview-05-20');
    
    // Create the prompt using the centralized prompt function
    console.log('📝 Génération du prompt...');
    const prompt = getTreatmentPlanPrompt();
    console.log('✅ Prompt généré (longueur:', prompt.length, 'caractères)');

    // Create the message parts with text and image
    console.log('📦 Préparation des données pour Gemini...');
    const imagePart = {
      inlineData: {
        data: base64PDF,
        mimeType: "application/pdf"
      }
    };
    console.log('✅ Données préparées');
    
    // Send the PDF directly to the AI model using multimodal capabilities
    console.log('🚀 Envoi du PDF à Gemini...');
    console.log('📄 Taille du PDF (base64):', base64PDF.length, 'caractères');
    
    const result = await aiModel.generateContent([prompt, imagePart]);
    const response = result.response;
    
    console.log('✅ Réponse reçue de Gemini');
    
    // Parse the JSON from the AI response
    try {
      // Get the response text
      let responseText = response.text();
      
      // Log de la réponse brute pour contrôle
      console.log('📝 RÉPONSE BRUTE DE GEMINI:');
      console.log('=====================================');
      console.log(responseText);
      console.log('=====================================');
      console.log('📏 Longueur de la réponse:', responseText.length, 'caractères');
      
      // Check if the response is wrapped in a markdown code block
      if (responseText.includes('```json')) {
        console.log('🔍 Détection de bloc markdown JSON, extraction en cours...');
        // Extract just the JSON content from the markdown code block
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          responseText = jsonMatch[1].trim();
          console.log('✂️ JSON extrait du bloc markdown');
        } else {
          console.warn('⚠️ Bloc markdown détecté mais extraction échouée');
        }
      } else {
        console.log('📄 Pas de bloc markdown détecté, traitement direct du JSON');
      }
      
      console.log('🔄 Tentative de parsing JSON...');
      console.log('📋 JSON à parser:');
      console.log('-------------------------------------');
      console.log(responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      console.log('-------------------------------------');
      
      const jsonResponse = JSON.parse(responseText);
      
      console.log('✅ JSON parsé avec succès!');
      console.log('📊 Structure de la réponse:');
      console.log('- Patient:', jsonResponse.patient || 'Non défini');
      console.log('- Date devis:', jsonResponse.date_devis || 'Non définie');
      console.log('- État général:', Array.isArray(jsonResponse.etat_general) ?
        `${jsonResponse.etat_general.length} éléments` :
        (jsonResponse.etat_general ? 'Défini' : 'Non défini'));
      console.log('- Résumé langage commun:', jsonResponse.resume_langage_commun ?
        `${jsonResponse.resume_langage_commun.length} caractères` : 'Non défini');
      console.log('- Nombre de phases:', jsonResponse.phases?.length || 0);
      console.log('- Total brut:', jsonResponse.synthese_financiere?.total_brut || 'Non défini');
      console.log('- Net à payer:', jsonResponse.synthese_financiere?.net_a_payer || 'Non défini');
      
      // Logs détaillés pour les nouveaux champs
      if (jsonResponse.etat_general) {
        console.log('🏥 État général détaillé:');
        if (Array.isArray(jsonResponse.etat_general)) {
          jsonResponse.etat_general.forEach((etat, index) => {
            console.log(`  ${index + 1}. ${etat}`);
          });
        } else {
          console.log(`  ${jsonResponse.etat_general}`);
        }
      }
      
      if (jsonResponse.resume_langage_commun) {
        console.log('💬 Résumé en langage commun:');
        console.log(`  "${jsonResponse.resume_langage_commun}"`);
      }
      
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
          console.log('✅ Cohérence financière vérifiée');
        }
      }
      
      return jsonResponse;
    } catch (jsonError) {
      console.error('❌ ERREUR DE PARSING JSON:');
      console.error('Type d\'erreur:', jsonError.name);
      console.error('Message:', jsonError.message);
      console.error('Position:', jsonError.message.match(/position (\d+)/)?.[1] || 'Non spécifiée');
      
      // Afficher un extrait autour de l'erreur si possible
      if (jsonError.message.includes('position')) {
        const position = parseInt(jsonError.message.match(/position (\d+)/)?.[1] || '0');
        const start = Math.max(0, position - 50);
        const end = Math.min(responseText.length, position + 50);
        console.error('📍 Contexte autour de l\'erreur:');
        console.error(responseText.substring(start, end));
      }
      
      throw new Error(`Échec du parsing de la réponse IA: ${jsonError.message}`);
    }
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE LORS DU TRAITEMENT PDF');
    console.error('==========================================');
    console.error('🕒 Timestamp:', new Date().toISOString());
    console.error('🔍 Type d\'erreur:', error.constructor.name);
    console.error('📝 Message d\'erreur:', error.message);
    console.error('📍 Stack trace:', error.stack);
    
    // Analyser le type d'erreur pour donner des conseils
    if (error.message.includes('API key')) {
      console.error('💡 CONSEIL: Vérifiez votre clé API Gemini dans les paramètres');
    } else if (error.message.includes('quota')) {
      console.error('💡 CONSEIL: Quota API dépassé, attendez ou vérifiez votre facturation');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      console.error('💡 CONSEIL: Problème de connexion réseau, vérifiez votre connexion internet');
    } else if (error.message.includes('parsing') || error.message.includes('JSON')) {
      console.error('💡 CONSEIL: Réponse IA malformée, essayez de relancer le traitement');
    }
    
    console.error('==========================================');
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
  console.log('🤖 Génération d\'un plan de traitement depuis le devis:', quote.quoteNumber);
  
  try {
    // Importer les fonctions du service de transformation
    const {
      generateDentalTreatmentPlan,
      mapQuoteToGeminiInput,
      validateGanttData,
      adaptGanttDataForComponents
    } = await import('./ganttTransformService.js');
    
    // Étape 1: Transformer le devis en format Gemini
    console.log('🔄 Transformation du devis en format Gemini...');
    const geminiInput = mapQuoteToGeminiInput(quote);
    
    // Étape 2: Appeler Gemini pour générer le plan
    console.log('🚀 Appel à Gemini pour générer le plan...');
    const ganttData = await generateDentalTreatmentPlan(geminiInput);
    
    // Étape 3: Valider les données
    console.log('✅ Validation des données générées...');
    validateGanttData(ganttData);
    
    // Étape 4: Adapter pour les composants
    console.log('🔧 Adaptation des données pour les composants...');
    const adaptedData = adaptGanttDataForComponents(ganttData);
    
    console.log('✅ Plan de traitement généré avec succès:', adaptedData.tasks.length, 'tâches');
    
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
  console.log('🤖 DÉBUT - Génération de plan structuré depuis objet devis:', quote.id || quote.quoteNumber);
  console.log('================================================================');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🚀 Modèle IA: Gemini (via getVisionModel)');

  try {
    // Vérifier si l'API est configurée
    console.log('🔑 Vérification de la configuration API...');
    if (!isGeminiConfigured()) {
      console.error('❌ Clé API Gemini non configurée');
      throw new Error('Clé API Gemini non configurée. Veuillez la configurer dans les paramètres.');
    }
    console.log('✅ API Gemini configurée');

    // Obtenir le modèle IA
    console.log('🤖 Initialisation du modèle IA...');
    const aiModel = getVisionModel(); // Utilise le même modèle que pour les PDF pour l'instant
    console.log('✅ Modèle IA initialisé');

    // Obtenir le prompt
    console.log('📝 Génération du prompt...');
    const prompt = getTreatmentPlanPrompt(); // Utilise le prompt existant
    console.log('✅ Prompt généré (longueur:', prompt.length, 'caractères)');

    // Préparer les données du devis pour l'IA.
    // L'IA attend un format textuel ou une image. Ici, nous allons envoyer une représentation textuelle du devis.
    // Nous pourrions envoyer un JSON.stringify(quote) ou une version simplifiée.
    // Pour cet exemple, nous allons envoyer une description textuelle simple.
    // Idéalement, le prompt serait ajusté pour indiquer qu'il reçoit un objet JSON de devis.
    // Pour l'instant, on va simplifier en envoyant le devis en tant que chaîne JSON.
    // L'IA devra être capable de comprendre cette chaîne JSON dans le contexte du prompt.
    
    // Simplification du devis pour l'envoi à l'IA, en se concentrant sur les éléments clés
    // que le prompt actuel est censé extraire d'un PDF.
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
          // Fallback à la date du jour
          return new Date().toISOString().split('T')[0];
        } catch (e) {
          console.warn('Erreur lors de la conversion de la date:', e);
          return new Date().toISOString().split('T')[0];
        }
      })(),
      actes: quote.phases?.flatMap(phase =>
        phase.treatments?.map(treatment => ({
          libelle: treatment.name,
          dents: treatment.teeth ? treatment.teeth.split(',').map(d => d.trim()).filter(d => d) : undefined, // Convertir la chaîne de dents en tableau
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
    
    console.log('📦 Préparation des données du devis pour Gemini...');
    console.log('📄 Contexte du devis pour l\'IA:');
    console.log(quoteContextForAI.substring(0, 500) + (quoteContextForAI.length > 500 ? '...' : ''));


    // Envoyer le prompt et le contexte du devis à l'IA
    // Le modèle 'gemini-pro-vision' peut accepter du texte.
    // Si le modèle est spécifiquement pour la vision, il faudrait ajuster.
    // Pour l'instant, on suppose que `getVisionModel` retourne un modèle capable de traiter du texte.
    console.log('🚀 Envoi des données à Gemini...');
    const result = await aiModel.generateContent([prompt, quoteContextForAI]);
    const response = result.response;
    console.log('✅ Réponse reçue de Gemini');

    // Parser la réponse JSON
    let responseText = response.text();
    console.log('📝 RÉPONSE BRUTE DE GEMINI:');
    console.log('=====================================');
    console.log(responseText);
    console.log('=====================================');
    console.log('📏 Longueur de la réponse:', responseText.length, 'caractères');

    if (responseText.includes('```json')) {
      console.log('🔍 Détection de bloc markdown JSON, extraction en cours...');
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        responseText = jsonMatch[1].trim();
        console.log('✂️ JSON extrait du bloc markdown');
      } else {
        console.warn('⚠️ Bloc markdown détecté mais extraction échouée, tentative de parsing direct.');
      }
    } else {
      console.log('📄 Pas de bloc markdown détecté, traitement direct du JSON');
    }
    
    console.log('🔄 Tentative de parsing JSON...');
    const jsonResponse = JSON.parse(responseText);
    console.log('✅ JSON parsé avec succès!');
    console.log('📊 Structure de la réponse (extrait): Patient -', jsonResponse.patient);

    return jsonResponse;

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE LORS DE LA GÉNÉRATION DU PLAN DEPUIS OBJET DEVIS');
    console.error('================================================================');
    console.error('🕒 Timestamp:', new Date().toISOString());
    console.error('🔍 Type d\'erreur:', error.constructor.name);
    console.error('📝 Message d\'erreur:', error.message);
    console.error('📍 Stack trace:', error.stack);
    
    if (error.message.includes('API key')) {
      console.error('💡 CONSEIL: Vérifiez votre clé API Gemini dans les paramètres');
    } else if (error.message.includes('quota')) {
      console.error('💡 CONSEIL: Quota API dépassé, attendez ou vérifiez votre facturation');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      console.error('💡 CONSEIL: Problème de connexion réseau, vérifiez votre connexion internet');
    } else if (error.message.includes('parsing') || error.message.includes('JSON')) {
      console.error('💡 CONSEIL: Réponse IA malformée, vérifiez la réponse brute et le prompt.');
    }
    console.error('================================================================');
    throw new Error(`Échec de la génération du plan structuré depuis l'objet devis: ${error.message}`);
  }
}

/**
 * Génère un plan de traitement structuré (JSON brut de l'IA) à partir d'un objet devis, en utilisant le NOUVEAU prompt.
 * @param {object} quote - L'objet devis complet.
 * @returns {Promise<object>} Le JSON structuré retourné par l'IA (format { taches: [{ tache: "...", duree: "..."}] }).
 */
export async function generateStructuredPlanWithNewPrompt(quote) {
  console.log('🤖 NOUVEAU PROMPT - Génération de plan structuré depuis objet devis:', quote.id || quote.quoteNumber);
  console.log('================================================================');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🚀 Modèle IA: Gemini (via getVisionModel)');

  try {
    // Vérifier si l'API est configurée
    console.log('🔑 Vérification de la configuration API...');
    if (!isGeminiConfigured()) {
      console.error('❌ Clé API Gemini non configurée');
      throw new Error('Clé API Gemini non configurée. Veuillez la configurer dans les paramètres.');
    }
    console.log('✅ API Gemini configurée');

    // Obtenir le modèle IA
    console.log('🤖 Initialisation du modèle IA...');
    const aiModel = getVisionModel();
    console.log('✅ Modèle IA initialisé');

    // Obtenir le NOUVEAU prompt
    console.log('📝 Génération du NOUVEAU prompt...');
    const prompt = getTreatmentPlanStructuringPrompt();
    console.log('✅ NOUVEAU Prompt généré (longueur:', prompt.length, 'caractères)');

    // Préparer les données du devis pour l'IA.
    // On va envoyer les phases complètes avec les traitements et médecins
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
    
    console.log('📦 Préparation des données (actes) pour Gemini avec nouveau prompt...');
    console.log('📄 Contexte des actes pour l\'IA:');
    console.log(contexteEnrichiPourIA.substring(0, 500) + (contexteEnrichiPourIA.length > 500 ? '...' : ''));

    console.log('🚀 Envoi des données à Gemini (nouveau prompt)...');
    console.log('📋 Prompt complet envoyé:', prompt);
    console.log('📋 Contexte complet envoyé:', contexteEnrichiPourIA);
    
    const result = await aiModel.generateContent([prompt, contexteEnrichiPourIA]);
    
    if (!result || !result.response) {
      console.error('❌ Pas de résultat ou de réponse de Gemini');
      throw new Error('Aucune réponse reçue de Gemini');
    }
    
    const response = result.response;
    console.log('✅ Réponse reçue de Gemini (nouveau prompt)');
    console.log('📊 Type de réponse:', typeof response);
    console.log('📊 Propriétés de la réponse:', Object.keys(response));

    let responseText = null;
    
    // Essayer plusieurs méthodes pour extraire le texte
    try {
      // Méthode 1: response.text()
      responseText = response.text();
    } catch (textError) {
      console.warn('⚠️ response.text() a échoué, tentative avec candidates...');
    }
    
    // Si response.text() échoue ou retourne null, essayer candidates
    if (!responseText) {
      console.log('🔍 Recherche du texte dans response.candidates...');
      
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        console.log('📊 Candidate trouvé:', {
          finishReason: candidate.finishReason,
          hasContent: !!candidate.content,
          contentRole: candidate.content?.role
        });
        
        // Vérifier si le candidat a du contenu
        if (candidate.content && candidate.content.parts) {
          responseText = candidate.content.parts.map(part => part.text || '').join('');
          console.log('✅ Texte extrait depuis candidates.content.parts');
        }
      }
    }
    
    // Vérifier si la génération a été interrompue à cause de MAX_TOKENS
    if (response.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
      console.error('❌ LIMITE DE TOKENS ATTEINTE - La réponse est incomplète ou vide');
      console.log('💡 CONSEIL: Le modèle a consommé trop de tokens en réflexion interne');
      
      // Si on a du texte partiel, on peut essayer de l'utiliser
      if (responseText && responseText.trim()) {
        console.warn('⚠️ Utilisation du texte partiel disponible');
      } else {
        // Créer un plan minimal de secours
        console.log('🔧 Création d\'un plan minimal de secours...');
        const minimalPlan = {
          taches: [
            {
              id: "T1",
              nom: "Consultation initiale",
              phase: 1,
              duree: { valeur: 1, unite: "jour" },
              dependances: []
            },
            {
              id: "T2",
              nom: "Plan de traitement détaillé à générer",
              phase: 1,
              duree: { valeur: 1, unite: "jour" },
              dependances: []
            }
          ],
          error: "MAX_TOKENS_REACHED",
          message: "Le modèle IA a atteint sa limite de tokens. Veuillez réessayer avec un devis plus simple ou contacter le support."
        };
        return minimalPlan;
      }
    }
    
    if (!responseText || !responseText.trim()) {
      console.error('❌ Aucun texte trouvé dans la réponse');
      console.error('📊 Structure complète de response:', {
        hasText: !!response.text,
        hasCandidates: !!response.candidates,
        candidatesCount: response.candidates?.length || 0,
        response: response
      });
      throw new Error('Réponse vide de Gemini - aucun contenu généré');
    }
    
    console.log('📝 RÉPONSE BRUTE DE GEMINI (nouveau prompt):');
    console.log('=====================================');
    console.log(responseText);
    console.log('=====================================');
    console.log('📏 Longueur de la réponse:', responseText.length, 'caractères');

    // Vérifier si la réponse semble être complète
    // Ne pas considérer les backticks comme une troncature
    const trimmedResponse = responseText.trim();
    const endsWithJson = trimmedResponse.endsWith('}') ||
                        trimmedResponse.endsWith('}\n```') ||
                        trimmedResponse.endsWith('} ```') ||
                        trimmedResponse.endsWith('}```');
                        
    if (!endsWithJson) {
      console.warn('⚠️ La réponse semble être tronquée');
      console.log('📍 Fin de la réponse:', responseText.slice(-100));
    }

    // Essayer de parser le JSON pour valider
    try {
      console.log('🔄 Tentative de parsing JSON pour validation...');
      
      // Extraire le JSON si enveloppé dans des balises markdown
      let jsonText = responseText;
      if (responseText.includes('```json')) {
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonText = jsonMatch[1].trim();
          console.log('✂️ JSON extrait du bloc markdown');
        }
      }
      
      // Parser pour validation
      const parsedData = JSON.parse(jsonText);
      console.log('✅ JSON valide!');
      console.log('📊 Structure détectée:', {
        hasTaches: !!parsedData.taches,
        nombreTaches: parsedData.taches?.length || 0,
        premiereTache: parsedData.taches?.[0]?.nom || 'N/A'
      });
      
      // Retourner le JSON parsé
      return parsedData;
      
    } catch (parseError) {
      console.error('❌ ERREUR DE PARSING JSON:', parseError);
      console.error('📍 Position approximative de l\'erreur:', parseError.message);
      
      // Si le JSON est tronqué, on peut essayer de le compléter basiquement
      if (responseText.includes('"taches"') && !responseText.trim().endsWith('}')) {
        console.log('🔧 Tentative de réparation du JSON tronqué...');
        
        // Compter les accolades et crochets ouverts
        const openBraces = (responseText.match(/{/g) || []).length;
        const closeBraces = (responseText.match(/}/g) || []).length;
        const openBrackets = (responseText.match(/\[/g) || []).length;
        const closeBrackets = (responseText.match(/\]/g) || []).length;
        
        let repairedJson = responseText;
        
        // Ajouter les fermetures manquantes
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          repairedJson += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          repairedJson += '}';
        }
        
        try {
          const repaired = JSON.parse(repairedJson);
          console.log('✅ JSON réparé avec succès!');
          console.warn('⚠️ ATTENTION: Des données peuvent être manquantes à cause de la troncature');
          return repaired;
        } catch (repairError) {
          console.error('❌ Impossible de réparer le JSON:', repairError);
        }
      }
      
      // Si on ne peut pas parser, retourner la réponse brute avec un indicateur d'erreur
      console.log('⚠️ Retour de la réponse brute avec indicateur d\'erreur');
      return {
        geminiRawResponse: responseText,
        error: 'JSON_PARSE_ERROR',
        errorMessage: parseError.message
      };
    }

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE LORS DE LA GÉNÉRATION DU PLAN (NOUVEAU PROMPT)');
    console.error('================================================================');
    console.error('🕒 Timestamp:', new Date().toISOString());
    console.error('🔍 Type d\'erreur:', error.constructor.name);
    console.error('📝 Message d\'erreur:', error.message);
    console.error('📍 Stack trace:', error.stack);
    
    if (error.message.includes('API key')) {
      console.error('💡 CONSEIL: Vérifiez votre clé API Gemini dans les paramètres');
    } else if (error.message.includes('quota')) {
      console.error('💡 CONSEIL: Quota API dépassé, attendez ou vérifiez votre facturation');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      console.error('💡 CONSEIL: Problème de connexion réseau, vérifiez votre connexion internet');
    } else if (error.message.includes('parsing') || error.message.includes('JSON')) {
      console.error('💡 CONSEIL: Réponse IA malformée, vérifiez la réponse brute et le prompt.');
    }
    console.error('================================================================');
    throw new Error(`Échec de la génération du plan structuré (nouveau prompt): ${error.message}`);
  }
}

/**
 * Configuration de l'API AI (compatible avec l'interface de aiServiceOptimized)
 */
export function configureFirebaseAI(config) {
  // Utilise la configuration Gemini au lieu de Firebase AI
  if (config.apiKey) {
    localStorage.setItem('geminiApiKey', config.apiKey);
  }
  if (config.location) {
    localStorage.setItem('geminiLocation', config.location || 'us-central1');
  }
}

/**
 * Vérifier si l'API AI est configurée
 */
export function isFirebaseAIConfigured() {
  // Vérifie la configuration Gemini
  return isGeminiConfigured();
}

/**
 * Obtenir la configuration AI actuelle
 */
export function getFirebaseAIConfig() {
  return {
    apiKey: localStorage.getItem('geminiApiKey') || '',
    location: localStorage.getItem('geminiLocation') || 'us-central1'
  };
}

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
