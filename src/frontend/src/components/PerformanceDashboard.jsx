import React, { useState, useEffect } from 'react';

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4">Loading performance data...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Performance Dashboard</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded text-center">
          <h3 className="font-semibold text-blue-800">CPU Usage</h3>
          <p className="text-2xl text-blue-600">{metrics.cpu_percent?.toFixed(1)}%</p>
        </div>

        <div className="p-4 bg-green-50 rounded text-center">
          <h3 className="font-semibold text-green-800">Memory</h3>
          <p className="text-2xl text-green-600">{metrics.memory_percent?.toFixed(1)}%</p>
        </div>

        <div className="p-4 bg-yellow-50 rounded text-center">
          <h3 className="font-semibold text-yellow-800">Requests</h3>
          <p className="text-2xl text-yellow-600">{metrics.requests || 0}</p>
        </div>

        <div className="p-4 bg-red-50 rounded text-center">
          <h3 className="font-semibold text-red-800">Errors</h3>
          <p className="text-2xl text-red-600">{metrics.errors || 0}</p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">System Info</h3>
        <p>Uptime: {Math.floor(metrics.uptime / 60)} minutes</p>
        <p>Disk Usage: {metrics.disk_percent?.toFixed(1)}%</p>
      </div>
    </div>
  );
};

export default PerformanceDashboard;