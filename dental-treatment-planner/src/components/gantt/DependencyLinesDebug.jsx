import React, { useEffect, useState } from 'react';

const DependencyLinesDebug = ({ tasks }) => {
  const [paths, setPaths] = useState([]);
  
  useEffect(() => {
    const calculatePaths = () => {
      const newPaths = [];
      const taskMap = new Map(tasks.map(task => [task.id, task]));
      
      tasks.forEach(task => {
        if (!task.dependances || task.dependances.length === 0) return;
        
        task.dependances.forEach(dep => {
          const fromTask = taskMap.get(dep.id_tache_precedente);
          if (!fromTask) return;
          
          // Position fixe pour le debug
          const fromX = 100;
          const fromY = 50;
          const toX = 300;
          const toY = 100;
          
          newPaths.push({
            id: `${dep.id_tache_precedente}-${task.id}`,
            path: `M ${fromX} ${fromY} L ${toX} ${toY}`,
            color: '#3B82F6',
            type: dep.type
          });
        });
      });
      
      console.log('[DependencyLinesDebug] Paths calculés:', newPaths);
      setPaths(newPaths);
    };
    
    calculatePaths();
  }, [tasks]);
  
  return (
    <svg 
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-50"
      style={{ border: '2px solid red' }}
    >
      <g>
        {paths.map(p => (
          <g key={p.id}>
            <path
              d={p.path}
              stroke={p.color}
              strokeWidth="3"
              fill="none"
              opacity="0.8"
            />
            <text x="200" y="75" fill="black" fontSize="12">
              {p.type}
            </text>
          </g>
        ))}
      </g>
      <text x="10" y="20" fill="red" fontSize="14">
        Debug: {paths.length} dépendances
      </text>
    </svg>
  );
};

export default DependencyLinesDebug;