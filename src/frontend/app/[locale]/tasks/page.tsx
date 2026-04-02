'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Filter, Search } from 'lucide-react';
import { listTasks, updateTask, type TaskApiItem, type TaskAssignee } from '@/lib/services/tasks-api';

type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done';
type TaskPriority = 'critique' | 'haute' | 'normale';

type TaskItem = {
  id: string;
  title: string;
  dossier: string;
  owner: string;
  dueIn: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId?: string | null;
};

const statusToApi: Record<TaskStatus, 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE'> = {
  todo: 'TODO',
  'in-progress': 'IN_PROGRESS',
  blocked: 'BLOCKED',
  done: 'DONE',
};

const priorityToApi: Record<TaskPriority, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
  normale: 'MEDIUM',
  haute: 'HIGH',
  critique: 'CRITICAL',
};

function normalizeStatus(value: string | null | undefined): TaskStatus {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'in_progress' || normalized === 'in-progress' || normalized === 'doing') return 'in-progress';
  if (normalized === 'blocked') return 'blocked';
  if (normalized === 'done' || normalized === 'completed') return 'done';
  return 'todo';
}

function normalizePriority(value: string | null | undefined): TaskPriority {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'critical' || normalized === 'critique') return 'critique';
  if (normalized === 'high' || normalized === 'haute') return 'haute';
  return 'normale';
}

function toDueIn(value: string | null | undefined): string {
  if (!value) return 'Sans echeance';
  const due = new Date(value);
  if (isNaN(due.getTime())) return 'Sans echeance';

  const diffMs = due.getTime() - Date.now();
  if (diffMs <= 0) return 'Echu';

  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}j`;
}

function toUiTask(task: TaskApiItem): TaskItem {
  return {
    id: task.id,
    title: task.title || 'Tache sans titre',
    dossier: task.case?.numero || task.case?.title || 'Sans dossier',
    owner: task.assignedTo?.name || task.assignedTo?.email || 'Equipe',
    dueIn: toDueIn(task.dueDate),
    status: normalizeStatus(task.status),
    priority: normalizePriority(task.priority),
    assignedToId: task.assignedToId,
  };
}

const statusLabel: Record<TaskStatus, string> = {
  todo: 'A faire',
  'in-progress': 'En cours',
  blocked: 'Bloquee',
  done: 'Terminee',
};

const statusClass: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  blocked: 'bg-rose-100 text-rose-700',
  done: 'bg-emerald-100 text-emerald-700',
};

const priorityClass: Record<TaskPriority, string> = {
  critique: 'bg-rose-100 text-rose-700',
  haute: 'bg-orange-100 text-orange-700',
  normale: 'bg-slate-100 text-slate-700',
};

export default function TasksPage() {
  const [assignees, setAssignees] = useState<TaskAssignee[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | TaskStatus>('all');
  const [priority, setPriority] = useState<'all' | TaskPriority>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'createdAt' | 'priority' | 'status'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await listTasks({
          sortBy,
          sortOrder,
          includeAssignees: true,
        });
        if (!active) return;
        setTasks(response.data.map(toUiTask));
        setAssignees(response.assignees || []);
      } catch (fetchError) {
        if (!active) return;
        const message = fetchError instanceof Error ? fetchError.message : 'Erreur de chargement des taches';
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [sortBy, sortOrder]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus = status === 'all' || task.status === status;
      const matchesPriority = priority === 'all' || task.priority === priority;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        task.dossier.toLowerCase().includes(normalizedQuery) ||
        task.owner.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesPriority && matchesQuery;
    });
  }, [tasks, priority, query, status]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const previous = tasks;
    setSavingTaskId(taskId);
    setError(null);

    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)));

    try {
      await updateTask(taskId, { status: statusToApi[newStatus] });
      setToast('Statut mis a jour');
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : 'Erreur de mise a jour du statut';
      setError(message);
      setTasks(previous);
    } finally {
      setSavingTaskId(null);
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: TaskPriority) => {
    const previous = tasks;
    setSavingTaskId(taskId);
    setError(null);

    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, priority: newPriority } : task)));

    try {
      await updateTask(taskId, { priority: priorityToApi[newPriority] });
      setToast('Priorite mise a jour');
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : 'Erreur de mise a jour de la priorite';
      setError(message);
      setTasks(previous);
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleAssigneeChange = async (taskId: string, assigneeId: string) => {
    const previous = tasks;
    setSavingTaskId(taskId);
    setError(null);

    const assignee = assignees.find((item) => item.id === assigneeId);

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              assignedToId: assigneeId,
              owner: assignee?.name || assignee?.email || 'Equipe',
            }
          : task
      )
    );

    try {
      await updateTask(taskId, { assignedToId: assigneeId });
      setToast('Assignation mise a jour');
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : "Erreur de mise a jour de l'assignation";
      setError(message);
      setTasks(previous);
    } finally {
      setSavingTaskId(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast ? (
        <div role="alert" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          {toast}
        </div>
      ) : null}

      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">File de traitement</h1>
            <p className="text-sm text-slate-500">Priorisez, filtrez et avancez les dossiers en retard</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={14} />
            {filteredTasks.length} tache(s) visible(s)
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[2fr,1fr,1fr,1fr]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
              placeholder="Rechercher par titre, dossier, proprietaire"
            />
          </label>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as 'all' | TaskStatus)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="todo">A faire</option>
            <option value="in-progress">En cours</option>
            <option value="blocked">Bloquee</option>
            <option value="done">Terminee</option>
          </select>

          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as 'all' | TaskPriority)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500"
          >
            <option value="all">Toutes les priorites</option>
            <option value="critique">Critique</option>
            <option value="haute">Haute</option>
            <option value="normale">Normale</option>
          </select>

          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(event) => {
              const [nextSortBy, nextSortOrder] = event.target.value.split(':');
              setSortBy(nextSortBy as 'dueDate' | 'createdAt' | 'priority' | 'status');
              setSortOrder(nextSortOrder as 'asc' | 'desc');
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500"
          >
            <option value="dueDate:asc">Tri: echeance proche</option>
            <option value="dueDate:desc">Tri: echeance lointaine</option>
            <option value="createdAt:desc">Tri: plus recentes</option>
            <option value="priority:desc">Tri: priorite</option>
            <option value="status:asc">Tri: statut</option>
          </select>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center gap-2 border-b border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
          <Filter size={15} />
          Resultats
        </header>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">Chargement des taches...</div>
          ) : error ? (
            <div className="space-y-3 px-6 py-10 text-center">
              <p className="text-sm text-rose-600">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reessayer
              </button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              Aucune tache ne correspond aux filtres en cours.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <article key={task.id} className="grid gap-3 px-6 py-4 md:grid-cols-[2fr,1fr,1fr,1fr] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500">
                    {task.dossier} - {task.owner}
                  </p>
                </div>

                <p className="text-xs font-medium text-slate-600">Echeance: {task.dueIn}</p>

                <div className="space-y-2">
                  <span className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-semibold ${statusClass[task.status]}`}>
                    {statusLabel[task.status]}
                  </span>
                  <select
                    value={task.status}
                    disabled={savingTaskId === task.id}
                    onChange={(event) => handleStatusChange(task.id, event.target.value as TaskStatus)}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60"
                  >
                    <option value="todo">A faire</option>
                    <option value="in-progress">En cours</option>
                    <option value="blocked">Bloquee</option>
                    <option value="done">Terminee</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <span
                    className={`inline-flex w-fit justify-center rounded-full px-2 py-1 text-xs font-semibold uppercase ${priorityClass[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                  <select
                    value={task.priority}
                    disabled={savingTaskId === task.id}
                    onChange={(event) => handlePriorityChange(task.id, event.target.value as TaskPriority)}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60"
                  >
                    <option value="critique">Critique</option>
                    <option value="haute">Haute</option>
                    <option value="normale">Normale</option>
                  </select>
                </div>

                <div>
                  <select
                    value={task.assignedToId || ''}
                    disabled={savingTaskId === task.id || assignees.length === 0}
                    onChange={(event) => handleAssigneeChange(task.id, event.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-60"
                  >
                    <option value="" disabled>
                      Assigne a
                    </option>
                    {assignees.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.name || assignee.email}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
