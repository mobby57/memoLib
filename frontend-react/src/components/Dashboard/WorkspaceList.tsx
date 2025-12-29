import React, { useState } from 'react';
import { Workspace } from '../../types/workspace';
import './WorkspaceList.css';

interface WorkspaceListProps {
  workspaces: Workspace[];
}

const WorkspaceList: React.FC<WorkspaceListProps> = ({ workspaces }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filtrer les workspaces
  const filteredWorkspaces = workspaces.filter(workspace => {
    const matchesStatus = filterStatus === 'all' || workspace.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || workspace.priority === filterPriority;
    const matchesSearch = workspace.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'status-pending' },
      in_progress: { label: 'En cours', className: 'status-in-progress' },
      completed: { label: 'Terminé', className: 'status-completed' }
    };
    return badges[status] || badges.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { label: string; className: string; icon: string }> = {
      low: { label: 'Basse', className: 'priority-low', icon: '⬇️' },
      medium: { label: 'Moyenne', className: 'priority-medium', icon: '➡️' },
      high: { label: 'Haute', className: 'priority-high', icon: '⬆️' },
      urgent: { label: 'Urgente', className: 'priority-urgent', icon: '🔴' }
    };
    return badges[priority] || badges.medium;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="workspace-list">
      <div className="list-header">
        <h2>📋 Workspaces ({filteredWorkspaces.length})</h2>
        
        <div className="filters">
          <input
            type="text"
            placeholder="🔍 Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminés</option>
          </select>
          
          <select 
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value)}
            className="filter-select"
          >
            <option value="all">Toutes priorités</option>
            <option value="urgent">Urgent</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>
        </div>
      </div>

      {filteredWorkspaces.length === 0 ? (
        <div className="empty-state">
          <p>Aucun workspace trouvé</p>
          <button className="btn-primary">+ Créer un workspace</button>
        </div>
      ) : (
        <div className="workspace-grid">
          {filteredWorkspaces.map(workspace => {
            const status = getStatusBadge(workspace.status);
            const priority = getPriorityBadge(workspace.priority);
            
            return (
              <div key={workspace.id} className="workspace-card">
                <div className="card-header">
                  <h3>{workspace.title}</h3>
                  <span className={`badge ${priority.className}`}>
                    {priority.icon} {priority.label}
                  </span>
                </div>
                
                <div className="card-body">
                  <div className="card-meta">
                    <span className={`status-badge ${status.className}`}>
                      {status.label}
                    </span>
                    <span className="card-date">
                      📅 {formatDate(workspace.created_at)}
                    </span>
                  </div>
                  
                  {workspace.completion_percentage !== undefined && (
                    <div className="progress-section">
                      <div className="progress-header">
                        <span>Progression</span>
                        <span className="progress-value">{workspace.completion_percentage}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${workspace.completion_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {workspace.messages_count !== undefined && (
                    <div className="card-footer">
                      <span>💬 {workspace.messages_count} message{workspace.messages_count > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
                
                <div className="card-actions">
                  <button className="btn-secondary">Voir détails</button>
                  <button className="btn-primary">Répondre</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkspaceList;
