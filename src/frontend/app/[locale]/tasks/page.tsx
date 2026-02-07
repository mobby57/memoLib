'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/tasks');
      const data = await response.json();
      setTasks(data.data || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  const priorityColors: Record<string, string> = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tâches</h1>
          <p className="text-slate-600 mt-1">Gérez vos tâches</p>
        </div>
        <Button>
          <Plus size={20} className="mr-2" />
          Nouvelle Tâche
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-blue-600" size={32} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 py-12 text-center">
          <p className="text-slate-600">Aucune tâche</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <button className="text-slate-400 hover:text-blue-600 transition-colors">
                  <CheckCircle2 size={24} />
                </button>
                <div>
                  <h3 className="font-medium text-slate-900">{task.title}</h3>
                  <p className="text-sm text-slate-600">
                    Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority] || 'bg-slate-100 text-slate-800'}`}>
                  {task.priority}
                </span>
                <Button variant="ghost" size="sm">
                  <Trash2 size={16} className="text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
