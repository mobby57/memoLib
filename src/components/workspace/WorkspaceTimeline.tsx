'use client';

/**
 * Timeline Visuelle - Machine à États Workspace
 * Affiche la progression du raisonnement
 */

import { WorkspaceState, WORKSPACE_STATES } from '@/types/workspace-reasoning';

interface WorkspaceTimelineProps {
  currentState: WorkspaceState;
  completedStates: WorkspaceState[];
  onClick?: (state: WorkspaceState) => void;
}

const STATE_ORDER: WorkspaceState[] = [
  'RECEIVED',
  'FACTS_EXTRACTED',
  'CONTEXT_IDENTIFIED',
  'OBLIGATIONS_DEDUCED',
  'MISSING_IDENTIFIED',
  'RISK_EVALUATED',
  'ACTION_PROPOSED',
  'READY_FOR_HUMAN',
];

export function WorkspaceTimeline({ currentState, completedStates, onClick }: WorkspaceTimelineProps) {
  const currentIndex = STATE_ORDER.indexOf(currentState);
  
  return (
    <div className="w-full py-8">
      {/* Timeline horizontale */}
      <div className="relative">
        {/* Ligne de progression */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
            style={{ width: `${(currentIndex / (STATE_ORDER.length - 1)) * 100}%` }}
          />
        </div>
        
        {/* États */}
        <div className="relative flex justify-between">
          {STATE_ORDER.map((state, index) => {
            const stateConfig = WORKSPACE_STATES[state];
            const isCompleted = completedStates.includes(state);
            const isCurrent = state === currentState;
            const isClickable = onClick && index <= currentIndex;
            
            return (
              <button
                key={state}
                onClick={() => isClickable && onClick(state)}
                disabled={!isClickable}
                className={`
                  flex flex-col items-center gap-2 group
                  ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                  transition-all duration-300
                `}
              >
                {/* Cercle d'état */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    text-xl transition-all duration-300 relative z-10
                    ${isCurrent
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-125 ring-4 ring-blue-100'
                      : isCompleted
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-400'
                    }
                    ${isClickable && !isCurrent ? 'hover:scale-110' : ''}
                  `}
                >
                  {stateConfig.icon}
                  
                  {/* Pulse animation pour état actuel */}
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
                  )}
                </div>
                
                {/* Label */}
                <div className="flex flex-col items-center gap-1 max-w-[100px]">
                  <span
                    className={`
                      text-xs font-medium text-center leading-tight
                      ${isCurrent ? 'text-blue-600 font-bold' : isCompleted ? 'text-gray-700' : 'text-gray-400'}
                    `}
                  >
                    {stateConfig.label}
                  </span>
                  
                  {/* Numéro d'étape */}
                  <span className="text-xs text-gray-400">
                    {index + 1}/{STATE_ORDER.length}
                  </span>
                </div>
                
                {/* Tooltip au hover */}
                {isClickable && (
                  <div className="absolute bottom-full mb-2 hidden group-hover:block">
                    <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      Cliquer pour voir les détails
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Indicateur de progression */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
          <span className="text-sm font-medium text-gray-700">
            Progression :
          </span>
          <span className="text-sm font-bold text-blue-600">
            {currentIndex + 1} / {STATE_ORDER.length}
          </span>
          <span className="text-sm text-gray-500">
            ({Math.round(((currentIndex + 1) / STATE_ORDER.length) * 100)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
