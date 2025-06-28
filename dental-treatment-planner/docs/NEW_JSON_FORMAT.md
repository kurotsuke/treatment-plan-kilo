# Nouveau Format JSON pour les Plans de Traitement

## Vue d'ensemble

Le nouveau format JSON s'inspire de la syntaxe Mermaid Gantt pour une structure plus claire et plus facile à comprendre. Les principales différences avec l'ancien format sont :

1. **Structure en sections** : Les tâches sont organisées par phases (sections)
2. **Format de durée compact** : Utilisation du style Mermaid ("1d", "2w", "3m")
3. **Dépendances simplifiées** : Un simple champ "after" au lieu d'objets complexes
4. **Métadonnées enrichies** : Type de tâche, assignation et statut de complétion

## Structure du Nouveau Format

```json
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
        "done": false
      }
    ],
    "Phase 2 - Fonctionnelle": [
      {
        "task": "Pose implant (16)",
        "id": "T10",
        "duration": "2h",
        "after": "T5",
        "type": "clinique",
        "assignedTo": "Dr. Dubois",
        "done": false
      }
    ]
  }
}
```

## Comparaison avec l'Ancien Format

### Ancien Format
```json
{
  "taches": [
    {
      "id": "T1",
      "nom": "Consultation initiale",
      "phase": 1,
      "duree": { "valeur": 1, "unite": "jour" },
      "dependances": []
    }
  ]
}
```

### Nouveau Format
```json
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
        "done": false
      }
    ]
  }
}
```

## Spécifications des Champs

### Format des Durées
- **Heures** : "2h", "4h"
- **Jours** : "1d", "3d"
- **Semaines** : "1w", "2w"
- **Mois** : "1m", "4m"

### Types de Tâches
- **"clinique"** : Actes médicaux (consultation, soins, pose)
- **"cicatrisation"** : Périodes de guérison
- **"administratif"** : Tâches administratives (dossiers, paiements)

### Champs de la Tâche
- **task** : Nom de l'acte (string)
- **id** : Identifiant unique (string)
- **duration** : Durée au format Mermaid (string)
- **after** : ID de la tâche précédente ou null (string | null)
- **type** : Type de tâche (string)
- **assignedTo** : Nom du médecin assigné (string | null)
- **done** : Statut de complétion (boolean)

## Migration et Compatibilité

Le système supporte les deux formats pour assurer la rétrocompatibilité :

1. **Détection automatique** : Le composant détecte le format utilisé
2. **Conversion transparente** : L'ancien format est converti automatiquement
3. **Pas de rupture** : Les applications existantes continuent de fonctionner

## Avantages du Nouveau Format

1. **Plus lisible** : Structure hiérarchique claire par phases
2. **Plus simple** : Dépendances exprimées simplement avec "after"
3. **Plus riche** : Métadonnées supplémentaires (type, assignation, statut)
4. **Compatible Mermaid** : Facilite l'export vers des diagrammes Mermaid
5. **Extensible** : Facile d'ajouter de nouveaux champs

## Exemple Complet

```json
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
        "done": false
      },
      {
        "task": "Détartrage complet",
        "id": "T2",
        "duration": "1d",
        "after": "T1",
        "type": "clinique",
        "assignedTo": "Dr. Martin",
        "done": false
      },
      {
        "task": "Extraction (16, 17)",
        "id": "T3",
        "duration": "1d",
        "after": "T2",
        "type": "clinique",
        "assignedTo": "Dr. Martin",
        "done": false
      },
      {
        "task": "Cicatrisation post-extraction",
        "id": "T4",
        "duration": "3w",
        "after": "T3",
        "type": "cicatrisation",
        "assignedTo": null,
        "done": false
      }
    ],
    "Phase 2 - Fonctionnelle": [
      {
        "task": "Pose implant (16)",
        "id": "T5",
        "duration": "2h",
        "after": "T4",
        "type": "clinique",
        "assignedTo": "Dr. Dubois",
        "done": false
      },
      {
        "task": "Cicatrisation implant",
        "id": "T6",
        "duration": "4m",
        "after": "T5",
        "type": "cicatrisation",
        "assignedTo": null,
        "done": false
      },
      {
        "task": "Empreinte couronne sur implant",
        "id": "T7",
        "duration": "1d",
        "after": "T6",
        "type": "clinique",
        "assignedTo": "Dr. Dubois",
        "done": false
      },
      {
        "task": "Fabrication couronne (labo)",
        "id": "T8",
        "duration": "2w",
        "after": "T7",
        "type": "administratif",
        "assignedTo": "Laboratoire",
        "done": false
      },
      {
        "task": "Pose couronne sur implant",
        "id": "T9",
        "duration": "1d",
        "after": "T8",
        "type": "clinique",
        "assignedTo": "Dr. Dubois",
        "done": false
      }
    ],
    "Phase 3 - Esthétique": [
      {
        "task": "Blanchiment dentaire",
        "id": "T10",
        "duration": "2h",
        "after": "T9",
        "type": "clinique",
        "assignedTo": "Dr. Martin",
        "done": false
      }
    ]
  }
}