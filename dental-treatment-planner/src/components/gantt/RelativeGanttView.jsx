import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { CalendarIcon, LinkIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureItem,
  GanttMarker,
  GanttToday
} from '../ui/gantt';
import DraggableTaskBarWithConnectors from './DraggableTaskBarWithConnectors';
import DependencyLinesSimplified from './DependencyLinesSimplified';
import { cn } from '../../lib/utils';

// Import des utilitaires
import { generateUniqueId } from './utils/idGenerator';
import {
  dureeEnJours,
  calculerDateDebut,
  formatDateForInput,
  addDays,
  daysBetween
} from './utils/dateCalculations';
import {
  calculateSmartDependentUpdates,
  recalculateDependentTasks,
  determineDependencyType,
  hasCircularDependency
} from './utils/dependencyCalculations';


/**
 * Composant pour afficher un diagramme Gantt avec dates relatives
 */
const RelativeGanttView = ({
  data,
  onDateChange,
  onTaskUpdate,
  onTaskAction,
  onDependencyUpdate,
  onDiagramStateChange,  // ✅ AJOUT: Callback pour l'état JSON du diagramme
  className = ""
}) => {
  // Props reçues - debug mode seulement
  if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
    console.log('[RelativeGanttView] 🔍 Props reçues (échantillon):', {
      hasData: !!data,
      dataType: typeof data,
      tachesCount: data?.taches?.length || 0,
      sectionsCount: data?.sections ? Object.keys(data.sections).length : 0
    });
  }
  // Date de début par défaut : aujourd'hui
  const [dateDebut, setDateDebut] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  
  const [activeId, setActiveId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [dependencies, setDependencies] = useState([]);
  const [previewConnection, setPreviewConnection] = useState(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  // État pour la gestion des dents sélectionnées
  const [selectedTeeth, setSelectedTeeth] = useState(new Set());
  const [selectedTeethTaskId, setSelectedTeethTaskId] = useState(null);
  
  // Configuration des sensors pour le drag & drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor)
  );
  
  // Debug: Log sensor activation
  React.useEffect(() => {
    console.log('[RelativeGanttView] Sensors configured:', {
      sensorCount: sensors.length,
      activeId,
      selectedTaskId
    });
  }, [sensors.length, activeId, selectedTaskId]);
  
  // Gérer la touche Shift pour les dépendances multiples
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // État local pour stocker les modifications temporaires des tâches
  const [taskOverrides, setTaskOverrides] = useState({});
  
  // État pour forcer le recalcul des positions après ajout de dépendances
  const [dependencyTrigger, setDependencyTrigger] = useState(0);
  
  // État local pour stocker les modifications de dents
  const [teethOverrides, setTeethOverrides] = useState({});
  
  // État pour stocker les overrides temporaires pendant le drag
  const [dragOverrides, setDragOverrides] = useState({});
  
  // État pour stocker les dates originales lors du début du drag
  const [dragStartDates, setDragStartDates] = useState({});
  
  // État pour tracker toutes les tâches affectées par le drag en cours
  const [draggedTaskIds, setDraggedTaskIds] = useState(new Set());
  
  // État pour stocker les largeurs originales des tâches pendant le drag
  const [originalTaskWidths, setOriginalTaskWidths] = useState({});
  
  // ✅ AJOUT: État pour stocker l'état JSON du diagramme en temps réel
  const [diagramState, setDiagramState] = useState({});
  const [showJsonSection, setShowJsonSection] = useState(false);
  
  // Fonction pour convertir le nouveau format "sections" vers l'ancien format "taches"
  const convertSectionsToTaches = useCallback((data) => {
    if (!data || (!data.sections && !data.taches)) {
      return null;
    }
    
    // Si on a déjà le format "taches" non vide, le retourner tel quel
    if (data.taches && data.taches.length > 0) {
      return data;
    }
    
    // Convertir le format "sections" vers "taches"
    if (data.sections) {
      const taches = [];
      let phaseNumber = 1;
      
      Object.entries(data.sections).forEach(([phaseName, phaseTasks]) => {
        // Déterminer le numéro de phase
        if (phaseName.includes('Phase 1')) phaseNumber = 1;
        else if (phaseName.includes('Phase 2')) phaseNumber = 2;
        else if (phaseName.includes('Phase 3')) phaseNumber = 3;
        
        phaseTasks.forEach(task => {
          // Convertir la durée du format Mermaid vers l'ancien format
          const convertDuration = (duration) => {
            const match = duration.match(/(\d+)([hdwm])/);
            if (!match) return { valeur: 1, unite: "jour" };
            
            const valeur = parseInt(match[1]);
            const unitCode = match[2];
            const uniteMap = {
              'h': 'heure',
              'd': 'jour',
              'w': 'semaine',
              'm': 'mois'
            };
            
            return {
              valeur: valeur,
              unite: uniteMap[unitCode] || 'jour'
            };
          };
          
          // Convertir les dépendances
          const dependances = [];
          if (task.after) {
            dependances.push({
              id_tache_precedente: task.after,
              type: 'FD',
              decalage: { valeur: 0, unite: 'jour' }
            });
          }
          
          // Convertir le statut
          let statut = 'planned';
          if (task.done) {
            statut = 'completed';
          } else if (task.type === 'cicatrisation') {
            statut = 'in-progress';
          }
          
          // ✅ CORRECTION: Garder le nom de la tâche propre, sans ajouter les dents
          // Les dents seront affichées séparément via ToothBadgeContainer
          
          const tacheConvertie = {
            id: task.id,
            nom: task.task,
            phase: phaseNumber,
            duree: convertDuration(task.duration),
            dependances: dependances,
            medecin: task.assignedTo,
            statut: statut,
            dents: task.dents || []
          };
          
          taches.push(tacheConvertie);
        });
      });
      
      return { ...data, taches };
    }
    
    return null;
  }, []); // Pas de dépendances car la fonction est pure
  
  // Calculer les dates absolues à partir des dates relatives
  const { tasks, milestones, statistics } = useMemo(() => {
    // Convertir les données si nécessaire
    const convertedData = convertSectionsToTaches(data);
    
    if (!convertedData || !convertedData.taches) {
      return { tasks: [], milestones: [], statistics: {} };
    }

    const tachesMap = new Map();
    const tasksCalculees = [];
    
    // ✅ CORRECTION: Système d'IDs stable et prévisible
    const idSet = new Set();
    const tachesAvecIdsUniques = convertedData.taches.map((tache, index) => {
      let id = tache.id;
      
      // ✅ Si l'ID n'existe pas ou est dupliqué, utiliser un ID prévisible basé sur l'index
      if (!id || idSet.has(id)) {
        // Utiliser un ID prévisible basé sur l'index et le nom de la tâche
        const cleanName = (tache.nom || 'task').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        id = `T${index + 1}_${cleanName.substring(0, 10)}`;
        console.warn(`[RelativeGanttView] ID manquant/dupliqué pour "${tache.nom}", assigné: ${id}`);
      }
      
      idSet.add(id);
      return { ...tache, id };
    });
    
    // Fonction pour effectuer un tri topologique des tâches en fonction de leurs dépendances
    const triTopologique = (taches) => {
      console.log('[RelativeGanttView] 🔄 Début du tri topologique des tâches');
      
      // Créer une map pour accès rapide par ID
      const tacheParId = new Map();
      taches.forEach(t => tacheParId.set(t.id, t));
      
      // Calculer le degré d'entrée (nombre de dépendances) pour chaque tâche
      const degresEntree = new Map();
      const grapheAdjacence = new Map();
      
      // Initialiser les structures
      taches.forEach(tache => {
        degresEntree.set(tache.id, 0);
        grapheAdjacence.set(tache.id, []);
      });
      
      // ✅ CORRECTION: Construire le graphe avec validation stricte des IDs
      taches.forEach(tache => {
        if (tache.dependances && Array.isArray(tache.dependances)) {
          tache.dependances.forEach(dep => {
            // Gérer les deux formats : id_tache_precedente ou id
            const depId = typeof dep === 'string' ? dep : (dep.id_tache_precedente || dep.id);
            
            // ✅ Validation stricte: la dépendance doit exister dans la liste des tâches
            if (depId && tacheParId.has(depId)) {
              // La tâche courante dépend de depId
              degresEntree.set(tache.id, (degresEntree.get(tache.id) || 0) + 1);
              // Ajouter la tâche courante comme successeur de depId
              const successeurs = grapheAdjacence.get(depId) || [];
              successeurs.push(tache.id);
              grapheAdjacence.set(depId, successeurs);
              
              console.log(`[triTopologique] ✅ Dépendance valide: ${tache.id} dépend de ${depId}`);
            } else {
              console.warn(`[triTopologique] ⚠️ Dépendance ignorée - ID introuvable: ${tache.id} -> ${depId}`, {
                depId,
                availableIds: Array.from(tacheParId.keys()),
                tacheNom: tache.nom
              });
            }
          });
        }
      });
      
      console.log('[RelativeGanttView] 📊 Degrés d\'entrée calculés:', Object.fromEntries(degresEntree));
      
      // File pour le tri topologique
      const file = [];
      const resultat = [];
      
      // Ajouter toutes les tâches sans dépendances à la file
      degresEntree.forEach((degre, id) => {
        if (degre === 0) {
          file.push(id);
        }
      });
      
      console.log('[RelativeGanttView] 🎯 Tâches sans dépendances:', file);
      
      // Processus de tri topologique
      while (file.length > 0) {
        const tacheId = file.shift();
        const tache = tacheParId.get(tacheId);
        if (tache) {
          resultat.push(tache);
          
          // Réduire le degré d'entrée des successeurs
          const successeurs = grapheAdjacence.get(tacheId) || [];
          successeurs.forEach(successeurId => {
            const nouveauDegre = (degresEntree.get(successeurId) || 1) - 1;
            degresEntree.set(successeurId, nouveauDegre);
            
            // Si le successeur n'a plus de dépendances, l'ajouter à la file
            if (nouveauDegre === 0) {
              file.push(successeurId);
            }
          });
        }
      }
      
      // Vérifier s'il y a des cycles (toutes les tâches doivent être dans le résultat)
      if (resultat.length !== taches.length) {
        console.warn('[RelativeGanttView] ⚠️ Cycle détecté dans les dépendances!');
        // Ajouter les tâches restantes à la fin (celles qui font partie d'un cycle)
        taches.forEach(tache => {
          if (!resultat.find(t => t.id === tache.id)) {
            resultat.push(tache);
          }
        });
      }
      
      console.log('[RelativeGanttView] ✅ Tri topologique terminé, ordre:', resultat.map(t => t.id));
      return resultat;
    };
    
    // Appliquer le tri topologique au lieu du tri par phase
    const tachesTriees = triTopologique(tachesAvecIdsUniques);
    
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
    
    // Générer un avatar pour le médecin (utilise les initiales)
    const getInitials = (name) => {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    };
    
    // Générer une URL d'avatar basée sur le nom du médecin
    const getAvatarUrl = (name) => {
      // Utiliser un service d'avatar par défaut ou une image placeholder
      // Vous pouvez remplacer ceci par vos propres URLs d'avatar
      const encodedName = encodeURIComponent(name);
      return `https://ui-avatars.com/api/?name=${encodedName}&background=random&size=128`;
    };
    
    // ✅ CORRECTION: Calculer les dates en s'assurant que les IDs sont cohérents
    for (const tache of tachesTriees) {
      console.log(`[RelativeGanttView] 📅 Calcul des dates pour tâche ${tache.id}`, {
        dependances: tache.dependances,
        tachesMapSize: tachesMap.size,
        tachesMapKeys: Array.from(tachesMap.keys()),
        // ✅ Debug des IDs des dépendances
        dependenceIds: tache.dependances?.map(dep => dep.id_tache_precedente || dep.id) || []
      });
      
      const dateDebutTache = calculerDateDebut(tache, tachesMap, dateDebut);
      const dureeJours = dureeEnJours(tache.duree);
      const dateFinTache = new Date(dateDebutTache);
      dateFinTache.setDate(dateFinTache.getDate() + dureeJours);
      
      console.log(`[RelativeGanttView] 📆 Dates calculées pour ${tache.id}:`, {
        dateDebut: dateDebutTache.toISOString(),
        dateFin: dateFinTache.toISOString(),
        dureeJours,
        // ✅ Vérifier si les dépendances sont satisfaites
        dependenciesSatisfaites: tache.dependances?.every(dep => {
          const depId = dep.id_tache_precedente || dep.id;
          return tachesMap.has(depId);
        }) || true
      });
      
      // ✅ CORRECTION: Utiliser directement les dents depuis les données converties
      // Gérer le cas où l'IA retourne les dents comme string ou array
      let nomActe = tache.nom;
      let dents = [];
      
      if (tache.dents) {
        if (typeof tache.dents === 'string') {
          // L'IA retourne parfois les dents comme string: "15, 24, 25"
          dents = tache.dents.split(',').map(d => d.trim()).filter(d => d.length > 0);
        } else if (Array.isArray(tache.dents)) {
          // L'IA retourne les dents comme array: ["15", "24", "25"]
          dents = tache.dents;
        }
      }
      
      // Appliquer les overrides de dents si présents
      if (teethOverrides[tache.id]) {
        dents = teethOverrides[tache.id];
      }
      
      // Transformer les dépendances vers le format simplifié "after"
      let dependancesTransformees = [];
      if (tache.dependances) {
        console.log('[RelativeGanttView] 🔄 Transformation des dépendances pour tâche:', tache.id, {
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
              console.warn('[RelativeGanttView] ⚠️ Format de dépendance non reconnu:', dep);
              return null;
            }
            
            console.log('[RelativeGanttView] 🔨 Transformation en format "after":', {
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
        
        console.log('[RelativeGanttView] ✨ Dépendances transformées en "after":', dependancesTransformees);
      }
      
      // Déterminer le médecin
      let medecin = tache.medecin || data.medecins_par_phase?.[`${tache.phase} - Phase`] || 'Dr. Inconnu';
      
      // Déterminer le statut et la couleur
      const getStatusInfo = (tache) => {
        if (tache.statut === 'completed') {
          return { id: 'completed', name: 'Terminé', color: '#10B981' };
        } else if (tache.statut === 'in-progress') {
          return { id: 'in-progress', name: 'En cours', color: '#F59E0B' };
        } else {
          return { id: 'planned', name: 'Planifié', color: '#6B7280' };
        }
      };
      
      // Appliquer les overrides (permanents ou temporaires du drag)
      const override = dragOverrides[tache.id] || taskOverrides[tache.id] || {};
      
      const tacheTransformee = {
        id: tache.id,  // Utiliser l'ID potentiellement corrigé
        name: tache.nom,
        // S'assurer que les dates sont toujours valides
        startAt: (override.startAt && !isNaN(override.startAt.getTime())) ? override.startAt : dateDebutTache,
        endAt: (override.endAt && !isNaN(override.endAt.getTime())) ? override.endAt : dateFinTache,
        status: getStatusInfo(tache),
        owner: {
          id: `owner-${medecin.toLowerCase().replace(/\s+/g, '-')}`,
          name: medecin,
          image: getAvatarUrl(medecin), // Générer une URL d'avatar
          initials: getInitials(medecin)
        },
        group: phaseGroups[tache.phase] || phaseGroups[1],
        product: defaultProduct,
        initiative: defaultInitiative,
        release: defaultRelease,
        phase: tache.phase,
        duree: tache.duree,
        dureeJours: dureeJours, // Ajouter la durée en jours calculée une seule fois
        dependances: dependancesTransformees, // Utiliser les dépendances transformées
        dents: dents,
        nomActe: nomActe
      };
      
      tachesMap.set(tache.id, tacheTransformee);  // Utiliser l'ID potentiellement corrigé
      tasksCalculees.push(tacheTransformee);
    }
    
    // Créer les jalons pour chaque phase
    const milestonesCalcules = [];
    const phases = [...new Set(tasksCalculees.map(t => t.phase))];
    
    for (const phase of phases) {
      const tachesPhase = tasksCalculees.filter(t => t.phase === phase);
      if (tachesPhase.length > 0) {
        const dateFin = new Date(Math.max(...tachesPhase.map(t => t.endAt.getTime())));
        milestonesCalcules.push({
          id: `milestone-phase-${phase}`,
          date: dateFin,
          label: `Fin Phase ${phase}`,
          className: phase === 1 ? 'bg-blue-100 text-blue-900' : 
                     phase === 2 ? 'bg-green-100 text-green-900' : 
                     'bg-purple-100 text-purple-900'
        });
      }
    }
    
    // Calculer les statistiques
    const dateDebutProjet = tasksCalculees.length > 0 
      ? new Date(Math.min(...tasksCalculees.map(t => t.startAt.getTime())))
      : dateDebut;
    const dateFinProjet = tasksCalculees.length > 0
      ? new Date(Math.max(...tasksCalculees.map(t => t.endAt.getTime())))
      : dateDebut;
    const dureeProjetJours = Math.ceil((dateFinProjet - dateDebutProjet) / (1000 * 60 * 60 * 24));
    
    return {
      tasks: tasksCalculees,
      milestones: milestonesCalcules,
      statistics: {
        totalTasks: tasksCalculees.length,
        totalDuration: dureeProjetJours,
        startDate: dateDebutProjet,
        endDate: dateFinProjet,
        globalProgress: 0
      }
    };
  }, [data, dateDebut, taskOverrides, dragOverrides, teethOverrides, dependencyTrigger]);

  // Grouper les tâches par groupe (phase) - DÉPLACÉ AVANT l'effet JSON
  const tasksByGroup = useMemo(() => {
    const grouped = {};
    tasks.forEach(task => {
      const groupName = task.group.name;
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(task);
    });
    return grouped;
  }, [tasks]);

  // ✅ AJOUT: Effet pour mettre à jour l'état JSON du diagramme en temps réel
  const diagramStateRef = useRef();
  
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      const emptyState = {};
      setDiagramState(emptyState);
      if (onDiagramStateChange && typeof onDiagramStateChange === 'function') {
        onDiagramStateChange(emptyState);
      }
      return;
    }

    const jsonState = {
      metadata: {
        dateDebut: dateDebut.toISOString(),
        totalTasks: tasks.length,
        totalMilestones: milestones.length,
        lastUpdate: new Date().toISOString(),
        statistics: statistics
      },
      configuration: {
        taskOverrides: Object.keys(taskOverrides).length > 0 ? taskOverrides : undefined,
        teethOverrides: Object.keys(teethOverrides).length > 0 ? teethOverrides : undefined,
        dependencyTrigger: dependencyTrigger
      },
      tasks: tasks.map(task => ({
        id: task.id,
        name: task.name,
        nomActe: task.nomActe,
        startAt: task.startAt.toISOString(),
        endAt: task.endAt.toISOString(),
        dureeJours: task.dureeJours,
        phase: task.phase,
        group: {
          id: task.group.id,
          name: task.group.name
        },
        owner: {
          id: task.owner.id,
          name: task.owner.name,
          initials: task.owner.initials
        },
        status: {
          id: task.status.id,
          name: task.status.name,
          color: task.status.color
        },
        dents: task.dents || [],
        dependances: task.dependances?.map(dep => ({
          id_tache_precedente: dep.id_tache_precedente,
          type: dep.type,
          decalage: dep.decalage,
          active: dep.active
        })) || []
      })),
      dependencies: dependencies.map(dep => ({
        id: dep.id,
        id_tache_precedente: dep.id_tache_precedente,
        id_tache_suivante: dep.id_tache_suivante,
        type: dep.type,
        decalage: dep.decalage,
        active: dep.active
      })),
      milestones: milestones.map(milestone => ({
        id: milestone.id,
        date: milestone.date.toISOString(),
        label: milestone.label,
        className: milestone.className
      })),
      tasksByGroup: Object.entries(tasksByGroup).reduce((acc, [groupName, groupTasks]) => {
        acc[groupName] = groupTasks.map(task => task.id);
        return acc;
      }, {})
    };

    // ✅ Éviter les appels redondants en comparant avec l'état précédent
    const jsonString = JSON.stringify(jsonState);
    if (diagramStateRef.current !== jsonString) {
      diagramStateRef.current = jsonString;
      setDiagramState(jsonState);
      
      // ✅ Appeler le callback seulement si nécessaire
      if (onDiagramStateChange && typeof onDiagramStateChange === 'function') {
        onDiagramStateChange(jsonState);
      }
    }
  }, [tasks, milestones, statistics, dateDebut, taskOverrides, teethOverrides, dependencyTrigger, dependencies, tasksByGroup]);

  // Gérer le changement de date
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    setDateDebut(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  
  // Gestion du drag & drop - ÉTENDU POUR LES DENTS
  const handleDragStart = (event) => {
    const { active } = event;
    const dragType = active.data.current?.type;
    
    console.log('[RelativeGanttView] Drag start:', { id: active.id, type: dragType });
    setActiveId(active.id);
    
    if (dragType === 'tooth') {
      // Gérer le drag de dent(s)
      const { tooth, sourceTaskId } = active.data.current;
      console.log('[RelativeGanttView] Tooth drag start:', { tooth, sourceTaskId, selectedTeeth: selectedTeeth.size });
      
      // Bloquer le scroll horizontal pendant le drag des dents
      const ganttElement = document.querySelector('.gantt');
      if (ganttElement) {
        ganttElement.classList.remove('overflow-auto');
        ganttElement.classList.add('overflow-hidden');
      }
      
      // Si la dent dragguée fait partie de la sélection, on drag toute la sélection
      if (selectedTeeth.has(tooth) && selectedTeethTaskId === sourceTaskId) {
        console.log('[RelativeGanttView] Dragging multiple teeth:', Array.from(selectedTeeth));
      } else {
        // Sinon, on ne drag que cette dent et on réinitialise la sélection
        setSelectedTeeth(new Set([tooth]));
        setSelectedTeethTaskId(sourceTaskId);
      }
    } else {
      // Code existant pour le drag des tâches
      // Réinitialiser les overrides temporaires
      setDragOverrides({});
      
      // Stocker simplement les dates actuelles de la tâche
      const task = tasks.find(t => t.id === active.id);
      if (task) {
        setDragStartDates({
          [active.id]: {
            startAt: new Date(task.startAt),
            endAt: new Date(task.endAt)
          }
        });
        
        // Initialiser l'ensemble des tâches déplacées avec la tâche principale
        setDraggedTaskIds(new Set([active.id]));
        
        // Calculer et stocker les largeurs originales de toutes les tâches
        const widths = {};
        tasks.forEach(t => {
          const timelineStart = new Date(new Date().getFullYear() - 1, 0, 1);
          
          if (t.startAt && t.endAt && !isNaN(t.startAt.getTime()) && !isNaN(t.endAt.getTime())) {
            const startMonthsDiff = (t.startAt.getFullYear() - timelineStart.getFullYear()) * 12 +
                                  (t.startAt.getMonth() - timelineStart.getMonth());
            const startDaysInMonth = new Date(t.startAt.getFullYear(), t.startAt.getMonth() + 1, 0).getDate();
            const startDayOffset = (t.startAt.getDate() - 1) / startDaysInMonth;
            const startOffset = (startMonthsDiff + startDayOffset) * 150;
            
            const endMonthsDiff = (t.endAt.getFullYear() - timelineStart.getFullYear()) * 12 +
                                 (t.endAt.getMonth() - timelineStart.getMonth());
            const endDaysInMonth = new Date(t.endAt.getFullYear(), t.endAt.getMonth() + 1, 0).getDate();
            const endDayOffset = (t.endAt.getDate() - 1) / endDaysInMonth;
            const endOffset = (endMonthsDiff + endDayOffset) * 150;
            
            widths[t.id] = Math.max(endOffset - startOffset, 20);
          } else {
            widths[t.id] = 150; // Largeur par défaut
          }
        });
        setOriginalTaskWidths(widths);
      }
    }
  };
  
  // Handler pour gérer le mouvement pendant le drag - AVEC DÉPENDANCES
  const handleDragMove = (event) => {
    const { active, delta } = event;
    
    if (!delta || delta.x === 0) return;
    
    const originalDates = dragStartDates[active.id];
    if (!originalDates) return;
    
    // Calcul simple du décalage en jours
    const monthWidth = 150;
    const daysInMonth = 30;
    const dayWidth = monthWidth / daysInMonth;
    const deltaDays = Math.round(delta.x / dayWidth);
    
    // Décaler début ET fin du MÊME nombre de jours
    const newStartDate = new Date(originalDates.startAt);
    newStartDate.setDate(newStartDate.getDate() + deltaDays);
    
    const newEndDate = new Date(originalDates.endAt);
    newEndDate.setDate(newEndDate.getDate() + deltaDays);
    
    console.log('[handleDragMove] Drag with dependencies:', {
      taskId: active.id,
      deltaDays,
      newStartDate: newStartDate.toISOString(),
      newEndDate: newEndDate.toISOString()
    });
    
    // Calculer les mises à jour des tâches dépendantes
    const dependentUpdates = calculateSmartDependentUpdates(
      active.id,
      newStartDate,
      newEndDate,
      tasks,
      convertSectionsToTaches(data)?.taches || [], // Utiliser les tâches converties
      dateDebut
    );
    
    // Appliquer l'override temporaire pour la tâche principale ET ses dépendances
    const newDragOverrides = {
      [active.id]: {
        startAt: newStartDate,
        endAt: newEndDate
      },
      ...dependentUpdates
    };
    setDragOverrides(newDragOverrides);
    
    // Mettre à jour l'ensemble des tâches affectées par le drag
    const affectedTaskIds = new Set([active.id, ...Object.keys(dependentUpdates)]);
    setDraggedTaskIds(affectedTaskIds);
  };
  
  const handleDragEnd = (event) => {
    const { active, over, delta } = event;
    const dragType = active.data.current?.type;
    
    setActiveId(null);
    
    // Rétablir le scroll horizontal
    const ganttElement = document.querySelector('.gantt');
    if (ganttElement) {
      ganttElement.classList.remove('overflow-hidden');
      ganttElement.classList.add('overflow-auto');
    }
    
    if (!over) {
      console.log('[RelativeGanttView] Drag cancelled - no drop target');
      // Nettoyer tous les états
      setDragOverrides({});
      setDraggedTaskIds(new Set());
      setOriginalTaskWidths({});
      setDragStartDates({});
      return;
    }
    
    const dropType = over.data.current?.type;
    
    if (dragType === 'tooth' && dropType === 'tooth-container') {
      // Gérer le drop d'une ou plusieurs dents sur un conteneur
      const { tooth, sourceTaskId } = active.data.current;
      const targetTaskId = over.data.current.taskId;
      
      console.log('[RelativeGanttView] Tooth drop:', {
        tooth,
        sourceTaskId,
        targetTaskId,
        selectedTeeth: Array.from(selectedTeeth)
      });
      
      if (sourceTaskId !== targetTaskId) {
        // Déterminer les dents à transférer
        let teethToTransfer;
        if (selectedTeeth.has(tooth) && selectedTeethTaskId === sourceTaskId) {
          // Transférer toutes les dents sélectionnées
          teethToTransfer = Array.from(selectedTeeth);
        } else {
          // Transférer seulement la dent draggée
          teethToTransfer = [tooth];
        }
        
        handleToothTransfer(teethToTransfer, sourceTaskId, targetTaskId);
        
        // Réinitialiser la sélection après le transfert
        setSelectedTeeth(new Set());
        setSelectedTeethTaskId(null);
      }
    } else if (!dragType || dragType !== 'tooth') {
      // Code existant pour le drag des tâches
      setDragOverrides({});
      setDraggedTaskIds(new Set());
      setOriginalTaskWidths({});
      
      if (!delta || delta.x === 0) {
        setDragStartDates({});
        return;
      }
      
      const originalDates = dragStartDates[active.id];
      if (!originalDates) return;
      
      // Calcul simple du décalage final
      const monthWidth = 150;
      const daysInMonth = 30;
      const dayWidth = monthWidth / daysInMonth;
      const deltaDays = Math.round(delta.x / dayWidth);
      
      // Nouvelles dates = dates originales + deltaDays
      const newStartDate = new Date(originalDates.startAt);
      newStartDate.setDate(newStartDate.getDate() + deltaDays);
      
      const newEndDate = new Date(originalDates.endAt);
      newEndDate.setDate(newEndDate.getDate() + deltaDays);
      
      console.log('[handleDragEnd] Final position with dependencies:', {
        taskId: active.id,
        deltaDays,
        newStartDate: newStartDate.toISOString(),
        newEndDate: newEndDate.toISOString()
      });
      
      // Calculer les mises à jour des tâches dépendantes
      const dependentUpdates = calculateSmartDependentUpdates(
        active.id,
        newStartDate,
        newEndDate,
        tasks,
        convertSectionsToTaches(data)?.taches || [], // Utiliser les tâches converties
        dateDebut
      );
      
      // Mettre à jour l'état permanent pour la tâche principale ET ses dépendances
      const newOverrides = {
        ...taskOverrides,
        [active.id]: {
          startAt: newStartDate,
          endAt: newEndDate
        },
        ...dependentUpdates
      };
      
      setTaskOverrides(newOverrides);
      
      // Notifier le parent pour la tâche principale
      onTaskUpdate?.(active.id, {
        startAt: newStartDate,
        endAt: newEndDate
      });
      
      // Notifier le parent pour chaque tâche dépendante mise à jour
      Object.entries(dependentUpdates).forEach(([taskId, updates]) => {
        onTaskUpdate?.(taskId, updates);
      });
      
      // Nettoyer
      setDragStartDates({});
      setDraggedTaskIds(new Set());
      setOriginalTaskWidths({});
    }
  };
  
  // Gestion du resize - SIMPLIFIÉ
  const handleResize = useCallback((taskId, updates) => {
    console.log('[RelativeGanttView] handleResize:', { taskId, updates });
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Validation simple : s'assurer que start < end
    const newStartDate = updates.startAt || task.startAt;
    const newEndDate = updates.endAt || task.endAt;
    
    if (newStartDate >= newEndDate) {
      console.warn('[handleResize] Invalid resize: dates invalides');
      return;
    }
    
    // Mettre à jour seulement cette tâche
    setTaskOverrides({
      ...taskOverrides,
      [taskId]: {
        startAt: newStartDate,
        endAt: newEndDate
      }
    });
    
    // Notifier le parent
    onTaskUpdate?.(taskId, {
      startAt: newStartDate,
      endAt: newEndDate
    });
  }, [onTaskUpdate, taskOverrides, tasks]);
  
  // Gestion du menu contextuel
  const handleContextMenu = useCallback((action, task) => {
    onTaskAction?.(action, task);
  }, [onTaskAction]);
  
  // Gestion du début de connexion
  const handleConnectionStart = useCallback((fromTaskId, position, startPoint) => {
    console.log('[RelativeGanttView] 🔌 Connection start:', { fromTaskId, position, startPoint });
    
    setPreviewConnection({
      fromTaskId,
      position,
      startPoint,
      currentPoint: startPoint,
      type: 'FD' // Type temporaire, sera déterminé à la fin de la connexion
    });
    
    // Ajouter un gestionnaire global pour suivre le mouvement de la souris
    const handleMouseMove = (e) => {
      setPreviewConnection(prev => prev ? ({
        ...prev,
        currentPoint: { x: e.clientX, y: e.clientY }
      }) : null);
    };
    
    const handleMouseUp = () => {
      setPreviewConnection(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);
  
  // Gestion de la fin de connexion
  const handleConnectionEnd = useCallback((fromTaskId, toTaskId, fromPosition, toPosition) => {
    console.log('[RelativeGanttView] Connection end:', { fromTaskId, toTaskId, fromPosition, toPosition });
    
    if (fromTaskId === toTaskId) {
      console.warn('Cannot create dependency to the same task');
      return;
    }
    
    // Vérifier si la dépendance existe déjà
    const targetTask = tasks.find(t => t.id === toTaskId);
    if (targetTask?.dependances?.some(dep =>
      (dep.id_tache_precedente === fromTaskId) || (dep.id === fromTaskId)
    )) {
      if (!isShiftPressed) {
        console.warn('Dependency already exists');
        return;
      }
    }
    
    // Utiliser le système simplifié "after"
    console.log('[RelativeGanttView] Creating "after" dependency:', {
      from: fromTaskId,
      to: toTaskId
    });
    
    // Créer la nouvelle dépendance simplifiée
    const newDependency = {
      id: `${fromTaskId}-${toTaskId}`,
      id_tache_precedente: fromTaskId,
      id_tache_suivante: toTaskId,
      type: 'after', // Type simplifié
      decalage: { valeur: 0, unite: 'jours' },
      active: true
    };
    
    handleAddDependency(newDependency);
    setPreviewConnection(null);
  }, [tasks, isShiftPressed]);
  
  // Extraire toutes les dépendances des tâches
  React.useEffect(() => {
    const allDependencies = [];
    tasks.forEach(task => {
      if (task.dependances && task.dependances.length > 0) {
        task.dependances.forEach(dep => {
          allDependencies.push({
            ...dep,
            id: dep.id || `${dep.id_tache_precedente}-${task.id}`,
            id_tache_suivante: task.id
          });
        });
      }
    });
    setDependencies(allDependencies);
  }, [tasks]);
  
  // Gestion des dépendances
  const handleAddDependency = useCallback((newDependency) => {
    console.log('[RelativeGanttView] Adding dependency:', newDependency);
    
    // Trouver les tâches source et cible
    const sourceTask = tasks.find(task => task.id === newDependency.id_tache_precedente);
    const targetTask = tasks.find(task => task.id === newDependency.id_tache_suivante);
    
    if (!sourceTask || !targetTask) {
      console.error('Source or target task not found:', {
        sourceId: newDependency.id_tache_precedente,
        targetId: newDependency.id_tache_suivante,
        sourceFound: !!sourceTask,
        targetFound: !!targetTask
      });
      return;
    }
    
    // Créer la nouvelle liste de dépendances pour la tâche cible avec le format "after"
    const updatedDependances = [...(targetTask.dependances || []), {
      id_tache_precedente: newDependency.id_tache_precedente,
      type: 'after', // Toujours "after"
      decalage: newDependency.decalage,
      active: newDependency.active
    }];
    
    console.log('[RelativeGanttView] Updating task dependencies:', {
      taskId: targetTask.id,
      oldDependencies: targetTask.dependances,
      newDependencies: updatedDependances,
      dependencyType: newDependency.type
    });
    
    // ✅ CORRECTION: Utiliser calculerDateDebut pour gérer TOUTES les dépendances (existantes + nouvelle)
    
    // Créer une tâche temporaire avec les nouvelles dépendances pour calculer sa position
    const tempTargetTask = {
      ...targetTask,
      dependances: updatedDependances
    };
    
    // Créer une Map temporaire avec les tâches actuelles (incluant les overrides)
    const tempTasksMap = new Map();
    tasks.forEach(task => {
      const taskWithOverrides = {
        ...task,
        // Appliquer les overrides existants
        ...(taskOverrides[task.id] || {})
      };
      tempTasksMap.set(task.id, taskWithOverrides);
    });
    
    // Calculer la nouvelle date de début en tenant compte de TOUTES les dépendances
    const newStartDate = calculerDateDebut(tempTargetTask, tempTasksMap, dateDebut);
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + targetTask.dureeJours);
    
    console.log('[RelativeGanttView] 🎯 Repositionnement automatique avec TOUTES les dépendances:', {
      taskId: targetTask.id,
      totalDependencies: updatedDependances.length,
      dependencies: updatedDependances.map(dep => ({
        from: dep.id_tache_precedente,
        type: dep.type
      })),
      oldPosition: {
        startAt: targetTask.startAt.toISOString(),
        endAt: targetTask.endAt.toISOString()
      },
      newPosition: {
        startAt: newStartDate.toISOString(),
        endAt: newEndDate.toISOString()
      },
      dureeJours: targetTask.dureeJours
    });
    
    // Mettre à jour immédiatement la position de la tâche dépendante
    const newTaskOverrides = {
      ...taskOverrides,
      [targetTask.id]: {
        startAt: newStartDate,
        endAt: newEndDate
      }
    };
    setTaskOverrides(newTaskOverrides);
    
    // ✅ CORRECTION: Calculer SEULEMENT les mises à jour en cascade strictement nécessaires
    // Ne propager que si la tâche repositionnée a effectivement bougé
    const originalTargetStartAt = targetTask.startAt;
    const hasActuallyMoved = Math.abs(newStartDate.getTime() - originalTargetStartAt.getTime()) > 1000; // Plus d'1 seconde de différence
    
    if (hasActuallyMoved) {
      console.log('[RelativeGanttView] 🎯 Calcul des mises à jour en cascade (tâche a réellement bougé)');
      
      const dependentUpdates = calculateSmartDependentUpdates(
        targetTask.id,
        newStartDate,
        newEndDate,
        tasks,
        convertSectionsToTaches(data)?.taches || [],
        dateDebut
      );
      
      // Appliquer les mises à jour en cascade
      if (Object.keys(dependentUpdates).length > 0) {
        console.log('[RelativeGanttView] 🔄 Mise à jour en cascade des tâches dépendantes:', dependentUpdates);
        setTaskOverrides(prev => ({ ...prev, ...dependentUpdates }));
        
        // Notifier le parent pour chaque tâche mise à jour en cascade
        Object.entries(dependentUpdates).forEach(([taskId, updates]) => {
          onTaskUpdate?.(taskId, updates);
        });
      }
    } else {
      console.log('[RelativeGanttView] ⏸️ Pas de propagation en cascade - la tâche n\'a pas bougé significativement');
    }
    
    // Notifier le parent pour la tâche repositionnée
    onTaskUpdate?.(targetTask.id, {
      startAt: newStartDate,
      endAt: newEndDate
    });
    
    // Notifier le parent pour persister les changements de dépendances
    if (onDependencyUpdate) {
      onDependencyUpdate(targetTask.id, updatedDependances);
    } else {
      console.warn('[RelativeGanttView] onDependencyUpdate is not defined');
    }
    
    // Mettre à jour l'état local pour l'affichage immédiat
    setDependencies(prev => [...prev, newDependency]);
    
    // ✅ CRUCIAL: Forcer le recalcul complet de toutes les positions
    setDependencyTrigger(prev => prev + 1);
    
    console.log('[RelativeGanttView] 🔄 Déclenchement du recalcul complet des positions');
  }, [tasks, onDependencyUpdate, taskOverrides, onTaskUpdate, data, dateDebut]);
  
  // Fonction pour gérer le transfert de dents entre tâches
  const handleToothTransfer = useCallback((teeth, sourceTaskId, targetTaskId) => {
    console.log('[RelativeGanttView] Transferring teeth:', { teeth, sourceTaskId, targetTaskId });
    
    // Trouver les tâches source et cible
    const sourceTask = tasks.find(t => t.id === sourceTaskId);
    const targetTask = tasks.find(t => t.id === targetTaskId);
    
    if (!sourceTask || !targetTask) {
      console.error('[RelativeGanttView] Source or target task not found');
      return;
    }
    
    // Retirer les dents de la tâche source
    const newSourceTeeth = (sourceTask.dents || []).filter(
      tooth => !teeth.includes(tooth)
    );
    
    // Ajouter les dents à la tâche cible (éviter les doublons)
    const existingTargetTeeth = targetTask.dents || [];
    const teethToAdd = teeth.filter(tooth => !existingTargetTeeth.includes(tooth));
    const newTargetTeeth = [...existingTargetTeeth, ...teethToAdd];
    
    console.log('[RelativeGanttView] Updated teeth:', {
      source: { old: sourceTask.dents, new: newSourceTeeth },
      target: { old: targetTask.dents, new: newTargetTeeth }
    });
    
    // Mettre à jour l'état local immédiatement
    setTeethOverrides(prev => ({
      ...prev,
      [sourceTaskId]: newSourceTeeth,
      [targetTaskId]: newTargetTeeth
    }));
    
    // Notifier les mises à jour
    if (onTaskUpdate) {
      // Mettre à jour la tâche source
      onTaskUpdate(sourceTaskId, { dents: newSourceTeeth });
      
      // Mettre à jour la tâche cible
      onTaskUpdate(targetTaskId, { dents: newTargetTeeth });
    }
  }, [tasks, onTaskUpdate]);
  
  // Fonction pour gérer la sélection des dents
  const handleToothSelect = useCallback((tooth, isMulti, taskId) => {
    console.log('[RelativeGanttView] Tooth select:', { tooth, isMulti, taskId });
    
    if (isMulti) {
      // Multi-sélection avec Ctrl
      if (selectedTeethTaskId && selectedTeethTaskId !== taskId) {
        // Si on sélectionne dans une autre tâche, réinitialiser
        setSelectedTeeth(new Set([tooth]));
        setSelectedTeethTaskId(taskId);
      } else {
        setSelectedTeeth(prev => {
          const newSet = new Set(prev);
          if (newSet.has(tooth)) {
            newSet.delete(tooth);
          } else {
            newSet.add(tooth);
          }
          return newSet;
        });
        setSelectedTeethTaskId(taskId);
      }
    } else {
      // Sélection simple
      setSelectedTeeth(new Set([tooth]));
      setSelectedTeethTaskId(taskId);
    }
  }, [selectedTeethTaskId]);
  
  const handleUpdateDependency = useCallback((updatedDependency) => {
    console.log('[RelativeGanttView] Updating dependency:', updatedDependency);
    
    // Trouver la tâche cible
    const targetTask = tasks.find(task => task.id === updatedDependency.id_tache_suivante);
    
    if (!targetTask || !targetTask.dependances) {
      console.error('Target task or dependencies not found');
      return;
    }
    
    // Mettre à jour la liste des dépendances
    const updatedDependances = targetTask.dependances.map(dep => {
      if (dep.id_tache_precedente === updatedDependency.id_tache_precedente) {
        return {
          id_tache_precedente: updatedDependency.id_tache_precedente,
          type: updatedDependency.type,
          decalage: updatedDependency.decalage,
          active: updatedDependency.active
        };
      }
      return dep;
    });
    
    // Notifier le parent
    if (onDependencyUpdate) {
      onDependencyUpdate(targetTask.id, updatedDependances);
    }
    
    // Mettre à jour l'état local
    setDependencies(prev => prev.map(dep =>
      dep.id === updatedDependency.id ? updatedDependency : dep
    ));
  }, [tasks, onDependencyUpdate]);
  
  const handleDeleteDependency = useCallback((dependencyToDelete) => {
    console.log('[RelativeGanttView] Deleting dependency:', dependencyToDelete);
    
    // Trouver la tâche cible
    const targetTask = tasks.find(task => task.id === dependencyToDelete.id_tache_suivante);
    
    if (!targetTask || !targetTask.dependances) {
      console.error('Target task or dependencies not found');
      return;
    }
    
    // Filtrer les dépendances
    const updatedDependances = targetTask.dependances.filter(dep =>
      dep.id_tache_precedente !== dependencyToDelete.id_tache_precedente
    );
    
    // Notifier le parent
    if (onDependencyUpdate) {
      onDependencyUpdate(targetTask.id, updatedDependances);
    }
    
    // Mettre à jour l'état local
    setDependencies(prev => prev.filter(dep => dep.id !== dependencyToDelete.id));
  }, [tasks, onDependencyUpdate]);
  

  const hasValidData = data && (data.taches || data.sections);
  const convertedData = convertSectionsToTaches(data);
  
  if (!hasValidData || !convertedData?.taches || convertedData.taches.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée de planification</h3>
          <p className="text-gray-500">Les données du plan de traitement ne sont pas disponibles.</p>
          {/* Info de debug en développement */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-gray-400">
              <p>Debug: data type = {typeof data}</p>
              <p>Has taches: {data?.taches ? 'Yes' : 'No'}</p>
              <p>Has sections: {data?.sections ? 'Yes' : 'No'}</p>
              <p>Taches count: {convertedData?.taches?.length || 0}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Contrôles */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label htmlFor="start-date" className="text-sm font-medium text-gray-700">
              Date de début du traitement :
            </label>
            <input
              type="date"
              id="start-date"
              value={formatDateForInput(dateDebut)}
              onChange={handleDateChange}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            
          </div>
          
          {/* Statistiques */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-600">{tasks.length}</div>
              <div className="text-gray-500">Tâches</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">{statistics.totalDuration} jours</div>
              <div className="text-gray-500">Durée totale</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600">{milestones.length}</div>
              <div className="text-gray-500">Jalons</div>
            </div>
          </div>
        </div>
      </div>

      {/* Diagramme Gantt avec DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        modifiers={activeId && !activeId.includes('tooth') ? [restrictToHorizontalAxis] : []}
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <GanttProvider
            range="monthly"
            zoom={100}
            className="h-[600px]"
          >
            {/* Sidebar avec les tâches */}
            <GanttSidebar>
              {Object.entries(tasksByGroup).map(([group, groupTasks], groupIndex) => (
              <GanttSidebarGroup key={`sidebar_group_${group.replace(/\s+/g, '_')}_${groupIndex}`} name={group}>
                {groupTasks.map((task, taskIndex) => (
                  <GanttSidebarItem
                    key={`sidebar_${task.id}`}
                    feature={{
                      id: task.id,
                      name: task.name,
                      nomActe: task.nomActe,
                      dents: task.dents,
                      startAt: task.startAt,
                      endAt: task.endAt,
                      status: task.status,
                      owner: task.owner,
                      group: task.group
                    }}
                    onSelectItem={setSelectedTaskId}
                    onTeethUpdate={(taskId, newTeeth) => {
                      console.log('[RelativeGanttView] Teeth update request:', { taskId, newTeeth });
                      onTaskUpdate?.(taskId, { dents: newTeeth });
                    }}
                    selectedTeeth={selectedTeethTaskId === task.id ? selectedTeeth : new Set()}
                    onToothSelect={handleToothSelect}
                    className={`hover:bg-gray-50 ${selectedTaskId === task.id ? 'bg-blue-50' : ''}`}
                  />
                ))}
              </GanttSidebarGroup>
            ))}
            </GanttSidebar>

            {/* Timeline */}
            <GanttTimeline className="gantt-timeline relative">
              <GanttHeader />
              
              {/* Liste des tâches dans le timeline */}
              <GanttFeatureList>
                {Object.entries(tasksByGroup).map(([group, groupTasks], groupIndex) => (
                  <GanttFeatureListGroup key={`timeline_group_${group.replace(/\s+/g, '_')}_${groupIndex}`}>
                    {groupTasks.map((task, taskIndex) => {
                      // Calculer la position et la largeur
                      const timelineStart = new Date(new Date().getFullYear() - 1, 0, 1);
                      const monthsDiff = (task.startAt.getFullYear() - timelineStart.getFullYear()) * 12 +
                                        (task.startAt.getMonth() - timelineStart.getMonth());
                      
                      const daysInMonth = new Date(task.startAt.getFullYear(), task.startAt.getMonth() + 1, 0).getDate();
                      const dayOffset = (task.startAt.getDate() - 1) / daysInMonth;
                      
                      const offset = (monthsDiff + dayOffset) * 150; // 150px par mois
                      
                      let width = 150;
                      
                      // Si la tâche est en cours de drag, utiliser la largeur originale stockée
                      if (draggedTaskIds.has(task.id) && originalTaskWidths[task.id]) {
                        width = originalTaskWidths[task.id];
                      } else {
                        // Sinon, calculer la largeur normalement
                        // Vérifier que les dates sont valides avant de calculer la largeur
                        if (!task.startAt || !task.endAt || isNaN(task.startAt.getTime()) || isNaN(task.endAt.getTime())) {
                          console.error(`[GanttFeatureItem] ERROR - Invalid dates for task ${task.id}:`, {
                            startAt: task.startAt,
                            endAt: task.endAt,
                            isValidStart: task.startAt instanceof Date && !isNaN(task.startAt),
                            isValidEnd: task.endAt instanceof Date && !isNaN(task.endAt)
                          });
                          width = 150; // Largeur par défaut si dates invalides
                        } else {
                          const endMonthsDiff = (task.endAt.getFullYear() - timelineStart.getFullYear()) * 12 +
                                               (task.endAt.getMonth() - timelineStart.getMonth());
                          const endDaysInMonth = new Date(task.endAt.getFullYear(), task.endAt.getMonth() + 1, 0).getDate();
                          const endDayOffset = (task.endAt.getDate() - 1) / endDaysInMonth;
                          const endOffset = (endMonthsDiff + endDayOffset) * 150;
                          width = Math.max(endOffset - offset, 1); // Toujours au moins 1px de largeur
                          
                          // Vérifier que la largeur est valide et raisonnable
                          if (isNaN(width) || width <= 0 || width > 10000) {
                            console.error(`[GanttFeatureItem] ERROR - Invalid width calculated for task ${task.id}:`, {
                              width,
                              offset,
                              endOffset,
                              startAt: task.startAt.toISOString(),
                              endAt: task.endAt.toISOString()
                            });
                            // Calculer une largeur basée sur la durée en jours si possible
                            const durationMs = task.endAt.getTime() - task.startAt.getTime();
                            const durationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));
                            width = Math.max(20, (durationDays / 30) * 150); // Minimum 20px
                          }
                        }
                      }
                      
                      // Log de debug pour le positionnement (seulement si width est anormale)
                      if (width <= 0 || width > 1000) {
                        console.log(`[GanttFeatureItem] Task ${task.id} positioning DEBUG:`, {
                          offset,
                          width,
                          startAt: task.startAt,
                          endAt: task.endAt,
                          monthsDiff,
                          dayOffset,
                          isDraggedTask: activeId === task.id,
                          hasDragOverride: !!dragOverrides[task.id],
                          hasTaskOverride: !!taskOverrides[task.id]
                        });
                      }
                      
                      return (
                        <div
                          key={`timeline_${task.id}`}
                          className="relative flex w-max min-w-full py-0.5"
                          style={{ height: '36px' }}
                        >
                          <div
                            className="absolute top-0.5"
                            style={{
                              height: '32px',
                              width: `${Math.max(width, 20)}px`,
                              left: `${offset}px`,
                              minWidth: '20px', // Assurer une largeur minimale
                              transition: draggedTaskIds.has(task.id) ? 'none' : 'all 0.3s ease-out' // Pas de transition pour toutes les tâches affectées par le drag
                            }}
                          >
                            {/* Vérifier si cette tâche est en train d'être déplacée (principale ou dépendante) */}
                            {draggedTaskIds.has(task.id) ? (
                              // Placeholder pendant le drag pour toutes les tâches affectées
                              <div
                                className="h-full w-full rounded border-2 border-dashed border-gray-400 bg-gray-100 animate-pulse"
                              />
                            ) : (
                              <div
                                className={cn(
                                  "transition-opacity duration-300",
                                  // Animation d'apparition après le drag pour toutes les tâches qui étaient déplacées
                                  activeId === null && taskOverrides[task.id] && !draggedTaskIds.has(task.id) ? "animate-fadeInScale" : ""
                                )}
                              >
                                <DraggableTaskBarWithConnectors
                                  task={task}
                                  onResize={handleResize}
                                  onMove={onTaskUpdate}
                                  onContextMenu={handleContextMenu}
                                  onConnectionStart={handleConnectionStart}
                                  onConnectionEnd={handleConnectionEnd}
                                  isDragging={false}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </GanttFeatureListGroup>
                ))}
              </GanttFeatureList>

              {/* Jalons */}
              {milestones.map((milestone) => (
                <GanttMarker
                  key={milestone.id}
                  id={milestone.id}
                  date={milestone.date}
                  label={milestone.label}
                  className={milestone.className}
                />
              ))}

              {/* Marqueur "Aujourd'hui" */}
              <GanttToday className="bg-red-100 text-red-800 border-red-200" />
              
              {/* Lignes de dépendances simplifiées */}
              <DependencyLinesSimplified
                tasks={tasks}
                onDependencyDelete={handleDeleteDependency}
                highlightedTaskId={selectedTaskId}
                previewConnection={previewConnection}
                activeTaskId={activeId}
                dragOverrides={dragOverrides}
              />
            </GanttTimeline>
          </GanttProvider>
        </div>
        
        {/* Overlay pour le drag */}
        <DragOverlay
          style={{
            zIndex: 9999,
            cursor: 'grabbing'
          }}
        >
          {activeId && activeId.includes('tooth') && selectedTeeth.size > 1 ? (
            // Afficher toutes les dents sélectionnées pendant le drag (seulement pour multi-sélection)
            <div className="flex gap-1 pointer-events-none">
              {Array.from(selectedTeeth).map(tooth => (
                <span
                  key={tooth}
                  className="inline-flex items-center rounded-full px-2 text-xs font-medium bg-blue-100 text-blue-700 ring-2 ring-blue-500 shadow-lg"
                >
                  {tooth}
                </span>
              ))}
            </div>
          ) : activeId && !activeId.includes('tooth') ? (
            // Pour les tâches, on garde l'overlay invisible
            <div className="opacity-0 pointer-events-none" />
          ) : null}
        </DragOverlay>
      </DndContext>
      
      {/* Indicateur pour Shift + Click */}
      {isShiftPressed && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Mode dépendances multiples activé (Shift)
        </div>
      )}
    </div>
  );
};

export default RelativeGanttView;