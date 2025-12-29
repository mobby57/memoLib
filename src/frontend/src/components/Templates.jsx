import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Plus } from 'lucide-react';

const Templates = () => {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await fetch('/api/templates');
      return response.json();
    }
  });

  if (isLoading) return <div className="p-8">Loading templates...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <button className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.map((template, index) => (
          <div key={index} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <FileText className="h-8 w-8 text-blue-500" />
              <span className="text-sm text-gray-500">{template.category}</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{template.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Used {template.usage_count} times</span>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Templates;