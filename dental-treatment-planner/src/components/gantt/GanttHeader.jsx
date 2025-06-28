import React from 'react';
import { Cloud, Check, Calendar, User, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import GanttStatistics, { GanttStatusBadges } from './GanttStatistics';

/**
 * Composant header réutilisable pour les vues Gantt
 */
const GanttHeader = ({
  patient,
  statistics,
  overdueTasks = [],
  showDropbox = false,
  dropboxProps = {},
  showDetailedStats = false,
  className = ""
}) => {
  const {
    dropboxConnected = false,
    loading = false,
    onConnect
  } = dropboxProps;

  if (!patient) {
    return (
      <div className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <span className="text-gray-500">Aucune information patient disponible</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header principal avec informations patient */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <h1 className="text-lg font-semibold text-gray-900">
                {patient.nom}
              </h1>
            </div>
            
            {patient.dateDevis && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  Devis du {format(patient.dateDevis, 'dd/MM/yyyy', { locale: fr })}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Tags du patient */}
            {patient.tags && patient.tags.map((tag, index) => (
              <Badge
                key={index}
                className={`${tag.couleur} text-white`}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag.nom}
              </Badge>
            ))}
            
            {/* Badges de statut */}
            <GanttStatusBadges 
              globalProgress={statistics?.globalProgress || 0}
              overdueTasks={overdueTasks}
              className="ml-4"
            />
          </div>
        </div>

        {/* Statistiques détaillées (optionnel) */}
        {showDetailedStats && (
          <div className="pt-4 border-t border-gray-200">
            <GanttStatistics 
              statistics={statistics}
              showDetailed={true}
              overdueTasks={overdueTasks}
            />
          </div>
        )}
      </div>

      {/* Barre Dropbox (optionnelle) */}
      {showDropbox && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center space-x-3">
                <Cloud className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Dossier photos patient
                </span>
              </div>

              <Button
                onClick={onConnect}
                disabled={loading || dropboxConnected}
                className={`text-sm ${
                  dropboxConnected
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connexion...
                  </>
                ) : dropboxConnected ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Connecté
                  </>
                ) : (
                  'Connecter au dossier'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Composant header simplifié pour les pages avec navigation
 */
export const GanttHeaderWithNavigation = ({
  patient,
  statistics,
  onBack,
  backLabel = "Retour",
  children
}) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {backLabel}
              </button>
            )}
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient?.nom}</h1>
              {patient?.treatmentType && patient?.doctor && (
                <p className="text-sm text-gray-500">
                  {patient.treatmentType} • {patient.doctor}
                </p>
              )}
            </div>
          </div>
          {children}
        </div>
        
        {/* Statistiques */}
        {statistics && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <GanttStatistics 
              statistics={statistics}
              showDetailed={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttHeader;