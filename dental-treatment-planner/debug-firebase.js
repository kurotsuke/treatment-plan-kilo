/**
 * Script de débogage Firebase pour tester la connexion et la sauvegarde
 */

// Test de la configuration Firebase
console.log('🔥 === DÉBOGAGE FIREBASE ===');

// 1. Vérifier les variables d'environnement
console.log('📋 Variables d\'environnement:');
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Définie' : '❌ Manquante');
console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Définie' : '❌ Manquante');
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Définie' : '❌ Manquante');

// 2. Tester l'import Firebase
try {
  const { getFirebaseInfo } = await import('./src/config/firebase.js');
  const firebaseInfo = getFirebaseInfo();
  console.log('🔥 Configuration Firebase:', firebaseInfo);
} catch (error) {
  console.error('❌ Erreur import Firebase:', error);
}

// 3. Tester l'authentification
try {
  const { useAuth } = await import('./src/contexts/AuthContext.jsx');
  console.log('🔐 Contexte Auth importé avec succès');
} catch (error) {
  console.error('❌ Erreur import AuthContext:', error);
}

// 4. Tester le service settings
try {
  const settingsService = await import('./src/services/settingsService.js');
  console.log('⚙️ Service Settings importé avec succès');
} catch (error) {
  console.error('❌ Erreur import SettingsService:', error);
}

console.log('🔥 === FIN DÉBOGAGE ===');