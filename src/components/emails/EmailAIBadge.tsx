'use client';

import { AlertTriangle, Clock, Folder } from 'lucide-react';

interface EmailAIBadgeProps {
  urgency?: string;
  category?: string;
  deadline?: string;
}

const urgencyConfig: Record<string, { label: string; className: string }> = {
  high: { label: 'URGENT', className: 'bg-red-100 text-red-700 border-red-300' },
  critical: { label: 'CRITIQUE', className: 'bg-red-200 text-red-800 border-red-400' },
  medium: { label: 'Normal', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  low: { label: 'Faible', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export function EmailAIBadge({ urgency, category, deadline }: EmailAIBadgeProps) {
  if (!urgency && !category && !deadline) return null;

  const urgencyInfo = urgencyConfig[urgency || 'medium'] || urgencyConfig.medium;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-1">
      {urgency && (urgency === 'high' || urgency === 'critical') && (
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${urgencyInfo.className}`}>
          <AlertTriangle className="w-3 h-3" />
          {urgencyInfo.label}
        </span>
      )}
      {category && (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <Folder className="w-3 h-3" />
          {category}
        </span>
      )}
      {deadline && (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
          <Clock className="w-3 h-3" />
          {deadline}
        </span>
      )}
    </div>
  );
}
