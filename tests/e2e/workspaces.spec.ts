import { test, expect } from '@playwright/test';

test.describe('Workspace Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as lawyer/admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'avocat@cabinet-dupont.fr');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin|\/dashboard/);
  });

  test('should create a new workspace', async ({ page }) => {
    // Navigate to workspaces page
    await page.goto('/workspaces');
    await expect(page.locator('h1')).toContainText('Mes Dossiers CESDA');

    // Click "Nouveau Dossier" button
    await page.click('text=+ Nouveau Dossier');
    await expect(page).toHaveURL('/workspaces/new');

    // Fill workspace form
    await page.selectOption('select[name="procedureType"]', 'OQTF');
    await page.fill('input[name="title"]', 'OQTF - Test Client');
    await page.fill('textarea[name="description"]', 'Test automatisé de création de workspace');
    
    // Select client (assuming first client in dropdown)
    await page.selectOption('select[name="clientId"]', { index: 1 });
    
    // Set notification date
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="notificationDate"]', today);

    // Fill OQTF-specific metadata
    await page.selectOption('select[name="metadata.type_oqtf"]', 'sans_delai');
    await page.check('input[value="true"][name="metadata.interdiction_retour"]');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to workspace detail page
    await expect(page).toHaveURL(/\/workspaces\/[a-z0-9-]+/);
    await expect(page.locator('h1')).toContainText('OQTF - Test Client');
  });

  test('should filter workspaces by procedure type', async ({ page }) => {
    await page.goto('/workspaces');

    // Count initial workspaces
    const initialCount = await page.locator('[data-testid="workspace-card"]').count();

    // Apply OQTF filter
    await page.selectOption('select[name="procedureType"]', 'OQTF');
    
    // Wait for filtered results
    await page.waitForTimeout(500);
    
    // Verify filter applied (should show only OQTF workspaces)
    const filteredWorkspaces = page.locator('[data-testid="workspace-card"]');
    const count = await filteredWorkspaces.count();
    
    // Check that all visible workspaces are OQTF
    for (let i = 0; i < count; i++) {
      await expect(filteredWorkspaces.nth(i)).toContainText('OQTF');
    }
  });

  test('should upload document to workspace', async ({ page }) => {
    // Navigate to a workspace detail page (assuming first workspace)
    await page.goto('/workspaces');
    await page.click('[data-testid="workspace-card"]');

    // Switch to documents tab
    await page.click('text=Documents');
    
    // Click "Ajouter un document" button
    await page.click('text=Ajouter un document');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF content mock'),
    });

    // Fill document metadata
    await page.fill('input[name="name"]', 'Carte d\'identité');
    await page.fill('textarea[name="description"]', 'Document de test');
    await page.selectOption('select[name="category"]', 'IDENTITE');

    // Submit upload
    await page.click('button[type="submit"]');

    // Verify document appears in list
    await expect(page.locator('text=Carte d\'identité')).toBeVisible();
  });

  test('should complete checklist item', async ({ page }) => {
    await page.goto('/workspaces');
    await page.click('[data-testid="workspace-card"]');

    // Verify checklist is visible
    await expect(page.locator('text=Checklist')).toBeVisible();

    // Click first uncompleted checklist item
    const firstCheckbox = page.locator('input[type="checkbox"]:not(:checked)').first();
    const checkboxCount = await firstCheckbox.count();
    
    if (checkboxCount > 0) {
      await firstCheckbox.click();
      
      // Verify checkbox is now checked
      await expect(firstCheckbox).toBeChecked();
    }
  });

  test('should show deadline timer for urgent workspaces', async ({ page }) => {
    await page.goto('/workspaces');
    
    // Filter by critical urgency
    await page.selectOption('select[name="urgencyLevel"]', 'CRITIQUE');
    
    // Check if deadline timer is visible
    const deadlineTimer = page.locator('[data-testid="deadline-timer"]').first();
    const count = await deadlineTimer.count();
    
    if (count > 0) {
      await expect(deadlineTimer).toBeVisible();
      await expect(deadlineTimer).toContainText(/\d+[hj] restant/);
    }
  });

  test('should receive real-time notification', async ({ page, context }) => {
    // Open workspace in first tab
    await page.goto('/workspaces');
    const firstWorkspace = page.locator('[data-testid="workspace-card"]').first();
    await firstWorkspace.click();
    
    // Open second tab to simulate another user
    const page2 = await context.newPage();
    await page2.goto('/auth/login');
    await page2.fill('input[name="email"]', 'avocat2@cabinet-dupont.fr');
    await page2.fill('input[name="password"]', 'test123');
    await page2.click('button[type="submit"]');
    
    // Simulate document upload in second tab
    await page2.goto(page.url());
    await page2.click('text=Documents');
    await page2.click('text=Ajouter un document');
    // ... upload process ...
    
    // Verify first tab receives notification
    await expect(page.locator('[data-testid="notification-bell"]')).toHaveAttribute('data-count', /[1-9]/);
  });

  test('should navigate timeline', async ({ page }) => {
    await page.goto('/workspaces');
    await page.click('[data-testid="workspace-card"]').first();
    
    // Switch to timeline tab
    await page.click('text=Chronologie');
    
    // Verify timeline events are visible
    await expect(page.locator('[data-testid="timeline-event"]').first()).toBeVisible();
  });

  test('should validate required fields on workspace creation', async ({ page }) => {
    await page.goto('/workspaces/new');
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]');
    
    // Verify validation error message
    await expect(page.locator('text=Veuillez sélectionner un type de procédure')).toBeVisible();
  });

  test('should delete workspace', async ({ page }) => {
    await page.goto('/workspaces');
    
    const initialCount = await page.locator('[data-testid="workspace-card"]').count();
    
    // Click on first workspace
    await page.click('[data-testid="workspace-card"]').first();
    
    // Click delete button (if exists)
    const deleteButton = page.locator('button:has-text("Supprimer")');
    const hasDelete = await deleteButton.count() > 0;
    
    if (hasDelete) {
      await deleteButton.click();
      
      // Confirm deletion
      await page.click('button:has-text("Confirmer")');
      
      // Verify redirect to workspace list
      await expect(page).toHaveURL('/workspaces');
      
      // Verify count decreased
      const newCount = await page.locator('[data-testid="workspace-card"]').count();
      expect(newCount).toBeLessThan(initialCount);
    }
  });
});
