'use client';

import { useEffect, useMemo, useState } from 'react';

type Task = {
  id: string;
  title: string;
  status: string;
  assignedToId: string | null;
};

type Assignee = {
  id: string;
  name: string;
};

type TasksPayload = {
  data: Task[];
  assignees: Assignee[];
};

const DEFAULT_SORT = 'priority:desc';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [toast, setToast] = useState<string | null>(null);

  const query = useMemo(() => {
    const [sortBy, sortOrder] = sort.split(':');
    return new URLSearchParams({ sortBy, sortOrder }).toString();
  }, [sort]);

  const loadTasks = async (queryString: string) => {
    const response = await fetch(`/api/v1/tasks?${queryString}`);
    if (!response.ok) return;
    const payload = (await response.json()) as TasksPayload;
    setTasks(payload.data ?? []);
    setAssignees(payload.assignees ?? []);
  };

  useEffect(() => {
    void loadTasks(query);
  }, [query]);

  const patchTask = async (id: string, body: Record<string, unknown>, successMessage: string) => {
    const response = await fetch(`/api/v1/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setToast(null);
      return;
    }

    setToast(successMessage);
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Tasks</h1>

      <div>
        <select
          aria-label="tri"
          value={sort}
          onChange={event => {
            const nextSort = event.target.value;
            const [sortBy, sortOrder] = nextSort.split(':');
            const nextQuery = new URLSearchParams({ sortBy, sortOrder }).toString();
            setSort(nextSort);
            void loadTasks(nextQuery);
          }}
        >
          <option value="priority:desc">Tri: Priorite (desc)</option>
          <option value="createdAt:desc">Tri: Date creation (desc)</option>
        </select>
      </div>

      {toast ? <div role="alert">{toast}</div> : null}

      <div className="space-y-3">
        {tasks.map(task => (
          <article key={task.id} className="rounded border p-3">
            <p>{task.title}</p>
            <div className="mt-2 flex gap-2">
              <select
                aria-label={`status-${task.id}`}
                value={task.status.toLowerCase().replace('_', '-')}
                onChange={async event => {
                  const nextStatus = event.target.value;
                  setTasks(previous =>
                    previous.map(current =>
                      current.id === task.id
                        ? { ...current, status: nextStatus.toUpperCase() }
                        : current
                    )
                  );
                  await patchTask(task.id, { status: nextStatus }, 'Statut mis a jour');
                }}
              >
                <option value="todo">A faire</option>
                <option value="in-progress">En cours</option>
                <option value="done">Terminee</option>
              </select>

              <select
                aria-label={`assignee-${task.id}`}
                value={task.assignedToId ?? ''}
                onChange={async event => {
                  const assignedToId = event.target.value || null;
                  setTasks(previous =>
                    previous.map(current =>
                      current.id === task.id ? { ...current, assignedToId } : current
                    )
                  );
                  await patchTask(task.id, { assignedToId }, 'Assignation mise a jour');
                }}
              >
                <option value="">Non assigne</option>
                {assignees.map(assignee => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </option>
                ))}
              </select>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
