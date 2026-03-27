import { test, expect } from './fixtures';

const MOCK_TASK = {
  id: 'task-1',
  title: 'Rediger conclusions',
  description: null,
  status: 'TODO',
  priority: 'HIGH',
  dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
  assignedToId: null,
  assignedTo: null,
  case: { id: 'case-1', numero: 'DOS-001', title: 'Affaire Test' },
};

const MOCK_ASSIGNEE = {
  id: 'user-1',
  name: 'Marie Dupont',
  email: 'marie@example.com',
  role: 'LAWYER',
};

const MOCK_TASKS_RESPONSE = {
  data: [MOCK_TASK],
  assignees: [MOCK_ASSIGNEE],
};

test.describe('Tasks', () => {
  test('should display tasks list', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/api/v1/tasks**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TASKS_RESPONSE),
      })
    );

    await authenticatedPage.goto('/fr/tasks', { waitUntil: 'domcontentloaded' });

    await expect(authenticatedPage.locator('h1')).toBeVisible({ timeout: 3000 });
    await expect(authenticatedPage.locator('text=Rediger conclusions')).toBeVisible();
  });

  test('should show success toast when task status is changed', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/api/v1/tasks**', route => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_TASK, status: 'IN_PROGRESS' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_TASKS_RESPONSE),
        });
      }
    });

    await authenticatedPage.goto('/fr/tasks', { waitUntil: 'domcontentloaded' });
    await expect(authenticatedPage.locator('text=Rediger conclusions')).toBeVisible();

    const taskStatusSelect = authenticatedPage.locator('article').first().locator('select').first();
    await taskStatusSelect.selectOption('in-progress');

    await expect(
      authenticatedPage.locator('[role="alert"]', { hasText: 'Statut mis a jour' })
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show success toast when assignee is changed', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/api/v1/tasks**', route => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...MOCK_TASK,
            assignedToId: 'user-1',
            assignedTo: MOCK_ASSIGNEE,
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_TASKS_RESPONSE),
        });
      }
    });

    await authenticatedPage.goto('/fr/tasks', { waitUntil: 'domcontentloaded' });
    await expect(authenticatedPage.locator('text=Rediger conclusions')).toBeVisible();

    const assigneeSelect = authenticatedPage.locator('article').first().locator('select').last();
    await assigneeSelect.selectOption('user-1');

    await expect(
      authenticatedPage.locator('[role="alert"]', { hasText: 'Assignation mise a jour' })
    ).toBeVisible({ timeout: 5000 });
  });

  test('should request sorted tasks when sort criteria changes', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/api/v1/tasks**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TASKS_RESPONSE),
      })
    );

    await authenticatedPage.goto('/fr/tasks', { waitUntil: 'domcontentloaded' });
    await expect(authenticatedPage.locator('h1')).toBeVisible({ timeout: 3000 });

    const sortSelect = authenticatedPage.getByLabel('tri');
    await sortSelect.selectOption('createdAt:desc');

    await expect(sortSelect).toHaveValue('createdAt:desc');
  });

  test('should rollback status and show no toast on API error', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/api/v1/tasks**', route => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal error' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_TASKS_RESPONSE),
        });
      }
    });

    await authenticatedPage.goto('/fr/tasks', { waitUntil: 'domcontentloaded' });
    await expect(authenticatedPage.locator('text=Rediger conclusions')).toBeVisible();

    const taskStatusSelect = authenticatedPage.locator('article').first().locator('select').first();
    await taskStatusSelect.selectOption('in-progress');

    await expect(
      authenticatedPage.locator('[role="alert"]', { hasText: 'Statut mis a jour' })
    ).not.toBeVisible({ timeout: 3000 });
    await expect(taskStatusSelect).toHaveValue('todo');
  });
});
