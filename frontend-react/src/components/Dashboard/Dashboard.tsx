import React from 'react';
import { useWorkspaces } from '../../hooks/useWorkspaces';
import KPICards from './KPICards';
import WorkspaceList from './WorkspaceList';
import Spinner from '../common/Spinner';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { workspaces, loading, error, refetch } = useWorkspaces();

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h2>❌ Erreur</h2>
          <p>{error}</p>
          <button onClick={refetch} className="btn-retry">
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📊 IA Poste Manager</h1>
          <p className="header-subtitle">Gérez vos workspaces intelligemment</p>
        </div>
        <button className="btn-new-workspace">
          ➕ Nouveau Workspace
        </button>
      </header>

      <div className="dashboard-content">
        <KPICards workspaces={workspaces} />
        <WorkspaceList workspaces={workspaces} />
      </div>
    </div>
  );
};

export default Dashboard;
