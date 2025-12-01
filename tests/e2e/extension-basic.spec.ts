import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Grammar Checker Extension
 * Tests basic functionality in real browser environment
 */

test.describe('Grammar Checker Extension - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a test page
    await page.goto('https://www.google.com');
  });

  test('extension should load successfully', async ({ page, context }) => {
    // Check if extension is loaded
    const extensions = await context.backgroundPages();
    expect(extensions.length).toBeGreaterThan(0);
  });

  test('should detect errors in textarea', async ({ page }) => {
    // Create a test textarea
    await page.evaluate(() => {
      const textarea = document.createElement('textarea');
      textarea.id = 'test-textarea';
      textarea.style.width = '500px';
      textarea.style.height = '200px';
      document.body.appendChild(textarea);
    });

    // Type text with error
    const textarea = page.locator('#test-textarea');
    await textarea.fill('I could of done better');
    await textarea.focus();

    // Wait for grammar check (debounce + analysis)
    await page.waitForTimeout(500);

    // Check if error highlighting appears
    // Note: This depends on your UI implementation
    const hasHighlight = await page.evaluate(() => {
      return document.querySelectorAll('[class*="grammar"]').length > 0;
    });

    expect(hasHighlight).toBeTruthy();
  });
});
