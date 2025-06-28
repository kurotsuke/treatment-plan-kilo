import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';

const ToothBadge = ({
  tooth,
  taskId,
  isSelected,
  isDragging,
  onSelect,
  selectedCount = 1,
  className
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `tooth-${taskId}-${tooth}`,
    data: { 
      type: 'tooth', 
      tooth,
      sourceTaskId: taskId 
    }
  });

  const handleClick = (e) => {
    e.stopPropagation(); // Empêcher la propagation vers le parent
    
    // Gérer la sélection avec Ctrl/Cmd
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      onSelect?.(tooth, true); // true = multi-sélection
    } else {
      onSelect?.(tooth, false); // false = sélection simple
    }
  };

  // Appliquer le transform seulement si c'est une sélection unique
  // Pour les sélections multiples, le DragOverlay gère l'affichage
  const isMultiSelection = selectedCount > 1;
  const style = transform && (!isMultiSelection || !isSelected) ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000
  } : undefined;

  return (
    <span
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      onClick={handleClick}
      data-tooth-badge
      className={cn(
        "inline-flex items-center rounded-full px-2 text-xs font-medium cursor-grab",
        "bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-150",
        "select-none", // Empêcher la sélection de texte
        isSelected && !isDragging && "ring-2 ring-blue-500 bg-blue-100 text-blue-700",
        isDragging && isMultiSelection && "hidden", // Caché seulement si multi-sélection
        isDragging && !isMultiSelection && "opacity-50 cursor-grabbing", // Semi-transparent si sélection unique
        className
      )}
    >
      {tooth}
    </span>
  );
};

export default ToothBadge;