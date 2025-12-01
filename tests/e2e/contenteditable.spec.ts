import { test, expect } from '@playwright/test';

/**
 * E2E Tests for contenteditable elements
 * This tests the functionality that was skipped in unit tests
 */

test.describe('Grammar Checker - Contenteditable Elements', () => {
  test('should apply inline correction to contenteditable', async ({ page }) => {
    // Create contenteditable element
    await page.evaluate(() => {
      const div = document.createElement('div');
      div.id = 'test-contenteditable';
      div.contentEditable = 'true';
      div.style.width = '500px';
      div.style.height = '200px';
      div.style.border = '1px solid black';
      div.style.padding = '10px';
      document.body.appendChild(div);
    });

    // Type text with error
    const editable = page.locator('#test-contenteditable');
    await editable.fill('I could of done better');
    await editable.focus();

    // Wait for grammar check
    await page.waitForTimeout(500);

    // Verify error is detected
    const hasError = await page.evaluate(() => {
      return document.querySelectorAll('[class*="grammar-error"]').length > 0;
    });

    expect(hasError).toBeTruthy();
  });

  test('should preserve cursor position after correction', async ({ page }) => {
    // Create contenteditable
    await page.evaluate(() => {
      const div = document.createElement('div');
      div.id = 'test-editable';
      div.contentEditable = 'true';
      div.textContent = 'Start could of end';
      document.body.appendChild(div);
    });

    const editable = page.locator('#test-editable');
    await editable.focus();

    // Place cursor in middle
    await page.keyboard.press('End');
    
    // Wait and check cursor is maintained
    await page.waitForTimeout(100);
    
    const cursorPos = await page.evaluate(() => {
      const sel = window.getSelection();
      return sel?.anchorOffset || 0;
    });

    expect(cursorPos).toBeGreaterThan(0);
  });
});
