const { defineConfig } = require('@playwright/test');

// Health checks must reach the local server even on machines with an HTTP proxy.
const localBypass = [process.env.NO_PROXY, process.env.no_proxy, '127.0.0.1,localhost'].filter(Boolean).join(',');
process.env.NO_PROXY = localBypass;
process.env.no_proxy = localBypass;

module.exports = defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:8766',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-chromium', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'python3 -B server.py --host 127.0.0.1 --port 8766',
    url: 'http://127.0.0.1:8766/api/health',
    reuseExistingServer: false,
  },
});
