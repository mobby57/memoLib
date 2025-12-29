import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Mail, Clock } from 'lucide-react';

const Analytics = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics');
      return response.json();
    }
  });

  if (isLoading) return <div className="p-8">Loading analytics...</div>;

  const stats = [
    { label: 'Total Emails', value: '1,234', icon: Mail, color: 'blue' },
    { label: 'Active Users', value: '89', icon: Users, color: 'green' },
    { label: 'Avg Response Time', value: '0.8s', icon: Clock, color: 'purple' },
    { label: 'Success Rate', value: '99.2%', icon: TrendingUp, color: 'orange' }
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 text-${stat.color}-500`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Usage Trends</h3>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
            <p className="text-gray-500">Chart placeholder - Email generation over time</p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Popular Templates</h3>
          <div className="space-y-3">
            {['Business Inquiry', 'Follow-up', 'Meeting Request', 'Thank You'].map((template, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>{template}</span>
                <span className="text-sm text-gray-600">{Math.floor(Math.random() * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;