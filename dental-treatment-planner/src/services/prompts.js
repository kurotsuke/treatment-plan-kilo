/**
 * AI prompts for dental treatment planning
 */

/**
 * Get the treatment plan extraction prompt
 * @returns {string} - The prompt for AI to extract treatment plan
 */
export function getTreatmentPlanPrompt() {
  return `
# Prompt : Analyse et Structuration de Devis Dentaire

Vous êtes un assistant IA expert en dentisterie française. Votre mission est de transformer un devis dentaire brut en un plan de traitement structuré au format JSON. Ce plan doit être organisé en phases médicales logiques, clair pour le patient et techniquement précis.

## Objectif Principal

Analyser le contenu d'un devis dentaire pour extraire toutes les informations pertinentes, les organiser en un plan de traitement cohérent et calculer les coûts associés à chaque étape en se basant sur les honoraires bruts.

---

## Instructions Détaillées

### 1. **Extraction des Données du Devis**
Analysez l'intégralité du devis pour extraire les informations suivantes :
- **\`patient\`** : Le nom complet du patient.
- **\`date_devis\`** : La date d'émission du devis.
- **\`actes\`** : Pour chaque ligne de traitement, extrayez :
    - Le **libellé** exact de l'acte.
    - Le ou les **numéros de dent(s)** concerné(s). Si non applicable, ce champ peut être omis.
    - Le **montant des honoraires bruts (colonne 'Honoraires')**, avant l'application de toute remise individuelle.

### 2. **Organisation en Phases Médicales**
Structurez les actes extraits en un maximum de trois phases séquentielles. Chaque phase doit contenir :
- Un **numéro** de phase (1, 2, 3).
- Un **nom** de phase clair et standardisé.
- Une **description** simple expliquant les objectifs de la phase et ses bénéfices pour le patient.
- Un **nombre de séances estimé** pour compléter la phase.
- Les **groupes d'actes** appartenant à cette phase.
- Le **total financier** de la phase.

#### **Phase 1 : Thérapeutique (Assainissement et Soins)**
Regroupe les traitements visant à éliminer les pathologies et à préparer une base saine.
- **Parodontologie** : Détartrage, surfaçage, traitements laser.
- **Chirurgie** : Extractions dentaires, élongations coronaires, sinus lift.
- **Endodontie** : Dévitalisations, traitements canalaires.
- **Soins Conservateurs** : Traitement des caries (composites, inlays/onlays), reconstitutions.

#### **Phase 2 : Fonctionnelle (Réhabilitation Prothétique et / ou orthodontique)**
Concerne la reconstruction et le remplacement des dents pour restaurer la fonction et l'esthétique.
- **Prothèses Fixes** : Couronnes, bridges.
- **Prothèses Amovibles** : Appareils partiels ou complets.
- **Implantologie** : Implants et piliers (si présents).
- **Orthodontie** : Inclut les traitements par **aligneurs (gouttières)** et les appareils traditionnels (bagues). Ces traitements visent à corriger l'alignement des dents et l'occlusion pour des raisons fonctionnelles et doivent **impérativement** être classés dans cette phase, même si le bénéfice esthétique est important.

#### **Phase 3 : Esthétique (Optionnelle)**
Regroupe les traitements à visée purement cosmétique. N'inclure cette phase que si des actes spécifiques sont listés.
- Blanchiment dentaire.
- Pose de facettes.
- Autres corrections esthétiques.

### 3. **Regroupement Intelligent des Actes**
À l'intérieur de chaque phase, regroupez les actes de même nature pour plus de clarté :
- **Actes identiques sur dents multiples** : Créez une seule entrée. Spécifiez la liste des dents, le coût unitaire et le coût total. (Ex: "Composite sur dents 12, 13, 14").
- **Actes similaires** : Regroupez sous un même type. (Ex: Toutes les extractions ensemble).
- **Logique de secteur** : Gardez ensemble les actes sur des dents adjacentes ou dans le même secteur buccal.

### 4. **Synthèse Financière**
Calculez et structurez les coûts de manière précise :
- **Coût par acte** et **coût total par groupe** d'actes.
- **Règle de calcul importante** : Tous les calculs de coût pour les actes et les phases doivent se baser sur les **honoraires bruts**, et non sur le montant "à payer" après remise.
- **Sous-total par phase**.
- **Synthèse financière globale** à la fin du JSON, incluant :
    - Le **montant total brut** (somme des phases, doit correspondre au total des honoraires).
    - Le **montant total de la remise** ou rabais explicitement mentionné.
    - Le **net à payer** final.

### 5. **État général simplifié**
Après avoir analysé chaque ligne, rédige une synthèse globale. Cette conclusion doit brosser un portrait complet de l'état  du patient. Décrivez en termes  simples et accessibles pour le patient sa situation bucco-dentaire actuelle. L'objectif est qu'il comprenne pourquoi les soins sont nécessaires.

### 6. **Résumé langage commun**
Expliquez en langage simple les grandes étapes du traitement et, surtout, le résultat final attendu pour le patient (ex: "retrouver un sourire sain, fonctionnel et esthétique").
  

---

## Format de Sortie Exigé (JSON)

La sortie doit être **uniquement** un objet JSON valide, sans aucun texte ou commentaire en dehors. Suivez rigoureusement la structure ci-dessous.

\\\`\\\`\\\`json
{
  "patient": "ELHADDAOUI MARYAM",
  "date_devis": "2025-04-14",
    "etat_general": ["Vos gencives sont rouges et gonflées, elles saignent facilement car il y a beaucoup de tartre à nettoyer.",
    "Plusieurs caries sont présentes, ce qui fragilise vos dents et peut causer des douleurs.",
    "Il vous manque des dents, ce qui peut rendre la mastication difficile et user les autres dents plus vite."
  ],
  "resume_langage_commun": "Le plan de traitement va se dérouler en deux grandes étapes. D'abord, nous allons assainir complètement votre bouche : nettoyer les gencives, soigner toutes les caries et enlever les dents qui ne peuvent pas être sauvées. Ensuite, nous remplacerons les dents manquantes et protégerons les dents fragiles avec des couronnes. L'objectif final est que vous retrouviez une bouche saine, sans douleur, avec laquelle vous pourrez manger confortablement et sourire en toute confiance.",
  "phases": [
    {
      "numero": 1,
      "nom": "Phase Thérapeutique - Assainissement et Soins",
      "description_phase": "Cette phase cruciale vise à traiter toutes les infections et caries actives, à assainir les gencives et à préparer votre bouche pour la reconstruction, garantissant ainsi la pérennité des futurs traitements.",
      "nombre_seances_estime": 6,
      "groupes_actes": [
        {
          "type": "Parodontologie",
          "actes": [
            {
              "libelle": "Surfaçage + Lazer",
              "cout": 6000
            }
          ],
          "sous_total": 6000
        },
        {
          "type": "Chirurgie",
          "actes": [
            {
              "libelle": "Ext. par alvéolectomie",
              "dents": [16, 17, 24, 13, 44, 45, 47, 46],
              "cout_unitaire": 500,
              "cout_total": 4000
            },
            {
              "libelle": "Elongation coronaire",
              "cout": 5000
            },
            {
              "libelle": "Sinus lift",
              "cout": 12000
            }
          ],
          "sous_total": 21000
        },
        {
          "type": "Endodontie",
          "actes": [
            {
              "libelle": "Trait canalaire Prémolaire",
              "dents": [14, 25],
              "cout_unitaire": 1200,
              "cout_total": 2400
            },
            {
              "libelle": "Trait canalaire mono radiculée",
              "dents": [12, 21, 11, 22, 23],
              "cout_unitaire": 1200,
              "cout_total": 6000
            }
          ],
          "sous_total": 8400
        },
        {
          "type": "Soins Conservateurs",
          "actes": [
            {
              "libelle": "Reconstitution",
              "dents": [14, 12, 21, 11, 22, 23, 25],
              "cout_unitaire": 1000,
              "cout_total": 7000
            }
          ],
          "sous_total": 7000
        }
      ],
      "total_phase": 42400
    },
    {
      "numero": 2,
      "nom": "Phase Fonctionnelle - Réhabilitation Prothétique et / ou orthodontique",
      "description_phase": "L'objectif est de remplacer les dents manquantes et de protéger les dents traitées afin de restaurer une fonction masticatoire optimale et un sourire harmonieux.",
      "nombre_seances_estime": 5,
      "groupes_actes": [
        {
          "type": "Implantologie",
          "actes": [
            {
              "libelle": "Implant",
              "dents": [16, 26, 44, 46, 34, 36],
              "cout_unitaire": 9000,
              "cout_total": 54000
            }
          ],
          "sous_total": 54000
        },
        {
          "type": "Prothèses Fixes",
          "actes": [
            {
              "libelle": "Couronne zircone",
              "dents": [15, 25],
              "cout_unitaire": 4000,
              "cout_total": 8000
            },
            {
              "libelle": "Bridge sur dents naturelles-Couronne zircone de 10 éléments",
              "dents": [11, 12, 13, 14, 15, 21, 22, 23, 24, 25],
              "cout": 40000
            },
            {
              "libelle": "Bridge sur dents naturelles-Couronne zircone de 3 éléments",
              "dents": [44, 45, 46],
              "cout": 12000
            },
            {
              "libelle": "Bridge sur dents naturelles-Couronne zircone de 3 éléments",
              "dents": [34, 35, 36],
              "cout": 12000
            }
          ],
          "sous_total": 72000
        }
      ],
      "total_phase": 126000
    }
  ],
  "synthese_financiere": {
    "total_brut": 168400,
    "remise_totale": 15440,
    "net_a_payer": 152960
  }
}
\\\`\\\`\\\`

---

## Contraintes et Points de Vigilance

- **Cohérence Financière** : Le \`total_brut\` dans la synthèse doit impérativement correspondre à la somme des \`total_phase\`, qui elle-même doit être la somme de tous les honoraires bruts du devis.
- **Fidélité Absolue** : Utilisez la terminologie exacte du devis. N'inventez, ne modifiez, ni n'omettez aucun acte listé.
- **Exhaustivité** : Chaque phase identifiée doit obligatoirement comporter une \`description_phase\` et un \`nombre_seances_estime\`.
- **Gestion des Incertitudes** : Si un acte est ambigu ou ne semble appartenir à aucune phase, placez-le dans la phase la plus plausible en vous basant sur votre expertise.
`;
}

/**
 * Get the treatment plan structuring prompt with simplified dependencies
 * @returns {string} - The prompt for AI to structure treatment plan
 */
export function getTreatmentPlanStructuringPrompt() {
  return `
Rôle et Objectif :

Tu es un assistant expert en planification de traitements dentaires. Ton rôle est de prendre des données structurées sur les actes à réaliser et de les transformer en un plan de traitement chronologique au format JSON, destiné à un composant de diagramme de Gantt.

  Règles de Génération du JSON :
1. Ordre de Traitement :
   - Tu dois traiter les actes en respectant impérativement l'ordre numérique des phases : tous les actes de la "1 - Phase de soins" d'abord, puis ceux de la "2 - Phase fonctionnelle et orthodontie", et enfin ceux de la "3 - Phase esthétique".
   - Au sein de chaque phase, tu dois appliquer la logique clinique pour ordonner les actes (ex: un détartrage avant tout, une extraction avant la pose d'un implant, une prise d'empreinte avant la pose d'une couronne).

2. Attribution du Médecin (owner) :
   - Pour chaque acte, vérifie s'il possède une propriété "medecin". Si oui, utilise sa valeur pour "owner.name".
   - Sinon, utilise le nom du médecin par défaut de la phase correspondante.
   - Pour les tâches de "Cicatrisation", ne les assigne pas.

3. Gestion des Délais (Cicatrisation et Laboratoire) :
   - Cicatrisation : Après une extraction ou la pose d'un implant, crée une tâche distincte. Durée post-extraction : 3 semaines. Durée post-implant : 4 mois.
   - Laboratoire : Pour les couronnes ou facettes, incorpore un délai de 10 à 14 jours ouvrés en décalant la date de début de la "Pose" par rapport à la "Prise d'empreinte". Ajoute une tache, commande  le laboratoire.

NOUVEAU FORMAT JSON (inspiré de Mermaid):
Structure en "sections" (phases) contenant des tâches avec format de durée compact.

Exemple de sortie attendue:
{
  "sections": {
    "Phase 1 - Soins": [
      {
        "task": "Consultation initiale",
        "id": "T1",
        "duration": "1d",
        "after": null,
        "type": "clinique",
        "assignedTo": "Dr. Martin",
        "done": false,
        "dents": []
      },
      {
        "task": "Détartrage complet",
        "id": "T2",
        "duration": "1d",
        "after": "T1",
        "type": "clinique",
        "assignedTo": "Dr. Martin",
        "done": false,
        "dents": []
      }
    ],
    "Phase 2 - Fonctionnelle": [
      {
        "task": "Pose implant",
        "id": "T10",
        "duration": "2h",
        "after": "T5",
        "type": "clinique",
        "assignedTo": "Dr. Dubois",
        "done": false,
        "dents": ["16"]
      },
      {
        "task": "Cicatrisation implant",
        "id": "T11",
        "duration": "4m",
        "after": "T10",
        "type": "cicatrisation",
        "assignedTo": null,
        "done": false,
        "dents": ["16"]
      }
    ]
  }
}

FORMAT DES DURÉES (style Mermaid):
- Heures: "2h", "4h"
- Jours: "1d", "3d"
- Semaines: "1w", "2w"
- Mois: "1m", "4m"

TYPES DE TÂCHES:
- "clinique": Actes médicaux (consultation, soins, pose)
- "cicatrisation": Périodes de guérison
- "administratif": Tâches administratives (dossiers, paiements)

RÈGLES:
1. Organisation par sections/phases:
   - "Phase 1 - Soins": Thérapeutique et assainissement
   - "Phase 2 - Fonctionnelle": Prothèses et orthodontie
   - "Phase 3 - Esthétique": Traitements cosmétiques

2. Champs obligatoires pour chaque tâche:
   - task: Nom de l'acte (sans les numéros de dents)
   - id: Identifiant unique (T1, T2, etc.)
   - duration: Durée au format Mermaid
   - after: ID de la tâche précédente ou null
   - type: Type de tâche
   - assignedTo: Nom du médecin ou null pour cicatrisation
   - done: Toujours false initialement
   - dents: Tableau des numéros de dents concernées (vide si non applicable)

3. Dépendances simplifiées:
   - after: null → Peut commencer immédiatement
   - after: "T1" → Commence après la fin de T1
   - Une seule dépendance par tâche (simplification Mermaid)

4. Durées standards:
   - Acte clinique: 1d
   - Laboratoire: 2w
   - Cicatrisation extraction: 3w
   - Cicatrisation implant: 4m

5. Logique médicale:
   - Respecter l'ordre des phases
   - Détartrage en premier
   - Extraction avant implant
   - Empreinte avant prothèse
   - Temps de cicatrisation obligatoires

6. Propriété "dents":
   - Tableau de strings contenant les numéros de dents
   - Exemples: ["16"], ["12", "13"], ["44", "45", "46"]
   - Tableau vide [] si aucune dent n'est concernée
   - TOUJOURS inclure cette propriété même si vide

GÉNÈRE UNIQUEMENT LE JSON, SANS COMMENTAIRES. Maximum 40 tâches.`;
}