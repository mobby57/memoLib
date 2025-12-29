import React from 'react';
import WorkspaceLayout from '../components/WorkspaceLayout';

const Settings = () => {
  return (
    <WorkspaceLayout currentPage="settings">
      <div className="page-header">
        <h1 className="page-title">Paramètres</h1>
        <p className="page-subtitle">Configuration de l'application</p>
      </div>
      
      <div className="workspace-card">
        <h3 className="card-title">Configuration</h3>
        <p>Page en cours de développement...</p>
      </div>
    </WorkspaceLayout>
  );
};

export default Settings;