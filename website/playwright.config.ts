import { defineConfig } from "@playwright/test";
const production = process.env.TEST_PRODUCTION === "1";
const port = production ? 4175 : 5173;
export default defineConfig({
  testDir: "./tests",
  testMatch: "experience.spec.ts",
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
    channel: process.env.POURPOUR_BROWSER_CHANNEL,
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
  },
  webServer: {
    command: production
      ? `npm run preview -- --port ${port}`
      : `npm run dev -- --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !production,
  },
});
