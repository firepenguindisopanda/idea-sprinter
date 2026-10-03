import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display the hero section', async ({ page }) => {
    await page.goto('/');
    
    // Check for main heading
    await expect(page.getByRole('heading', { name: /Vague idea in/i })).toBeVisible();
    
    // Check for CTA button
    await expect(page.getByRole('link', { name: /Start a draft/i })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Click on Start a draft
    await page.getByRole('link', { name: /Start a draft/i }).click();
    
    // Should navigate to login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Login Page', () => {
  test('should display Google sign-in button', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check for sign-in button
    await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible();
    
    // Check for card title
    await expect(page.getByText(/Sign in to start drafting/i)).toBeVisible();
  });
});
