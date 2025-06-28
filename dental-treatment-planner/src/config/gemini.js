/**
 * Configuration for Google Gemini AI
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

// AI model configuration
export const aiConfig = {
  models: {
    text: "models/gemini-2.5-flash-preview-05-20",
    vision: "models/gemini-2.5-flash-preview-05-20"
  },
  settings: {
    temperature: 0.1,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 8192
  }
};

// Fonction pour obtenir la clé API depuis localStorage
const getApiKey = () => {
  const apiKey = localStorage.getItem('geminiApiKey');
  if (!apiKey) {
    throw new Error('Clé API Gemini non configurée. Veuillez la configurer dans les paramètres.');
  }
  return apiKey;
};

// Get configured AI model
export const getAIModel = () => {
  try {
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    return genAI.getGenerativeModel({ 
      model: aiConfig.models.text,
      generationConfig: aiConfig.settings
    });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de Gemini:', error);
    throw error;
  }
};

// Get configured Vision model
export const getVisionModel = () => {
  try {
    const apiKey = getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    return genAI.getGenerativeModel({
      model: aiConfig.models.vision,
      generationConfig: aiConfig.settings
    });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de Gemini Vision:', error);
    throw error;
  }
};

// Fonction pour vérifier si l'API est configurée
export const isGeminiConfigured = () => {
  return !!localStorage.getItem('geminiApiKey');
};

// Fonction pour tester la connexion API
export const testGeminiConnection = async () => {
  try {
    const model = getAIModel();
    const result = await model.generateContent("Test de connexion");
    const response = await result.response;
    return !!response.text();
  } catch (error) {
    console.error('Test de connexion échoué:', error);
    return false;
  }
};