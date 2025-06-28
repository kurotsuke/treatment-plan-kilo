/**
 * Service des médecins refactorisé avec la nouvelle couche d'abstraction
 * Version 2.0 - Utilise BaseRepository pour éliminer la redondance
 */
import { BaseRepository, BaseSchema, ValidationTypes } from '../../core/firebase';
import Resizer from "react-image-file-resizer";

// Schéma de validation pour les médecins
const DoctorSchema = new BaseSchema({
  name: [ValidationTypes.REQUIRED, ValidationTypes.STRING],
  treatmentPhases: [ValidationTypes.REQUIRED, ValidationTypes.ARRAY],
  profileImage: ValidationTypes.STRING, // Optionnel
  // Validation personnalisée pour les phases de traitement
  treatmentPhases: (value) => {
    if (!Array.isArray(value) || value.length === 0) {
      return 'Au moins une phase de traitement doit être sélectionnée';
    }
    
    const validPhases = [1, 2, 3];
    const invalidPhases = value.filter(phase => !validPhases.includes(phase));
    
    if (invalidPhases.length > 0) {
      return 'Les phases de traitement doivent être 1, 2 ou 3';
    }
    
    return true;
  }
});

class DoctorsServiceV2 extends BaseRepository {
  constructor() {
    super('doctors', DoctorSchema);
    console.log('👨‍⚕️ DoctorsServiceV2 initialisé avec BaseRepository');
  }

  /**
   * Obtenir tous les médecins d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} filters - Filtres optionnels
   * @returns {Promise<Array>} Liste des médecins
   */
  async getDoctors(userId, filters = {}) {
    console.log('👨‍⚕️ getDoctors V2 pour userId:', userId);
    
    // Utiliser la méthode héritée de BaseRepository
    const doctors = await this.findAll(userId, filters);
    
    // Tri spécifique aux médecins par nom
    doctors.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    console.log('✅ Médecins récupérés V2:', doctors.length);
    return doctors;
  }

  /**
   * Ajouter un nouveau médecin
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} doctorData - Données du médecin
   * @returns {Promise<Object>} Médecin créé
   */
  async addDoctor(userId, doctorData) {
    console.log('👨‍⚕️ Ajout médecin V2 avec données:', doctorData);
    
    // Traiter l'image de profil si présente
    let processedData = { ...doctorData };
    
    if (doctorData.profileImage && doctorData.profileImage instanceof File) {
      console.log('📸 Traitement de l\'image de profil...');
      processedData.profileImage = await this.processProfileImage(doctorData.profileImage);
    }
    
    // Utiliser la méthode héritée de BaseRepository (avec validation automatique)
    const newDoctor = await this.create(userId, processedData);
    
    console.log('✅ Médecin ajouté V2:', newDoctor.id);
    return newDoctor;
  }

  /**
   * Mettre à jour un médecin
   * @param {string} doctorId - ID du médecin
   * @param {Object} updates - Données à mettre à jour
   * @param {string} userId - ID de l'utilisateur (pour le cache)
   * @returns {Promise<Object>} Médecin mis à jour
   */
  async updateDoctor(doctorId, updates, userId = null) {
    console.log('👨‍⚕️ Mise à jour médecin V2:', doctorId);
    
    // Traiter l'image de profil si présente dans les updates
    let processedUpdates = { ...updates };
    
    if (updates.profileImage && updates.profileImage instanceof File) {
      console.log('📸 Traitement de la nouvelle image de profil...');
      processedUpdates.profileImage = await this.processProfileImage(updates.profileImage);
    }
    
    // Utiliser la méthode héritée de BaseRepository (avec validation automatique)
    const updatedDoctor = await this.update(doctorId, processedUpdates, userId);
    
    console.log('✅ Médecin mis à jour V2:', doctorId);
    return updatedDoctor;
  }

  /**
   * Supprimer un médecin
   * @param {string} doctorId - ID du médecin
   * @param {string} userId - ID de l'utilisateur (pour le cache)
   * @returns {Promise<void>}
   */
  async deleteDoctor(doctorId, userId = null) {
    console.log('👨‍⚕️ Suppression médecin V2:', doctorId);
    
    // Utiliser la méthode héritée de BaseRepository
    await this.delete(doctorId, userId);
    
    console.log('✅ Médecin supprimé V2:', doctorId);
  }

  /**
   * S'abonner aux changements des médecins en temps réel
   * @param {string} userId - ID de l'utilisateur
   * @param {Function} callback - Fonction appelée lors des changements
   * @returns {Function} Fonction pour arrêter l'écoute
   */
  subscribeToDoctors(userId, callback) {
    console.log('🔥 subscribeToDoctors V2 pour userId:', userId);
    
    // Utiliser la méthode héritée de BaseRepository avec tri personnalisé
    return this.subscribe(userId, (doctors) => {
      // Tri spécifique aux médecins
      const sortedDoctors = doctors.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      console.log('🔥 Médecins temps réel V2:', sortedDoctors.length);
      callback(sortedDoctors);
    });
  }

  /**
   * Traiter et redimensionner une image de profil
   * @param {File} file - Fichier image à traiter
   * @returns {Promise<string>} Image redimensionnée en base64
   */
  async processProfileImage(file) {
    return new Promise((resolve, reject) => {
      console.log('🔧 Début redimensionnement image de profil');
      console.log('📂 Fichier:', file.name, 'Taille:', file.size, 'bytes');
      
      try {
        Resizer.imageFileResizer(
          file,                    // fichier image
          1024,                    // largeur max
          1024,                    // hauteur max
          'JPEG',                  // format de compression
          80,                      // qualité (0-100)
          0,                       // rotation (0°)
          (resizedImage) => {      // callback de succès
            console.log('✅ Redimensionnement réussi');
            console.log('📦 Taille finale:', resizedImage.length, 'chars');
            
            // Vérifier la taille finale
            const sizeInBytes = (resizedImage.length * 3) / 4;
            if (sizeInBytes > 100 * 1024) { // 100KB max
              reject(new Error('L\'image est trop volumineuse même après compression'));
              return;
            }
            
            resolve(resizedImage);
          },
          'base64',                // type de sortie
          200,                     // largeur min
          200                      // hauteur min
        );
      } catch (error) {
        console.error('❌ Erreur lors du redimensionnement:', error);
        reject(new Error(`Erreur lors du redimensionnement: ${error.message}`));
      }
    });
  }

  /**
   * Obtenir les phases de traitement disponibles
   * @returns {Array} Liste des phases
   */
  getTreatmentPhases() {
    return [
      { id: 1, name: 'Phase 1 - Préparation', description: 'Examens et préparation' },
      { id: 2, name: 'Phase 2 - Traitement', description: 'Traitement principal' },
      { id: 3, name: 'Phase 3 - Finalisation', description: 'Finition et suivi' }
    ];
  }

  /**
   * Valider les données d'un médecin (méthode publique pour compatibilité)
   * @param {Object} doctorData - Données à valider
   * @returns {Object} Résultat de la validation
   */
  validateDoctor(doctorData) {
    // Utiliser le schéma de validation intégré
    return this.schema.validate(doctorData);
  }

  /**
   * Rechercher des médecins par nom
   * @param {string} userId - ID de l'utilisateur
   * @param {string} searchTerm - Terme de recherche
   * @returns {Promise<Array>} Médecins correspondants
   */
  async searchDoctors(userId, searchTerm) {
    console.log('🔍 Recherche médecins V2:', searchTerm);
    
    if (!searchTerm || searchTerm.trim().length < 2) {
      return [];
    }
    
    // Récupérer tous les médecins et filtrer côté client
    // Note: Pour une vraie recherche full-text, utiliser Algolia ou similaire
    const allDoctors = await this.getDoctors(userId);
    
    const searchTermLower = searchTerm.toLowerCase();
    const filteredDoctors = allDoctors.filter(doctor => {
      const name = doctor.name?.toLowerCase() || '';
      return name.includes(searchTermLower);
    });
    
    console.log('✅ Médecins trouvés V2:', filteredDoctors.length);
    return filteredDoctors;
  }

  /**
   * Obtenir les médecins par phase de traitement
   * @param {string} userId - ID de l'utilisateur
   * @param {number} phase - Phase de traitement (1, 2, ou 3)
   * @returns {Promise<Array>} Médecins de cette phase
   */
  async getDoctorsByPhase(userId, phase) {
    console.log('🔍 Médecins par phase V2:', phase);
    
    const allDoctors = await this.getDoctors(userId);
    const doctorsByPhase = allDoctors.filter(doctor => 
      doctor.treatmentPhases && doctor.treatmentPhases.includes(phase)
    );
    
    console.log('✅ Médecins phase', phase, ':', doctorsByPhase.length);
    return doctorsByPhase;
  }

  /**
   * Obtenir les statistiques des médecins
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Statistiques
   */
  async getDoctorsStats(userId) {
    console.log('📊 Statistiques médecins V2');
    
    const doctors = await this.getDoctors(userId);
    
    const stats = {
      total: doctors.length,
      byPhase: {
        phase1: doctors.filter(d => d.treatmentPhases?.includes(1)).length,
        phase2: doctors.filter(d => d.treatmentPhases?.includes(2)).length,
        phase3: doctors.filter(d => d.treatmentPhases?.includes(3)).length
      },
      withProfileImage: doctors.filter(d => d.profileImage).length,
      recentlyAdded: doctors.filter(d => {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return d.createdAt > dayAgo;
      }).length
    };
    
    console.log('✅ Statistiques calculées V2:', stats);
    return stats;
  }

  /**
   * Exporter les médecins au format JSON
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<string>} JSON des médecins
   */
  async exportDoctors(userId) {
    console.log('📤 Export médecins V2');
    
    const doctors = await this.getDoctors(userId);
    
    // Nettoyer les données pour l'export (supprimer les images base64)
    const exportData = doctors.map(doctor => ({
      id: doctor.id,
      name: doctor.name,
      treatmentPhases: doctor.treatmentPhases,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt
    }));
    
    const jsonData = JSON.stringify(exportData, null, 2);
    console.log('✅ Export terminé V2:', exportData.length, 'médecins');
    
    return jsonData;
  }
}

// Exporter une instance unique du service
export default new DoctorsServiceV2();

// Exporter aussi la classe pour les tests
export { DoctorsServiceV2 };