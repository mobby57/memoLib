import { useState, useEffect } from 'react';
import { Database, Activity } from 'lucide-react';
import AuthPanel from '../components/AuthPanel';
import WorkspaceManagerV2 from '../components/WorkspaceManagerV2';
import workspaceApi from '../services/workspaceApi';

export default function PostgreSQLDemo() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    // Check if user is already authenticated
    checkAuth();
    checkHealth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = workspaceApi.getToken();
      if (token) {
        const response = await workspaceApi.getCurrentUser();
        setCurrentUser(response.user);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      workspaceApi.clearToken();
    }
  };

  const checkHealth = async () => {
    try {
      const response = await workspaceApi.healthCheck();
      setHealthStatus(response);
    } catch (err) {
      console.error('Health check failed:', err);
    }
  };

  const handleAuthChange = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(!!user);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  IA Poste Manager
                </h1>
                <p className="text-sm text-gray-400">
                  PostgreSQL Backend - API v2
                </p>
              </div>
            </div>

            {/* Health Status */}
            {healthStatus && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg">
                <Activity className={`w-4 h-4 ${
                  healthStatus.status === 'healthy' 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`} />
                <div className="text-sm">
                  <p className="text-gray-300 font-medium">
                    {healthStatus.status === 'healthy' ? 'Opérationnel' : 'Hors ligne'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {healthStatus.database === 'connected' 
                      ? 'DB connectée' 
                      : 'DB déconnectée'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-6">
          {/* Authentication Section */}
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto w-full">
              <AuthPanel onAuthChange={handleAuthChange} />
            </div>
          ) : (
            <>
              {/* User Info Bar */}
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Bienvenue, {currentUser?.username}!
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Gérez vos workspaces avec l'API v2 PostgreSQL
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      workspaceApi.logout();
                      handleAuthChange(null);
                    }}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>

              {/* Workspace Manager */}
              <div className="bg-gray-800 rounded-lg border border-gray-700">
                <WorkspaceManagerV2 />
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center text-sm text-gray-400">
            <p>
              API v2 - PostgreSQL Backend | {healthStatus?.version || 'v2-postgres'}
            </p>
            <p className="mt-2">
              <span className="text-green-400">✓</span> JWT Authentication |{' '}
              <span className="text-green-400">✓</span> Real-time Updates |{' '}
              <span className="text-green-400">✓</span> PostgreSQL Database
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
