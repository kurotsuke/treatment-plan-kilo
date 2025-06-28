/**
 * Modal pour afficher le progrès de génération d'un plan de traitement
 */
import React from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const TreatmentPlanGenerationModal = ({
  isOpen,
  onClose,
  isGenerating,
  progress,
  status,
  error,
  onRetry,
  patientName
}) => {
  if (!isOpen) return null;

  const getProgressColor = () => {
    if (error) return 'bg-red-500';
    if (progress === 100) return 'bg-green-500';
    return 'bg-indigo-500';
  };

  const getIcon = () => {
    if (error) {
      return <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />;
    }
    if (progress === 100) {
      return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
    }
    return (
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Génération du plan de traitement
          </h3>
          {!isGenerating && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Patient Info */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Patient: <span className="font-medium text-gray-900">{patientName}</span>
          </p>
        </div>

        {/* Progress Section */}
        <div className="mb-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Progress Text */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {progress}% terminé
            </p>
            <p className="text-sm text-gray-600">
              {status}
            </p>
          </div>
        </div>

        {/* Error Section */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Erreur lors de la génération
                </h4>
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Section */}
        {progress === 100 && !error && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-green-800 mb-1">
                  Plan de traitement créé avec succès !
                </h4>
                <p className="text-sm text-green-700">
                  Le plan de traitement a été généré et sauvegardé. Vous allez être redirigé vers la vue Gantt.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {error && (
            <>
              <button
                onClick={onClose}
                className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={onRetry}
                className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                Réessayer
              </button>
            </>
          )}
          
          {progress === 100 && !error && (
            <button
              onClick={onClose}
              className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Voir le plan de traitement
            </button>
          )}
          
          {isGenerating && (
            <div className="w-full text-center">
              <p className="text-sm text-gray-500">
                Génération en cours... Veuillez patienter.
              </p>
            </div>
          )}
        </div>

        {/* Steps Indicator */}
        {isGenerating && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-700 mb-3">Étapes de génération:</h4>
            <div className="space-y-2">
              {[
                { step: 1, label: 'Récupération du devis', minProgress: 0 },
                { step: 2, label: 'Préparation des données', minProgress: 20 },
                { step: 3, label: 'Génération IA', minProgress: 40 },
                { step: 4, label: 'Validation', minProgress: 60 },
                { step: 5, label: 'Sauvegarde', minProgress: 80 },
                { step: 6, label: 'Finalisation', minProgress: 95 }
              ].map(({ step, label, minProgress }) => (
                <div key={step} className="flex items-center text-xs">
                  <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
                    progress > minProgress 
                      ? 'bg-green-500 text-white' 
                      : progress >= minProgress 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {progress > minProgress ? '✓' : step}
                  </div>
                  <span className={progress >= minProgress ? 'text-gray-900' : 'text-gray-500'}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreatmentPlanGenerationModal;