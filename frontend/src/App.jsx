import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [workspaces, setWorkspaces] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [workspacesRes, templatesRes] = await Promise.all([
        fetch('http://localhost:5000/api/workspaces'),
        fetch('http://localhost:5000/api/templates')
      ]);
      
      const workspacesData = await workspacesRes.json();
      const templatesData = await templatesRes.json();
      
      setWorkspaces(workspacesData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (name, description) => {
    try {
      const response = await fetch('http://localhost:5000/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading IA Poste Manager...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>🚀 IA Poste Manager v2.3</h1>
        <p>MS CONSEILS - Sarra Boudjellal</p>
      </header>

      <nav className="nav-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'workspaces' ? 'active' : ''}
          onClick={() => setActiveTab('workspaces')}
        >
          Workspaces
        </button>
        <button 
          className={activeTab === 'templates' ? 'active' : ''}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
        <button 
          className={activeTab === 'ai' ? 'active' : ''}
          onClick={() => setActiveTab('ai')}
        >
          AI Assistant
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <h2>Dashboard</h2>
            <div className="stats">
              <div className="stat-card">
                <h3>{workspaces.length}</h3>
                <p>Workspaces</p>
              </div>
              <div className="stat-card">
                <h3>{templates.length}</h3>
                <p>Templates</p>
              </div>
              <div className="stat-card">
                <h3>0</h3>
                <p>Campaigns</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workspaces' && (
          <div className="workspaces">
            <h2>Workspaces</h2>
            <button 
              className="create-btn"
              onClick={() => createWorkspace('New Workspace', 'Created from UI')}
            >
              Create Workspace
            </button>
            <div className="workspace-list">
              {workspaces.map(workspace => (
                <div key={workspace.id} className="workspace-card">
                  <h3>{workspace.name}</h3>
                  <p>{workspace.description}</p>
                  <small>Created: {new Date(workspace.created_at).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="templates">
            <h2>Email Templates</h2>
            <div className="template-list">
              {templates.map(template => (
                <div key={template.id} className="template-card">
                  <h3>{template.name}</h3>
                  <p><strong>Subject:</strong> {template.subject}</p>
                  <p>{template.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="ai-assistant">
            <h2>AI Assistant</h2>
            <div className="ai-tools">
              <div className="tool-card">
                <h3>Email Analysis</h3>
                <p>Analyze email content with AI</p>
                <button>Analyze</button>
              </div>
              <div className="tool-card">
                <h3>Content Generation</h3>
                <p>Generate emails with GPT-4</p>
                <button>Generate</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;