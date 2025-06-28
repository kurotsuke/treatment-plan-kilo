import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { cn } from '../../lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Trash2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';

/**
 * Obtient la couleur selon le type de dépendance
 */
const getDependencyColor = (type) => {
  const colors = {
    'fin-debut': '#3B82F6',    // Bleu
    'FD': '#3B82F6',
    'debut-debut': '#10B981',   // Vert
    'DD': '#10B981',
    'fin-fin': '#F59E0B',       // Orange
    'FF': '#F59E0B',
    'debut-fin': '#EF4444',     // Rouge
    'DF': '#EF4444'
  };
  
  return colors[type] || '#6B7280'; // Gris par défaut
};

/**
 * Obtient le label du type de dépendance
 */
const getDependencyLabel = (type) => {
  const labels = {
    'fin-debut': 'Fin → Début',
    'FD': 'Fin → Début',
    'debut-debut': 'Début → Début',
    'DD': 'Début → Début',
    'fin-fin': 'Fin → Fin',
    'FF': 'Fin → Fin',
    'debut-fin': 'Début → Fin',
    'DF': 'Début → Fin'
  };
  
  return labels[type] || type;
};

/**
 * Composant pour le popover d'une dépendance
 */
const DependencyPopover = ({ 
  dependency, 
  fromTask, 
  toTask,
  onEdit,
  onDelete,
  onToggle,
  position
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <g
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <circle
            cx={position.x}
            cy={position.y}
            r="8"
            fill="white"
            stroke={getDependencyColor(dependency.type)}
            strokeWidth="2"
          />
          <circle
            cx={position.x}
            cy={position.y}
            r="4"
            fill={getDependencyColor(dependency.type)}
          />
        </g>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="center" side="top">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Dépendance</h4>
            <Badge 
              variant="outline" 
              style={{ 
                borderColor: getDependencyColor(dependency.type),
                color: getDependencyColor(dependency.type)
              }}
            >
              {getDependencyLabel(dependency.type)}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">De :</span>
              <span className="font-medium">{fromTask.nomActe || fromTask.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Vers :</span>
              <span className="font-medium">{toTask.nomActe || toTask.name}</span>
            </div>
            {dependency.decalage && dependency.decalage.valeur > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Décalage :</span>
                <span>+{dependency.decalage.valeur} {dependency.decalage.unite}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onToggle(dependency, dependency.active === false);
                setIsOpen(false);
              }}
              className="flex-1"
            >
              {dependency.active === false ? (
                <>
                  <ToggleRight className="h-4 w-4 mr-1" />
                  Activer
                </>
              ) : (
                <>
                  <ToggleLeft className="h-4 w-4 mr-1" />
                  Désactiver
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onEdit(dependency);
                setIsOpen(false);
              }}
              className="flex-1"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Modifier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDelete(dependency);
                setIsOpen(false);
              }}
              className="flex-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Composant principal pour les lignes de dépendances interactives
 */
const DependencyLinesInteractive = ({ 
  tasks,
  onDependencyClick,
  onDependencyEdit,
  onDependencyDelete,
  onDependencyToggle,
  highlightedTaskId,
  highlightedDependencyId
}) => {
  const [isReady, setIsReady] = useState(false);
  const [hoveredDependencyId, setHoveredDependencyId] = useState(null);
  
  // Attendre que les éléments DOM soient rendus
  useEffect(() => {
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('[data-task-id]');
      if (elements.length > 0) {
        setIsReady(true);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [tasks]);
  
  // Calculer les chemins des dépendances
  const dependencyData = useMemo(() => {
    if (!isReady) return [];
    
    const calculatedData = [];
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    
    tasks.forEach(task => {
      if (!task.dependances || task.dependances.length === 0) return;
      
      task.dependances.forEach(dep => {
        const fromTask = taskMap.get(dep.id_tache_precedente);
        if (!fromTask) return;
        
        // Obtenir les éléments DOM
        const fromElement = document.querySelector(`[data-task-id="${fromTask.id}"]`);
        const toElement = document.querySelector(`[data-task-id="${task.id}"]`);
        
        if (!fromElement || !toElement) {
          console.warn(`Éléments non trouvés: ${fromTask.id} -> ${task.id}`);
          return;
        }
        
        // Obtenir les positions relatives au conteneur SVG
        const svgElement = fromElement.closest('.gantt-timeline');
        if (!svgElement) return;
        
        const svgRect = svgElement.getBoundingClientRect();
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        
        // Calculer les positions selon le type de dépendance
        let fromX, fromY, toX, toY;
        
        switch (dep.type) {
          case 'debut-debut':
          case 'DD':
            fromX = fromRect.left - svgRect.left;
            fromY = fromRect.top - svgRect.top + fromRect.height / 2;
            toX = toRect.left - svgRect.left;
            toY = toRect.top - svgRect.top + toRect.height / 2;
            break;
            
          case 'fin-fin':
          case 'FF':
            fromX = fromRect.right - svgRect.left;
            fromY = fromRect.top - svgRect.top + fromRect.height / 2;
            toX = toRect.right - svgRect.left;
            toY = toRect.top - svgRect.top + toRect.height / 2;
            break;
            
          case 'debut-fin':
          case 'DF':
            fromX = fromRect.left - svgRect.left;
            fromY = fromRect.top - svgRect.top + fromRect.height / 2;
            toX = toRect.right - svgRect.left;
            toY = toRect.top - svgRect.top + toRect.height / 2;
            break;
            
          case 'fin-debut':
          case 'FD':
          default:
            fromX = fromRect.right - svgRect.left;
            fromY = fromRect.top - svgRect.top + fromRect.height / 2;
            toX = toRect.left - svgRect.left;
            toY = toRect.top - svgRect.top + toRect.height / 2;
            break;
        }
        
        // Créer un chemin courbe
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const curvature = Math.min(distance * 0.3, 50);
        
        let path;
        if (Math.abs(dy) < 5) {
          // Ligne presque horizontale
          path = `M ${fromX} ${fromY} C ${fromX + curvature} ${fromY}, ${toX - curvature} ${toY}, ${toX} ${toY}`;
        } else {
          // Ligne avec coude
          const midX = fromX + (toX - fromX) / 2;
          path = `M ${fromX} ${fromY} C ${fromX + curvature} ${fromY}, ${midX} ${fromY}, ${midX} ${fromY + dy/2} S ${midX} ${toY}, ${toX} ${toY}`;
        }
        
        calculatedData.push({
          id: dep.id || `${dep.id_tache_precedente}-${task.id}`,
          dependency: dep,
          path,
          color: getDependencyColor(dep.type),
          fromTask,
          toTask: task,
          popoverPosition: {
            x: fromX + (toX - fromX) / 2,
            y: fromY + (toY - fromY) / 2
          }
        });
      });
    });
    
    console.log(`[DependencyLinesInteractive] ${calculatedData.length} dépendances calculées`);
    return calculatedData;
  }, [tasks, isReady]);
  
  // Gestionnaire de survol
  const handleMouseEnter = useCallback((depId) => {
    setHoveredDependencyId(depId);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setHoveredDependencyId(null);
  }, []);
  
  if (!isReady) {
    return (
      <div className="absolute top-0 left-0 p-2 text-xs text-gray-500">
        Chargement des dépendances...
      </div>
    );
  }
  
  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full"
      style={{ zIndex: 20, pointerEvents: 'none' }}
    >
      <defs>
        {/* Définir les marqueurs de flèche pour chaque couleur */}
        {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'].map(color => (
          <marker
            key={color}
            id={`arrow-${color.replace('#', '')}`}
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
        ))}
      </defs>
      
      <g style={{ pointerEvents: 'auto' }}>
        {dependencyData.map(data => {
          const isHovered = hoveredDependencyId === data.id;
          const isHighlighted = highlightedDependencyId === data.id ||
            highlightedTaskId === data.fromTask.id ||
            highlightedTaskId === data.toTask.id;
          const isDisabled = data.dependency.active === false;
          
          return (
            <g 
              key={data.id} 
              className="dependency-line-group"
              onMouseEnter={() => handleMouseEnter(data.id)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Zone de clic invisible plus large */}
              <path
                d={data.path}
                stroke="transparent"
                strokeWidth="15"
                fill="none"
                className="cursor-pointer"
                onClick={() => onDependencyClick?.(data.dependency)}
              />
              
              {/* Ligne principale */}
              <path
                d={data.path}
                stroke={data.color}
                strokeWidth={isHovered || isHighlighted ? 3 : 2}
                fill="none"
                opacity={isDisabled ? 0.3 : (isHovered || isHighlighted ? 1 : 0.7)}
                strokeDasharray={isDisabled ? "5,5" : "none"}
                markerEnd={`url(#arrow-${data.color.replace('#', '')})`}
                className={cn(
                  "transition-all duration-200",
                  (isHovered || isHighlighted) && "drop-shadow-md"
                )}
                style={{ pointerEvents: 'none' }}
              />
              
              {/* Effet de surbrillance pour les tâches liées */}
              {(isHovered || isHighlighted) && (
                <>
                  <circle
                    cx={data.path.split(' ')[1]}
                    cy={data.path.split(' ')[2]}
                    r="6"
                    fill={data.color}
                    opacity="0.3"
                    className="animate-pulse"
                  />
                  <circle
                    cx={data.path.split(' ')[data.path.split(' ').length - 2]}
                    cy={data.path.split(' ')[data.path.split(' ').length - 1]}
                    r="6"
                    fill={data.color}
                    opacity="0.3"
                    className="animate-pulse"
                  />
                </>
              )}
              
              {/* Popover interactif */}
              <DependencyPopover
                dependency={data.dependency}
                fromTask={data.fromTask}
                toTask={data.toTask}
                onEdit={onDependencyEdit}
                onDelete={onDependencyDelete}
                onToggle={onDependencyToggle}
                position={data.popoverPosition}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default DependencyLinesInteractive;