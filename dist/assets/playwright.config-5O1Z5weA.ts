import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for E2E testing of Chrome Extension
 * Tests the extension in real browser environments
 */
export default defineConfig({
  testDir: "./tests/e2e",

  // Skip E2E tests in Jest environment (run separately)
  testMatch: "**/*.spec.ts",
  testIgnore: "**/node_modules/**",

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: "html",

  use: {
    // Base URL for testing
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Extension testing requires specific launch options
        launchOptions: {
          args: [
            `--disable-extensions-except=${process.cwd()}/dist`,
            `--load-extension=${process.cwd()}/dist`,
          ],
        },
      },
    },

    {
      name: "edge",
      use: {
        ...devices["Desktop Edge"],
        channel: "msedge",
        launchOptions: {
          args: [
            `--disable-extensions-except=${process.cwd()}/dist`,
            `--load-extension=${process.cwd()}/dist`,
          ],
        },
      },
    },
  ],
});
