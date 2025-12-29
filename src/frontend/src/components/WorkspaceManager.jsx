import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  FolderIcon, 
  DocumentIcon,
  TrashIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import WorkspaceLayout from './WorkspaceLayout';

const WorkspaceManager = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workspace/');
      const data = await response.json();
      setWorkspaces(data);
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/workspace/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkspace)
      });
      
      if (response.ok) {
        setNewWorkspace({ name: '', description: '' });
        setShowCreateForm(false);
        loadWorkspaces();
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
    }
  };

  const processWorkspace = async (workspaceId) => {
    try {
      await fetch(`/api/workspace/${workspaceId}/process`, {
        method: 'POST'
      });
      loadWorkspaces();
    } catch (error) {
      console.error('Error processing workspace:', error);
    }
  };

  return (
    <WorkspaceLayout currentPage="workspace">
      <div className="page-header">
        <h1 className="page-title">Workspace Manager</h1>
        <p className="page-subtitle">Gérez vos espaces de travail IA</p>
      </div>

      {/* Create Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          <PlusIcon className="w-5 h-5" />
          Nouveau Workspace
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="workspace-card mb-6">
          <form onSubmit={createWorkspace}>
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input
                type="text"
                className="form-input"
                value={newWorkspace.name}
                onChange={(e) => setNewWorkspace({...newWorkspace, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input form-textarea"
                value={newWorkspace.description}
                onChange={(e) => setNewWorkspace({...newWorkspace, description: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                Créer
              </button>
              <button 
                type="button" 
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((workspace) => (
          <div key={workspace.id} className="workspace-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <FolderIcon className="w-8 h-8 text-primary-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{workspace.name}</h3>
                  <p className="text-sm text-gray-600">{workspace.description}</p>
                </div>
              </div>
              <span className={`badge ${
                workspace.status === 'active' ? 'badge-success' : 'badge-warning'
              }`}>
                {workspace.status}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <DocumentIcon className="w-4 h-4" />
                <span>{workspace.files?.length || 0} fichiers</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => processWorkspace(workspace.id)}
                  className="btn btn-success btn-sm"
                >
                  <PlayIcon className="w-4 h-4" />
                </button>
                <button className="btn btn-danger btn-sm">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="spinner"></div>
        </div>
      )}
    </WorkspaceLayout>
  );
};

export default WorkspaceManager;