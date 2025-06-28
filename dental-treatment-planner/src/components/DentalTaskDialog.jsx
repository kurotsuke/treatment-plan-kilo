import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NeonCheckbox } from '@/components/ui/animated-check-box';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, FileText, Package, UserIcon } from 'lucide-react';
import { CheckIcon } from '@heroicons/react/20/solid';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import ToothBadgeContainer from './gantt/ToothBadgeContainer';
import { useDoctors } from '../hooks/useDoctors';

// Fonction pour générer un avatar de fallback depuis le nom (si pas de photo)
const generateFallbackAvatar = (name) => {
  if (!name) return 'DR';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Couleurs par défaut pour les avatars de fallback
const avatarColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-teal-500'
];

const DentalTaskDialog = ({ open, onOpenChange, task, onSave, onDoctorChange }) => {
  const [notes, setNotes] = useState(task?.notes || 'Patient sous anticoagulants. @36 Racine courbée, extraction difficile. Implant 4.2/6 prévu. @37 Carie profonde. Prévoir antibiotiques post-opératoires.');
  const [isCompleted, setIsCompleted] = useState(task?.isCompleted || false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isDoctorPopoverOpen, setIsDoctorPopoverOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // États pour gérer les données en mémoire après fermeture avec changements
  const [unsavedData, setUnsavedData] = useState(null);
  const [currentToastId, setCurrentToastId] = useState(null);
  
  // Hook pour récupérer les médecins
  const { doctors: firebaseDoctors, loading: doctorsLoading } = useDoctors();
  
  // Transformer les médecins Firebase en format compatible
  const doctors = firebaseDoctors.map((doctor, index) => ({
    id: doctor.id,
    name: doctor.name,
    specialty: doctor.treatmentPhases?.map(phase => `Phase ${phase}`).join(', ') || 'Généraliste',
    treatmentPhases: doctor.treatmentPhases || [1, 2, 3],
    profileImage: doctor.profileImage
  }));
  
  // Valeurs initiales pour détecter les changements
  const initialValues = useRef({});

  // Effet pour initialiser les valeurs SEULEMENT à l'ouverture de la dialog
  useEffect(() => {
    if (open && task) {
      const newInitialNotes = task.notes || 'Patient sous anticoagulants. @36 Racine courbée, extraction difficile. Implant 4.2/6 prévu. @37 Carie profonde. Prévoir antibiotiques post-opératoires.';
      const newInitialCompleted = task.isCompleted || false;
      const newInitialDoctor = task.doctor || null;
      
      setNotes(newInitialNotes);
      setIsCompleted(newInitialCompleted);
      setSelectedDoctor(newInitialDoctor);
      
      // Réinitialiser les valeurs de référence SEULEMENT si c'est une nouvelle ouverture
      // ou si les valeurs initiales ne sont pas encore définies
      if (!initialValues.current.notes || !open) {
        initialValues.current = {
          notes: newInitialNotes,
          isCompleted: newInitialCompleted,
          doctor: newInitialDoctor
        };
        
        console.log('🔍 [DEBUG] Initial values set (first time or dialog reopened):', {
          notes: newInitialNotes,
          isCompleted: newInitialCompleted,
          doctor: newInitialDoctor
        });
      } else {
        console.log('🔍 [DEBUG] Dialog already open, keeping existing initial values to preserve change detection');
      }
    }
  }, [open]);

  // Effet séparé pour mettre à jour seulement les valeurs actuelles quand task change
  useEffect(() => {
    if (open && task) {
      const newNotes = task.notes || 'Patient sous anticoagulants. @36 Racine courbée, extraction difficile. Implant 4.2/6 prévu. @37 Carie profonde. Prévoir antibiotiques post-opératoires.';
      const newCompleted = task.isCompleted || false;
      
      // Mettre à jour seulement les notes et le statut, pas le médecin (géré localement)
      setNotes(newNotes);
      setIsCompleted(newCompleted);
    }
  }, [task]);

  // Fonction pour vérifier si du contenu a été modifié
  const hasChanges = () => {
    const notesChanged = notes !== initialValues.current.notes;
    const completedChanged = isCompleted !== initialValues.current.isCompleted;
    const doctorChanged = selectedDoctor?.id !== initialValues.current.doctor?.id;
    
   
    const hasAnyChanges = notesChanged || completedChanged || doctorChanged;
    console.log('  - Has any changes:', hasAnyChanges);
    
    return hasAnyChanges;
  };

  // Gestionnaire pour le clic à l'extérieur
  const handleInteractOutside = (e) => {
    console.log('🔍 [DEBUG] handleInteractOutside called');
    // Empêcher la fermeture seulement si du contenu a vraiment été modifié
    const shouldPreventClose = hasChanges();
    console.log('🔍 [DEBUG] Should prevent close:', shouldPreventClose);
    
    if (shouldPreventClose) {
      console.log('🔍 [DEBUG] Preventing dialog close due to unsaved changes');
      e.preventDefault();
    } else {
      console.log('🔍 [DEBUG] Allowing dialog close - no changes detected');
    }
  };
  
  // Données de la tâche (utilise les props ou les valeurs par défaut)
  const taskData = task || {
    title: 'Extraction molaire',
    duration: '45 min',
    startDate: '15 janvier 2025',
    totalSessions: 2,
    completedSessions: 1,
    teeth: ['36', '37'],
    doctor: {
      name: 'Dr. Martin Dupont',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Martin',
      initials: 'MD'
    }
  };

  // Utiliser le médecin sélectionné localement ou celui de la tâche
  const currentDoctor = selectedDoctor || taskData.doctor;

  const progressPercentage = (taskData.completedSessions / taskData.totalSessions) * 100;

  // Fonction pour parser les notes et extraire les sections par dent
  const parseNotes = (text) => {
    const sections = {};
    const generalNotes = [];
    
    // Diviser le texte en segments basés sur les @mentions
    const segments = text.split(/(@\d+)/);
    
    let currentTooth = null;
    segments.forEach((segment, index) => {
      if (segment.match(/^@\d+$/)) {
        currentTooth = segment.substring(1);
      } else if (segment.trim()) {
        if (currentTooth) {
          if (!sections[currentTooth]) sections[currentTooth] = [];
          sections[currentTooth].push(segment.trim());
          // Après avoir ajouté le texte à une dent, réinitialiser
          if (index < segments.length - 1 && !segments[index + 1].match(/^@\d+$/)) {
            currentTooth = null;
          }
        } else {
          generalNotes.push(segment.trim());
        }
      }
    });
    
    return { sections, generalNotes };
  };

  // Fonction pour rendre le texte avec les badges d'implants
  const renderTextWithImplants = (text) => {
    // Matches:
    // - digits.digits/digits (e.g., 12.34/567)
    // - digits,digits/digits (e.g., 12,34/567)
    // - digits/digits.digits (e.g., 4/3.5)
    // - digits/digits,digits (e.g., 4/3,5)
    const implantRegex = /(\d+[.,]\d+\/\d+|\d+\/\d+[.,]\d+|\d+\/\d+)/g;
    const parts = text.split(implantRegex);
  
    return parts.map((part, index) => {
      // We need to re-check if the part matches the regex because
      // split() includes the delimiters in the parts array if they are captured.
      if (part.match(new RegExp(implantRegex.source))) { // Use new RegExp with .source to avoid global flag issues
        return (
          <Badge
            key={index}
            variant="outline"
            className="border-purple-300 text-purple-700 mx-1 inline-flex"
          >
            <Package className="w-3 h-3 mr-1" />
            {part}
          </Badge>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const insertToothTag = (tooth) => {
    const textarea = document.getElementById('notes-textarea');
    if (textarea) {
      const cursorPosition = textarea.selectionStart;
      const textBefore = notes.substring(0, cursorPosition);
      const textAfter = notes.substring(cursorPosition);
      setNotes(textBefore + `@${tooth} ` + textAfter);
    }
  };

  const { sections, generalNotes } = parseNotes(notes);

  const handleSave = () => {
    const updatedTask = {
      ...taskData,
      isCompleted,
      notes,
      doctor: selectedDoctor || taskData.doctor,
      parsedNotes: { sections, generalNotes }
    };
    
    // Nettoyer les données non sauvegardées car on sauvegarde
    setUnsavedData(null);
    if (currentToastId) {
      toast.dismiss(currentToastId);
      setCurrentToastId(null);
    }
    
    if (onSave) {
      onSave(updatedTask);
    }
    
    onOpenChange(false);
  };

  const handleCancel = () => {
    console.log('🔍 [DEBUG] handleCancel called');
    const changesDetected = hasChanges();
    console.log('🔍 [DEBUG] Changes detected in handleCancel:', changesDetected);
    
    // Si des changements ont été détectés, sauvegarder en mémoire et afficher toast
    if (changesDetected) {
      const unsavedChanges = {
        notes,
        isCompleted,
        selectedDoctor,
        taskData: taskData
      };
      
      console.log('🔍 [DEBUG] Saving unsaved changes:', unsavedChanges);
      setUnsavedData(unsavedChanges);
      
      // Réinitialiser aux valeurs initiales AVANT de fermer
      setNotes(initialValues.current.notes);
      setIsCompleted(initialValues.current.isCompleted);
      setSelectedDoctor(initialValues.current.doctor);
      
      // Fermer la dialog
      onOpenChange(false);
      
      // Afficher le toast avec option de récupération
      const toastId = toast("Modifications annulées", {
        description: "Vos changements ont été supprimés. Cliquez pour les récupérer.",
        action: {
          label: "Récupérer",
          onClick: () => {
            console.log('🔍 [DEBUG] Toast recovery clicked');
            // Rouvrir la dialog avec les données sauvegardées
            restoreUnsavedData();
            onOpenChange(true);
            setCurrentToastId(null);
          }
        },
        duration: 3500, // 3.5 secondes
        onDismiss: () => {
          console.log('🔍 [DEBUG] Toast dismissed, cleaning unsaved data');
          // Nettoyer les données après fermeture du toast
          setUnsavedData(null);
          setCurrentToastId(null);
        }
      });
      
      setCurrentToastId(toastId);
    } else {
      console.log('🔍 [DEBUG] No changes detected, closing normally');
      // Pas de changements, fermer normalement
      onOpenChange(false);
    }
  };

  const restoreUnsavedData = () => {
    if (unsavedData) {
      setNotes(unsavedData.notes);
      setIsCompleted(unsavedData.isCompleted);
      setSelectedDoctor(unsavedData.selectedDoctor);
      console.log('🔍 [DEBUG] Restored unsaved data:', unsavedData);
    }
  };

  // Note: Pas de restauration automatique - seulement via le bouton du toast

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl [&>button:last-child]:hidden"
        onInteractOutside={handleInteractOutside}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <NeonCheckbox
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="w-5 h-5"
                style={{ '--size': '20px' }}
              />
              <FileText className="w-5 h-5 text-blue-500" />
              {taskData.title}
            </DialogTitle>
            
            {/* Avatar du médecin avec menu contextuel */}
            <div className="flex items-center space-x-4">
              <Popover open={isDoctorPopoverOpen} onOpenChange={setIsDoctorPopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="cursor-pointer hover:opacity-80 transition-opacity">
                    {currentDoctor ? (
                      currentDoctor.profileImage ? (
                        <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-gray-300 hover:border-blue-400 transition-colors">
                          <img
                            src={currentDoctor.profileImage}
                            alt={currentDoctor.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <Avatar className="h-10 w-10 border-2 border-gray-300 hover:border-blue-400 transition-colors">
                          <AvatarFallback className="bg-indigo-500 text-white text-sm font-medium">
                            {generateFallbackAvatar(currentDoctor.name)}
                          </AvatarFallback>
                        </Avatar>
                      )
                    ) : (
                      <Avatar className="h-10 w-10 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors bg-gray-50">
                        <AvatarFallback className="bg-gray-100 text-gray-500 text-sm">
                          <UserIcon className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-white" align="start">
                  <Command className="bg-white">
                    <CommandInput placeholder="Rechercher un médecin..." className="bg-transparent border-b-0" />
                    <CommandList className="bg-white">
                      <CommandEmpty>Aucun médecin trouvé.</CommandEmpty>
                      <CommandGroup>
                        {doctors.map((doctor) => (
                          <CommandItem
                            key={doctor.id}
                            value={doctor.id}
                            onSelect={(value) => {
                              console.log('🔍 [TASK DOCTOR] Selected:', value);
                              const selectedDoctorFromList = doctors.find(d => d.id === value);
                              if (selectedDoctorFromList) {
                                // Toggle logic: if already selected, deselect
                                if (currentDoctor?.id === selectedDoctorFromList.id) {
                                  console.log('🔍 [TASK DOCTOR] Deselecting:', selectedDoctorFromList.name);
                                  setSelectedDoctor(null);
                                  if (onDoctorChange) {
                                    onDoctorChange(null);
                                  }
                                } else {
                                  console.log('🔍 [TASK DOCTOR] Selecting:', selectedDoctorFromList.name);
                                  console.log('🔍 [DEBUG] Setting selectedDoctor to:', selectedDoctorFromList);
                                  setSelectedDoctor(selectedDoctorFromList);
                                  if (onDoctorChange) {
                                    onDoctorChange(selectedDoctorFromList);
                                  }
                                }
                              }
                              // Fermer le popover après sélection
                              setIsDoctorPopoverOpen(false);
                            }}
                            className="flex items-center gap-3 py-2 bg-white hover:bg-gray-50"
                          >
                            {doctor.profileImage ? (
                              <div className="h-8 w-8 rounded-full overflow-hidden border border-gray-300">
                                <img
                                  src={doctor.profileImage}
                                  alt={doctor.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-indigo-500 text-white text-sm font-medium">
                                  {generateFallbackAvatar(doctor.name)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">Dr. {doctor.name}</div>
                              <div className="text-xs text-gray-500">{doctor.specialty}</div>
                            </div>
                            <CheckIcon
                              className={`ml-auto h-4 w-4 text-indigo-600 ${
                                currentDoctor?.id === doctor.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
         

          {/* Informations principales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Nb. Séances
              </Label>
              <p className="font-medium">{taskData.duration}</p>
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Date de début
              </Label>
              <p className="font-medium">{taskData.startDate}</p>
            </div>
          </div>
          
          {/* Dents concernées */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm text-gray-500">Dents concernées</Label>
              {isEditingNotes && (
                <div className="flex gap-1">
                  <span className="text-xs text-gray-400 mr-2">Insérer:</span>
                  {taskData.teeth.map((tooth) => (
                    <Button
                      key={tooth}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => insertToothTag(tooth)}
                    >
                      @{tooth}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ToothBadgeContainer
                taskId={`dialog-task-${taskData.title}`}
                teeth={taskData.teeth}
                maxWidth={300}
                className="flex-1"
              />

            </div>
          </div>
          
          {/* Zone de notes avec clic pour éditer */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-500">Notes</Label>
            
            <div className="relative">
              {!isEditingNotes ? (
                <div 
                  className="min-h-[140px] p-3 border rounded-md bg-gray-50 space-y-3 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setIsEditingNotes(true)}
                >
                  {generalNotes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Notes générales</p>
                      <p className="text-sm">{renderTextWithImplants(generalNotes.join(' '))}</p>
                    </div>
                  )}
                  
                  {Object.entries(sections).map(([tooth, notesArray]) => (
                    <div key={tooth} className="flex items-start gap-2">
                      <Badge variant="default" className="mt-0.5">
                        {tooth}
                      </Badge>
                      <p className="text-sm flex-1">{renderTextWithImplants(notesArray.join(' '))}</p>
                    </div>
                  ))}
                  
                  <p className="text-xs text-gray-400 text-center mt-2">Cliquer pour modifier</p>
                </div>
              ) : (
                <div>
                  <Textarea
                    id="notes-textarea"
                    placeholder="Notes... @36 pour note spécifique, 4.2/6 pour implant"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[140px] resize-none"
                    autoFocus
                    onBlur={() => setIsEditingNotes(false)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    @36 pour dent • 4.2/6 pour implant • Cliquer ailleurs pour valider
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DentalTaskDialog;