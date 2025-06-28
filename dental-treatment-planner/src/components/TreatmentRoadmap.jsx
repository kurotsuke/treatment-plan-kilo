import React, { useState, useMemo, useCallback } from 'react';
import {
  GanttChartSquareIcon,
  ListIcon,
  KanbanSquareIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import RelativeGanttView from './gantt/RelativeGanttView';
import {
  ListProvider,
  ListGroup,
  ListHeader,
  ListItems,
  ListItem
} from './ui/list';

/**
 * Convertit une durée relative en jours
 */
function dureeEnJours(duree) {
  // Nouveau format Mermaid: "1d", "2w", "3m"
  if (typeof duree === 'string') {
    const match = duree.match(/^(\d+)([dwmh])$/);
    if (match) {
      const valeur = parseInt(match[1]);
      const unite = match[2];
      const conversions = {
        'h': 1/24,  // heures
        'd': 1,     // jours
        'w': 7,     // semaines
        'm': 30     // mois
      };
      return valeur * (conversions[unite] || 1);
    }
    return 1; // Par défaut 1 jour
  }
  
  // Ancien format: { valeur: 1, unite: "jour" }
  if (!duree || !duree.valeur || !duree.unite) return 1;
  
  const conversions = {
    'jour': 1,
    'jours': 1,
    'semaine': 7,
    'semaines': 7,
    'mois': 30,
    'month': 30,
    'months': 30
  };
  
  const multiplicateur = conversions[duree.unite.toLowerCase()] || 1;
  return duree.valeur * multiplicateur;
}

/**
 * Calcule la date de début d'une tâche en fonction de ses dépendances
 */
function calculerDateDebut(tache, tachesMap, dateDebutProjet) {
  if (!tache.dependances || tache.dependances.length === 0) {
    return new Date(dateDebutProjet);
  }
  
  let dateMax = new Date(dateDebutProjet);
  
  for (const dep of tache.dependances) {
    const tachePrecedente = tachesMap.get(dep.id_tache_precedente);
    if (!tachePrecedente) continue;
    
    let dateCalculee;
    const decalageJours = dep.decalage ? dureeEnJours(dep.decalage) : 0;
    
    switch (dep.type) {
      case 'fin-debut':
      case 'FD':
        dateCalculee = new Date(tachePrecedente.endAt);
        dateCalculee.setDate(dateCalculee.getDate() + decalageJours);
        break;
      case 'debut-debut':
      case 'DD':
        dateCalculee = new Date(tachePrecedente.startAt);
        dateCalculee.setDate(dateCalculee.getDate() + decalageJours);
        break;
      case 'fin-fin':
      case 'FF':
        const dureeTache = dureeEnJours(tache.duree);
        dateCalculee = new Date(tachePrecedente.endAt);
        dateCalculee.setDate(dateCalculee.getDate() + decalageJours - dureeTache);
        break;
      case 'debut-fin':
      case 'DF':
        const dureeTache2 = dureeEnJours(tache.duree);
        dateCalculee = new Date(tachePrecedente.startAt);
        dateCalculee.setDate(dateCalculee.getDate() + decalageJours - dureeTache2);
        break;
      default:
        dateCalculee = new Date(tachePrecedente.endAt);
        dateCalculee.setDate(dateCalculee.getDate() + decalageJours);
    }
    
    if (dateCalculee > dateMax) {
      dateMax = dateCalculee;
    }
  }
  
  return dateMax;
}

/**
 * Vue Liste pour afficher les tâches par statut avec drag & drop
 */
const ListView = ({ tasks, onTaskStatusChange }) => {
  const statuses = [
    { id: 'planned', name: 'Planifié', color: '#6B7280' },
    { id: 'in-progress', name: 'En cours', color: '#F59E0B' },
    { id: 'completed', name: 'Terminé', color: '#10B981' }
  ];

  const tasksByStatus = useMemo(() => {
    const grouped = {};
    statuses.forEach(status => {
      grouped[status.id] = tasks.filter(task =>
        (task.status?.id || 'planned') === status.id
      );
    });
    return grouped;
  }, [tasks]);

  const handleDragEnd = (task, fromStatus, toStatus) => {
    if (fromStatus !== toStatus && task && task.id) {
      onTaskStatusChange?.(task.id, toStatus);
    }
  };

  return (
    <ListProvider onDragEnd={handleDragEnd}>
      <div className="p-4 max-w-4xl mx-auto">
        {statuses.map(status => (
          <ListGroup key={status.id} groupId={status.id}>
            <ListHeader color={status.color} count={tasksByStatus[status.id].length}>
              {status.name}
            </ListHeader>
            <ListItems>
              {tasksByStatus[status.id].map(task => (
                <ListItem
                  key={task.id}
                  item={task}
                  groupId={status.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: task.status?.color || status.color }}
                        />
                        <p className="font-medium text-sm">{task.nomActe || task.name}</p>
                      </div>
                      {task.dents && task.dents.length > 0 && (
                        <p className="text-xs text-gray-500 ml-4">
                          Dents: {task.dents.join(', ')}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {new Date(task.startAt).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {task.duree ? `${task.duree.valeur} ${task.duree.unite}` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    {task.owner && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.owner.image} />
                        <AvatarFallback className="text-xs">
                          {task.owner.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </ListItem>
              ))}
            </ListItems>
          </ListGroup>
        ))}
      </div>
    </ListProvider>
  );
};

/**
 * Vue Kanban pour afficher les tâches par phase
 */
const KanbanView = ({ tasks, onTaskPhaseChange }) => {
  const phases = [
    { id: 1, name: 'Phase 1 - Soins', color: '#3b82f6' },
    { id: 2, name: 'Phase 2 - Fonctionnelle', color: '#10b981' },
    { id: 3, name: 'Phase 3 - Esthétique', color: '#8b5cf6' }
  ];

  const tasksByPhase = useMemo(() => {
    const grouped = {};
    phases.forEach(phase => {
      grouped[phase.id] = tasks.filter(task => task.phase === phase.id);
    });
    return grouped;
  }, [tasks]);

  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className="flex gap-4 p-4 overflow-x-auto">
      {phases.map(phase => (
        <div key={phase.id} className="flex-1 min-w-[350px]">
          <div 
            className="p-3 rounded-t-lg text-white font-medium flex items-center justify-between"
            style={{ backgroundColor: phase.color }}
          >
            <span>{phase.name}</span>
            <span className="bg-white/20 px-2 py-1 rounded text-sm">
              {tasksByPhase[phase.id].length} tâches
            </span>
          </div>
          <div className="bg-gray-50 rounded-b-lg p-3 space-y-3 min-h-[500px]">
            {tasksByPhase[phase.id].map(task => (
              <div
                key={task.id}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-move"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData('taskId');
                  onTaskPhaseChange?.(taskId, phase.id);
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm flex-1">{task.nomActe || task.name}</h4>
                  {task.owner && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.owner.image} />
                      <AvatarFallback className="text-xs">
                        {task.owner.name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                
                {task.dents && task.dents.length > 0 && (
                  <p className="text-xs text-gray-600 mb-2">
                    Dents: {task.dents.join(', ')}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {dateFormatter.format(new Date(task.startAt))} - {dateFormatter.format(new Date(task.endAt))}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3" />
                    {task.owner?.name || 'Non assigné'}
                  </span>
                </div>
                
                {task.dependances && task.dependances.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Dépend de {task.dependances.length} tâche(s)
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Composant principal pour afficher la roadmap du plan de traitement
 */
const TreatmentRoadmap = ({
  treatmentPlanData,
  onDateChange,
  onTaskUpdate,
  onDiagramStateChange,  // ✅ AJOUT: Callback pour l'état JSON du diagramme
  className = ""
}) => {
  const [activeView, setActiveView] = useState('gantt');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  
  // ✅ AJOUT: État pour stocker l'état JSON du diagramme
  const [diagramJsonState, setDiagramJsonState] = useState({});
  const [showJsonSection, setShowJsonSection] = useState(false);

  // Debug mode seulement - échantillonnage pour éviter le spam
  if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
    console.log('[TreatmentRoadmap] Props reçues (échantillon):', {
      hasTreatmentPlanData: !!treatmentPlanData,
      tachesLength: treatmentPlanData?.taches?.length,
      hasSections: !!treatmentPlanData?.sections
    });
  }

  // Transformer les données pour les vues Liste et Kanban
  const initialTransformedTasks = useMemo(() => {
    
    // Gérer différents formats de données possibles
    let data = treatmentPlanData;
    
    // Si les données sont une chaîne JSON, les parser
    if (typeof data === 'string') {
      try {
        // Nettoyer les backticks markdown si présents
        let cleanedData = data;
        
        // Retirer les backticks markdown (```json au début et ``` à la fin)
        if (cleanedData.includes('```json')) {
          console.log('[TreatmentRoadmap] 🧹 Nettoyage des backticks markdown détectés');
          cleanedData = cleanedData.replace(/```json\s*/g, '');
          cleanedData = cleanedData.replace(/```\s*$/g, '');
          cleanedData = cleanedData.trim();
        }
        
        // Aussi gérer le cas où il y a juste ``` au début
        if (cleanedData.startsWith('```')) {
          cleanedData = cleanedData.replace(/^```\w*\s*/, '');
          cleanedData = cleanedData.replace(/```\s*$/, '');
          cleanedData = cleanedData.trim();
        }
        
        data = JSON.parse(cleanedData);
      } catch (e) {
        console.error('[TreatmentRoadmap] ❌ Erreur parsing string:', e);
        console.error('[TreatmentRoadmap] ❌ String originale:', data?.substring(0, 200) + '...');
        return [];
      }
    }
    
    // Si les données sont dans geminiRawResponse
    if (!data?.taches && data?.geminiRawResponse) {
      
      try {
        let rawData = data.geminiRawResponse;
        
        // Si geminiRawResponse est une chaîne, la nettoyer et parser
        if (typeof rawData === 'string') {
          // Nettoyer les backticks markdown si présents
          let cleanedRawData = rawData;
          
          if (cleanedRawData.includes('```json')) {
            console.log('[TreatmentRoadmap] 🧹 Nettoyage des backticks dans geminiRawResponse');
            cleanedRawData = cleanedRawData.replace(/```json\s*/g, '');
            cleanedRawData = cleanedRawData.replace(/```\s*$/g, '');
            cleanedRawData = cleanedRawData.trim();
          }
          
          if (cleanedRawData.startsWith('```')) {
            cleanedRawData = cleanedRawData.replace(/^```\w*\s*/, '');
            cleanedRawData = cleanedRawData.replace(/```\s*$/, '');
            cleanedRawData = cleanedRawData.trim();
          }
          
          rawData = JSON.parse(cleanedRawData);
        }
        
        if (rawData.taches) {
          data = rawData;
          console.log('[TreatmentRoadmap] ✅ LOG 4 - Données extraites de geminiRawResponse après nettoyage:', data);
        }
      } catch (e) {
        console.error('[TreatmentRoadmap] ❌ Erreur parsing geminiRawResponse:', e);
      }
    }
    
    // Gérer le nouveau format avec "sections" (format Mermaid-like)
    if (!data?.taches && data?.sections) {
      console.log('[TreatmentRoadmap] 🔄 LOG 4B - Détection du nouveau format "sections"');
      
      // Convertir le nouveau format en ancien format pour la compatibilité
      const tachesFromSections = [];
      let phaseNumber = 1;
      
      // Parcourir chaque section (phase)
      for (const [phaseName, tasks] of Object.entries(data.sections)) {
        // Extraire le numéro de phase du nom si possible
        const phaseMatch = phaseName.match(/Phase (\d+)/);
        if (phaseMatch) {
          phaseNumber = parseInt(phaseMatch[1]);
        }
        
        // Convertir chaque tâche du nouveau format vers l'ancien
        tasks.forEach(task => {
          // ✅ AJOUT: Conversion des dents string vers array
          let dents = [];
          if (task.dents) {
            if (typeof task.dents === 'string') {
              // L'IA retourne parfois les dents comme string: "15, 24, 25"
              dents = task.dents.split(',').map(d => d.trim()).filter(d => d.length > 0);
            } else if (Array.isArray(task.dents)) {
              // L'IA retourne les dents comme array: ["15", "24", "25"]
              dents = task.dents;
            }
          }
          
          const tacheConvertie = {
            id: task.id,
            nom: task.task,
            phase: phaseNumber,
            duree: task.duration, // Sera géré par dureeEnJours()
            dependances: task.after ? [{ id_tache_precedente: task.after, type: 'FD' }] : [],
            medecin: task.assignedTo,
            statut: task.done ? 'completed' : 'planned',
            type: task.type, // clinique, cicatrisation, administratif
            dents: dents // ✅ AJOUT: Préserver les dents converties
          };
          tachesFromSections.push(tacheConvertie);
        });
        
        phaseNumber++;
      }
      
      // Remplacer les données par le format converti
      data = { ...data, taches: tachesFromSections };
      console.log('[TreatmentRoadmap] ✅ LOG 4C - Conversion du format "sections" vers "taches":', data);
    }
    
    // LOG final avant traitement
    console.log('[TreatmentRoadmap] 📊 LOG 5 - Format final des données:', {
      hasData: !!data,
      hasTaches: !!data?.taches,
      hasSections: !!data?.sections,
      tachesCount: data?.taches?.length || 0,
      firstTask: data?.taches?.[0] || null,
      dataStructure: data
    });
    
    if (!data || (!data.taches && !data.sections)) {
      console.error('[TreatmentRoadmap] ❌ Aucune tâche trouvée dans la structure finale');
      return [];
    }
    
    // Vérifier si taches est un tableau vide
    if (data.taches && Array.isArray(data.taches) && data.taches.length === 0) {
      console.warn('[TreatmentRoadmap] ⚠️ Le tableau taches est vide !');
      // Si on a aussi des sections, on devrait continuer avec la conversion
      if (!data.sections || Object.keys(data.sections).length === 0) {
        console.error('[TreatmentRoadmap] ❌ Aucune tâche dans taches ET aucune section');
        return [];
      }
    }

    const tachesMap = new Map();
    const tasks = [];
    
    // CORRECTION: Utiliser 'data.taches' au lieu de 'treatmentPlanData.taches'
    // Vérifier que data.taches existe et n'est pas vide
    if (!data.taches || data.taches.length === 0) {
      console.error('[TreatmentRoadmap] ❌ data.taches est vide ou inexistant:', {
        hasTaches: !!data.taches,
        tachesLength: data.taches?.length || 0,
        hasSections: !!data.sections,
        sectionsLength: data.sections ? Object.keys(data.sections).length : 0
      });
      return [];
    }
    
    const sortedTasks = [...data.taches].sort((a, b) => {
      const phaseA = a.phase || 0;
      const phaseB = b.phase || 0;
      return phaseA - phaseB;
    });
    
    // Définir les groupes par phase
    const phaseGroups = {
      1: { id: 'phase-1', name: 'Phase 1 - Soins' },
      2: { id: 'phase-2', name: 'Phase 2 - Fonctionnelle' },
      3: { id: 'phase-3', name: 'Phase 3 - Esthétique' }
    };
    
    // Définir les produits/initiatives/releases par défaut
    const defaultProduct = { id: 'dental-treatment', name: 'Plan de traitement dentaire' };
    const defaultInitiative = { id: 'patient-care', name: 'Soins du patient' };
    const defaultRelease = { id: 'treatment-v1', name: 'Traitement V1' };
    
    // Calculer les dates pour chaque tâche
    sortedTasks.forEach(tache => {
      const dateDebutTache = calculerDateDebut(tache, tachesMap, startDate);
      const dureeJours = dureeEnJours(tache.duree);
      const dateFinTache = new Date(dateDebutTache);
      dateFinTache.setDate(dateFinTache.getDate() + dureeJours);
      
      // Extraire les informations - gérer les deux formats possibles
      let nomActe = tache.nom;
      let dents = [];
      
      // Format 1: "Acte (dents: XX,XX)"
      if (tache.nom.includes(' (dents: ')) {
        const [nom, dentsInfo] = tache.nom.split(' (dents: ');
        nomActe = nom;
        dents = dentsInfo ? dentsInfo.replace(')', '').split(',').map(d => d.trim()) : [];
      }
      // Format 2: "Acte (XX,XX)" - format retourné par l'IA
      else if (tache.nom.includes('(') && tache.nom.includes(')')) {
        const match = tache.nom.match(/^(.+?)\s*\(([^)]+)\)$/);
        if (match) {
          nomActe = match[1].trim();
          const dentsString = match[2];
          // Vérifier si le contenu entre parenthèses ressemble à des numéros de dents
          if (/^\d+(?:,\s*\d+)*$/.test(dentsString)) {
            dents = dentsString.split(',').map(d => d.trim());
          }
        }
      }
      
      // Transformer les dépendances vers le format simplifié "after"
      let dependancesTransformees = [];
      if (tache.dependances) {
        console.log('[TreatmentRoadmap] 🔄 Transformation des dépendances pour tâche:', tache.id, {
          formatOriginal: tache.dependances,
          type: Array.isArray(tache.dependances) ? 'array' : typeof tache.dependances
        });
        
        if (Array.isArray(tache.dependances)) {
          dependancesTransformees = tache.dependances.map(dep => {
            // Format simplifié pour "after"
            let idPrecedent;
            let decalage = { valeur: 0, unite: 'jour' };
            
            if (typeof dep === 'string') {
              // Format simple: juste l'ID
              idPrecedent = dep;
            } else if (typeof dep === 'object') {
              // Format objet
              idPrecedent = dep.after || dep.id_tache_precedente || dep.id;
              if (dep.decalage) {
                decalage = dep.decalage;
              }
            } else {
              console.warn('[TreatmentRoadmap] ⚠️ Format de dépendance non reconnu:', dep);
              return null;
            }
            
            console.log('[TreatmentRoadmap] 🔨 Transformation en format "after":', {
              original: dep,
              transformed: { after: idPrecedent, decalage }
            });
            
            return {
              id_tache_precedente: idPrecedent,
              type: 'after', // Toujours "after" dans le nouveau système
              decalage: decalage
            };
          }).filter(dep => dep !== null); // Filtrer les dépendances invalides
        }
        
        console.log('[TreatmentRoadmap] ✨ Dépendances transformées en "after":', dependancesTransformees);
      }
      
      // Déterminer le médecin - CORRECTION: utiliser 'data' au lieu de 'treatmentPlanData'
      let medecin = tache.medecin || data.medecins_par_phase?.[`${tache.phase} - Phase`] || 'Dr. Inconnu';
      
      // Déterminer la couleur selon la phase
      const phaseColors = {
        1: '#3b82f6', // Bleu pour phase 1
        2: '#10b981', // Vert pour phase 2
        3: '#8b5cf6'  // Violet pour phase 3
      };
      
      // Générer un avatar pour le médecin (utilise les initiales)
      const getInitials = (name) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
          return parts[0][0] + parts[parts.length - 1][0];
        }
        return name.slice(0, 2).toUpperCase();
      };
      
      const transformedTask = {
        id: tache.id,
        name: tache.nom,
        nomActe: nomActe,
        dents: dents,
        startAt: dateDebutTache,
        endAt: dateFinTache,
        status: {
          id: tache.statut || 'planned',
          name: tache.statut === 'completed' ? 'Terminé' : tache.statut === 'in-progress' ? 'En cours' : 'Planifié',
          color: tache.statut === 'completed' ? '#10B981' : tache.statut === 'in-progress' ? '#F59E0B' : '#6B7280'
        },
        owner: {
          id: `owner-${medecin.toLowerCase().replace(/\s+/g, '-')}`,
          name: medecin,
          image: '', // Pas d'image, on utilisera les initiales
          initials: getInitials(medecin)
        },
        group: phaseGroups[tache.phase] || phaseGroups[1],
        product: defaultProduct,
        initiative: defaultInitiative,
        release: defaultRelease,
        phase: tache.phase,
        duree: tache.duree,
        dependances: dependancesTransformees // Utiliser les dépendances transformées
      };
      
      tachesMap.set(tache.id, transformedTask);
      tasks.push(transformedTask);
    });
    
    return tasks;
  }, [treatmentPlanData, startDate]);

  // État local pour les tâches transformées (pour le drag & drop)
  const [transformedTasks, setTransformedTasks] = useState(initialTransformedTasks);

  // LOG du cycle de vie
  React.useEffect(() => {
    console.log('[TreatmentRoadmap] 🔄 Composant monté/mis à jour', {
      hasTreatmentPlanData: !!treatmentPlanData,
      tachesCount: treatmentPlanData?.taches?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    return () => {
      console.log('[TreatmentRoadmap] 🔚 Composant démonté', {
        timestamp: new Date().toISOString()
      });
    };
  }, []);

  // Mettre à jour les tâches transformées quand les données changent
  React.useEffect(() => {
    console.log('[TreatmentRoadmap] 📊 Mise à jour des tâches transformées', {
      oldCount: transformedTasks.length,
      newCount: initialTransformedTasks.length,
      hasData: initialTransformedTasks.length > 0
    });
    setTransformedTasks(initialTransformedTasks);
  }, [initialTransformedTasks]);

  // Définir les vues disponibles
  const views = [
    {
      id: 'gantt',
      label: 'Gantt',
      icon: GanttChartSquareIcon
    },
    {
      id: 'list',
      label: 'Liste',
      icon: ListIcon
    },
    {
      id: 'kanban',
      label: 'Kanban',
      icon: KanbanSquareIcon
    }
  ];

  // Fonction pour rendre la vue active
  const renderActiveView = () => {
    switch (activeView) {
      case 'gantt':
        return (
          <RelativeGanttView
            data={treatmentPlanData}
            onDateChange={(date) => {
              setStartDate(date);
              onDateChange?.(date);
            }}
            onTaskUpdate={(taskId, updates) => {
              console.log('[TreatmentRoadmap] Task update:', { taskId, updates });
              
              // PROTECTION: Ne pas appeler onTaskUpdate si les données sont vides ou invalides
              if (!taskId || (updates.treatmentPlanData && (!updates.treatmentPlanData.taches || updates.treatmentPlanData.taches.length === 0))) {
                console.error('[TreatmentRoadmap] ❌❌❌ REJET: Tentative de mise à jour avec des données vides!', {
                  taskId,
                  updates,
                  hasTraitmentPlanData: !!updates.treatmentPlanData,
                  tachesCount: updates.treatmentPlanData?.taches?.length || 0,
                  stackTrace: new Error().stack
                });
                return;
              }
              
              onTaskUpdate?.({ taskId, ...updates });
            }}
            onDependencyUpdate={(taskId, dependencies) => {
              console.log('[TreatmentRoadmap] Dependency update:', { taskId, dependencies });
              
              // Appeler le callback pour persister les changements avec le bon format
              onTaskUpdate?.({
                taskId,
                dependencies
              });
            }}
            onDiagramStateChange={(jsonState) => {
              // ✅ AJOUT: Mettre à jour l'état local
              setDiagramJsonState(jsonState);
              
              // ✅ AJOUT: Passer l'état JSON au parent via le callback existant
              if (onDiagramStateChange && typeof onDiagramStateChange === 'function') {
                onDiagramStateChange(jsonState);
              }
            }}
          />
        );
      
      case 'list':
        return (
          <ListView
            tasks={transformedTasks}
            onTaskStatusChange={(taskId, newStatus) => {
              // Mettre à jour l'état local immédiatement
              setTransformedTasks(prevTasks =>
                prevTasks.map(task =>
                  task.id === taskId
                    ? {
                        ...task,
                        status: {
                          id: newStatus,
                          name: newStatus === 'completed' ? 'Terminé' : newStatus === 'in-progress' ? 'En cours' : 'Planifié',
                          color: newStatus === 'completed' ? '#10B981' : newStatus === 'in-progress' ? '#F59E0B' : '#6B7280'
                        }
                      }
                    : task
                )
              );
              // Appeler le callback pour persister les changements
              onTaskUpdate?.({ taskId, status: newStatus });
            }}
          />
        );
      
      case 'kanban':
        return (
          <KanbanView
            tasks={transformedTasks}
            onTaskPhaseChange={(taskId, newPhase) => {
              // Mettre à jour l'état local immédiatement
              setTransformedTasks(prevTasks =>
                prevTasks.map(task =>
                  task.id === taskId
                    ? { ...task, phase: newPhase }
                    : task
                )
              );
              // Appeler le callback pour persister les changements
              onTaskUpdate?.({ taskId, phase: newPhase });
            }}
          />
        );
      
      default:
        return null;
    }
  };

  // Vérification améliorée avec gestion du parsing
  const hasValidData = useMemo(() => {
    console.log('[TreatmentRoadmap] 🔍 Vérification des données pour l\'affichage', {
      hasData: !!treatmentPlanData,
      dataType: typeof treatmentPlanData,
      dataKeys: treatmentPlanData ? Object.keys(treatmentPlanData) : null,
      hasTaches: !!treatmentPlanData?.taches,
      tachesLength: treatmentPlanData?.taches?.length || 0,
      hasSections: !!treatmentPlanData?.sections,
      sectionsKeys: treatmentPlanData?.sections ? Object.keys(treatmentPlanData.sections) : null
    });
    
    // Si pas de données du tout
    if (!treatmentPlanData) {
      console.log('[TreatmentRoadmap] ❌ Pas de treatmentPlanData');
      return false;
    }
    
    // IMPORTANT: Vérifier d'abord le format "sections" (nouveau format)
    if (treatmentPlanData.sections && Object.keys(treatmentPlanData.sections).length > 0) {
      console.log('[TreatmentRoadmap] ✅ Format direct avec sections trouvé', {
        sectionsCount: Object.keys(treatmentPlanData.sections).length,
        sectionNames: Object.keys(treatmentPlanData.sections)
      });
      return true;
    }
    
    // Ensuite vérifier le format direct avec taches
    if (treatmentPlanData.taches && treatmentPlanData.taches.length > 0) {
      console.log('[TreatmentRoadmap] ✅ Format direct avec taches trouvé');
      return true;
    }
    
    // Vérifier après parsing potentiel
    let data = treatmentPlanData;
    
    // Si c'est une string, essayer de parser
    if (typeof data === 'string') {
      try {
        // Nettoyer les backticks markdown si présents
        let cleanedData = data;
        
        if (cleanedData.includes('```json')) {
          cleanedData = cleanedData.replace(/```json\s*/g, '');
          cleanedData = cleanedData.replace(/```\s*$/g, '');
          cleanedData = cleanedData.trim();
        }
        
        if (cleanedData.startsWith('```')) {
          cleanedData = cleanedData.replace(/^```\w*\s*/, '');
          cleanedData = cleanedData.replace(/```\s*$/, '');
          cleanedData = cleanedData.trim();
        }
        
        data = JSON.parse(cleanedData);
        if ((data.taches && data.taches.length > 0) || (data.sections && Object.keys(data.sections).length > 0)) {
          console.log('[TreatmentRoadmap] ✅ Format trouvé après parsing string avec nettoyage');
          return true;
        }
      } catch (e) {
        console.log('[TreatmentRoadmap] ⚠️ Échec du parsing string');
      }
    }
    
    // Vérifier dans geminiRawResponse
    if (data.geminiRawResponse) {
      try {
        let rawData = data.geminiRawResponse;
        
        if (typeof rawData === 'string') {
          // Nettoyer les backticks
          let cleanedRawData = rawData;
          
          if (cleanedRawData.includes('```json')) {
            cleanedRawData = cleanedRawData.replace(/```json\s*/g, '');
            cleanedRawData = cleanedRawData.replace(/```\s*$/g, '');
            cleanedRawData = cleanedRawData.trim();
          }
          
          if (cleanedRawData.startsWith('```')) {
            cleanedRawData = cleanedRawData.replace(/^```\w*\s*/, '');
            cleanedRawData = cleanedRawData.replace(/```\s*$/, '');
            cleanedRawData = cleanedRawData.trim();
          }
          
          rawData = JSON.parse(cleanedRawData);
        }
        
        if ((rawData.taches && rawData.taches.length > 0) || (rawData.sections && Object.keys(rawData.sections).length > 0)) {
          console.log('[TreatmentRoadmap] ✅ Format trouvé dans geminiRawResponse avec nettoyage');
          return true;
        }
      } catch (e) {
        console.log('[TreatmentRoadmap] ⚠️ Échec du parsing geminiRawResponse');
      }
    }
    
    console.log('[TreatmentRoadmap] ❌ Aucun format valide trouvé', {
      data: treatmentPlanData,
      keys: treatmentPlanData ? Object.keys(treatmentPlanData) : null
    });
    return false;
  }, [treatmentPlanData]);

  if (!hasValidData) {
    console.log('[TreatmentRoadmap] 🚫 Affichage du message "Aucun plan" car hasValidData = false', {
      treatmentPlanData,
      hasValidData
    });
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun plan de traitement</h3>
          <p className="text-gray-500">Générez un plan de traitement pour visualiser la roadmap.</p>
          {/* Debug info en développement */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-gray-400">
              <p>Debug: treatmentPlanData type = {typeof treatmentPlanData}</p>
              <p>Keys: {treatmentPlanData ? Object.keys(treatmentPlanData).join(', ') : 'null'}</p>
              <p>Has sections: {treatmentPlanData?.sections ? 'Yes' : 'No'}</p>
              <p>Has taches: {treatmentPlanData?.taches ? 'Yes' : 'No'}</p>
              {treatmentPlanData?.sections && (
                <p>Sections count: {Object.keys(treatmentPlanData.sections).length}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* En-tête avec sélecteur de vue */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Roadmap du plan de traitement</h3>
          <div className="flex items-center gap-2">
            {views.map(view => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${activeView === view.id 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <view.icon className="w-4 h-4" />
                <span>{view.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu de la vue active */}
      <div className="overflow-hidden">
        {renderActiveView()}
      </div>
      
      {/* ✅ AJOUT: Section JSON pour les développeurs */}
      <div className="border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => setShowJsonSection(!showJsonSection)}
          className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-between"
        >
          <span>🔧 JSON pour les développeurs</span>
          <span className={`transform transition-transform ${showJsonSection ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {showJsonSection && (
          <div className="px-4 pb-4">
            <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400">
                  État du diagramme en temps réel (mise à jour: {diagramJsonState.metadata?.lastUpdate ? new Date(diagramJsonState.metadata.lastUpdate).toLocaleTimeString('fr-FR') : 'N/A'})
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(diagramJsonState, null, 2));
                    // Optionnel: ajouter une notification de copie
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  📋 Copier
                </button>
              </div>
              <pre className="text-xs text-green-400 font-mono overflow-auto">
                {Object.keys(diagramJsonState).length > 0
                  ? JSON.stringify(diagramJsonState, null, 2)
                  : '{\n  "message": "Aucune donnée de diagramme disponible"\n}'
                }
              </pre>
            </div>
            
            {/* Statistiques rapides */}
            {diagramJsonState.metadata && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-lg font-bold text-blue-600">{diagramJsonState.metadata.totalTasks || 0}</div>
                  <div className="text-xs text-gray-500">Tâches</div>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-lg font-bold text-green-600">{diagramJsonState.metadata.totalMilestones || 0}</div>
                  <div className="text-xs text-gray-500">Jalons</div>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-lg font-bold text-purple-600">{diagramJsonState.dependencies?.length || 0}</div>
                  <div className="text-xs text-gray-500">Dépendances</div>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-lg font-bold text-orange-600">{Object.keys(diagramJsonState.configuration?.taskOverrides || {}).length}</div>
                  <div className="text-xs text-gray-500">Overrides</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TreatmentRoadmap;