import React, { useState, useEffect, useCallback } from 'react';
import { Link2, X, MousePointer } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

/**
 * Types de dépendances disponibles
 */
const DEPENDENCY_TYPES = [
  { value: 'FD', label: 'Fin → Début', color: '#3B82F6' },
  { value: 'DD', label: 'Début → Début', color: '#10B981' },
  { value: 'FF', label: 'Fin → Fin', color: '#F59E0B' },
  { value: 'DF', label: 'Début → Fin', color: '#EF4444' },
];

/**
 * Composant pour afficher la ligne de prévisualisation
 */
const PreviewLine = ({ fromElement, toPosition, type = 'FD' }) => {
  const [path, setPath] = useState('');
  const color = DEPENDENCY_TYPES.find(t => t.value === type)?.color || '#6B7280';
  
  useEffect(() => {
    if (!fromElement || !toPosition) return;
    
    const timeline = fromElement.closest('.gantt-timeline');
    if (!timeline) return;
    
    const timelineRect = timeline.getBoundingClientRect();
    const fromRect = fromElement.getBoundingClientRect();
    
    // Position de départ (fin de la tâche source)
    const startX = fromRect.right - timelineRect.left;
    const startY = fromRect.top - timelineRect.top + fromRect.height / 2;
    
    // Position de la souris relative au timeline
    const endX = toPosition.x - timelineRect.left;
    const endY = toPosition.y - timelineRect.top;
    
    // Créer un chemin courbe
    const midX = startX + (endX - startX) / 2;
    const newPath = `M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`;
    
    setPath(newPath);
  }, [fromElement, toPosition]);
  
  if (!path) return null;
  
  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 100 }}
    >
      <defs>
        <marker
          id="preview-arrow"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill={color}
          />
        </marker>
      </defs>
      
      <path
        d={path}
        stroke={color}
        strokeWidth="2"
        fill="none"
        opacity="0.8"
        strokeDasharray="5,5"
        markerEnd="url(#preview-arrow)"
        className="animate-pulse"
      />
    </svg>
  );
};

/**
 * Composant principal pour le mode création de dépendances
 */
const DependencyCreationMode = ({
  isActive,
  onCreateDependency,
  onCancel,
  tasks = []
}) => {
  const [sourceTask, setSourceTask] = useState(null);
  const [targetTask, setTargetTask] = useState(null);
  const [selectedType, setSelectedType] = useState('FD');
  const [mousePosition, setMousePosition] = useState(null);
  const [hoveredTaskId, setHoveredTaskId] = useState(null);
  const [sourceElement, setSourceElement] = useState(null);
  
  // Réinitialiser l'état quand le mode est désactivé
  useEffect(() => {
    if (!isActive) {
      setSourceTask(null);
      setTargetTask(null);
      setSourceElement(null);
      setHoveredTaskId(null);
    }
  }, [isActive]);
  
  // Gérer le mouvement de la souris
  useEffect(() => {
    if (!isActive || !sourceTask) return;
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isActive, sourceTask]);
  
  // Gérer les clics sur les tâches
  useEffect(() => {
    if (!isActive) return;
    
    const handleTaskClick = (e) => {
      const taskElement = e.target.closest('[data-task-id]');
      if (!taskElement) return;
      
      const taskId = taskElement.getAttribute('data-task-id');
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) return;
      
      e.stopPropagation();
      e.preventDefault();
      
      if (!sourceTask) {
        // Première sélection : tâche source
        setSourceTask(task);
        setSourceElement(taskElement);
      } else if (task.id !== sourceTask.id) {
        // Deuxième sélection : tâche cible
        setTargetTask(task);
        
        // Créer la dépendance
        onCreateDependency({
          id_tache_precedente: sourceTask.id,
          id_tache_suivante: task.id,
          type: selectedType,
          active: true,
          decalage: { valeur: 0, unite: 'jours' }
        });
        
        // Réinitialiser
        setSourceTask(null);
        setTargetTask(null);
        setSourceElement(null);
      }
    };
    
    // Gérer le survol des tâches
    const handleTaskHover = (e) => {
      const taskElement = e.target.closest('[data-task-id]');
      if (taskElement) {
        const taskId = taskElement.getAttribute('data-task-id');
        setHoveredTaskId(taskId);
      } else {
        setHoveredTaskId(null);
      }
    };
    
    const timeline = document.querySelector('.gantt-timeline');
    if (timeline) {
      timeline.addEventListener('click', handleTaskClick);
      timeline.addEventListener('mouseover', handleTaskHover);
      timeline.addEventListener('mouseout', () => setHoveredTaskId(null));
      
      return () => {
        timeline.removeEventListener('click', handleTaskClick);
        timeline.removeEventListener('mouseover', handleTaskHover);
        timeline.removeEventListener('mouseout', () => setHoveredTaskId(null));
      };
    }
  }, [isActive, sourceTask, selectedType, tasks, onCreateDependency]);
  
  // Ajouter des styles aux tâches en mode création
  useEffect(() => {
    if (!isActive) return;
    
    const taskElements = document.querySelectorAll('[data-task-id]');
    
    taskElements.forEach(element => {
      const taskId = element.getAttribute('data-task-id');
      
      if (sourceTask && taskId === sourceTask.id) {
        element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
      } else if (sourceTask && hoveredTaskId === taskId && taskId !== sourceTask.id) {
        element.classList.add('ring-2', 'ring-green-500', 'ring-offset-2', 'cursor-pointer');
      } else if (!sourceTask && hoveredTaskId === taskId) {
        element.classList.add('ring-2', 'ring-gray-400', 'ring-offset-2', 'cursor-pointer');
      } else {
        element.classList.remove('ring-2', 'ring-blue-500', 'ring-green-500', 'ring-gray-400', 'ring-offset-2');
      }
    });
    
    return () => {
      taskElements.forEach(element => {
        element.classList.remove('ring-2', 'ring-blue-500', 'ring-green-500', 'ring-gray-400', 'ring-offset-2', 'cursor-pointer');
      });
    };
  }, [isActive, sourceTask, hoveredTaskId]);
  
  if (!isActive) return null;
  
  return (
    <>
      {/* Overlay pour capturer les clics */}
      <div 
        className="fixed inset-0 z-40"
        style={{ cursor: sourceTask ? 'crosshair' : 'pointer' }}
        onClick={(e) => {
          // Si on clique en dehors d'une tâche, annuler
          if (!e.target.closest('[data-task-id]')) {
            setSourceTask(null);
            setTargetTask(null);
            setSourceElement(null);
          }
        }}
      />
      
      {/* Ligne de prévisualisation */}
      {sourceTask && sourceElement && mousePosition && (
        <PreviewLine
          fromElement={sourceElement}
          toPosition={mousePosition}
          type={selectedType}
        />
      )}
      
      {/* Panneau de contrôle */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Mode création de dépendances</span>
          </div>
          
          {/* Sélecteur de type */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Type :</span>
            <div className="flex gap-1">
              {DEPENDENCY_TYPES.map(type => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type.value)}
                  className={cn(
                    "px-2 py-1 text-xs",
                    selectedType === type.value && "text-white"
                  )}
                  style={{
                    backgroundColor: selectedType === type.value ? type.color : undefined,
                    borderColor: type.color
                  }}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* État actuel */}
          <div className="flex items-center gap-2">
            {!sourceTask ? (
              <Badge variant="outline" className="gap-1">
                <MousePointer className="h-3 w-3" />
                Cliquez sur la tâche source
              </Badge>
            ) : (
              <Badge variant="default" className="gap-1 bg-blue-600">
                <MousePointer className="h-3 w-3" />
                Cliquez sur la tâche cible
              </Badge>
            )}
          </div>
          
          {/* Bouton annuler */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Instructions */}
        <div className="mt-3 text-xs text-gray-600">
          {!sourceTask ? (
            <p>1. Sélectionnez le type de dépendance ci-dessus</p>
          ) : (
            <p>2. Cliquez sur la tâche qui dépendra de "{sourceTask.nomActe || sourceTask.name}"</p>
          )}
        </div>
      </div>
    </>
  );
};

export default DependencyCreationMode;