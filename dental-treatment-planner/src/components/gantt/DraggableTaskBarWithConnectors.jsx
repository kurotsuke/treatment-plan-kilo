import React, { useState, useRef, useCallback } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../ui/context-menu';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';

/**
 * Composant pour une barre de tâche avec drag & drop, resize et points de connexion
 */
const DraggableTaskBarWithConnectors = ({
  task,
  onResize,
  onMove,
  onContextMenu,
  onConnectionStart,
  onConnectionEnd,
  isDragging = false,
  isConnecting = false,
  connectionType = null
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [showConnectors, setShowConnectors] = useState(false);
  const [isDraggingConnection, setIsDraggingConnection] = useState(false);
  const resizeStartRef = useRef(null);
  
  // Configuration du drag & drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: task.id,
    disabled: isResizing || isDraggingConnection,
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;
  
  // Gestion du resize
  const handleResizeStart = (e, direction) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    resizeStartRef.current = {
      x: e.clientX,
      width: e.currentTarget.parentElement.offsetWidth,
      startDate: new Date(task.startAt),
      endDate: new Date(task.endAt)
    };
    
    const handleMouseMove = (e) => {
      if (!resizeStartRef.current) return;
      
      const deltaX = e.clientX - resizeStartRef.current.x;
      const dayWidth = 150 / 30; // Approximation : largeur d'un jour
      const deltaDays = Math.round(deltaX / dayWidth);
      
      if (direction === 'left') {
        const newStartDate = new Date(resizeStartRef.current.startDate);
        newStartDate.setDate(newStartDate.getDate() + deltaDays);
        onResize?.(task.id, { startAt: newStartDate });
      } else {
        const newEndDate = new Date(resizeStartRef.current.endDate);
        newEndDate.setDate(newEndDate.getDate() + deltaDays);
        onResize?.(task.id, { endAt: newEndDate });
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      resizeStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Gestion du drag de connexion
  const handleConnectionDragStart = useCallback((e, position) => {
    console.log('[DraggableTaskBar] 🔌 Connection drag start:', { taskId: task.id, position });
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingConnection(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const startPoint = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    
    console.log('[DraggableTaskBar] 🔌 Calling onConnectionStart:', {
      taskId: task.id,
      position,
      startPoint,
      hasCallback: !!onConnectionStart
    });
    
    onConnectionStart?.(task.id, position, startPoint);
    
    const handleMouseMove = (e) => {
      // Mettre à jour la position de la ligne de prévisualisation
      const currentPoint = {
        x: e.clientX,
        y: e.clientY
      };
      
      // Vérifier si on survole une autre tâche
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const taskElement = elements.find(el => el.hasAttribute('data-task-id'));
      
      if (taskElement) {
        const hoveredTaskId = taskElement.getAttribute('data-task-id');
        if (hoveredTaskId !== task.id) {
          taskElement.classList.add('ring-2', 'ring-blue-500');
        }
      }
      
      // Nettoyer les surbrillances précédentes
      document.querySelectorAll('[data-task-id]').forEach(el => {
        if (el !== taskElement) {
          el.classList.remove('ring-2', 'ring-blue-500');
        }
      });
    };
    
    const handleMouseUp = (e) => {
      console.log('[DraggableTaskBar] 🔌 Connection drag end');
      setIsDraggingConnection(false);
      
      // Trouver la tâche cible
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      console.log('[DraggableTaskBar] 🔌 Elements at mouse position:', elements.length);
      
      const taskElement = elements.find(el => el.hasAttribute('data-task-id'));
      console.log('[DraggableTaskBar] 🔌 Found task element:', !!taskElement);
      
      if (taskElement) {
        const targetTaskId = taskElement.getAttribute('data-task-id');
        console.log('[DraggableTaskBar] 🔌 Target task ID:', targetTaskId);
        
        if (targetTaskId !== task.id) {
          // Déterminer la position cible (début ou fin de la tâche cible)
          const targetRect = taskElement.getBoundingClientRect();
          const targetCenter = targetRect.left + targetRect.width / 2;
          const targetPosition = e.clientX < targetCenter ? 'start' : 'end';
          
          console.log('[DraggableTaskBar] 🔌 Calling onConnectionEnd:', {
            fromTaskId: task.id,
            toTaskId: targetTaskId,
            fromPosition: position,
            toPosition: targetPosition,
            hasCallback: !!onConnectionEnd
          });
          
          onConnectionEnd?.(task.id, targetTaskId, position, targetPosition);
        } else {
          console.log('[DraggableTaskBar] 🔌 Cannot connect to same task');
        }
      } else {
        console.log('[DraggableTaskBar] 🔌 No target task found at drop position');
      }
      
      // Nettoyer toutes les surbrillances
      document.querySelectorAll('[data-task-id]').forEach(el => {
        el.classList.remove('ring-2', 'ring-blue-500');
      });
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [task.id, onConnectionStart, onConnectionEnd]);
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative group transition-all duration-200",
        isDragging && "opacity-50",
        isConnecting && connectionType === 'target' && "ring-2 ring-blue-500"
      )}
      data-task-id={task.id}
      style={{
        backgroundColor: task.status.color + '20',
        borderColor: task.status.color,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '4px',
        cursor: isResizing ? 'ew-resize' : (isDragging ? 'grabbing' : 'grab'),
        ...style
      }}
      onMouseEnter={() => setShowConnectors(true)}
      onMouseLeave={() => !isDraggingConnection && setShowConnectors(false)}
    >
      {/* Point de connexion gauche (entrée) */}
      <div
        className={cn(
          "absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-white cursor-crosshair z-50 transition-all duration-200",
          showConnectors || isDraggingConnection ? "opacity-100 scale-100" : "opacity-0 scale-75",
          "hover:scale-150 hover:bg-blue-100 hover:border-blue-500 hover:shadow-lg"
        )}
        style={{
          borderColor: task.status.color,
          pointerEvents: showConnectors || isDraggingConnection ? 'auto' : 'none'
        }}
        onMouseDown={(e) => handleConnectionDragStart(e, 'start')}
        title="Tirer pour créer une dépendance depuis cette tâche"
      />
      
      {/* Point de connexion droit (sortie) */}
      <div
        className={cn(
          "absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-white cursor-crosshair z-50 transition-all duration-200",
          showConnectors || isDraggingConnection ? "opacity-100 scale-100" : "opacity-0 scale-75",
          "hover:scale-150 hover:bg-blue-100 hover:border-blue-500 hover:shadow-lg"
        )}
        style={{
          borderColor: task.status.color,
          pointerEvents: showConnectors || isDraggingConnection ? 'auto' : 'none'
        }}
        onMouseDown={(e) => handleConnectionDragStart(e, 'end')}
        title="Tirer pour créer une dépendance vers cette tâche"
      />
      
      {/* Handle de resize gauche */}
      <div
        className="absolute left-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-blue-500/20 z-10"
        onMouseDown={(e) => handleResizeStart(e, 'left')}
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* Contenu de la barre */}
      <div
        className="flex items-center justify-between w-full px-2 py-1 h-full"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-medium truncate">
            {task.nomActe || task.name}
          </span>
          {task.dents && task.dents.length > 0 && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              ({task.dents.join(', ')})
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Avatar */}
          {task.owner && (
            <Avatar className="h-4 w-4 flex-shrink-0">
              {task.owner.image && (
                <AvatarImage
                  src={task.owner.image}
                  alt={task.owner.name}
                />
              )}
              <AvatarFallback className="text-[8px] font-medium bg-gray-200">
                {task.owner.initials}
              </AvatarFallback>
            </Avatar>
          )}
          
          {/* Menu contextuel */}
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <button 
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <EllipsisVerticalIcon className="h-4 w-4 text-gray-600" />
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => onContextMenu?.('edit', task)}>
                Modifier
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onContextMenu?.('duplicate', task)}>
                Dupliquer
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onContextMenu?.('manage-dependencies', task)}>
                Gérer les dépendances
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onContextMenu?.('delete', task)}>
                Supprimer
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </div>
      
      {/* Handle de resize droit */}
      <div
        className="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-blue-500/20 z-10"
        onMouseDown={(e) => handleResizeStart(e, 'right')}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default DraggableTaskBarWithConnectors;