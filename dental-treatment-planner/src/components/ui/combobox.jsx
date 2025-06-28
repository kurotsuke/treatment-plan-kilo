import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid';

const Combobox = ({ 
  data = [], 
  value, 
  onValueChange, 
  placeholder = "Sélectionner...",
  children,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const comboboxRef = useRef(null);

  const filteredData = data.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedItem = data.find(item => item.value === value);

  // Calculer la position du dropdown
  const updateDropdownPosition = () => {
    if (comboboxRef.current) {
      const rect = comboboxRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const handleSelect = (item) => {
    onValueChange(item.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`} ref={comboboxRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6"
      >
        <span className="block truncate">
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </span>
      </button>

      {isOpen && (
        <div className="fixed z-[9999] max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
             style={{
               top: dropdownPosition.top,
               left: dropdownPosition.left,
               width: dropdownPosition.width
             }}>
          <div className="sticky top-0 z-[9999] bg-white">
            <input
              type="text"
              className="w-full border-0 border-b border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-0 sm:text-sm"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {filteredData.length === 0 ? (
            <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
              Aucun résultat trouvé.
            </div>
          ) : (
            filteredData.map((item) => (
              <div
                key={item.value}
                className={`relative cursor-default select-none py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white ${
                  value === item.value ? 'bg-indigo-600 text-white' : 'text-gray-900'
                }`}
                onClick={() => handleSelect(item)}
              >
                <span className={`block truncate ${value === item.value ? 'font-medium' : 'font-normal'}`}>
                  {item.label}
                </span>
                {value === item.value && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-white">
                    <CheckIcon className="h-5 w-5" />
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Combobox;