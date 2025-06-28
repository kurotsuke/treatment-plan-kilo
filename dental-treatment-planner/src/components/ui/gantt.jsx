import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import ToothBadgeContainer from '../gantt/ToothBadgeContainer';

// Context pour partager les données du Gantt
const GanttContext = createContext({
  zoom: 100,
  range: 'monthly',
  columnWidth: 150,
  headerHeight: 60,
  sidebarWidth: 300,
  rowHeight: 36,
});

// Provider principal du Gantt
export const GanttProvider = ({ 
  children, 
  className,
  zoom = 100,
  range = 'monthly'
}) => {
  const scrollRef = useRef(null);
  const columnWidth = range === 'monthly' ? 150 : 100;
  const headerHeight = 60;
  const sidebarWidth = 300;
  const rowHeight = 36;

  const cssVariables = {
    '--gantt-zoom': `${zoom}`,
    '--gantt-column-width': `${(zoom / 100) * columnWidth}px`,
    '--gantt-header-height': `${headerHeight}px`,
    '--gantt-row-height': `${rowHeight}px`,
    '--gantt-sidebar-width': `${sidebarWidth}px`,
  };

  return (
    <GanttContext.Provider
      value={{
        zoom,
        range,
        headerHeight,
        columnWidth,
        sidebarWidth,
        rowHeight,
      }}
    >
      <div
        className={cn(
          'gantt relative grid h-full w-full flex-none select-none overflow-auto rounded-sm bg-gray-50',
          className
        )}
        style={{
          ...cssVariables,
          gridTemplateColumns: 'var(--gantt-sidebar-width) 1fr',
        }}
        ref={scrollRef}
      >
        {children}
      </div>
    </GanttContext.Provider>
  );
};

// Sidebar du Gantt
export const GanttSidebar = ({ children, className }) => (
  <div
    className={cn(
      'sticky left-0 z-30 h-max min-h-full overflow-clip border-r border-gray-200 bg-white',
      className
    )}
  >
    <div
      className="sticky top-0 z-10 flex shrink-0 items-end justify-between gap-2.5 border-b border-gray-200 bg-white p-2.5 font-medium text-gray-600 text-xs"
      style={{ height: 'var(--gantt-header-height)' }}
    >
      <p className="flex-1 truncate text-left">Tâches</p>
      <p className="shrink-0">Durée</p>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

// Groupe dans la sidebar
export const GanttSidebarGroup = ({ children, name, className }) => (
  <div className={className}>
    <p
      style={{ height: 'var(--gantt-row-height)' }}
      className="w-full truncate p-2.5 text-left font-medium text-gray-600 text-xs"
    >
      {name}
    </p>
    <div className="divide-y divide-gray-200">{children}</div>
  </div>
);

// Item dans la sidebar
export const GanttSidebarItem = ({ feature, onSelectItem, onTeethUpdate, selectedTeeth, onToothSelect, className }) => {
  const handleClick = (event) => {
    // Empêcher la sélection si on clique sur les badges ou le container
    if (event.target.closest('[data-tooth-badge]') || event.target.closest('[data-tooth-container]')) {
      return;
    }
    if (event.target === event.currentTarget) {
      onSelectItem?.(feature.id);
    }
  };

  const formatDuration = (startAt, endAt) => {
    if (!endAt) return 'En cours';
    const days = Math.ceil((endAt - startAt) / (1000 * 60 * 60 * 24));
    return `${days} jour${days > 1 ? 's' : ''}`;
  };

  // Déterminer si on doit afficher les badges (seulement si des dents existent)
  const showToothBadges = feature.dents && feature.dents.length > 0;
  
  // Créer le texte de tooltip complet
  const taskName = feature.nomActe || feature.name;
  const tooltipText = showToothBadges
    ? `${taskName} (Dents: ${feature.dents.join(', ')})`
    : taskName;
  
  return (
    <div
      role="button"
      onClick={handleClick}
      tabIndex={0}
      title={tooltipText}
      className={cn(
        'relative flex items-center gap-2.5 px-2.5 text-xs hover:bg-gray-50 cursor-pointer',
        className
      )}
      style={{
        height: 'var(--gantt-row-height)', // ✅ Hauteur fixe
        minHeight: 'var(--gantt-row-height)',
        maxHeight: 'var(--gantt-row-height)', // ✅ Empêcher l'expansion
      }}
    >
      {/* Indicateur de statut */}
      <div
        className="pointer-events-none h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: feature.status?.color || '#6B7280',
        }}
      />
      
      {/* Nom de la tâche - ✅ Tronqué sur une seule ligne */}
      <p className="pointer-events-none text-left font-medium truncate flex-shrink-0 whitespace-nowrap overflow-hidden max-w-[120px]">
        {taskName}
      </p>
      
      {/* Container des badges de dents - ✅ Contraint à une seule ligne */}
      {showToothBadges && (
        <div className="flex-1 min-w-0 overflow-hidden">
          <ToothBadgeContainer
            taskId={feature.id}
            teeth={feature.dents}
            onTeethUpdate={onTeethUpdate}
            selectedTeeth={selectedTeeth}
            onToothSelect={onToothSelect}
            className="flex flex-wrap gap-1 max-h-[20px] overflow-hidden"
          />
        </div>
      )}
      
      {/* Durée - ✅ À la fin, toujours visible */}
      <p className="pointer-events-none text-gray-500 shrink-0 whitespace-nowrap">
        {formatDuration(feature.startAt, feature.endAt)}
      </p>
    </div>
  );
};

// Timeline du Gantt
export const GanttTimeline = ({ children, className }) => (
  <div
    className={cn(
      'relative flex h-full w-max flex-none overflow-clip',
      className
    )}
  >
    {children}
  </div>
);

// Header du timeline
export const GanttHeader = ({ className }) => {
  const gantt = useContext(GanttContext);
  
  // Générer les mois pour l'année en cours et les années adjacentes
  const months = [];
  const currentYear = new Date().getFullYear();
  
  for (let year = currentYear - 1; year <= currentYear + 1; year++) {
    for (let month = 0; month < 12; month++) {
      months.push({
        year,
        month,
        label: new Date(year, month).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
      });
    }
  }

  return (
    <div
      className={cn(
        'sticky top-0 z-20 flex h-full w-max bg-white border-b border-gray-200',
        className
      )}
      style={{ height: 'var(--gantt-header-height)' }}
    >
      {months.map(({ year, month, label }) => (
        <div
          key={`${year}-${month}`}
          className="flex items-center justify-center border-r border-gray-200 px-4"
          style={{ width: 'var(--gantt-column-width)' }}
        >
          <span className="text-xs font-medium text-gray-700">{label}</span>
        </div>
      ))}
    </div>
  );
};

// Liste des features dans le timeline
export const GanttFeatureList = ({ children, className }) => (
  <div
    className={cn('absolute top-0 left-0 h-full w-max space-y-4', className)}
    style={{ marginTop: 'var(--gantt-header-height)' }}
  >
    {children}
  </div>
);

// Groupe de features
export const GanttFeatureListGroup = ({ children, className }) => (
  <div className={className} style={{ paddingTop: 'var(--gantt-row-height)' }}>
    {children}
  </div>
);

// Item de feature dans le timeline
export const GanttFeatureItem = ({ 
  id,
  name,
  startAt,
  endAt,
  status,
  children,
  className 
}) => {
  const gantt = useContext(GanttContext);
  
  // Calculer la position et la largeur
  const calculatePosition = () => {
    const timelineStart = new Date(new Date().getFullYear() - 1, 0, 1);
    const monthsDiff = (startAt.getFullYear() - timelineStart.getFullYear()) * 12 + 
                      (startAt.getMonth() - timelineStart.getMonth());
    
    const daysInMonth = new Date(startAt.getFullYear(), startAt.getMonth() + 1, 0).getDate();
    const dayOffset = (startAt.getDate() - 1) / daysInMonth;
    
    const offset = (monthsDiff + dayOffset) * gantt.columnWidth * (gantt.zoom / 100);
    
    let width = gantt.columnWidth * (gantt.zoom / 100);
    if (endAt) {
      const endMonthsDiff = (endAt.getFullYear() - timelineStart.getFullYear()) * 12 + 
                           (endAt.getMonth() - timelineStart.getMonth());
      const endDaysInMonth = new Date(endAt.getFullYear(), endAt.getMonth() + 1, 0).getDate();
      const endDayOffset = (endAt.getDate() - 1) / endDaysInMonth;
      const endOffset = (endMonthsDiff + endDayOffset) * gantt.columnWidth * (gantt.zoom / 100);
      width = endOffset - offset;
    }
    
    return { offset, width: Math.max(width, 20) }; // Minimum 20px de largeur
  };

  const { offset, width } = calculatePosition();

  return (
    <div
      className={cn('relative flex w-max min-w-full py-0.5', className)}
      style={{ height: 'var(--gantt-row-height)' }}
    >
      <div
        className="absolute top-0.5"
        style={{
          height: 'calc(var(--gantt-row-height) - 4px)',
          width: `${width}px`,
          left: `${offset}px`,
          backgroundColor: status?.color || '#3b82f6',
          borderRadius: '4px',
          opacity: 0.9,
        }}
      >
        <div className="h-full w-full rounded bg-white/10 p-2 text-xs text-white shadow-sm">
          <div className="flex h-full w-full items-center justify-between gap-2">
            {children || <p className="flex-1 truncate font-medium">{name}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Marqueur (jalon)
export const GanttMarker = ({ id, date, label, className }) => {
  const gantt = useContext(GanttContext);
  
  const calculateOffset = () => {
    const timelineStart = new Date(new Date().getFullYear() - 1, 0, 1);
    const monthsDiff = (date.getFullYear() - timelineStart.getFullYear()) * 12 + 
                      (date.getMonth() - timelineStart.getMonth());
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const dayOffset = (date.getDate() - 1) / daysInMonth;
    
    return (monthsDiff + dayOffset) * gantt.columnWidth * (gantt.zoom / 100);
  };

  const offset = calculateOffset();

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-20 flex h-full select-none flex-col items-center justify-center overflow-visible"
      style={{
        width: 0,
        transform: `translateX(${offset}px)`,
      }}
    >
      <div
        className={cn(
          'pointer-events-auto sticky top-0 flex select-auto flex-col items-center justify-center whitespace-nowrap rounded-b-md px-2 py-1 text-xs',
          className || 'bg-blue-100 text-blue-900'
        )}
      >
        {label}
        <span className="text-xs opacity-80">
          {date.toLocaleDateString('fr-FR')}
        </span>
      </div>
      <div className={cn('h-full w-px', className ? className.replace('text-', 'bg-') : 'bg-blue-200')} />
    </div>
  );
};

// Marqueur "Aujourd'hui"
export const GanttToday = ({ className }) => {
  const today = new Date();
  return (
    <GanttMarker
      id="today"
      date={today}
      label="Aujourd'hui"
      className={className || "bg-red-100 text-red-800"}
    />
  );
};