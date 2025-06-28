import React, { useState, useCallback, useEffect } from 'react';
import { X, Plus, Link2, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { cn } from '../../lib/utils';

/**
 * Types de dépendances disponibles
 */
const DEPENDENCY_TYPES = [
  { value: 'FD', label: 'Fin → Début', color: '#3B82F6', description: 'La tâche commence après la fin de la précédente' },
  { value: 'DD', label: 'Début → Début', color: '#10B981', description: 'Les deux tâches commencent en même temps' },
  { value: 'FF', label: 'Fin → Fin', color: '#F59E0B', description: 'Les deux tâches finissent en même temps' },
  { value: 'DF', label: 'Début → Fin', color: '#EF4444', description: 'La tâche finit après le début de la précédente' },
];

/**
 * Composant pour afficher une dépendance dans la liste
 */
const DependencyItem = ({ dependency, task, allTasks, onEdit, onDelete, onToggle }) => {
  const dependencyType = DEPENDENCY_TYPES.find(t => t.value === dependency.type) || DEPENDENCY_TYPES[0];
  const relatedTask = allTasks.find(t => 
    t.id === dependency.id_tache_precedente || t.id === dependency.id_tache_suivante
  );
  
  const isIncoming = dependency.id_tache_suivante === task.id;
  
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border",
      dependency.active === false ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300"
    )}>
      <div className="flex items-center gap-3 flex-1">
        <div 
          className="w-2 h-8 rounded-full"
          style={{ backgroundColor: dependencyType.color }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {isIncoming ? 'Depuis' : 'Vers'}: {relatedTask?.nomActe || relatedTask?.name || 'Tâche inconnue'}
            </span>
            <Badge variant="outline" className="text-xs">
              {dependencyType.label}
            </Badge>
            {dependency.active === false && (
              <Badge variant="secondary" className="text-xs">
                Désactivée
              </Badge>
            )}
          </div>
          {dependency.decalage && (
            <span className="text-xs text-gray-500">
              Décalage: +{dependency.decalage.valeur} {dependency.decalage.unite}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Switch
          checked={dependency.active !== false}
          onCheckedChange={(checked) => onToggle(dependency, checked)}
          className="data-[state=checked]:bg-blue-600"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(dependency)}
          className="h-8 w-8 p-0"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(dependency)}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

/**
 * Formulaire d'édition/création de dépendance
 */
const DependencyForm = ({ 
  dependency, 
  sourceTask, 
  targetTask, 
  allTasks, 
  onSave, 
  onCancel,
  isCreating = false 
}) => {
  const [formData, setFormData] = useState({
    type: dependency?.type || 'FD',
    decalage: {
      valeur: dependency?.decalage?.valeur || 0,
      unite: dependency?.decalage?.unite || 'jours'
    },
    active: dependency?.active !== false,
    id_tache_precedente: dependency?.id_tache_precedente || sourceTask?.id || '',
    id_tache_suivante: dependency?.id_tache_suivante || targetTask?.id || ''
  });
  
  const [validationError, setValidationError] = useState('');
  
  // Valider les dépendances circulaires
  const validateDependency = useCallback(() => {
    if (formData.id_tache_precedente === formData.id_tache_suivante) {
      setValidationError('Une tâche ne peut pas dépendre d\'elle-même');
      return false;
    }
    
    // TODO: Implémenter la détection de dépendances circulaires plus complexes
    
    setValidationError('');
    return true;
  }, [formData]);
  
  useEffect(() => {
    validateDependency();
  }, [formData, validateDependency]);
  
  const handleSubmit = () => {
    if (!validateDependency()) return;
    
    onSave({
      ...formData,
      id: dependency?.id || `${formData.id_tache_precedente}-${formData.id_tache_suivante}`
    });
  };
  
  const selectedType = DEPENDENCY_TYPES.find(t => t.value === formData.type);
  
  return (
    <div className="space-y-4">
      {isCreating && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="source-task">Tâche source</Label>
            <Select
              value={formData.id_tache_precedente}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                id_tache_precedente: value 
              }))}
            >
              <SelectTrigger id="source-task">
                <SelectValue placeholder="Sélectionner une tâche" />
              </SelectTrigger>
              <SelectContent>
                {allTasks.map(task => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.nomActe || task.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="target-task">Tâche cible</Label>
            <Select
              value={formData.id_tache_suivante}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                id_tache_suivante: value 
              }))}
            >
              <SelectTrigger id="target-task">
                <SelectValue placeholder="Sélectionner une tâche" />
              </SelectTrigger>
              <SelectContent>
                {allTasks.map(task => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.nomActe || task.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      <div>
        <Label htmlFor="dependency-type">Type de dépendance</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger id="dependency-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEPENDENCY_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedType && (
          <p className="text-xs text-gray-500 mt-1">{selectedType.description}</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="delay-value">Décalage</Label>
          <input
            id="delay-value"
            type="number"
            min="0"
            value={formData.decalage.valeur}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              decalage: { ...prev.decalage, valeur: parseInt(e.target.value) || 0 }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <Label htmlFor="delay-unit">Unité</Label>
          <Select
            value={formData.decalage.unite}
            onValueChange={(value) => setFormData(prev => ({
              ...prev,
              decalage: { ...prev.decalage, unite: value }
            }))}
          >
            <SelectTrigger id="delay-unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jours">Jours</SelectItem>
              <SelectItem value="semaines">Semaines</SelectItem>
              <SelectItem value="mois">Mois</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
        />
        <Label htmlFor="active">Dépendance active</Label>
      </div>
      
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!!validationError}
        >
          {isCreating ? 'Créer' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </div>
  );
};

/**
 * Composant principal de gestion des dépendances
 */
const DependencyManager = ({
  task,
  allTasks,
  dependencies,
  onAddDependency,
  onUpdateDependency,
  onDeleteDependency,
  onClose
}) => {
  const [editingDependency, setEditingDependency] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Séparer les dépendances entrantes et sortantes
  const { incoming, outgoing } = React.useMemo(() => {
    const taskDeps = dependencies.filter(dep => 
      dep.id_tache_precedente === task.id || dep.id_tache_suivante === task.id
    );
    
    return {
      incoming: taskDeps.filter(dep => dep.id_tache_suivante === task.id),
      outgoing: taskDeps.filter(dep => dep.id_tache_precedente === task.id)
    };
  }, [dependencies, task.id]);
  
  const handleToggleDependency = (dependency, active) => {
    onUpdateDependency({
      ...dependency,
      active
    });
  };
  
  const handleDeleteDependency = (dependency) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépendance ?')) {
      onDeleteDependency(dependency);
    }
  };
  
  const handleSaveDependency = (dependencyData) => {
    if (editingDependency) {
      onUpdateDependency(dependencyData);
    } else {
      onAddDependency(dependencyData);
    }
    setEditingDependency(null);
    setIsCreating(false);
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Gérer les dépendances - {task.nomActe || task.name}
          </DialogTitle>
          <DialogDescription>
            Gérez les relations entre cette tâche et les autres tâches du projet
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Dépendances entrantes */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="text-blue-600">→</span>
              Dépendances entrantes ({incoming.length})
            </h3>
            {incoming.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                Cette tâche ne dépend d'aucune autre tâche
              </p>
            ) : (
              <div className="space-y-2">
                {incoming.map(dep => (
                  <DependencyItem
                    key={dep.id || `${dep.id_tache_precedente}-${dep.id_tache_suivante}`}
                    dependency={dep}
                    task={task}
                    allTasks={allTasks}
                    onEdit={setEditingDependency}
                    onDelete={handleDeleteDependency}
                    onToggle={handleToggleDependency}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Dépendances sortantes */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="text-green-600">←</span>
              Dépendances sortantes ({outgoing.length})
            </h3>
            {outgoing.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                Aucune tâche ne dépend de celle-ci
              </p>
            ) : (
              <div className="space-y-2">
                {outgoing.map(dep => (
                  <DependencyItem
                    key={dep.id || `${dep.id_tache_precedente}-${dep.id_tache_suivante}`}
                    dependency={dep}
                    task={task}
                    allTasks={allTasks}
                    onEdit={setEditingDependency}
                    onDelete={handleDeleteDependency}
                    onToggle={handleToggleDependency}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Bouton d'ajout */}
          <div className="pt-4">
            <Button
              onClick={() => setIsCreating(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une dépendance
            </Button>
          </div>
        </div>
        
        {/* Formulaire d'édition/création */}
        {(editingDependency || isCreating) && (
          <Dialog open onOpenChange={() => {
            setEditingDependency(null);
            setIsCreating(false);
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isCreating ? 'Créer une dépendance' : 'Modifier la dépendance'}
                </DialogTitle>
              </DialogHeader>
              <DependencyForm
                dependency={editingDependency}
                sourceTask={isCreating ? task : null}
                targetTask={null}
                allTasks={allTasks}
                onSave={handleSaveDependency}
                onCancel={() => {
                  setEditingDependency(null);
                  setIsCreating(false);
                }}
                isCreating={isCreating}
              />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DependencyManager;