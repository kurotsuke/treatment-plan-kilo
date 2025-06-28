import React, { useState } from 'react';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/kibo-ui/dropzone';

const AddDoctorModal = ({ isOpen, onClose, onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    treatmentPhases: [],
    profileImage: null
  });
  const [profileFiles, setProfileFiles] = useState([]);
  const [errors, setErrors] = useState({});

  // Phases de traitement disponibles
  const treatmentPhases = [
    { id: 1, name: 'Phase 1 - Préparation', description: 'Examens et préparation' },
    { id: 2, name: 'Phase 2 - Traitement', description: 'Traitement principal' },
    { id: 3, name: 'Phase 3 - Finalisation', description: 'Finition et suivi' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handlePhaseToggle = (phaseId) => {
    setFormData(prev => ({
      ...prev,
      treatmentPhases: prev.treatmentPhases.includes(phaseId)
        ? prev.treatmentPhases.filter(id => id !== phaseId)
        : [...prev.treatmentPhases, phaseId]
    }));
    
    // Effacer l'erreur pour les phases
    if (errors.treatmentPhases) {
      setErrors(prev => ({
        ...prev,
        treatmentPhases: null
      }));
    }
  };

  const handleProfileDrop = (acceptedFiles) => {
    setProfileFiles(acceptedFiles);
    if (acceptedFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        profileImage: acceptedFiles[0]
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }
    
    if (formData.treatmentPhases.length === 0) {
      newErrors.treatmentPhases = 'Au moins une phase de traitement doit être sélectionnée';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSubmit(formData);
      handleReset();
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du médecin:', error);
      // L'erreur sera gérée par le composant parent
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      treatmentPhases: [],
      profileImage: null
    });
    setProfileFiles([]);
    setErrors({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Ajouter un médecin
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Photo de profil */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Photo de profil
              </label>
              <Dropzone
                src={profileFiles}
                onDrop={handleProfileDrop}
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif']
                }}
                maxSize={5 * 1024 * 1024} // 5MB
                maxFiles={1}
                className="min-h-[120px]"
              >
                <DropzoneEmptyState>
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex size-8 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                      <svg className="h-4 w-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="my-2 text-sm font-medium text-gray-900">
                      Ajouter une photo
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF jusqu'à 5MB
                    </p>
                  </div>
                </DropzoneEmptyState>
                <DropzoneContent>
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex size-8 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                      <svg className="h-4 w-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="my-2 text-sm font-medium text-gray-900">
                      {profileFiles.length > 0 ? profileFiles[0].name : 'Photo ajoutée'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Cliquer pour remplacer
                    </p>
                  </div>
                </DropzoneContent>
              </Dropzone>
            </div>

            {/* Nom */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                Nom du médecin *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ${
                  errors.name ? 'ring-red-300' : 'ring-gray-300'
                } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                placeholder="Dr. Martin Dupont"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Phases de traitement */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Phases de traitement assignées *
              </label>
              <div className="space-y-3">
                {treatmentPhases.map((phase) => (
                  <div key={phase.id} className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={`phase-${phase.id}`}
                        type="checkbox"
                        checked={formData.treatmentPhases.includes(phase.id)}
                        onChange={() => handlePhaseToggle(phase.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={`phase-${phase.id}`} className="font-medium text-gray-900">
                        {phase.name}
                      </label>
                      <p className="text-gray-500">{phase.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {errors.treatmentPhases && (
                <p className="mt-2 text-sm text-red-600">{errors.treatmentPhases}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Ajout...
                  </>
                ) : (
                  'Ajouter le médecin'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDoctorModal;