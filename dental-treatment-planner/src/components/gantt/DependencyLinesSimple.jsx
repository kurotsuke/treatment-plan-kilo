import React, { useEffect, useState, useMemo } from 'react';
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

const DependencyLinesSimple = ({ tasks }) => {
  const [isReady, setIsReady] = useState(false);
  
  // Attendre que les éléments DOM soient rendus
  useEffect(() => {
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('[data-task-id]');
      if (elements.length > 0) {
        setIsReady(true);
      }
    }, 1000); // Attendre 1 seconde pour être sûr
    
    return () => clearTimeout(timer);
  }, [tasks]);
  
  // Calculer les chemins des dépendances
  const paths = useMemo(() => {
    if (!isReady) return [];
    
    const calculatedPaths = [];
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
        
        // Calculer les positions relatives
        const fromX = fromRect.right - svgRect.left;
        const fromY = fromRect.top - svgRect.top + fromRect.height / 2;
        const toX = toRect.left - svgRect.left;
        const toY = toRect.top - svgRect.top + toRect.height / 2;
        
        // Créer un chemin simple (ligne droite avec coude)
        const midX = fromX + (toX - fromX) / 2;
        const path = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
        
        calculatedPaths.push({
          id: `${dep.id_tache_precedente}-${task.id}`,
          path,
          color: getDependencyColor(dep.type),
          type: dep.type,
          fromTask: fromTask.name,
          toTask: task.name
        });
      });
    });
    
    console.log(`[DependencyLinesSimple] ${calculatedPaths.length} chemins calculés`);
    return calculatedPaths;
  }, [tasks, isReady]);
  
  if (!isReady) {
    return (
      <div className="absolute top-0 left-0 p-2 text-xs text-gray-500">
        Chargement des dépendances...
      </div>
    );
  }
  
  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 20 }}
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
      
      <g>
        {paths.map(p => (
          <g key={p.id} className="dependency-line">
            {/* Ligne principale */}
            <path
              d={p.path}
              stroke={p.color}
              strokeWidth="2"
              fill="none"
              opacity="0.6"
              markerEnd={`url(#arrow-${p.color.replace('#', '')})`}
            />
            
            {/* Zone de clic invisible plus large */}
            <path
              d={p.path}
              stroke="transparent"
              strokeWidth="10"
              fill="none"
              className="cursor-pointer"
              onClick={() => console.log('Dépendance cliquée:', p)}
            />
          </g>
        ))}
      </g>
      
      {/* Afficher le nombre de dépendances pour debug */}
      <text x="10" y="20" fill="#666" fontSize="12">
        {paths.length} dépendances affichées
      </text>
    </svg>
  );
};

export default DependencyLinesSimple;