import { defineConfig } from "@playwright/test";

// Smoke tests run against a production build (`npm run check` builds first) in the
// locally installed Chrome, so no browser download is needed. Port 3200 keeps them off a
// running `next dev` on 3000, which reuseExistingServer would otherwise pick up.
export default defineConfig({
  testDir: "tests",
  use: { baseURL: "http://localhost:3200", channel: "chrome" },
  webServer: {
    command: "npm run start -- -p 3200",
    url: "http://localhost:3200",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
