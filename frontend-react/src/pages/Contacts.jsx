import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Plus } from 'lucide-react';

const Contacts = () => {
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await fetch('/api/contacts');
      return response.json();
    }
  });

  if (isLoading) return <div className="p-8">Loading contacts...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Add Contact
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contacts?.map((contact, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="font-medium">{contact.name || 'Contact Name'}</p>
                <p className="text-sm text-gray-600">{contact.email || 'email@example.com'}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">{contact.company || 'Company'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Contacts;