import React from 'react';
import WorkspaceLayout from '../components/WorkspaceLayout';

const Analytics = () => {
  return (
    <WorkspaceLayout currentPage="analytics">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Statistiques et performances</p>
      </div>
      
      <div className="workspace-card">
        <h3 className="card-title">Tableau de bord Analytics</h3>
        <p>Page en cours de développement...</p>
      </div>
    </WorkspaceLayout>
  );
};

export default Analytics;