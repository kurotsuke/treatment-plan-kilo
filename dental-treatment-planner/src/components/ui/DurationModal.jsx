'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { ClockIcon } from '@heroicons/react/24/outline'

export default function DurationModal({ open, onClose, currentDuration, onSave, procedureName, currentDurationType }) {
  const [duration, setDuration] = useState(currentDuration || 1)
  const [durationType, setDurationType] = useState(currentDurationType || 'jour')

  // Mettre à jour les valeurs quand le modal s'ouvre avec de nouvelles données
  useEffect(() => {
    if (open) {
      setDuration(currentDuration || 1)
      setDurationType(currentDurationType || 'jour')
    }
  }, [open, currentDuration, currentDurationType])

  const handleDurationTypeChange = (newType) => {
    console.log('handleDurationTypeChange appelée:', { newType, durationType, duration })
    if (newType !== durationType) {
      if (newType === 'semaine' && durationType === 'jour') {
        // Conversion jours → semaines (arrondi au plus proche)
        const weeks = Math.round(duration / 7)
        console.log('Conversion jours → semaines:', { duration, weeks })
        setDuration(Math.max(1, weeks))
      } else if (newType === 'jour' && durationType === 'semaine') {
        // Conversion semaines → jours
        const days = duration * 7
        console.log('Conversion semaines → jours:', { duration, days })
        setDuration(Math.min(30, days)) // Limité à 30 jours max
      }
    }
    setDurationType(newType)
  }

  const handleSave = () => {
    onSave(duration, durationType)
    onClose()
  }

  const handleCancel = () => {
    setDuration(currentDuration || 1)
    setDurationType('jour')
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
          >
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:size-10">
                <ClockIcon aria-hidden="true" className="size-6 text-blue-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
                  Modifier la durée
                </DialogTitle>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    Ajustez la durée pour "{procedureName}"
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                        Durée
                      </label>
                      <input
                        type="range"
                        id="duration"
                        min="1"
                        max="30"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1</span>
                        <span className="font-medium">{duration}</span>
                        <span>30</span>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="duration-type" className="block text-sm font-medium text-gray-700 mb-2">
                        Type de durée
                      </label>
                      <select
                        id="duration-type"
                        value={durationType}
                        onChange={(e) => {
                          console.log('Select onChange déclenché:', e.target.value)
                          handleDurationTypeChange(e.target.value)
                        }}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                      >
                        <option value="jour">Jour(s)</option>
                        <option value="semaine">Semaine(s)</option>
                      </select>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-600">
                        Durée totale : <span className="font-medium">{duration} {durationType}{duration > 1 ? 's' : ''}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:ml-10 sm:flex sm:pl-4">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 sm:w-auto"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto"
              >
                Annuler
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}