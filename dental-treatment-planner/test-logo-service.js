// Test simple pour vérifier le service de gestion des logos
import settingsService from './src/services/settingsService.js';

// Fonction de test pour simuler un fichier image
function createMockImageFile() {
  // Créer un canvas pour générer une image de test
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  
  // Dessiner un rectangle coloré
  ctx.fillStyle = '#3B82F6';
  ctx.fillRect(0, 0, 400, 400);
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('LOGO TEST', 200, 200);
  
  // Convertir en blob puis en File
  return new Promise(resolve => {
    canvas.toBlob(blob => {
      const file = new File([blob], 'test-logo.png', { type: 'image/png' });
      resolve(file);
    }, 'image/png');
  });
}

// Test principal
async function testLogoService() {
  console.log('🧪 Test du service de gestion des logos...');
  
  try {
    // 1. Créer un fichier image de test
    console.log('📁 Création d\'un fichier image de test...');
    const mockFile = await createMockImageFile();
    console.log(`✅ Fichier créé: ${mockFile.name} (${mockFile.size} bytes)`);
    
    // 2. Tester la validation et le traitement
    console.log('🔍 Test de validation et traitement...');
    const processedLogo = await settingsService.validateAndProcessLogo(mockFile);
    console.log(`✅ Logo traité avec succès (${processedLogo.length} caractères base64)`);
    
    // 3. Tester la sauvegarde des réglages avec logo
    console.log('💾 Test de sauvegarde avec logo...');
    const testSettings = {
      clinicName: 'Clinique Test',
      clinicAddress: '123 Rue Test',
      clinicLogo: processedLogo,
      geminiApiKey: 'test-key',
      currency: 'EUR'
    };
    
    // Simuler la sauvegarde (sans Firebase pour ce test)
    console.log('✅ Réglages préparés pour sauvegarde');
    
    // 4. Tester le résumé des réglages
    console.log('📊 Test du résumé des réglages...');
    const summary = settingsService.getSettingsSummary(testSettings);
    console.log(`✅ Résumé: ${summary.count}/${summary.total} champs configurés`);
    
    console.log('🎉 Tous les tests sont passés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exporter pour utilisation
export { testLogoService };

// Si exécuté directement dans le navigateur
if (typeof window !== 'undefined') {
  window.testLogoService = testLogoService;
  console.log('🔧 Test disponible via: window.testLogoService()');
}