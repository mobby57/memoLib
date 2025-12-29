import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, Clock } from 'lucide-react';

const History = () => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const response = await fetch('/api/history');
      return response.json();
    }
  });

  if (isLoading) return <div className="p-8">Loading history...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Email History</h1>
      
      <div className="bg-white rounded-lg shadow">
        {history?.map((item, index) => (
          <div key={index} className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-blue-500 mr-3" />
              <div>
                <p className="font-medium">{item.subject || 'Email sent'}</p>
                <p className="text-sm text-gray-600">{item.to || 'recipient@example.com'}</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              {item.date || '2024-01-15'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;