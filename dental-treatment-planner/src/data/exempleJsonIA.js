/**
 * Exemple de structure JSON retournée par l'IA pour un plan de traitement dentaire
 * avec dates relatives et dépendances
 */

export const exempleJsonIA = {
  "medecins_par_phase": {
    "1 - Phase de soins": "Dr. Martin",
    "2 - Phase fonctionnelle et orthodontie": "Dr. Dubois",
    "3 - Phase esthétique": "Dr. Laurent"
  },
  "taches": [
    {
      "id": "T1",
      "nom": "Consultation initiale et bilan",
      "phase": 1,
      "duree": { "valeur": 1, "unite": "jour" },
      "dependances": [],
      "medecin": "Dr. Martin"
    },
    {
      "id": "T2",
      "nom": "Détartrage complet (dents: toutes)",
      "phase": 1,
      "duree": { "valeur": 1, "unite": "jour" },
      "dependances": [
        {
          "id_tache_precedente": "T1",
          "type": "fin-debut",
          "decalage": { "valeur": 2, "unite": "jours" }
        }
      ]
    },
    {
      "id": "T3",
      "nom": "Extraction (dents: 18, 28)",
      "phase": 1,
      "duree": { "valeur": 1, "unite": "jour" },
      "dependances": [
        {
          "id_tache_precedente": "T2",
          "type": "fin-debut",
          "decalage": { "valeur": 1, "unite": "semaine" }
        }
      ]
    },
    {
      "id": "T4",
      "nom": "Cicatrisation post-extraction",
      "phase": 1,
      "duree": { "valeur": 3, "unite": "semaines" },
      "dependances": [
        {
          "id_tache_precedente": "T3",
          "type": "fin-debut",
          "decalage": { "valeur": 0, "unite": "jour" }
        }
      ],
      "medecin": "Patient"
    },
    {
      "id": "T5",
      "nom": "Traitement carie (dents: 16, 26)",
      "phase": 1,
      "duree": { "valeur": 2, "unite": "jours" },
      "dependances": [
        {
          "id_tache_precedente": "T2",
          "type": "fin-debut",
          "decalage": { "valeur": 3, "unite": "jours" }
        }
      ]
    },
    {
      "id": "T6",
      "nom": "Pose implant (dents: 36)",
      "phase": 2,
      "duree": { "valeur": 1, "unite": "jour" },
      "dependances": [
        {
          "id_tache_precedente": "T4",
          "type": "fin-debut",
          "decalage": { "valeur": 1, "unite": "semaine" }
        }
      ],
      "medecin": "Dr. Dubois"
    },
    {
      "id": "T7",
      "nom": "Cicatrisation implant",
      "phase": 2,
      "duree": { "valeur": 4, "unite": "mois" },
      "dependances": [
        {
          "id_tache_precedente": "T6",
          "type": "fin-debut",
          "decalage": { "valeur": 0, "unite": "jour" }
        }
      ],
      "medecin": "Patient"
    },
    {
      "id": "T8",
      "nom": "Prise d'empreinte couronne (dents: 36)",
      "phase": 2,
      "duree": { "valeur": 1, "unite": "jour" },
      "dependances": [
        {
          "id_tache_precedente": "T7",
          "type": "fin-debut",
          "decalage": { "valeur": 1, "unite": "semaine" }
        }
      ]
    },
    {
      "id": "T9",
      "nom": "Pose couronne définitive (dents: 36)",
      "phase": 2,
      "duree": { "valeur": 1, "unite": "jour" },
      "dependances": [
        {
          "id_tache_precedente": "T8",
          "type": "fin-debut",
          "decalage": { "valeur": 2, "unite": "semaines" }
        }
      ]
    },
    {
      "id": "T10",
      "nom": "Blanchiment dentaire (dents: toutes)",
      "phase": 3,
      "duree": { "valeur": 2, "unite": "jours" },
      "dependances": [
        {
          "id_tache_precedente": "T9",
          "type": "fin-debut",
          "decalage": { "valeur": 2, "unite": "semaines" }
        }
      ],
      "medecin": "Dr. Laurent"
    },
    {
      "id": "T11",
      "nom": "Pose facettes (dents: 11, 21)",
      "phase": 3,
      "duree": { "valeur": 2, "unite": "jours" },
      "dependances": [
        {
          "id_tache_precedente": "T10",
          "type": "fin-debut",
          "decalage": { "valeur": 1, "unite": "semaine" }
        }
      ]
    },
    {
      "id": "T12",
      "nom": "Contrôle final et ajustements",
      "phase": 3,
      "duree": { "valeur": 1, "unite": "jour" },
      "dependances": [
        {
          "id_tache_precedente": "T11",
          "type": "fin-debut",
          "decalage": { "valeur": 1, "unite": "mois" }
        }
      ]
    }
  ]
};

/**
 * Exemple avec dépendances complexes
 */
export const exempleAvecDependancesComplexes = {
  "taches": [
    {
      "id": "T1",
      "nom": "Tâche A",
      "phase": 1,
      "duree": { "valeur": 5, "unite": "jours" },
      "dependances": []
    },
    {
      "id": "T2",
      "nom": "Tâche B",
      "phase": 1,
      "duree": { "valeur": 3, "unite": "jours" },
      "dependances": []
    },
    {
      "id": "T3",
      "nom": "Tâche C - Dépend de A et B",
      "phase": 1,
      "duree": { "valeur": 4, "unite": "jours" },
      "dependances": [
        {
          "id_tache_precedente": "T1",
          "type": "fin-debut",
          "decalage": { "valeur": 0, "unite": "jour" }
        },
        {
          "id_tache_precedente": "T2",
          "type": "fin-debut",
          "decalage": { "valeur": 0, "unite": "jour" }
        }
      ]
    },
    {
      "id": "T4",
      "nom": "Tâche D - Commence avec C",
      "phase": 2,
      "duree": { "valeur": 2, "unite": "jours" },
      "dependances": [
        {
          "id_tache_precedente": "T3",
          "type": "debut-debut",
          "decalage": { "valeur": 1, "unite": "jour" }
        }
      ]
    },
    {
      "id": "T5",
      "nom": "Tâche E - Finit avec C",
      "phase": 2,
      "duree": { "valeur": 3, "unite": "jours" },
      "dependances": [
        {
          "id_tache_precedente": "T3",
          "type": "fin-fin",
          "decalage": { "valeur": 0, "unite": "jour" }
        }
      ]
    }
  ]
};