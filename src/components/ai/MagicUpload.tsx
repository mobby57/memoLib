'use client';
import { Sparkles } from 'lucide-react';

interface MagicUploadProps {
  typeDossier: string;
  onExtract: (data: any) => void;
}

export function MagicUpload(props: MagicUploadProps) {
  void props;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-indigo-900">
            Extraction IA temporairement désactivée
          </h3>
          <p role="status" className="text-xs text-indigo-700">
            Les documents sensibles ne seront pas envoyés à un service d’IA tant que le traitement
            local n’aura pas été validé.
          </p>
        </div>
      </div>
    </div>
  );
}
