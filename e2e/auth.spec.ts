import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/');
  });

  test('should allow user to sign up with email and password', async ({ page }) => {
    // Navigate to signup page
    await page.click('text=Sign Up');

    // Fill in signup form
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    const password = 'TestPassword123!';

    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="displayName"]', `Test User ${timestamp}`);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to game or show success
    await expect(page).toHaveURL(/\/(play|dashboard)/);
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid email')).toBeVisible();
  });

  test('should show error for password too short', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'short');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/at least 8/i')).toBeVisible();
  });

  test('should allow existing user to sign in', async ({ page }) => {
    // Note: This test assumes there's a test user in the database
    // In a real test environment, you'd create this user in a beforeAll hook

    await page.goto('/signin');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should redirect after successful login
    // Wait for navigation or success indicator
    await page.waitForURL(/\/(play|dashboard)/, { timeout: 5000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/signin');

    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/Invalid|incorrect|not found/i')).toBeVisible();
  });

  test('should persist session after page reload', async ({ page, context }) => {
    // Sign in first
    await page.goto('/signin');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(play|dashboard)/);

    // Reload page
    await page.reload();

    // Should still be logged in (not redirected to signin)
    await expect(page).not.toHaveURL(/signin/);
  });

  test('should allow user to sign out', async ({ page }) => {
    // Sign in first
    await page.goto('/signin');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(play|dashboard)/);

    // Click sign out
    await page.click('text=Sign Out');

    // Should redirect to home or signin
    await expect(page).toHaveURL(/\/(|signin)/);

    // Should not be able to access protected routes
    await page.goto('/play');
    await expect(page).toHaveURL(/signin/);
  });
});

test.describe('Navigation', () => {
  test('should navigate between main pages', async ({ page }) => {
    await page.goto('/');

    // Check main navigation links exist
    await expect(page.locator('a[href="/play"]')).toBeVisible();
    await expect(page.locator('a[href="/leaderboard"]')).toBeVisible();

    // Navigate to leaderboard
    await page.click('a[href="/leaderboard"]');
    await expect(page).toHaveURL('/leaderboard');

    // Navigate to play
    await page.click('a[href="/play"]');
    await expect(page).toHaveURL(/\/(play|signin)/);
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to signin when accessing protected route while logged out', async ({ page }) => {
    await page.goto('/play');
    await expect(page).toHaveURL(/signin/);

    await page.goto('/archive');
    await expect(page).toHaveURL(/signin/);
  });

  test('should allow access to protected routes when logged in', async ({ page }) => {
    // Sign in
    await page.goto('/signin');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Should be able to access play page
    await page.goto('/play');
    await expect(page).toHaveURL('/play');
  });
});
