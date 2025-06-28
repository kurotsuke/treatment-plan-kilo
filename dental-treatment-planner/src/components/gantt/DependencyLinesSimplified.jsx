import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

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
 * Composant pour le bouton de suppression
 */
const DeleteButton = ({ dependency, onDelete, position }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        onDelete(dependency);
      }}
    >
      {/* Fond blanc pour le bouton */}
      <circle
        cx={position.x}
        cy={position.y}
        r={isHovered ? 12 : 10}
        fill="white"
        stroke="#EF4444"
        strokeWidth="2"
        className="transition-all duration-200"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
        }}
      />
      {/* Icône X */}
      <path
        d={`M ${position.x - 4} ${position.y - 4} L ${position.x + 4} ${position.y + 4} M ${position.x + 4} ${position.y - 4} L ${position.x - 4} ${position.y + 4}`}
        stroke="#EF4444"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  );
};

/**
 * Composant principal pour les lignes de dépendances simplifiées
 */
const DependencyLinesSimplified = ({
  tasks,
  onDependencyDelete,
  highlightedTaskId,
  previewConnection = null,
  activeTaskId = null, // Nouveau prop pour la tâche en cours de drag
  dragOverrides = {} // Nouveau prop pour les positions temporaires pendant le drag
}) => {
  const [isReady, setIsReady] = useState(false);
  const [hoveredDependencyId, setHoveredDependencyId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Attendre que les éléments DOM soient rendus
  useEffect(() => {
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('[data-task-id]');
      if (elements.length > 0) {
        setIsReady(true);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [tasks]);
  
  // Forcer le recalcul après la fin du drag
  useEffect(() => {
    if (!activeTaskId) {
      // Quand activeTaskId devient null (fin du drag), attendre un peu puis forcer le recalcul
      const timer = setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTaskId]);
  
  // Calculer les chemins des dépendances
  const dependencyData = useMemo(() => {
    if (!isReady) return [];
    
    const calculatedData = [];
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    
    // Fonction pour obtenir la position réelle d'une tâche (en tenant compte des overrides)
    const getTaskPosition = (taskId) => {
      const task = taskMap.get(taskId);
      if (!task) return null;
      
      // Utiliser les dates overridées si disponibles, sinon les dates normales
      const dates = dragOverrides[taskId] || { startAt: task.startAt, endAt: task.endAt };
      
      // Calculer la position basée sur les dates
      const timelineStart = new Date(new Date().getFullYear() - 1, 0, 1);
      
      const startMonthsDiff = (dates.startAt.getFullYear() - timelineStart.getFullYear()) * 12 +
                            (dates.startAt.getMonth() - timelineStart.getMonth());
      const startDaysInMonth = new Date(dates.startAt.getFullYear(), dates.startAt.getMonth() + 1, 0).getDate();
      const startDayOffset = (dates.startAt.getDate() - 1) / startDaysInMonth;
      const startOffset = (startMonthsDiff + startDayOffset) * 150;
      
      const endMonthsDiff = (dates.endAt.getFullYear() - timelineStart.getFullYear()) * 12 +
                           (dates.endAt.getMonth() - timelineStart.getMonth());
      const endDaysInMonth = new Date(dates.endAt.getFullYear(), dates.endAt.getMonth() + 1, 0).getDate();
      const endDayOffset = (dates.endAt.getDate() - 1) / endDaysInMonth;
      const endOffset = (endMonthsDiff + endDayOffset) * 150;
      
      return {
        left: startOffset,
        right: endOffset,
        width: endOffset - startOffset
      };
    };
    
    tasks.forEach(task => {
      if (!task.dependances || task.dependances.length === 0) return;
      
      task.dependances.forEach(dep => {
        // Ignorer les dépendances inactives
        if (dep.active === false) return;
        
        const fromTask = taskMap.get(dep.id_tache_precedente);
        if (!fromTask) return;
        
        // Obtenir les éléments DOM
        const fromElement = document.querySelector(`[data-task-id="${fromTask.id}"]`);
        const toElement = document.querySelector(`[data-task-id="${task.id}"]`);
        
        if (!fromElement || !toElement) return;
        
        // Obtenir les positions relatives au conteneur SVG
        const svgElement = fromElement.closest('.gantt-timeline');
        if (!svgElement) return;
        
        const svgRect = svgElement.getBoundingClientRect();
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElement.getBoundingClientRect();
        
        // Obtenir les positions overridées si disponibles
        const fromOverridePos = getTaskPosition(fromTask.id);
        const toOverridePos = getTaskPosition(task.id);
        
        // Calculer les positions selon le type de dépendance
        let fromX, fromY, toX, toY;
        
        // Calculer la position Y (verticale) - elle ne change pas pendant le drag
        fromY = fromRect.top - svgRect.top + fromRect.height / 2;
        toY = toRect.top - svgRect.top + toRect.height / 2;
        
        // Calculer les positions X en tenant compte des overrides
        switch (dep.type) {
          case 'debut-debut':
          case 'DD':
            fromX = fromOverridePos ? fromOverridePos.left : (fromRect.left - svgRect.left);
            toX = toOverridePos ? toOverridePos.left : (toRect.left - svgRect.left);
            break;
            
          case 'fin-fin':
          case 'FF':
            fromX = fromOverridePos ? fromOverridePos.right : (fromRect.right - svgRect.left);
            toX = toOverridePos ? toOverridePos.right : (toRect.right - svgRect.left);
            break;
            
          case 'debut-fin':
          case 'DF':
            fromX = fromOverridePos ? fromOverridePos.left : (fromRect.left - svgRect.left);
            toX = toOverridePos ? toOverridePos.right : (toRect.right - svgRect.left);
            break;
            
          case 'fin-debut':
          case 'FD':
          default:
            fromX = fromOverridePos ? fromOverridePos.right : (fromRect.right - svgRect.left);
            toX = toOverridePos ? toOverridePos.left : (toRect.left - svgRect.left);
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
          deleteButtonPosition: {
            x: fromX + (toX - fromX) / 2,
            y: fromY + (toY - fromY) / 2
          }
        });
      });
    });
    
    return calculatedData;
  }, [tasks, isReady, refreshKey, activeTaskId, dragOverrides]);
  
  // Calculer le chemin de prévisualisation
  const previewPath = useMemo(() => {
    if (!previewConnection || !isReady) return null;
    
    const { fromTaskId, startPoint, currentPoint, type = 'FD' } = previewConnection;
    
    // Obtenir l'élément SVG pour les coordonnées relatives
    const svgElement = document.querySelector('.gantt-timeline');
    if (!svgElement) return null;
    
    const svgRect = svgElement.getBoundingClientRect();
    
    const fromX = startPoint.x - svgRect.left;
    const fromY = startPoint.y - svgRect.top;
    const toX = currentPoint.x - svgRect.left;
    const toY = currentPoint.y - svgRect.top;
    
    // Créer un chemin courbe
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(distance * 0.3, 50);
    
    let path;
    if (Math.abs(dy) < 5) {
      path = `M ${fromX} ${fromY} C ${fromX + curvature} ${fromY}, ${toX - curvature} ${toY}, ${toX} ${toY}`;
    } else {
      const midX = fromX + (toX - fromX) / 2;
      path = `M ${fromX} ${fromY} C ${fromX + curvature} ${fromY}, ${midX} ${fromY}, ${midX} ${fromY + dy/2} S ${midX} ${toY}, ${toX} ${toY}`;
    }
    
    return {
      path,
      color: getDependencyColor(type)
    };
  }, [previewConnection, isReady]);
  
  if (!isReady) {
    return null;
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
        {/* Lignes de dépendances existantes */}
        {dependencyData.map(data => {
          const isHovered = hoveredDependencyId === data.id;
          const isHighlighted = highlightedTaskId === data.fromTask.id ||
            highlightedTaskId === data.toTask.id;
          
          return (
            <g 
              key={data.id} 
              className="dependency-line-group"
              onMouseEnter={() => setHoveredDependencyId(data.id)}
              onMouseLeave={() => setHoveredDependencyId(null)}
            >
              {/* Zone de clic invisible plus large */}
              <path
                d={data.path}
                stroke="transparent"
                strokeWidth="15"
                fill="none"
                className="cursor-pointer"
              />
              
              {/* Ligne principale */}
              <path
                d={data.path}
                stroke={data.color}
                strokeWidth={isHovered || isHighlighted ? 3 : 2}
                fill="none"
                opacity={isHovered || isHighlighted ? 1 : 0.7}
                markerEnd={`url(#arrow-${data.color.replace('#', '')})`}
                className={cn(
                  "transition-all duration-200",
                  (isHovered || isHighlighted) && "drop-shadow-md"
                )}
                style={{ pointerEvents: 'none' }}
              />
              
              {/* Bouton de suppression (visible au hover) */}
              {isHovered && (
                <DeleteButton
                  dependency={{
                    ...data.dependency,
                    id_tache_suivante: data.toTask.id
                  }}
                  onDelete={onDependencyDelete}
                  position={data.deleteButtonPosition}
                />
              )}
            </g>
          );
        })}
        
        {/* Ligne de prévisualisation */}
        {previewPath && (
          <g className="preview-line-group">
            <path
              d={previewPath.path}
              stroke={previewPath.color}
              strokeWidth="2"
              fill="none"
              opacity="0.5"
              strokeDasharray="5,5"
              markerEnd={`url(#arrow-${previewPath.color.replace('#', '')})`}
              className="animate-pulse"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        )}
      </g>
    </svg>
  );
};

export default DependencyLinesSimplified;