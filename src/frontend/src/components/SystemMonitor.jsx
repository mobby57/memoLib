import React, { useState, useEffect } from 'react';

const SystemMonitor = () => {
  const [status, setStatus] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch status:', error);
      }
    };

    const fetchHealth = async () => {
      try {
        const response = await fetch('/health');
        const data = await response.json();
        setMetrics(prev => ({ ...prev, health: data }));
      } catch (error) {
        console.error('Failed to fetch health:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    fetchHealth();
    
    const interval = setInterval(() => {
      fetchStatus();
      fetchHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4">Loading system status...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">System Monitor</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded">
          <h3 className="font-semibold text-green-800">Service Status</h3>
          <p className="text-green-600">
            {status?.status === 'running' ? '✅ Online' : '❌ Offline'}
          </p>
          <p className="text-sm text-gray-600">Version: {status?.version}</p>
        </div>

        <div className="p-4 bg-blue-50 rounded">
          <h3 className="font-semibold text-blue-800">Health Check</h3>
          <p className="text-blue-600">
            {metrics.health?.status === 'healthy' ? '✅ Healthy' : '⚠️ Issues'}
          </p>
        </div>

        <div className="p-4 bg-purple-50 rounded">
          <h3 className="font-semibold text-purple-800">API Endpoints</h3>
          <p className="text-sm">Legacy: {status?.endpoints?.legacy}</p>
          <p className="text-sm">Workspace: {status?.endpoints?.workspace}</p>
        </div>

        <div className="p-4 bg-yellow-50 rounded">
          <h3 className="font-semibold text-yellow-800">Features</h3>
          <p className="text-sm">
            Workspace API: {status?.workspace_api ? '✅' : '❌'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;