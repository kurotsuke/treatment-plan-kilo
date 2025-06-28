/**
 * Service de streaming pour l'analyse AI des PDFs
 * Permet un chargement progressif des données
 */
import { getVisionModel } from '../config/firebaseAI.js';
import { getTreatmentPlanPrompt } from './prompts.js';

export class StreamingAIService extends EventTarget {
  constructor() {
    super();
    this.abortController = null;
    console.log('🏗️ [StreamingAIService] Service créé');
  }

  async startStreaming(base64PDF) {
    console.log('🚀 [StreamingAIService] startStreaming appelé');
    this.abortController = new AbortController();
    
    try {
      const model = getVisionModel();
      const prompt = getTreatmentPlanPrompt();
      
      const imagePart = {
        inlineData: {
          data: base64PDF,
          mimeType: "application/pdf"
        }
      };
      
      console.log('🚀 Démarrage du streaming Firebase AI...');
      
      // Utiliser generateContentStream au lieu de generateContent
      const result = await model.generateContentStream([prompt, imagePart]);
      
      let accumulatedText = '';
      let partialData = {
        patient: null,
        date_devis: null,
        etat_general: [],
        resume_langage_commun: null,
        phases: [],
        synthese_financiere: null
      };
      
      let totalLength = 0;
      let processedLength = 0;
      
      for await (const chunk of result.stream) {
        if (this.abortController.signal.aborted) {
          console.log('⏹️ Streaming annulé par l\'utilisateur');
          break;
        }
        
        const chunkText = chunk.text();
        accumulatedText += chunkText;
        processedLength += chunkText.length;
        
        console.log(`📡 Chunk reçu: ${chunkText.length} caractères, Total: ${accumulatedText.length} caractères`);
        
        // Émettre la progression (estimation basée sur la taille du texte)
        const estimatedProgress = Math.min(90, Math.floor((processedLength / 5000) * 100)); // Estimation basée sur ~5000 caractères attendus
        console.log(`📊 [StreamingAIService] Émission progress: ${estimatedProgress}%`);
        this.dispatchEvent(new CustomEvent('progress', {
          detail: {
            progress: estimatedProgress,
            processedLength,
            currentChunkSize: chunkText.length
          }
        }));
        
        // Tenter de parser les données partielles
        try {
          const parsedData = this.parsePartialJSON(accumulatedText);
          if (parsedData && this.hasNewData(parsedData, partialData)) {
            // Émettre les mises à jour progressives
            console.log('✨ [StreamingAIService] Nouvelles données détectées:', Object.keys(parsedData));
            console.log('📤 [StreamingAIService] Émission événement "data"');
            this.dispatchEvent(new CustomEvent('data', { detail: parsedData }));
            partialData = { ...partialData, ...parsedData };
          }
        } catch (e) {
          // Continuer l'accumulation si le JSON n'est pas encore complet
          console.log('⏳ JSON incomplet, accumulation en cours...');
        }
      }
      
      // Émettre la progression finale
      this.dispatchEvent(new CustomEvent('progress', {
        detail: {
          progress: 100,
          processedLength,
          complete: true
        }
      }));
      
      // Tenter un parsing final complet
      try {
        const finalData = JSON.parse(accumulatedText);
        console.log('✅ [StreamingAIService] Parsing final réussi:', finalData);
        console.log('📤 [StreamingAIService] Émission événement "complete"');
        this.dispatchEvent(new CustomEvent('complete', { detail: { data: finalData } }));
      } catch (e) {
        console.log('⚠️ Parsing final échoué, utilisation des données partielles');
        // Émettre les données partielles finales si on a au moins quelque chose
        if (partialData && (partialData.patient || partialData.phases?.length > 0)) {
          this.dispatchEvent(new CustomEvent('complete', { detail: { data: partialData } }));
        } else {
          // Aucune donnée valide extraite
          const error = new Error('Impossible d\'extraire les données du PDF');
          console.error('❌ Aucune donnée valide extraite');
          this.dispatchEvent(new CustomEvent('error', { detail: { error } }));
        }
      }
      
    } catch (error) {
      console.error('❌ [StreamingAIService] Erreur streaming:', error);
      console.log('📤 [StreamingAIService] Émission événement "error"');
      this.dispatchEvent(new CustomEvent('error', { detail: error }));
    }
  }

  hasNewData(newData, oldData) {
    // Vérifier si de nouvelles données ont été extraites
    for (const key in newData) {
      if (newData[key] !== oldData[key]) {
        if (Array.isArray(newData[key]) && Array.isArray(oldData[key])) {
          if (newData[key].length !== oldData[key].length) return true;
        } else {
          return true;
        }
      }
    }
    return false;
  }

  parsePartialJSON(text) {
    // Stratégie de parsing intelligent pour extraire les données au fur et à mesure
    const data = {};
    
    // Extraire le nom du patient
    const patientMatch = text.match(/"patient"\s*:\s*"([^"]+)"/);
    if (patientMatch && patientMatch[1]) {
      data.patient = patientMatch[1];
    }
    
    // Extraire la date
    const dateMatch = text.match(/"date_devis"\s*:\s*"([^"]+)"/);
    if (dateMatch && dateMatch[1]) {
      data.date_devis = dateMatch[1];
    }
    
    // Extraire l'état général (tableau)
    const etatMatch = text.match(/"etat_general"\s*:\s*\[(.*?)\]/s);
    if (etatMatch) {
      try {
        const etatText = `[${etatMatch[1]}]`;
        const parsed = JSON.parse(etatText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          data.etat_general = parsed;
        }
      } catch (e) {
        // Essayer d'extraire au moins les éléments complets
        const items = this.extractArrayItems(etatMatch[1]);
        if (items.length > 0) {
          data.etat_general = items;
        }
      }
    }
    
    // Extraire le résumé
    const resumeMatch = text.match(/"resume_langage_commun"\s*:\s*"([^"]*?)"/s);
    if (resumeMatch && resumeMatch[1]) {
      data.resume_langage_commun = resumeMatch[1];
    }
    
    // Extraire les phases (plus complexe)
    const phasesMatch = text.match(/"phases"\s*:\s*\[([\s\S]*?)\](?=\s*(?:,\s*"|\s*}))/);
    if (phasesMatch) {
      try {
        const phases = this.parsePartialPhases(phasesMatch[1]);
        if (phases.length > 0) {
          data.phases = phases;
        }
      } catch (e) {
        console.log('⏳ Phases incomplètes');
      }
    }
    
    // Extraire la synthèse financière
    const syntheseMatch = text.match(/"synthese_financiere"\s*:\s*(\{[^}]*\})/);
    if (syntheseMatch) {
      try {
        const synthese = JSON.parse(syntheseMatch[1]);
        if (synthese && Object.keys(synthese).length > 0) {
          data.synthese_financiere = synthese;
        }
      } catch (e) {}
    }
    
    return Object.keys(data).length > 0 ? data : null;
  }

  extractArrayItems(arrayContent) {
    // Extraire les chaînes de caractères d'un tableau même incomplet
    const items = [];
    const stringRegex = /"([^"]+)"/g;
    let match;
    while ((match = stringRegex.exec(arrayContent)) !== null) {
      items.push(match[1]);
    }
    return items;
  }

  parsePartialPhases(phasesText) {
    // Parser les phases même si elles sont incomplètes
    const phases = [];
    
    // Regex pour capturer chaque objet phase
    const phaseRegex = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    let match;
    
    while ((match = phaseRegex.exec(phasesText)) !== null) {
      try {
        const phaseText = `{${match[1]}}`;
        const phase = JSON.parse(phaseText);
        
        // Vérifier que la phase a au moins un nom
        if (phase.nom || phase.numero) {
          phases.push(phase);
        }
      } catch (e) {
        // Essayer d'extraire au moins les informations de base
        const partialPhase = this.extractPartialPhase(match[1]);
        if (partialPhase) {
          phases.push(partialPhase);
        }
      }
    }
    
    return phases;
  }

  extractPartialPhase(phaseText) {
    // Extraire les informations de base d'une phase même incomplète
    const phase = {};
    
    // Numéro
    const numeroMatch = phaseText.match(/"numero"\s*:\s*(\d+)/);
    if (numeroMatch) {
      phase.numero = parseInt(numeroMatch[1]);
    }
    
    // Nom
    const nomMatch = phaseText.match(/"nom"\s*:\s*"([^"]+)"/);
    if (nomMatch) {
      phase.nom = nomMatch[1];
    }
    
    // Description
    const descMatch = phaseText.match(/"description_phase"\s*:\s*"([^"]+)"/);
    if (descMatch) {
      phase.description_phase = descMatch[1];
    }
    
    // Nombre de séances
    const seancesMatch = phaseText.match(/"nombre_seances_estime"\s*:\s*(\d+)/);
    if (seancesMatch) {
      phase.nombre_seances_estime = parseInt(seancesMatch[1]);
    }
    
    // Total phase
    const totalMatch = phaseText.match(/"total_phase"\s*:\s*(\d+(?:\.\d+)?)/);
    if (totalMatch) {
      phase.total_phase = parseFloat(totalMatch[1]);
    }
    
    // Essayer d'extraire les groupes d'actes
    const groupesMatch = phaseText.match(/"groupes_actes"\s*:\s*\[([\s\S]*?)\]/);
    if (groupesMatch) {
      phase.groupes_actes = this.extractPartialGroupes(groupesMatch[1]);
    }
    
    return (phase.nom || phase.numero) ? phase : null;
  }

  extractPartialGroupes(groupesText) {
    // Extraire les groupes d'actes même partiels
    const groupes = [];
    
    // Regex simplifiée pour capturer chaque groupe
    const groupeRegex = /\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}/g;
    let match;
    
    while ((match = groupeRegex.exec(groupesText)) !== null) {
      try {
        const groupeText = `{${match[1]}}`;
        const groupe = JSON.parse(groupeText);
        if (groupe.type || groupe.actes) {
          groupes.push(groupe);
        }
      } catch (e) {
        // Extraire au moins le type
        const typeMatch = match[1].match(/"type"\s*:\s*"([^"]+)"/);
        if (typeMatch) {
          groupes.push({ type: typeMatch[1], actes: [] });
        }
      }
    }
    
    return groupes;
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
      console.log('🛑 Streaming annulé');
    }
  }
}