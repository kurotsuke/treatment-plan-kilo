import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import quotesService from '../services/quotesService';
import { useSettings } from '../hooks/useSettings';
import { useDoctors } from '../hooks/useDoctors';
import { toast } from 'sonner';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  PencilIcon,
  ChevronUpIcon,
  ChevronDownIcon as ChevronDownOutlineIcon,
  XMarkIcon,
  Bars3Icon,
  TagIcon,
  DocumentArrowUpIcon,
  HeartIcon,
  Square2StackIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import ToothBadgeContainer from '../components/gantt/ToothBadgeContainer';
import ToothBadge from '../components/gantt/ToothBadge';
import { Separator } from '../components/ui/separator';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { CheckIcon } from '@heroicons/react/20/solid';
import { formatCurrency, getCurrencyInputSymbol, getCurrentCurrency, getCurrencySymbol } from '../utils/currency';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '../components/ui/kibo-ui/combobox';
import { Button } from '../components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '../components/ui/context-menu';
import {
  Tags,
  TagsContent,
  TagsEmpty,
  TagsGroup,
  TagsInput,
  TagsItem,
  TagsList,
  TagsTrigger,
  TagsValue,
} from '../components/ui/kibo-ui/tags';
import { Skeleton } from '../components/ui/skeleton.tsx';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

// Fonction pour organiser les dents par quadrant avec couleurs
const organizeTeethByQuadrant = (teeth) => {
  // Définition des quadrants avec leurs ordres et couleurs
  const quadrants = {
    1: {
      teeth: [18, 17, 16, 15, 14, 13, 12, 11],
      color: 'bg-pink-100 text-pink-800 border-pink-200',
      name: 'Q1'
    },
    2: {
      teeth: [21, 22, 23, 24, 25, 26, 27, 28],
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      name: 'Q2'
    },
    3: {
      teeth: [38, 37, 36, 35, 34, 33, 32, 31],
      color: 'bg-green-100 text-green-800 border-green-200',
      name: 'Q3'
    },
    4: {
      teeth: [41, 42, 43, 44, 45, 46, 47, 48],
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      name: 'Q4'
    }
  };

  // Convertir les dents en nombres et les organiser par quadrant
  const teethNumbers = teeth.map(tooth => parseInt(tooth.toString().trim())).filter(n => !isNaN(n));
  
  const organizedQuadrants = {};
  
  // Initialiser les quadrants
  Object.keys(quadrants).forEach(quadId => {
    organizedQuadrants[quadId] = {
      ...quadrants[quadId],
      presentTeeth: []
    };
  });

  // Classer chaque dent dans son quadrant
  teethNumbers.forEach(toothNumber => {
    Object.keys(quadrants).forEach(quadId => {
      if (quadrants[quadId].teeth.includes(toothNumber)) {
        organizedQuadrants[quadId].presentTeeth.push(toothNumber);
      }
    });
  });

  // Trier les dents dans chaque quadrant selon l'ordre défini
  Object.keys(organizedQuadrants).forEach(quadId => {
    organizedQuadrants[quadId].presentTeeth.sort((a, b) => {
      const indexA = quadrants[quadId].teeth.indexOf(a);
      const indexB = quadrants[quadId].teeth.indexOf(b);
      return indexA - indexB;
    });
  });

  // Retourner seulement les quadrants qui ont des dents
  return Object.keys(organizedQuadrants)
    .filter(quadId => organizedQuadrants[quadId].presentTeeth.length > 0)
    .map(quadId => organizedQuadrants[quadId]);
};

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

// Tags dentaires prédéfinis avec couleurs
const dentalTags = [
  { id: 'urgence', label: 'Urgence', color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 'esthetique', label: 'Esthétique', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { id: 'orthodontie', label: 'Orthodontie', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'implantologie', label: 'Implantologie', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'chirurgie', label: 'Chirurgie', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'endodontie', label: 'Endodontie', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'parodontologie', label: 'Parodontologie', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { id: 'prothese', label: 'Prothèse', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'prevention', label: 'Prévention', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'pediatrie', label: 'Pédiatrie', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'complexe', label: 'Cas complexe', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { id: 'suivi', label: 'Suivi', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' }
];

// Composant Avatar pour les médecins avec photo de profil
const DoctorAvatar = ({ doctor, size = 'sm', onClick }) => {
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  // Si le médecin a une photo de profil, l'utiliser
  if (doctor.profileImage) {
    return (
      <button
        onClick={onClick}
        className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white shadow-sm hover:opacity-80 transition-opacity`}
        title={`${doctor.name} - ${doctor.specialty}`}
      >
        <img
          src={doctor.profileImage}
          alt={doctor.name}
          className="w-full h-full object-cover"
        />
      </button>
    );
  }

  // Sinon, utiliser un avatar de fallback avec initiales
  const fallbackAvatar = generateFallbackAvatar(doctor.name);
  const colorIndex = doctor.id ? doctor.id.charCodeAt(0) % avatarColors.length : 0;
  const avatarColor = avatarColors[colorIndex];

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} ${avatarColor} rounded-full flex items-center justify-center text-white font-medium hover:opacity-80 transition-opacity border-2 border-white shadow-sm`}
      title={`${doctor.name} - ${doctor.specialty}`}
    >
      {fallbackAvatar}
    </button>
  );
};

// Composant pour les dents éditables au hover
const EditableTeethField = ({ value, onChange, placeholder = "Dents..." }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') handleCancel();
        }}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder={placeholder}
        autoFocus
      />
    );
  }

  return (
    <div
      className="group cursor-pointer px-3 py-2 text-sm border border-transparent rounded-md hover:border-gray-300 hover:bg-gray-50 transition-colors"
      onClick={() => setIsEditing(true)}
    >
      <div className="flex items-center justify-between">
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value || placeholder}
        </span>
        <PencilIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

// Composant pour le nom du patient éditable
const EditablePatientName = ({ value, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') handleCancel();
        }}
        className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-indigo-500 focus:outline-none focus:border-indigo-600 px-1"
        autoFocus
      />
    );
  }

  return (
    <h1
      className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors group flex items-center"
      onClick={() => setIsEditing(true)}
    >
      {value}
      <PencilIcon className="ml-2 h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </h1>
  );
};

// Composant TagValue personnalisé avec couleurs
const ColoredTagValue = ({ tag, onRemove }) => {
  const tagData = dentalTags.find(t => t.id === tag);
  if (!tagData) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${tagData.color}`}>
      {tagData.label}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
      >
        <XMarkIcon className="h-3 w-3" />
      </button>
    </span>
  );
};

// Composant pour les sections éditables au hover (État de santé et Résumé)
const EditableSection = ({ title, value, onChange, placeholder, icon: Icon }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  // Mettre à jour tempValue quand value change (ex: données Gemini)
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  if (isEditing) {
    return (
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-semibold leading-7 text-gray-900">{title}</h2>
        </div>
        <textarea
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCancel();
            if (e.key === 'Enter' && e.ctrlKey) handleSave();
          }}
          rows={6}
          className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 resize-none"
          placeholder={placeholder}
          autoFocus
        />
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100"
          >
            Annuler (Esc)
          </button>
          <button
            onClick={handleSave}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 rounded-md hover:bg-indigo-50"
          >
            Sauvegarder (Ctrl+Enter)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6 mb-8 group cursor-pointer hover:shadow-md transition-all duration-200 hover:ring-indigo-200"
      onClick={() => setIsEditing(true)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-semibold leading-7 text-gray-900">{title}</h2>
        </div>
        <PencilIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {value ? (
        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {value}
        </div>
      ) : (
        <div className="text-gray-400 italic">
          {placeholder}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
        Cliquez pour modifier
      </div>
    </div>
  );
};

// Composant pour le titre de phase éditable
const EditablePhaseTitle = ({ value, onChange, options }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex-1">
        <Combobox
          data={options}
          value={options.find(p => p.label === tempValue)?.value || ''}
          onValueChange={(selectedValue) => {
            const option = options.find(p => p.value === selectedValue);
            if (option) {
              setTempValue(option.label);
              onChange(option.label);
              setIsEditing(false);
            }
          }}
          placeholder={tempValue}
          className="text-xl font-bold text-gray-900 border-none shadow-none bg-white"
        />
      </div>
    );
  }

  return (
    <div
      className="flex-1 cursor-pointer group"
      onClick={() => setIsEditing(true)}
    >
      <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center">
        {value}
        <PencilIcon className="ml-2 h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </h3>
    </div>
  );
};

// Composant pour la description de phase éditable
const EditablePhaseDescription = ({ value, onChange, placeholder }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') handleCancel();
        }}
        className="w-full text-sm text-gray-600 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-indigo-300 focus:rounded px-2 py-1"
        placeholder={placeholder}
        autoFocus
      />
    );
  }

  return (
    <div
      className="cursor-pointer group"
      onClick={() => setIsEditing(true)}
    >
      <p className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors flex items-center">
        {value || placeholder}
        <PencilIcon className="ml-2 h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </p>
    </div>
  );
};
// Cache pour stocker les devis déjà chargés
const quotesCache = new Map();

// Fonction pour mapper les données Gemini vers la structure QuoteEditor
const mapGeminiDataToQuote = (geminiData) => {
  // Protection contre les données undefined ou null
  if (!geminiData) {
    console.warn('⚠️ Données Gemini undefined ou null');
    return null;
  }
  
  // Obtenir le premier médecin par défaut (sera écrasé si doctors est disponible)
  const defaultDoctor = { id: 'temp', name: 'À définir' };
  
  return {
    patientName: geminiData.patient || 'Patient',
    date: new Date().toISOString().split('T')[0],
    referringDoctor: defaultDoctor, // Sera mis à jour quand les médecins seront chargés
    healthStatus: geminiData.etat_general ?
      (Array.isArray(geminiData.etat_general) ? geminiData.etat_general.join('. ') : geminiData.etat_general) : '',
    treatmentSummary: geminiData.resume_langage_commun || '',
    tags: [],
    discountType: 'percentage',
    discountValue: 0,
    paymentPlan: 'single',
    advancePercentage: 30,
    advanceDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    monthlyPayments: 3,
    firstPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    phases: geminiData.phases?.map((phase, phaseIndex) => {
      // Transformer les groupes_actes en traitements individuels
      const treatments = [];
      let treatmentCounter = 0;
      
      phase.groupes_actes?.forEach((groupe) => {
        groupe.actes?.forEach((acte) => {
          // Déterminer si l'acte a plusieurs dents
          const hasDents = Array.isArray(acte.dents) && acte.dents.length > 0;
          const hasMultipleDents = hasDents && acte.dents.length > 1;
          
          // Calculer la quantité et le prix unitaire
          let quantity = 1;
          let unitCost = acte.cout || 0;
          
          if (hasMultipleDents && acte.cout_unitaire && acte.cout_total) {
            // Si on a cout_unitaire et cout_total, les utiliser
            quantity = acte.dents.length;
            unitCost = acte.cout_unitaire;
          } else if (hasMultipleDents && acte.cout_total) {
            // Si on a seulement cout_total pour plusieurs dents, diviser
            quantity = acte.dents.length;
            unitCost = acte.cout_total / quantity;
          } else if (acte.cout_unitaire) {
            // Si on a cout_unitaire sans cout_total
            unitCost = acte.cout_unitaire;
          }
          
          // Calculer le prix total
          const totalFees = acte.cout_total || (unitCost * quantity);
          
          // Formater les dents pour l'affichage
          const teethString = hasDents ? acte.dents.join(', ') : '';
          
          treatments.push({
            id: Date.now() + phaseIndex * 1000 + treatmentCounter++,
            name: acte.libelle || 'Traitement',
            doctor: acte.doctor || null, // Préserver le médecin s'il existe
            fees: totalFees,
            unitCost: unitCost,
            quantity: quantity,
            sessions: 1, // Par défaut, peut être ajusté manuellement
            teeth: teethString,
            category: groupe.type || 'Général',
            isEditing: false,
            hasCustomDoctor: false
          });
        });
      });
      
      return {
        id: phase.id || Date.now() + phaseIndex,
        name: phase.nom || `Phase ${phaseIndex + 1}`,
        description: phase.description_phase || phase.description || '',
        sessions: phase.nombre_seances_estime || phase.nombre_seances || 1,
        doctor: phase.doctor || null, // Préserver le médecin s'il existe
        treatments: treatments
      };
    }) || []
  };
};

const QuoteEditor = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  console.log('📍 Location state:', location.state);
  console.log('📍 QuoteId from URL:', quoteId);
  const { user } = useAuth();
  const { settings } = useSettings();
  const { doctors: firebaseDoctors, loading: doctorsLoading } = useDoctors();
  
  // État pour gérer le chargement du devis
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(true);
  
  // État pour le streaming
  const [isStreaming, setIsStreaming] = useState(location.state?.isStreaming || false);
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [streamingError, setStreamingError] = useState(null);
  
  // État pour le devis et le patient
  const [quoteData, setQuoteData] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [treatmentRows, setTreatmentRows] = useState([]);
  const [showRows, setShowRows] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // État pour la devise - utiliser les réglages Firebase (déclaré avant formatPriceOptimized)
  const [currency, setCurrency] = useState(settings?.clinicCurrency || getCurrentCurrency());
  const [currencySymbol, setCurrencySymbol] = useState(getCurrencyInputSymbol());
  
  // Fonction pour formater les prix de manière optimisée avec useCallback
  const formatPriceOptimized = useCallback((amount, currencyCode) => {
    const symbol = getCurrencySymbol(currencyCode || currency);
    
    if (amount === 0) return `0 ${symbol}`;
    
    const rounded = Math.round(amount * 100) / 100; // Arrondir à 2 décimales
    const isInteger = rounded % 1 === 0;
    
    if (isInteger) {
      // Afficher sans décimales pour les entiers
      return `${Math.round(rounded)} ${symbol}`;
    } else {
      // Afficher avec décimales en exposant
      const [integerPart, decimalPart] = rounded.toFixed(2).split('.');
      return (
        <span>
          {integerPart}
          <sup className="text-xs">,{decimalPart}</sup>
          {' '}{symbol}
        </span>
      );
    }
  }, [currency]);
  
  // Options de phases prédéfinies
  const phaseOptions = [
    { value: 'phase1', label: 'Phase 1 - Soins d\'urgence' },
    { value: 'phase2', label: 'Phase 2 - Préparation' },
    { value: 'phase3', label: 'Phase 3 - Traitement principal' },
    { value: 'phase4', label: 'Phase 4 - Finitions' },
    { value: 'phase5', label: 'Phase 5 - Maintenance' }
  ];

  // Transformer les médecins Firebase en format compatible avec l'interface (MEMOIZED)
  const doctors = useMemo(() => {
    return firebaseDoctors.map((doctor, index) => ({
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.treatmentPhases?.map(phase => `Phase ${phase}`).join(', ') || 'Généraliste',
      treatmentPhases: doctor.treatmentPhases || [1, 2, 3], // Par défaut toutes les phases
      profileImage: doctor.profileImage // Photo de profil depuis Firebase
    }));
  }, [firebaseDoctors]);

  // Données des médecins pour le combobox (MEMOIZED)
  const doctorOptions = useMemo(() => {
    return doctors.map(doctor => ({
      value: doctor.id,
      label: `Dr. ${doctor.name}`
    }));
  }, [doctors]);

  // État initial du devis - sera initialisé quand les médecins seront chargés
  const [quote, setQuote] = useState(null);
  
  // État pour tracker l'ID du devis en cours d'édition (pour éviter les copies)
  const [editingQuoteId, setEditingQuoteId] = useState(null);

  // État pour les tags - initialisé depuis le devis
  const [selectedTags, setSelectedTags] = useState(quote?.tags || []);

  // État pour l'édition des traitements
  const [editingTreatment, setEditingTreatment] = useState(null);


  // État pour savoir si on a vérifié les données Gemini
  const [hasCheckedGeminiData, setHasCheckedGeminiData] = useState(false);
  
  // Ref pour éviter les rechargements multiples
  const isLoadingQuoteRef = useRef(false);
  const loadedQuoteIdRef = useRef(null);
  
  // Nettoyer les refs quand le quoteId change
  useEffect(() => {
    if (loadedQuoteIdRef.current !== quoteId) {
    console.log('🧹 Nettoyage des refs pour nouveau devis:', quoteId);
    isLoadingQuoteRef.current = false;
    loadedQuoteIdRef.current = null;
    // Nettoyer le cache si on change de devis
    const oldCacheKey = loadedQuoteIdRef.current ? `${user?.uid}-quote-${loadedQuoteIdRef.current}` : null;
    if (oldCacheKey && quotesCache.has(oldCacheKey)) {
      quotesCache.delete(oldCacheKey);
    }
  }
}, [quoteId, user?.uid]);

  // Chargement simplifié et optimisé du devis par ID direct
  useEffect(() => {
    const loadQuote = async () => {
      if (!quoteId || !user?.uid) {
        console.log('🚫 Chargement annulé - quoteId ou user.uid manquant:', { quoteId, userUid: user?.uid });
        return;
      }
      
      // 🔍 DIAGNOSTIC AVANCÉ: Logs détaillés pour comprendre le chargement
      console.group('🔍 DIAGNOSTIC AVANCÉ - Chargement du devis');
      console.log('📍 URL quoteId:', quoteId);
      console.log('📍 Type de quoteId:', typeof quoteId);
      console.log('👤 User ID:', user.uid);
      console.log('📋 Location state:', location.state);
      console.log('🔄 État de chargement actuel:', { loadingQuote, quoteLoading, doctorsLoading });
      
      // Si on vient d'un upload PDF (Gemini), ne pas charger de devis existant
      const isFromGemini = location.state?.geminiData || location.state?.data ||
                          location.state?.treatmentPlanData || localStorage.getItem('lastGeminiData');
      
      console.log('🤖 Données Gemini détectées:', !!isFromGemini);
      
      if (isFromGemini) {
        console.log('🤖 Données Gemini détectées, pas de chargement de devis existant');
        console.groupEnd();
        setQuoteLoading(false);
        return;
      }
      
      // Si c'est un nouveau devis, pas de devis à charger
      if (quoteId === 'new') {
        console.log('🆕 Nouveau devis, pas de devis à charger');
        console.groupEnd();
        setQuoteLoading(false);
        return;
      }
      
      // ✅ Vérifier le cache d'abord
      const cacheKey = `${user.uid}-quote-${quoteId}`;
      console.log('🔑 Cache key généré:', cacheKey);
      const cachedQuote = quotesCache.get(cacheKey);
      
      if (cachedQuote) {
        console.log('📦 Devis trouvé dans le cache:', cachedQuote.id);
        console.groupEnd();
        setEditingQuoteId(quoteId);
        setQuote(cachedQuote);
        setSelectedTags(cachedQuote.tags || []);
        setHasCheckedGeminiData(true);
        setQuoteLoading(false);
        return;
      }
      
      // ✅ Charger le devis depuis Firebase par ID direct
      console.log('🔍 Chargement du devis depuis Firebase par ID:', quoteId);
      setLoadingQuote(true);
      
      try {
        console.log('📡 Appel quotesService.getQuote...');
        console.log('📡 Paramètres:', { quoteId });

        const quote = await quotesService.getQuote(quoteId);

        console.log('📋 Réponse de quotesService.getQuote:', {
          quoteFound: !!quote,
          quoteType: typeof quote
        });
        
        if (quote) {
          console.log('✅ Devis trouvé:', {
            id: quote.id,
            patientName: quote.patientName,
            status: quote.status || 'N/A'
          });
          
          setEditingQuoteId(quote.id);
          
          // Mapper le devis avec logs
          console.log('🔄 Mapping du devis Firebase vers QuoteEditor...');
          const mappedQuote = mapFirebaseQuoteToEditor(quote);
          console.log('✅ Devis mappé avec succès:', {
            patientName: mappedQuote.patientName,
            phases: mappedQuote.phases?.length || 0,
            referringDoctor: mappedQuote.referringDoctor?.name || 'N/A'
          });
          
          // Mettre en cache
          quotesCache.set(cacheKey, mappedQuote);
          console.log('📦 Devis mis en cache avec clé:', cacheKey);
          
          setQuote(mappedQuote);
          setSelectedTags(mappedQuote.tags || []);
          setHasCheckedGeminiData(true);
          
          console.log('✅ État mis à jour, devis chargé');
          
        } else {
          // ❌ Aucun devis trouvé pour cet ID
          console.warn('⚠️ AUCUN DEVIS TROUVÉ pour l\'ID:', quoteId);
          console.warn('⚠️ Ce devis devrait exister mais il n\'a pas été trouvé dans Firebase');
          console.warn('⚠️ Vérifiez que le quoteId est correct et que le devis existe dans la collection');
          
          // Marquer comme vérifié pour éviter les boucles infinies
          setHasCheckedGeminiData(true);
        }
        
      } catch (error) {
        console.error('❌ Erreur lors du chargement du devis:', error);
        console.error('📍 Stack trace:', error.stack);
        console.error('📍 Détails de l\'erreur:', {
          name: error.name,
          message: error.message,
          code: error.code
        });
        setHasCheckedGeminiData(true);
      } finally {
        setLoadingQuote(false);
        setQuoteLoading(false);
        console.groupEnd();
      }
    };
    
    loadQuote();
  }, [quoteId, user?.uid, location.state, doctors.length]);


  // Synchroniser les tags avec le devis chargé
  useEffect(() => {
    if (quote && quote.tags) {
      setSelectedTags(quote.tags);
    }
  }, [quote?.tags]);

  // Effet pour gérer le streaming
  useEffect(() => {
    console.log('🔍 [QuoteEditor] Vérification du streaming:', {
      isStreaming,
      hasStreamingService: !!window.streamingService,
      streamingServiceType: window.streamingService?.constructor?.name
    });
    
    if (!isStreaming) {
      console.log('⏹️ [QuoteEditor] Streaming non activé');
      return;
    }
    
    if (!window.streamingService) {
      console.error('❌ [QuoteEditor] window.streamingService non trouvé!');
      setStreamingError('Service de streaming non disponible');
      setIsStreaming(false);
      return;
    }

    const streamingService = window.streamingService;
    console.log('✅ [QuoteEditor] Service de streaming trouvé, configuration des écouteurs...');

    // Écouteur de progression
    const handleProgress = (event) => {
      console.log('📊 [QuoteEditor] Event "progress" reçu:', event.detail);
      setStreamingProgress(event.detail.progress);
    };

    // Écouteur de mise à jour partielle
    const handlePartialUpdate = (event) => {
      console.log('📝 [QuoteEditor] Event "data" reçu:', event.detail);
      const partialData = event.detail;
      
      // Mettre à jour progressivement le devis
      setQuote(prevQuote => {
        if (!prevQuote) {
          // Initialiser avec les données partielles
          const defaultDoctor = doctors.length > 0 ? doctors[0] : null;
          return {
            patientName: partialData.patient || 'Patient',
            date: new Date().toISOString().split('T')[0],
            referringDoctor: defaultDoctor,
            healthStatus: partialData.etat_general ?
              (Array.isArray(partialData.etat_general) ? partialData.etat_general.join('. ') : partialData.etat_general) : '',
            treatmentSummary: partialData.resume_langage_commun || '',
            tags: [],
            discountType: 'percentage',
            discountValue: 0,
            paymentPlan: 'single',
            advancePercentage: 30,
            advanceDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'cash',
            monthlyPayments: 3,
            firstPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            phases: []
          };
        }

        // Mettre à jour les champs existants
        const updatedQuote = { ...prevQuote };
        
        if (partialData.patient) updatedQuote.patientName = partialData.patient;
        if (partialData.etat_general) {
          updatedQuote.healthStatus = Array.isArray(partialData.etat_general) ?
            partialData.etat_general.join('. ') : partialData.etat_general;
        }
        if (partialData.resume_langage_commun) {
          updatedQuote.treatmentSummary = partialData.resume_langage_commun;
        }
        
        // Ajouter les phases si disponibles
        if (partialData.phases && partialData.phases.length > 0) {
          updatedQuote.phases = mapGeminiDataToQuote(partialData).phases;
        }

        return updatedQuote;
      });
    };

    // Écouteur de complétion
    const handleComplete = (event) => {
      console.log('✅ [QuoteEditor] Event "complete" reçu:', event.detail);
      setIsStreaming(false);
      setStreamingProgress(100);
      
      // Mapper les données complètes
      const completeData = event.detail.data; // Les données sont maintenant dans event.detail.data
      const mappedQuote = mapGeminiDataToQuote(completeData);
      if (mappedQuote) {
        setQuote(mappedQuote);
      } else {
        console.error('❌ Impossible de mapper les données Gemini');
        setStreamingError('Les données reçues sont invalides');
      }
      
      // Nettoyer le service
      delete window.streamingService;
    };

    // Écouteur d'erreur
    const handleError = (event) => {
      console.error('❌ [QuoteEditor] Event "error" reçu:', event.detail);
      const errorMessage = event.detail.error?.message || event.detail.error || 'Erreur inconnue lors du streaming';
      setStreamingError(errorMessage);
      setIsStreaming(false);
      
      // Nettoyer le service
      delete window.streamingService;
    };

    // Ajouter les écouteurs - CORRECTION: utiliser 'data' au lieu de 'partial'
    console.log('🎧 [QuoteEditor] Ajout des event listeners...');
    streamingService.addEventListener('progress', handleProgress);
    streamingService.addEventListener('data', handlePartialUpdate); // Changé de 'partial' à 'data'
    streamingService.addEventListener('complete', handleComplete);
    streamingService.addEventListener('error', handleError);
    console.log('✅ [QuoteEditor] Event listeners ajoutés');
    
    // Vérifier l'état actuel du service (au cas où des événements ont déjà été émis)
    console.log('🔍 [QuoteEditor] État actuel du service:', {
      hasAbortController: !!streamingService.abortController,
      serviceType: streamingService.constructor.name
    });

    // Nettoyer les écouteurs
    return () => {
      streamingService.removeEventListener('progress', handleProgress);
      streamingService.removeEventListener('data', handlePartialUpdate); // Changé de 'partial' à 'data'
      streamingService.removeEventListener('complete', handleComplete);
      streamingService.removeEventListener('error', handleError);
    };
  }, [isStreaming, doctors]);

  // Initialiser le devis quand les médecins sont chargés ET qu'on a vérifié Gemini (UNIQUEMENT pour nouveaux devis)
  useEffect(() => {
    console.log('🔄 useEffect d\'initialisation déclenché:', {
      doctorsLoading,
      doctorsCount: doctors.length,
      hasQuote: !!quote,
      hasCheckedGeminiData,
      quoteId,
      quoteLoading
    });
    
    // ❌ SUPPRESSION de la création automatique pour devis existants
    // Ne créer un devis par défaut QUE pour les nouveaux devis
    if (!doctorsLoading && doctors.length > 0 && !quote && hasCheckedGeminiData && quoteId === 'new') {
      console.log('🔄 Initialisation du devis par défaut (nouveau devis uniquement)');
      const defaultDoctor = doctors[0];
      
      setQuote({
        patientName: 'Marie Dubois',
        date: new Date().toISOString().split('T')[0],
        referringDoctor: defaultDoctor,
        healthStatus: '',
        treatmentSummary: '',
        tags: [], // Tags dentaires
        // Options de paiement
        discountType: 'percentage',
        discountValue: 0,
        paymentPlan: 'single',
        advancePercentage: 30,
        advanceDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        // Paiements multiples
        monthlyPayments: 3,
        firstPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 jours
        phases: [
          {
            id: 1,
            name: 'Phase 1 - Soins d\'urgence',
            description: '',
            sessions: 1,
            doctor: null, // Phase initiale vide
            treatments: [
              {
                id: 1,
                name: 'Consultation initiale',
                doctor: null, // Traitement initial vide
                fees: 85,
                unitCost: 85,
                quantity: 1,
                sessions: 1,
                teeth: '',
                category: 'Consultation',
                isEditing: false,
                hasCustomDoctor: false
              }
            ]
          }
        ]
      });
    }
  }, [doctorsLoading, doctors, quote, hasCheckedGeminiData, quoteId]);

  // Écouter les changements de devise depuis les réglages Firebase
  useEffect(() => {
    if (settings?.clinicCurrency) {
      setCurrency(settings.clinicCurrency);
      setCurrencySymbol(getCurrencyInputSymbol());
    }
  }, [settings?.clinicCurrency]);

  // Écouter les changements de devise (pour compatibilité)
  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrency(getCurrentCurrency());
      setCurrencySymbol(getCurrencyInputSymbol());
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, []);

  // Récupérer les données extraites depuis React Router state ou localStorage (fallback)
  useEffect(() => {
    // 🔍 DIAGNOSTIC: Logs détaillés pour tracer les données Gemini
    console.group('🔍 DIAGNOSTIC - Vérification des données Gemini');
    console.log('📍 URL actuelle:', window.location.pathname);
    console.log('📍 QuoteId de l\'URL:', quoteId);
    console.log('📍 Type de quoteId:', typeof quoteId);
    console.log('📍 Location state:', location.state);
    
    // Analyser en détail le location.state
    if (location.state) {
      console.log('📋 Détails du location.state:');
      console.log('  - treatmentPlanData présent:', !!location.state.treatmentPlanData);
      console.log('  - fileName:', location.state.fileName);
      console.log('  - isStreaming:', location.state.isStreaming);
      
      if (location.state.treatmentPlanData) {
        console.log('🤖 Analyse des données Gemini:');
        console.log('  - Patient name:', location.state.treatmentPlanData.patient);
        console.log('  - Phases count:', location.state.treatmentPlanData.phases?.length || 0);
        console.log('  - Synthèse financière:', !!location.state.treatmentPlanData.synthese_financiere);
      }
    }
    
    // Vérifier les extensions actives (pour debug)
    if (chrome && chrome.runtime && chrome.runtime.id) {
      console.warn('⚠️ Extension Chrome détectée:', chrome.runtime.id);
    }
    
    // Vérifier si l'erreur vient du nom de fichier
    if (location.state?.fileName) {
      console.log('📄 Nom du fichier:', location.state.fileName);
      if (location.state.fileName.includes(':')) {
        console.warn('⚠️ Le nom du fichier contient ":" ce qui peut causer des problèmes');
      }
    }
    
    // ✅ CORRECTION: Prioriser les données depuis React Router state
    let extractedData = null;
    let fileName = null;
    let geminiData = null;
    
    // 1. Vérifier les données depuis React Router state (priorité)
    if (location.state?.treatmentPlanData) {
      console.log('🎯 Données trouvées dans React Router state!');
      geminiData = location.state.treatmentPlanData;
      // Nettoyer le nom du fichier des caractères problématiques
      fileName = (location.state.fileName || 'PDF uploadé').replace(/:/g, '-');
      extractedData = geminiData; // Pas besoin de parse, déjà objet
    } else {
      // 2. Fallback: vérifier localStorage
      console.log('🔍 Pas de données en state, vérification localStorage...');
      const localStorageData = localStorage.getItem('extractedQuoteData');
      const localStorageFileName = localStorage.getItem('extractedFileName');
      
      if (localStorageData && localStorageFileName) {
        console.log('📋 Données trouvées dans localStorage');
        try {
          geminiData = JSON.parse(localStorageData);
          fileName = localStorageFileName;
          extractedData = geminiData;
        } catch (error) {
          console.error('❌ Erreur parsing localStorage:', error);
        }
      }
    }
    
    console.log('📋 Données finales:', {
      hasExtractedData: !!extractedData,
      hasFileName: !!fileName,
      doctorsCount: doctors.length,
      doctorsLoading: doctorsLoading,
      dataSource: location.state?.treatmentPlanData ? 'React Router state' : 'localStorage'
    });
    
    if (extractedData && fileName) {
      console.log('🎯 Données Gemini détectées depuis', location.state?.treatmentPlanData ? 'state' : 'localStorage');
      
      // 🔍 DIAGNOSTIC: Analyser les données pour nouveau devis depuis Gemini
      console.group('🤖 DIAGNOSTIC - Création de devis depuis données Gemini');
      console.log('📍 Quote ID depuis l\'URL:', quoteId);
      console.log('📍 Type de quoteId URL:', typeof quoteId);
      console.log('👤 Patient name dans Gemini:', geminiData.patient);
      console.log('📄 Nom du fichier PDF:', fileName);
      
      // Analyser les données Gemini pour extraction
      console.log('📋 Analyse des données Gemini pour création de devis:');
      console.log('  - Patient name:', geminiData.patient);
      console.log('  - Phases détectées:', geminiData.phases?.length || 0);
      console.log('  - État général:', geminiData.etat_general ? 'Présent' : 'Absent');
      console.log('  - Résumé traitement:', geminiData.resume_langage_commun ? 'Présent' : 'Absent');
      
      console.groupEnd();
      
      // Si médecins toujours en chargement, attendre
      if (doctorsLoading) {
        console.log('⏳ En attente du chargement des médecins...');
        console.groupEnd();
        return;
      }
      
      try {
        console.log('🤖 Mapping des données Gemini vers QuoteEditor...');
        console.log('📊 Structure des données:', {
          patient: geminiData.patient,
          phases: geminiData.phases?.length || 0,
          synthese: geminiData.synthese_financiere
        });
        
        // Toujours mapper vers l'interface pour édition manuelle
        const mappedQuote = mapGeminiDataToQuote(geminiData);
        console.log('✅ Devis mappé avec succès');
        console.log('📋 Mapped quote patient name:', mappedQuote?.patientName);
        
        // 🔍 VALIDATION POST-MAPPING
        console.group('🔍 VALIDATION POST-MAPPING');
        console.log('📋 Quote mappé - Patient name:', mappedQuote?.patientName);
        console.log('📋 Quote mappé - Date:', mappedQuote?.date);
        console.log('📋 Quote mappé - Nombre de phases:', mappedQuote?.phases?.length);
        console.log('📋 URL quoteId pour nouveau devis:', quoteId);
        console.groupEnd();
        
        setQuote(mappedQuote);
        
        // Nettoyer localStorage si utilisé
        if (!location.state?.treatmentPlanData) {
          try {
            localStorage.removeItem('extractedQuoteData');
            localStorage.removeItem('extractedFileName');
          } catch (storageError) {
            console.warn('⚠️ Impossible de nettoyer localStorage:', storageError);
          }
        }
        
        console.log(`✅ Devis "${fileName}" chargé pour édition !`);
        
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données Gemini:', error);
        console.error('📍 Stack:', error.stack);
        // Continuer malgré l'erreur
        toast('Une erreur est survenue lors du chargement des données. Les données par défaut seront utilisées.');
      }
    } else {
      console.log('ℹ️ Pas de données Gemini trouvées');
    }
    
    // Marquer qu'on a vérifié les données Gemini
    console.log('✅ Vérification des données Gemini terminée');
    console.groupEnd();
    setHasCheckedGeminiData(true);
  }, [doctors.length, doctorsLoading, location.state]);

  // Fonctions de gestion des tags avec useCallback
  const handleRemoveTag = useCallback((value) => {
    if (!selectedTags.includes(value)) {
      return;
    }
    const newTags = selectedTags.filter((v) => v !== value);
    setSelectedTags(newTags);
    setQuote(prevQuote => ({ ...prevQuote, tags: newTags }));
  }, [selectedTags]);

  const handleSelectTag = useCallback((value) => {
    if (selectedTags.includes(value)) {
      handleRemoveTag(value);
      return;
    }
    const newTags = [...selectedTags, value];
    setSelectedTags(newTags);
    setQuote(prevQuote => ({ ...prevQuote, tags: newTags }));
  }, [selectedTags, handleRemoveTag]);

  // Fonction pour mapper un devis Firebase vers la structure QuoteEditor - Memoizée
  const mapFirebaseQuoteToEditor = useCallback((firebaseQuote) => {
    try {
      console.log('🔄 Mapping devis Firebase vers QuoteEditor:', firebaseQuote);
      console.log('👨‍⚕️ Médecins disponibles:', doctors.length, doctors.map(d => ({ id: d.id, name: d.name })));
      console.log('🔍 referringDoctorId recherché:', firebaseQuote.basicInfo?.referringDoctorId);
      
      // S'assurer qu'il y a des médecins disponibles
      if (!doctors || doctors.length === 0) {
        console.error('❌ Aucun médecin disponible, impossible de mapper le devis');
        throw new Error('Aucun médecin disponible dans le système');
      }
      
      // Trouver le médecin référent avec validation
      let referringDoctor = doctors.find(d => d.id === firebaseQuote.basicInfo?.referringDoctorId);
      
      if (!referringDoctor) {
        console.warn('⚠️ Médecin référent non trouvé, utilisation du premier médecin disponible');
        referringDoctor = doctors[0];
      }
      
      console.log('✅ Médecin référent sélectionné:', { id: referringDoctor.id, name: referringDoctor.name });
      
      // Mapper les phases Firebase vers la structure QuoteEditor
      const mappedPhases = firebaseQuote.phases?.map(phase => ({
        id: phase.id,
        name: phase.name,
        description: phase.description || '',
        sessions: phase.sessions || 1,
        doctor: phase.doctor || null, // Préserver le médecin de la phase
        treatments: phase.treatments?.map(treatment => ({
          id: treatment.id,
          name: treatment.name,
          doctor: treatment.doctor || null, // Préserver le médecin du traitement
          fees: treatment.fees || 0,
          unitCost: treatment.unitCost || treatment.fees || 0,
          quantity: treatment.quantity || 1,
          sessions: treatment.sessions || 1,
          teeth: treatment.teeth || '',
          category: treatment.category || 'Général',
          isEditing: false,
          hasCustomDoctor: false
        })) || []
      })) || [];

      return {
        patientName: firebaseQuote.patientName || 'Patient',
        date: firebaseQuote.basicInfo?.date ? (() => {
          const dateValue = firebaseQuote.basicInfo.date;
          // Gérer les Timestamp Firebase
          if (dateValue && typeof dateValue.toDate === 'function') {
            return dateValue.toDate().toISOString().split('T')[0];
          }
          // Gérer les objets Date JavaScript
          if (dateValue && typeof dateValue.toISOString === 'function') {
            return dateValue.toISOString().split('T')[0];
          }
          // Gérer les strings de date
          if (typeof dateValue === 'string') {
            return dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;
          }
          // Fallback
          return new Date().toISOString().split('T')[0];
        })() : new Date().toISOString().split('T')[0],
        referringDoctor: referringDoctor,
        healthStatus: firebaseQuote.patientInfo?.healthStatus || '',
        treatmentSummary: firebaseQuote.patientInfo?.treatmentSummary || '',
        tags: firebaseQuote.patientInfo?.tags || [],
        // Options de paiement
        discountType: firebaseQuote.pricing?.discountType || 'percentage',
        discountValue: firebaseQuote.pricing?.discountValue || 0,
        paymentPlan: firebaseQuote.pricing?.paymentPlan?.type || 'single',
        advancePercentage: firebaseQuote.pricing?.paymentPlan?.advancePercentage || 30,
        advanceDate: firebaseQuote.pricing?.paymentPlan?.advanceDate ?
          (firebaseQuote.pricing.paymentPlan.advanceDate.toISOString ?
            firebaseQuote.pricing.paymentPlan.advanceDate.toISOString().split('T')[0] :
            firebaseQuote.pricing.paymentPlan.advanceDate) :
          new Date().toISOString().split('T')[0],
        paymentMethod: firebaseQuote.pricing?.paymentPlan?.paymentMethod || 'cash',
        // Paiements multiples
        monthlyPayments: firebaseQuote.pricing?.paymentPlan?.monthlyPayments || 3,
        firstPaymentDate: firebaseQuote.pricing?.paymentPlan?.firstPaymentDate ?
          (firebaseQuote.pricing.paymentPlan.firstPaymentDate.toISOString ?
            firebaseQuote.pricing.paymentPlan.firstPaymentDate.toISOString().split('T')[0] :
            firebaseQuote.pricing.paymentPlan.firstPaymentDate) :
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        phases: mappedPhases
      };
    } catch (error) {
      console.error('❌ Erreur lors du mapping Firebase vers QuoteEditor:', error);
      throw new Error('Erreur lors du chargement du devis');
    }
  }, [doctors]);

  // Fonction utilitaire pour convertir une date en objet Date valide
  const safeDate = (dateValue) => {
    if (!dateValue) return new Date();
    
    // Si c'est déjà un objet Date
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? new Date() : dateValue;
    }
    
    // Si c'est une string
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    
    // Fallback
    return new Date();
  };

  // Fonctions de gestion optimisées avec useCallback
  const updateHealthStatus = useCallback((value) => {
    setQuote(prev => ({ ...prev, healthStatus: value }));
  }, []);

  const updateTreatmentSummary = useCallback((value) => {
    setQuote(prev => ({ ...prev, treatmentSummary: value }));
  }, []);

  const addPhase = useCallback(() => {
    if (!quote || doctors.length === 0) return;
    
    const nextPhaseIndex = quote?.phases?.length || 0;
    const phaseNumber = nextPhaseIndex + 1;
    
    const newPhase = {
      id: Date.now(),
      name: phaseOptions[nextPhaseIndex]?.label || `Phase ${nextPhaseIndex + 1}`,
      description: '',
      sessions: 1,
      doctor: null, // Nouvelle phase vide
      treatments: []
    };
    setQuote(prev => ({ ...prev, phases: [...prev.phases, newPhase] }));
  }, [quote, doctors, phaseOptions]);

  const removePhase = useCallback((phaseId) => {
    setQuote(prev => ({
      ...prev,
      phases: prev.phases.filter(phase => phase.id !== phaseId)
    }));
  }, []);

  const updatePhase = useCallback((phaseId, field, value) => {
    setQuote(prev => ({
      ...prev,
      phases: prev.phases.map(phase => {
        if (phase.id === phaseId) {
          const updatedPhase = { ...phase, [field]: value };
          
          // Si on change le médecin de la phase (sélection OU désélection)
          if (field === 'doctor') {
            updatedPhase.treatments = phase.treatments.map(treatment => {
              // Ne pas modifier les traitements avec médecin personnalisé
              if (treatment.hasCustomDoctor) {
                return treatment;
              }
              // Assigner le nouveau médecin de la phase (ou null si désélection)
              return { ...treatment, doctor: value };
            });
          }
          
          return updatedPhase;
        }
        return phase;
      })
    }));
  }, []);

  const addTreatment = useCallback((phaseId) => {
    setQuote(prev => {
      const phase = prev.phases.find(p => p.id === phaseId);
      if (!phase) return prev;
      
      const newTreatment = {
        id: Date.now(),
        name: 'Nouveau traitement',
        doctor: phase.doctor || null, // Utiliser le médecin de la phase ou null
        fees: 0,
        unitCost: 0,
        quantity: 1,
        sessions: 1,
        teeth: '',
        category: 'Général',
        isEditing: false,
        hasCustomDoctor: false
      };
      
      return {
        ...prev,
        phases: prev.phases.map(p =>
          p.id === phaseId
            ? { ...p, treatments: [...p.treatments, newTreatment] }
            : p
        )
      };
    });
  }, []);

  const removeTreatment = useCallback((phaseId, treatmentId) => {
    setQuote(prev => ({
      ...prev,
      phases: prev.phases.map(phase =>
        phase.id === phaseId
          ? { ...phase, treatments: phase.treatments.filter(t => t.id !== treatmentId) }
          : phase
      )
    }));
  }, []);

  // Fonction pour dupliquer un traitement
  const duplicateTreatment = useCallback((phaseId, treatmentId) => {
    setQuote(prev => {
      const phase = prev.phases.find(p => p.id === phaseId);
      const treatment = phase?.treatments.find(t => t.id === treatmentId);
      
      if (treatment) {
        const duplicatedTreatment = {
          ...treatment,
          id: Date.now().toString(), // Nouvel ID unique
          name: `${treatment.name} (copie)`
        };
        
        return {
          ...prev,
          phases: prev.phases.map(p =>
            p.id === phaseId
              ? { ...p, treatments: [...p.treatments, duplicatedTreatment] }
              : p
          )
        };
      }
      return prev;
    });
  }, []);

  const updateTreatment = useCallback((phaseId, treatmentId, field, value) => {
    setQuote(prevQuote => ({
      ...prevQuote,
      phases: prevQuote.phases.map(phase =>
        phase.id === phaseId
          ? {
              ...phase,
              treatments: phase.treatments.map(treatment => {
                if (treatment.id === treatmentId) {
                  const updatedTreatment = { ...treatment, [field]: value };
                  
                  // Gérer la sélection/désélection du médecin
                  if (field === 'doctor') {
                    if (value === null) {
                      // Désélection : revenir au médecin de la phase
                      updatedTreatment.doctor = phase.doctor;
                      updatedTreatment.hasCustomDoctor = false;
                   } else if (phase.doctor && phase.doctor.id && value.id === phase.doctor.id) {
                     // NULL SAFETY: Vérification complète avant accès à phase.doctor.id
                     // Sélection du médecin de la phase : pas de médecin personnalisé
                      updatedTreatment.hasCustomDoctor = false;
                    } else {
                      // Sélection d'un médecin différent : médecin personnalisé
                      updatedTreatment.hasCustomDoctor = true;
                    }
                  }
                  
                  // Recalculer le prix total si on modifie la quantité ou le prix unitaire
                  if (field === 'quantity') {
                    const newQuantity = parseInt(value) || 1;
                    // Garder le prix unitaire existant et recalculer le total
                    const currentUnitCost = updatedTreatment.unitCost || (updatedTreatment.fees / (updatedTreatment.quantity || 1));
                    updatedTreatment.quantity = newQuantity;
                    updatedTreatment.unitCost = currentUnitCost;
                    updatedTreatment.fees = newQuantity * currentUnitCost;
                  } else if (field === 'unitCost') {
                    const newUnitCost = parseFloat(value) || 0;
                    const currentQuantity = updatedTreatment.quantity || 1;
                    updatedTreatment.unitCost = newUnitCost;
                    updatedTreatment.fees = currentQuantity * newUnitCost;
                  }
                  
                  return updatedTreatment;
                }
                return treatment;
              })
            }
          : phase
      )
    }));
  }, []);

  // Fonction pour déplacer un traitement entre phases
  const moveTreatmentBetweenPhases = useCallback((sourcePhaseId, targetPhaseId, treatmentId, targetIndex = -1) => {
    console.log('🔄 Déplacement entre phases:', {
      sourcePhaseId,
      targetPhaseId,
      treatmentId,
      targetIndex
    });

    setQuote(prev => {
      const sourcePhase = prev.phases.find(p => p.id === sourcePhaseId);
      const targetPhase = prev.phases.find(p => p.id === targetPhaseId);
      const treatment = sourcePhase?.treatments.find(t => t.id === treatmentId);

      if (!sourcePhase || !targetPhase || !treatment) {
        console.error('❌ Phase ou traitement introuvable pour le déplacement');
        return prev;
      }

      // Créer une copie du traitement avec gestion du médecin
      const movedTreatment = {
        ...treatment,
        // Assigner le médecin de la phase cible si pas de médecin personnalisé
        doctor: treatment.hasCustomDoctor ? treatment.doctor : targetPhase.doctor,
        // Réinitialiser hasCustomDoctor si on assigne le médecin de la phase cible
        hasCustomDoctor: treatment.hasCustomDoctor &&
                        targetPhase.doctor &&
                        treatment.doctor?.id !== targetPhase.doctor?.id
      };

      return {
        ...prev,
        phases: prev.phases.map(phase => {
          if (phase.id === sourcePhaseId) {
            // Retirer le traitement de la phase source
            return {
              ...phase,
              treatments: phase.treatments.filter(t => t.id !== treatmentId)
            };
          } else if (phase.id === targetPhaseId) {
            // Ajouter le traitement à la phase cible
            const newTreatments = [...phase.treatments];
            const insertIndex = targetIndex >= 0 ? targetIndex : newTreatments.length;
            newTreatments.splice(insertIndex, 0, movedTreatment);
            
            return {
              ...phase,
              treatments: newTreatments
            };
          }
          return phase;
        })
      };
    });
  }, []);

  // Fonction pour déplacer les traitements avec drag & drop
  const moveTreatment = useCallback((phaseId, treatmentId, direction) => {
    setQuote(prev => ({
      ...prev,
      phases: prev.phases.map(phase => {
        if (phase.id !== phaseId) return phase;
        
        const treatmentIndex = phase.treatments.findIndex(t => t.id === treatmentId);
        if (
          (direction === 'up' && treatmentIndex === 0) ||
          (direction === 'down' && treatmentIndex === phase.treatments.length - 1)
        ) {
          return phase;
        }

        const newTreatments = [...phase.treatments];
        const targetIndex = direction === 'up' ? treatmentIndex - 1 : treatmentIndex + 1;
        [newTreatments[treatmentIndex], newTreatments[targetIndex]] = [newTreatments[targetIndex], newTreatments[treatmentIndex]];
        
        return { ...phase, treatments: newTreatments };
      })
    }));
  }, []);

  const toggleTreatmentEdit = useCallback((phaseId, treatmentId) => {
    setQuote(prev => ({
      ...prev,
      phases: prev.phases.map(phase =>
        phase.id === phaseId
          ? {
              ...phase,
              treatments: phase.treatments.map(treatment =>
                treatment.id === treatmentId
                  ? { ...treatment, isEditing: !treatment.isEditing }
                  : treatment
              )
            }
          : phase
      )
    }));
  }, []);

  // Calcul du coût total avec useMemo
  const totalCost = useMemo(() => {
    if (!quote) return 0;
    return quote?.phases?.reduce((total, phase) => {
      return total + phase.treatments.reduce((phaseTotal, treatment) => {
        return phaseTotal + (treatment.fees || 0);
      }, 0);
    }, 0);
  }, [quote?.phases]);

  // Calcul du coût par phase avec useCallback
  const getPhaseCost = useCallback((phase) => {
    return phase.treatments.reduce((total, treatment) => {
      return total + (treatment.fees || 0);
    }, 0);
  }, []);

  // Fonction pour obtenir les médecins disponibles pour une phase donnée avec useCallback
  const getAvailableDoctorsForPhase = useCallback((phaseIndex) => {
    const phaseNumber = phaseIndex + 1;
    return doctors.filter(doctor =>
      doctor.treatmentPhases.includes(phaseNumber)
    );
  }, [doctors]);

  // Calculs memoizés pour les prix
  const discountAmount = useMemo(() => {
    if (!quote) return 0;
    return quote?.discountType === 'percentage' || !quote?.discountType
      ? (totalCost * (quote?.discountValue || 0)) / 100
      : quote?.discountValue || 0;
  }, [quote?.discountType, quote?.discountValue, totalCost]);

  const finalPrice = useMemo(() => {
    return totalCost - discountAmount;
  }, [totalCost, discountAmount]);

  const advanceAmount = useMemo(() => {
    return (finalPrice * (quote?.advancePercentage || 30)) / 100;
  }, [finalPrice, quote?.advancePercentage]);

  const remainingAmount = useMemo(() => {
    return finalPrice - advanceAmount;
  }, [finalPrice, advanceAmount]);

  const monthlyPaymentAmount = useMemo(() => {
    if (quote?.paymentPlan !== 'multiple') return 0;
    return remainingAmount / (quote?.monthlyPayments || 3);
  }, [remainingAmount, quote?.paymentPlan, quote?.monthlyPayments]);


  // Fonction pour sauvegarder comme brouillon
  const handleSaveDraft = async () => {
    if (!user?.uid) {
      toast('Vous devez être connecté pour sauvegarder un devis');
      return;
    }

    // Validation basique : s'assurer qu'on a un nom de patient
    if (!quote?.patientName?.trim()) {
      toast('Veuillez saisir le nom du patient avant de sauvegarder le devis');
      return;
    }

    try {
      console.log('💾 Sauvegarde du brouillon pour:', quote?.patientName);
      
      // Mapper les données du QuoteEditor vers la structure Firebase
      const quoteData = {
        patientName: quote.patientName,
        basicInfo: {
          date: safeDate(quote.date),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          referringDoctorId: quote.referringDoctor?.id || 'doctor-temp',
          currency: settings?.clinicCurrency || 'EUR'
        },
        patientInfo: {
          healthStatus: quote?.healthStatus || '',
          treatmentSummary: quote?.treatmentSummary || '',
          tags: quote?.tags || []
        },
        phases: quote?.phases?.map(phase => ({
          id: phase.id,
          name: phase.name,
          description: phase.description || '',
          sessions: phase.sessions || 1,
          doctor: phase.doctor || null, // ✅ Sauvegarder le médecin de la phase
          treatments: phase.treatments.map(treatment => ({
            id: treatment.id,
            name: treatment.name,
            doctor: treatment.doctor || null, // ✅ Sauvegarder le médecin du traitement
            fees: treatment.fees || 0,
            unitCost: treatment.unitCost || treatment.fees,
            quantity: treatment.quantity || 1,
            sessions: treatment.sessions || 1,
            teeth: treatment.teeth || '',
            category: treatment.category || 'Général',
            hasCustomDoctor: treatment.hasCustomDoctor || false // ✅ Sauvegarder le flag de médecin personnalisé
          }))
        })),
        pricing: {
          discountType: quote?.discountType || 'percentage',
          discountValue: quote?.discountValue || 0,
          paymentPlan: {
            type: quote?.paymentPlan || 'single',
            advancePercentage: quote?.advancePercentage || 30,
            advanceDate: safeDate(quote?.advanceDate),
            monthlyPayments: quote?.monthlyPayments || 3,
            firstPaymentDate: safeDate(quote?.firstPaymentDate),
            paymentMethod: quote?.paymentMethod || 'cash'
          }
        },
        status: 'brouillon' // Marquer comme brouillon
      };

      let savedQuote;
      
      // ✅ CORRECTION: Utiliser updateQuote si on édite un devis existant
      if (editingQuoteId) {
        console.log('🔄 Mise à jour du devis existant:', editingQuoteId);
        savedQuote = await quotesService.updateQuote(editingQuoteId, quoteData);
        savedQuote.id = editingQuoteId; // S'assurer que l'ID est présent
      } else {
        console.log('➕ Création d\'un nouveau devis');
        savedQuote = await quotesService.addQuote(user.uid, quoteData);
        setEditingQuoteId(savedQuote.id); // Tracker le nouvel ID
        
        // ✅ Redirection automatique vers l'URL du devis créé
        navigate(`/quote-editor/${savedQuote.id}`, { replace: true });
      }
      
      console.log('✅ Brouillon sauvegardé avec succès:', savedQuote);
      toast(`Brouillon ${savedQuote.quoteNumber || 'sans numéro'} sauvegardé avec succès !`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du brouillon:', error);
      toast(`Erreur lors de la sauvegarde: ${error.message}`);
    }
  };

  const handleSendQuote = async () => {
    if (!user?.uid) {
      toast('Vous devez être connecté pour sauvegarder un devis');
      return;
    }

    // Validation basique : s'assurer qu'on a un nom de patient
    if (!quote?.patientName?.trim()) {
      toast('Veuillez saisir le nom du patient avant d\'envoyer le devis');
      return;
    }

    try {
      console.log('📤 Envoi du devis pour:', quote?.patientName);
      
      // Mapper les données du QuoteEditor vers la structure Firebase
      const quoteData = {
        patientName: quote?.patientName || 'Patient',
        basicInfo: {
          date: safeDate(quote?.date),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
          referringDoctorId: quote?.referringDoctor?.id || 'doctor-temp',
          currency: settings?.clinicCurrency || 'EUR'
        },
        patientInfo: {
          healthStatus: quote?.healthStatus || '',
          treatmentSummary: quote?.treatmentSummary || '',
          tags: quote?.tags || []
        },
        phases: quote?.phases?.map(phase => ({
          id: phase.id,
          name: phase.name,
          description: phase.description || '',
          sessions: phase.sessions || 1,
          doctor: phase.doctor || null, // ✅ Sauvegarder le médecin de la phase
          treatments: phase.treatments.map(treatment => ({
            id: treatment.id,
            name: treatment.name,
            doctor: treatment.doctor || null, // ✅ Sauvegarder le médecin du traitement
            fees: treatment.fees || 0,
            unitCost: treatment.unitCost || treatment.fees,
            quantity: treatment.quantity || 1,
            sessions: treatment.sessions || 1,
            teeth: treatment.teeth || '',
            category: treatment.category || 'Général',
            hasCustomDoctor: treatment.hasCustomDoctor || false // ✅ Sauvegarder le flag de médecin personnalisé
          }))
        })),
        pricing: {
          discountType: quote?.discountType || 'percentage',
          discountValue: quote?.discountValue || 0,
          paymentPlan: {
            type: quote?.paymentPlan || 'single',
            advancePercentage: quote?.advancePercentage || 30,
            advanceDate: safeDate(quote?.advanceDate),
            monthlyPayments: quote?.monthlyPayments || 3,
            firstPaymentDate: safeDate(quote?.firstPaymentDate),
            paymentMethod: quote?.paymentMethod || 'cash'
          }
        },
        status: 'envoye' // Marquer comme envoyé
      };

      let savedQuote;
      
      // ✅ CORRECTION: Utiliser updateQuote si on édite un devis existant
      if (editingQuoteId) {
        console.log('🔄 Mise à jour du devis existant:', editingQuoteId);
        savedQuote = await quotesService.updateQuote(editingQuoteId, quoteData);
        savedQuote.id = editingQuoteId; // S'assurer que l'ID est présent
      } else {
        console.log('➕ Création d\'un nouveau devis');
        savedQuote = await quotesService.addQuote(user.uid, quoteData);
        setEditingQuoteId(savedQuote.id); // Tracker le nouvel ID
        
        // ✅ Redirection automatique vers l'URL du devis créé
        navigate(`/quote-editor/${savedQuote.id}`, { replace: true });
      }
      
      console.log('✅ Devis sauvegardé avec succès:', savedQuote);
      toast(`Devis ${savedQuote.quoteNumber} sauvegardé avec succès !`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du devis:', error);
      toast(`Erreur lors de la sauvegarde: ${error.message}`);
    }
  };

  // Cleanup du cache au démontage du composant
  useEffect(() => {
    return () => {
      // Nettoyer le cache pour ce devis au démontage
      if (quoteId && user?.uid && quoteId !== 'new') {
        const cacheKey = `${user.uid}-quote-${quoteId}`;
        quotesCache.delete(cacheKey);
        console.log('🧹 Cache nettoyé pour:', cacheKey);
      }
    };
  }, [quoteId, user?.uid]);

  // 🔍 DIAGNOSTIC AVANCÉ: Tracer l'état de chargement
  console.group('🔍 DIAGNOSTIC - État de chargement QuoteEditor');
  console.log('🩺 doctorsLoading:', doctorsLoading);
  console.log('📋 quote existe:', !!quote);
  console.log('🎬 isStreaming:', isStreaming);
  console.log('⏳ quoteLoading:', quoteLoading);
  console.log('✅ hasCheckedGeminiData:', hasCheckedGeminiData);
  console.log('👥 Nombre de médecins:', doctors.length);
  console.log('📍 QuoteId:', quoteId);
  
  // Analyser la condition de blocage
  const shouldShowLoader = doctorsLoading || (!quote && !isStreaming);
  console.log('🚦 Condition du loader (doctorsLoading || (!quote && !isStreaming)):', shouldShowLoader);
  console.log('  - doctorsLoading:', doctorsLoading);
  console.log('  - !quote:', !quote);
  console.log('  - !isStreaming:', !isStreaming);
  console.log('  - (!quote && !isStreaming):', (!quote && !isStreaming));
  
  if (quote) {
    console.log('📊 Quote summary:');
    console.log('  - patientName:', quote.patientName);
    console.log('  - phases count:', quote.phases?.length || 0);
    console.log('  - referringDoctor:', quote.referringDoctor?.name || 'N/A');
  }
  
  console.groupEnd();

  // Afficher un loader si les données ne sont pas encore prêtes
  if (doctorsLoading || (!quote && !isStreaming)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
          {!quote && <p className="text-xs text-gray-500 mt-2">Initialisation du devis...</p>}
          {doctorsLoading && <p className="text-xs text-gray-500 mt-2">Chargement des médecins...</p>}
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <div>🩺 Médecins: {doctorsLoading ? 'Chargement...' : `${doctors.length} chargés`}</div>
            <div>📋 Devis: {quote ? 'Présent' : 'En attente'}</div>
            <div>🎬 Streaming: {isStreaming ? 'Actif' : 'Inactif'}</div>
            <div>✅ Gemini vérifié: {hasCheckedGeminiData ? 'Oui' : 'Non'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header moderne */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/patients')}
                className="inline-flex items-center gap-x-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Retour aux patients
              </button>
              <div className="ml-6 h-6 w-px bg-gray-300" />
              <div className="ml-6">
                <h1 className="text-xl font-semibold text-gray-900">Édition du devis</h1>
                <p className="text-sm text-gray-500">
                  Créez et personnalisez le devis pour votre patient
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSendQuote}
                variant="default"
                size="lg"
              >
                <DocumentTextIcon className="h-4 w-4" />
                Sauvegarder
              </Button>
              <Button
                onClick={() => toast('Fonctionnalité Créer PDF en cours de développement')}
                variant="secondary"
                size="lg"
              >
                <DocumentArrowUpIcon className="h-4 w-4" />
                Créer PDF
              </Button>
              <Button
                onClick={() => toast('Fonctionnalité Commentaire en cours de développement')}
                variant="outline"
                size="lg"
              >
                <ChatBubbleLeftIcon className="h-4 w-4" />
                Commentaire
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Barre de progression pour le streaming */}
        {isStreaming && (
          <div className="mb-8 bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Analyse du PDF en cours...</h3>
                  <p className="text-sm text-gray-600">
                    {streamingProgress < 20 && "Lecture du document..."}
                    {streamingProgress >= 20 && streamingProgress < 40 && "Extraction des informations patient..."}
                    {streamingProgress >= 40 && streamingProgress < 60 && "Analyse des traitements..."}
                    {streamingProgress >= 60 && streamingProgress < 80 && "Calcul des coûts..."}
                    {streamingProgress >= 80 && "Finalisation du devis..."}
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold text-indigo-600">{streamingProgress}%</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${streamingProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Erreur de streaming */}
        {streamingError && (
          <div className="mb-8 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Erreur lors de l'analyse
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{streamingError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header des informations patient */}
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden mb-8">
          {/* Ligne 1: Nom du patient + Montant final */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserIcon className="h-6 w-6 text-indigo-600" />
                {isStreaming && !quote?.patientName ? (
                  <Skeleton className="h-8 w-48" />
                ) : (
                  <EditablePatientName
                    value={quote?.patientName || 'Patient'}
                    onChange={(value) => setQuote(prev => ({ ...prev, patientName: value }))}
                  />
                )}
              </div>
              
              {/* Montant final du devis */}
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Montant total</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {formatPriceOptimized(finalPrice, currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Ligne 2: Tags dentaires */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <TagIcon className="h-5 w-5 text-gray-500" />
              
              {/* Container des tags avec hover pour révéler le bouton d'ajout */}
              <div className="flex flex-wrap gap-2 flex-1 group">
                {/* Sélecteur de tags - à gauche, invisible si tags présents sauf au hover */}
                <Tags className={`max-w-[250px] ${selectedTags.length > 0 ? 'opacity-0 group-hover:opacity-100' : ''} transition-opacity duration-200`}>
                  <TagsTrigger className="border-dashed border-gray-300 bg-transparent hover:bg-gray-100 h-8">
                    <span className="text-gray-500 text-sm">
                      {selectedTags.length === 0 ? "Ajouter des tags..." : "Ajouter..."}
                    </span>
                  </TagsTrigger>
                  <TagsContent>
                    <TagsInput placeholder="Rechercher un tag..." />
                    <TagsList>
                      <TagsEmpty>Aucun tag trouvé.</TagsEmpty>
                      <TagsGroup>
                        {dentalTags.map((tag) => (
                          <TagsItem key={tag.id} value={tag.id} onSelect={handleSelectTag}>
                            {tag.label}
                            {selectedTags.includes(tag.id) && (
                              <CheckIcon size={14} className="text-muted-foreground" />
                            )}
                          </TagsItem>
                        ))}
                      </TagsGroup>
                    </TagsList>
                  </TagsContent>
                </Tags>
                
                {/* Tags sélectionnés affichés comme pilules colorées */}
                {selectedTags.map((tag) => (
                  <ColoredTagValue
                    key={tag}
                    tag={tag}
                    onRemove={() => handleRemoveTag(tag)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Ligne 3: Date du devis et Médecin référent */}
          <div className="p-6">
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="inline h-4 w-4 mr-2 text-gray-500" />
                  Date du devis
                </label>
                <input
                  type="date"
                  value={quote?.date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setQuote(prev => ({ ...prev, date: e.target.value }))}
                  className="block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-colors"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <p className="text-muted-foreground text-sm flex items-center">
                  <UserIcon className="inline h-4 w-4 mr-2 text-gray-500" />
                  Médecin référent
                </p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={quote?.referringDoctor ? "ghost" : "outline"}
                      role="combobox"
                      disabled={doctors.length === 0}
                      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 w-[200px] justify-start ${
                        quote?.referringDoctor
                          ? "border-0 bg-gray-50 hover:bg-gray-100 text-gray-900"
                          : "border border-dashed border-gray-300 bg-white hover:border-gray-400 text-gray-600"
                      }`}
                    >
                      {quote?.referringDoctor ? (
                        <div className="flex items-center gap-2">
                          {quote.referringDoctor.profileImage ? (
                            <div className="h-4 w-4 rounded-full overflow-hidden border border-gray-300">
                              <img
                                src={quote.referringDoctor.profileImage}
                                alt={quote.referringDoctor.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="bg-indigo-500 text-white text-xs font-medium">
                                {generateFallbackAvatar(quote.referringDoctor.name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="font-medium">Dr. {quote.referringDoctor.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">+ Sélectionner médecin</span>
                      )}
                    </Button>
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
                                console.log('🔍 [REFERRING DOCTOR] Selected:', value);
                                const selectedDoctor = doctors.find(d => d.id === value);
                                if (selectedDoctor) {
                                  // Toggle logic: if already selected, deselect
                                  if (quote?.referringDoctor?.id === selectedDoctor.id) {
                                    console.log('🔍 [REFERRING DOCTOR] Deselecting:', selectedDoctor.name);
                                    setQuote(prev => ({ ...prev, referringDoctor: null }));
                                  } else {
                                    console.log('🔍 [REFERRING DOCTOR] Selecting:', selectedDoctor.name);
                                    setQuote(prev => ({ ...prev, referringDoctor: selectedDoctor }));
                                  }
                                }
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
                              </div>
                              <CheckIcon
                                className={`ml-auto h-4 w-4 text-indigo-600 ${
                                  quote?.referringDoctor?.id === doctor.id ? "opacity-100" : "opacity-0"
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
          </div>
        </div>

        {/* État de santé bucco-dentaire */}
        {isStreaming && !quote?.healthStatus ? (
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <HeartIcon className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-semibold leading-7 text-gray-900">État de santé bucco-dentaire</h2>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <EditableSection
            title="État de santé bucco-dentaire"
            value={quote?.healthStatus || ''}
            onChange={updateHealthStatus}
            placeholder="Décrivez l'état de santé bucco-dentaire actuel du patient..."
            icon={HeartIcon}
          />
        )}

        {/* Résumé du plan de traitement */}
        {isStreaming && !quote?.treatmentSummary ? (
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-semibold leading-7 text-gray-900">Résumé du plan de traitement</h2>
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <EditableSection
            title="Résumé du plan de traitement"
            value={quote?.treatmentSummary || ''}
            onChange={updateTreatmentSummary}
            placeholder="Résumez le plan de traitement proposé..."
            icon={DocumentTextIcon}
          />
        )}

        {/* Phases du traitement */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Phases du traitement</h2>
            <button
              onClick={addPhase}
              className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <PlusIcon className="h-4 w-4" />
              Ajouter une phase
            </button>
          </div>

          {isStreaming && (!quote?.phases || quote?.phases?.length === 0) ? (
            // Skeleton UI pour les phases pendant le streaming
            <>
              {[1, 2, 3].map((index) => (
                <div key={`skeleton-phase-${index}`} className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
                  <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-6 w-48 mb-2" />
                          <Skeleton className="h-4 w-64" />
                        </div>
                      </div>
                      <Skeleton className="w-12 h-12 rounded-full" />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {[1, 2].map((treatmentIndex) => (
                        <div key={`skeleton-treatment-${treatmentIndex}`} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <Skeleton className="h-5 w-48 mb-2" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-6 w-32" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : quote?.phases?.map((phase, phaseIndex) => (
            <div key={phase.id} className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
              {/* En-tête de la phase - Layout horizontal comme l'image */}
              <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                <div className="flex items-center justify-between">
                  {/* Partie gauche : Numéro + Titre + Description */}
                  <div className="flex items-center gap-4 flex-1">
                    {/* Numéro de phase */}
                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {phaseIndex + 1}
                    </div>
                    
                    {/* Contenu principal - Titre et description sur la même ligne */}
                    <div className="flex-1 min-w-0">
                      {/* Titre de la phase */}
                      <EditablePhaseTitle
                        value={phase.name}
                        onChange={(value) => updatePhase(phase.id, 'name', value)}
                        options={phaseOptions}
                      />
                      
                      {/* Description de la phase - directement en dessous */}
                      <div className="mt-1">
                        <EditablePhaseDescription
                          value={phase.description}
                          onChange={(value) => updatePhase(phase.id, 'description', value)}
                          placeholder="Élimination des infections, traitement des caries et assainissement des gencives"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Partie droite : Avatar + Actions */}
                  <div className="flex items-center gap-4">
                    {/* Avatar du médecin - Affiché uniquement si un médecin est sélectionné */}
                    {phase.doctor && (
                      <div className="flex flex-col items-center gap-1">
                        {phase.doctor.profileImage ? (
                          <div className="h-12 w-12 border-2 border-white shadow-sm rounded-full overflow-hidden">
                            <img
                              src={phase.doctor.profileImage}
                              alt={phase.doctor.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-indigo-500 text-white font-semibold text-sm">
                              {generateFallbackAvatar(phase.doctor.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                      </div>
                    )}
                    
                    {/* Bouton supprimer */}
                    <button
                      onClick={() => removePhase(phase.id)}
                      className="rounded-md p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section médecin + séances + prix */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  {/* Médecin assigné - SHADCN POPOVER */}
                  <div className="flex items-center space-x-4">
                    <p className="text-muted-foreground text-sm flex items-center">
                      <UserIcon className="inline h-4 w-4 mr-2 text-gray-500" />
                      Médecin assigné
                    </p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={phase.doctor ? "ghost" : "outline"}
                          role="combobox"
                          disabled={doctors.length === 0}
                          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 w-[200px] justify-start ${
                            phase.doctor
                              ? "border-0 bg-gray-50 hover:bg-gray-100 text-gray-900"
                              : "border border-dashed border-gray-300 bg-white hover:border-gray-400 text-gray-600"
                          }`}
                        >
                          {phase.doctor ? (
                            <div className="flex items-center gap-2">
                              {phase.doctor.profileImage ? (
                                <div className="h-4 w-4 rounded-full overflow-hidden border border-gray-300">
                                  <img
                                    src={phase.doctor.profileImage}
                                    alt={phase.doctor.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="bg-indigo-500 text-white text-xs font-medium">
                                    {generateFallbackAvatar(phase.doctor.name)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <span className="font-medium">Dr. {phase.doctor.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">+ Sélectionner médecin</span>
                          )}
                        </Button>
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
                                    console.log('🔍 [PHASE DOCTOR] Selected:', value);
                                    const selectedDoctor = doctors.find(d => d.id === value);
                                    if (selectedDoctor) {
                                      // Toggle logic: if already selected, deselect
                                      if (phase.doctor?.id === selectedDoctor.id) {
                                        console.log('🔍 [PHASE DOCTOR] Deselecting:', selectedDoctor.name);
                                        updatePhase(phase.id, 'doctor', null);
                                      } else {
                                        console.log('🔍 [PHASE DOCTOR] Selecting:', selectedDoctor.name);
                                        updatePhase(phase.id, 'doctor', selectedDoctor);
                                      }
                                    }
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
                                  </div>
                                  <CheckIcon
                                    className={`ml-auto h-4 w-4 text-indigo-600 ${
                                      phase.doctor?.id === doctor.id ? "opacity-100" : "opacity-0"
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
                  
                  {/* Nombre de séances + Prix */}
                  <div className="flex items-center gap-6">
                    {/* Nombre de séances */}
                    <div className="flex items-center gap-2 group">
                      <CalendarIcon className="h-5 w-5 text-gray-500" />
                      <div className="relative">
                        <span className="text-sm font-medium text-gray-900 group-hover:hidden">
                          {phase.sessions} {phase.sessions === 1 ? 'séance' : 'séances'}
                        </span>
                        <div className="hidden group-hover:flex items-center gap-2">
                          <input
                            type="number"
                            value={phase.sessions}
                            onChange={(e) => updatePhase(phase.id, 'sessions', parseInt(e.target.value) || 1)}
                            className="w-16 text-center rounded-md border-0 py-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                            min="1"
                            max="10"
                          />
                          <span className="text-sm text-gray-600">
                            {phase.sessions === 1 ? 'séance' : 'séances'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Prix */}
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        {formatPriceOptimized(getPhaseCost(phase), currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">

                {/* Traitements */}
                <div className="space-y-3">
                  {phase.treatments.map((treatment, treatmentIndex) => (
                    <div
                      key={treatment.id}
                      className="group bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-lg p-3 hover:shadow-md transition-all duration-200"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', JSON.stringify({
                          phaseId: phase.id,
                          treatmentId: treatment.id,
                          treatmentIndex
                        }));
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                        
                        // 🔍 DIAGNOSTIC: Logs détaillés pour debug du drag & drop
                        console.group('🔍 DIAGNOSTIC - Drag & Drop de traitement');
                        console.log('📍 Source phase ID:', dragData.phaseId);
                        console.log('📍 Target phase ID:', phase.id);
                        console.log('📍 Source treatment index:', dragData.treatmentIndex);
                        console.log('📍 Target treatment index:', treatmentIndex);
                        console.log('📍 Treatment ID:', dragData.treatmentId);
                        console.log('📍 Est même phase?', dragData.phaseId === phase.id);
                        console.log('📍 Est même position?', dragData.treatmentIndex === treatmentIndex);
                        
                        if (dragData.phaseId === phase.id && dragData.treatmentIndex !== treatmentIndex) {
                          // Réorganiser les traitements dans la même phase
                          console.log('✅ Réorganisation dans la même phase');
                          const newTreatments = [...phase.treatments];
                          const [draggedTreatment] = newTreatments.splice(dragData.treatmentIndex, 1);
                          newTreatments.splice(treatmentIndex, 0, draggedTreatment);
                          
                          setQuote(prev => ({
                            ...prev,
                            phases: prev?.phases?.map(p =>
                              p.id === phase.id ? { ...p, treatments: newTreatments } : p
                            )
                          }));
                        } else if (dragData.phaseId !== phase.id) {
                          // ✅ DÉPLACEMENT ENTRE PHASES - Maintenant autorisé
                          console.log('✅ Déplacement entre phases détecté - TRAITEMENT EN COURS');
                          console.log('📍 Source phase:', dragData.phaseId);
                          console.log('📍 Target phase:', phase.id);
                          console.log('📍 Treatment ID:', dragData.treatmentId);
                          console.log('📍 Target index:', treatmentIndex);
                          
                          // Utiliser la fonction moveTreatmentBetweenPhases pour gérer le déplacement
                          moveTreatmentBetweenPhases(
                            dragData.phaseId,
                            phase.id,
                            dragData.treatmentId,
                            treatmentIndex
                          );
                          
                          console.log('✅ Déplacement entre phases terminé avec succès');
                        }
                        
                        console.groupEnd();
                      }}
                    >
                      <div className="flex items-center justify-between">
                        {/* Partie gauche : Poignées + Contenu */}
                        <div className="flex items-center gap-3 flex-1">
                          {/* Poignées de déplacement - visibles au hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex flex-col items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTreatment(phase.id, treatment.id, 'up');
                              }}
                              disabled={treatmentIndex === 0}
                              className={`p-1 rounded ${treatmentIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                            >
                              <ChevronUpIcon className="h-3 w-3" />
                            </button>
                            <Bars3Icon className="h-4 w-4 text-gray-400" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTreatment(phase.id, treatment.id, 'down');
                              }}
                              disabled={treatmentIndex === phase.treatments.length - 1}
                              className={`p-1 rounded ${treatmentIndex === phase.treatments.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                            >
                              <ChevronDownOutlineIcon className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Contenu principal */}
                          <div className="flex-1">
                            {/* Titre du traitement - éditable directement */}
                            <input
                              type="text"
                              value={treatment.name}
                              onChange={(e) => updateTreatment(phase.id, treatment.id, 'name', e.target.value)}
                              className="text-lg font-semibold text-gray-900 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-indigo-300 focus:rounded px-2 py-1 w-full"
                              onClick={(e) => e.stopPropagation()}
                            />
                            
                            {/* Dents concernées - Organisation par quadrant avec couleurs */}
                            {treatment.teeth && (
                              <div className="mt-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-gray-500 font-medium">Dents:</span>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {organizeTeethByQuadrant(treatment.teeth.split(',').map(tooth => tooth.trim()).filter(tooth => tooth)).map((quadrant, quadrantIndex) => (
                                      <div key={quadrant.name} className="flex items-center gap-1">
                                        {quadrantIndex > 0 && (
                                          <span className="text-gray-400 mx-1 text-sm font-bold">|</span>
                                        )}
                                        {quadrant.presentTeeth.map((tooth) => (
                                          <ToothBadge
                                            key={tooth}
                                            tooth={tooth}
                                            taskId={treatment.id}
                                            className={`${quadrant.color} text-xs px-2 py-1 rounded-full border font-medium transition-colors hover:opacity-80`}
                                          />
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Partie droite : Prix et contrôles */}
                        <div className="flex items-center gap-4">
                          {/* Colonnes de prix */}
                          <div className="flex items-center gap-6 text-right">
                            {/* Séances - affichées si > 1 avec couleur différente */}
                            {(treatment.sessions || 1) > 1 && (
                              <div className="text-center min-w-[60px]">
                                <div className="text-xl font-bold text-purple-600">
                                  {treatment.sessions || 1}
                                </div>
                                <div className="text-xs text-purple-500">
                                  {(treatment.sessions || 1) === 1 ? 'Séance' : 'Séances'}
                                </div>
                              </div>
                            )}

                            {/* Quantité - masquée si quantité = 1, visible au hover */}
                            <div className={`text-center min-w-[60px] transition-opacity ${
                              treatment.quantity === 1 ? 'opacity-0 group-hover:opacity-100' : ''
                            }`}>
                              <input
                                type="number"
                                value={treatment.quantity || 1}
                                onChange={(e) => updateTreatment(phase.id, treatment.id, 'quantity', parseInt(e.target.value))}
                                className="text-xl font-bold text-gray-900 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-indigo-300 focus:rounded px-1 py-0.5 w-12 text-center"
                                min="1"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="text-xs text-gray-500">Quantité</div>
                            </div>

                            {/* Prix unitaire - masqué si quantité = 1, visible au hover */}
                            <div className={`text-center min-w-[80px] transition-opacity ${
                              treatment.quantity === 1 ? 'opacity-0 group-hover:opacity-100' : ''
                            }`}>
                              <input
                                type="number"
                                value={treatment.unitCost || (treatment.fees / (treatment.quantity || 1))}
                                onChange={(e) => updateTreatment(phase.id, treatment.id, 'unitCost', parseInt(e.target.value))}
                                className="text-xl font-bold text-gray-900 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-indigo-300 focus:rounded px-1 py-0.5 min-w-[4rem] max-w-[8rem] text-center"
                                style={{ width: `${Math.max(4, String(Math.round(treatment.unitCost || (treatment.fees / (treatment.quantity || 1)))).length + 1)}rem` }}
                                step="1"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="text-xs text-gray-500">Prix unitaire</div>
                            </div>

                            {/* Total - toujours visible */}
                            <div className="text-center min-w-[120px]">
                              <div className="text-xl font-bold text-indigo-600">
                                {formatPriceOptimized(
                                  (treatment.quantity || 1) * (treatment.unitCost || (treatment.fees / (treatment.quantity || 1))),
                                  currency
                                )}
                              </div>
                              <div className="text-xs text-gray-500">Total</div>
                            </div>
                          </div>

                          {/* Menu d'actions */}
                          <div className="flex flex-col items-center gap-1">
                            {/* Icône supprimer - visible au hover */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTreatment(phase.id, treatment.id);
                              }}
                              className="rounded-md p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                              title="Supprimer le traitement"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                            
                            {/* Avatar du médecin ou icône utilisateur */}
                            <ContextMenu>
                              <ContextMenuTrigger asChild>
                                <button
                                  className={
                                    (treatment.doctor && treatment.hasCustomDoctor) ||
                                    (treatment.doctor && phase.doctor && treatment.doctor.id && phase.doctor.id && treatment.doctor.id !== phase.doctor.id)
                                      ? 'w-4 h-4 rounded-full overflow-hidden border border-gray-300 hover:opacity-80 transition-colors'
                                      : 'rounded-md p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 opacity-0 group-hover:opacity-100 transition-colors'
                                  }
                                  title={treatment.doctor ? `Médecin: ${treatment.doctor.name} (cliquer pour changer)` : 'Aucun médecin assigné'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Le menu s'ouvrira automatiquement
                                  }}
                                >
                                  {treatment.doctor ? (
                                    (treatment.hasCustomDoctor) ||
                                    (phase.doctor && treatment.doctor && treatment.doctor.id && phase.doctor.id && treatment.doctor.id !== phase.doctor.id) ? (
                                      treatment.doctor.profileImage ? (
                                        <img
                                          src={treatment.doctor.profileImage}
                                          alt={treatment.doctor.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                                          {generateFallbackAvatar(treatment.doctor.name)}
                                        </div>
                                      )
                                    ) : (
                                      <UserIcon className="h-4 w-4" />
                                    )
                                  ) : (
                                    <UserIcon className="h-4 w-4" />
                                  )}
                                </button>
                              </ContextMenuTrigger>
                              <ContextMenuContent className="w-56">
                                {/* Option de désélection si un médecin personnalisé est sélectionné */}
                                {treatment.hasCustomDoctor && (
                                  <>
                                    <ContextMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateTreatment(phase.id, treatment.id, 'doctor', null);
                                      }}
                                      className="flex items-center gap-3 text-red-600 hover:bg-red-50"
                                    >
                                      <div className="w-6 h-6 border-2 border-red-300 rounded-full flex items-center justify-center">
                                        <XMarkIcon className="h-3 w-3 text-red-500" />
                                      </div>
                                      <div>
                                        <div className="font-medium">Désélectionner</div>
                                        <div className="text-xs text-red-500">Revenir au médecin de la phase</div>
                                      </div>
                                    </ContextMenuItem>
                                    <div className="border-t border-gray-200 my-1"></div>
                                  </>
                                )}
                                
                                {getAvailableDoctorsForPhase(phaseIndex).map((doctor) => (
                                  <ContextMenuItem
                                    key={doctor.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Si le médecin est déjà sélectionné, ne rien faire (le menu se fermera automatiquement)
                                      if (treatment.doctor?.id === doctor.id) {
                                        return;
                                      }
                                      // Sinon, sélectionner le nouveau médecin
                                      updateTreatment(phase.id, treatment.id, 'doctor', doctor);
                                    }}
                                    className={`flex items-center gap-3 ${
                                      treatment.doctor?.id === doctor.id ? 'bg-blue-50 text-blue-700' : ''
                                    }`}
                                  >
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-300">
                                      {doctor.profileImage ? (
                                        <img
                                          src={doctor.profileImage}
                                          alt={doctor.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                                          {generateFallbackAvatar(doctor.name)}
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-medium">{doctor.name}</div>
                                      <div className="text-xs text-gray-500">{doctor.specialty}</div>
                                    </div>
                                    {treatment.doctor?.id === doctor.id && (
                                      <CheckIcon className="ml-auto h-4 w-4" />
                                    )}
                                  </ContextMenuItem>
                                ))}
                              </ContextMenuContent>
                            </ContextMenu>
                            
                            {/* Menu contextuel pour les séances avec range slider - visible au hover */}
                            <ContextMenu>
                              <ContextMenuTrigger asChild>
                                <button
                                  className="rounded-md p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors opacity-0 group-hover:opacity-100"
                                  title={`Séances: ${treatment.sessions || 1}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Le menu s'ouvrira automatiquement
                                  }}
                                >
                                  <CalendarIcon className="h-4 w-4" />
                                </button>
                              </ContextMenuTrigger>
                              <ContextMenuContent className="w-64 p-4" onMouseDown={(e) => e.stopPropagation()}>
                                <div className="space-y-4" onMouseDown={(e) => e.stopPropagation()}>
                                  <div className="text-sm font-medium text-gray-900">
                                    Nombre de séances: {treatment.sessions || 1}
                                  </div>
                                  <div className="space-y-2">
                                    <input
                                      type="range"
                                      min="1"
                                      max="20"
                                      value={treatment.sessions || 1}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        updateTreatment(phase.id, treatment.id, 'sessions', parseInt(e.target.value));
                                      }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onMouseMove={(e) => e.stopPropagation()}
                                      onMouseUp={(e) => e.stopPropagation()}
                                      onTouchStart={(e) => e.stopPropagation()}
                                      onTouchMove={(e) => e.stopPropagation()}
                                      onTouchEnd={(e) => e.stopPropagation()}
                                      onPointerDown={(e) => e.stopPropagation()}
                                      onPointerMove={(e) => e.stopPropagation()}
                                      onPointerUp={(e) => e.stopPropagation()}
                                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                      style={{
                                        background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((treatment.sessions || 1) - 1) / 19 * 100}%, #e5e7eb ${((treatment.sessions || 1) - 1) / 19 * 100}%, #e5e7eb 100%)`
                                      }}
                                    />
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>1</span>
                                      <span>20</span>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-5 gap-1">
                                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15].map((sessionCount) => (
                                      <button
                                        key={sessionCount}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateTreatment(phase.id, treatment.id, 'sessions', sessionCount);
                                        }}
                                        className={`px-2 py-1 text-xs rounded transition-colors ${
                                          (treatment.sessions || 1) === sessionCount
                                            ? 'bg-purple-100 text-purple-700 border border-purple-300'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                      >
                                        {sessionCount}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </ContextMenuContent>
                            </ContextMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addTreatment(phase.id)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <PlusIcon className="inline h-4 w-4 mr-1" />
                    Ajouter un traitement
                  </button>
                </div>

                {/* Total de la phase */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                  <div className="text-right">
                    <span className="text-sm text-gray-500">Total de la phase: </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatPriceOptimized(getPhaseCost(phase), currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Options de Paiement */}
        <div className="mt-8 bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold leading-7 text-gray-900 flex items-center">
              <span className="mr-2">💰</span>
              Options de Paiement
            </h2>
          </div>

          <div className="p-6">
            {/* Résumé des Coûts */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Résumé des Coûts</h3>
              
              <div className="space-y-4">
                {/* Montant Total */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-base text-gray-600">Montant Total</span>
                  <span className="text-xl font-semibold text-gray-900">
                    {formatPriceOptimized(totalCost, currency)}
                  </span>
                </div>

                {/* Remise personnalisée */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-48">
                      <Select
                        value={quote?.discountType || 'percentage'}
                        onValueChange={(value) => {
                          let discountValue = quote?.discountValue || 0;
                          const previousType = quote?.discountType || 'percentage';
                          
                          // Gérer les remises prédéfinies
                          if (value === 'student') {
                            discountValue = 10;
                          } else if (value === 'senior') {
                            discountValue = 15;
                          } else if (value === 'family') {
                            discountValue = 20;
                          } else if (value !== previousType) {
                            // Conversion entre pourcentage et montant fixe
                            if (previousType === 'percentage' && value === 'fixed') {
                              // Convertir le pourcentage en montant fixe
                              discountValue = (totalCost * discountValue) / 100;
                            } else if (previousType === 'fixed' && value === 'percentage') {
                              // Convertir le montant fixe en pourcentage
                              discountValue = totalCost > 0 ? (discountValue / totalCost) * 100 : 0;
                            }
                          }
                          
                          setQuote(prev => ({ ...prev, discountType: value, discountValue }));
                        }}
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Type de remise" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="fixed">Remise fixe</SelectItem>
                          <SelectItem value="percentage">Remise personnalisée</SelectItem>
                          <SelectItem value="student">Remise étudiant (10%)</SelectItem>
                          <SelectItem value="senior">Remise senior (15%)</SelectItem>
                          <SelectItem value="family">Remise famille (20%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={Math.round((quote?.discountValue || 0) * 100) / 100}
                        onChange={(e) => setQuote(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                        className="w-16 text-center rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                        placeholder="0"
                        min="0"
                        max={quote?.discountType === 'percentage' ? 100 : totalCost}
                        step={quote?.discountType === 'percentage' ? "0.1" : "1"}
                      />
                      <span className="text-base text-gray-500 min-w-[20px]">
                        {quote?.discountType === 'percentage' || !quote?.discountType ? '%' : currencySymbol}
                      </span>
                    </div>
                  </div>

                  <span className="text-lg font-medium text-red-600">
                    -{formatPriceOptimized(discountAmount, currency)}
                  </span>
                </div>

                {/* Économie */}
                {(quote?.discountValue || 0) > 0 && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-red-600 font-medium">Économie</span>
                    <span className="text-base font-medium text-red-600">
                      -{formatPriceOptimized(discountAmount, currency)}
                    </span>
                  </div>
                )}

                {/* Prix Final */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Prix Final</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      {formatPriceOptimized(finalPrice, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan de Paiement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Options de paiement */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Plan de Paiement</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <button
                    onClick={() => setQuote(prev => ({ ...prev, paymentPlan: 'single' }))}
                    className={`p-6 rounded-lg border-2 text-center transition-all duration-200 ${
                      quote?.paymentPlan === 'single'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-3xl font-bold mb-2">1×</div>
                    <div className="text-sm font-medium">Paiement unique</div>
                  </button>
                  
                  <button
                    onClick={() => setQuote(prev => ({ ...prev, paymentPlan: 'multiple' }))}
                    className={`p-6 rounded-lg border-2 text-center transition-all duration-200 ${
                      quote?.paymentPlan === 'multiple'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-3xl font-bold mb-2">3×</div>
                    <div className="text-sm font-medium">Paiements multiples</div>
                  </button>
                  
                  <button
                    onClick={() => setQuote(prev => ({ ...prev, paymentPlan: 'appointment' }))}
                    className={`p-6 rounded-lg border-2 text-center transition-all duration-200 ${
                      quote?.paymentPlan === 'appointment'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-2xl mb-2">📅</div>
                    <div className="text-sm font-medium">Par visite</div>
                  </button>
                </div>

                {/* Configuration de l'avance */}
                {(quote?.paymentPlan === 'multiple' || quote?.paymentPlan === 'appointment') && (
                  <div className="space-y-6">
                    {/* Montant à payer */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-base font-semibold text-gray-900 mb-1">Montant à payer</h4>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatPriceOptimized(finalPrice, currency)}
                      </div>
                      <div className="text-sm text-gray-600">💰 Avance</div>
                    </div>

                    {/* Pourcentage d'avance */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Pourcentage à payer en avance: {quote?.advancePercentage || 30}%
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        value={quote?.advancePercentage || 30}
                        onChange={(e) => setQuote(prev => ({ ...prev, advancePercentage: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((quote?.advancePercentage || 30) - 10) / 40 * 100}%, #e5e7eb ${((quote?.advancePercentage || 30) - 10) / 40 * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>10%</span>
                        <span>50%</span>
                      </div>
                    </div>

                    {/* Date de paiement de l'avance */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de paiement de l'avance
                      </label>
                      <input
                        type="date"
                        value={quote?.advanceDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setQuote(prev => ({ ...prev, advanceDate: e.target.value }))}
                        className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                      />
                    </div>

                    {/* Calculs automatiques */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Montant total:</span>
                        <span className="font-medium">
                          {formatPriceOptimized(finalPrice, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avance ({quote?.advancePercentage || 30}%):</span>
                        <span className="font-medium">
                          {formatPriceOptimized(advanceAmount, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-gray-900">Montant restant:</span>
                        <span className="text-gray-900">
                          {formatPriceOptimized(remainingAmount, currency)}
                        </span>
                      </div>
                    </div>

                    {/* Configuration des paiements multiples */}
                    {quote?.paymentPlan === 'multiple' && (
                      <div className="space-y-6 border-t border-gray-200 pt-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Nombre de mensualités: {quote?.monthlyPayments || 3}
                          </label>
                          <input
                            type="range"
                            min="2"
                            max="12"
                            value={quote?.monthlyPayments || 3}
                            onChange={(e) => setQuote(prev => ({ ...prev, monthlyPayments: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            style={{
                              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((quote?.monthlyPayments || 3) - 2) / 10 * 100}%, #e5e7eb ${((quote?.monthlyPayments || 3) - 2) / 10 * 100}%, #e5e7eb 100%)`
                            }}
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>2 mois</span>
                            <span>12 mois</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date de la première mensualité
                          </label>
                          <input
                            type="date"
                            value={quote?.firstPaymentDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            onChange={(e) => setQuote(prev => ({ ...prev, firstPaymentDate: e.target.value }))}
                            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Méthode de paiement */}
                <div className="mt-8">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Méthode de Paiement</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'cash', label: 'Espèces', icon: '💵' },
                      { value: 'check', label: 'Chèques', icon: '📝' },
                      { value: 'transfer', label: 'Virement', icon: '🏦' }
                    ].map((method) => (
                      <button
                        key={method.value}
                        onClick={() => setQuote(prev => ({ ...prev, paymentMethod: method.value }))}
                        className={`p-4 rounded-lg border-2 text-center transition-all duration-200 ${
                          quote?.paymentMethod === method.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="text-2xl mb-2">{method.icon}</div>
                        <div className="text-sm font-medium">{method.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Résumé du Paiement */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Résumé du Paiement</h3>
                
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base text-gray-600">Patient:</span>
                    <span className="text-base font-semibold text-gray-900">{quote?.patientName || 'Patient'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-base text-gray-600">Date:</span>
                    <span className="text-base font-semibold text-gray-900">{new Date(quote?.date || new Date()).toLocaleDateString('fr-FR')}</span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-base text-gray-600">Montant total:</span>
                      <span className="text-xl font-bold text-gray-900">
                        {formatPriceOptimized(finalPrice, currency)}
                      </span>
                    </div>

                    {(quote?.discountValue || 0) > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">
                          Remise {quote?.discountType === 'percentage' || !quote?.discountType ? 'personnalisée' : 'fixe'}: {quote?.discountValue || 0}{quote?.discountType === 'percentage' || !quote?.discountType ? '%' : ` ${currencySymbol}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {(quote?.paymentPlan === 'multiple' || quote?.paymentPlan === 'appointment') && (
                    <div className="border-t border-gray-200 pt-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avance ({quote?.advancePercentage || 30}%):</span>
                        <span className="font-medium">
                          {formatPriceOptimized(advanceAmount, currency)} le {new Date(quote?.advanceDate || quote?.date || new Date()).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Modalités de paiement:</span>
                        <span className="font-medium">
                          {quote?.paymentPlan === 'multiple' ? (
                            <>
                              {quote?.monthlyPayments || 3} mensualités de {formatPriceOptimized(monthlyPaymentAmount, currency)}
                            </>
                          ) : (
                            'Paiement par visite selon planning'
                          )}
                        </span>
                      </div>

                      {/* Détail des mensualités pour paiements multiples */}
                      {quote?.paymentPlan === 'multiple' && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <div className="text-base font-medium text-gray-900 mb-3">Calendrier des paiements:</div>
                          <div className="space-y-2">
                            {(() => {
                              const firstPaymentDate = new Date(quote?.firstPaymentDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
                              
                              // Fonction pour obtenir le terme selon le mode de paiement
                              const getPaymentTerm = (index, paymentMethod) => {
                                const ordinals = ['1er', '2ème', '3ème', '4ème', '5ème', '6ème', '7ème', '8ème', '9ème', '10ème', '11ème', '12ème'];
                                const ordinal = ordinals[index] || `${index + 1}ème`;
                                
                                switch (paymentMethod) {
                                  case 'check':
                                    return `${ordinal} chèque`;
                                  case 'transfer':
                                    return `${ordinal} virement`;
                                  case 'cash':
                                  default:
                                    return `${ordinal} versement`;
                                }
                              };
                              
                              const payments = [];
                              for (let i = 0; i < (quote?.monthlyPayments || 3); i++) {
                                const paymentDate = new Date(firstPaymentDate);
                                paymentDate.setMonth(paymentDate.getMonth() + i);
                                
                                // Format de date "26 Juil. 2025"
                                const formattedDate = paymentDate.toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                });
                                
                                payments.push(
                                  <div key={i} className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-600">
                                      {getPaymentTerm(i, quote?.paymentMethod)}:
                                    </span>
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm text-gray-500">
                                        {formattedDate}
                                      </span>
                                      <span className="text-sm font-medium text-gray-900 min-w-[100px] text-right">
                                        {formatPriceOptimized(monthlyPaymentAmount, currency)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                              return payments;
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Méthode de paiement:</span>
                      <span className="font-medium flex items-center">
                        {quote?.paymentMethod === 'cash' && '💵 Espèces'}
                        {quote?.paymentMethod === 'check' && '📝 Chèques'}
                        {quote?.paymentMethod === 'transfer' && '🏦 Virement'}
                        {!quote?.paymentMethod && '💵 Espèces'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      
    </div>
  );
};

export default QuoteEditor;
