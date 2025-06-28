import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/kibo-ui/dropzone';
import { fileToBase64, validatePdfFile, processPdfOptimized, isFirebaseAIConfigured } from '../services/aiService';
import { StreamingAIService } from '../services/streamingAIService';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [quoteFiles, setQuoteFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);

  const handleQuoteDrop = (acceptedFiles) => {
    setQuoteFiles(acceptedFiles);
    setProcessingError(null);
    console.log('Files uploaded:', acceptedFiles);
  };

  const handleQuoteError = (error) => {
    console.error('Upload error:', error);
    setProcessingError('Erreur lors du téléchargement du fichier');
  };

  const handleGenerateTreatmentPlan = async () => {
    if (quoteFiles.length === 0) return;

    // Vérifier si l'API Firebase AI est configurée
    if (!isFirebaseAIConfigured()) {
      setProcessingError('Firebase AI non configuré. Veuillez le configurer dans les paramètres.');
      return;
    }

    const file = quoteFiles[0];
    
    // Validate file
    const validation = validatePdfFile(file);
    if (!validation.isValid) {
      setProcessingError(validation.error);
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);

    try {
      // Convert file to base64
      const base64PDF = await fileToBase64(file);
      
      // Générer un ID patient temporaire immédiatement
      const timestamp = Date.now();
      const tempPatientId = `pdf-processing-${timestamp}`;
      
      // Créer le service de streaming AVANT la navigation
      console.log('📋 [Dashboard] Création du service de streaming...');
      const streamingService = new StreamingAIService();
      
      // Stocker le service dans window AVANT la navigation
      window.streamingService = streamingService;
      console.log('✅ [Dashboard] Service stocké dans window.streamingService');
      
      // Démarrer le streaming AVANT la navigation
      console.log('🔄 [Dashboard] Démarrage du streaming...');
      const streamingPromise = streamingService.startStreaming(base64PDF);
      console.log('✅ [Dashboard] Streaming démarré, navigation vers QuoteEditor...');
      
      // Navigation avec état de streaming
      console.log('🚀 [Dashboard] Navigation vers /quote-editor/new');
      navigate(`/quote-editor/new`, {
        state: {
          isStreaming: true,
          isFromPdf: true,
          fileName: file.name,
          createdAt: new Date().toISOString()
        }
      });
      
      // Gérer les erreurs du streaming en arrière-plan
      streamingPromise.catch(error => {
        console.error('❌ [Dashboard] Erreur de streaming:', error);
        // Le QuoteEditor gérera les erreurs via les événements
      });
      
    } catch (error) {
      console.error('Error starting PDF processing:', error);
      setProcessingError(error.message || 'Erreur lors du démarrage de l\'analyse');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('appTitle')}</h1>
        <p className="text-gray-600 mt-2 text-lg">{t('uploadQuote')}</p>
      </div>

      {/* Quote Upload Section */}
      <div className="max-w-2xl">
        <div className="bg-white shadow-sm sm:rounded-lg">
          <div className="px-6 py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Télécharger un devis
            </h2>
            <p className="text-gray-600 mb-6">
              Téléchargez votre devis dentaire au format PDF ou image pour générer automatiquement un plan de traitement personnalisé.
            </p>
            
            <Dropzone
              src={quoteFiles}
              onDrop={handleQuoteDrop}
              onError={handleQuoteError}
              accept={{
                'application/pdf': ['.pdf'],
                'image/*': ['.jpg', '.jpeg', '.png']
              }}
              maxSize={50 * 1024 * 1024} // 50MB
              maxFiles={1}
              className="min-h-[200px]"
            >
              <DropzoneEmptyState>
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="flex size-12 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload" aria-hidden="true"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Télécharger votre devis
                  </p>
                  <p className="text-gray-500 text-center mb-4">
                    Glisser-déposer votre fichier ici ou cliquer pour parcourir
                  </p>
                  <p className="text-sm text-gray-400 text-center">
                    Formats acceptés: PDF, JPG, PNG (jusqu'à 50MB)
                  </p>
                </div>
              </DropzoneEmptyState>
              
              <DropzoneContent>
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="flex size-12 items-center justify-center rounded-md bg-green-50 text-green-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload" aria-hidden="true"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {quoteFiles.length > 0 ? quoteFiles[0].name : 'Fichier téléchargé'}
                  </p>
                  <p className="text-gray-500 text-center">
                    Glisser-déposer un nouveau fichier ou cliquer pour remplacer
                  </p>
                </div>
              </DropzoneContent>
            </Dropzone>
            
            {/* Error Message */}
            {processingError && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Erreur d'analyse
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{processingError}</p>
                      {processingError.includes('Firebase AI non configuré') && (
                        <p className="mt-2">
                          <button
                            onClick={() => navigate('/settings')}
                            className="text-red-800 underline hover:text-red-900"
                          >
                            Configurer Firebase AI dans les paramètres
                          </button>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Treatment Plan Button - appears when file is uploaded */}
            {quoteFiles.length > 0 && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={handleGenerateTreatmentPlan}
                  disabled={isProcessing}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                      </svg>
                      Générer le plan de traitement
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions Section */}
      <div className="max-w-2xl">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Comment ça marche ?
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Téléchargez votre devis dentaire (PDF ou image)</li>
            <li>Notre IA analyse automatiquement le document</li>
            <li>Un plan de traitement en 3 phases est généré</li>
            <li>Consultez le calendrier de traitement proposé</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;