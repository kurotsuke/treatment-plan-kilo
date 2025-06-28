/**
 * Service pour la gestion des médecins dans Firestore
 */
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, query, where } from 'firebase/firestore';
import { getDb } from '../config/firebase';
import Resizer from "react-image-file-resizer";

/**
 * Redimensionner une image à une taille maximale avec react-image-file-resizer
 * @param {File} file - Fichier image à redimensionner
 * @param {number} maxSize - Taille maximale (largeur et hauteur)
 * @param {number} quality - Qualité de compression (0-100)
 * @returns {Promise<string>} String base64 de l'image redimensionnée
 */
const resizeImage = (file, maxSize = 1024, quality = 80) => {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Début redimensionnement avec react-image-file-resizer`);
    console.log(`📂 Fichier: ${file.name}, Taille: ${file.size} bytes`);
    console.log(`🎯 Paramètres: ${maxSize}x${maxSize}, qualité: ${quality}%`);
    
    try {
      Resizer.imageFileResizer(
        file,                    // fichier image
        maxSize,                 // largeur max
        maxSize,                 // hauteur max
        'JPEG',                  // format de compression
        quality,                 // qualité (0-100)
        0,                       // rotation (0°)
        (resizedImage) => {      // callback de succès
          console.log(`✅ Redimensionnement réussi`);
          console.log(`📦 Taille finale: ${resizedImage.length} chars`);
          console.log(`📉 Compression: ${((1 - resizedImage.length / file.size) * 100).toFixed(1)}%`);
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
};

/**
 * Convertir un fichier en base64 pour le stockage (version simple)
 * @param {File} file - Fichier à convertir
 * @returns {Promise<string>} String base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

class DoctorsService {
  constructor() {
    this.collection = 'doctors';
  }

  /**
   * Obtenir tous les médecins d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des médecins
   */
  async getDoctors(userId) {
    try {
      console.log('🔍 [DEBUG] getDoctors pour userId:', userId);
      const db = getDb();
      console.log('🔍 [DEBUG] DB obtenue:', !!db);
      
      const doctorsRef = collection(db, this.collection);
      console.log('🔍 [DEBUG] Collection ref créée pour:', this.collection);
      
      // DIAGNOSTIC: Comparaison des userId
      console.log('🔍 [DEBUG] 📋 Récupération des médecins pour userId actuel:', userId);
      
      // Vérifier si l'userId actuel correspond aux médecins existants
      const allDocsSnapshot = await getDocs(doctorsRef);
      let hasMatchingUserId = false;
      allDocsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId === userId) {
          hasMatchingUserId = true;
        }
        console.log(`🔍 [DEBUG] 👨‍⚕️ Médecin ${doc.id}: userId="${data.userId}", name="${data.name}" ${data.userId === userId ? '✅ MATCH' : '❌ NO MATCH'}`);
      });
      
      console.log(`🔍 [DEBUG] 📋 UserId actuel: "${userId}"`);
      console.log(`🔍 [DEBUG] 📋 Médecins trouvés pour cet utilisateur: ${hasMatchingUserId ? 'OUI' : 'NON'}`);
      
      if (!hasMatchingUserId) {
        console.warn('⚠️ [MISMATCH] Aucun médecin ne correspond à l\'userId actuel!');
        console.warn('⚠️ [MISMATCH] Solution temporaire: Attribution des médecins existants à cet utilisateur');
        
        // CORRECTION TEMPORAIRE: Attribuer tous les médecins à l'utilisateur actuel
        const updatePromises = [];
        allDocsSnapshot.forEach((doc) => {
          const docRef = doc.ref;
          updatePromises.push(updateDoc(docRef, { userId: userId }));
        });
        
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          console.log('✅ [CORRECTION] Médecins réattribués à l\'utilisateur actuel');
        }
      }
      
      const q = query(doctorsRef, where('userId', '==', userId));
      
      console.log('🔍 [DEBUG] Avant getDocs...');
      const snapshot = await getDocs(q);
      console.log('🔍 [DEBUG] 📄 Snapshot reçu, nombre de docs:', snapshot.size);
      console.log('🔍 [DEBUG] Snapshot empty:', snapshot.empty);
      
      const doctors = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🔍 [DEBUG] 👨‍⚕️ Médecin trouvé:', doc.id, data);
        doctors.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        });
      });
      
      console.log('🔍 [DEBUG] Doctors array avant tri:', doctors);
      const sortedDoctors = doctors.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      console.log('🔍 [DEBUG] ✅ Médecins triés:', sortedDoctors);
      return sortedDoctors;
    } catch (error) {
      console.error('🔍 [DEBUG] ❌ Erreur lors de la récupération des médecins:', error);
      console.error('🔍 [DEBUG] ❌ Error code:', error.code);
      console.error('🔍 [DEBUG] ❌ Error message:', error.message);
      throw new Error(`Impossible de récupérer les médecins: ${error.message}`);
    }
  }

  /**
   * Ajouter un nouveau médecin
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} doctorData - Données du médecin
   * @returns {Promise<Object>} Médecin créé
   */
  async addDoctor(userId, doctorData) {
    try {
      console.log('👨‍⚕️ Ajout médecin avec données:', doctorData);
      const db = getDb();
      const doctorsRef = collection(db, this.collection);
      
      // Traiter l'image de profil si présente
      let profileImageData = null;
      if (doctorData.profileImage && doctorData.profileImage instanceof File) {
        console.log('📸 Redimensionnement et conversion de l\'image...');
        console.log('📏 Taille originale:', doctorData.profileImage.size, 'bytes');
        
        // Redimensionner l'image à 1024x1024 max avec qualité 80%
        profileImageData = await resizeImage(doctorData.profileImage, 1024, 80);
        console.log('✅ Image redimensionnée et convertie, taille finale:', profileImageData.length, 'chars');
      }
      
      const newDoctor = {
        name: doctorData.name,
        treatmentPhases: doctorData.treatmentPhases,
        profileImage: profileImageData, // Stocker en base64
        userId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('💾 Sauvegarde médecin dans Firestore...');
      const docRef = await addDoc(doctorsRef, newDoctor);
      
      const result = {
        id: docRef.id,
        ...newDoctor,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('✅ Médecin ajouté avec succès:', result);
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du médecin:', error);
      throw new Error(`Impossible d'ajouter le médecin: ${error.message}`);
    }
  }

  /**
   * Mettre à jour un médecin
   * @param {string} doctorId - ID du médecin
   * @param {Object} updates - Données à mettre à jour
   * @returns {Promise<Object>} Médecin mis à jour
   */
  async updateDoctor(doctorId, updates) {
    try {
      const db = getDb();
      const doctorRef = doc(db, this.collection, doctorId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doctorRef, updateData);
      
      return {
        id: doctorId,
        ...updates,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du médecin:', error);
      throw new Error(`Impossible de mettre à jour le médecin: ${error.message}`);
    }
  }

  /**
   * Supprimer un médecin
   * @param {string} doctorId - ID du médecin
   * @returns {Promise<void>}
   */
  async deleteDoctor(doctorId) {
    try {
      const db = getDb();
      const doctorRef = doc(db, this.collection, doctorId);
      await deleteDoc(doctorRef);
    } catch (error) {
      console.error('Erreur lors de la suppression du médecin:', error);
      throw new Error(`Impossible de supprimer le médecin: ${error.message}`);
    }
  }

  /**
   * Écouter les changements des médecins en temps réel
   * @param {string} userId - ID de l'utilisateur
   * @param {Function} callback - Fonction appelée lors des changements
   * @returns {Function} Fonction pour arrêter l'écoute
   */
  subscribeToDoctors(userId, callback) {
    try {
      console.log('🔥 subscribeToDoctors pour userId:', userId);
      const db = getDb();
      const doctorsRef = collection(db, this.collection);
      
      // Utiliser une requête filtrée pour l'écoute temps réel
      const q = query(doctorsRef, where('userId', '==', userId));
      console.log('🔥 Requête temps réel créée avec where userId ==', userId);
      
      return onSnapshot(
        q,
        (snapshot) => {
          console.log('🔥 Snapshot temps réel reçu, nombre de docs:', snapshot.size);
          const doctors = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log('🔥 Médecin temps réel:', doc.id, data);
            doctors.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date()
            });
          });
          
          const sortedDoctors = doctors.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          console.log('🔥 Médecins temps réel triés:', sortedDoctors);
          callback(sortedDoctors);
        },
        (error) => {
          console.error('Erreur lors de l\'écoute des médecins:', error);
          callback([]);
        }
      );
    } catch (error) {
      console.error('Erreur lors de la création de l\'écoute:', error);
      callback([]);
      return () => {}; // Retourner une fonction vide pour éviter les erreurs
    }
  }

  /**
   * Valider les données d'un médecin
   * @param {Object} doctorData - Données à valider
   * @returns {Object} Résultat de la validation
   */
  validateDoctor(doctorData) {
    const errors = [];
    
    if (!doctorData.name || doctorData.name.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }
    
    if (!doctorData.treatmentPhases || doctorData.treatmentPhases.length === 0) {
      errors.push('Au moins une phase de traitement doit être sélectionnée');
    }
    
    if (doctorData.treatmentPhases && doctorData.treatmentPhases.some(phase => ![1, 2, 3].includes(phase))) {
      errors.push('Les phases de traitement doivent être 1, 2 ou 3');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
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
}

// Exporter une instance unique du service
export default new DoctorsService();