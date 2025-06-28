import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';

/**
 * Types pour TypeScript (en commentaires pour JSX)
 * @typedef {Object} ListItem
 * @property {string} id - Identifiant unique de l'item
 * @property {string} [name] - Nom de l'item
 * @property {Object} [status] - Statut de l'item
 * @property {any} [data] - Données supplémentaires
 */

/**
 * @typedef {Object} DragEndEvent
 * @property {Object} active - Item en cours de drag
 * @property {Object} over - Zone de drop cible
 */

/**
 * Provider pour gérer le drag & drop entre les listes
 */
export const ListProvider = ({ children, onDragEnd }) => {
  const [activeItem, setActiveItem] = React.useState(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event) => {
    setActiveItem(event.active.data.current);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveItem(null);
      return;
    }
    
    // Extraire les groupIds correctement
    const fromGroupId = active.data.current?.groupId;
    let toGroupId;
    
    // Si on drop sur un item, utiliser son groupId
    if (over.data.current?.type === 'item') {
      toGroupId = over.data.current.groupId;
    }
    // Si on drop sur un groupe, utiliser l'id du groupe
    else if (over.data.current?.type === 'group') {
      toGroupId = over.data.current.groupId;
    }
    // Fallback: utiliser l'id directement
    else {
      toGroupId = over.id;
    }
    
    if (fromGroupId && toGroupId && fromGroupId !== toGroupId) {
      onDragEnd?.(
        active.data.current.item,
        fromGroupId,
        toGroupId
      );
    }
    
    setActiveItem(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <div className="overflow-auto">
        {children}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="bg-white p-3 rounded-lg shadow-lg border-2 border-blue-400 opacity-90">
            <p className="font-medium text-sm">
              {activeItem.item.nomActe || activeItem.item.name}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

/**
 * Groupe de liste (colonne) avec zone de drop
 */
export const ListGroup = ({ children, groupId, className, onDrop }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: groupId, // Utiliser directement groupId sans préfixe
    data: {
      groupId,
      type: 'group',
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mb-4 transition-all",
        isOver && "ring-2 ring-blue-400 ring-offset-2 rounded-lg",
        className
      )}
      data-group-id={groupId}
    >
      {children}
    </div>
  );
};

/**
 * En-tête de liste
 */
export const ListHeader = ({ children, color, count, className }) => {
  return (
    <div 
      className={cn(
        "p-3 rounded-t-lg text-white font-medium flex items-center justify-between",
        className
      )}
      style={{ backgroundColor: color }}
    >
      <span>{children}</span>
      {count !== undefined && (
        <span className="bg-white/20 px-2 py-1 rounded text-sm">
          {count}
        </span>
      )}
    </div>
  );
};

/**
 * Conteneur des items de liste
 */
export const ListItems = ({ children, className }) => {
  return (
    <div className={cn(
      "bg-gray-50 rounded-b-lg p-3 space-y-2 min-h-[400px]",
      className
    )}>
      {children}
    </div>
  );
};

/**
 * Item de liste draggable avec @dnd-kit
 */
export const ListItem = ({ 
  item, 
  groupId, 
  children, 
  className,
  ...props 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: item.id,
    data: {
      item,
      groupId,
      type: 'item',
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "bg-white p-3 rounded-lg shadow-sm border border-gray-200",
        "hover:shadow-md transition-all cursor-move",
        "transform hover:scale-[1.02]",
        isDragging && "opacity-50 scale-95",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Hook pour utiliser le contexte (pour compatibilité)
 * Retourne toujours le même objet pour éviter les problèmes de Fast Refresh
 */
const emptyListContext = {
  draggedItem: null,
  draggedFromGroup: null,
  handleDragStart: () => {},
  handleDragEnd: () => {},
};

export function useList() {
  // Ce hook n'est plus nécessaire avec @dnd-kit mais on le garde pour la compatibilité
  return emptyListContext;
}