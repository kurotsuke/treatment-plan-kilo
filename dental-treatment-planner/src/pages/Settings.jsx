import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/kibo-ui/dropzone';
import { CurrencySelect } from '@/components/ui/currency-select';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useDoctors } from '../hooks/useDoctors';
import { reconfigureFirebase, resetFirebaseConfig, getFirebaseInfo } from '../config/firebase';
import firebaseConfigService from '../services/firebaseConfigService';
import AddDoctorModal from '../components/ui/AddDoctorModal';
import LogoUpload from '../components/LogoUpload';
import { configureFirebaseAI, isFirebaseAIConfigured, getFirebaseAIConfig } from '../services/aiService';

const Settings = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('clinic');

  const tabs = [
    { id: 'clinic', name: 'Clinique', icon: '🏥' },
    { id: 'doctors', name: 'Médecins', icon: '👨‍⚕️' },
    { id: 'users', name: 'Utilisateurs', icon: '👥' },
    { id: 'payments', name: 'Paiements', icon: '💳' },
    { id: 'api', name: 'API Gemini', icon: '🔑' },
    { id: 'firebase', name: 'Firebase', icon: '🔥' },
    { id: 'firebaseAI', name: 'Firebase AI', icon: '🤖' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-2">Gérez les paramètres de votre clinique dentaire</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'clinic' && <ClinicTab />}
        {activeTab === 'doctors' && <DoctorsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'api' && <ApiTab />}
        {activeTab === 'firebase' && <FirebaseTab />}
        {activeTab === 'firebaseAI' && <FirebaseAITab />}
      </div>
    </div>
  );
};

// Reusable Input Component
const InputWithLabel = ({ label, id, type = "text", placeholder, helpText, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm/6 font-medium text-gray-900">
        {label}
      </label>
      <div className="mt-2">
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          aria-describedby={helpText ? `${id}-description` : undefined}
          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          {...props}
        />
      </div>
      {helpText && (
        <p id={`${id}-description`} className="mt-2 text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

// Reusable Textarea Component
const TextareaWithLabel = ({ label, id, placeholder, rows = 4, helpText, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm/6 font-medium text-gray-900">
        {label}
      </label>
      <div className="mt-2">
        <textarea
          id={id}
          name={id}
          rows={rows}
          placeholder={placeholder}
          aria-describedby={helpText ? `${id}-description` : undefined}
          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          {...props}
        />
      </div>
      {helpText && (
        <p id={`${id}-description`} className="mt-2 text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

// Reusable Action Panel Component
const ActionPanel = ({ title, description, children }) => {
  return (
    <div className="bg-white shadow-sm sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && (
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>{description}</p>
          </div>
        )}
        <div className="mt-5">
          {children}
        </div>
      </div>
    </div>
  );
};

// Reusable Select Component
const SelectWithLabel = ({ label, id, options, value, onChange, helpText, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm/6 font-medium text-gray-900">
        {label}
      </label>
      <div className="mt-2">
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {helpText && (
        <p id={`${id}-description`} className="mt-2 text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

// Clinic Tab Component
const ClinicTab = () => {
  const { user, isAuthenticated } = useAuth();
  const { settings, saveSettings, syncing, isReady } = useSettings();
  const [currency, setCurrency] = useState('EUR');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicLogo, setClinicLogo] = useState(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Synchroniser avec les réglages Firebase
  React.useEffect(() => {
    if (settings) {
      setClinicName(settings.clinicName || '');
      setClinicAddress(settings.clinicAddress || '');
      setCurrency(settings.clinicCurrency || 'EUR');
      setClinicLogo(settings.clinicLogo || null);
    }
  }, [settings]);

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
  };

  const handleLogoChange = (newLogo) => {
    setClinicLogo(newLogo);
  };

  const handleSave = async () => {
    console.log('🔥 === DÉBUT SAUVEGARDE ===');
    console.log('📝 Données à sauvegarder:', {
      clinicName,
      clinicAddress,
      clinicCurrency: currency,
      clinicLogo: clinicLogo ? `${clinicLogo.substring(0, 50)}...` : null
    });
    console.log('👤 Utilisateur connecté:', !!user);
    console.log('🔐 Authentifié:', isAuthenticated);
    console.log('⚙️ Hook prêt:', isReady);
    
    try {
      console.log('💾 Appel saveSettings...');
      const result = await saveSettings({
        clinicName,
        clinicAddress,
        clinicCurrency: currency,
        clinicLogo
      });
      
      console.log('✅ Sauvegarde réussie:', result);
      
      // Afficher un message de succès
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error) {
      console.error('❌ Erreur de sauvegarde:', error);
      console.error('❌ Stack trace:', error.stack);
      // Vous pouvez ajouter une notification d'erreur ici
    }
    console.log('🔥 === FIN SAUVEGARDE ===');
  };


  return (
    <div className="space-y-6">
      <ActionPanel
        title="Informations de la clinique"
        description="Gérez les informations de base de votre clinique dentaire."
      >
        <div className="space-y-6">
          <InputWithLabel
            label="Nom de la clinique"
            id="clinic-name"
            placeholder="Nom de votre clinique"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            helpText="Ce nom apparaîtra sur tous les documents et communications."
          />
          
          <TextareaWithLabel
            label="Adresse"
            id="clinic-address"
            placeholder="Adresse complète de la clinique"
            rows={3}
            value={clinicAddress}
            onChange={(e) => setClinicAddress(e.target.value)}
            helpText="Incluez l'adresse complète avec le code postal."
          />

          <div>
            <label className="block text-sm/6 font-medium text-gray-900 mb-2">
              Devise
            </label>
            <CurrencySelect
              name="currency"
              value={currency}
              onValueChange={handleCurrencyChange}
              currencies="custom"
              placeholder="Sélectionner une devise"
            />
            <p className="mt-2 text-sm text-gray-500">
              La devise utilisée pour tous les montants dans l'application.
            </p>
          </div>
          
          <LogoUpload
            currentLogo={clinicLogo}
            onLogoChange={handleLogoChange}
            disabled={syncing || !isReady}
          />
          
          <div className="pt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={syncing || !isReady}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Synchronisation...
                </>
              ) : (
                'Sauvegarder les modifications'
              )}
            </button>
            {showSaveSuccess && (
              <span className="text-sm text-green-600 font-medium">
                ✓ Paramètres sauvegardés avec succès
              </span>
            )}
          </div>
        </div>
      </ActionPanel>
    </div>
  );
};

// Doctors Tab Component
const DoctorsTab = () => {
  const { doctors, loading, syncing, addDoctor, deleteDoctor, getTreatmentPhases } = useDoctors();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAddDoctor = async (doctorData) => {
    try {
      setActionLoading(true);
      await addDoctor(doctorData);
      console.log('✅ Médecin ajouté avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout:', error);
      alert(`Erreur: ${error.message}`);
      throw error; // Re-throw pour que la modale gère l'erreur
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    try {
      setActionLoading(true);
      await deleteDoctor(doctorId);
      setShowDeleteConfirm(null);
      console.log('✅ Médecin supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getPhaseNames = (phaseIds) => {
    const phases = getTreatmentPhases();
    return phaseIds
      .map(id => phases.find(p => p.id === id)?.name || `Phase ${id}`)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      <ActionPanel
        title="Gestion des médecins"
        description="Ajoutez et gérez les médecins de votre clinique."
      >
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Ajouter un médecin
        </button>
      </ActionPanel>

      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Liste des médecins
            {doctors.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({doctors.length} médecin{doctors.length > 1 ? 's' : ''})
              </span>
            )}
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-500">Chargement des médecins...</span>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun médecin</h3>
              <p className="mt-1 text-sm text-gray-500">Commencez par ajouter votre premier médecin.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Ajouter un médecin
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    {/* Avatar avec photo ou initiales */}
                    <div className="flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        {doctor.profileImage ? (
                          <AvatarImage
                            src={doctor.profileImage}
                            alt={`Dr. ${doctor.name}`}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                          {doctor.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-900">
                        Dr. {doctor.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getPhaseNames(doctor.treatmentPhases)}
                      </p>
                      {doctor.createdAt && (
                        <p className="text-xs text-gray-400">
                          Ajouté le {doctor.createdAt.toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                      onClick={() => {
                        // TODO: Implémenter la modification
                        alert('Fonctionnalité de modification à venir');
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                      onClick={() => setShowDeleteConfirm(doctor.id)}
                      disabled={actionLoading}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modale d'ajout */}
      <AddDoctorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddDoctor}
        loading={actionLoading}
      />

      {/* Confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(null)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirmer la suppression
              </h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer ce médecin ? Cette action est irréversible.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDeleteDoctor(showDeleteConfirm)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Users Tab Component
const UsersTab = () => {
  return (
    <div className="space-y-6">
      <ActionPanel 
        title="Gestion des utilisateurs"
        description="Invitez de nouveaux utilisateurs et gérez les permissions."
      >
        <button
          type="button"
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          Inviter un utilisateur
        </button>
      </ActionPanel>

      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-900">Utilisateurs actuels</h3>
          <div className="mt-2 text-sm text-gray-500">
            <p>La gestion des utilisateurs sera disponible prochainement.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Payments Tab Component
const PaymentsTab = () => {
  const paymentOptions = [
    { id: 1, name: 'Paiement comptant', description: 'Paiement intégral à la signature' },
    { id: 2, name: 'Paiement en 3 fois', description: 'Répartition sur 3 mensualités' },
    { id: 3, name: 'Paiement en 6 fois', description: 'Répartition sur 6 mensualités' },
  ];

  return (
    <div className="space-y-6">
      <ActionPanel 
        title="Options de paiement"
        description="Configurez les options de paiement disponibles pour vos patients."
      >
        <button
          type="button"
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          Ajouter une option
        </button>
      </ActionPanel>

      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Options configurées</h3>
          <div className="space-y-3">
            {paymentOptions.map((option) => (
              <div key={option.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                <div>
                  <p className="font-medium text-gray-900">{option.name}</p>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    Modifier
                  </button>
                  <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// API Tab Component
const ApiTab = () => {
  const { user, isAuthenticated } = useAuth();
  const { settings, saveSettings, syncing, isReady } = useSettings();
  const [apiKey, setApiKey] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  // Synchroniser avec les réglages Firebase
  React.useEffect(() => {
    if (settings) {
      // S'assurer que c'est bien une string
      const geminiKey = settings.geminiApiKey;
      if (typeof geminiKey === 'string') {
        setApiKey(geminiKey);
      } else {
        setApiKey('');
      }
      setLastCheck(settings.lastApiCheck || null);
    }
  }, [settings]);

  const handleSaveApiKey = async () => {
    // S'assurer que apiKey est une string
    const keyValue = typeof apiKey === 'string' ? apiKey.trim() : '';
    
    if (!keyValue) {
      alert('Veuillez entrer une clé API valide');
      return;
    }

    try {
      console.log('🔑 Sauvegarde de la clé API Gemini...');
      console.log('🔑 Valeur à sauvegarder:', keyValue.substring(0, 10) + '...');
      
      await saveSettings({
        geminiApiKey: keyValue
      });
      
      // Afficher un message de succès
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      
      // Réinitialiser le statut de connexion
      setConnectionStatus(null);
      
      console.log('✅ Clé API sauvegardée dans Firebase');
    } catch (error) {
      console.error('❌ Erreur de sauvegarde de la clé API:', error);
      alert('Erreur lors de la sauvegarde de la clé API');
    }
  };

  const testConnection = async () => {
    // S'assurer que apiKey est une string
    const keyValue = typeof apiKey === 'string' ? apiKey.trim() : '';
    
    if (!keyValue) {
      alert('Veuillez d\'abord sauvegarder une clé API');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      console.log('🧪 Test de connexion API Gemini...');
      console.log('🔑 Test avec clé:', keyValue.substring(0, 10) + '...');
      
      // Import dynamique pour éviter les erreurs de build
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      // Tester la connexion avec la clé API
      const genAI = new GoogleGenerativeAI(keyValue);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Test simple avec un prompt minimal
      const result = await model.generateContent("Test de connexion");
      const response = await result.response;
      
      if (response.text()) {
        setConnectionStatus('success');
        const now = new Date().toLocaleString('fr-FR');
        setLastCheck(now);
        
        // Sauvegarder le statut dans Firebase
        try {
          await saveSettings({
            lastApiCheck: now,
            geminiConnectionStatus: 'success'
          });
          console.log('✅ Statut de connexion sauvegardé dans Firebase');
        } catch (error) {
          console.warn('⚠️ Erreur sauvegarde statut:', error);
        }
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('❌ Erreur de test de connexion:', error);
      setConnectionStatus('error');
      
      // Sauvegarder l'erreur dans Firebase
      try {
        await saveSettings({
          geminiConnectionStatus: 'error'
        });
      } catch (saveError) {
        console.warn('⚠️ Erreur sauvegarde statut d\'erreur:', saveError);
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Vérifier le statut au chargement depuis Firebase
  React.useEffect(() => {
    if (settings && apiKey && !connectionStatus) {
      const savedStatus = settings.geminiConnectionStatus;
      if (savedStatus) {
        setConnectionStatus(savedStatus);
      }
    }
  }, [settings, apiKey, connectionStatus]);

  return (
    <div className="space-y-6">
      <ActionPanel
        title="Configuration API"
        description="Configurez les clés API nécessaires pour le traitement automatique des devis."
      >
        <div className="space-y-6">
          <InputWithLabel
            label="Clé API Gemini"
            id="gemini-api-key"
            type="password"
            placeholder="Entrez votre clé API Gemini"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            helpText="Cette clé sera utilisée pour traiter les devis PDF et générer les plans de traitement. Votre clé est stockée de manière sécurisée dans votre navigateur."
          />
          
          <div className="pt-4 flex items-center gap-4">
           <button
             type="button"
             onClick={handleSaveApiKey}
             disabled={syncing || !isReady}
             className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {syncing ? (
               <>
                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Synchronisation...
               </>
             ) : (
               'Sauvegarder la clé API'
             )}
           </button>
           {showSaveSuccess && (
             <span className="text-sm text-green-600 font-medium">
               ✓ Clé API sauvegardée avec succès
             </span>
           )}
         </div>
        </div>
      </ActionPanel>

      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-900">État de la connexion</h3>
          <div className="mt-2 text-sm text-gray-500">
            {connectionStatus === 'success' && (
              <>
                <p>🟢 API Gemini connectée et fonctionnelle</p>
                {lastCheck && <p className="mt-1">Dernière vérification: {lastCheck}</p>}
              </>
            )}
            {connectionStatus === 'error' && (
              <p>🔴 Erreur de connexion à l'API Gemini</p>
            )}
            {!connectionStatus && apiKey && (
              <p>🟡 Clé API configurée - Testez la connexion</p>
            )}
            {!apiKey && (
              <p>⚪ Aucune clé API configurée</p>
            )}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={testConnection}
              disabled={!apiKey || isTestingConnection}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingConnection ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Test en cours...
                </>
              ) : (
                'Tester la connexion'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Firebase Tab Component
const FirebaseTab = () => {
  const { user, isAuthenticated, connectionStatus, retryConnection, clearError } = useAuth();
  const { settings, loading, syncing, migrateFromLocalStorage, forceSync, summary, syncStatus } = useSettings();
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [configFormData, setConfigFormData] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  const [configStatus, setConfigStatus] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Vérifier si Firebase est déjà configuré
  React.useEffect(() => {
    const firebaseInfo = getFirebaseInfo();
    if (firebaseInfo.isConfigured && firebaseInfo.configSource === 'localStorage') {
      setShowConfigForm(false);
    } else if (!firebaseInfo.isConfigured) {
      setShowConfigForm(true);
    }
  }, [isAuthenticated]);

  const handleConfigFormChange = (field, value) => {
    setConfigFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfigSubmit = async () => {
    try {
      setTestingConnection(true);
      setConfigStatus('testing');

      // Valider la configuration
      if (!firebaseConfigService.validateConfig(configFormData)) {
        throw new Error('Configuration Firebase incomplète');
      }

      // Tester la connexion
      const testResult = await firebaseConfigService.testConnection(configFormData);
      if (!testResult.success) {
        throw new Error(testResult.error || 'Test de connexion échoué');
      }

      // Reconfigurer Firebase
      await reconfigureFirebase(configFormData);

      setConfigStatus('success');
      setShowConfigForm(false);
      
      // Réinitialiser le formulaire
      setConfigFormData({
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: ''
      });

      setTimeout(() => setConfigStatus(null), 3000);
    } catch (error) {
      console.error('Erreur de configuration Firebase:', error);
      setConfigStatus('error');
      setTimeout(() => setConfigStatus(null), 5000);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleResetConfig = async () => {
    try {
      await resetFirebaseConfig();
      setShowConfigForm(true);
      setConfigStatus('reset');
      setTimeout(() => setConfigStatus(null), 3000);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
    }
  };

  const handlePrefillConfig = () => {
    setConfigFormData({
      apiKey: 'AIzaSyC7Mb4EE334DlkcN1Szi_1-Snc2EMfgXxI',
      authDomain: 'dentalplan-ai.firebaseapp.com',
      projectId: 'dentalplan-ai',
      storageBucket: 'dentalplan-ai.firebasestorage.app',
      messagingSenderId: '138043766893',
      appId: '1:138043766893:web:96b14212e81ca49e75e764'
    });
  };

  const handleMigration = async () => {
    try {
      setMigrationStatus('migrating');
      await migrateFromLocalStorage();
      setMigrationStatus('success');
      setTimeout(() => setMigrationStatus(null), 3000);
    } catch (error) {
      console.error('Erreur de migration:', error);
      setMigrationStatus('error');
      setTimeout(() => setMigrationStatus(null), 3000);
    }
  };

  const handleForceSync = async () => {
    try {
      await forceSync();
    } catch (error) {
      console.error('Erreur de synchronisation forcée:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulaire de Configuration Firebase */}
      {showConfigForm && (
        <ActionPanel
          title="Configuration Firebase"
          description="Configurez vos clés Firebase pour activer la synchronisation."
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-blue-900">Instructions</h4>
                <button
                  type="button"
                  onClick={handlePrefillConfig}
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                >
                  Pré-remplir
                </button>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Créez un projet sur <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
                <li>Activez Firestore Database et Authentication (anonyme)</li>
                <li>Copiez les clés de configuration ci-dessous</li>
                <li>Ou cliquez sur "Pré-remplir" pour utiliser la configuration par défaut</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputWithLabel
                label="API Key"
                id="firebase-api-key"
                type="password"
                placeholder="Votre clé API Firebase"
                value={configFormData.apiKey}
                onChange={(e) => handleConfigFormChange('apiKey', e.target.value)}
                helpText="Clé API de votre projet Firebase"
              />
              
              <InputWithLabel
                label="Auth Domain"
                id="firebase-auth-domain"
                placeholder="votre-projet.firebaseapp.com"
                value={configFormData.authDomain}
                onChange={(e) => handleConfigFormChange('authDomain', e.target.value)}
                helpText="Domaine d'authentification"
              />
              
              <InputWithLabel
                label="Project ID"
                id="firebase-project-id"
                placeholder="votre-projet-id"
                value={configFormData.projectId}
                onChange={(e) => handleConfigFormChange('projectId', e.target.value)}
                helpText="ID de votre projet Firebase"
              />
              
              <InputWithLabel
                label="Storage Bucket"
                id="firebase-storage-bucket"
                placeholder="votre-projet.appspot.com"
                value={configFormData.storageBucket}
                onChange={(e) => handleConfigFormChange('storageBucket', e.target.value)}
                helpText="Bucket de stockage"
              />
              
              <InputWithLabel
                label="Messaging Sender ID"
                id="firebase-messaging-sender-id"
                placeholder="123456789"
                value={configFormData.messagingSenderId}
                onChange={(e) => handleConfigFormChange('messagingSenderId', e.target.value)}
                helpText="ID de l'expéditeur de messages"
              />
              
              <InputWithLabel
                label="App ID"
                id="firebase-app-id"
                placeholder="1:123456789:web:abc123"
                value={configFormData.appId}
                onChange={(e) => handleConfigFormChange('appId', e.target.value)}
                helpText="ID de l'application"
              />
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <button
                type="button"
                onClick={handleConfigSubmit}
                disabled={testingConnection || !Object.values(configFormData).every(v => v.trim())}
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingConnection ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Test en cours...
                  </>
                ) : (
                  'Configurer Firebase'
                )}
              </button>

              {configStatus === 'success' && (
                <div className="flex items-center space-x-2 text-sm text-green-600 font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Configuration réussie !</span>
                </div>
              )}

              {configStatus === 'error' && (
                <div className="flex items-center space-x-2 text-sm text-red-600 font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>Erreur de configuration</span>
                </div>
              )}
            </div>
          </div>
        </ActionPanel>
      )}

      {/* Statut de Connexion Firebase */}
      <ActionPanel
        title="Statut Firebase"
        description="État de la connexion et de la synchronisation Firebase."
      >
        <div className="space-y-4">
          {/* Statut de connexion */}
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              isAuthenticated ? 'bg-green-500' :
              connectionStatus.loading ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium">
              {connectionStatus.loading ? 'Connexion en cours...' :
               isAuthenticated ? 'Connecté à Firebase' : 'Déconnecté'}
            </span>
            {connectionStatus.error && connectionStatus.canRetry && (
              <button
                onClick={retryConnection}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline"
              >
                Réessayer
              </button>
            )}
          </div>
          
          {/* ID Utilisateur */}
          {user && (
            <div className="text-sm text-gray-500">
              <span className="font-medium">ID Utilisateur:</span> {user.uid.substring(0, 8)}...
              {user.isAnonymous && <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">Anonyme</span>}
            </div>
          )}
          
          {/* Statut de synchronisation */}
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              syncing ? 'bg-yellow-500' :
              syncStatus.hasError ? 'bg-red-500' : 'bg-green-500'
            }`}></div>
            <span className="text-sm font-medium">
              {syncing ? 'Synchronisation en cours...' :
               syncStatus.hasError ? 'Erreur de synchronisation' : 'Synchronisé'}
            </span>
            {syncStatus.lastSync && (
              <span className="text-xs text-gray-400">
                {syncStatus.lastSync.toLocaleTimeString('fr-FR')}
              </span>
            )}
          </div>

          {/* Bouton de synchronisation forcée */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleForceSync}
              disabled={!isAuthenticated || syncing}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? 'Synchronisation...' : 'Forcer la synchronisation'}
            </button>
          </div>
        </div>
      </ActionPanel>

      {/* Migration des Données */}
      <ActionPanel
        title="Migration des Données"
        description="Migrez vos réglages existants depuis localStorage vers Firebase."
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Cette action copiera vos réglages actuels stockés localement vers Firebase pour la synchronisation entre appareils.</p>
          </div>
          
          <button
            type="button"
            onClick={handleMigration}
            disabled={!isAuthenticated || syncing || migrationStatus === 'migrating'}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {migrationStatus === 'migrating' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Migration en cours...
              </>
            ) : (
              'Migrer depuis localStorage'
            )}
          </button>
          
          {/* Messages de statut de migration */}
          {migrationStatus === 'success' && (
            <div className="flex items-center space-x-2 text-sm text-green-600 font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Migration réussie</span>
            </div>
          )}
          
          {migrationStatus === 'error' && (
            <div className="flex items-center space-x-2 text-sm text-red-600 font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>Erreur de migration</span>
            </div>
          )}
        </div>
      </ActionPanel>

      {/* Informations de Synchronisation */}
      <ActionPanel
        title="Informations de Synchronisation"
        description="Détails sur la synchronisation des données."
      >
        <div className="space-y-3 text-sm text-gray-600">
          {settings && summary ? (
            <>
              <div className="flex justify-between">
                <span>Réglages configurés:</span>
                <span className="font-medium">{summary.count}/{summary.total} éléments</span>
              </div>
              
              {settings.updatedAt && (
                <div className="flex justify-between">
                  <span>Dernière mise à jour:</span>
                  <span className="font-medium">{settings.updatedAt.toLocaleString('fr-FR')}</span>
                </div>
              )}
              
              {settings.migratedFromLocalStorage && (
                <div className="flex justify-between">
                  <span>Migré depuis localStorage:</span>
                  <span className="font-medium text-green-600">Oui</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Synchronisation temps réel:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Chargement des informations...</span>
                </div>
              ) : (
                <span>Aucune donnée disponible</span>
              )}
            </div>
          )}
        </div>
      </ActionPanel>

      {/* Aide et Documentation */}
      <ActionPanel
        title="Configuration Firebase"
        description="Informations pour configurer Firebase dans votre projet."
      >
        <div className="space-y-3 text-sm text-gray-600">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-medium text-blue-900 mb-2">Configuration requise</h4>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Créer un projet Firebase sur <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">console.firebase.google.com</a></li>
              <li>Activer Firestore Database</li>
              <li>Activer Authentication (méthode anonyme)</li>
              <li>Copier les clés de configuration dans le fichier .env</li>
            </ol>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h4 className="font-medium text-yellow-900 mb-2">Variables d'environnement</h4>
            <p className="text-yellow-800">
              Copiez le fichier <code className="bg-yellow-100 px-1 rounded">.env.example</code> vers <code className="bg-yellow-100 px-1 rounded">.env</code> et remplissez vos clés Firebase.
            </p>
          </div>
        </div>
      </ActionPanel>
    </div>
  );
};

// Firebase AI Tab Component
const FirebaseAITab = () => {
  const { user, isAuthenticated } = useAuth();
  const { settings, saveSettings, syncing, isReady } = useSettings();
  const [firebaseAIKey, setFirebaseAIKey] = useState('');
  const [firebaseAILocation, setFirebaseAILocation] = useState('us-central1');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  // Charger la configuration existante
  React.useEffect(() => {
    const config = getFirebaseAIConfig();
    setFirebaseAIKey(config.apiKey);
    setFirebaseAILocation(config.location);
    
    // Vérifier si déjà configuré
    if (isFirebaseAIConfigured()) {
      setConnectionStatus('configured');
    }
  }, []);

  const handleSaveConfig = async () => {
    if (!firebaseAIKey.trim()) {
      alert('Veuillez entrer une clé API Firebase AI valide');
      return;
    }

    try {
      // Configurer Firebase AI
      configureFirebaseAI({
        apiKey: firebaseAIKey.trim(),
        location: firebaseAILocation
      });

      // Sauvegarder dans les settings Firebase
      await saveSettings({
        firebaseAIApiKey: firebaseAIKey.trim(),
        firebaseAILocation: firebaseAILocation,
        firebaseAIConfiguredAt: new Date().toISOString()
      });

      setShowSaveSuccess(true);
      setConnectionStatus('configured');
      setTimeout(() => setShowSaveSuccess(false), 3000);

      console.log('✅ Configuration Firebase AI sauvegardée');
    } catch (error) {
      console.error('❌ Erreur de sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la configuration');
    }
  };

  const testConnection = async () => {
    if (!firebaseAIKey.trim()) {
      alert('Veuillez d\'abord configurer une clé API');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      // Import dynamique pour éviter les erreurs
      const { processPdfOptimized } = await import('../services/aiService');
      
      // Test avec un petit prompt
      console.log('🧪 Test de connexion Firebase AI...');
      
      // Pour le test, on utilise une image base64 vide
      await processPdfOptimized('', 'fr');
      
      setConnectionStatus('success');
    } catch (error) {
      console.error('❌ Erreur de test:', error);
      setConnectionStatus('error');
      
      // Si l'erreur est liée à la configuration
      if (error.message.includes('Configuration Firebase AI manquante')) {
        alert('Configuration manquante. Veuillez sauvegarder la configuration d\'abord.');
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  const locationOptions = [
    { value: 'us-central1', label: 'US Central (us-central1)' },
    { value: 'us-east1', label: 'US East (us-east1)' },
    { value: 'us-west1', label: 'US West (us-west1)' },
    { value: 'europe-west1', label: 'Europe West (europe-west1)' },
    { value: 'europe-west3', label: 'Europe West 3 (europe-west3)' },
    { value: 'asia-northeast1', label: 'Asia Northeast (asia-northeast1)' }
  ];

  return (
    <div className="space-y-6">
      <ActionPanel
        title="Configuration Firebase AI"
        description="Configurez Firebase AI avec Vertex AI pour le traitement avancé des documents avec structured output."
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-blue-900">Prérequis</h4>
              <button
                type="button"
                onClick={() => setShowConfigHelp(!showConfigHelp)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showConfigHelp ? 'Masquer' : 'Aide'}
              </button>
            </div>
            
            {showConfigHelp && (
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 mt-3">
                <li>
                  <strong>Activer Vertex AI dans votre projet Firebase:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>Allez dans <a href="https://console.cloud.google.com/vertex-ai" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console → Vertex AI</a></li>
                    <li>Activez l'API Vertex AI</li>
                    <li>Activez l'API Generative Language</li>
                  </ul>
                </li>
                <li>
                  <strong>Créer une clé API:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>Dans <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">APIs & Services → Credentials</a></li>
                    <li>Créez une nouvelle clé API</li>
                    <li>Restreignez-la à l'API Generative Language</li>
                  </ul>
                </li>
                <li>
                  <strong>Configurer la facturation:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li>Vertex AI nécessite un compte de facturation actif</li>
                    <li>Les premiers 1000 caractères/mois sont gratuits</li>
                  </ul>
                </li>
              </ol>
            )}
            
            {!showConfigHelp && (
              <p className="text-sm text-blue-800">
                Firebase AI avec Vertex AI permet d'utiliser des modèles Gemini avancés avec structured output pour une extraction précise des données.
              </p>
            )}
          </div>

          <InputWithLabel
            label="Clé API Firebase AI (Vertex AI)"
            id="firebase-ai-key"
            type="password"
            placeholder="Entrez votre clé API Vertex AI"
            value={firebaseAIKey}
            onChange={(e) => setFirebaseAIKey(e.target.value)}
            helpText="Cette clé sera utilisée pour accéder aux services Vertex AI via Firebase. Elle est stockée de manière sécurisée."
          />

          <SelectWithLabel
            label="Région (Location)"
            id="firebase-ai-location"
            options={locationOptions}
            value={firebaseAILocation}
            onChange={(e) => setFirebaseAILocation(e.target.value)}
            helpText="Choisissez la région la plus proche pour de meilleures performances."
          />

          <div className="pt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={syncing || !isReady || !firebaseAIKey.trim()}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Synchronisation...
                </>
              ) : (
                'Sauvegarder la configuration'
              )}
            </button>
            {showSaveSuccess && (
              <span className="text-sm text-green-600 font-medium">
                ✓ Configuration sauvegardée avec succès
              </span>
            )}
          </div>
        </div>
      </ActionPanel>

      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-900">État de la connexion</h3>
          <div className="mt-2 text-sm text-gray-500">
            {connectionStatus === 'configured' && (
              <p>🟢 Firebase AI configuré - Prêt à être testé</p>
            )}
            {connectionStatus === 'success' && (
              <p>🟢 Firebase AI connecté et fonctionnel avec structured output</p>
            )}
            {connectionStatus === 'error' && (
              <p>🔴 Erreur de connexion à Firebase AI - Vérifiez votre configuration</p>
            )}
            {!connectionStatus && !isFirebaseAIConfigured() && (
              <p>⚪ Firebase AI non configuré</p>
            )}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={testConnection}
              disabled={!firebaseAIKey || isTestingConnection}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingConnection ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Test en cours...
                </>
              ) : (
                'Tester la connexion'
              )}
            </button>
          </div>
        </div>
      </div>

      <ActionPanel
        title="Avantages de Firebase AI"
        description="Pourquoi utiliser Firebase AI avec Vertex AI pour votre application dentaire"
      >
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <span className="text-green-500 mt-0.5">✓</span>
            <div>
              <strong>Structured Output:</strong> Extraction précise des données avec schémas JSON garantis
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-green-500 mt-0.5">✓</span>
            <div>
              <strong>Modèles Gemini 2.0:</strong> Dernière génération de modèles avec support PDF natif
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-green-500 mt-0.5">✓</span>
            <div>
              <strong>Intégration Firebase:</strong> Authentification et sécurité intégrées
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-green-500 mt-0.5">✓</span>
            <div>
              <strong>Évolutivité:</strong> Infrastructure Google Cloud pour gérer la charge
            </div>
          </div>
        </div>
      </ActionPanel>
    </div>
  );
};

export default Settings;