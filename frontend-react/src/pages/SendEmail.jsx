import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';

const SendEmail = () => {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    content: ''
  });

  const sendMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => toast.success('Email sent successfully!'),
    onError: () => toast.error('Failed to send email')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMutation.mutate(formData);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Send Email</h1>
      
      <form onSubmit={handleSubmit} className="max-w-2xl bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">To</label>
          <input
            type="email"
            value={formData.to}
            onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
            className="w-full p-3 border rounded-lg"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Subject</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            className="w-full p-3 border rounded-lg"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Content</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            className="w-full p-3 border rounded-lg h-32"
            required
          />
        </div>

        <button
          type="submit"
          disabled={sendMutation.isPending}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Send className="h-5 w-5 mr-2" />
          Send Email
        </button>
      </form>
    </div>
  );
};

export default SendEmail;