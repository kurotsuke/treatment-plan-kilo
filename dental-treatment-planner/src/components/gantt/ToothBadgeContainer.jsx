import React, { useState, useContext, useRef, useEffect } from 'react';
import { useDroppable, useDndContext, useDraggable } from '@dnd-kit/core';
import ToothBadge from './ToothBadge';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { cn } from '../../lib/utils';

const ToothBadgeContainer = ({
  taskId,
  teeth = [],
  onTeethUpdate,
  selectedTeeth = new Set(),
  onToothSelect,
  className,
  maxWidth = 80, // Largeur maximale en pixels avant consolidation
}) => {
  const { active } = useDndContext();
  const { setNodeRef, isOver } = useDroppable({
    id: `tooth-container-${taskId}`,
    data: {
      type: 'tooth-container',
      taskId
    }
  });

  // Refs pour mesurer l'overflow
  const containerRef = useRef(null);
  const [shouldConsolidate, setShouldConsolidate] = useState(false);
  const [visibleTeethCount, setVisibleTeethCount] = useState(teeth.length);

  // Gérer la sélection locale si pas de prop onToothSelect
  const [localSelectedTeeth, setLocalSelectedTeeth] = useState(new Set());
  const actualSelectedTeeth = onToothSelect ? selectedTeeth : localSelectedTeeth;
  
  const handleToothSelect = (tooth, isMulti) => {
    if (onToothSelect) {
      // Utiliser le gestionnaire parent si fourni
      onToothSelect(tooth, isMulti, taskId);
    } else {
      // Gestion locale
      if (isMulti) {
        setLocalSelectedTeeth(prev => {
          const newSet = new Set(prev);
          if (newSet.has(tooth)) {
            newSet.delete(tooth);
          } else {
            newSet.add(tooth);
          }
          return newSet;
        });
      } else {
        setLocalSelectedTeeth(new Set([tooth]));
      }
    }
  };

  // Effet pour détecter l'overflow et décider de la consolidation
  useEffect(() => {
    if (teeth.length <= 2) {
      setShouldConsolidate(false);
      setVisibleTeethCount(teeth.length);
      return;
    }

    // Estimer l'espace nécessaire : ~20px par badge + gaps
    const estimatedWidth = teeth.length * 25; // 20px + 5px gap approx
    
    if (estimatedWidth > maxWidth) {
      setShouldConsolidate(true);
      // Ne montrer aucune dent individuelle, juste le badge consolidé
      setVisibleTeethCount(0);
    } else {
      setShouldConsolidate(false);
      setVisibleTeethCount(teeth.length);
    }
  }, [teeth.length, maxWidth]);

  // Badge consolidé draggable
  const ConsolidatedBadge = ({ count, allTeeth }) => {
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
    const [delayHandler, setDelayHandler] = useState(null);
    
    const {
      attributes,
      listeners,
      setNodeRef: setDragRef,
      transform,
      isDragging
    } = useDraggable({
      id: `consolidated-badge-${taskId}`,
      data: {
        type: 'tooth',
        sourceTaskId: taskId,
        teeth: allTeeth // Toutes les dents consolidées
      }
    });

    const handleMouseEnter = () => {
      if (delayHandler) {
        clearTimeout(delayHandler);
        setDelayHandler(null);
      }
      if (!isDragging) {
        setIsTooltipOpen(true);
      }
    };

    const handleMouseLeave = () => {
      const handler = setTimeout(() => {
        setIsTooltipOpen(false);
        setDelayHandler(null);
      }, 200); // Délai de 200ms avant fermeture
      setDelayHandler(handler);
    };

    const handleTooltipMouseEnter = () => {
      if (delayHandler) {
        clearTimeout(delayHandler);
        setDelayHandler(null);
      }
    };

    const handleTooltipMouseLeave = () => {
      setIsTooltipOpen(false);
    };
    
    return (
      <Tooltip open={isTooltipOpen && !isDragging} onOpenChange={setIsTooltipOpen}>
        <TooltipTrigger asChild>
          <span
            ref={setDragRef}
            {...attributes}
            {...listeners}
            className={cn(
              "inline-flex items-center rounded-full px-2 text-xs font-medium cursor-grab",
              "bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all duration-150",
              "select-none ring-1 ring-blue-300",
              isDragging && "opacity-50"
            )}
            style={transform ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
              zIndex: 1000
            } : undefined}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            X{count}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-white border border-gray-200 shadow-lg max-w-xs"
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div className="flex flex-wrap gap-1 p-1">
            {allTeeth.map(tooth => {
              const isToothDragging = active?.data?.current?.type === 'tooth' &&
                                     active?.data?.current?.sourceTaskId === taskId &&
                                     actualSelectedTeeth.has(tooth);
              
              return (
                <ToothBadge
                  key={tooth}
                  tooth={tooth}
                  taskId={taskId}
                  isSelected={actualSelectedTeeth.has(tooth)}
                  isDragging={isToothDragging}
                  onSelect={handleToothSelect}
                  selectedCount={actualSelectedTeeth.size}
                />
              );
            })}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-1 rounded transition-all duration-200",
        isOver && "ring-1 ring-blue-300 ring-offset-0",
        teeth.length === 0 && !isOver && "border border-dashed border-gray-200",
        className
      )}
      data-tooth-container
    >
      {teeth.length > 0 ? (
        <>
          {/* Afficher soit les dents individuelles, soit le badge consolidé - jamais les deux */}
          {shouldConsolidate ? (
            <ConsolidatedBadge
              count={teeth.length}
              allTeeth={teeth}
            />
          ) : (
            teeth.map(tooth => {
              const isDragging = active?.data?.current?.type === 'tooth' &&
                               active?.data?.current?.sourceTaskId === taskId &&
                               actualSelectedTeeth.has(tooth);
              
              return (
                <ToothBadge
                  key={tooth}
                  tooth={tooth}
                  taskId={taskId}
                  isSelected={actualSelectedTeeth.has(tooth)}
                  isDragging={isDragging}
                  onSelect={handleToothSelect}
                  selectedCount={actualSelectedTeeth.size}
                />
              );
            })
          )}
        </>
      ) : (
        <span className="text-xs text-gray-400 italic">
          {isOver ? "Déposer ici" : "Aucune dent"}
        </span>
      )}
    </div>
  );
};

export default ToothBadgeContainer;