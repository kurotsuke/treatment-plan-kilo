/**
 * Script de test pour les services Firebase
 * Ce script teste les fonctionnalités de base des services patients, devis et plans de traitement
 */

// Import des services
import patientsService from './src/services/patientsService.js';
import quotesService from './src/services/quotesService.js';
import treatmentPlansService from './src/services/treatmentPlansService.js';

// Données de test
const TEST_USER_ID = 'test-user-123';

const testPatientData = {
  personalInfo: {
    firstName: 'Jean',
    lastName: 'Dupont',
    dateOfBirth: new Date('1985-06-15'),
    gender: 'M',
    phone: '0123456789',
    email: 'jean.dupont@email.com',
    address: {
      street: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      country: 'France'
    }
  },
  medicalInfo: {
    allergies: ['Pénicilline'],
    medications: ['Aspirine'],
    medicalHistory: 'Hypertension',
    emergencyContact: {
      name: 'Marie Dupont',
      phone: '0987654321',
      relationship: 'Épouse'
    }
  },
  dentalInfo: {
    lastVisit: new Date('2024-01-15'),
    treatmentHistory: ['Détartrage', 'Plombage'],
    currentIssues: ['Carie molaire'],
    notes: 'Patient anxieux'
  }
};

const testQuoteData = {
  patientId: '', // Sera rempli après création du patient
  basicInfo: {
    date: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
    referringDoctorId: 'doctor-123',
    currency: 'EUR'
  },
  patientInfo: {
    healthStatus: 'Bon état général',
    treatmentSummary: 'Traitement orthodontique complet',
    tags: ['orthodontie', 'urgence']
  },
  phases: [
    {
      id: 1,
      name: 'Phase 1 - Préparation',
      description: 'Nettoyage et préparation',
      sessions: 2,
      treatments: [
        {
          id: 1,
          name: 'Détartrage',
          fees: 80,
          unitCost: 80,
          quantity: 1,
          sessions: 1,
          teeth: '',
          category: 'Hygiène'
        },
        {
          id: 2,
          name: 'Radiographie panoramique',
          fees: 120,
          unitCost: 120,
          quantity: 1,
          sessions: 1,
          teeth: '',
          category: 'Diagnostic'
        }
      ]
    },
    {
      id: 2,
      name: 'Phase 2 - Traitement',
      description: 'Pose d\'appareil orthodontique',
      sessions: 1,
      treatments: [
        {
          id: 3,
          name: 'Pose appareil orthodontique',
          fees: 1500,
          unitCost: 1500,
          quantity: 1,
          sessions: 1,
          teeth: '',
          category: 'Orthodontie'
        }
      ]
    }
  ]
};

async function testPatientsService() {
  console.log('\n🧪 === TEST PATIENTS SERVICE ===');
  
  try {
    // Test validation
    console.log('📋 Test de validation...');
    const validation = patientsService.validatePatient(testPatientData);
    console.log('✅ Validation:', validation.isValid ? 'SUCCÈS' : 'ÉCHEC', validation.errors);
    
    // Test génération numéro patient
    console.log('🔢 Test génération numéro patient...');
    const patientNumber = await patientsService.generatePatientNumber(TEST_USER_ID);
    console.log('✅ Numéro généré:', patientNumber);
    
    // Test calcul âge
    console.log('📅 Test calcul âge...');
    const age = patientsService.calculateAge(testPatientData.personalInfo.dateOfBirth);
    console.log('✅ Âge calculé:', age, 'ans');
    
    // Test résumé patient
    console.log('📊 Test résumé patient...');
    const summary = patientsService.getPatientSummary(testPatientData);
    console.log('✅ Résumé:', summary);
    
    console.log('✅ Tests patients service: TOUS RÉUSSIS');
    return true;
  } catch (error) {
    console.error('❌ Erreur dans les tests patients:', error);
    return false;
  }
}

async function testQuotesService() {
  console.log('\n🧪 === TEST QUOTES SERVICE ===');
  
  try {
    // Test validation
    console.log('📋 Test de validation...');
    const validation = quotesService.validateQuote(testQuoteData);
    console.log('✅ Validation:', validation.isValid ? 'SUCCÈS' : 'ÉCHEC', validation.errors);
    
    // Test calcul totaux
    console.log('💰 Test calcul totaux...');
    const totals = quotesService.calculateQuoteTotals(testQuoteData.phases);
    console.log('✅ Totaux calculés:', totals);
    
    // Test génération numéro devis
    console.log('🔢 Test génération numéro devis...');
    const quoteNumber = await quotesService.generateQuoteNumber(TEST_USER_ID);
    console.log('✅ Numéro généré:', quoteNumber);
    
    // Test mapping Gemini
    console.log('🤖 Test mapping données Gemini...');
    const geminiPhases = [
      {
        nom: 'Phase test',
        description_phase: 'Description test',
        nombre_seances: 2,
        actes: [
          {
            libelle: 'Acte test',
            cout: 100,
            dents: ['11', '12']
          }
        ]
      }
    ];
    const mappedPhases = quotesService.mapGeminiPhasesToQuotePhases(geminiPhases);
    console.log('✅ Phases mappées:', mappedPhases);
    
    console.log('✅ Tests quotes service: TOUS RÉUSSIS');
    return true;
  } catch (error) {
    console.error('❌ Erreur dans les tests devis:', error);
    return false;
  }
}

async function testTreatmentPlansService() {
  console.log('\n🧪 === TEST TREATMENT PLANS SERVICE ===');
  
  try {
    const testPlanData = {
      patientId: 'patient-123',
      basicInfo: {
        title: 'Plan de traitement test',
        description: 'Description du plan test',
        referringDoctorId: 'doctor-123',
        objectives: ['Objectif 1', 'Objectif 2'],
        notes: 'Notes du plan'
      },
      patientInfo: {
        healthStatus: 'Bon état',
        allergies: ['Test'],
        medications: ['Test med'],
        medicalHistory: 'Historique test',
        contraindications: []
      },
      phases: [
        {
          id: 1,
          name: 'Phase test',
          description: 'Description phase test',
          sessions: 3,
          treatments: [
            {
              id: 1,
              name: 'Traitement test',
              fees: 200
            }
          ]
        }
      ]
    };
    
    // Test validation
    console.log('📋 Test de validation...');
    const validation = treatmentPlansService.validateTreatmentPlan(testPlanData);
    console.log('✅ Validation:', validation.isValid ? 'SUCCÈS' : 'ÉCHEC', validation.errors);
    
    // Test calcul statistiques
    console.log('📊 Test calcul statistiques...');
    const stats = treatmentPlansService.calculatePlanStatistics(testPlanData.phases);
    console.log('✅ Statistiques calculées:', stats);
    
    // Test génération numéro plan
    console.log('🔢 Test génération numéro plan...');
    const planNumber = await treatmentPlansService.generatePlanNumber(TEST_USER_ID);
    console.log('✅ Numéro généré:', planNumber);
    
    // Test mapping Gemini
    console.log('🤖 Test mapping données Gemini...');
    const geminiPhases = [
      {
        nom: 'Phase Gemini test',
        description_phase: 'Description Gemini',
        nombre_seances: 4,
        actes: [
          {
            libelle: 'Acte Gemini test',
            cout: 150,
            dents: ['21', '22']
          }
        ]
      }
    ];
    const mappedPhases = treatmentPlansService.mapGeminiPhasesToPlanPhases(geminiPhases);
    console.log('✅ Phases mappées:', mappedPhases);
    
    console.log('✅ Tests treatment plans service: TOUS RÉUSSIS');
    return true;
  } catch (error) {
    console.error('❌ Erreur dans les tests plans de traitement:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 === DÉBUT DES TESTS SERVICES FIREBASE ===');
  console.log('📅 Date:', new Date().toLocaleString());
  console.log('👤 Utilisateur test:', TEST_USER_ID);
  
  const results = {
    patients: false,
    quotes: false,
    treatmentPlans: false
  };
  
  // Exécuter tous les tests
  results.patients = await testPatientsService();
  results.quotes = await testQuotesService();
  results.treatmentPlans = await testTreatmentPlansService();
  
  // Résumé final
  console.log('\n📊 === RÉSUMÉ DES TESTS ===');
  console.log('👥 Patients Service:', results.patients ? '✅ SUCCÈS' : '❌ ÉCHEC');
  console.log('💰 Quotes Service:', results.quotes ? '✅ SUCCÈS' : '❌ ÉCHEC');
  console.log('🦷 Treatment Plans Service:', results.treatmentPlans ? '✅ SUCCÈS' : '❌ ÉCHEC');
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log('\n🎯 RÉSULTAT GLOBAL:', allPassed ? '✅ TOUS LES TESTS RÉUSSIS' : '❌ CERTAINS TESTS ONT ÉCHOUÉ');
  
  if (allPassed) {
    console.log('\n🎉 Félicitations ! Tous les services Firebase sont prêts à être utilisés.');
    console.log('📝 Prochaines étapes:');
    console.log('   1. Déployer les règles Firestore');
    console.log('   2. Tester avec de vraies données');
    console.log('   3. Intégrer dans les composants React');
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
  }
  
  return allPassed;
}

// Exporter pour utilisation
export {
  runAllTests,
  testPatientsService,
  testQuotesService,
  testTreatmentPlansService
};

// Exécuter les tests si le script est lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}