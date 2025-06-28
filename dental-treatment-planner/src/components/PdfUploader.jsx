import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { fileToBase64, validatePdfFile, processPdfOptimized } from '../services/aiService';

const PdfUploader = ({ onDataExtracted, onError, disabled = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null

  const onDrop = useCallback(async (acceptedFiles) => {
    if (disabled || acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file
    const validation = validatePdfFile(file);
    if (!validation.isValid) {
      setUploadStatus('error');
      onError?.(validation.error);
      return;
    }

    setIsProcessing(true);
    setUploadStatus(null);

    try {
      // Convert file to base64
      const base64PDF = await fileToBase64(file);
      
      // Process with optimized Firebase AI service
      const extractedData = await processPdfOptimized(base64PDF);
      
      setUploadStatus('success');
      onDataExtracted?.(extractedData, file.name);
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      setUploadStatus('error');
      onError?.(error.message || 'Erreur lors du traitement du PDF');
    } finally {
      setIsProcessing(false);
    }
  }, [onDataExtracted, onError, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: disabled || isProcessing
  });

  const getStatusIcon = () => {
    if (isProcessing) {
      return <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />;
    }
    if (uploadStatus === 'success') {
      return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
    }
    if (uploadStatus === 'error') {
      return <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />;
    }
    return <DocumentArrowUpIcon className="h-8 w-8 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isProcessing) {
      return 'Analyse du devis en cours...';
    }
    if (uploadStatus === 'success') {
      return 'Devis analysé avec succès !';
    }
    if (uploadStatus === 'error') {
      return 'Erreur lors de l\'analyse';
    }
    if (isDragActive) {
      return 'Déposez le fichier PDF ici...';
    }
    return 'Glissez-déposez un devis PDF ou cliquez pour sélectionner';
  };

  const getStatusColor = () => {
    if (isProcessing) return 'border-blue-300 bg-blue-50';
    if (uploadStatus === 'success') return 'border-green-300 bg-green-50';
    if (uploadStatus === 'error') return 'border-red-300 bg-red-50';
    if (isDragActive) return 'border-indigo-400 bg-indigo-50';
    return 'border-gray-300 bg-gray-50 hover:bg-gray-100';
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors
          ${getStatusColor()}
          ${disabled || isProcessing ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-3">
          {getStatusIcon()}
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">
              {getStatusText()}
            </p>
            
            {!isProcessing && uploadStatus !== 'success' && (
              <p className="text-xs text-gray-500">
                PDF uniquement, maximum 10MB
              </p>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        {isProcessing && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Analyse en cours avec Firebase AI (optimisé)...
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      {!isProcessing && uploadStatus !== 'success' && (
        <div className="mt-4 text-xs text-gray-500">
          <p className="font-medium mb-1">Instructions :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Assurez-vous que le PDF contient un devis dentaire lisible</li>
            <li>Le fichier doit contenir les informations patient et les traitements</li>
            <li>Les montants doivent être clairement visibles</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PdfUploader;