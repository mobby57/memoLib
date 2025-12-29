import React from 'react';
import { Workspace } from '../../types/workspace';
import './KPICards.css';

interface KPICardsProps {
  workspaces: Workspace[];
}

const KPICards: React.FC<KPICardsProps> = ({ workspaces }) => {
  // Calculer les métriques
  const totalWorkspaces = workspaces.length;
  
  const completedWorkspaces = workspaces.filter(w => w.status === 'completed').length;
  const completionRate = totalWorkspaces > 0 
    ? Math.round((completedWorkspaces / totalWorkspaces) * 100) 
    : 0;
  
  const inProgressCount = workspaces.filter(w => w.status === 'in_progress').length;
  
  const urgentCount = workspaces.filter(w => w.priority === 'urgent').length;
  
  const avgCompletion = totalWorkspaces > 0
    ? Math.round(
        workspaces.reduce((sum, w) => sum + (w.completion_percentage || 0), 0) / totalWorkspaces
      )
    : 0;

  const kpis = [
    {
      label: 'Total Workspaces',
      value: totalWorkspaces,
      icon: '📊',
      color: '#1e40af',
      subtitle: `${inProgressCount} en cours`
    },
    {
      label: 'Taux de Complétion',
      value: `${completionRate}%`,
      icon: '✅',
      color: '#059669',
      subtitle: `${completedWorkspaces} terminés`
    },
    {
      label: 'Progression Moyenne',
      value: `${avgCompletion}%`,
      icon: '📈',
      color: '#06b6d4',
      subtitle: 'Sur tous les workspaces'
    },
    {
      label: 'Urgents',
      value: urgentCount,
      icon: '🔴',
      color: urgentCount > 0 ? '#dc2626' : '#6b7280',
      subtitle: urgentCount > 0 ? 'Nécessitent attention' : 'Aucun'
    }
  ];

  return (
    <div className="kpi-cards">
      {kpis.map((kpi, index) => (
        <div key={index} className="kpi-card" style={{ borderTopColor: kpi.color }}>
          <div className="kpi-icon">{kpi.icon}</div>
          <div className="kpi-content">
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value" style={{ color: kpi.color }}>
              {kpi.value}
            </div>
            <div className="kpi-subtitle">{kpi.subtitle}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
