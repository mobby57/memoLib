import React, { useState, useEffect } from 'react';

const ActivityTracker = () => {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activities');
        const data = await response.json();
        setActivities(data.activities || []);
        setStats(data.stats || {});
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      }
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">User Activity</h2>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded text-center">
          <h3 className="font-semibold text-blue-800">Active Users</h3>
          <p className="text-2xl text-blue-600">{stats.active_users || 0}</p>
        </div>
        <div className="p-4 bg-green-50 rounded text-center">
          <h3 className="font-semibold text-green-800">Total Sessions</h3>
          <p className="text-2xl text-green-600">{stats.total_sessions || 0}</p>
        </div>
        <div className="p-4 bg-purple-50 rounded text-center">
          <h3 className="font-semibold text-purple-800">Avg Session</h3>
          <p className="text-2xl text-purple-600">{stats.avg_session || '0m'}</p>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        <h3 className="font-semibold mb-2">Recent Activities</h3>
        {activities.map((activity, index) => (
          <div key={index} className="p-2 border-b text-sm">
            <span className="font-medium">{activity.user}</span> - {activity.action}
            <span className="text-gray-500 ml-2">{activity.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTracker;