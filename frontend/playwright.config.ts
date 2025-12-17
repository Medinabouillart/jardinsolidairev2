// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: false, // ouvre la fenêtre du navigateur
      },
    },
  ],
});
