import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, Users, BarChart3, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await fetch('/api/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    refetchInterval: 5000
  });

  const { data: status } = useQuery({
    queryKey: ['status'],
    queryFn: async () => {
      const response = await fetch('/api/status');
      return response.json();
    }
  });

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">IA Poste Manager</h1>
        <p className="text-gray-600">Version {status?.version}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Emails Generated</p>
              <p className="text-2xl font-bold">{metrics?.requests || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">CPU Usage</p>
              <p className="text-2xl font-bold">{metrics?.cpu_percent?.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">System Status</p>
              <p className="text-2xl font-bold text-green-600">Online</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => toast.success('Email generator opened!')}
              className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Generate New Email
            </button>
            <button className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              Manage Templates
            </button>
            <button className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              View Analytics
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Memory Usage</span>
              <span>{metrics?.memory_percent?.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Disk Usage</span>
              <span>{metrics?.disk_percent?.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Uptime</span>
              <span>{Math.floor(metrics?.uptime / 60)} minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;