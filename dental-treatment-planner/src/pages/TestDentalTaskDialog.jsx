import React, { useState } from 'react';
import DentalTaskDialog from '../components/DentalTaskDialog';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const TestDentalTaskDialog = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState({
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
    },
    notes: 'Patient sous anticoagulants. @36 Racine courbée, extraction difficile. Implant 4.2/6 prévu. @37 Carie profonde. Prévoir antibiotiques post-opératoires.',
    isCompleted: false
  });

  // Données pour tester différents scénarios
  const [taskVariants] = useState([
    {
      id: 'task1',
      name: 'Extraction molaire (test principal)',
      task: {
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
        },
        notes: 'Patient sous anticoagulants. @36 Racine courbée, extraction difficile. Implant 4.2/6 prévu. @37 Carie profonde. Prévoir antibiotiques post-opératoires.',
        isCompleted: false
      }
    },
    {
      id: 'task2',
      name: 'Traitement endodontique (tâche complexe)',
      task: {
        title: 'Traitement endodontique',
        duration: '90 min',
        startDate: '22 janvier 2025',
        totalSessions: 3,
        completedSessions: 0,
        teeth: ['14', '15', '16'],
        doctor: {
          name: 'Dr. Sarah Lambert',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
          initials: 'SL'
        },
        notes: 'Traitement canalaire complexe. @14 Pulpite irréversible, canal calcifié. @15 Nécrose pulpaire. @16 Anatomie complexe, utiliser microscope. Implant 3.7/10 si échec endo.',
        isCompleted: false
      }
    },
    {
      id: 'task3',
      name: 'Pose Implant (tâche terminée)',
      task: {
        title: 'Pose implant ',
        duration: '60 min',
        startDate: '8 janvier 2025',
        totalSessions: 2,
        completedSessions: 2,
        teeth: ['26'],
        doctor: {
          name: 'Dr. Pierre Moreau',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pierre',
          initials: 'PM'
        },
        notes: '  ',
        isCompleted: true
      }
    },
    {
      id: 'task4',
      name: 'Détartrage simple (notes générales)',
      task: {
        title: 'Détartrage et polissage',
        duration: '30 min',
        startDate: '28 janvier 2025',
        totalSessions: 1,
        completedSessions: 0,
        teeth: ['11', '12', '13', '21', '22', '23'],
        doctor: {
          name: 'Dr. Marie Dubois',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
          initials: 'MD'
        },
        notes: 'Patient motivé pour l\'hygiène. Brossage 2x/jour recommandé. Contrôle dans 6 mois.',
        isCompleted: false
      }
    }
  ]);

  const handleSave = (updatedTask) => {
    console.log('✅ Tâche mise à jour:', updatedTask);
    setCurrentTask(updatedTask);
    
    // Simulation de sauvegarde en base de données
    setTimeout(() => {
      console.log('💾 Tâche sauvegardée en base de données');
    }, 500);
  };

  const handleDoctorChange = (newDoctor) => {
    console.log('👨‍⚕️ Changement de médecin:', newDoctor?.name || 'Médecin désélectionné');
    setCurrentTask(prevTask => ({
      ...prevTask,
      doctor: newDoctor
    }));
  };

  const handleOpenTask = (taskVariant) => {
    console.log('🔍 Ouverture de la tâche:', taskVariant.name);
    setCurrentTask(taskVariant.task);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test du composant DentalTaskDialog
        </h1>
        
        {/* Informations du test */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informations du test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Composant:</span> DentalTaskDialog
              </div>
              <div>
                <span className="font-medium">Mode:</span> Tests interactifs
              </div>
              <div>
                <span className="font-medium">Scénarios:</span> {taskVariants.length}
              </div>
              <div>
                <span className="font-medium">Props testées:</span> open, onOpenChange, task, onSave
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scénarios de test */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {taskVariants.map((variant) => (
            <Card key={variant.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  {variant.name}
                  {variant.task.isCompleted && (
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      Terminée
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Titre:</span> {variant.task.title}
                  </div>
                  <div>
                    <span className="font-medium">Durée:</span> {variant.task.duration}
                  </div>
                  <div>
                    <span className="font-medium">Médecin:</span> {variant.task.doctor.name}
                  </div>
                  <div>
                    <span className="font-medium">Dents:</span> {variant.task.teeth.join(', ')}
                  </div>
                  <div>
                    <span className="font-medium">Progression:</span> {variant.task.completedSessions}/{variant.task.totalSessions} séances
                  </div>
                </div>
                <Button 
                  onClick={() => handleOpenTask(variant)}
                  className="w-full mt-4"
                  variant={variant.task.isCompleted ? "outline" : "default"}
                >
                  Ouvrir cette tâche
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fonctionnalités testées */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Fonctionnalités testées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Affichage des informations:</strong> Titre, durée, médecin, dents</li>
                <li><strong>Progression:</strong> Barre de progression avec séances</li>
                <li><strong>Avatar médecin:</strong> Image et initiales</li>
                <li><strong>États de tâche:</strong> Terminée/en cours via checkbox</li>
              </ul>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Notes avancées:</strong> Parsing @dent et implants</li>
                <li><strong>Édition notes:</strong> Clic pour éditer, insertion tags</li>
                <li><strong>Badges implants:</strong> Détection automatique (ex: 4.2/6)</li>
                <li><strong>Callbacks:</strong> onSave et onOpenChange</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Instructions d'utilisation */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Instructions d'utilisation</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>Cliquez sur un bouton "Ouvrir cette tâche" pour tester un scénario</li>
              <li>Dans la modal: cochez/décochez la case pour marquer comme terminée</li>
              <li>Cliquez sur la zone de notes pour passer en mode édition</li>
              <li>Utilisez les boutons @36, @37 etc. pour insérer des tags de dents</li>
              <li>Tapez des références d'implants (ex: 4.2/6) pour voir les badges</li>
              <li>Cliquez "Enregistrer" pour déclencher le callback onSave</li>
              <li>Consultez la console pour voir les données sauvegardées</li>
            </ul>
          </CardContent>
        </Card>

        {/* Modal du composant testé */}
        <DentalTaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          task={currentTask}
          onSave={handleSave}
          onDoctorChange={handleDoctorChange}
        />
      </div>
    </div>
  );
};

export default TestDentalTaskDialog;