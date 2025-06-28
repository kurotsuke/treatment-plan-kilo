import React, { useState, useRef } from 'react';
import settingsService from '../services/settingsService';

const LogoUpload = ({ currentLogo, onLogoChange, disabled = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(currentLogo);
  const fileInputRef = useRef(null);

  // 🔧 FIX: Mettre à jour preview quand currentLogo change
  React.useEffect(() => {
    console.log('🔍 [DEBUG] LogoUpload - currentLogo changé:', currentLogo ? 'EXISTE' : 'NULL');
    setPreview(currentLogo);
  }, [currentLogo]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Valider et traiter l'image
      const processedLogo = await settingsService.validateAndProcessLogo(file);
      
      // Mettre à jour la prévisualisation
      setPreview(processedLogo);
      
      // Notifier le parent
      if (onLogoChange) {
        onLogoChange(processedLogo);
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors du traitement du logo:', err);
    } finally {
      setIsProcessing(false);
      // Réinitialiser l'input pour permettre de sélectionner le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setPreview(null);
    setError(null);
    if (onLogoChange) {
      onLogoChange(null);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Logo de la clinique
      </label>
      
      {/* Zone de prévisualisation */}
      <div className="flex items-center space-x-4">
        <div 
          className={`
            relative w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center
            ${preview ? 'border-gray-300' : 'border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500'}
            ${isProcessing ? 'animate-pulse' : ''}
          `}
          onClick={handleClick}
        >
          {preview ? (
            <img
              src={preview}
              alt="Logo de la clinique"
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <div className="text-center">
              <svg
                className="mx-auto h-8 w-8 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-1 text-xs text-gray-500">
                {isProcessing ? 'Traitement...' : 'Cliquer pour ajouter'}
              </p>
            </div>
          )}
          
          {/* Indicateur de traitement */}
          {isProcessing && (
            <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        
        {/* Boutons d'action */}
        <div className="flex flex-col space-y-2">
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled || isProcessing}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {preview ? 'Changer' : 'Ajouter'}
          </button>
          
          {preview && (
            <button
              type="button"
              onClick={handleRemoveLogo}
              disabled={disabled || isProcessing}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
      
      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isProcessing}
      />
      
      {/* Message d'erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Informations sur les contraintes */}
      <div className="text-xs text-gray-500">
        <p>• Formats acceptés : JPG, PNG, GIF, WebP</p>
        <p>• Taille maximale : 5 MB</p>
        <p>• Redimensionnement automatique seulement si {'>'} 1000×1000 pixels</p>
        <p>• Taille finale optimisée : moins de 100 KB</p>
      </div>
    </div>
  );
};

export default LogoUpload;