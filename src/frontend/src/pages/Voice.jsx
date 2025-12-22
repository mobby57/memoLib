import React from 'react';
import { MicrophoneIcon } from '@heroicons/react/24/outline';

export default function Voice() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Assistant Vocal</h1>
        <p className="mt-2 text-gray-600">
          Dictez vos emails avec l'assistant vocal
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <MicrophoneIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Fonctionnalité Vocale
          </h3>
          <p className="mt-2 text-gray-500">
            L'assistant vocal sera disponible prochainement
          </p>
        </div>
      </div>
    </div>
  );
}
