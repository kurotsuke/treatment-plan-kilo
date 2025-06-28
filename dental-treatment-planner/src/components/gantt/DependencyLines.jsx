import React, { useMemo, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';

/**
 * Calcule les points de connexion pour une tâche
 */
const getTaskConnectionPoints = (taskElement, taskId) => {
  if (!taskElement) return null;
  
  const rect = taskElement.getBoundingClientRect();
  const timeline = taskElement.closest('.gantt-timeline');
  const parentRect = timeline?.getBoundingClientRect();
  
  if (!parentRect) return null;
  
  // Prendre en compte le scroll du timeline
  const scrollLeft = timeline.scrollLeft || 0;
  const scrollTop = timeline.scrollTop || 0;
  
  // Position relative au conteneur parent avec compensation du scroll
  const relativeTop = rect.top - parentRect.top + scrollTop;
  const relativeLeft = rect.left - parentRect.left + scrollLeft;
  
  return {
    // Point de sortie (fin de la tâche)
    out: {
      x: relativeLeft + rect.width,
      y: relativeTop + rect.height / 2
    },
    // Point d'entrée (début de la tâche)
    in: {
      x: relativeLeft,
      y: relativeTop + rect.height / 2
    },
    // Centre de la tâche
    center: {
      x: relativeLeft + rect.width / 2,
      y: relativeTop + rect.height / 2
    },
    width: rect.width,
    height: rect.height
  };
};

/**
 * Calcule le chemin SVG pour une dépendance
 */
const calculateDependencyPath = (fromPoint, toPoint, type = 'fin-debut') => {
  if (!fromPoint || !toPoint) return '';
  
  let startX, startY, endX, endY;
  
  // Déterminer les points de départ et d'arrivée selon le type
  switch (type) {
    case 'fin-debut':
    case 'FD':
      startX = fromPoint.out.x;
      startY = fromPoint.out.y;
      endX = toPoint.in.x;
      endY = toPoint.in.y;
      break;
      
    case 'debut-debut':
    case 'DD':
      startX = fromPoint.in.x;
      startY = fromPoint.in.y;
      endX = toPoint.in.x;
      endY = toPoint.in.y;
      break;
      
    case 'fin-fin':
    case 'FF':
      startX = fromPoint.out.x;
      startY = fromPoint.out.y;
      endX = toPoint.out.x;
      endY = toPoint.out.y;
      break;
      
    case 'debut-fin':
    case 'DF':
      startX = fromPoint.in.x;
      startY = fromPoint.in.y;
      endX = toPoint.out.x;
      endY = toPoint.out.y;
      break;
      
    default:
      startX = fromPoint.out.x;
      startY = fromPoint.out.y;
      endX = toPoint.in.x;
      endY = toPoint.in.y;
  }
  
  // Calculer les points de contrôle pour la courbe de Bézier
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Ajuster la courbure en fonction de la distance
  const curvature = Math.min(distance * 0.5, 50);
  
  // Points de contrôle pour une courbe fluide
  const cp1x = startX + curvature;
  const cp1y = startY;
  const cp2x = endX - curvature;
  const cp2y = endY;
  
  // Créer le chemin SVG avec une courbe de Bézier cubique
  return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
};

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
 * Composant pour afficher une flèche au bout de la ligne
 */
const DependencyArrow = ({ pathId, color }) => (
  <defs>
    <marker
      id={`arrow-${pathId}`}
      viewBox="0 0 10 10"
      refX="9"
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
);

/**
 * Composant pour une ligne de dépendance individuelle
 */
const DependencyLine = ({
  dependency,
  path,
  color,
  isHovered,
  isSelected,
  onClick,
  onHover,
  onHoverEnd
}) => {
  const pathId = `dep-${dependency.id || `${dependency.id_tache_precedente}-${dependency.id_tache_suivante}`}`;
  
  return (
    <g
      className="dependency-line-group"
      onMouseEnter={() => onHover?.(dependency)}
      onMouseLeave={() => onHoverEnd?.()}
      onClick={() => onClick?.(dependency)}
      style={{ cursor: 'pointer' }}
    >
      {/* Ligne invisible plus large pour faciliter l'interaction */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth="10"
        fill="none"
      />
      
      {/* Ligne visible */}
      <path
        d={path}
        stroke={color}
        strokeWidth={isHovered || isSelected ? 3 : 2}
        fill="none"
        opacity={isHovered || isSelected ? 1 : 0.6}
        strokeDasharray={dependency.active === false ? "5,5" : "none"}
        markerEnd={`url(#arrow-${pathId})`}
        className={cn(
          "transition-all duration-200",
          isHovered && "drop-shadow-md"
        )}
      />
      
      {/* Flèche */}
      <DependencyArrow pathId={pathId} color={color} />
      
      {/* Label optionnel */}
      {isHovered && dependency.decalage && (
        <text
          x={path.split(' ')[4]}
          y={path.split(' ')[5]}
          dy="-10"
          className="text-xs fill-gray-700 bg-white"
          textAnchor="middle"
        >
          {`+${dependency.decalage.valeur} ${dependency.decalage.unite}`}
        </text>
      )}
    </g>
  );
};

/**
 * Composant principal pour afficher toutes les lignes de dépendances
 */
const DependencyLines = ({
  tasks = [],
  dependencies = [],
  selectedTaskId,
  hoveredDependencyId,
  onDependencyClick,
  onDependencyHover,
  onDependencyDoubleClick,
  showLabels = false,
  interactive = true,
  className
}) => {
  const [hoveredDepId, setHoveredDepId] = useState(null);
  const [taskElements, setTaskElements] = useState({});
  
  // Collecter les références DOM des tâches
  const registerTaskElement = useCallback((taskId, element) => {
    if (element) {
      setTaskElements(prev => ({
        ...prev,
        [taskId]: element
      }));
    }
  }, []);
  
  // État pour forcer le recalcul après le rendu initial
  const [isReady, setIsReady] = useState(false);
  
  // Attendre que les éléments DOM soient rendus
  React.useEffect(() => {
    const checkElements = () => {
      const elements = document.querySelectorAll('[data-task-id]');
      if (elements.length > 0) {
        setIsReady(true);
      }
    };
    
    // Vérifier immédiatement
    checkElements();
    
    // Si pas prêt, vérifier après un court délai
    if (!isReady) {
      const timer = setTimeout(checkElements, 500);
      return () => clearTimeout(timer);
    }
  }, [tasks, isReady]);
  
  // Forcer le recalcul quand le DOM change
  React.useEffect(() => {
    if (!isReady) return;
    
    // Observer les mutations du DOM pour recalculer les chemins
    const observer = new MutationObserver(() => {
      setTaskElements({}); // Force un recalcul
    });
    
    const timeline = document.querySelector('.gantt-timeline');
    if (timeline) {
      observer.observe(timeline, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
    
    return () => observer.disconnect();
  }, [isReady]);
  
  // Calculer les chemins des dépendances
  const dependencyPaths = useMemo(() => {
    if (!isReady) return [];
    
    const paths = [];
    
    // Créer une map des tâches pour un accès rapide
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    
    // Parcourir toutes les tâches pour extraire leurs dépendances
    tasks.forEach(task => {
      if (!task.dependances || task.dependances.length === 0) return;
      
      task.dependances.forEach(dep => {
        const fromTask = taskMap.get(dep.id_tache_precedente);
        const toTask = task;
        
        if (!fromTask || !toTask) {
          console.warn(`[DependencyLines] Dépendance non trouvée: ${dep.id_tache_precedente} -> ${task.id}`);
          return;
        }
        
        // Obtenir les éléments DOM
        const fromElement = document.querySelector(`[data-task-id="${fromTask.id}"]`);
        const toElement = document.querySelector(`[data-task-id="${toTask.id}"]`);
        
        if (!fromElement || !toElement) {
          console.warn(`[DependencyLines] Éléments DOM non trouvés pour: ${fromTask.id} -> ${toTask.id}`);
          return;
        }
        
        // Calculer les points de connexion
        const fromPoints = getTaskConnectionPoints(fromElement, fromTask.id);
        const toPoints = getTaskConnectionPoints(toElement, toTask.id);
        
        if (!fromPoints || !toPoints) {
          console.warn(`[DependencyLines] Points de connexion non calculés pour: ${fromTask.id} -> ${toTask.id}`);
          return;
        }
        
        // Calculer le chemin
        const path = calculateDependencyPath(fromPoints, toPoints, dep.type);
        const color = getDependencyColor(dep.type);
        
        paths.push({
          dependency: {
            ...dep,
            id: dep.id || `${dep.id_tache_precedente}-${toTask.id}`,
            id_tache_suivante: toTask.id
          },
          path,
          color,
          fromTask,
          toTask
        });
      });
    });
    
    console.log(`[DependencyLines] ${paths.length} chemins de dépendances calculés`);
    return paths;
  }, [tasks, taskElements, isReady]);
  
  // Gestionnaires d'événements
  const handleDependencyHover = useCallback((dep) => {
    setHoveredDepId(dep.id || `${dep.id_tache_precedente}-${dep.id_tache_suivante}`);
    onDependencyHover?.(dep);
  }, [onDependencyHover]);
  
  const handleDependencyHoverEnd = useCallback(() => {
    setHoveredDepId(null);
    onDependencyHover?.(null);
  }, [onDependencyHover]);
  
  const handleDependencyClick = useCallback((dep) => {
    if (interactive) {
      onDependencyClick?.(dep);
    }
  }, [interactive, onDependencyClick]);
  
  // Observer les changements de position des tâches
  React.useEffect(() => {
    const observer = new ResizeObserver(() => {
      // Forcer le recalcul des chemins lors du redimensionnement
      setTaskElements({});
    });
    
    const timeline = document.querySelector('.gantt-timeline');
    if (timeline) {
      observer.observe(timeline);
    }
    
    return () => observer.disconnect();
  }, []);
  
  // Calculer les dimensions du SVG pour couvrir toute la zone
  const svgDimensions = useMemo(() => {
    const timeline = document.querySelector('.gantt-timeline');
    if (!timeline) return { width: '100%', height: '100%' };
    
    const rect = timeline.getBoundingClientRect();
    const scrollWidth = timeline.scrollWidth || rect.width;
    const scrollHeight = timeline.scrollHeight || rect.height;
    
    return {
      width: scrollWidth,
      height: scrollHeight
    };
  }, [dependencyPaths]);
  
  return (
    <svg
      className={cn(
        "absolute top-0 left-0 pointer-events-none z-10",
        interactive && "pointer-events-auto",
        className
      )}
      style={{
        width: svgDimensions.width,
        height: svgDimensions.height,
        overflow: 'visible'
      }}
    >
      <g className="dependency-lines">
        {dependencyPaths.map((depPath, index) => {
          const depId = depPath.dependency.id || 
            `${depPath.dependency.id_tache_precedente}-${depPath.dependency.id_tache_suivante}`;
          
          return (
            <DependencyLine
              key={depId}
              dependency={depPath.dependency}
              path={depPath.path}
              color={depPath.color}
              isHovered={hoveredDepId === depId || hoveredDependencyId === depId}
              isSelected={
                selectedTaskId === depPath.fromTask.id || 
                selectedTaskId === depPath.toTask.id
              }
              onClick={handleDependencyClick}
              onHover={handleDependencyHover}
              onHoverEnd={handleDependencyHoverEnd}
            />
          );
        })}
      </g>
      
      {/* Tooltip pour les dépendances survolées */}
      {hoveredDepId && interactive && (
        <g className="dependency-tooltip">
          {/* Le tooltip sera implémenté dans une prochaine itération */}
        </g>
      )}
    </svg>
  );
};

export default DependencyLines;