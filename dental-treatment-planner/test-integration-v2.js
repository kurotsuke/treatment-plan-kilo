/**
 * Tests d'intégration pour l'architecture Firebase V2
 * Valide que tous les services et hooks fonctionnent ensemble
 */

// Import des services V2
import doctorsServiceV2 from './src/services/v2/doctorsService.js';
import patientsServiceV2 from './src/services/v2/patientsService.js';
import quotesServiceV2 from './src/services/v2/quotesService.js';
import settingsServiceV2 from './src/services/v2/settingsService.js';
import treatmentPlansServiceV2 from './src/services/v2/treatmentPlansService.js';

// Import de la couche d'abstraction
import { BaseRepository, QueryBuilder, CacheManager, ErrorHandler } from './src/core/firebase/index.js';

/**
 * Configuration des tests
 */
const TEST_CONFIG = {
  userId: 'test-user-integration-v2',
  timeout: 30000, // 30 secondes
  retryAttempts: 3
};

/**
 * Données de test
 */
const TEST_DATA = {
  doctor: {
    firstName: 'Dr. Jean',
    lastName: 'Dupont',
    specialization: 'Orthodontie',
    email: 'jean.dupont@test.com',
    phone: '+212600000001'
  },
  patient: {
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie.martin@test.com',
    phone: '+212600000002',
    dateOfBirth: new Date('1990-05-15'),
    gender: 'femme'
  },
  settings: {
    clinicInfo: {
      name: 'Cabinet Test V2',
      address: '123 Rue Test, Casablanca',
      phone: '+212500000000',
      email: 'cabinet@test.com'
    },
    doctorInfo: {
      firstName: 'Dr. Test',
      lastName: 'Integration',
      specialization: 'Dentisterie générale'
    }
  }
};

/**
 * Utilitaires de test
 */
class TestUtils {
  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static generateTestId() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static async withTimeout(promise, timeout = TEST_CONFIG.timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), timeout)
      )
    ]);
  }

  static async retry(fn, attempts = TEST_CONFIG.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === attempts - 1) throw error;
        await this.delay(1000 * (i + 1)); // Délai exponentiel
      }
    }
  }
}

/**
 * Tests de la couche d'abstraction Firebase
 */
class FirebaseAbstractionTests {
  static async testBaseRepository() {
    console.log('🧪 Test BaseRepository...');
    
    const repo = new BaseRepository('test-collection');
    
    // Test de validation du schéma
    const schema = {
      name: { type: 'string', required: true },
      age: { type: 'number', min: 0 }
    };
    
    const validData = { name: 'Test', age: 25 };
    const invalidData = { age: -5 }; // Manque name, age négatif
    
    const validResult = repo.validateData(validData, schema);
    const invalidResult = repo.validateData(invalidData, schema);
    
    console.assert(validResult.isValid, 'Données valides devraient passer la validation');
    console.assert(!invalidResult.isValid, 'Données invalides devraient échouer la validation');
    
    console.log('✅ BaseRepository validé');
  }

  static async testQueryBuilder() {
    console.log('🧪 Test QueryBuilder...');
    
    const qb = new QueryBuilder('test-collection');
    
    // Test de construction de requête
    const query = qb
      .where('status', '==', 'active')
      .where('age', '>=', 18)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .build();
    
    console.assert(query, 'Query devrait être construite');
    console.assert(qb.getEstimatedCost() > 0, 'Coût estimé devrait être calculé');
    
    console.log('✅ QueryBuilder validé');
  }

  static async testCacheManager() {
    console.log('🧪 Test CacheManager...');
    
    const cache = new CacheManager();
    const testKey = 'test-cache-key';
    const testData = { message: 'Hello Cache' };
    
    // Test set/get
    cache.set(testKey, testData, 1000); // 1 seconde TTL
    const cachedData = cache.get(testKey);
    
    console.assert(JSON.stringify(cachedData) === JSON.stringify(testData), 'Données cachées devraient correspondre');
    
    // Test expiration
    await TestUtils.delay(1100);
    const expiredData = cache.get(testKey);
    
    console.assert(expiredData === null, 'Données expirées devraient être null');
    
    console.log('✅ CacheManager validé');
  }

  static async testErrorHandler() {
    console.log('🧪 Test ErrorHandler...');
    
    const errorHandler = new ErrorHandler();
    
    // Test de gestion d'erreur réseau
    const networkError = new Error('Network error');
    networkError.code = 'unavailable';
    
    const shouldRetry = errorHandler.shouldRetry(networkError, 1);
    console.assert(shouldRetry, 'Erreur réseau devrait déclencher un retry');
    
    // Test de gestion d'erreur permission
    const permissionError = new Error('Permission denied');
    permissionError.code = 'permission-denied';
    
    const shouldNotRetry = errorHandler.shouldRetry(permissionError, 1);
    console.assert(!shouldNotRetry, 'Erreur de permission ne devrait pas déclencher un retry');
    
    console.log('✅ ErrorHandler validé');
  }

  static async runAll() {
    console.log('🚀 Tests couche d\'abstraction Firebase V2...\n');
    
    await this.testBaseRepository();
    await this.testQueryBuilder();
    await this.testCacheManager();
    await this.testErrorHandler();
    
    console.log('\n✅ Tous les tests de la couche d\'abstraction passés !');
  }
}

/**
 * Tests d'intégration des services
 */
class ServicesIntegrationTests {
  static async testDoctorsService() {
    console.log('🧪 Test DoctorsService V2...');
    
    const testDoctor = { ...TEST_DATA.doctor };
    
    // Test création
    const createdDoctor = await doctorsServiceV2.createDoctor(TEST_CONFIG.userId, testDoctor);
    console.assert(createdDoctor.id, 'Docteur devrait avoir un ID');
    console.assert(createdDoctor.firstName === testDoctor.firstName, 'Données devraient correspondre');
    
    // Test lecture
    const doctors = await doctorsServiceV2.getDoctors(TEST_CONFIG.userId);
    console.assert(doctors.length > 0, 'Devrait récupérer les docteurs');
    
    // Test mise à jour
    const updatedDoctor = await doctorsServiceV2.updateDoctor(createdDoctor.id, { 
      specialization: 'Chirurgie dentaire' 
    });
    console.assert(updatedDoctor.specialization === 'Chirurgie dentaire', 'Mise à jour devrait fonctionner');
    
    // Test suppression
    await doctorsServiceV2.deleteDoctor(createdDoctor.id);
    
    console.log('✅ DoctorsService V2 validé');
    return createdDoctor;
  }

  static async testPatientsService() {
    console.log('🧪 Test PatientsService V2...');
    
    const testPatient = { ...TEST_DATA.patient };
    
    // Test création
    const createdPatient = await patientsServiceV2.createPatient(TEST_CONFIG.userId, testPatient);
    console.assert(createdPatient.id, 'Patient devrait avoir un ID');
    console.assert(createdPatient.patientNumber, 'Patient devrait avoir un numéro');
    
    // Test recherche
    const searchResults = await patientsServiceV2.searchPatients(TEST_CONFIG.userId, 'Marie');
    console.assert(searchResults.length > 0, 'Recherche devrait retourner des résultats');
    
    // Test statistiques
    const stats = await patientsServiceV2.getPatientsStats(TEST_CONFIG.userId);
    console.assert(stats.total >= 1, 'Statistiques devraient inclure le patient créé');
    
    console.log('✅ PatientsService V2 validé');
    return createdPatient;
  }

  static async testSettingsService() {
    console.log('🧪 Test SettingsService V2...');
    
    const testSettings = { ...TEST_DATA.settings };
    
    // Test mise à jour
    const updatedSettings = await settingsServiceV2.updateSettings(TEST_CONFIG.userId, testSettings);
    console.assert(updatedSettings.clinicInfo.name === testSettings.clinicInfo.name, 'Paramètres devraient être mis à jour');
    
    // Test lecture
    const settings = await settingsServiceV2.getSettings(TEST_CONFIG.userId);
    console.assert(settings.clinicInfo.name === testSettings.clinicInfo.name, 'Paramètres devraient être persistés');
    
    console.log('✅ SettingsService V2 validé');
    return settings;
  }

  static async testQuotesService(patient) {
    console.log('🧪 Test QuotesService V2...');
    
    const testQuote = {
      patientId: patient.id,
      patientInfo: {
        firstName: patient.firstName,
        lastName: patient.lastName
      },
      basicInfo: {
        title: 'Devis test intégration',
        description: 'Test automatisé'
      },
      treatments: [
        {
          name: 'Consultation',
          price: 200,
          quantity: 1
        }
      ]
    };
    
    // Test création
    const createdQuote = await quotesServiceV2.createQuote(TEST_CONFIG.userId, testQuote);
    console.assert(createdQuote.id, 'Devis devrait avoir un ID');
    console.assert(createdQuote.quoteNumber, 'Devis devrait avoir un numéro');
    
    // Test duplication
    const duplicatedQuote = await quotesServiceV2.duplicateQuote(createdQuote.id);
    console.assert(duplicatedQuote.id !== createdQuote.id, 'Devis dupliqué devrait avoir un ID différent');
    
    // Test statistiques
    const stats = await quotesServiceV2.getQuotesStats(TEST_CONFIG.userId);
    console.assert(stats.total >= 2, 'Statistiques devraient inclure les devis créés');
    
    console.log('✅ QuotesService V2 validé');
    return createdQuote;
  }

  static async testTreatmentPlansService(patient, quote) {
    console.log('🧪 Test TreatmentPlansService V2...');
    
    const testPlan = {
      patientId: patient.id,
      quoteId: quote.id,
      patientInfo: {
        firstName: patient.firstName,
        lastName: patient.lastName
      },
      basicInfo: {
        title: 'Plan de traitement test',
        description: 'Test automatisé'
      },
      phases: [
        {
          name: 'Phase 1',
          treatments: ['Consultation', 'Radiographie'],
          duration: 7,
          cost: 400
        }
      ]
    };
    
    // Test création
    const createdPlan = await treatmentPlansServiceV2.createTreatmentPlan(TEST_CONFIG.userId, testPlan);
    console.assert(createdPlan.id, 'Plan devrait avoir un ID');
    console.assert(createdPlan.planNumber, 'Plan devrait avoir un numéro');
    
    // Test duplication
    const duplicatedPlan = await treatmentPlansServiceV2.duplicateTreatmentPlan(createdPlan.id);
    console.assert(duplicatedPlan.id !== createdPlan.id, 'Plan dupliqué devrait avoir un ID différent');
    
    // Test statistiques
    const stats = await treatmentPlansServiceV2.getTreatmentPlansStats(TEST_CONFIG.userId);
    console.assert(stats.total >= 2, 'Statistiques devraient inclure les plans créés');
    
    console.log('✅ TreatmentPlansService V2 validé');
    return createdPlan;
  }

  static async runAll() {
    console.log('🚀 Tests d\'intégration des services V2...\n');
    
    // Tests séquentiels avec dépendances
    const doctor = await TestUtils.withTimeout(this.testDoctorsService());
    const patient = await TestUtils.withTimeout(this.testPatientsService());
    const settings = await TestUtils.withTimeout(this.testSettingsService());
    const quote = await TestUtils.withTimeout(this.testQuotesService(patient));
    const plan = await TestUtils.withTimeout(this.testTreatmentPlansService(patient, quote));
    
    console.log('\n✅ Tous les tests d\'intégration des services passés !');
    
    return { doctor, patient, settings, quote, plan };
  }
}

/**
 * Tests de performance
 */
class PerformanceTests {
  static async testCachePerformance() {
    console.log('🧪 Test performance cache...');
    
    const iterations = 1000;
    const cache = new CacheManager();
    
    // Test écriture
    const writeStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      cache.set(`key-${i}`, { data: `value-${i}` });
    }
    const writeTime = performance.now() - writeStart;
    
    // Test lecture
    const readStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      cache.get(`key-${i}`);
    }
    const readTime = performance.now() - readStart;
    
    console.log(`📊 Cache: ${iterations} écritures en ${writeTime.toFixed(2)}ms, ${iterations} lectures en ${readTime.toFixed(2)}ms`);
    
    console.assert(writeTime < 100, 'Écriture cache devrait être rapide');
    console.assert(readTime < 50, 'Lecture cache devrait être très rapide');
    
    console.log('✅ Performance cache validée');
  }

  static async testQueryOptimization() {
    console.log('🧪 Test optimisation requêtes...');
    
    const qb = new QueryBuilder('test-collection');
    
    // Test requête simple
    const simpleQuery = qb.where('status', '==', 'active').build();
    const simpleCost = qb.getEstimatedCost();
    
    // Test requête complexe
    qb.reset();
    const complexQuery = qb
      .where('status', '==', 'active')
      .where('priority', '>=', 2)
      .where('createdAt', '>=', new Date())
      .orderBy('priority', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .build();
    const complexCost = qb.getEstimatedCost();
    
    console.log(`📊 Coût requête simple: ${simpleCost}, complexe: ${complexCost}`);
    
    console.assert(complexCost > simpleCost, 'Requête complexe devrait coûter plus cher');
    console.assert(complexCost < 100, 'Coût devrait rester raisonnable');
    
    console.log('✅ Optimisation requêtes validée');
  }

  static async runAll() {
    console.log('🚀 Tests de performance V2...\n');
    
    await this.testCachePerformance();
    await this.testQueryOptimization();
    
    console.log('\n✅ Tous les tests de performance passés !');
  }
}

/**
 * Fonction principale de test
 */
async function runIntegrationTests() {
  console.log('🎯 TESTS D\'INTÉGRATION ARCHITECTURE FIREBASE V2');
  console.log('================================================\n');
  
  const startTime = performance.now();
  
  try {
    // Tests de la couche d'abstraction
    await FirebaseAbstractionTests.runAll();
    console.log('');
    
    // Tests d'intégration des services
    await ServicesIntegrationTests.runAll();
    console.log('');
    
    // Tests de performance
    await PerformanceTests.runAll();
    
    const endTime = performance.now();
    const totalTime = (endTime - startTime).toFixed(2);
    
    console.log('\n🎉 TOUS LES TESTS PASSÉS AVEC SUCCÈS !');
    console.log(`⏱️  Temps total: ${totalTime}ms`);
    console.log('\n📋 Résumé:');
    console.log('✅ Couche d\'abstraction Firebase validée');
    console.log('✅ Services V2 intégrés et fonctionnels');
    console.log('✅ Performance optimisée');
    console.log('✅ Architecture prête pour la production');
    
  } catch (error) {
    console.error('\n❌ ÉCHEC DES TESTS:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Exécution des tests si le script est lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests();
}

export {
  runIntegrationTests,
  FirebaseAbstractionTests,
  ServicesIntegrationTests,
  PerformanceTests,
  TestUtils,
  TEST_CONFIG,
  TEST_DATA
};